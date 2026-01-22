# Python Real-Time Bike Rider Detection System

## 🚀 Quick Start

**Run the detector:**
```bash
cd "d:\Smart Traffic"
python bike_detection_cv.py
```

Press **Q** or **ESC** to exit.

---

## ✨ Features

### ✅ **Instant Rider Detection**
- **Zero Delay**: Frame-by-frame processing with no buffering
- **IoU-Based Logic**: When person bounding box overlaps with bike (IoU > 0.25), instantly classified as "Person on Bike"
- **No Temporal Logic**: Single-frame decisions, no frame history or confidence smoothing

### ✅ **Real-Time Detection**
- **Pure OpenCV**: No torch, tensorflow, or external ML dependencies
- **GPU-Optimized**: Automatic CPU/GPU detection
- **Live FPS Display**: Monitor detection speed in real-time
- **Instant Bounding Boxes**: Overlays update every frame

### ✅ **Detection Classes**
- 👤 **Person**: Detected with blue bounding box
- 🚲 **Bicycle**: Detected with green bounding box  
- 🚴 **Person on Bike**: Detected with RED bounding box (rider priority)

### ✅ **Laptop Optimized**
- Uses YOLOv3-tiny for fast CPU inference
- ~30-50ms per frame on standard laptop CPU
- No GPU required (but supports GPU if available)

---

## 📦 Installation

### 1. **Verify Python Installation**
```bash
python --version  # Must be 3.7+
```

### 2. **Ensure OpenCV is Installed**
```bash
pip install opencv-python --upgrade
```

### 3. **Run the Detection**
```bash
cd "d:\Smart Traffic"
python bike_detection_cv.py
```

**First run**: Will download YOLOv3-tiny weights (~34MB). This is automatic and cached for future runs.

---

## 🎯 How It Works

### Detection Pipeline

```
Frame from Webcam
        ↓
[OpenCV DNN Module]
        ↓
YOLOv3-tiny Inference
        ↓
Extract Person + Bike Detections
        ↓
[INSTANT IoU Check]
    Person + Bike overlap > 0.25?
        ├─ YES → Label as "Person on Bike" (RED)
        └─ NO → Keep as Person (BLUE) or Bike (GREEN)
        ↓
Draw Bounding Boxes + Labels
        ↓
Display with FPS Counter
```

### Instant Rider Logic (ZERO DELAY)

```python
# Per frame, for each (person, bike) pair:
if IoU(person_bbox, bike_bbox) > 0.25:
    INSTANTLY classify as "Person on Bike"
    # No waiting, no temporal logic, no frame buffering
```

**Why IoU > 0.25?**
- IoU = Intersection over Union (box overlap ratio)
- 0.25 = Person box overlaps 25% with bike box
- Sensitive enough to catch riders, strict enough to avoid false positives

---

## 📊 Live Output Example

```
Window Title: Smart Traffic - Bike Rider Detection (INSTANT)

┌──────────────────────────────────────────────────────┐
│ FPS: 28.5 | Detection: 42.3ms | Frames: 856         │  ← Performance
│ People: 2 | Bikes: 1 | Riders: 1                    │  ← Counts
│ Mode: INSTANT (Frame-by-frame, Zero Delay)          │  ← Detection mode
│                                                       │
│  ┌──────────────┐        ┌──────────────┐            │
│  │ BIKE         │        │ Person       │            │
│  │ (RIDER       │        │ 0.87         │            │
│  │ DETECTED)    │        └──────────────┘            │
│  │ 0.92         │                                     │
│  └──────────────┘        ┌──────────────┐            │
│                          │ Bicycle      │            │
│                          │ 0.79         │            │
│                          └──────────────┘            │
└──────────────────────────────────────────────────────┘

Legend:
🔴 RED = Person on Bike (Rider detected)
🟦 BLUE = Standalone Person
🟩 GREEN = Standalone Bicycle
```

---

## ⚙️ Configuration

### Adjust Confidence Threshold

Edit `bike_detection_cv.py` line 365:

```python
detector = YOLOv8Detector(confidence_threshold=0.5)
                                            ^^^^
# 0.3 = More detections, more false positives
# 0.5 = Balanced (default)
# 0.7 = Fewer detections, higher accuracy
```

### Adjust Rider Detection Sensitivity

Edit `bike_detection_cv.py` line 176:

```python
if iou > 0.25:  # Lower = more sensitive, higher = stricter
```

---

## 🐛 Troubleshooting

### Error: "Cannot open camera"
```
Solution:
1. Check camera is plugged in
2. Check Windows Settings > Privacy & Security > Camera
3. Allow Python.exe to access camera
4. Close other apps using camera (Zoom, Teams, etc.)
5. Try different source: detector.run(source=1)  # Different camera
```

### Error: "Module not found: cv2"
```
Solution: pip install opencv-python --upgrade
```

### Slow FPS (< 10 fps)
```
Solutions:
1. Close background applications
2. Reduce resolution: cap.set(cv2.CAP_PROP_FRAME_WIDTH, 320)
3. Increase confidence threshold (fewer detections = faster)
4. Use GPU: Set GPU support in OpenCV
```

### Model file download hangs
```
Solution:
1. Check internet connection
2. Try again (usually succeeds on 2nd attempt)
3. Manually download:
   - https://pjreddie.com/media/files/yolov3-tiny.weights
   - https://raw.githubusercontent.com/pjreddie/darknet/master/cfg/yolov3-tiny.cfg
   - Save to: C:\Users\[YourUsername]\.cache\yolov8\
```

### "KeyboardInterrupt" on startup
```
Solution: Use timeout to wait for model loading:
timeout /t 10 /nobreak
python bike_detection_cv.py
```

---

## 📈 Performance Metrics

| Metric | Value |
|--------|-------|
| **Model** | YOLOv3-tiny |
| **Input Size** | 416×416 |
| **Inference Time** | 40-60ms per frame |
| **FPS (CPU)** | 15-30 fps |
| **Memory Usage** | ~500MB |
| **Model Size** | 34MB (downloaded once) |

---

## 🔧 Technical Details

### Why OpenCV DNN?
- ✅ No external dependencies (pure OpenCV)
- ✅ Fast CPU inference
- ✅ Automatic GPU support if available
- ✅ No torch/tensorflow version conflicts

### Why YOLOv3-tiny?
- ✅ Smallest/fastest real-time detector
- ✅ ~34MB weights file
- ✅ ~50ms inference on CPU
- ✅ Accurate enough for traffic detection

### Instant Detection Design
- ✅ Single-frame processing
- ✅ No frame buffer
- ✅ No temporal smoothing
- ✅ Immediate IoU-based decisions
- ✅ Zero artificial delays

---

## 🔄 Integration Examples

### With React/Node.js App

```typescript
// In Node.js backend
const { spawn } = require('child_process');

const python = spawn('python', ['bike_detection_cv.py']);

python.stdout.on('data', (data) => {
  console.log(`Detection: ${data}`);
});

python.on('close', (code) => {
  console.log(`Process exited with code ${code}`);
});
```

### Get Detection Data

Modify script to output JSON:

```python
# Add to detect_frame() output:
import json
detection_json = json.dumps({
    'riders': riders,
    'persons': persons,
    'bikes': bikes,
    'fps': fps,
    'latency_ms': detection_time
})
print(detection_json)  # Pipe to other app
```

---

## 📚 References

- [OpenCV DNN Module](https://docs.opencv.org/master/d6/d0f/group__dnn.html)
- [YOLOv3 Original Paper](https://pjreddie.com/media/files/papers/YOLOv3.pdf)
- [IoU Calculation](https://en.wikipedia.org/wiki/Jaccard_index)

---

## 🎓 Learning Resources

**Understand YOLO:**
- [Real-time Object Detection](https://pjreddie.com/darknet/yolo/)
- [YOLOv3 Explained](https://towardsdatascience.com/yolov3-explained-ff5b155f4c9d)

**OpenCV DNN:**
- [Official Documentation](https://docs.opencv.org/master/d6/d0f/group__dnn.html)
- [Tutorials](https://docs.opencv.org/master/d8/d09/tutorial_dnn_yolo.html)

---

## ✅ Verification Checklist

Before running, ensure:

- [ ] Python 3.7+ installed
- [ ] OpenCV installed: `pip install opencv-python`
- [ ] Camera connected and accessible
- [ ] Camera permissions granted in Windows Settings
- [ ] Internet connection (for first-time model download)
- [ ] ~50MB free disk space (for model)
- [ ] No other app using the camera

---

## 🚀 Performance Tips

1. **Optimal Resolution**: 640×480 (balance speed/quality)
2. **Frame Rate**: 30 FPS (no benefit above this for detection)
3. **GPU Acceleration**: Automatically detected
4. **Batch Processing**: Not needed for webcam (single frame)
5. **Threading**: Not needed (OpenCV handles efficiently)

---

## 📝 Log Output Interpretation

```
[*] = Information
[✓] = Success
[✗] = Error
[!] = Warning
```

Example:
```
[*] Opening webcam...           → Action starting
[✓] Camera opened successfully  → Success
FPS: 28.5                       → Performance metric
[*] User requested exit         → Clean shutdown
[✓] Total frames processed: 856 → Final stats
```

---

## 🤝 Support

If issues persist:

1. **Check logs** for error messages
2. **Verify camera** works in Windows Camera app
3. **Restart computer** (fixes permission issues)
4. **Reinstall OpenCV**: `pip install opencv-python --force-reinstall`
5. **Update Python**: Use Python 3.10+ for better compatibility

---

**Ready to detect bike riders in real-time?** 🚴‍♂️

```bash
python bike_detection_cv.py
```

Press **Q** to exit. Good luck! 🎯
