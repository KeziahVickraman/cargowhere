import React from 'react';
import { RefreshCw, Map, List, Bookmark, Calculator, Database } from 'lucide-react';

interface HeaderProps {
  activeTab: 'split' | 'map' | 'list' | 'favorites';
  setActiveTab: (tab: 'split' | 'map' | 'list' | 'favorites') => void;
  favoritesCount: number;
  onRefresh: () => void;
  isRefreshing: boolean;
  lastFetchedAt: Date | null;
  dataSource: string;
  onOpenCalculator: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  favoritesCount,
  onRefresh,
  isRefreshing,
  lastFetchedAt,
  dataSource,
  onOpenCalculator,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-4 sm:px-6 py-3.5 bg-white border-b border-slate-200 sticky top-0 z-50">
      {/* Zone 1: Single text element wordmark */}
      <a
        href="/"
        onClick={(e) => {
          e.preventDefault();
          setActiveTab('split');
        }}
        className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 flex items-center gap-2"
      >
        <span className="w-6 h-6 rounded-md bg-emerald-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
          P
        </span>
        <span>ParkSG Live</span>
      </a>

      {/* Zone 2: 4-5 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
        <button
          onClick={() => setActiveTab('split')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 ${
            activeTab === 'split'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent'
          }`}
        >
          Split View
        </button>

        <button
          onClick={() => setActiveTab('map')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 ${
            activeTab === 'map'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent'
          }`}
        >
          Map Focus
        </button>

        <button
          onClick={() => setActiveTab('list')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 ${
            activeTab === 'list'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent'
          }`}
        >
          Carpark Directory
        </button>

        <button
          onClick={() => setActiveTab('favorites')}
          className={`flex items-center gap-1.5 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 ${
            activeTab === 'favorites'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent'
          }`}
        >
          <span>Saved</span>
          {favoritesCount > 0 && (
            <span className="font-mono text-xs font-semibold px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded">
              {favoritesCount}
            </span>
          )}
        </button>

        <button
          onClick={onOpenCalculator}
          className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 text-slate-600"
        >
          <Calculator className="w-3.5 h-3.5 text-slate-500" />
          <span>Fee Calculator</span>
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Mobile Tab Toggles */}
        <div className="flex md:hidden items-center bg-slate-100 p-0.5 rounded-lg text-xs">
          <button
            onClick={() => setActiveTab('map')}
            className={`p-1.5 rounded-md ${activeTab === 'map' ? 'bg-white shadow-xs text-slate-900 font-semibold' : 'text-slate-600'}`}
            title="Map"
          >
            <Map className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`p-1.5 rounded-md ${activeTab === 'list' || activeTab === 'split' ? 'bg-white shadow-xs text-slate-900 font-semibold' : 'text-slate-600'}`}
            title="List"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`p-1.5 rounded-md relative ${activeTab === 'favorites' ? 'bg-white shadow-xs text-slate-900 font-semibold' : 'text-slate-600'}`}
            title="Saved"
          >
            <Bookmark className="w-4 h-4" />
            {favoritesCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500" />
            )}
          </button>
        </div>

        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-all whitespace-nowrap shrink-0 active:scale-95 disabled:opacity-75"
          title={`Sync real-time lots from ${dataSource}`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh Live Lots</span>
          <span className="sm:hidden">Refresh</span>
        </button>
      </div>
    </header>
  );
};
