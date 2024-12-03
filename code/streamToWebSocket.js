/**
 * Video Stream Data Processor for Node-RED
 * 
 * By Peter Machona - for Heysalad & Seeedstudio
 * 
 * 3rd Decemeber 2024, London UK.
 * 
 * This module processes video stream data from AI models and formats it for 
 * WebSocket transmission. It maintains stream state and handles data validation
 * and transformation.
 * 
 * @license MIT
 * @version 1.0.0
 */

/**
 * @typedef {Object} StreamState
 * @property {number} frameCounter - Running count of processed frames
 * @property {number} streamId - Unique identifier for current stream
 * @property {number} lastFrameTime - Timestamp of last processed frame
 */

/**
 * @typedef {Object} VideoData
 * @property {string} image - Base64 encoded image data
 * @property {Array<Object>} boxes - Bounding box coordinates
 * @property {number} count - Number of detections
 * @property {Array<string>} labels - Detection labels
 * @property {Array<Object>} performance - Performance metrics
 * @property {Array<number>} resolution - Image resolution
 */

/**
 * @typedef {Object} WSPayload
 * @property {number} frameId - Sequential frame identifier
 * @property {number} streamId - Stream session identifier
 * @property {number} timestamp - Processing timestamp
 * @property {VideoData} data - Processed video and detection data
 */

/**
 * Initializes or retrieves the global stream state
 * @returns {StreamState} Current stream state
 */
function initializeState() {
    const defaultState = {
        frameCounter: 0,
        streamId: Date.now(),
        lastFrameTime: Date.now()
    };

    return context.global.get('streamState') || defaultState;
}

/**
 * Updates stream state and handles timeouts
 * @param {StreamState} state - Current stream state
 * @returns {StreamState} Updated stream state
 */
function updateStreamState(state) {
    const STREAM_TIMEOUT_MS = 5000; // 5 seconds
    const currentTime = Date.now();
    
    // Check for stream timeout
    if (currentTime - state.lastFrameTime > STREAM_TIMEOUT_MS) {
        state = {
            frameCounter: 0,
            streamId: currentTime,
            lastFrameTime: currentTime
        };
    } else {
        state.frameCounter++;
        state.lastFrameTime = currentTime;
    }
    
    return state;
}

/**
 * Extracts and validates image data
 * @param {string} imageData - Raw image data with potential data URI prefix
 * @returns {string} Clean base64 image data
 */
function processImageData(imageData) {
    if (!imageData) {
        throw new Error('Missing image data');
    }
    return imageData.replace(/^data:image\/jpeg;base64,/, '');
}

/**
 * Formats data for WebSocket transmission
 * @param {Object} payload - Raw input payload
 * @param {StreamState} state - Current stream state
 * @returns {WSPayload} Formatted WebSocket payload
 */
function formatWebSocketData(payload, state) {
    const { data } = payload;
    
    return {
        frameId: state.frameCounter,
        streamId: state.streamId,
        timestamp: Date.now(),
        data: {
            image: processImageData(data.image),
            boxes: data.boxes || [],
            count: data.count || 0,
            labels: data.labels || [],
            performance: data.perf || [],
            resolution: data.resolution || []
        }
    };
}

/**
 * Main processing function for Node-RED
 * @param {Object} msg - Node-RED message object
 * @returns {Object|null} Processed message or null if error
 */
function processMessage(msg) {
    try {
        // Input validation
        if (!msg.payload?.data) {
            throw new Error('Invalid message format: missing payload or data');
        }

        // State management
        let state = initializeState();
        state = updateStreamState(state);
        context.global.set('streamState', state);

        // Data processing
        const wsData = formatWebSocketData(msg.payload, state);
        
        // Logging for monitoring
        node.debug(`Processed frame ${state.frameCounter} for stream ${state.streamId}`);
        
        return {
            ...msg,
            payload: JSON.stringify(wsData)
        };

    } catch (error) {
        node.error(`Processing error: ${error.message}`);
        node.debug(error.stack);
        return null;
    }
}

// Execute main processing
return processMessage(msg);