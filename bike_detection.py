"""
Real-time Bike & Person Detection with Instant Rider Detection
Uses YOLOv8 with OpenCV for webcam streaming
Core Feature: Instant detection of persons riding bikes (frame-by-frame, zero delay)
"""

import cv2
import numpy as np
from ultralytics import YOLO
import time
from collections import defaultdict

class BikeRiderDetector:
    def __init__(self, model_name='yolov8n', confidence_threshold=0.5):
        """
        Initialize the bike and person detector
        
        Args:
            model_name: YOLOv8 model variant (n=nano, s=small, m=medium)
                       nano is fastest for laptop CPU
            confidence_threshold: Minimum confidence for detections
        """
        print(f"[*] Loading YOLOv8 model: {model_name}...")
        try:
            # Remove .pt extension if provided, ultralytics adds it automatically
            model_clean = model_name.replace('.pt', '')
            self.model = YOLO(model_clean)
        except Exception as e:
            print(f"[✗] Error loading model: {e}")
            print("[*] Attempting to load pre-downloaded model...")
            self.model = YOLO(model_name)
        
        self.confidence_threshold = confidence_threshold
        
        # Target classes
        self.target_classes = {'person': 0, 'bicycle': 1}
        self.class_colors = {
            'person': (255, 0, 0),      # Blue for person
            'bicycle': (0, 255, 0),     # Green for bike
            'rider': (0, 0, 255)        # Red for rider on bike
        }
        
        print("[✓] Model loaded successfully")
        print(f"[*] Target classes: {list(self.target_classes.keys())}")
    
    def calculate_iou(self, box1, box2):
        """
        Calculate Intersection over Union (IoU) of two bounding boxes
        
        Args:
            box1: [x1, y1, x2, y2] - first bounding box
            box2: [x1, y1, x2, y2] - second bounding box
        
        Returns:
            float: IoU score (0 to 1)
        """
        x1_min, y1_min, x1_max, y1_max = box1
        x2_min, y2_min, x2_max, y2_max = box2
        
        # Calculate intersection
        x_intersect_min = max(x1_min, x2_min)
        x_intersect_max = min(x1_max, x2_max)
        y_intersect_min = max(y1_min, y2_min)
        y_intersect_max = min(y1_max, y2_max)
        
        # If no intersection
        if x_intersect_max < x_intersect_min or y_intersect_max < y_intersect_min:
            return 0.0
        
        # Calculate areas
        intersection_area = (x_intersect_max - x_intersect_min) * (y_intersect_max - y_intersect_min)
        box1_area = (x1_max - x1_min) * (y1_max - y1_min)
        box2_area = (x2_max - x2_min) * (y2_max - y2_min)
        union_area = box1_area + box2_area - intersection_area
        
        return intersection_area / union_area if union_area > 0 else 0.0
    
    def detect_frame(self, frame):
        """
        Detect bikes and persons in a single frame
        Apply instant rider detection logic
        
        Args:
            frame: Input frame from webcam
        
        Returns:
            tuple: (detections list, rider_detections list)
        """
        # Run YOLOv8 inference
        results = self.model(frame, conf=self.confidence_threshold, verbose=False)
        
        detections = []
        persons = []
        bikes = []
        
        # Extract detections from YOLO results
        for result in results:
            boxes = result.boxes
            
            for box in boxes:
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy().astype(int)
                confidence = box.conf[0].cpu().numpy()
                class_id = int(box.cls[0].cpu().numpy())
                class_name = result.names[class_id]
                
                # Filter to target classes only
                if class_name not in self.target_classes:
                    continue
                
                detection = {
                    'class': class_name,
                    'confidence': confidence,
                    'bbox': [x1, y1, x2, y2],
                    'center': ((x1 + x2) // 2, (y1 + y2) // 2),
                    'area': (x2 - x1) * (y2 - y1)
                }
                
                detections.append(detection)
                
                if class_name == 'person':
                    persons.append(detection)
                elif class_name == 'bicycle':
                    bikes.append(detection)
        
        # ===== INSTANT RIDER DETECTION LOGIC =====
        # Check for person-bike overlap in SAME FRAME (zero delay)
        rider_detections = []
        person_indices_as_riders = set()
        
        for bike_idx, bike in enumerate(bikes):
            for person_idx, person in enumerate(persons):
                # Calculate IoU between person and bike
                iou = self.calculate_iou(bike['bbox'], person['bbox'])
                
                # INSTANT DECISION: IoU > 0.25 = person riding bike
                # No temporal logic, no frame buffering, immediate classification
                if iou > 0.25:
                    person_indices_as_riders.add(person_idx)
                    
                    # Create rider detection (higher priority)
                    rider_detection = {
                        'class': 'Person on Bike',
                        'confidence': max(bike['confidence'], person['confidence']),
                        'bbox': bike['bbox'],  # Use bike bbox for display
                        'iou_score': iou,
                        'is_rider': True
                    }
                    rider_detections.append(rider_detection)
        
        # Filter out persons that are riding bikes
        # Only keep standalone persons (not riding)
        standalone_persons = [
            person for idx, person in enumerate(persons)
            if idx not in person_indices_as_riders
        ]
        
        # Final detections: standalone persons + bikes + rider detections
        final_detections = standalone_persons + bikes + rider_detections
        
        return final_detections
    
    def draw_detections(self, frame, detections):
        """
        Draw bounding boxes and labels on frame
        
        Args:
            frame: Input frame
            detections: List of detections
        
        Returns:
            frame: Annotated frame
        """
        for det in detections:
            x1, y1, x2, y2 = det['bbox']
            class_name = det['class']
            confidence = det['confidence']
            
            # Select color based on class
            if class_name == 'Person on Bike':
                color = self.class_colors['rider']
                label = f"BIKE (RIDER DETECTED) {confidence:.2f}"
            elif class_name == 'bicycle':
                color = self.class_colors['bicycle']
                label = f"Bicycle {confidence:.2f}"
            else:  # person
                color = self.class_colors['person']
                label = f"Person {confidence:.2f}"
            
            # Draw bounding box
            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            
            # Draw label background
            text_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)[0]
            cv2.rectangle(
                frame,
                (x1, y1 - text_size[1] - 10),
                (x1 + text_size[0] + 10, y1),
                color,
                -1
            )
            
            # Draw label text
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
        """
        Main loop: Capture from webcam and detect in real-time
        
        Args:
            source: Video source (0 for default webcam)
        """
        print(f"[*] Opening video source: {source}")
        cap = cv2.VideoCapture(source)
        
        if not cap.isOpened():
            print("[✗] Error: Cannot open camera. Check camera permissions or device.")
            return
        
        print("[✓] Camera opened successfully")
        print("[*] Press 'Q' to exit")
        print("=" * 60)
        
        # Set camera properties for better performance
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
        cap.set(cv2.CAP_PROP_FPS, 30)
        
        frame_count = 0
        fps_counter = 0
        start_time = time.time()
        
        try:
            while True:
                # Capture frame from webcam
                ret, frame = cap.read()
                
                if not ret:
                    print("[✗] Error: Failed to read frame from camera")
                    break
                
                frame_count += 1
                frame_time_start = time.time()
                
                # ===== DETECTION HAPPENS HERE (Frame-by-frame, zero delay) =====
                detections = self.detect_frame(frame)
                
                detection_time = (time.time() - frame_time_start) * 1000  # ms
                
                # Draw all detections on frame
                frame = self.draw_detections(frame, detections)
                
                # Calculate and display FPS
                fps_counter += 1
                elapsed = time.time() - start_time
                
                if elapsed >= 1.0:
                    fps = fps_counter / elapsed
                    fps_counter = 0
                    start_time = time.time()
                else:
                    fps = frame_count / elapsed
                
                # Display stats on frame
                stats_text = f"FPS: {fps:.1f} | Detection: {detection_time:.1f}ms | Frames: {frame_count}"
                cv2.putText(
                    frame,
                    stats_text,
                    (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.7,
                    (0, 255, 0),
                    2
                )
                
                # Display detection count
                riders = sum(1 for d in detections if d['class'] == 'Person on Bike')
                persons = sum(1 for d in detections if d['class'] == 'person')
                bikes = sum(1 for d in detections if d['class'] == 'bicycle')
                
                count_text = f"People: {persons} | Bikes: {bikes} | Riders: {riders}"
                cv2.putText(
                    frame,
                    count_text,
                    (10, 70),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.7,
                    (0, 255, 0),
                    2
                )
                
                # Display frame
                cv2.imshow('Smart Traffic Vision - Bike Rider Detection', frame)
                
                # Non-blocking key check (Q or Esc to exit)
                key = cv2.waitKey(1) & 0xFF
                if key == ord('q') or key == ord('Q') or key == 27:  # Q or ESC
                    print("\n[*] Exiting...")
                    break
        
        except KeyboardInterrupt:
            print("\n[*] Interrupted by user")
        
        except Exception as e:
            print(f"[✗] Error during execution: {e}")
        
        finally:
            print("[*] Cleaning up...")
            cap.release()
            cv2.destroyAllWindows()
            print("[✓] Camera released and windows closed")
            print(f"[✓] Total frames processed: {frame_count}")


def main():
    """Main entry point"""
    print("=" * 60)
    print("Smart Traffic Vision - Real-time Bike Rider Detection")
    print("=" * 60)
    print("\nConfiguration:")
    print("  Model: YOLOv8 Nano (fastest, CPU optimized)")
    print("  Source: Webcam (Device 0)")
    print("  Detection Mode: Frame-by-frame (zero delay)")
    print("  Rider Logic: Instant IoU-based overlap detection")
    print("=" * 60)
    
    try:
        # Initialize detector with nano model for laptop CPU speed
        detector = BikeRiderDetector(model_name='yolov8n', confidence_threshold=0.5)
        
        # Run detection on default webcam
        detector.run(source=0)
        
    except Exception as e:
        print(f"\n[✗] Fatal error: {e}")
        print("[*] Make sure you have:")
        print("    - Python packages: pip install opencv-python ultralytics numpy")
        print("    - Working webcam connected")
        print("    - Administrator/user permissions for camera access")
        return 1
    
    return 0


if __name__ == '__main__':
    exit(main())
