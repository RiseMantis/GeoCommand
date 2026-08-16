import React, { useState } from 'react';
import { Search, Sparkles, Loader2, X, Compass, ArrowRight } from 'lucide-react';
import { RegionData } from '../types';

interface SearchBarProps {
  onSearchResult: (regionId: string, explanation?: string) => void;
  regions: RegionData[];
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearchResult, regions }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchFeedback, setSearchFeedback] = useState<{
    text: string;
    source: string;
    matchedRegionName?: string;
  } | null>(null);

  const presetQueries = [
    'flag river basins with rising SAR inundation...',
    'show slope failure & landslide risk in Western Ghats',
    'detect severe thermal anomalies & wildfire ignition in Odisha',
    'monitor cyclone barometric surge near Paradip port',
    'evaluate agricultural drought stress & reservoir deficit',
  ];

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setShowSuggestions(false);

    try {
      // Call server-side API endpoint with Gemini processing
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.matchedRegionId) {
          const region = regions.find((r) => r.id === data.matchedRegionId);
          onSearchResult(data.matchedRegionId, data.reasoning);
          setSearchFeedback({
            text: data.reasoning || `Matched region ${region?.name || data.matchedRegionId}`,
            source: data.source === 'gemini-ai' ? 'Gemini 3.7 Cross-Modal AI' : 'Heuristic Ingestion Engine',
            matchedRegionName: region?.name,
          });
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn('API search failed, evaluating client fallback:', err);
    }

    // Client-side fallback keyword search
    const q = searchQuery.toLowerCase();
    let target = regions[0];
    if (q.includes('landslide') || q.includes('wayanad') || q.includes('kerala') || q.includes('slope')) {
      target = regions.find((r) => r.id === 'wayanad-hills') || regions[1];
    } else if (q.includes('fire') || q.includes('wildfire') || q.includes('thermal') || q.includes('simlipal') || q.includes('odisha')) {
      target = regions.find((r) => r.id === 'simlipal-forest') || regions[2];
    } else if (q.includes('cyclone') || q.includes('surge') || q.includes('paradip') || q.includes('wind')) {
      target = regions.find((r) => r.id === 'paradip-coast') || regions[3];
    } else if (q.includes('drought') || q.includes('smap') || q.includes('marathwada') || q.includes('moisture')) {
      target = regions.find((r) => r.id === 'marathwada-basin') || regions[4];
    } else if (q.includes('glof') || q.includes('glacial') || q.includes('teesta') || q.includes('sikkim')) {
      target = regions.find((r) => r.id === 'teesta-gorge') || regions[5];
    } else {
      target = regions.find((r) => r.id === 'kali-basin') || regions[0];
    }

    onSearchResult(target.id, `Heuristic matched ${target.name} based on multi-sensor keywords.`);
    setSearchFeedback({
      text: `Matched ${target.name} based on cross-modal risk profile.`,
      source: 'Cross-Modal Rule Matcher',
      matchedRegionName: target.name,
    });
    setLoading(false);
  };

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl z-20">
      <div className="relative group">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch(query);
          }}
          className="relative flex items-center shadow-2xl rounded-2xl overflow-hidden border border-[#27272A] bg-[#18181B]/95 backdrop-blur-md transition-all focus-within:border-blue-500/80 focus-within:ring-2 focus-within:ring-blue-500/20"
        >
          <div className="pl-4 pr-2 text-zinc-400">
            {loading ? (
              <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
            ) : (
              <Search className="w-5 h-5 text-zinc-400 group-focus-within:text-blue-400 transition-colors" />
            )}
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            placeholder="e.g. flag river basins with rising SAR inundation..."
            className="w-full py-3.5 px-2 bg-transparent text-sm text-[#FAFAFA] placeholder-zinc-500 focus:outline-none font-sans"
          />

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSearchFeedback(null);
              }}
              className="p-1 mr-1 text-zinc-400 hover:text-zinc-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            type="submit"
            disabled={loading}
            className="m-1 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm active:scale-95"
          >
            <span>Query</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Suggestion Dropdown */}
        {showSuggestions && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-[#18181B]/95 backdrop-blur-md border border-[#27272A] rounded-2xl shadow-2xl p-3 z-30 animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="flex items-center justify-between text-xs text-zinc-400 px-2 pb-2 border-b border-[#27272A]">
              <span className="flex items-center space-x-1.5 font-bold uppercase tracking-widest text-[10px] text-blue-400">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Natural Language Satellite Fusion Queries</span>
              </span>
              <button
                type="button"
                onClick={() => setShowSuggestions(false)}
                className="text-zinc-500 hover:text-zinc-300 text-xs"
              >
                Close
              </button>
            </div>

            <div className="pt-2 space-y-1">
              {presetQueries.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    const clean = preset.replace('...', '');
                    setQuery(clean);
                    handleSearch(clean);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs md:text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors flex items-center justify-between group"
                >
                  <span className="truncate">{preset}</span>
                  <span className="text-[10px] text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity font-mono-code font-bold">
                    Run →
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* AI Search Feedback Banner */}
      {searchFeedback && (
        <div className="mt-2 px-3.5 py-2.5 rounded-xl bg-[#18181B]/95 backdrop-blur-md border border-[#27272A] text-xs text-zinc-200 shadow-xl flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center space-x-2 truncate">
            <Sparkles className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <span className="truncate font-medium text-zinc-100">
              {searchFeedback.matchedRegionName ? `Sector: ${searchFeedback.matchedRegionName} — ` : ''}
              {searchFeedback.text}
            </span>
          </div>
          <span className="text-[10px] bg-blue-950/60 border border-blue-500/30 text-blue-300 px-2 py-0.5 rounded-full font-mono-code font-bold flex-shrink-0 ml-2">
            {searchFeedback.source}
          </span>
        </div>
      )}
    </div>
  );
};
