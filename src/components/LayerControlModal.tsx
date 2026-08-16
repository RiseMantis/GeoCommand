import React from 'react';
import { Layers, Eye, EyeOff, X, Check, Droplet, Flame, Mountain, Navigation } from 'lucide-react';

interface LayerControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeLayers: {
    sarInundation: boolean;
    radarRainfall: boolean;
    thermalHotspots: boolean;
    evacuationZones: boolean;
  };
  onToggleLayer: (layerKey: 'sarInundation' | 'radarRainfall' | 'thermalHotspots' | 'evacuationZones') => void;
}

export const LayerControlModal: React.FC<LayerControlModalProps> = ({
  isOpen,
  onClose,
  activeLayers,
  onToggleLayer,
}) => {
  if (!isOpen) return null;

  const layersList: Array<{
    key: 'sarInundation' | 'radarRainfall' | 'thermalHotspots' | 'evacuationZones';
    name: string;
    description: string;
    source: string;
    color: string;
    active: boolean;
  }> = [
    {
      key: 'sarInundation',
      name: 'Sentinel-1 SAR Inundation Mask',
      description: 'Calculates high-resolution backscatter thresholding to delineate active flood extent in all weather conditions.',
      source: 'ESA Copernicus C-Band (10m)',
      color: 'text-indigo-400',
      active: activeLayers.sarInundation,
    },
    {
      key: 'radarRainfall',
      name: 'GPM IMERG Rain Accumulation',
      description: 'Multi-satellite fused precipitation grid mapping 30-minute cloudburst vectors and runoff surges.',
      source: 'NASA / JAXA DPR & Microwave',
      color: 'text-cyan-400',
      active: activeLayers.radarRainfall,
    },
    {
      key: 'thermalHotspots',
      name: 'MODIS / VIIRS Thermal Infrared',
      description: 'Brightness temperature anomaly contours detecting active wildfire fronts and perimeter expansion.',
      source: 'NOAA / NASA VIIRS 375m',
      color: 'text-rose-400',
      active: activeLayers.thermalHotspots,
    },
    {
      key: 'evacuationZones',
      name: 'Tactical Staging & Safe Depots',
      description: 'Resource staging coordinates, emergency boat caches, and elevated corridor assembly zones.',
      source: 'Civil Defence GIS Layer',
      color: 'text-emerald-400',
      active: activeLayers.evacuationZones,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-[#18181B] border border-[#27272A] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-[#FAFAFA] animate-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between border-b border-[#27272A] pb-3">
          <div className="flex items-center space-x-2.5">
            <Layers className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-zinc-100">
              Satellite Raster Overlays & Geospatial Layers
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2.5">
          {layersList.map((layer) => (
            <div
              key={layer.key}
              onClick={() => onToggleLayer(layer.key)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                layer.active
                  ? 'bg-zinc-900 border-zinc-700 shadow-sm'
                  : 'bg-[#09090B] border-[#27272A] opacity-60 hover:opacity-90'
              }`}
            >
              <div className="space-y-1 pr-3">
                <div className="flex items-center space-x-2">
                  <span className={`font-semibold text-xs text-white`}>{layer.name}</span>
                </div>
                <div className="text-[11px] text-zinc-400 leading-snug">
                  {layer.description}
                </div>
                <div className="text-[10px] font-mono-code text-blue-400">
                  {layer.source}
                </div>
              </div>

              <button
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors flex-shrink-0 ${
                  layer.active
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-800 text-zinc-500 group-hover:text-zinc-300'
                }`}
              >
                {layer.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>
          ))}
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm"
          >
            Apply Layer Configuration
          </button>
        </div>
      </div>
    </div>
  );
};
