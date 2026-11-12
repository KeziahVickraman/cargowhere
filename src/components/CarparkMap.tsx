import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Carpark, LotType } from '../types/carpark';
import { getAvailabilityStatus } from '../services/dataGovSgApi';
import { Navigation, Zap } from 'lucide-react';

interface CarparkMapProps {
  carparks: Carpark[];
  selectedCarpark: Carpark | null;
  onSelectCarpark: (carpark: Carpark) => void;
  userCoords: { lat: number; lng: number } | null;
  selectedVehicleType: LotType;
}

export const CarparkMap: React.FC<CarparkMapProps> = ({
  carparks,
  selectedCarpark,
  onSelectCarpark,
  userCoords,
  selectedVehicleType,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center on Singapore
    const map = L.map(mapContainerRef.current, {
      center: [1.3521, 103.8198],
      zoom: 12,
      zoomControl: false,
    });

    // High quality modern map tiles (CartoDB Voyager)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    // Zoom control in bottom right
    L.control
      .zoom({
        position: 'bottomright',
      })
      .addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update User Location Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userCoords) {
      const userIcon = L.divIcon({
        className: 'user-location-pin',
        html: `
          <div style="position: relative; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 22px; height: 22px; background: rgba(59, 130, 246, 0.3); border-radius: 9999px; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 14px; height: 14px; background: #2563eb; border: 2.5px solid white; border-radius: 9999px; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>
          </div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([userCoords.lat, userCoords.lng]);
      } else {
        userMarkerRef.current = L.marker([userCoords.lat, userCoords.lng], {
          icon: userIcon,
          zIndexOffset: 1000,
        }).addTo(map);
      }
    } else if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }
  }, [userCoords]);

  // Update Carpark Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    carparks.forEach((cp) => {
      let lotData = cp.lots.cars;
      if (selectedVehicleType === 'Y' && cp.lots.motorcycles) {
        lotData = cp.lots.motorcycles;
      } else if (selectedVehicleType === 'H' && cp.lots.heavyVehicles) {
        lotData = cp.lots.heavyVehicles;
      }

      const available = lotData.availableLots;
      const total = lotData.totalLots;
      const statusInfo = getAvailabilityStatus(available, total);
      const isSelected = selectedCarpark?.id === cp.id;

      // Custom marker pill showing lot numbers
      const markerHtml = `
        <div style="
          display: flex;
          align-items: center;
          gap: 4px;
          padding: ${isSelected ? '5px 9px' : '4px 7px'};
          background-color: ${isSelected ? '#0f172a' : '#ffffff'};
          color: ${isSelected ? '#ffffff' : '#0f172a'};
          border: 1.5px solid ${isSelected ? '#0f172a' : statusInfo.pinBg};
          border-radius: 8px;
          box-shadow: ${isSelected ? '0 8px 16px -2px rgba(0,0,0,0.3)' : '0 2px 6px rgba(0,0,0,0.15)'};
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'};
          transition: transform 0.15s ease, box-shadow 0.15s ease;
          white-space: nowrap;
        ">
          <span style="
            width: 7px;
            height: 7px;
            border-radius: 9999px;
            background-color: ${statusInfo.pinBg};
            display: inline-block;
          "></span>
          <span style="font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums;">
            ${available}
          </span>
          ${cp.evCharger.available ? '<span style="color: #059669; font-size: 9px; line-height: 1;">⚡</span>' : ''}
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-carpark-pin',
        html: markerHtml,
        iconSize: [60, 26],
        iconAnchor: [30, 13],
      });

      const marker = L.marker([cp.latitude, cp.longitude], {
        icon: customIcon,
        zIndexOffset: isSelected ? 500 : 100,
      });

      marker.on('click', () => {
        onSelectCarpark(cp);
      });

      markersLayer.addLayer(marker);
    });
  }, [carparks, selectedCarpark, selectedVehicleType, onSelectCarpark]);

  // Center on selected carpark
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedCarpark) return;

    map.flyTo([selectedCarpark.latitude, selectedCarpark.longitude], 15, {
      duration: 1.2,
      easeLinearity: 0.25,
    });
  }, [selectedCarpark]);

  const handleResetSingaporeView = () => {
    mapInstanceRef.current?.flyTo([1.3521, 103.8198], 12);
  };

  const handleFocusUserLocation = () => {
    if (userCoords && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([userCoords.lat, userCoords.lng], 15);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[380px] rounded-xl overflow-hidden border border-slate-200 shadow-xs bg-slate-100">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Map Controls */}
      <div className="absolute top-3 left-3 z-[400] flex flex-col gap-2">
        <button
          onClick={handleResetSingaporeView}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-800 text-xs font-semibold rounded-lg shadow-sm border border-slate-200 hover:bg-slate-50 active:scale-95 transition-all"
          title="Reset to whole Singapore view"
        >
          <span className="text-[10px]">🇸🇬</span>
          <span>Whole Singapore</span>
        </button>

        {userCoords && (
          <button
            onClick={handleFocusUserLocation}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-blue-700 text-xs font-semibold rounded-lg shadow-sm border border-blue-200 hover:bg-blue-50 active:scale-95 transition-all"
            title="Pan to My Current Location"
          >
            <Navigation className="w-3.5 h-3.5 text-blue-600" />
            <span>Near Me</span>
          </button>
        )}
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-3 left-3 z-[400] bg-white/95 backdrop-blur-xs px-3 py-2 rounded-lg border border-slate-200/80 shadow-xs text-xs text-slate-600 flex items-center gap-4">
        <div className="flex items-center gap-1.5 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1.5 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span>Filling Fast (&lt;25%)</span>
        </div>
        <div className="flex items-center gap-1.5 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
          <span>Full (&lt;5%)</span>
        </div>
        <div className="flex items-center gap-1 font-medium text-emerald-700">
          <Zap className="w-3 h-3 text-emerald-600" />
          <span>EV</span>
        </div>
      </div>
    </div>
  );
};
