
export type ObjectType = 'person' | 'car' | 'bus' | 'truck' | 'bike' | 'animal';

export interface DetectionResult {
  type: ObjectType;
  confidence: number;
  ageGroup?: 'Child' | 'Teen' | 'Adult' | 'Senior';
  count: number;
  registrationNumber?: string; // New field for license plates
  box_2d?: [number, number, number, number]; // [ymin, xmin, ymax, xmax] normalized 0-1000
}

export interface CrowdDetection {
  personCount: number;
  crowdLevel: 'low' | 'medium' | 'high';
  location: string;
  timestamp: number;
}

export interface PollutionMetrics {
  co2: number;
  nox: number;
  pm25: number;
}

export interface TrafficStats {
  pedestrians: number;
  cars: number;
  buses: number;
  trucks: number;
  bikes: number;
  animals: number;
  crowds: number;
  crowdPersonCount: number;
  congestion: 'Low' | 'Medium' | 'High';
  density: number; // vehicles per unit area/time
}

export interface HistoricalData {
  timestamp: string;
  co2: number;
  nox: number;
  pm25: number;
  density: number;
  crowds?: number;
  crowdPersons?: number;
}
