import React from 'react';
import { Carpark, LotType } from '../types/carpark';
import { getAvailabilityStatus } from '../services/dataGovSgApi';
import { Bookmark, Calculator, ExternalLink, MapPin, Zap } from 'lucide-react';

interface CarparkCardProps {
  carpark: Carpark;
  isSelected: boolean;
  isFavorite: boolean;
  selectedVehicleType: LotType;
  onSelect: (carpark: Carpark) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onOpenCalculator: (carpark: Carpark, e: React.MouseEvent) => void;
  onOpenDetails: (carpark: Carpark) => void;
}

export const CarparkCard: React.FC<CarparkCardProps> = ({
  carpark,
  isSelected,
  isFavorite,
  selectedVehicleType,
  onSelect,
  onToggleFavorite,
  onOpenCalculator,
  onOpenDetails,
}) => {
  // Determine relevant lot type
  let activeLot = carpark.lots.cars;
  let vehicleName = 'Car';
  if (selectedVehicleType === 'Y' && carpark.lots.motorcycles) {
    activeLot = carpark.lots.motorcycles;
    vehicleName = 'Motorcycle';
  } else if (selectedVehicleType === 'H' && carpark.lots.heavyVehicles) {
    activeLot = carpark.lots.heavyVehicles;
    vehicleName = 'Heavy Vehicle';
  }

  const { availableLots, totalLots } = activeLot;
  const statusInfo = getAvailabilityStatus(availableLots, totalLots);
  const occupancyPercent = Math.min(100, Math.max(0, Math.round(((totalLots - availableLots) / totalLots) * 100)));

  return (
    <div
      onClick={() => onSelect(carpark)}
      className={`group relative p-4 rounded-xl border transition-all cursor-pointer ${
        isSelected
          ? 'bg-white border-slate-900 shadow-md ring-1 ring-slate-900'
          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
      }`}
    >
      {/* Top Header: Carpark Code & Name + Favorite */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span className="font-mono font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
              {carpark.carparkNumber}
            </span>
            <span>{carpark.type}</span>
            <span aria-hidden="true">·</span>
            <span>{carpark.town}</span>
            {carpark.distanceKm !== undefined && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono font-medium text-blue-600">{carpark.distanceKm} km away</span>
              </>
            )}
          </div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight truncate group-hover:text-emerald-700 transition-colors">
            {carpark.name}
          </h3>
        </div>

        <button
          onClick={(e) => onToggleFavorite(carpark.id, e)}
          className={`p-1.5 rounded-lg border transition-colors shrink-0 ${
            isFavorite
              ? 'bg-amber-50 text-amber-600 border-amber-200'
              : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 border-transparent'
          }`}
          title={isFavorite ? 'Remove from saved carparks' : 'Save carpark'}
          aria-label={isFavorite ? 'Remove bookmark' : 'Bookmark carpark'}
        >
          <Bookmark className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Address */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3.5">
        <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
        <span className="truncate">{carpark.address}</span>
      </div>

      {/* Lots Availability Metric Row */}
      <div className="bg-slate-50/80 rounded-lg p-3 border border-slate-100 mb-3">
        <div className="flex items-baseline justify-between mb-1.5">
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
              {availableLots}
            </span>
            <span className="text-xs text-slate-500 font-medium">/ {totalLots} lots</span>
            <span className="text-xs text-slate-400">({vehicleName})</span>
          </div>

          <span className={`text-xs font-bold tracking-wide ${statusInfo.color}`}>
            {statusInfo.status}
          </span>
        </div>

        {/* Progress Capacity Bar */}
        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              occupancyPercent > 90
                ? 'bg-rose-500'
                : occupancyPercent > 75
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${occupancyPercent}%` }}
          />
        </div>
      </div>

      {/* Secondary Vehicle Breakdown (if exists) */}
      <div className="flex items-center justify-between text-xs text-slate-500 mb-3.5 pt-0.5">
        <div className="flex items-center gap-3">
          {carpark.lots.motorcycles && (
            <div className="flex items-center gap-1">
              <span className="text-slate-400">Bike:</span>
              <span className="font-mono font-medium text-slate-700 tabular-nums">
                {carpark.lots.motorcycles.availableLots}
              </span>
            </div>
          )}
          {carpark.lots.heavyVehicles && (
            <div className="flex items-center gap-1">
              <span className="text-slate-400">Heavy:</span>
              <span className="font-mono font-medium text-slate-700 tabular-nums">
                {carpark.lots.heavyVehicles.availableLots}
              </span>
            </div>
          )}
          {carpark.evCharger.available && (
            <div className="flex items-center gap-1 text-emerald-700 font-medium">
              <Zap className="w-3 h-3 text-emerald-600" />
              <span>{carpark.evCharger.count} EV Chargers</span>
            </div>
          )}
        </div>

        <span className="text-[11px] text-slate-400">
          Max: {carpark.heightClearanceMeters}m
        </span>
      </div>

      {/* Rate Preview & Action Row */}
      <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs">
        <div className="text-slate-600 truncate max-w-[200px]" title={carpark.rates.weekdayDay}>
          <span className="font-semibold text-slate-800">Rate: </span>
          <span>{carpark.rates.weekdayDay.split('(')[0]}</span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={(e) => onOpenCalculator(carpark, e)}
            className="flex items-center gap-1 px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
            title="Calculate Parking Fee"
          >
            <Calculator className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-medium">Fee</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetails(carpark);
            }}
            className="flex items-center gap-1 px-2.5 py-1 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors font-medium"
          >
            <span>Details</span>
          </button>

          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${carpark.latitude},${carpark.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
            title="Navigate via Google Maps"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
