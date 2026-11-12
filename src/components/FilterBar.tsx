import React from 'react';
import { FilterState, LotType } from '../types/carpark';
import {
  Search,
  SlidersHorizontal,
  Zap,
  Clock,
  ShieldCheck,
  Check,
  Car,
  Compass,
  ArrowUpDown,
} from 'lucide-react';

interface FilterBarProps {
  filter: FilterState;
  onFilterChange: (newFilter: FilterState) => void;
  totalFilteredCount: number;
  totalCarparksCount: number;
  onSelectTownPreset: (location: { name: string; lat: number; lng: number }) => void;
}

const AREAS = [
  'All',
  'Central',
  'Marina Bay',
  'Orchard',
  'Bugis',
  'East',
  'West',
  'North',
  'North-East',
  'South',
];

const PRESET_TOWNS = [
  { name: 'Marina Bay', lat: 1.2834, lng: 103.8607 },
  { name: 'Orchard Rd', lat: 1.3040, lng: 103.8319 },
  { name: 'Jewel Changi', lat: 1.3602, lng: 103.9897 },
  { name: 'Jurong East', lat: 1.3332, lng: 103.7436 },
  { name: 'Tampines', lat: 1.3526, lng: 103.9447 },
  { name: 'Woodlands', lat: 1.4361, lng: 103.7865 },
];

export const FilterBar: React.FC<FilterBarProps> = ({
  filter,
  onFilterChange,
  totalFilteredCount,
  totalCarparksCount,
  onSelectTownPreset,
}) => {
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filter, searchQuery: e.target.value });
  };

  const handleAreaChange = (area: string) => {
    onFilterChange({ ...filter, area });
  };

  const handleVehicleTypeChange = (vehicleType: LotType) => {
    onFilterChange({ ...filter, vehicleType });
  };

  const toggleAvailableOnly = () => {
    onFilterChange({ ...filter, availableOnly: !filter.availableOnly });
  };

  const toggleEvOnly = () => {
    onFilterChange({ ...filter, evChargingOnly: !filter.evChargingOnly });
  };

  const toggleHighClearance = () => {
    onFilterChange({ ...filter, highClearanceOnly: !filter.highClearanceOnly });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filter, sortBy: e.target.value as any });
  };

  const handleTypeChange = (type: string) => {
    onFilterChange({ ...filter, carparkType: type });
  };

  return (
    <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 space-y-3">
      {/* Row 1: Search Input & Sort & Vehicle Selector */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filter.searchQuery}
            onChange={handleTextChange}
            placeholder="Search by carpark name, road, or code (e.g., ION, HE12, Tampines)..."
            className="w-full text-xs sm:text-sm pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white transition-all"
          />
          {filter.searchQuery && (
            <button
              onClick={() => onFilterChange({ ...filter, searchQuery: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs px-1"
            >
              Clear
            </button>
          )}
        </div>

        {/* Vehicle Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0 self-start sm:self-auto">
          <button
            onClick={() => handleVehicleTypeChange('C')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              filter.vehicleType === 'C'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cars
          </button>
          <button
            onClick={() => handleVehicleTypeChange('Y')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              filter.vehicleType === 'Y'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Motorcycles
          </button>
          <button
            onClick={() => handleVehicleTypeChange('H')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              filter.vehicleType === 'H'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Heavy / Coach
          </button>
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2 shrink-0">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filter.sortBy}
            onChange={handleSortChange}
            aria-label="Sort carparks by"
            className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
          >
            <option value="availableLots">Most Lots Available</option>
            <option value="distance">Nearest Distance</option>
            <option value="cheapest">Cheapest Hourly Rate</option>
            <option value="name">Name (A to Z)</option>
          </select>
        </div>
      </div>

      {/* Row 2: Area Region Filter Buttons & Quick Jump */}
      <div className="flex items-center justify-between gap-3 overflow-x-auto no-scrollbar py-1">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">
            Region:
          </span>
          {AREAS.map((area) => (
            <button
              key={area}
              onClick={() => handleAreaChange(area)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                filter.area === area
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {area}
            </button>
          ))}
        </div>

        {/* Quick Town Jump */}
        <div className="hidden lg:flex items-center gap-1 text-xs text-slate-500 shrink-0 border-l border-slate-200 pl-3">
          <span className="text-[11px] text-slate-400 font-medium mr-1">Quick jump:</span>
          {PRESET_TOWNS.map((pt) => (
            <button
              key={pt.name}
              onClick={() => onSelectTownPreset(pt)}
              className="text-blue-600 hover:text-blue-800 hover:underline px-1 py-0.5 whitespace-nowrap text-xs"
            >
              {pt.name}
            </button>
          ))}
        </div>
      </div>

      {/* Row 3: Feature Filter Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={toggleAvailableOnly}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-medium transition-colors ${
              filter.availableOnly
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${filter.availableOnly ? 'bg-emerald-600' : 'bg-slate-300'}`} />
            <span>Available Only</span>
          </button>

          <button
            onClick={toggleEvOnly}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-medium transition-colors ${
              filter.evChargingOnly
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${filter.evChargingOnly ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span>EV Charging</span>
          </button>

          <button
            onClick={toggleHighClearance}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-medium transition-colors ${
              filter.highClearanceOnly
                ? 'bg-blue-50 text-blue-800 border-blue-300'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span className="font-mono text-[11px] font-bold">≥ 2.0m</span>
            <span>Clearance</span>
          </button>

          {/* Carpark Type Filter */}
          <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
            {['All', 'HDB', 'MALL', 'COMMERCIAL', 'URA'].map((t) => (
              <button
                key={t}
                onClick={() => handleTypeChange(t)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  filter.carparkType === t
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="text-[11px] text-slate-500 font-mono">
          Showing <span className="font-bold text-slate-800">{totalFilteredCount}</span> of {totalCarparksCount} carparks
        </div>
      </div>
    </div>
  );
};
