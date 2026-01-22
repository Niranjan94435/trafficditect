#!/usr/bin/env python3
"""
Quick Reference - Run This to Start Detection

ONE-COMMAND STARTUP:
    python bike_detection_cv.py

WHAT IT DOES:
    ✓ Captures live webcam feed
    ✓ Detects persons (BLUE boxes)
    ✓ Detects bicycles (GREEN boxes)
    ✓ Instant rider detection: Person + Bike overlap = RED box
    ✓ Shows live FPS and detection latency
    ✓ Zero delay, frame-by-frame processing

HOW TO USE:
    1. Connect webcam
    2. Run: python bike_detection_cv.py
    3. Point at people/bikes
    4. Press Q to exit

INSTANT RIDER LOGIC:
    When person and bike overlap in SAME frame (IoU > 0.25):
    → IMMEDIATELY label as "BIKE (RIDER DETECTED)"
    → No waiting, no temporal logic, no delays

COLORS IN OUTPUT:
    🔵 BLUE   = Standalone Person
    🟢 GREEN  = Standalone Bicycle
    🔴 RED    = Person Riding Bike ⭐

KEY METRICS:
    • FPS: 15-30 fps on laptop CPU
    • Detection: 40-60ms per frame
    • Model: YOLOv3-tiny (34MB, auto-downloaded)
    • No dependencies beyond OpenCV

TROUBLESHOOTING:
    Camera error?
    → Check Windows Settings > Privacy > Camera
    → Allow Python.exe access

    Slow performance?
    → Close other apps
    → Check FPS on screen
    → Reduce resolution in bike_detection_cv.py

CONFIG QUICK EDITS:
    Line 365: detector = YOLOv3Detector(confidence_threshold=0.5)
             ↑ Lower = more detections, Higher = stricter
    
    Line 176: if iou > 0.25:
             ↑ Lower = more riders, Higher = stricter

FILES IN THIS DIRECTORY:
    • bike_detection_cv.py          ← Main app (USE THIS)
    • SETUP_COMPLETE.md             ← Full setup guide
    • BIKE_DETECTION_GUIDE.md       ← Detailed documentation
    • PYTHON_DETECTOR_README.md     ← Technical specs

PERFORMANCE CHECKLIST:
    ✓ Python 3.7+ installed
    ✓ OpenCV installed (pip install opencv-python)
    ✓ Camera connected and working
    ✓ Camera permissions granted
    ✓ No other app using camera
    ✓ Internet (first run only, for model)

INTEGRATION WITH REACT APP:
    This Python detector runs independently
    Detects bikes/riders from webcam
    Can pipe output to Node.js backend
    Can display results in React dashboard

NEXT STEPS:
    1. python bike_detection_cv.py
    2. Point webcam at test subject
    3. Verify instant detection works
    4. Check RED label appears immediately for riders
    5. Monitor FPS performance
    6. Adjust settings if needed (see CONFIG)

SUPPORT:
    Check BIKE_DETECTION_GUIDE.md for detailed troubleshooting
    Visit OpenCV docs: https://docs.opencv.org/

═════════════════════════════════════════════════════════════

QUICK START NOW:

    cd "d:\Smart Traffic"
    python bike_detection_cv.py
    
    Press Q to exit

═════════════════════════════════════════════════════════════
"""

# If this file is run, print the help text and show how to start
if __name__ == '__main__':
    import os
    print(__doc__)
    print("\n" + "=" * 60)
    print("To start detection now, run:")
    print("  python bike_detection_cv.py")
    print("=" * 60)
    os.system('python bike_detection_cv.py')
