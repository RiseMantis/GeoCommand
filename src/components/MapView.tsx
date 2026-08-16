import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { RegionData, HazardCategory } from '../types';

interface MapViewProps {
  regions: RegionData[];
  selectedRegion: RegionData;
  onSelectRegion: (region: RegionData) => void;
  hazardFilter: HazardCategory;
  activeLayers: {
    sarInundation: boolean;
    radarRainfall: boolean;
    thermalHotspots: boolean;
    evacuationZones: boolean;
  };
}

export const MapView: React.FC<MapViewProps> = ({
  regions,
  selectedRegion,
  onSelectRegion,
  hazardFilter,
  activeLayers,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [id: string]: L.Marker }>({});
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map once
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Center on South Asia / Central-South India to match screenshot
    const map = L.map(mapContainerRef.current, {
      center: [21.5, 79.5],
      zoom: 5.2,
      minZoom: 4,
      maxZoom: 13,
      zoomControl: false,
      attributionControl: false,
    });

    // Add minimal zoom controls in top right
    L.control.zoom({ position: 'topleft' }).addTo(map);

    // CartoDB Positron / Voyager muted tiles matching the screenshot's clean terrain palette
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    // Add subtle state & boundary labels layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19,
      opacity: 0.65,
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    layerGroupRef.current = layerGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers and Overlays whenever regions, selectedRegion, filter, or layers change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    // Clear old markers & shapes
    layerGroup.clearLayers();
    markersRef.current = {};

    // Filter regions if specific hazard selected
    const filteredRegions = regions.filter((r) => {
      if (hazardFilter === 'all') return true;
      return r.hazardVectors[hazardFilter] && r.hazardVectors[hazardFilter].probability > 0.3;
    });

    filteredRegions.forEach((region) => {
      const isSelected = region.id === selectedRegion.id;
      
      // Determine severity color
      const sev = region.overallSeverity;
      let colorClass = '#f43f5e'; // Critical (Coral/Pink)
      let ringColor = 'rgba(244, 63, 94, 0.4)';
      let badgeBg = 'bg-rose-500';

      if (sev === 'HIGH') {
        colorClass = '#f59e0b'; // High (Amber)
        ringColor = 'rgba(245, 158, 11, 0.4)';
        badgeBg = 'bg-amber-500';
      } else if (sev === 'MODERATE') {
        colorClass = '#818cf8'; // Moderate (Indigo)
        ringColor = 'rgba(129, 140, 248, 0.4)';
        badgeBg = 'bg-indigo-500';
      } else if (sev === 'LOW') {
        colorClass = '#10b981'; // Low (Green)
        ringColor = 'rgba(16, 185, 129, 0.4)';
        badgeBg = 'bg-emerald-500';
      }

      // Create Custom Pulse DivIcon
      const customIcon = L.divIcon({
        className: 'custom-pulse-marker',
        iconSize: isSelected ? [36, 36] : [26, 26],
        iconAnchor: isSelected ? [18, 18] : [13, 13],
        html: `
          <div style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            ${isSelected ? `<div class="ring-pulse" style="background-color: ${ringColor};"></div>` : ''}
            <div style="
              width: ${isSelected ? '20px' : '14px'};
              height: ${isSelected ? '20px' : '14px'};
              border-radius: 50%;
              background-color: ${colorClass};
              border: 2.5px solid #ffffff;
              box-shadow: 0 0 14px ${colorClass}, 0 2px 8px rgba(0,0,0,0.5);
              transition: transform 0.2s ease;
            "></div>
          </div>
        `,
      });

      const marker = L.marker([region.lat, region.lng], { icon: customIcon });

      marker.on('click', () => {
        onSelectRegion(region);
      });

      // Hover tooltip
      marker.bindTooltip(`
        <div style="
          background-color: #18181B;
          color: #FAFAFA;
          border: 1px solid #27272A;
          border-radius: 10px;
          padding: 8px 12px;
          font-family: inherit;
          font-size: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.6);
        ">
          <div style="font-weight: 700; color: #ffffff;">${region.name}</div>
          <div style="font-size: 11px; color: #a1a1aa; font-family: monospace;">${region.code} · ${region.overallSeverity}</div>
          <div style="margin-top: 4px; color: ${colorClass}; font-weight: 600;">
            ${region.hazardVectors[region.primaryHazard]?.label || 'Hazard'}: ${Math.round((region.hazardVectors[region.primaryHazard]?.probability || 0) * 100)}%
          </div>
        </div>
      `, {
        direction: 'top',
        offset: [0, -10],
        opacity: 1,
        className: 'custom-leaflet-tooltip',
      });

      marker.addTo(layerGroup);
      markersRef.current[region.id] = marker;

      // Draw active raster simulation overlays for the selected region
      if (isSelected) {
        // SAR Inundation buffer circle / ellipse
        if (activeLayers.sarInundation) {
          L.circle([region.lat, region.lng], {
            radius: 35000,
            color: '#2563eb',
            fillColor: '#3b82f6',
            fillOpacity: 0.18,
            weight: 1.5,
            dashArray: '4, 6',
          }).addTo(layerGroup);
        }

        // Radar Rainfall accumulation zone
        if (activeLayers.radarRainfall) {
          L.circle([region.lat + 0.08, region.lng - 0.05], {
            radius: 52000,
            color: '#0284c7',
            fillColor: '#38bdf8',
            fillOpacity: 0.12,
            weight: 1,
          }).addTo(layerGroup);
        }

        // Resource Staging point marker
        if (activeLayers.evacuationZones && region.resourceStaging) {
          const [stLat, stLng] = region.resourceStaging.coordinates;
          const stagingIcon = L.divIcon({
            className: 'staging-marker',
            iconSize: [22, 22],
            iconAnchor: [11, 11],
            html: `
              <div style="
                width: 18px;
                height: 18px;
                background-color: #10b981;
                border: 2px solid white;
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 0 10px #10b981;
                font-size: 10px;
                color: white;
                font-weight: bold;
              ">S</div>
            `,
          });

          L.marker([stLat, stLng], { icon: stagingIcon })
            .bindTooltip(`<b>Staging Depot:</b> ${region.resourceStaging.name}`, { direction: 'bottom' })
            .addTo(layerGroup);
        }
      }
    });

    // Pan map toward selected region smoothly
    if (selectedRegion && map) {
      map.flyTo([selectedRegion.lat, selectedRegion.lng], selectedRegion.zoomLevel || 8, {
        duration: 1.2,
        easeLinearity: 0.25,
      });
    }
  }, [regions, selectedRegion, hazardFilter, activeLayers]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#09090B]">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};
