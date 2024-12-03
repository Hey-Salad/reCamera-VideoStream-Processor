<img src="https://raw.githubusercontent.com/Hey-Salad/.github/refs/heads/main/HeySalad%20Logo%20%2B%20Tagline%20Black.svg" alt="HeySalad Logo" width="400"/>

# reCamera VideoStream Processor 🎥

## Powered by Seeedstudio's reCamera 

The reCamera is a groundbreaking open-source AI camera platform by Seeedstudio that's revolutionizing computer vision. 
With 1 TOPS AI performance and 5MP@30FPS video encoding, it's a powerhouse in a tiny package.

### ⚡ Key Features of reCamera

- 🧠 1 TOPS@Int8 AI Performance 
- 📸 5MP @ 30FPS Video Encoding
- 💻 RISC-V SoC Architecture
- 🛠️ Fully Customizable & Programmable 
- 📱 YOLO11 Native Support
- 🔌 Expandable Interfaces
- 🌐 WiFi & Bluetooth Connectivity
- 💾 Up to 64GB Storage

[Learn more about reCamera](https://www.seeedstudio.com/recamera)

## 📁 Project Files

```bash
reCamera-processor/
├── README.md               # Project documentation
├── server.js              # WebSocket server
├── streamToWebSocket.js   # WebSocket handler
├── streamToSenseCap.js    # SenseCap integration
└── mqtt-streamer.py       # MQTT processor
```

## 🚀 Local Development
Environment Setup
Create a .env file in the project root:

```bash
PORT=8080
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
MQTT_BROKER=localhost
MQTT_PORT=1883

```

## Quick Start

```bash
# Install dependencies
npm install
pip install -r requirements.txt

# Start servers
npm run start:server
python mqtt-streamer.py

# Test connections
wscat -c ws://localhost:8080/ws
mosquitto_pub -h localhost -p 1883 -t "device/model/data" -m '{"stream_id":"test"}'

```
## 📚 Documentation & Getting Started

Check out our comprehensive guide on getting started with Node-RED and reCamera:
[HeySalad reCamera Documentation](https://heysalad-io.notion.site/How-to-use-Seeedstudio-reCamera-Documentation-for-HeySalad-rs-1482409b5e7280b2b7c8e802a2ccab80)

## 🔄 Node-RED Flow

![Node-RED Flow]

The flow consists of three main components:
1. Model Node (Input) - Receives AI model data
2. ReCamera SenseCap Video Streamer (Processing)
3. MQTT Out Node (Output) - Publishes to SenseCap

### 🔍 Flow Details

#### 1. Model Node Input Data
```javascript
{
    payload: {
        code: 0,                     // Status code
        data: {
            boxes: [...],            // Bounding box coordinates
            count: 2,                // Number of detections
            image: "base64_data",    // Base64 encoded image
            labels: ["person", ...], // Detection labels
            perf: [...],             // Performance data
            resolution: [640, 480]   // Image resolution
        },
        name: "YOLO",               // Model name
        type: "detection"           // Model type
    }
}
```

## 2. Function Node (Video Stream Processor)

``` javascript
// State tracking
let frameCounter = 0;
let streamId = Date.now();

// Main processing function
msg.payload = {
    frameId: frameCounter++,
    streamId: streamId,
    timestamp: Date.now(),
    data: {
        image: msg.payload.data.image,
        boxes: msg.payload.data.boxes || [],
        count: msg.payload.data.count || 0,
        labels: msg.payload.data.labels || [],
        performance: msg.payload.data.perf || [],
        resolution: msg.payload.data.resolution || []
    }
};

return msg;

```

#### 3. WebSocket Output Data
```javascript
{
    payload: {
        frameId: 1,                 // Sequential frame number
        streamId: 1701234567890,    // Unique stream identifier
        timestamp: 1701234567890,   // Current timestamp
        data: {
            image: "base64_data",   // Processed image
            boxes: [...],           // Detection boxes
            count: 2,               // Object count
            labels: [...],          // Detection labels
            performance: [...],      // Performance metrics
            resolution: [640, 480]   // Image dimensions
        }
    }
}
```
## 🔧 Flow Configuration Tips
- Performance Optimization

- Monitor frame rates for stability
- Watch memory usage with large base64 images
- Consider implementing frame rate limiting


- Error Handling

- Validate all input data fields
- Check image data formatting
- Handle connection interruptions gracefully


- Debugging Guide

- Add debug nodes between components
- Monitor frame counter for dropped frames
- Watch for stream ID changes
- Check connection status

## 📡 WebSocket vs MQTT

### WebSocket
- **Connection**: Full-duplex, persistent TCP connection
- **Use Case**: Real-time, bi-directional communication
- **Best For**: 
  - Live video streaming
  - Interactive applications
  - Browser-based clients
  - Direct client-server communication
- **Features**:
  - Low latency
  - Browser support
  - Stateful connection
  - Raw data streaming

### MQTT
- **Connection**: Publish-subscribe messaging protocol
- **Use Case**: IoT device communication, message broadcasting
- **Best For**:
  - IoT devices
  - Multiple subscribers
  - Limited bandwidth networks
  - Message queuing
- **Features**:
  - Quality of Service levels
  - Message retention
  - Last Will and Testament
  - Topic-based routing

### Why We Use Both
1. **WebSocket for Video**:
   - Direct streaming to web clients
   - Lower latency for real-time viewing
   - Better handling of large data frames

2. **MQTT for Control**:
   - Device management
   - Configuration updates
   - Status broadcasting
   - Data persistence

## 🛠️ Setup Instructions

1. Access Node-RED (typically at `192.168.42.1:1880`)
2. Add a Node function and name it "ReCamera SenseCap Video Streamer"
3. Copy the full code into the "On Message" section
4. Configure MQTT out node with your SenseCap credentials
5. Deploy and monitor the debug output

## ⚠️ Current Challenges

We're working on improving integration. Key areas:
- MQTT connection stability
- Data format validation
- Stream synchronization
- Error handling improvements

## 📝 License

MIT License - Use as is, no liability to the Author and Partners

## ❤️ Support

If you find this code useful, consider buying us a coffee!

<img src="https://github.com/Hey-Salad/.github/blob/a4cbf4a12cca3477fdbfe55520b3fdfe0e0f35a4/buy-me-a-coffee.png" alt="Buy Me A Coffee QR Code" width="200"/>

<a href="https://www.buymeacoffee.com/heysalad"><img src="https://github.com/Hey-Salad/.github/blob/a4cbf4a12cca3477fdbfe55520b3fdfe0e0f35a4/bmc-button.png" alt="Buy Me A Coffee" width="200"/></a>

## 🤝 Contributing

We welcome contributions! Particularly looking for:
- Integration improvements
- Error handling enhancements
- Documentation updates
- Performance optimizations

## 📫 Get in Touch

- Website: [heysalad.io](https://heysalad.io)
- Email: hello@heysalad.io

---
Made with ❤️ by HeySalad