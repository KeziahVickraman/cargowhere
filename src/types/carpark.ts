export type LotType = 'C' | 'Y' | 'H'; // C: Car, Y: Motorcycle, H: Heavy Vehicle

export type CarparkType = 'HDB' | 'URA' | 'MALL' | 'COMMERCIAL' | 'ATTRACTION' | 'AIRPORT';

export type AvailabilityStatus = 'AVAILABLE' | 'FILLING_FAST' | 'FULL';

export interface LotBreakdown {
  type: LotType;
  totalLots: number;
  availableLots: number;
  label: string;
}

export interface ParkingRate {
  weekdayDay: string; // e.g., "$0.60 per 30 mins (7am - 5pm)"
  weekdayNight: string; // e.g., "$0.60 per 30 mins, max $5.00 (5pm - 7am)"
  saturday: string;
  sundayAndPh: string;
  gracePeriodMinutes: number; // e.g., 10 or 15 mins
  hourlyEstimate: number; // SGD/hour for calculator sorting
  nightMaxCap?: number;
}

export interface EVCharger {
  available: boolean;
  count: number;
  operator?: 'SP Mobility' | 'Shell Recharge' | 'Charge+' | 'Tesla Supercharger' | 'CDG ENGIE';
  powerKw?: number;
}

export interface Carpark {
  id: string;
  carparkNumber: string; // Data.gov.sg carpark code e.g. "HE12", "ACB", "MBFC"
  name: string;
  address: string;
  area: 'Central' | 'Marina Bay' | 'Orchard' | 'Bugis' | 'East' | 'West' | 'North' | 'North-East' | 'South';
  town: string; // e.g. "Tampines", "Jurong East", "Downtown Core", "Orchard"
  type: CarparkType;
  latitude: number;
  longitude: number;
  heightClearanceMeters: number;
  hasElectronicParking: boolean; // EPS
  rates: ParkingRate;
  evCharger: EVCharger;
  
  // Real-time data fields
  lots: {
    cars: LotBreakdown;
    motorcycles?: LotBreakdown;
    heavyVehicles?: LotBreakdown;
  };
  lastUpdated: string; // ISO string
  distanceKm?: number; // Calculated relative to user or selected point
}

export interface FilterState {
  searchQuery: string;
  area: string; // 'All' or specific area
  vehicleType: LotType;
  availableOnly: boolean;
  evChargingOnly: boolean;
  highClearanceOnly: boolean; // >= 2.0m
  carparkType: string; // 'All' or specific CarparkType
  sortBy: 'distance' | 'availableLots' | 'cheapest' | 'name';
}
