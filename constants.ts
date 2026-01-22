
// Emission factors in grams per unit (simulated per snapshot activity)
export const EMISSION_FACTORS = {
  car: { co2: 120, nox: 0.4, pm25: 0.03 },
  bus: { co2: 800, nox: 2.5, pm25: 0.15 },
  truck: { co2: 1000, nox: 3.5, pm25: 0.2 },
  bike: { co2: 50, nox: 0.1, pm25: 0.01 },
  person: { co2: 0, nox: 0, pm25: 0 },
  animal: { co2: 5, nox: 0.01, pm25: 0 }
};

export const CONGESTION_THRESHOLDS = {
  LOW: 5,
  MEDIUM: 12,
  HIGH: 20
};

export const ANALYSIS_INTERVAL_MS = 3000; // Optimized to 3 seconds for high-frequency updates
