/**
 * Accident Detection Service
 * Detects potential accidents based on:
 * - Sudden motion spikes
 * - Object collision detection (bounding box overlaps)
 * - Rapid congestion changes
 * - Abnormal motion patterns
 */

import { DetectionResult, TrafficStats } from '../types';

export interface AccidentMetrics {
  accidentDetected: boolean;
  severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-100
  location: { x: number; y: number } | null;
  type: 'collision' | 'motion_spike' | 'congestion' | 'unknown' | null;
  timestamp: number;
  objectsInvolved: number;
}

class AccidentDetector {
  private previousMotionIntensity = 0;
  private previousDensity = 0;
  private motionHistory: number[] = [];
  private densityHistory: number[] = [];
  private historyWindow = 10; // Number of frames to track
  private collisionThreshold = 0.3; // IOU threshold for collision
  private motionSpikeThreshold = 40; // Sudden motion increase

  reset(): void {
    this.motionHistory = [];
    this.densityHistory = [];
    this.previousMotionIntensity = 0;
    this.previousDensity = 0;
  }

  /**
   * Detect potential accidents
   */
  detectAccident(
    detections: DetectionResult[],
    motionIntensity: number,
    density: number,
    videoWidth: number,
    videoHeight: number
  ): AccidentMetrics {
    const metrics: AccidentMetrics = {
      accidentDetected: false,
      severity: 'none',
      confidence: 0,
      location: null,
      type: null,
      timestamp: Date.now(),
      objectsInvolved: 0,
    };

    // Track history
    this.motionHistory.push(motionIntensity);
    this.densityHistory.push(density);

    if (this.motionHistory.length > this.historyWindow) {
      this.motionHistory.shift();
      this.densityHistory.shift();
    }

    // 1. Check for motion spike (sudden increase)
    const motionSpike = this._detectMotionSpike(motionIntensity);

    // 2. Check for collisions (bounding box overlaps)
    const collisionResult = this._detectCollisions(detections);

    // 3. Check for rapid congestion change
    const congestionSpike = this._detectCongestionSpike(density);

    // 4. Check for abnormal patterns
    const abnormalPattern = this._detectAbnormalPattern(motionIntensity, density);

    // Determine if accident occurred and severity
    if (motionSpike || collisionResult.detected || congestionSpike || abnormalPattern) {
      metrics.accidentDetected = true;

      // Calculate severity
      let severityScore = 0;

      if (motionSpike) {
        severityScore += 30;
        metrics.type = 'motion_spike';
      }

      if (collisionResult.detected) {
        severityScore += 40;
        metrics.type = 'collision';
        metrics.location = collisionResult.location;
        metrics.objectsInvolved = collisionResult.objectCount;
      }

      if (congestionSpike) {
        severityScore += 20;
        if (!metrics.type || metrics.type === 'motion_spike') {
          metrics.type = 'congestion';
        }
      }

      if (abnormalPattern) {
        severityScore += 10;
      }

      // Set severity level
      if (severityScore >= 70) {
        metrics.severity = 'critical';
        metrics.confidence = Math.min(100, severityScore);
      } else if (severityScore >= 50) {
        metrics.severity = 'high';
        metrics.confidence = Math.min(100, severityScore);
      } else if (severityScore >= 30) {
        metrics.severity = 'medium';
        metrics.confidence = Math.min(100, severityScore);
      } else {
        metrics.severity = 'low';
        metrics.confidence = Math.min(100, severityScore);
      }
    }

    this.previousMotionIntensity = motionIntensity;
    this.previousDensity = density;

    return metrics;
  }

  /**
   * Detect sudden motion spikes
   */
  private _detectMotionSpike(currentMotion: number): boolean {
    if (this.motionHistory.length < 3) return false;

    const motionDelta = currentMotion - this.previousMotionIntensity;
    return motionDelta > this.motionSpikeThreshold;
  }

  /**
   * Detect object collisions using bounding box overlaps
   * Only detects collisions between vehicles (not persons)
   */
  private _detectCollisions(
    detections: DetectionResult[]
  ): { detected: boolean; location: { x: number; y: number } | null; objectCount: number } {
    const result = {
      detected: false,
      location: null as { x: number; y: number } | null,
      objectCount: 0,
    };

    if (detections.length < 2) return result;

    // Filter only vehicle detections (exclude persons)
    const vehicles = detections.filter(det => 
      det.type && 
      !['person', 'human'].includes(det.type.toLowerCase())
    );

    if (vehicles.length < 2) return result;

    // Check for overlapping bounding boxes between vehicles (potential collisions)
    for (let i = 0; i < vehicles.length; i++) {
      for (let j = i + 1; j < vehicles.length; j++) {
        const det1 = vehicles[i];
        const det2 = vehicles[j];

        if (!det1.box_2d || !det2.box_2d) continue;

        // Calculate IOU (Intersection over Union)
        const iou = this._calculateIOU(det1.box_2d, det2.box_2d);

        if (iou > this.collisionThreshold) {
          result.detected = true;
          result.objectCount = Math.max(result.objectCount, 2);

          // Calculate collision location (center of overlap)
          const [y1min, x1min, y1max, x1max] = det1.box_2d;
          const [y2min, x2min, y2max, x2max] = det2.box_2d;

          const xIntersect = Math.max(x1min, x2min);
          const yIntersect = Math.max(y1min, y2min);
          const xIntersectMax = Math.min(x1max, x2max);
          const yIntersectMax = Math.min(y1max, y2max);

          result.location = {
            x: (xIntersect + xIntersectMax) / 2,
            y: (yIntersect + yIntersectMax) / 2,
          };

          break;
        }
      }
      if (result.detected) break;
    }

    return result;
  }

  /**
   * Calculate Intersection over Union (IOU)
   */
  private _calculateIOU(box1: number[], box2: number[]): number {
    const [y1min, x1min, y1max, x1max] = box1;
    const [y2min, x2min, y2max, x2max] = box2;

    const xIntersect = Math.max(x1min, x2min);
    const yIntersect = Math.max(y1min, y2min);
    const xIntersectMax = Math.min(x1max, x2max);
    const yIntersectMax = Math.min(y1max, y2max);

    if (xIntersect >= xIntersectMax || yIntersect >= yIntersectMax) {
      return 0;
    }

    const intersection = (xIntersectMax - xIntersect) * (yIntersectMax - yIntersect);
    const area1 = (x1max - x1min) * (y1max - y1min);
    const area2 = (x2max - x2min) * (y2max - y2min);
    const union = area1 + area2 - intersection;

    return union > 0 ? intersection / union : 0;
  }

  /**
   * Detect rapid congestion changes
   */
  private _detectCongestionSpike(currentDensity: number): boolean {
    if (this.densityHistory.length < 3) return false;

    const densityDelta = Math.abs(currentDensity - this.previousDensity);
    const avgPreviousDensity =
      this.densityHistory.slice(0, -1).reduce((a, b) => a + b, 0) / Math.max(1, this.densityHistory.length - 1);

    // Significant sudden increase in density
    return densityDelta > avgPreviousDensity * 0.5 && currentDensity > avgPreviousDensity;
  }

  /**
   * Detect abnormal patterns
   */
  private _detectAbnormalPattern(motionIntensity: number, density: number): boolean {
    if (this.motionHistory.length < 5) return false;

    // Calculate motion variance
    const avgMotion = this.motionHistory.reduce((a, b) => a + b, 0) / this.motionHistory.length;
    const motionVariance =
      this.motionHistory.reduce((sum, val) => sum + Math.pow(val - avgMotion, 2), 0) / this.motionHistory.length;

    // High variance in motion = abnormal/unstable pattern
    return motionVariance > 500 && density > 3;
  }
}

export const accidentDetector = new AccidentDetector();
