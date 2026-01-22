/**
 * Motion Detection Service
 * Detects motion changes between frames using pixel difference analysis
 */

export interface MotionMetrics {
  motionDetected: boolean;
  motionIntensity: number; // 0-100
  motionAreas: MotionArea[];
  timestamp: number;
}

export interface MotionArea {
  x: number;
  y: number;
  width: number;
  height: number;
  intensity: number;
}

class MotionDetector {
  private previousFrame: ImageData | null = null;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private motionThreshold = 25; // Pixel difference threshold (0-255)
  private minMotionArea = 50; // Minimum pixels to consider motion
  private gridSize = 16; // Grid cell size for motion area detection

  constructor() {
    this.canvas = document.createElement('canvas');
    const ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }
    this.ctx = ctx;
  }

  /**
   * Analyze two frames for motion
   */
  analyzeMotion(
    currentFrame: HTMLCanvasElement | HTMLVideoElement,
    width: number,
    height: number
  ): MotionMetrics {
    // Setup canvas
    this.canvas.width = width;
    this.canvas.height = height;

    // Draw current frame to canvas
    this.ctx.drawImage(currentFrame, 0, 0, width, height);
    const currentImageData = this.ctx.getImageData(0, 0, width, height);

    if (!this.previousFrame) {
      // First frame - no motion to compare
      this.previousFrame = currentImageData;
      return {
        motionDetected: false,
        motionIntensity: 0,
        motionAreas: [],
        timestamp: Date.now(),
      };
    }

    // Calculate motion metrics
    const { intensity, motionPixelCount, motionMap } = this.calculateMotionDifference(
      this.previousFrame,
      currentImageData
    );

    // Detect motion areas
    const motionAreas = this.detectMotionAreas(motionMap, width, height, intensity);

    // Update previous frame
    this.previousFrame = currentImageData;

    const motionDetected = motionPixelCount > this.minMotionArea;

    return {
      motionDetected,
      motionIntensity: Math.min(100, intensity),
      motionAreas,
      timestamp: Date.now(),
    };
  }

  /**
   * Calculate pixel-by-pixel differences between frames
   */
  private calculateMotionDifference(
    previousImageData: ImageData,
    currentImageData: ImageData
  ): { intensity: number; motionPixelCount: number; motionMap: Uint8ClampedArray } {
    const prevData = previousImageData.data;
    const currData = currentImageData.data;
    const motionMap = new Uint8ClampedArray(currData.length / 4);

    let totalMotion = 0;
    let motionPixelCount = 0;

    // Compare each pixel
    for (let i = 0; i < prevData.length; i += 4) {
      const rDiff = Math.abs(prevData[i] - currData[i]);
      const gDiff = Math.abs(prevData[i + 1] - currData[i + 1]);
      const bDiff = Math.abs(prevData[i + 2] - currData[i + 2]);

      // Calculate luminance difference
      const diff = (rDiff * 0.299 + gDiff * 0.587 + bDiff * 0.114);

      if (diff > this.motionThreshold) {
        motionPixelCount++;
        totalMotion += diff;
        motionMap[i / 4] = Math.min(255, diff);
      }
    }

    // Normalize intensity to 0-100
    const intensity = Math.min(100, (totalMotion / (prevData.length / 4)) * (100 / 255));

    return { intensity, motionPixelCount, motionMap };
  }

  /**
   * Detect regions of motion in the frame
   */
  private detectMotionAreas(
    motionMap: Uint8ClampedArray,
    width: number,
    height: number,
    baseIntensity: number
  ): MotionArea[] {
    const gridCols = Math.ceil(width / this.gridSize);
    const gridRows = Math.ceil(height / this.gridSize);
    const motionAreas: MotionArea[] = [];

    // Analyze motion in grid cells
    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        const cellIntensity = this.calculateCellIntensity(
          motionMap,
          width,
          col,
          row
        );

        if (cellIntensity > 0) {
          motionAreas.push({
            x: col * this.gridSize,
            y: row * this.gridSize,
            width: Math.min(this.gridSize, width - col * this.gridSize),
            height: Math.min(this.gridSize, height - row * this.gridSize),
            intensity: cellIntensity,
          });
        }
      }
    }

    // Merge nearby motion areas
    return this.mergeAdjacentAreas(motionAreas);
  }

  /**
   * Calculate motion intensity in a grid cell
   */
  private calculateCellIntensity(
    motionMap: Uint8ClampedArray,
    frameWidth: number,
    gridCol: number,
    gridRow: number
  ): number {
    const startX = gridCol * this.gridSize;
    const startY = gridRow * this.gridSize;
    let totalIntensity = 0;
    let pixelCount = 0;

    for (let y = startY; y < startY + this.gridSize; y++) {
      for (let x = startX; x < startX + this.gridSize; x++) {
        if (x < frameWidth && y * frameWidth + x < motionMap.length) {
          const idx = y * frameWidth + x;
          if (motionMap[idx] > 0) {
            totalIntensity += motionMap[idx];
            pixelCount++;
          }
        }
      }
    }

    return pixelCount > 0 ? Math.min(100, (totalIntensity / pixelCount) * (100 / 255)) : 0;
  }

  /**
   * Merge adjacent motion areas to reduce noise
   */
  private mergeAdjacentAreas(areas: MotionArea[]): MotionArea[] {
    if (areas.length === 0) return [];

    const merged: MotionArea[] = [];
    const used = new Set<number>();

    for (let i = 0; i < areas.length; i++) {
      if (used.has(i)) continue;

      let merged_area = { ...areas[i] };
      used.add(i);

      // Check for adjacent areas
      for (let j = i + 1; j < areas.length; j++) {
        if (used.has(j)) continue;

        if (this.isAdjacent(merged_area, areas[j])) {
          merged_area = this.mergeTwo(merged_area, areas[j]);
          used.add(j);
        }
      }

      if (merged_area.intensity > 5) {
        merged.push(merged_area);
      }
    }

    return merged;
  }

  /**
   * Check if two areas are adjacent
   */
  private isAdjacent(area1: MotionArea, area2: MotionArea): boolean {
    const margin = this.gridSize * 1.5;
    return !(
      area1.x + area1.width + margin < area2.x ||
      area2.x + area2.width + margin < area1.x ||
      area1.y + area1.height + margin < area2.y ||
      area2.y + area2.height + margin < area1.y
    );
  }

  /**
   * Merge two areas
   */
  private mergeTwo(area1: MotionArea, area2: MotionArea): MotionArea {
    const x = Math.min(area1.x, area2.x);
    const y = Math.min(area1.y, area2.y);
    const right = Math.max(area1.x + area1.width, area2.x + area2.width);
    const bottom = Math.max(area1.y + area1.height, area2.y + area2.height);

    return {
      x,
      y,
      width: right - x,
      height: bottom - y,
      intensity: (area1.intensity + area2.intensity) / 2,
    };
  }

  /**
   * Reset detector state
   */
  reset(): void {
    this.previousFrame = null;
  }
}

// Export singleton instance
export const motionDetector = new MotionDetector();
