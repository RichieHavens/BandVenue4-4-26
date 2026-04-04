import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../AuthContext';
import { Band } from '../types';
import { Save, Loader2, Trash2, Plus, Video, Eye, Image as ImageIcon, MapPin } from 'lucide-react';
import { US_STATES, CA_PROVINCES, AddressParts, formatAddress, parseAddress, validateZipForState } from '../lib/geo';
import ImageUpload from './ImageUpload';
import StockImagePicker from './StockImagePicker';
import { formatPhoneNumber } from '../lib/phoneFormatter';
import ProfilePreviewModal from './ProfilePreviewModal';
import { handleSupabaseError, OperationType } from '../lib/error-handler';

export default function BandProfileEditor({ bandId, onDirtyChange, onSaveSuccess }: { bandId?: string, onDirtyChange?: (dirty: boolean) => void, onSaveSuccess?: () => void }) {
  const { user, profile } = useAuth();
  const [band, setBand] = useState<Partial<Band>>({
    name: '',
    description: '',
    address: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
    phone: '',
    email: '',
    website: '',
    linkedin_url: '',
    pinterest_url: '',
    youtube_url: '',
    instagram_url: '',
    apple_music_url: '',
    spotify_url: '',
    facebook_url: '',
    logo_url: '',
    hero_url: '',
    images: [],
    video_links: []
  });
  const [initialBand, setInitialBand] = useState<Partial<Band> | null>(null);
  const [addressParts, setAddressParts] = useState<AddressParts>(parseAddress(''));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isStockPickerOpen, setIsStockPickerOpen] = useState(false);
  const [stockPickerConfig, setStockPickerConfig] = useState<{ type: 'hero' | 'logo', category: 'venue' | 'band' | 'generic' }>({ type: 'hero', category: 'band' });

  useEffect(() => {
    if (!initialBand) return;
    const isDirty = 
      band.name !== initialBand.name ||
      band.description !== initialBand.description ||
      band.phone !== initialBand.phone ||
      band.email !== initialBand.email ||
      band.website !== initialBand.website ||
      band.linkedin_url !== initialBand.linkedin_url ||
      band.pinterest_url !== initialBand.pinterest_url ||
      band.youtube_url !== initialBand.youtube_url ||
      band.instagram_url !== initialBand.instagram_url ||
      band.apple_music_url !== initialBand.apple_music_url ||
      band.spotify_url !== initialBand.spotify_url ||
      band.facebook_url !== initialBand.facebook_url ||
      band.logo_url !== initialBand.logo_url ||
      band.hero_url !== initialBand.hero_url ||
      JSON.stringify(band.images) !== JSON.stringify(initialBand.images) ||
      JSON.stringify(band.video_links) !== JSON.stringify(initialBand.video_links);
    
    onDirtyChange?.(isDirty);
  }, [band, initialBand, onDirtyChange]);

  useEffect(() => {
    fetchBand();
  }, [bandId, user]);

  async function fetchBand() {
    try {
      // 1. Get the person record for this user if it exists
      const { data: personData } = await supabase
        .from('people')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      let query = supabase.from('bands').select('*');
      
      if (bandId) {
        query = query.eq('id', bandId);
      } else if (personData) {
        // If they have a person record, check both manager_id and person_id
        query = query.or(`manager_id.eq.${user?.id},person_id.eq.${personData.id}`);
      } else {
        query = query.eq('manager_id', user?.id);
      }
      
      const { data, error } = await query.limit(1).maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      const defaultBand = {
        name: '',
        description: '',
        phone: '',
        email: '',
        website: '',
        linkedin_url: '',
        pinterest_url: '',
        youtube_url: '',
        instagram_url: '',
        apple_music_url: '',
        spotify_url: '',
        facebook_url: '',
        logo_url: '',
        hero_url: '',
        images: [],
        video_links: []
      };

      if (data) {
        const cleanedData = {
          ...defaultBand,
          ...data,
          phone: data.phone || profile?.phone || '',
          email: data.email || profile?.email || '',
          logo_url: data.logo_url || '',
          hero_url: data.hero_url || '',
          images: data.images || [],
          video_links: data.video_links || []
        };
        setBand(cleanedData);
        setInitialBand(cleanedData);
        setAddressParts({
          street: data.street || '',
          city: data.city || '',
          state: data.state || '',
          zip: data.zip || '',
          country: data.country || 'US'
        });
      } else {
        setBand(defaultBand);
        setInitialBand(defaultBand);
      }
    } catch (error) {
      console.error('Error fetching band:', error);
    } finally {
      setLoading(false);
    }
  }

  async function logUpdate(bandId: string, changes: any) {
    try {
      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        table_name: 'bands',
        record_id: bandId,
        changes: changes
      });
    } catch (error) {
      console.error('Error logging update:', error);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const zipValidation = validateZipForState(addressParts.zip, addressParts.state, addressParts.country);
    if (!zipValidation.isValid) {
      setMessage({ type: 'error', text: zipValidation.message || 'Invalid Zip/Postal Code for the selected state/province.' });
      setSaving(false);
      return;
    }

    try {
      // Sanitize band data to remove joined data that doesn't belong in the bands table
      const { 
        profiles, 
        band_genres, 
        acts, 
        ...cleanBand 
      } = band as any;

      const changes: any = {};
      Object.keys(cleanBand).forEach(key => {
        if (cleanBand[key] !== (initialBand as any)[key]) {
          changes[key] = cleanBand[key];
        }
      });

      // 1. Get the person record for this user if it exists
      const { data: personData } = await supabase
        .from('people')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle();

      const { error, data } = await supabase
        .from('bands')
        .upsert({
          ...cleanBand,
          ...addressParts,
          address: formatAddress(addressParts),
          manager_id: band.manager_id || user?.id, // Preserve existing manager or set to current
          person_id: band.person_id || personData?.id, // Link to person record if available
          updated_at: new Date().toISOString(),
          updated_by: user?.id
        })
        .select()
        .single();

      if (error) {
        await handleSupabaseError(error, OperationType.UPDATE, 'bands');
      }

      if (Object.keys(changes).length > 0) {
        await logUpdate(data.id, changes);
      }

      setMessage({ type: 'success', text: 'Band profile updated successfully!' });
      setInitialBand({ ...band });
      
      setTimeout(() => {
        onSaveSuccess?.();
      }, 1500);
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Error saving band: ' + error.message });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-red-600" /></div>;

  return (
    <div className="space-y-8">
      <form onSubmit={handleSave} className="max-w-4xl mx-auto space-y-8 bg-neutral-900 p-8 rounded-3xl border border-neutral-800">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold">Band Profile{band.name ? `: ${band.name}` : ''}</h2>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2 transition-all"
            >
              <Eye size={20} />
              <span className="hidden sm:inline">Preview</span>
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-xl font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              Save Changes
            </button>
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-2xl text-sm font-medium ${
            message.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
          }`}>
            {message.text}
          </div>
        )}

        <ProfilePreviewModal 
          isOpen={showPreview} 
          onClose={() => setShowPreview(false)} 
          type="band" 
          data={band} 
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <label className="text-sm font-medium text-neutral-400">Band Logo (Square - 400x400 preferred)</label>
            <div className="flex items-center gap-6">
              <div className="w-32 h-32 bg-neutral-800 rounded-2xl overflow-hidden border border-neutral-700 relative group">
                {band.logo_url ? (
                  <>
                    <img src={band.logo_url} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <button
                      type="button"
                      onClick={() => setBand({ ...band, logo_url: '' })}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all z-10"
                      title="Delete Logo"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-600">
                    <ImageIcon size={32} />
                  </div>
                )}
              </div>
              <ImageUpload 
                type="logo"
                onUploadComplete={(result) => {
                  const url = typeof result === 'string' ? result : (result.logo || result.original);
                  setBand(prev => ({ ...prev, logo_url: url }));
                }}
                className="bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer border border-neutral-700"
              >
                Upload Logo
              </ImageUpload>
              <button
                type="button"
                onClick={() => {
                  setStockPickerConfig({ type: 'logo', category: 'band' });
                  setIsStockPickerOpen(true);
                }}
                className="bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all border border-neutral-700 flex items-center gap-2"
              >
                <ImageIcon size={16} />
                Stock Library
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-medium text-neutral-400">Hero Banner (Wide - 1920x1080 preferred)</label>
            <div className="space-y-4">
              <div className="w-full h-32 bg-neutral-800 rounded-2xl overflow-hidden border border-neutral-700 relative group">
                {band.hero_url ? (
                  <>
                    <img src={band.hero_url} alt="Hero" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <button
                      type="button"
                      onClick={() => setBand({ ...band, hero_url: '' })}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all z-10"
                      title="Delete Hero Banner"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-600">
                    <ImageIcon size={32} />
                  </div>
                )}
              </div>
              <ImageUpload 
                type="hero"
                onUploadComplete={(result) => {
                  const pcUrl = typeof result === 'string' ? result : (result.hero_pc || result.original);
                  setBand(prev => ({ ...prev, hero_url: pcUrl }));
                }}
                className="bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer border border-neutral-700 inline-block"
              >
                Upload Hero Banner
              </ImageUpload>
              <button
                type="button"
                onClick={() => {
                  setStockPickerConfig({ type: 'hero', category: 'band' });
                  setIsStockPickerOpen(true);
                }}
                className="bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all border border-neutral-700 flex items-center gap-2"
              >
                <ImageIcon size={16} />
                Stock Library
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-400">Band Name</label>
            <input
              type="text"
              required
              value={band.name || ''}
              onChange={(e) => setBand({ ...band, name: e.target.value })}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-600 outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-400">Phone</label>
            <input
              type="tel"
              value={band.phone || ''}
              onChange={(e) => setBand({ ...band, phone: formatPhoneNumber(e.target.value) })}
              placeholder="(555) 000-0000"
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-600 outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-400">Email</label>
            <input
              type="email"
              value={band.email || ''}
              onChange={(e) => setBand({ ...band, email: e.target.value })}
              placeholder="band@email.com"
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-600 outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-400">Website</label>
            <input
              type="text"
              value={band.website || ''}
              onChange={(e) => setBand({ ...band, website: e.target.value })}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-600 outline-none transition-all"
            />
          </div>

          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-neutral-500 uppercase tracking-widest">Address Information</label>
              <div className="flex bg-neutral-800 p-1 rounded-xl border border-neutral-700">
                <button
                  type="button"
                  onClick={() => setAddressParts({ ...addressParts, country: 'US', state: '' })}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    addressParts.country === 'US' ? 'bg-red-600 text-white' : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  USA
                </button>
                <button
                  type="button"
                  onClick={() => setAddressParts({ ...addressParts, country: 'CA', state: '' })}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    addressParts.country === 'CA' ? 'bg-red-600 text-white' : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  CANADA
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider">Street Address</label>
                <input
                  type="text"
                  value={addressParts.street || ''}
                  onChange={(e) => setAddressParts({ ...addressParts, street: e.target.value })}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-2xl py-3 px-4 text-white focus:ring-2 focus:ring-red-600 outline-none transition-all"
                  placeholder="123 Music Ave"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider">City</label>
                <input
                  type="text"
                  value={addressParts.city || ''}
                  onChange={(e) => setAddressParts({ ...addressParts, city: e.target.value })}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-2xl py-3 px-4 text-white focus:ring-2 focus:ring-red-600 outline-none transition-all"
                  placeholder="Nashville"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider">
                    {addressParts.country === 'US' ? 'State' : 'Province'}
                  </label>
                  <select
                    value={addressParts.state || ''}
                    onChange={(e) => setAddressParts({ ...addressParts, state: e.target.value })}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-2xl py-3 px-4 text-white focus:ring-2 focus:ring-red-600 outline-none transition-all appearance-none"
                  >
                    <option value="">Select...</option>
                    {(addressParts.country === 'US' ? US_STATES : CA_PROVINCES).map((item) => (
                      <option key={item.code} value={item.code}>{item.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider">
                    {addressParts.country === 'US' ? 'Zip Code' : 'Postal Code'}
                  </label>
                  <input
                    type="text"
                    value={addressParts.zip || ''}
                    onChange={(e) => setAddressParts({ ...addressParts, zip: e.target.value })}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-2xl py-3 px-4 text-white focus:ring-2 focus:ring-red-600 outline-none transition-all"
                    placeholder={addressParts.country === 'US' ? '37201' : 'M5V 2T6'}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-400">LinkedIn URL</label>
            <input
              type="text"
              value={band.linkedin_url || ''}
              onChange={(e) => setBand({ ...band, linkedin_url: e.target.value })}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-600 outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-400">Pinterest URL</label>
            <input
              type="text"
              value={band.pinterest_url || ''}
              onChange={(e) => setBand({ ...band, pinterest_url: e.target.value })}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-600 outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-400">YouTube Channel URL</label>
            <input
              type="text"
              value={band.youtube_url || ''}
              onChange={(e) => setBand({ ...band, youtube_url: e.target.value })}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-600 outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-400">Instagram URL</label>
            <input
              type="text"
              value={band.instagram_url || ''}
              onChange={(e) => setBand({ ...band, instagram_url: e.target.value })}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-600 outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-400">Apple Music URL</label>
            <input
              type="text"
              value={band.apple_music_url || ''}
              onChange={(e) => setBand({ ...band, apple_music_url: e.target.value })}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-600 outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-400">Spotify URL</label>
            <input
              type="text"
              value={band.spotify_url || ''}
              onChange={(e) => setBand({ ...band, spotify_url: e.target.value })}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-600 outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-400">Facebook URL</label>
            <input
              type="text"
              value={band.facebook_url || ''}
              onChange={(e) => setBand({ ...band, facebook_url: e.target.value })}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-600 outline-none transition-all"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-neutral-400">Description</label>
            <textarea
              rows={4}
              value={band.description || ''}
              onChange={(e) => setBand({ ...band, description: e.target.value })}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-600 outline-none transition-all resize-none"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-neutral-400">Images (Up to 5)</label>
            <span className="text-xs text-neutral-500">{band.images?.length || 0} / 5</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {band.images?.map((img, idx) => (
              <div key={idx} className="aspect-square bg-neutral-800 rounded-2xl relative group overflow-hidden">
                <img src={img} alt="Band" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <button
                  type="button"
                  onClick={() => setBand(prev => ({ ...prev, images: prev.images?.filter((_, i) => i !== idx) }))}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all z-10"
                  title="Delete Image"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {(band.images?.length || 0) < 5 && (
              <ImageUpload 
                type="gallery"
                onUploadComplete={(url) => {
                  if (typeof url === 'string') {
                    setBand(prev => ({ ...prev, images: [...(prev.images || []), url] }));
                  }
                }}
                className="aspect-square border-2 border-dashed border-neutral-700 rounded-2xl flex flex-col items-center justify-center text-neutral-500 hover:border-red-600 hover:text-red-600 transition-all cursor-pointer"
              />
            )}
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-sm font-medium text-neutral-400">Video Links</label>
          {band.video_links?.map((link, idx) => (
            <div key={idx} className="flex gap-2">
              <input
                type="text"
                value={link || ''}
                onChange={(e) => {
                  const newLinks = [...(band.video_links || [])];
                  newLinks[idx] = e.target.value;
                  setBand({ ...band, video_links: newLinks });
                }}
                className="flex-1 bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-600 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setBand({ ...band, video_links: band.video_links?.filter((_, i) => i !== idx) })}
                className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setBand({ ...band, video_links: [...(band.video_links || []), ''] })}
            className="flex items-center gap-2 text-red-600 font-semibold hover:text-red-500 transition-all"
          >
            <Plus size={20} /> Add Video Link
          </button>
        </div>

        {/* Status & Visibility */}
        <div className="space-y-4 pt-6 border-t border-neutral-800">
          <h3 className="text-xl font-bold flex items-center gap-2">
            Status & Visibility
          </h3>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                className="sr-only" 
                checked={band.is_published || false}
                onChange={(e) => setBand({ ...band, is_published: e.target.checked })}
              />
              <div className={`w-12 h-6 rounded-full transition-colors relative ${band.is_published ? 'bg-green-500' : 'bg-neutral-700'}`}>
                <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${band.is_published ? 'translate-x-6' : 'translate-x-0'}`} />
              </div>
              <span className="font-semibold text-neutral-300 group-hover:text-white transition-colors">Published</span>
            </label>
          </div>
          <p className="text-sm text-neutral-500">
            When published, this band profile will be visible on the public band listing page.
          </p>
        </div>
      </form>

      <StockImagePicker 
        isOpen={isStockPickerOpen}
        onClose={() => setIsStockPickerOpen(false)}
        type={stockPickerConfig.type}
        category={stockPickerConfig.category}
        onSelect={(img) => {
          if (stockPickerConfig.type === 'logo') {
            setBand(prev => ({ ...prev, logo_url: img.url }));
          } else {
            setBand(prev => ({ ...prev, hero_url: img.url }));
          }
        }}
      />

      {showPreview && (
        <ProfilePreviewModal 
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          type="band"
          data={band}
        />
      )}
    </div>
  );
}
