/**
 * YOLO v8 Vision Service
 * Uses TensorFlow.js with COCO-SSD for real-time object detection
 * Detects: person, car, bicycle, truck, bus
 * Note: Upgrade to actual YOLO v8 model when available
 */

import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { DetectionResult } from '../types';

class YOLODetector {
  private model: cocoSsd.ObjectDetection | null = null;
  private isLoaded = false;

  async loadModel(): Promise<void> {
    if (this.isLoaded) return;

    try {
      console.log('Loading COCO-SSD model (YOLO-style detection)...');
      await tf.ready();
      
      // Use lite_mobilenet_v2 for faster inference (no delay)
      await tf.setBackend('webgl');
      
      this.model = await cocoSsd.load({
        base: 'lite_mobilenet_v2' // Optimized for fast inference with minimal latency
      });

      this.isLoaded = true;
      console.log('COCO-SSD lite model loaded - optimized for low latency');
    } catch (error) {
      console.error('Failed to load detection model:', error);
      throw error;
    }
  }

  async detectObjects(imageElement: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement): Promise<DetectionResult[]> {
    if (!this.isLoaded || !this.model) {
      await this.loadModel();
    }

    if (!this.model) {
      throw new Error('Model not loaded');
    }

    try {
      // Run COCO-SSD detection with minimal timeout
      const predictions = await this.model.detect(imageElement);

      // Convert COCO-SSD predictions to our DetectionResult format
      const detections: DetectionResult[] = predictions
        .filter(pred => this.isTargetClass(pred.class))
        .map(pred => this.convertToDetectionResult(pred));

      // Filter: If person is riding a bike, keep only the bike
      const filtered = this.filterRidingPersons(detections);

      return filtered;
    } catch (error) {
      console.error('Detection failed:', error);
      return [];
    }
  }

  /**
   * Filter out person detections that are riding bikes
   * If a person and bike overlap significantly, keep only the bike
   */
  private filterRidingPersons(detections: DetectionResult[]): DetectionResult[] {
    const bikes = detections.filter(d => d.type === 'bike');
    const persons = detections.filter(d => d.type === 'person');
    const others = detections.filter(d => d.type !== 'bike' && d.type !== 'person');

    // If no bikes, return all detections
    if (bikes.length === 0) {
      return detections;
    }

    // Check which persons are riding bikes
    const ridingPersons = new Set<number>();

    persons.forEach((person, personIdx) => {
      bikes.forEach(bike => {
        // Calculate intersection over union (IoU)
        const iou = this.calculateIoU(person.box_2d!, bike.box_2d!);

        // If IoU > 0.3, person is likely riding the bike
        // Lower threshold for better detection of riding persons
        if (iou > 0.3) {
          ridingPersons.add(personIdx);
        }
      });
    });

    // Keep non-riding persons and all bikes
    const filteredPersons = persons.filter((_, idx) => !ridingPersons.has(idx));

    return [...filteredPersons, ...bikes, ...others];
  }

  /**
   * Calculate Intersection over Union (IoU) of two bounding boxes
   */
  private calculateIoU(box1: [number, number, number, number], box2: [number, number, number, number]): number {
    const [y1min, x1min, y1max, x1max] = box1;
    const [y2min, x2min, y2max, x2max] = box2;

    // Calculate intersection
    const xIntersectMin = Math.max(x1min, x2min);
    const xIntersectMax = Math.min(x1max, x2max);
    const yIntersectMin = Math.max(y1min, y2min);
    const yIntersectMax = Math.min(y1max, y2max);

    if (xIntersectMax < xIntersectMin || yIntersectMax < yIntersectMin) {
      return 0; // No intersection
    }

    const intersectionArea = (xIntersectMax - xIntersectMin) * (yIntersectMax - yIntersectMin);

    // Calculate union
    const box1Area = (x1max - x1min) * (y1max - y1min);
    const box2Area = (x2max - x2min) * (y2max - y2min);
    const unionArea = box1Area + box2Area - intersectionArea;

    return intersectionArea / unionArea;
  }

  private isTargetClass(className: string): boolean {
    const targetClasses = ['person', 'car', 'bicycle', 'truck', 'bus', 'motorcycle'];
    return targetClasses.includes(className.toLowerCase());
  }

  private convertToDetectionResult(prediction: cocoSsd.DetectedObject): DetectionResult {
    const { bbox, class: className, score } = prediction;
    const [x, y, width, height] = bbox;

    // Convert class name to our format
    let type: 'person' | 'car' | 'bus' | 'truck' | 'bike' | 'animal';
    switch (className.toLowerCase()) {
      case 'person':
        type = 'person';
        break;
      case 'car':
        type = 'car';
        break;
      case 'bus':
        type = 'bus';
        break;
      case 'truck':
        type = 'truck';
        break;
      case 'bicycle':
      case 'motorcycle':
        type = 'bike';
        break;
      default:
        type = 'car'; // fallback
    }

    // Convert bbox to YOLO format [ymin, xmin, ymax, xmax] normalized to 0-1000
    // Note: COCO-SSD bbox is [x, y, width, height] in pixels
    // We need to normalize to 0-1000 range
    const imageWidth = 640; // Assuming 640px width (can be made dynamic)
    const imageHeight = 480; // Assuming 480px height (can be made dynamic)

    const ymin = (y / imageHeight) * 1000;
    const xmin = (x / imageWidth) * 1000;
    const ymax = ((y + height) / imageHeight) * 1000;
    const xmax = ((x + width) / imageWidth) * 1000;

    return {
      type,
      confidence: score,
      count: 1, // COCO-SSD detects individual objects
      box_2d: [ymin, xmin, ymax, xmax]
    };
  }
}

// Export singleton instance
export const yoloDetector = new YOLODetector();

// Main detection function
export async function analyzeTrafficFrameYOLO(imageElement: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement): Promise<DetectionResult[]> {
  try {
    const detections = await yoloDetector.detectObjects(imageElement);
    return detections;
  } catch (error) {
    console.error('YOLO analysis failed:', error);
    return [];
  }
}

// OpenCV helper functions (for additional processing if needed)
export class OpenCVProcessor {
  private isOpenCVLoaded = false;

  async loadOpenCV(): Promise<void> {
    if (this.isOpenCVLoaded) return;

    return new Promise((resolve, reject) => {
      // Load OpenCV.js
      const script = document.createElement('script');
      script.src = 'https://docs.opencv.org/4.8.0/opencv.js';
      script.onload = () => {
        this.isOpenCVLoaded = true;
        console.log('OpenCV.js loaded');
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Preprocessing with OpenCV
  preprocessImage(canvas: HTMLCanvasElement): HTMLCanvasElement {
    if (!this.isOpenCVLoaded || typeof (window as any).cv === 'undefined') {
      return canvas; // Return original if OpenCV not loaded
    }

    try {
      const cv = (window as any).cv;
      const src = cv.imread(canvas);
      const dst = new cv.Mat();

      // Apply preprocessing (e.g., noise reduction, contrast enhancement)
      cv.GaussianBlur(src, dst, new cv.Size(3, 3), 0);
      cv.cvtColor(dst, dst, cv.COLOR_RGBA2RGB);

      cv.imshow(canvas, dst);

      // Cleanup
      src.delete();
      dst.delete();

      return canvas;
    } catch (error) {
      console.error('OpenCV preprocessing failed:', error);
      return canvas;
    }
  }
}

export const openCVProcessor = new OpenCVProcessor();
