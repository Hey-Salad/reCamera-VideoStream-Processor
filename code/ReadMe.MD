<img src="https://raw.githubusercontent.com/Hey-Salad/.github/refs/heads/main/HeySalad%20Logo%20%2B%20Tagline%20Black.svg" alt="HeySalad Logo" width="400"/>

# reCamera VideoStream Processor 🎥

## Powered by Seeedstudio's reCamera

The reCamera is a groundbreaking open-source AI camera platform by Seeedstudio that's revolutionizing computer vision. With 1 TOPS AI performance and 5MP@30FPS video encoding, it's a powerhouse in a tiny package.

### ⚡ Key Features of reCamera

- 🧠 1 TOPS@Int8 AI Performance
- 📸 5MP @ 30FPS Video Encoding
- 💻 RISC-V SoC Architecture
- 🛠️ Fully Customizable & Programmable
- 📱 YOLO11 Native Support
- 🔌 Expandable Interfaces

<video width="100%" controls>
  <source src="https://media-cdn.seeedstudio.com/media/catalog/product/1/-/1-102991896-recamera_2.mp4" type="video/mp4">
</video>

[Learn more about reCamera](https://www.seeedstudio.com/recamera)

## 🚀 About This Project

This repository contains a Node-RED function node for processing video streams from reCamera to SenseCap. It's designed to make vision AI deployment simple and efficient.

### 🔑 Key Features

- 🎯 Real-time video stream processing
- 🤖 AI model data formatting
- 📊 SenseCap integration
- 🔄 Automatic stream management
- 📝 Comprehensive logging

## 🛠️ How to Use

1. Access Node-RED (typically at `192.168.42.1:1880`)
2. Add a Node function and name it "ReCamera SenseCap Video Streamer"
3. Insert the provided code in the "On Message" section
4. Connect nodes: `Model Node -> ReCamera SenseCap Video Streamer -> MQTT Out Node`

## ⚠️ Known Issues

Currently experiencing challenges with SenseCap data transmission. If you have experience with publishing data from reCamera to SenseCap, please contribute!

[View Issue Screenshot](https://github.com/Hey-Salad/reCamera-VideoStream-Processor/blob/2b6ffedf9cbe5625423ec73b3396b9f1ee25ee90/images/Bildschirmfoto%202024-11-29%20um%2006.58.00.png)

## 📝 License

MIT License - Use as is, no liability to the Author and Partners

## ☕ Support

If you find this code useful, consider buying us a coffee!

<img src="https://github.com/Hey-Salad/.github/blob/a4cbf4a12cca3477fdbfe55520b3fdfe0e0f35a4/buy-me-a-coffee.png" alt="Buy Me A Coffee QR Code" width="200"/>

<a href="https://www.buymeacoffee.com/heysalad"><img src="https://github.com/Hey-Salad/.github/blob/a4cbf4a12cca3477fdbfe55520b3fdfe0e0f35a4/bmc-button.png" alt="Buy Me A Coffee" width="200"/></a>

## 🤝 Contributing

We welcome contributions! If you have solutions for SenseCap integration or other improvements, please submit a pull request.

---
Made with 💚 by HeySalad