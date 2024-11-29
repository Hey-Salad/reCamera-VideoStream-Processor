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

## 📚 Documentation & Getting Started

Check out our comprehensive guide on getting started with Node-RED and reCamera:
[HeySalad reCamera Documentation](https://heysalad-io.notion.site/How-to-use-Seeedstudio-reCamera-Documentation-for-HeySalad-rs-1482409b5e7280b2b7c8e802a2ccab80)

## 🔄 Node-RED Flow

![Node-RED Flow](flow-image-url-here)

The flow consists of three main components:
1. Model Node (Input) - Receives AI model data
2. ReCamera SenseCap Video Streamer (Processing)
3. MQTT Out Node (Output) - Publishes to SenseCap

## 💻 Code Breakdown

### Global Variables
```js

let frameCounter = 0;
let streamId = Date.now();

```

These variables track the stream state and ensure proper frame sequencing.

# Main Processing Function

``` js
function processModelStream(msg) {
    // This core function:
    // - Validates incoming model data
    // - Processes image frames
    // - Formats data for SenseCap
    // - Handles error cases
    // - Generates both data and debug messages
}

```

# Stream Management

``` js

function resetStream() {
    frameCounter = 0;
    streamId = Date.now();
}

```
Manages stream lifecycle and handles timeouts/resets.

# MQTT Message Structure

``` js

const mqttMessage = {
    topic: `sensecap/${modelPayload.username}/model/data`,
    payload: modelPayload,
    qos: 1,
    retain: false
};

```
Formatted specifically for SenseCap's requirements.


## 🛠️ Setup Instructions

1. Access Node-RED (typically at `192.168.42.1:1880`)
2. Add a Node function and name it "ReCamera SenseCap Video Streamer"
3. Copy the full code into the "On Message" section
4. Configure MQTT out node with your SenseCap credentials
5. Deploy and monitor the debug output

## ⚠️ Current Challenges

We're working on improving SenseCap integration. Key areas:
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
- SenseCap integration improvements
- Error handling enhancements
- Documentation updates
- Performance optimizations

## 📫 Get in Touch

- Website: [heysalad.io](https://heysalad.io)
- Email: hello@heysalad.io

---
Made with ❤️ by HeySalad
