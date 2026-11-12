import React, { useState } from 'react';
import { Carpark } from '../types/carpark';
import { getAvailabilityStatus } from '../services/dataGovSgApi';
import {
  X,
  MapPin,
  Clock,
  ShieldCheck,
  Zap,
  Navigation,
  Copy,
  Check,
  Calculator,
  Calendar,
  AlertCircle,
} from 'lucide-react';

interface CarparkDetailsModalProps {
  carpark: Carpark | null;
  onClose: () => void;
}

export const CarparkDetailsModal: React.FC<CarparkDetailsModalProps> = ({
  carpark,
  onClose,
}) => {
  const [copiedCoords, setCopiedCoords] = useState(false);
  
  // Quick Fee Calculator State
  const [calcDay, setCalcDay] = useState<'weekday' | 'saturday' | 'sunday'>('weekday');
  const [calcHours, setCalcHours] = useState<number>(2);
  const [calcMinutes, setCalcMinutes] = useState<number>(0);
  const [calcPeriod, setCalcPeriod] = useState<'day' | 'night'>('day');

  if (!carpark) return null;

  const carStatus = getAvailabilityStatus(
    carpark.lots.cars.availableLots,
    carpark.lots.cars.totalLots
  );

  const handleCopyCoords = () => {
    navigator.clipboard.writeText(`${carpark.latitude}, ${carpark.longitude}`);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  // Estimate parking fee
  const calculateEstimatedFee = (): { totalFee: number; note: string } => {
    const totalMinutes = calcHours * 60 + calcMinutes;
    if (totalMinutes <= carpark.rates.gracePeriodMinutes) {
      return { totalFee: 0, note: `Within ${carpark.rates.gracePeriodMinutes}-min grace period (FREE)` };
    }

    if (calcDay === 'sunday' && carpark.rates.sundayAndPh.toLowerCase().includes('free')) {
      return { totalFee: 0, note: 'Free parking on Sundays / PH' };
    }

    if (calcPeriod === 'night' && carpark.rates.nightMaxCap) {
      return { totalFee: carpark.rates.nightMaxCap, note: `Night cap applied (max $${carpark.rates.nightMaxCap.toFixed(2)})` };
    }

    // Standard rate calculation estimate
    const hourly = carpark.rates.hourlyEstimate;
    const halfHours = Math.ceil(totalMinutes / 30);
    const estimated = (halfHours * (hourly / 2));
    return { totalFee: Math.round(estimated * 100) / 100, note: 'Estimated based on half-hour increments' };
  };

  const feeResult = calculateEstimatedFee();

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-start justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
              <span className="font-mono font-bold text-slate-800 bg-slate-200 px-2 py-0.5 rounded text-xs">
                {carpark.carparkNumber}
              </span>
              <span>{carpark.type} Carpark</span>
              <span aria-hidden="true">·</span>
              <span>{carpark.town}</span>
              <span aria-hidden="true">·</span>
              <span>{carpark.area} Region</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {carpark.name}
            </h2>
            <p className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{carpark.address}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Live Availability Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Real-Time Lots Availability
              </h4>
              <span className="text-[11px] text-slate-400 font-mono">
                Updated: {new Date(carpark.lastUpdated).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })} SGT
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Car Lots */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span className="font-medium">Car Lots</span>
                  <span className={`font-semibold ${carStatus.color}`}>
                    {carStatus.status}
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
                    {carpark.lots.cars.availableLots}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    / {carpark.lots.cars.totalLots}
                  </span>
                </div>
              </div>

              {/* Motorcycle Lots */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span className="font-medium">Motorcycle</span>
                  <span className="text-slate-400">Lots</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
                    {carpark.lots.motorcycles?.availableLots ?? 'N/A'}
                  </span>
                  {carpark.lots.motorcycles && (
                    <span className="text-xs text-slate-500 font-mono">
                      / {carpark.lots.motorcycles.totalLots}
                    </span>
                  )}
                </div>
              </div>

              {/* Heavy Vehicle Lots */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span className="font-medium">Heavy Vehicle</span>
                  <span className="text-slate-400">Lots</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
                    {carpark.lots.heavyVehicles?.availableLots ?? 'None'}
                  </span>
                  {carpark.lots.heavyVehicles && (
                    <span className="text-xs text-slate-500 font-mono">
                      / {carpark.lots.heavyVehicles.totalLots}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Parking Rates Breakdown Matrix */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Official Parking Rates & Charges
            </h4>

            <div className="rounded-xl border border-slate-200 overflow-hidden text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
                <div className="p-3.5 space-y-3 bg-white">
                  <div>
                    <div className="font-semibold text-slate-900 mb-0.5">Weekday Daytime</div>
                    <div className="text-slate-600">{carpark.rates.weekdayDay}</div>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 mb-0.5">Weekday Evening / Night</div>
                    <div className="text-slate-600">{carpark.rates.weekdayNight}</div>
                  </div>
                </div>

                <div className="p-3.5 space-y-3 bg-white">
                  <div>
                    <div className="font-semibold text-slate-900 mb-0.5">Saturday</div>
                    <div className="text-slate-600">{carpark.rates.saturday}</div>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 mb-0.5">Sunday & Public Holidays</div>
                    <div className="text-slate-600">{carpark.rates.sundayAndPh}</div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-3 border-t border-slate-200 flex items-center justify-between text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>
                    Grace Period: <strong>{carpark.rates.gracePeriodMinutes} minutes</strong> (Free drop-off)
                  </span>
                </div>
                {carpark.rates.nightMaxCap && (
                  <span className="font-medium text-slate-700">
                    Night Max Cap: ${carpark.rates.nightMaxCap.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Parking Fee Calculator */}
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30">
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="w-4 h-4 text-emerald-700" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Instant Parking Fee Estimator
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Day of Week
                </label>
                <select
                  value={calcDay}
                  onChange={(e) => setCalcDay(e.target.value as any)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                >
                  <option value="weekday">Weekday (Mon - Fri)</option>
                  <option value="saturday">Saturday</option>
                  <option value="sunday">Sunday / Public Holiday</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Time Window
                </label>
                <select
                  value={calcPeriod}
                  onChange={(e) => setCalcPeriod(e.target.value as any)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                >
                  <option value="day">Daytime (7am - 5pm/6pm)</option>
                  <option value="night">Evening / Overnight</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Parking Duration
                </label>
                <div className="flex items-center gap-1.5">
                  <select
                    value={calcHours}
                    onChange={(e) => setCalcHours(Number(e.target.value))}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  >
                    {[0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 24].map((h) => (
                      <option key={h} value={h}>
                        {h} {h === 1 ? 'hr' : 'hrs'}
                      </option>
                    ))}
                  </select>
                  <select
                    value={calcMinutes}
                    onChange={(e) => setCalcMinutes(Number(e.target.value))}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  >
                    <option value={0}>00 min</option>
                    <option value={15}>15 min</option>
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-emerald-100">
              <span className="text-xs text-slate-600">{feeResult.note}</span>
              <div className="flex items-baseline gap-1">
                <span className="text-xs text-slate-500 font-medium">Estimated Fee:</span>
                <span className="font-mono text-xl font-bold text-emerald-700 tabular-nums">
                  ${feeResult.totalFee.toFixed(2)} SGD
                </span>
              </div>
            </div>
          </div>

          {/* Carpark Specifications & Facilities */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
              <div className="font-bold text-slate-900 mb-1">System & Facilities</div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Parking System:</span>
                <span className="font-semibold text-slate-800">
                  {carpark.hasElectronicParking ? 'Electronic Parking System (EPS)' : 'CashCard / Coupon'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Vehicle Clearance:</span>
                <span className="font-mono font-semibold text-slate-800">
                  {carpark.heightClearanceMeters} meters
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Coordinates:</span>
                <button
                  onClick={handleCopyCoords}
                  className="flex items-center gap-1 font-mono text-[11px] text-blue-600 hover:text-blue-800"
                >
                  <span>{carpark.latitude}, {carpark.longitude}</span>
                  {copiedCoords ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
              <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-600" />
                <span>EV Charging Hub</span>
              </div>
              {carpark.evCharger.available ? (
                <>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Available Chargers:</span>
                    <span className="font-semibold text-emerald-700 font-mono">
                      {carpark.evCharger.count} Lots
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Operator:</span>
                    <span className="font-semibold text-slate-800">
                      {carpark.evCharger.operator || 'Public Network'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Charging Speed:</span>
                    <span className="font-mono text-slate-700">
                      Up to {carpark.evCharger.powerKw} kW
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-slate-400 italic">No dedicated EV chargers installed at this facility.</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">
            ID: {carpark.id}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Close
            </button>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${carpark.latitude},${carpark.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Start Navigation</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
