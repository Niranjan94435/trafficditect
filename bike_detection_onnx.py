"""
Real-time Bike & Person Detection with OpenCV + YOLOv8
Instant rider detection with zero delay - Frame-by-frame processing
Simplified version to avoid torch/torchvision compatibility issues
"""

import cv2
import numpy as np
import time
import onnxruntime as ort
from pathlib import Path

class BikeRiderDetectorONNX:
    """
    YOLOv8 detector using ONNX runtime (faster, simpler, no torch dependency)
    """
    
    def __init__(self, model_path=None, confidence_threshold=0.5):
        """Initialize ONNX YOLOv8 detector"""
        
        if model_path is None:
            # Download ONNX model if not exists
            model_path = self.download_yolo_onnx()
        
        print(f"[*] Loading ONNX YOLOv8 model...")
        self.session = ort.InferenceSession(
            model_path,
            providers=['CPUExecutionProvider']
        )
        
        self.confidence_threshold = confidence_threshold
        self.target_classes = {'person': 0, 'bicycle': 1}
        self.class_colors = {
            'person': (255, 0, 0),      # Blue
            'bicycle': (0, 255, 0),     # Green
            'rider': (0, 0, 255)        # Red
        }
        
        print("[✓] ONNX Model loaded successfully")
    
    @staticmethod
    def download_yolo_onnx():
        """Download YOLOv8n ONNX model"""
        import urllib.request
        
        model_dir = Path.home() / '.cache' / 'yolov8'
        model_dir.mkdir(parents=True, exist_ok=True)
        model_path = model_dir / 'yolov8n.onnx'
        
        if not model_path.exists():
            print("[*] Downloading YOLOv8n ONNX model (~12MB)...")
            url = "https://github.com/ultralytics/assets/releases/download/v8.2.0/yolov8n.onnx"
            urllib.request.urlretrieve(url, model_path)
            print("[✓] Model downloaded")
        
        return str(model_path)
    
    def infer(self, frame):
        """Run ONNX inference on frame"""
        h, w = frame.shape[:2]
        
        # Prepare input
        blob = cv2.dnn.blobFromImage(
            frame,
            scalefactor=1/255.0,
            size=(640, 640),
            swapRB=True,
            crop=False
        )
        
        # Get input/output names
        input_name = self.session.get_inputs()[0].name
        output_names = [o.name for o in self.session.get_outputs()]
        
        # Run inference
        outputs = self.session.run(output_names, {input_name: blob})
        
        return outputs[0], h, w
    
    def detect_frame(self, frame):
        """Detect bikes and persons with instant rider detection"""
        
        h, w = frame.shape[:2]
        
        # Run inference
        output, orig_h, orig_w = self.infer(frame)
        
        # Parse output: [batch, 84, 8400] for YOLOv8
        detections = []
        persons = []
        bikes = []
        
        # Process detections
        output = output[0].T  # Transpose to [8400, 84]
        
        for detection in output:
            scores = detection[4:]  # Confidence scores for each class
            class_id = np.argmax(scores)
            confidence = scores[class_id]
            
            if confidence < self.confidence_threshold:
                continue
            
            # Get class name
            class_names = {0: 'person', 1: 'bicycle', 2: 'car', 3: 'dog', 5: 'bus'}
            if class_id not in [0, 1]:  # Only person and bicycle
                continue
            
            class_name = class_names.get(class_id, 'unknown')
            
            # Get coordinates
            x, y, width, height = detection[:4]
            
            # Scale coordinates
            x1 = int((x - width / 2) * w / 640)
            y1 = int((y - height / 2) * h / 640)
            x2 = int((x + width / 2) * w / 640)
            y2 = int((y + height / 2) * h / 640)
            
            # Clamp coordinates
            x1, y1 = max(0, x1), max(0, y1)
            x2, y2 = min(w, x2), min(h, y2)
            
            det = {
                'class': class_name,
                'confidence': float(confidence),
                'bbox': [x1, y1, x2, y2]
            }
            
            detections.append(det)
            
            if class_name == 'person':
                persons.append(det)
            elif class_name == 'bicycle':
                bikes.append(det)
        
        # ===== INSTANT RIDER DETECTION =====
        rider_detections = []
        person_indices_as_riders = set()
        
        for bike_idx, bike in enumerate(bikes):
            for person_idx, person in enumerate(persons):
                iou = self.calculate_iou(bike['bbox'], person['bbox'])
                
                # INSTANT: IoU > 0.25 = rider
                if iou > 0.25:
                    person_indices_as_riders.add(person_idx)
                    rider_det = {
                        'class': 'Person on Bike',
                        'confidence': max(bike['confidence'], person['confidence']),
                        'bbox': bike['bbox'],
                        'iou_score': iou,
                        'is_rider': True
                    }
                    rider_detections.append(rider_det)
        
        # Keep only standalone persons
        standalone_persons = [
            p for idx, p in enumerate(persons)
            if idx not in person_indices_as_riders
        ]
        
        final_detections = standalone_persons + bikes + rider_detections
        return final_detections
    
    @staticmethod
    def calculate_iou(box1, box2):
        """Calculate IoU between two boxes"""
        x1_min, y1_min, x1_max, y1_max = box1
        x2_min, y2_min, x2_max, x2_max = box2
        
        x_inter_min = max(x1_min, x2_min)
        x_inter_max = min(x1_max, x2_max)
        y_inter_min = max(y1_min, y2_min)
        y_inter_max = min(y1_max, y2_max)
        
        if x_inter_max < x_inter_min or y_inter_max < y_inter_min:
            return 0.0
        
        intersection = (x_inter_max - x_inter_min) * (y_inter_max - y_inter_min)
        box1_area = (x1_max - x1_min) * (y1_max - y1_min)
        box2_area = (x2_max - x2_min) * (y2_max - y2_min)
        union = box1_area + box2_area - intersection
        
        return intersection / union if union > 0 else 0.0
    
    def draw_detections(self, frame, detections):
        """Draw detections on frame"""
        for det in detections:
            x1, y1, x2, y2 = det['bbox']
            class_name = det['class']
            confidence = det['confidence']
            
            if class_name == 'Person on Bike':
                color = self.class_colors['rider']
                label = f"BIKE (RIDER) {confidence:.2f}"
            elif class_name == 'bicycle':
                color = self.class_colors['bicycle']
                label = f"Bicycle {confidence:.2f}"
            else:
                color = self.class_colors['person']
                label = f"Person {confidence:.2f}"
            
            # Draw box
            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            
            # Draw label
            text_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)[0]
            cv2.rectangle(
                frame,
                (x1, y1 - text_size[1] - 10),
                (x1 + text_size[0] + 10, y1),
                color,
                -1
            )
            cv2.putText(
                frame,
                label,
                (x1 + 5, y1 - 5),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (255, 255, 255),
                2
            )
        
        return frame
    
    def run(self, source=0):
        """Main detection loop"""
        print(f"[*] Opening camera...")
        cap = cv2.VideoCapture(source)
        
        if not cap.isOpened():
            print("[✗] Error: Cannot open camera")
            return
        
        print("[✓] Camera opened")
        
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
        cap.set(cv2.CAP_PROP_FPS, 30)
        
        frame_count = 0
        start_time = time.time()
        
        try:
            while True:
                ret, frame = cap.read()
                if not ret:
                    print("[✗] Failed to read frame")
                    break
                
                frame_count += 1
                frame_time = time.time()
                
                # Detect
                detections = self.detect_frame(frame)
                det_time = (time.time() - frame_time) * 1000
                
                # Draw
                frame = self.draw_detections(frame, detections)
                
                # FPS
                fps = frame_count / (time.time() - start_time)
                
                # Stats
                stats = f"FPS: {fps:.1f} | Det: {det_time:.1f}ms"
                cv2.putText(frame, stats, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                
                riders = sum(1 for d in detections if d['class'] == 'Person on Bike')
                persons = sum(1 for d in detections if d['class'] == 'person')
                bikes = sum(1 for d in detections if d['class'] == 'bicycle')
                count = f"People: {persons} | Bikes: {bikes} | Riders: {riders}"
                cv2.putText(frame, count, (10, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                
                cv2.imshow('Bike Rider Detection', frame)
                
                key = cv2.waitKey(1) & 0xFF
                if key == ord('q') or key == 27:
                    break
        
        except KeyboardInterrupt:
            print("\n[*] Interrupted")
        finally:
            cap.release()
            cv2.destroyAllWindows()
            print(f"[✓] Processed {frame_count} frames")


def main():
    print("=" * 60)
    print("Smart Traffic - Real-time Bike Rider Detection")
    print("=" * 60)
    
    try:
        detector = BikeRiderDetectorONNX(confidence_threshold=0.5)
        detector.run(source=0)
    except ImportError as e:
        print(f"[✗] Missing dependency: {e}")
        print("[*] Install: pip install onnxruntime")
        return 1
    except Exception as e:
        print(f"[✗] Error: {e}")
        return 1
    
    return 0


if __name__ == '__main__':
    exit(main())
