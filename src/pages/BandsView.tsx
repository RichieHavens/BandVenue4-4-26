import React, { useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Band } from '../types';
import { Search, Loader2, Music, Filter, Star } from 'lucide-react';
import { STOCK_IMAGES } from '../constants/stockImages';
import { formatDate } from '../lib/utils';
import ProfilePreviewModal from '../components/ProfilePreviewModal';

export function BandsView() {
  const [bands, setBands] = useState<Band[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [showFavorites, setShowFavorites] = useState(false);
  const [selectedBand, setSelectedBand] = useState<Band | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  React.useEffect(() => {
    fetchBands();
  }, []);

  async function fetchBands() {
    try {
      const { data, error } = await supabase
        .from('bands')
        .select('*, band_genres(genres(name)), profiles!updated_by(first_name, last_name)')
        .eq('is_published', true)
        .or('is_archived.is.null,is_archived.eq.false')
        .order('name');
      if (error) throw error;
      if (data) {
        const processed = data.map(b => ({
          ...b,
          genres: (b as any).band_genres?.map((bg: any) => bg.genres?.name).filter(Boolean) || []
        }));
        setBands(processed);
      }
    } catch (err: any) {
      console.error('Error fetching bands:', err.message || err);
    } finally {
      setLoading(false);
    }
  }

  const allGenres = useMemo(() => {
    const genres = new Set<string>();
    bands.forEach(b => (b as any).genres?.forEach((g: string) => genres.add(g)));
    return ['All', ...Array.from(genres).sort()];
  }, [bands]);

  const filtered = bands.filter(b => {
    const matchesSearch = b.name.toLowerCase().includes(search.toLowerCase());
    const matchesGenre = selectedGenre === 'All' || (b as any).genres?.includes(selectedGenre);
    // Note: Favorites logic would require a 'favorites' table or similar, 
    // for now we'll just mock it or skip if not implemented.
    return matchesSearch && matchesGenre;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-4xl font-bold tracking-tight">Local Bands</h2>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
            <input
              type="text"
              placeholder="Enter Band Name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2 pl-12 pr-4 text-sm focus:ring-2 focus:ring-red-600 outline-none transition-all"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-neutral-500" />
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-xl py-2 px-4 text-sm focus:ring-2 focus:ring-red-600 outline-none"
            >
              {allGenres.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <button
            onClick={() => setShowFavorites(!showFavorites)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${showFavorites ? 'bg-red-600/20 border-red-600 text-red-500' : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'}`}
          >
            <Star size={18} fill={showFavorites ? 'currentColor' : 'none'} />
            <span className="text-sm font-medium">Favorites</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-red-600" size={48} /></div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((band) => {
            const defaultBandLogo = STOCK_IMAGES.find(img => img.type === 'logo' && img.category === 'band')?.url;
            return (
              <div 
                key={band.id} 
                className="flex items-center gap-4 p-4 bg-neutral-900 border border-neutral-800 rounded-2xl cursor-pointer hover:border-neutral-700 transition-all group"
                onClick={() => {
                  setSelectedBand(band);
                  setIsPreviewOpen(true);
                }}
              >
                <div className="w-16 h-16 rounded-full bg-neutral-800 overflow-hidden shrink-0 border border-neutral-700">
                  <img 
                    src={band.logo_url || band.images?.[0] || defaultBandLogo} 
                    alt={band.name} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm truncate">{band.name}</h3>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(band as any).genres?.slice(0, 2).map((g: string) => (
                      <span key={g} className="text-[9px] font-bold uppercase tracking-widest text-red-600/70 truncate">{g}</span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-12 text-center">
          <Music className="mx-auto text-neutral-700 mb-4" size={48} />
          <p className="text-neutral-500">No bands found.</p>
        </div>
      )}

      <ProfilePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        type="band"
        data={selectedBand}
      />
    </div>
  );
}
