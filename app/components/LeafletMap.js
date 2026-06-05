"use client";

import React, { useEffect, useRef, useState } from 'react';

export default function LeafletMap({ collaborators, onSelectCollaborator }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const circlesRef = useRef([]);
  const [zoomLevel, setZoomLevel] = useState(14);

  useEffect(() => {
    // Check if we are in browser environment
    if (typeof window === 'undefined') return;

    // Ensure Leaflet is loaded
    import('leaflet').then((L) => {
      // Fix default Leaflet icon paths
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      // If map is already initialized, clear it
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      // Initialize Map centering at Hue City
      const map = L.map(mapContainerRef.current, {
        center: [16.4637, 107.5909],
        zoom: 14,
        zoomControl: true,
        scrollWheelZoom: true
      });

      mapRef.current = map;

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      // Track zoom changes to toggle radar circles
      map.on('zoomend', () => {
        setZoomLevel(map.getZoom());
      });

      renderMarkers(L, map);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [collaborators]);

  // Re-render markers/circles when zoom level or collaborators list changes
  useEffect(() => {
    if (!mapRef.current) return;
    
    // Import Leaflet again to get access to L inside the update effect
    import('leaflet').then((L) => {
      updateRadarCircles(L, mapRef.current);
    });
  }, [zoomLevel, collaborators]);

  const renderMarkers = (L, map) => {
    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Clear old circles
    circlesRef.current.forEach(c => c.remove());
    circlesRef.current = [];

    if (!collaborators || collaborators.length === 0) return;

    collaborators.forEach(ctv => {
      const position = [ctv.lat, ctv.lng];

      // Custom marker icon using HTML/CSS for styled dots
      const activeColor = ctv.status === "hoat_dong" || !ctv.status ? "#22C55E" : (ctv.status === "tam_khoa" ? "#F59E0B" : "#EF4444");
      
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

      // 1. Draw collaborator marker
      const marker = L.marker(position, { icon: customIcon }).addTo(map);
      
      // Hover hovercard tooltip
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

      // Onclick event callback to open detail view
      marker.on('click', () => {
        if (onSelectCollaborator) {
          onSelectCollaborator(ctv);
        }
      });

      markersRef.current.push(marker);

      // 2. Draw radar coverage circle (if zoom is close enough >= 15)
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

      if (map.getZoom() >= 15) {
        radarCircle.addTo(map);
      }

      circlesRef.current.push({
        circle: radarCircle,
        ctvId: ctv.id
      });
    });
  };

  const updateRadarCircles = (L, map) => {
    const currentZoom = map.getZoom();
    
    circlesRef.current.forEach(({ circle }) => {
      if (currentZoom >= 15) {
        if (!map.hasLayer(circle)) {
          circle.addTo(map);
        }
      } else {
        if (map.hasLayer(circle)) {
          circle.remove();
        }
      }
    });
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '450px' }}>
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
            stroke-width: 2px;
            opacity: 0.8;
          }
          50% {
            stroke-width: 4px;
            opacity: 0.4;
          }
          100% {
            stroke-width: 2px;
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
