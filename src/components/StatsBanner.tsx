import React from 'react';
import { Carpark, LotType } from '../types/carpark';
import { Database, CheckCircle2, AlertTriangle, Car, Zap } from 'lucide-react';

interface StatsBannerProps {
  carparks: Carpark[];
  selectedVehicleType: LotType;
  lastFetchedAt: Date | null;
  dataSource: string;
  apiLatencyMs: number;
  liveMatchCount: number;
}

export const StatsBanner: React.FC<StatsBannerProps> = ({
  carparks,
  selectedVehicleType,
  lastFetchedAt,
  dataSource,
  apiLatencyMs,
  liveMatchCount,
}) => {
  // Aggregate statistics
  let totalAvailableLots = 0;
  let totalCapacity = 0;
  let fullCarparksCount = 0;
  let evCarparksCount = 0;

  carparks.forEach((cp) => {
    let activeLot = cp.lots.cars;
    if (selectedVehicleType === 'Y' && cp.lots.motorcycles) {
      activeLot = cp.lots.motorcycles;
    } else if (selectedVehicleType === 'H' && cp.lots.heavyVehicles) {
      activeLot = cp.lots.heavyVehicles;
    }

    totalAvailableLots += activeLot.availableLots;
    totalCapacity += activeLot.totalLots;

    if (activeLot.availableLots <= 5 || (activeLot.totalLots > 0 && activeLot.availableLots / activeLot.totalLots <= 0.05)) {
      fullCarparksCount++;
    }

    if (cp.evCharger.available) {
      evCarparksCount++;
    }
  });

  const overallAvailabilityRate =
    totalCapacity > 0 ? Math.round((totalAvailableLots / totalCapacity) * 100) : 0;

  return (
    <div className="bg-slate-900 text-white px-4 sm:px-6 py-2.5 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left Side: Real Metrics */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="flex items-baseline gap-1.5">
            <span className="text-slate-400">Available Lots:</span>
            <span className="font-mono text-emerald-400 font-bold text-sm tabular-nums">
              {totalAvailableLots.toLocaleString()}
            </span>
            <span className="text-slate-500 font-mono text-[11px]">
              / {totalCapacity.toLocaleString()} ({overallAvailabilityRate}%)
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-slate-300">
            <span className="text-slate-400">Carparks:</span>
            <span className="font-mono font-semibold text-white tabular-nums">
              {carparks.length}
            </span>
          </div>

          {fullCarparksCount > 0 && (
            <div className="flex items-center gap-1.5 text-rose-300 font-medium">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>{fullCarparksCount} full or filling</span>
            </div>
          )}

          <div className="hidden md:flex items-center gap-1 text-emerald-400">
            <Zap className="w-3 h-3" />
            <span>{evCarparksCount} EV Charging Locations</span>
          </div>
        </div>

        {/* Right Side: Data source & Live Sync Stamp */}
        <div className="flex items-center gap-3 text-slate-400 text-[11px]">
          <div className="flex items-center gap-1.5">
            <Database className="w-3 h-3 text-emerald-400" />
            <span className="text-slate-300 font-medium">{dataSource}</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="font-mono text-slate-400">{apiLatencyMs}ms</span>
          </div>

          {lastFetchedAt && (
            <div className="hidden sm:block text-slate-400 font-mono">
              Sync: {lastFetchedAt.toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} SGT
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
