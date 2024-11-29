/**
 * Global tracking variables for stream management
 * 
 * Written by Peter Machona 
 * 
 * for HeySalad & Seeedstudio 29/11/24
 * MIT Licence  
 * use as is - no liability to the Author and Partners
 * This might annoying you , but if you find this code useful please buy me a coffee -> https://buymeacoffee.com/heysalad
 * Thannks in Advance
 * 
 * How to use 
 * 1. Drag out a Node function in Node Red -> Normally 192.168.42.1:1880
 * 2. Attached Node function rename it to "ReCamera SenseCap Video Streamer"
 * 3. Add the code in the "On Message" segement to process the Vision AI data
 * 4. Final look "Model Node" -> "ReCamera SenseCap Video Streamer" -> "MQTT Out Node"
 * 
 */
let frameCounter = 0;
let streamId = Date.now();

/**
 * Processes and formats video stream data from AI model for SenseCAP
 * @param {Object} msg - The input message containing model data
 * @return {Array<Object>} Array of formatted MQTT messages
 */
function processModelStream(msg) {
    // Validate input message
    if (!msg.payload || !msg.payload.data) {
        node.error("Invalid message format: Missing payload or data");
        return null;
    }

    // Extract all model data
    const {
        code,
        data: {
            boxes,
            count,
            image,
            labels,
            perf,
            resolution
        },
        name,
        type
    } = msg.payload;

    // Validate required image data
    if (!image) {
        node.error("No image data found in payload");
        return null;
    }

    // Increment frame counter
    frameCounter++;

    // Remove data URI prefix if present
    const base64Data = image.replace(/^data:image\/jpeg;base64,/, "");

    // Create comprehensive payload with SenseCAP-specific fields
    const modelPayload = {
        stream_id: streamId,
        frame_id: frameCounter,
        username: "your_sensecap_username",  // Replace with actual username
        client_id: "your_client_id",         // Replace with actual client ID
        timestamp: Date.now(),
        timeout: 85000,
        data: base64Data,
        model_data: {
            code,
            boxes: boxes || [],
            detection_count: count,
            labels: labels || [],
            performance: perf || [],
            resolution: resolution || [],
            name,
            type
        }
    };

    console.log(`Processing frame ${frameCounter} with ${count} detections for client ${modelPayload.client_id}`);

    // Return both data and debug messages with SenseCAP topics
    return [
        {
            topic: `sensecap/${modelPayload.username}/model/data`,
            payload: modelPayload,
            qos: 1,
            retain: false
        },
        {
            topic: `sensecap/${modelPayload.username}/model/debug`,
            payload: {
                original: msg.payload,
                processed: modelPayload,
                meta: {
                    frame_count: frameCounter,
                    stream_id: streamId,
                    timestamp: Date.now(),
                    model_name: name,
                    model_type: type,
                    client_id: modelPayload.client_id
                }
            },
            qos: 1,
            retain: false
        }
    ];
}

/**
 * Resets stream tracking variables
 */
function resetStream() {
    frameCounter = 0;
    streamId = Date.now();
}

// Check for stream timeout and reset if needed
if (global.get('lastFrameTime')) {
    const timeSinceLastFrame = Date.now() - global.get('lastFrameTime');
    if (timeSinceLastFrame > 5000) {  // 5 second threshold
        resetStream();
    }
}

// Update last frame timestamp
global.set('lastFrameTime', Date.now());

// Execute main processing
return processModelStream(msg);