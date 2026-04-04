import React, { useState, useEffect } from 'react';
import { X, Search, Image as ImageIcon, Check, Loader2 } from 'lucide-react';
import { STOCK_IMAGES, StockImage } from '../constants/stockImages';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';

interface StockImagePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (image: StockImage) => void;
  type: 'hero' | 'logo';
  category: 'venue' | 'band' | 'generic';
}

export default function StockImagePicker({ isOpen, onClose, onSelect, type: initialType, category: initialCategory }: StockImagePickerProps) {
  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState<'hero' | 'logo'>(initialType);
  const [activeCategory, setActiveCategory] = useState<'venue' | 'band' | 'generic' | 'all'>(initialCategory);
  const [dynamicImages, setDynamicImages] = useState<StockImage[]>([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      fetchDynamicImages();
    }
  }, [isOpen]);

  async function fetchDynamicImages() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('stock_images')
        .select('*');
      
      if (data) {
        setDynamicImages(data);
      }
    } catch (error) {
      console.error('Error fetching dynamic stock images:', error);
    } finally {
      setLoading(false);
    }
  }

  const allImages = [...STOCK_IMAGES, ...dynamicImages];

  const filteredImages = allImages.filter(img => {
    const matchesType = img.type === activeType;
    const matchesCategory = activeCategory === 'all' || img.category === activeCategory || (activeCategory !== 'generic' && img.category === 'generic');
    const matchesSearch = img.label.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesCategory && matchesSearch;
  });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-12">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/90 backdrop-blur-md"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-6xl bg-neutral-900 border border-neutral-800 rounded-[3rem] overflow-hidden shadow-2xl flex flex-col h-full max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-8 py-6 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/50 backdrop-blur-md sticky top-0 z-10">
            <div>
              <h2 className="text-3xl font-bold text-white tracking-tight">Stock Image Library</h2>
              <p className="text-neutral-500 text-sm mt-1">Select professional photography for your profile</p>
            </div>
            <button 
              onClick={onClose}
              className="p-3 hover:bg-neutral-800 rounded-full text-neutral-400 hover:text-white transition-all hover:rotate-90"
            >
              <X size={28} />
            </button>
          </div>

          {/* Controls */}
          <div className="px-8 py-6 bg-neutral-900/30 border-b border-neutral-800 space-y-6">
            <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
              {/* Type Selector */}
              <div className="flex bg-neutral-800 p-1 rounded-2xl border border-neutral-700 w-full md:w-auto">
                <button
                  onClick={() => setActiveType('hero')}
                  className={`flex-1 md:flex-none px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeType === 'hero' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-neutral-500 hover:text-neutral-300'}`}
                >
                  Hero Banners
                </button>
                <button
                  onClick={() => setActiveType('logo')}
                  className={`flex-1 md:flex-none px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeType === 'logo' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-neutral-500 hover:text-neutral-300'}`}
                >
                  Logos
                </button>
              </div>

              {/* Search */}
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={20} />
                <input 
                  type="text"
                  placeholder="Search by label (e.g. 'Rock', 'Jazz', 'Neon')..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-2xl py-3.5 pl-12 pr-4 text-white focus:ring-2 focus:ring-red-600 outline-none transition-all placeholder:text-neutral-600"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'all', label: 'All Categories' },
                { id: 'venue', label: 'Venues' },
                { id: 'band', label: 'Bands' },
                { id: 'generic', label: 'Generic' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all ${
                    activeCategory === cat.id 
                      ? 'bg-white text-black border-white' 
                      : 'bg-transparent border-neutral-800 text-neutral-500 hover:border-neutral-600 hover:text-neutral-300'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-neutral-950/20">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-32">
                <Loader2 className="animate-spin text-red-600 mb-4" size={40} />
                <p className="text-neutral-500 animate-pulse">Loading stock library...</p>
              </div>
            ) : filteredImages.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {filteredImages.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => {
                      onSelect(img);
                      onClose();
                    }}
                    className="group relative aspect-square rounded-3xl overflow-hidden border border-neutral-800 hover:border-red-600 transition-all bg-neutral-800 shadow-xl hover:shadow-red-600/10"
                  >
                    <img 
                      src={img.thumbnail} 
                      alt={img.label}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4">
                      <p className="text-white text-sm font-bold truncate mb-1">{img.label}</p>
                      <p className="text-red-600 text-[10px] font-bold uppercase tracking-widest">{img.category}</p>
                    </div>
                    <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-2xl scale-75 group-hover:scale-100">
                      <Check size={18} className="text-white" />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 text-neutral-500">
                <div className="w-24 h-24 bg-neutral-900 rounded-full flex items-center justify-center mb-6 border border-neutral-800">
                  <ImageIcon size={40} className="opacity-20" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No images found</h3>
                <p className="text-neutral-500">Try adjusting your filters or search terms.</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-6 border-t border-neutral-800 bg-neutral-900/50 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-neutral-600 font-medium">
              Images provided by Unsplash. High-quality, royalty-free photography.
            </p>
            <div className="flex items-center gap-4">
              <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">
                {filteredImages.length} Images Available
              </span>
              <button 
                onClick={onClose}
                className="px-6 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
