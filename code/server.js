/**
 * Image Storage WebSocket Service
 * By Peter Machona - for Heysalad & Seeedstudio
 * 
 * 3rd Decemeber 2024, London UK.
 * 
 * A service that receives images via WebSocket and stores them in Supabase and Google Cloud Storage.
 * Implements automatic cleanup and proper error handling.
 */

import express from 'express';
import http from 'http';
import WebSocket from 'ws';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Storage, Bucket } from '@google-cloud/storage';
import fs from 'fs/promises';
import path from 'path';
import { Logger } from './logger';  // Implement your preferred logging solution

// Types for configuration and messages
interface ServiceConfig {
  port: number;
  supabaseUrl: string;
  supabaseKey: string;
  bucketName: string;
  tempDir: string;
}

interface ImageMessage {
  data?: {
    image?: string;
  };
}

interface StorageLocations {
  supabase: string;
  google: string;
}

interface StorageResponse {
  type: 'imageStored' | 'error';
  timestamp?: number;
  filename?: string;
  locations?: StorageLocations;
  message?: string;
}

/**
 * Handles image storage operations across multiple cloud providers.
 */
class ImageStorageService {
  private readonly supabase: SupabaseClient;
  private readonly bucket: Bucket;
  private readonly tempDir: string;
  private readonly logger: Logger;

  constructor(config: ServiceConfig, logger: Logger) {
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
    this.bucket = new Storage().bucket(config.bucketName);
    this.tempDir = config.tempDir;
    this.logger = logger;
  }

  /**
   * Initializes the storage service and ensures required directories exist.
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      this.logger.error('Failed to create temp directory:', error);
      throw new Error('Storage service initialization failed');
    }
  }

  /**
   * Saves an image to both Supabase and Google Cloud Storage.
   * @param base64Data Base64 encoded image data
   * @param timestamp Timestamp for the image filename
   * @returns The filename of the saved image
   */
  async saveImage(base64Data: string, timestamp: number): Promise<string> {
    const base64Image = base64Data.replace(/^data:image\/jpeg;base64,/, '');
    const imageBuffer = Buffer.from(base64Image, 'base64');
    const filename = `frame_${timestamp}.jpg`;
    const tempPath = path.join(this.tempDir, filename);

    try {
      // Save to temporary file
      await fs.writeFile(tempPath, imageBuffer);

      // Upload to both storage providers concurrently
      await Promise.all([
        this.uploadToSupabase(filename, imageBuffer),
        this.uploadToGoogleCloud(tempPath, filename)
      ]);

      this.logger.info(`Image ${filename} uploaded successfully to all providers`);
      return filename;

    } finally {
      // Ensure cleanup regardless of success/failure
      try {
        await fs.unlink(tempPath);
      } catch (error) {
        this.logger.warn(`Failed to clean up temporary file ${tempPath}:`, error);
      }
    }
  }

  private async uploadToSupabase(filename: string, data: Buffer): Promise<void> {
    const { error } = await this.supabase.storage
      .from('videoStreamData')
      .upload(filename, data, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (error) {
      throw new Error(`Supabase upload failed: ${error.message}`);
    }
  }

  private async uploadToGoogleCloud(filepath: string, filename: string): Promise<void> {
    await this.bucket.upload(filepath, {
      destination: filename,
      metadata: {
        contentType: 'image/jpeg'
      }
    });
  }
}

/**
 * WebSocket server that handles real-time image upload requests.
 */
class WebSocketServer {
  private readonly wss: WebSocket.Server;
  private readonly storageService: ImageStorageService;
  private readonly logger: Logger;

  constructor(
    server: http.Server,
    storageService: ImageStorageService,
    logger: Logger
  ) {
    this.wss = new WebSocket.Server({ server, path: '/ws' });
    this.storageService = storageService;
    this.logger = logger;
    this.initialize();
  }

  private initialize(): void {
    this.wss.on('connection', this.handleConnection.bind(this));
  }

  private handleConnection(ws: WebSocket): void {
    this.logger.info('Client connected');

    ws.on('message', (message: string) => this.handleMessage(ws, message));
    ws.on('close', () => this.logger.info('Client disconnected'));
    ws.on('error', (error) => this.logger.error('WebSocket error:', error));
  }

  private async handleMessage(ws: WebSocket, message: string): Promise<void> {
    try {
      const data = JSON.parse(message) as ImageMessage;

      if (!data.data?.image) {
        throw new Error('Invalid message format: missing image data');
      }

      const timestamp = Date.now();
      const filename = await this.storageService.saveImage(data.data.image, timestamp);

      const response: StorageResponse = {
        type: 'imageStored',
        timestamp,
        filename,
        locations: {
          supabase: `videoStreamData/${filename}`,
          google: `storage/${filename}`
        }
      };

      ws.send(JSON.stringify(response));

    } catch (error) {
      this.logger.error('Error processing message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }));
    }
  }
}

/**
 * Main application class that coordinates all components.
 */
class Application {
  private readonly config: ServiceConfig;
  private readonly app: express.Application;
  private readonly server: http.Server;
  private readonly logger: Logger;
  private readonly storageService: ImageStorageService;

  constructor(config: ServiceConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
    this.app = express();
    this.server = http.createServer(this.app);
    this.storageService = new ImageStorageService(config, logger);
  }

  async initialize(): Promise<void> {
    // Initialize storage service
    await this.storageService.initialize();

    // Initialize WebSocket server
    new WebSocketServer(this.server, this.storageService, this.logger);

    // Setup health check endpoint
    this.app.get('/health', (_, res) => {
      res.status(200).json({ status: 'healthy' });
    });
  }

  async start(): Promise<void> {
    await this.initialize();

    this.server.listen(this.config.port, '0.0.0.0', () => {
      this.logger.info(`Server running on port ${this.config.port}`);
    });

    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      this.logger.info('SIGTERM received. Shutting down...');
      this.server.close(() => {
        this.logger.info('Server closed');
        process.exit(0);
      });
    });
  }
}

/**
 * Application entry point.
 */
async function main(): Promise<void> {
  const logger = new Logger();  // Initialize your logger

  try {
    // Load and validate configuration
    const config: ServiceConfig = {
      port: parseInt(process.env.PORT || '8080', 10),
      supabaseUrl: process.env.SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_KEY!,
      bucketName: process.env.BUCKET_NAME || 'stream-data',
      tempDir: path.join(__dirname, 'temp')
    };

    if (!config.supabaseUrl || !config.supabaseKey) {
      throw new Error('Missing required environment variables');
    }

    const app = new Application(config, logger);
    await app.start();

  } catch (error) {
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
}

// Start the application
if (require.main === module) {
  main();
}

export { Application, ImageStorageService, WebSocketServer };