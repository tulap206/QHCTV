"use client";

import React, { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';

export default function LeafletMap({ collaborators, onSelectCollaborator, onMapClick, height = '450px' }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const circlesRef = useRef([]);
  const [zoomLevel, setZoomLevel] = useState(14);
  const [leafletInstance, setLeafletInstance] = useState(null);

  // 1. Initialize Map ONCE on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let map = null;

    import('leaflet').then((L) => {
      setLeafletInstance(L);

      // Fix default Leaflet icon paths
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      const centerCoords = (collaborators && collaborators.length === 1) 
        ? [collaborators[0].lat, collaborators[0].lng] 
        : [16.4637, 107.5909];
      const initialZoom = (collaborators && collaborators.length === 1) ? 16 : 14;

      if (mapContainerRef.current) {
        map = L.map(mapContainerRef.current, {
          center: centerCoords,
          zoom: initialZoom,
          zoomControl: true,
          scrollWheelZoom: true
        });

        mapRef.current = map;

        // Register custom map click listener
        map.on('click', (e) => {
          if (onMapClick) {
            onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
          }
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Track zoom changes to toggle radar circles
        map.on('zoomend', () => {
          setZoomLevel(map.getZoom());
        });

        // Invalidate size after map renders to avoid grey/broken tiles layout issues
        setTimeout(() => {
          map.invalidateSize();
        }, 300);
      }
    });

    return () => {
      if (map) {
        map.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // 2. Render and update markers whenever collaborators or map zoom level changes
  useEffect(() => {
    if (!mapRef.current || !leafletInstance) return;
    const L = leafletInstance;
    const map = mapRef.current;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Clear old circles
    circlesRef.current.forEach(c => c.remove());
    circlesRef.current = [];

    if (!collaborators || collaborators.length === 0) return;

    if (collaborators.length === 1) {
      map.panTo([collaborators[0].lat, collaborators[0].lng]);
    }

    collaborators.forEach(ctv => {
      const position = [ctv.lat, ctv.lng];
      
      let activeColor = "#3B82F6";
      const c = String(ctv.classification || "CSBM").trim();
      if (c === "CSBM" || c === "CS") {
        activeColor = "#2563EB";
      } else if (c === "ĐT1") {
        activeColor = "#DC2626";
      } else if (c === "ĐT2") {
        activeColor = "#D97706";
      } else if (c === "ĐT3") {
        activeColor = "#4F46E5";
      } else if (c === "CTVDD" || c === "DD") {
        activeColor = "#0D9488";
      } else if (c === "HTBM" || c === "HT") {
        activeColor = "#0891B2";
      }
      
      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="
            position: relative;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="
              width: 14px;
              height: 14px;
              border-radius: 50%;
              background-color: ${activeColor};
              border: 2px solid white;
              box-shadow: 0 0 4px rgba(0,0,0,0.4);
            "></div>
          </div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      // Draw marker
      const marker = L.marker(position, { icon: customIcon }).addTo(map);
      
      const tooltipContent = `
        <div style="font-family: inherit; padding: 2px;">
          <div style="font-weight: 800; color: #1E293B; font-size: 13px;">${ctv.nickname}</div>
          <div style="font-size: 10px; color: #64748B; margin-bottom: 4px;">Mã: ${ctv.ma_so}</div>
          <div style="font-size: 11px; color: #334155;">📍 <b>Địa bàn:</b> ${ctv.address}</div>
          <div style="font-size: 11px; color: #334155;">👮 <b>Cán bộ phụ trách:</b> ${ctv.managing_officer || "—"}</div>
        </div>
      `;

      marker.bindTooltip(tooltipContent, {
        permanent: false,
        direction: 'right',
        offset: [10, 0],
        opacity: 0.95,
        className: 'leaflet-custom-tooltip'
      });

      marker.on('click', () => {
        if (onSelectCollaborator) {
          onSelectCollaborator(ctv);
        }
      });

      markersRef.current.push(marker);

      // Draw radar circle
      const radius = ctv.coverage_radius || 500;
      const radarCircle = L.circle(position, {
        radius: radius,
        color: activeColor,
        fillColor: activeColor,
        fillOpacity: 0.12,
        weight: 1.5,
        dashArray: '4, 4',
        className: 'radar-scanning-circle'
      });

      if (zoomLevel >= 15) {
        radarCircle.addTo(map);
      }

      circlesRef.current.push(radarCircle);
    });

    // Invalidate size on change to maintain correct mapping container coordinates
    map.invalidateSize();

  }, [collaborators, zoomLevel, leafletInstance]);

  return (
    <div style={{ position: 'relative', width: '100%', height: height }}>
      <style>{`
        .leaflet-custom-tooltip {
          background: #ffffff !important;
          border: 1px solid #E2E8F0 !important;
          border-radius: 10px !important;
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05) !important;
          padding: 8px 12px !important;
        }
        .leaflet-custom-tooltip::before {
          border-right-color: #ffffff !important;
        }
        
        /* Pulse Animation for Radar Scanning Circle */
        @keyframes pulse-radar {
          0% {
            stroke-width: 1.5px;
            opacity: 0.8;
          }
          50% {
            stroke-width: 3.5px;
            opacity: 0.45;
          }
          100% {
            stroke-width: 1.5px;
            opacity: 0.8;
          }
        }
        
        .radar-scanning-circle {
          animation: pulse-radar 2.5s ease-in-out infinite;
        }
      `}</style>
      <div 
        ref={mapContainerRef} 
        style={{ 
          height: '100%', 
          width: '100%', 
          borderRadius: '16px', 
          border: '1px solid #E5E7EB',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
        }} 
      />
    </div>
  );
}
