import React, { useState } from 'react';
import { Carpark } from '../types/carpark';
import { X, Calculator, ArrowRight, DollarSign } from 'lucide-react';

interface RateCalculatorModalProps {
  carparks: Carpark[];
  initialCarparkId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectCarparkForMap: (carpark: Carpark) => void;
}

export const RateCalculatorModal: React.FC<RateCalculatorModalProps> = ({
  carparks,
  initialCarparkId,
  isOpen,
  onClose,
  onSelectCarparkForMap,
}) => {
  const [selectedCarparkId, setSelectedCarparkId] = useState<string>(
    initialCarparkId || (carparks[0]?.id ?? '')
  );
  const [dayType, setDayType] = useState<'weekday' | 'saturday' | 'sunday'>('weekday');
  const [durationHours, setDurationHours] = useState<number>(2);
  const [durationMins, setDurationMins] = useState<number>(30);
  const [entryTimePeriod, setEntryTimePeriod] = useState<'day' | 'night'>('day');

  if (!isOpen) return null;

  const currentCarpark = carparks.find((c) => c.id === selectedCarparkId) || carparks[0];

  const calculateFee = (cp: Carpark) => {
    const totalMinutes = durationHours * 60 + durationMins;
    if (totalMinutes <= cp.rates.gracePeriodMinutes) {
      return { fee: 0, reason: `Free within ${cp.rates.gracePeriodMinutes}-minute grace period` };
    }

    if (dayType === 'sunday' && cp.rates.sundayAndPh.toLowerCase().includes('free')) {
      return { fee: 0, reason: 'Sunday / Public Holiday Free Parking' };
    }

    if (entryTimePeriod === 'night' && cp.rates.nightMaxCap) {
      return { fee: cp.rates.nightMaxCap, reason: `Capped at flat night rate ($${cp.rates.nightMaxCap.toFixed(2)})` };
    }

    // Standard rate calculation
    const halfHours = Math.ceil(totalMinutes / 30);
    const hourly = cp.rates.hourlyEstimate;
    const est = halfHours * (hourly / 2);
    return { fee: Math.round(est * 100) / 100, reason: `Standard rate (${totalMinutes} mins at approx $${hourly.toFixed(2)}/hr)` };
  };

  const currentFee = currentCarpark ? calculateFee(currentCarpark) : { fee: 0, reason: '' };

  // Calculate fees for other carparks in the same area to show smart comparison
  const areaAlternatives = currentCarpark
    ? carparks
        .filter((c) => c.area === currentCarpark.area && c.id !== currentCarpark.id)
        .map((c) => ({
          carpark: c,
          calc: calculateFee(c),
        }))
        .sort((a, b) => a.calc.fee - b.calc.fee)
        .slice(0, 3)
    : [];

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Singapore Parking Fee Calculator
              </h3>
              <p className="text-xs text-slate-500">
                Estimate real parking charges across any carpark in Singapore
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Carpark Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select Destination Carpark
            </label>
            <select
              value={selectedCarparkId}
              onChange={(e) => setSelectedCarparkId(e.target.value)}
              className="w-full text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium"
            >
              {carparks.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type} · {c.town}) — ~${c.rates.hourlyEstimate.toFixed(2)}/hr
                </option>
              ))}
            </select>
          </div>

          {/* Time & Duration Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Day of Visit
              </label>
              <select
                value={dayType}
                onChange={(e) => setDayType(e.target.value as any)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-900"
              >
                <option value="weekday">Weekday (Mon - Fri)</option>
                <option value="saturday">Saturday</option>
                <option value="sunday">Sunday / Public Holiday</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Entry Time
              </label>
              <select
                value={entryTimePeriod}
                onChange={(e) => setEntryTimePeriod(e.target.value as any)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-900"
              >
                <option value="day">Daytime (7:00 AM - 6:00 PM)</option>
                <option value="night">Evening / Night (6:00 PM onwards)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Parking Duration
              </label>
              <div className="flex items-center gap-1">
                <select
                  value={durationHours}
                  onChange={(e) => setDurationHours(Number(e.target.value))}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2 py-2 text-slate-900"
                >
                  {[0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 24].map((h) => (
                    <option key={h} value={h}>
                      {h} hr{h !== 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
                <select
                  value={durationMins}
                  onChange={(e) => setDurationMins(Number(e.target.value))}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2 py-2 text-slate-900"
                >
                  <option value={0}>00 min</option>
                  <option value={15}>15 min</option>
                  <option value={30}>30 min</option>
                  <option value={45}>45 min</option>
                </select>
              </div>
            </div>
          </div>

          {/* Result Card */}
          {currentCarpark && (
            <div className="bg-slate-900 text-white rounded-xl p-5 shadow-inner">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-xs text-slate-300 font-medium">
                  Estimated Total Fee for {durationHours}h {durationMins > 0 ? `${durationMins}m` : ''}
                </span>
                <span className="font-mono text-3xl font-extrabold text-emerald-400 tabular-nums">
                  ${currentFee.fee.toFixed(2)} SGD
                </span>
              </div>
              <div className="text-xs text-slate-400 border-t border-slate-800 pt-2 flex items-center justify-between">
                <span>{currentFee.reason}</span>
                <span className="text-[11px] font-mono text-slate-400">
                  Grace: {currentCarpark.rates.gracePeriodMinutes} mins free
                </span>
              </div>
            </div>
          )}

          {/* Nearby Alternatives Price Comparison */}
          {areaAlternatives.length > 0 && currentCarpark && (
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Nearby Alternatives in {currentCarpark.area}
              </h4>
              <div className="space-y-2">
                {areaAlternatives.map(({ carpark, calc }) => (
                  <div
                    key={carpark.id}
                    onClick={() => {
                      onSelectCarparkForMap(carpark);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-colors cursor-pointer text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-semibold text-slate-900 truncate">
                        {carpark.name}
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        {carpark.lots.cars.availableLots} lots available · {carpark.type}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono font-bold text-slate-900 tabular-nums">
                        ${calc.fee.toFixed(2)}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
