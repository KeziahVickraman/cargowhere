import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Carpark, FilterState, LotType } from './types/carpark';
import { fetchLiveCarparkData, FetchResult } from './services/dataGovSgApi';
import { Header } from './components/Header';
import { StatsBanner } from './components/StatsBanner';
import { FilterBar } from './components/FilterBar';
import { CarparkCard } from './components/CarparkCard';
import { CarparkMap } from './components/CarparkMap';
import { CarparkDetailsModal } from './components/CarparkDetailsModal';
import { RateCalculatorModal } from './components/RateCalculatorModal';
import {
  MapPin,
  Bookmark,
  Car,
  Zap,
  RotateCcw,
  Navigation,
  Info,
  Clock,
  ExternalLink,
} from 'lucide-react';

const FAVORITES_STORAGE_KEY = 'parksg_live_saved_carparks';

const INITIAL_FILTER: FilterState = {
  searchQuery: '',
  area: 'All',
  vehicleType: 'C',
  availableOnly: false,
  evChargingOnly: false,
  highClearanceOnly: false,
  carparkType: 'All',
  sortBy: 'availableLots',
};

export default function App() {
  const [carparks, setCarparks] = useState<Carpark[]>([]);
  const [filter, setFilter] = useState<FilterState>(INITIAL_FILTER);
  const [selectedCarpark, setSelectedCarpark] = useState<Carpark | null>(null);
  const [detailsCarpark, setDetailsCarpark] = useState<Carpark | null>(null);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [calculatorCarparkId, setCalculatorCarparkId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'split' | 'map' | 'list' | 'favorites'>('split');
  
  // Geolocation & Live Status
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);
  const [dataSource, setDataSource] = useState<string>('data.gov.sg (Live)');
  const [apiLatencyMs, setApiLatencyMs] = useState(120);
  const [liveMatchCount, setLiveMatchCount] = useState(0);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

  // Favorites saved in localStorage
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_STORAGE_KEY);
      return saved ? JSON.parse(saved) : ['mbs-01', 'ion-orchard-01', 'hdb-he12'];
    } catch {
      return ['mbs-01', 'ion-orchard-01', 'hdb-he12'];
    }
  });

  // Fetch initial data
  const loadData = useCallback(async (coords?: { lat: number; lng: number } | null) => {
    setIsRefreshing(true);
    try {
      const activeCoords = coords !== undefined ? coords : userCoords;
      const res: FetchResult = await fetchLiveCarparkData(
        activeCoords?.lat,
        activeCoords?.lng
      );
      setCarparks(res.carparks);
      setLastFetchedAt(res.lastFetchedAt);
      setDataSource(res.source);
      setApiLatencyMs(res.apiLatencyMs);
      setLiveMatchCount(res.liveMatchCount);

      // If a carpark is currently selected, update its reference
      setSelectedCarpark((prev) => {
        if (!prev) return res.carparks[0] || null;
        return res.carparks.find((c) => c.id === prev.id) || prev;
      });
    } catch (err) {
      console.error('Failed to load carpark data', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [userCoords]);

  // Request browser geolocation once on mount
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserCoords(coords);
          loadData(coords);
        },
        () => {
          // Geolocation declined or unavailable: load default Singapore center
          loadData(null);
        },
        { timeout: 5000, enableHighAccuracy: false }
      );
    } else {
      loadData(null);
    }
  }, []);

  // Periodic real-time auto-refresh (every 45s)
  useEffect(() => {
    if (!autoRefreshEnabled) return;
    const interval = setInterval(() => {
      loadData();
    }, 45000);
    return () => clearInterval(interval);
  }, [autoRefreshEnabled, loadData]);

  // Persist favorites
  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next));
      } catch (err) {
        console.error('Failed to save favorites to localStorage', err);
      }
      return next;
    });
  };

  const handleOpenCalculatorForCarpark = (carpark: Carpark, e: React.MouseEvent) => {
    e.stopPropagation();
    setCalculatorCarparkId(carpark.id);
    setIsCalculatorOpen(true);
  };

  const handleSelectTownPreset = (preset: { name: string; lat: number; lng: number }) => {
    setUserCoords({ lat: preset.lat, lng: preset.lng });
    // Find nearest carpark in that town
    const matched = carparks.find((c) =>
      c.name.toLowerCase().includes(preset.name.toLowerCase()) ||
      c.town.toLowerCase().includes(preset.name.toLowerCase()) ||
      c.area.toLowerCase().includes(preset.name.toLowerCase())
    );
    if (matched) {
      setSelectedCarpark(matched);
    }
    loadData({ lat: preset.lat, lng: preset.lng });
  };

  // Filtered & Sorted carparks
  const filteredCarparks = useMemo(() => {
    return carparks
      .filter((cp) => {
        // Favorites tab filter
        if (activeTab === 'favorites' && !favorites.includes(cp.id)) {
          return false;
        }

        // Search Query
        if (filter.searchQuery.trim()) {
          const q = filter.searchQuery.toLowerCase();
          const matchName = cp.name.toLowerCase().includes(q);
          const matchAddress = cp.address.toLowerCase().includes(q);
          const matchCode = cp.carparkNumber.toLowerCase().includes(q);
          const matchTown = cp.town.toLowerCase().includes(q);
          if (!matchName && !matchAddress && !matchCode && !matchTown) {
            return false;
          }
        }

        // Area Region
        if (filter.area !== 'All' && cp.area !== filter.area) {
          return false;
        }

        // Carpark Type
        if (filter.carparkType !== 'All' && cp.type !== filter.carparkType) {
          return false;
        }

        // Vehicle Lot Type availability
        let activeLot = cp.lots.cars;
        if (filter.vehicleType === 'Y') {
          if (!cp.lots.motorcycles) return false;
          activeLot = cp.lots.motorcycles;
        } else if (filter.vehicleType === 'H') {
          if (!cp.lots.heavyVehicles) return false;
          activeLot = cp.lots.heavyVehicles;
        }

        // Available Only
        if (filter.availableOnly && activeLot.availableLots <= 0) {
          return false;
        }

        // EV Charging
        if (filter.evChargingOnly && (!cp.evCharger.available || cp.evCharger.count <= 0)) {
          return false;
        }

        // High Clearance (>= 2.0m)
        if (filter.highClearanceOnly && cp.heightClearanceMeters < 2.0) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const getLotVal = (cp: Carpark) => {
          if (filter.vehicleType === 'Y') return cp.lots.motorcycles?.availableLots || 0;
          if (filter.vehicleType === 'H') return cp.lots.heavyVehicles?.availableLots || 0;
          return cp.lots.cars.availableLots;
        };

        if (filter.sortBy === 'availableLots') {
          return getLotVal(b) - getLotVal(a);
        }
        if (filter.sortBy === 'distance') {
          const distA = a.distanceKm ?? 9999;
          const distB = b.distanceKm ?? 9999;
          return distA - distB;
        }
        if (filter.sortBy === 'cheapest') {
          return a.rates.hourlyEstimate - b.rates.hourlyEstimate;
        }
        if (filter.sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        return 0;
      });
  }, [carparks, filter, activeTab, favorites]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 antialiased selection:bg-emerald-500 selection:text-white">
      {/* 3-Zone Top Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        favoritesCount={favorites.length}
        onRefresh={() => loadData()}
        isRefreshing={isRefreshing}
        lastFetchedAt={lastFetchedAt}
        dataSource={dataSource}
        onOpenCalculator={() => {
          setCalculatorCarparkId(selectedCarpark?.id || '');
          setIsCalculatorOpen(true);
        }}
      />

      {/* Real-Time Singapore Stats & Sync Status */}
      <StatsBanner
        carparks={carparks}
        selectedVehicleType={filter.vehicleType}
        lastFetchedAt={lastFetchedAt}
        dataSource={dataSource}
        apiLatencyMs={apiLatencyMs}
        liveMatchCount={liveMatchCount}
      />

      {/* Interactive Filter Bar */}
      <FilterBar
        filter={filter}
        onFilterChange={setFilter}
        totalFilteredCount={filteredCarparks.length}
        totalCarparksCount={carparks.length}
        onSelectTownPreset={handleSelectTownPreset}
      />

      {/* Main Viewport Content */}
      <main className="flex-1 w-full max-w-[1720px] mx-auto p-3 sm:p-5 flex flex-col">
        {/* Split View (Default): List on Left, Map on Right */}
        {activeTab === 'split' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-[640px]">
            {/* Left Column: Carpark Cards Directory (5 cols on large desktop) */}
            <div className="lg:col-span-5 flex flex-col">
              <div className="flex items-center justify-between mb-2.5 px-1">
                <span className="text-xs font-semibold text-slate-600">
                  {filteredCarparks.length} carpark{filteredCarparks.length !== 1 ? 's' : ''} located
                </span>
                <span className="text-[11px] text-slate-400">
                  Select a card to pinpoint on map
                </span>
              </div>

              <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-270px)] pr-1">
                {filteredCarparks.length > 0 ? (
                  filteredCarparks.map((cp) => (
                    <CarparkCard
                      key={cp.id}
                      carpark={cp}
                      isSelected={selectedCarpark?.id === cp.id}
                      isFavorite={favorites.includes(cp.id)}
                      selectedVehicleType={filter.vehicleType}
                      onSelect={(carpark) => setSelectedCarpark(carpark)}
                      onToggleFavorite={toggleFavorite}
                      onOpenCalculator={handleOpenCalculatorForCarpark}
                      onOpenDetails={(carpark) => setDetailsCarpark(carpark)}
                    />
                  ))
                ) : (
                  <EmptyStateView
                    onReset={() => setFilter(INITIAL_FILTER)}
                    hasFilters={
                      Boolean(filter.searchQuery) ||
                      filter.area !== 'All' ||
                      filter.availableOnly ||
                      filter.evChargingOnly ||
                      filter.highClearanceOnly ||
                      filter.carparkType !== 'All'
                    }
                  />
                )}
              </div>
            </div>

            {/* Right Column: Interactive Leaflet Map (7 cols) */}
            <div className="lg:col-span-7 flex flex-col h-[520px] lg:h-auto min-h-[500px]">
              <CarparkMap
                carparks={filteredCarparks}
                selectedCarpark={selectedCarpark}
                onSelectCarpark={(cp) => setSelectedCarpark(cp)}
                userCoords={userCoords}
                selectedVehicleType={filter.vehicleType}
              />
            </div>
          </div>
        )}

        {/* Map Focus View */}
        {activeTab === 'map' && (
          <div className="flex-1 flex flex-col h-[calc(100vh-230px)] min-h-[580px] relative">
            <CarparkMap
              carparks={filteredCarparks}
              selectedCarpark={selectedCarpark}
              onSelectCarpark={(cp) => setSelectedCarpark(cp)}
              userCoords={userCoords}
              selectedVehicleType={filter.vehicleType}
            />

            {/* Floating Quick Peek Card for Selected Carpark */}
            {selectedCarpark && (
              <div className="absolute top-4 right-4 z-[400] max-w-sm w-full bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-xl border border-slate-200 animate-in fade-in duration-150">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="font-mono text-[11px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                      {selectedCarpark.carparkNumber}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm mt-1">
                      {selectedCarpark.name}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedCarpark(null)}
                    className="text-slate-400 hover:text-slate-600 text-xs px-1"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex items-baseline gap-2 mb-3">
                  <span className="font-mono text-2xl font-black text-slate-900 tabular-nums">
                    {filter.vehicleType === 'Y'
                      ? selectedCarpark.lots.motorcycles?.availableLots ?? 0
                      : filter.vehicleType === 'H'
                      ? selectedCarpark.lots.heavyVehicles?.availableLots ?? 0
                      : selectedCarpark.lots.cars.availableLots}
                  </span>
                  <span className="text-xs text-slate-500">
                    lots available (
                    {filter.vehicleType === 'Y'
                      ? 'Motorcycles'
                      : filter.vehicleType === 'H'
                      ? 'Heavy'
                      : 'Cars'}
                    )
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setDetailsCarpark(selectedCarpark)}
                    className="flex-1 py-1.5 px-3 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors text-center"
                  >
                    View Rates & Details
                  </button>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${selectedCarpark.latitude},${selectedCarpark.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    title="Navigate"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Full Carpark Directory / List View */}
        {activeTab === 'list' && (
          <div className="flex-1 max-w-6xl mx-auto w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900">
                Singapore Carpark Directory ({filteredCarparks.length} Results)
              </h2>
              <span className="text-xs text-slate-500">
                Covering HDB, URA, Malls & CBD Towers
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCarparks.length > 0 ? (
                filteredCarparks.map((cp) => (
                  <CarparkCard
                    key={cp.id}
                    carpark={cp}
                    isSelected={selectedCarpark?.id === cp.id}
                    isFavorite={favorites.includes(cp.id)}
                    selectedVehicleType={filter.vehicleType}
                    onSelect={(carpark) => {
                      setSelectedCarpark(carpark);
                      setActiveTab('split');
                    }}
                    onToggleFavorite={toggleFavorite}
                    onOpenCalculator={handleOpenCalculatorForCarpark}
                    onOpenDetails={(carpark) => setDetailsCarpark(carpark)}
                  />
                ))
              ) : (
                <div className="col-span-full">
                  <EmptyStateView
                    onReset={() => setFilter(INITIAL_FILTER)}
                    hasFilters={true}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Favorites / Saved Carparks View */}
        {activeTab === 'favorites' && (
          <div className="flex-1 max-w-5xl mx-auto w-full">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Saved Bookmarked Carparks
                </h2>
                <p className="text-xs text-slate-500">
                  Quick access to your regular home, workplace, or preferred mall parking spots
                </p>
              </div>

              {favorites.length > 0 && (
                <button
                  onClick={() => {
                    setFavorites([]);
                    localStorage.removeItem(FAVORITES_STORAGE_KEY);
                  }}
                  className="text-xs text-slate-400 hover:text-rose-600 transition-colors"
                >
                  Clear All Saved
                </button>
              )}
            </div>

            {filteredCarparks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCarparks.map((cp) => (
                  <CarparkCard
                    key={cp.id}
                    carpark={cp}
                    isSelected={selectedCarpark?.id === cp.id}
                    isFavorite={true}
                    selectedVehicleType={filter.vehicleType}
                    onSelect={(carpark) => {
                      setSelectedCarpark(carpark);
                      setActiveTab('split');
                    }}
                    onToggleFavorite={toggleFavorite}
                    onOpenCalculator={handleOpenCalculatorForCarpark}
                    onOpenDetails={(carpark) => setDetailsCarpark(carpark)}
                  />
                ))}
              </div>
            ) : (
              <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
                <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
                  <Bookmark className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  No Saved Carparks Yet
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                  Click the bookmark icon on any carpark card to save it here for fast real-time monitoring.
                </p>
                <button
                  onClick={() => setActiveTab('split')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Browse All Carparks
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Details Modal */}
      <CarparkDetailsModal
        carpark={detailsCarpark}
        onClose={() => setDetailsCarpark(null)}
      />

      {/* Dedicated Standalone Rate Calculator Modal */}
      <RateCalculatorModal
        carparks={carparks}
        initialCarparkId={calculatorCarparkId}
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
        onSelectCarparkForMap={(cp) => {
          setSelectedCarpark(cp);
          setActiveTab('split');
        }}
      />
    </div>
  );
}

function EmptyStateView({
  onReset,
  hasFilters,
}: {
  onReset: () => void;
  hasFilters: boolean;
}) {
  return (
    <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3">
        <Car className="w-5 h-5 text-slate-400" />
      </div>
      <h3 className="text-sm font-bold text-slate-900 mb-1">
        No Carparks Matched
      </h3>
      <p className="text-xs text-slate-500 max-w-xs mx-auto mb-4">
        {hasFilters
          ? 'Try relaxing your search query, vehicle type, or clearance filters.'
          : 'Loading carparks from Singapore data feeds...'}
      </p>
      {hasFilters && (
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 mx-auto px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset All Filters</span>
        </button>
      )}
    </div>
  );
}
