# Smart Traffic Vision AI

A real-time traffic monitoring system using **YOLO v8** and **OpenCV** for object detection, combined with motion analysis and pollution tracking.

## Features

- **Real-time Object Detection**: Detects humans, cars, bikes, trucks, and buses using YOLO v8
- **Motion Detection**: Advanced pixel-based motion analysis with spatial zone detection
- **Pollution Monitoring**: Calculates CO2, NOx, and PM2.5 emissions based on detected vehicles
- **Traffic Analytics**: Real-time congestion analysis and historical data tracking
- **Webcam Integration**: Live video feed processing with bounding box overlays

## Technology Stack

- **Frontend**: React + TypeScript + Vite
- **Computer Vision**: TensorFlow.js + COCO-SSD (YOLO-style detection)
- **Motion Detection**: Custom pixel-difference algorithm
- **UI**: Tailwind CSS with modern dark theme

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Upgrading to Full YOLO v8

The current implementation uses COCO-SSD (a YOLO-style model) for fast browser-based detection. To use the full YOLO v8 model:

### 1. Convert YOLO v8 Model
```bash
# Install tensorflowjs
pip install tensorflowjs

# Convert PyTorch YOLO v8 model to TensorFlow.js
tensorflowjs_converter --input_format=tf_saved_model yolov8_model/ yolov8_web/
```

### 2. Host Model Files
Upload the converted model files to a CDN or serve them locally.

### 3. Update Model Loading
In `services/yoloVisionService.ts`, replace the COCO-SSD loading with:
```typescript
this.model = await tf.loadGraphModel('path/to/yolov8/model.json');
```

### 4. Implement YOLO v8 Post-processing
Add proper bounding box decoding and NMS for YOLO v8 outputs.

## Architecture

```
├── components/           # React components
│   ├── MotionPanel.tsx   # Motion detection UI
│   └── ...
├── services/             # Core services
│   ├── yoloVisionService.ts    # YOLO object detection
│   ├── motionDetectionService.ts # Motion analysis
│   └── visionService.ts         # Legacy Google API service
└── types.ts              # TypeScript definitions
```

## Detection Classes

The system detects and tracks:
- **person**: Pedestrians and people
- **car**: Automobiles and sedans
- **bus**: Public transportation buses
- **truck**: Commercial trucks and lorries
- **bike**: Bicycles and motorcycles

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request
