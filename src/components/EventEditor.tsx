import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../AuthContext';
import { Event, Act, Band, Venue, VenueSponsor, Genre } from '../types';
import { Save, Plus, Trash2, Clock, Music, MapPin, DollarSign, AlertCircle, Loader2, X, Calendar, Copy, Edit2, Image as ImageIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { getTimeFromDate, getDateFromDate } from '../lib/utils';
import ImageUpload from './ImageUpload';
import StockImagePicker from './StockImagePicker';

interface EventEditorProps {
  event?: Event;
  isCopying?: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function EventEditor({ event, isCopying = false, onClose, onSave }: EventEditorProps) {
  const { user, profile } = useAuth();
  const [formData, setFormData] = useState<Partial<Event>>(event ? {
    ...event,
    band_event_name: event.band_event_name || (profile?.roles.includes('band_manager') || profile?.roles.includes('admin') ? event.title : ''),
    venue_event_name: event.venue_event_name || (profile?.roles.includes('venue_manager') && !profile?.roles.includes('admin') ? event.title : '')
  } : {
    title: '',
    band_event_name: '',
    venue_event_name: '',
    description: '',
    doors_open_time: '19:00',
    ticket_price_low: 0,
    ticket_price_high: 0,
    ticket_disclaimer: '',
    is_public: false,
    is_published: false,
    venue_confirmed: false,
    band_confirmed: false
  });
  
  const [acts, setActs] = useState<Partial<Act>[]>(event ? [] : [{ band_id: '', start_time: '' }]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [bands, setBands] = useState<Band[]>([]);
  const [sponsors, setSponsors] = useState<VenueSponsor[]>([]);
  const [selectedSponsors, setSelectedSponsors] = useState<string[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [isAddingGenre, setIsAddingGenre] = useState(false);
  const [newGenreName, setNewGenreName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const [eventDate, setEventDate] = useState(event?.start_time ? getDateFromDate(event.start_time) : (event ? '' : getDateFromDate(new Date())));
  const [startTime, setStartTime] = useState(event?.start_time ? getTimeFromDate(event.start_time) : '20:00');
  const [endTime, setEndTime] = useState(event?.end_time ? getTimeFromDate(event.end_time) : '23:00');
  const [useVenueImage, setUseVenueImage] = useState(!event || isCopying || !event.hero_url);
  const [isStockPickerOpen, setIsStockPickerOpen] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    validateDate(eventDate);
  }, [eventDate]);

  function validateDate(dateStr: string) {
    if (!dateStr) {
      setDateError(null);
      return;
    }
    const [year, month, day] = dateStr.split('-').map(Number);
    const selectedDate = new Date(year, month - 1, day);
    const today = new Date();
    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    if (selectedDate < todayDateOnly) {
      setDateError('Cannot create or edit events with a date in the past.');
    } else {
      setDateError(null);
    }
  }

  async function fetchInitialData() {
    try {
      const [venuesRes, bandsRes, genresRes] = await Promise.all([
        supabase.from('venues').select('*'),
        supabase.from('bands').select('*'),
        supabase.from('genres').select('*')
      ]);

      if (venuesRes.data) {
        setVenues(venuesRes.data);
        if (!formData.venue_id && venuesRes.data.length > 0) {
          // If user is venue manager, default to their venue
          const myVenue = venuesRes.data.find(v => v.manager_id === user?.id);
          const defaultVenueId = myVenue?.id || venuesRes.data[0].id;
          setFormData(prev => ({ ...prev, venue_id: defaultVenueId }));
          fetchSponsors(defaultVenueId);
        }
      }
      if (bandsRes.data) setBands(bandsRes.data);
      if (genresRes.data) setGenres(genresRes.data);

      if (event) {
        const [actsRes, sponsorLinksRes, eventGenresRes] = await Promise.all([
          supabase.from('acts').select('*').eq('event_id', event.id),
          supabase.from('event_sponsors').select('sponsor_id').eq('event_id', event.id),
          supabase.from('event_genres').select('genre_id').eq('event_id', event.id)
        ]);

        if (actsRes.data) {
          setActs(actsRes.data);
          if (!event.start_time && actsRes.data.length > 0 && actsRes.data[0].start_time) {
            setEventDate(getDateFromDate(actsRes.data[0].start_time));
            setStartTime(getTimeFromDate(actsRes.data[0].start_time));
          }
        }
        if (sponsorLinksRes.data) setSelectedSponsors(sponsorLinksRes.data.map(s => s.sponsor_id));
        if (eventGenresRes.data) setSelectedGenres(eventGenresRes.data.map(g => g.genre_id));
        
        if (event.venue_id) fetchSponsors(event.venue_id);
      }
    } finally {
      setLoading(false);
    }
  }

  async function fetchSponsors(venueId: string) {
    const { data } = await supabase.from('venue_sponsors').select('*').eq('venue_id', venueId);
    if (data) setSponsors(data);
  }

  async function handleAddGenre(e: React.FormEvent) {
    e.preventDefault();
    if (!newGenreName.trim()) return;
    
    const { data, error } = await supabase
      .from('genres')
      .insert({ name: newGenreName.trim() })
      .select()
      .single();

    if (error) {
      setMessage({ type: 'error', text: 'Error adding genre: ' + error.message });
    } else if (data) {
      setGenres(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedGenres(prev => [...prev, data.id]);
      setNewGenreName('');
      setIsAddingGenre(false);
      setMessage({ type: 'success', text: 'Genre added!' });
      setTimeout(() => setMessage(null), 2000);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    
    // Validate date is not in the past
    const [year, month, day] = eventDate.split('-').map(Number);
    const selectedDate = new Date(year, month - 1, day);
    const today = new Date();
    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    if (selectedDate < todayDateOnly) {
      setMessage({ type: 'error', text: 'Cannot create or edit events with a date in the past.' });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const combinedStartTime = new Date(`${eventDate}T${startTime}`).toISOString();
      const combinedEndTime = new Date(`${eventDate}T${endTime}`).toISOString();

      const eventToSave: any = {
        title: formData.band_event_name || formData.venue_event_name || 'Untitled Event',
        description: formData.description,
        venue_id: formData.venue_id,
        end_time: combinedEndTime,
        doors_open_time: formData.doors_open_time,
        ticket_price_low: formData.ticket_price_low,
        ticket_price_high: formData.ticket_price_high,
        ticket_disclaimer: formData.ticket_disclaimer,
        venue_confirmed: formData.venue_confirmed,
        band_confirmed: formData.band_confirmed,
        is_public: formData.is_public,
        is_published: formData.is_published,
        updated_at: new Date().toISOString(),
        updated_by: user?.id
      };

      if (formData.id && !isCopying) {
        eventToSave.id = formData.id;
      }
      
      if (useVenueImage) {
        const selectedVenue = venues.find(v => v.id === formData.venue_id);
        if (selectedVenue?.hero_url) {
          eventToSave.hero_url = selectedVenue.hero_url;
        }
      } else if (formData.hero_url) {
        eventToSave.hero_url = formData.hero_url;
      }

      const { data: savedEvent, error: eventError } = await supabase
        .from('events')
        .upsert(eventToSave)
        .select()
        .single();

      if (eventError) throw eventError;

      // Save Acts
      await supabase.from('acts').delete().eq('event_id', savedEvent.id);
      if (acts.length > 0) {
        const actsToInsert = acts.map(act => {
          // Reconstruct full timestamp for acts using the event date
          let actStartTime = act.start_time;
          if (actStartTime && !actStartTime.includes('T')) {
            actStartTime = new Date(`${eventDate}T${actStartTime}`).toISOString();
          } else if (!actStartTime) {
            actStartTime = new Date(`${eventDate}T${startTime}`).toISOString();
          }
          const { id, created_at, ...actData } = act as any;
          return { ...actData, start_time: actStartTime, event_id: savedEvent.id };
        });

        const { error: actsError } = await supabase.from('acts').insert(actsToInsert);
        if (actsError) throw actsError;
      }

      // Save Sponsors
      await supabase.from('event_sponsors').delete().eq('event_id', savedEvent.id);
      if (selectedSponsors.length > 0) {
        const { error: sponsorsError } = await supabase.from('event_sponsors').insert(
          selectedSponsors.map(sid => ({ event_id: savedEvent.id, sponsor_id: sid }))
        );
        if (sponsorsError) throw sponsorsError;
      }

      // Save Genres
      await supabase.from('event_genres').delete().eq('event_id', savedEvent.id);
      if (selectedGenres.length > 0) {
        const { error: genresError } = await supabase.from('event_genres').insert(
          selectedGenres.map(gid => ({ event_id: savedEvent.id, genre_id: gid }))
        );
        if (genresError) throw genresError;
      }

      setMessage({ type: 'success', text: 'Event saved successfully!' });
      setTimeout(() => {
        onSave();
        onClose();
      }, 1000);
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Error saving event: ' + error.message });
    } finally {
      setSaving(false);
    }
  }

  const isVenueManager = profile?.roles.includes('venue_manager');
  const isBandManager = profile?.roles.includes('band_manager');
  const isAdmin = profile?.roles.includes('admin');

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-red-600" /></div>;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto"
    >
      <motion.div 
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        <div className={`sticky top-0 backdrop-blur-md border-b p-6 flex items-center justify-between z-10 ${
          isCopying 
            ? 'bg-blue-900/80 border-blue-500/50' 
            : 'bg-neutral-900/80 border-neutral-800'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isCopying ? 'bg-blue-500/20 text-blue-400' : 'bg-red-600/20 text-red-500'}`}>
              {isCopying ? <Copy size={20} /> : (event ? <Edit2 size={20} /> : <Plus size={20} />)}
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {isCopying ? 'Copying Event' : (event ? 'Edit Event' : 'Create New Event')}
              </h2>
              {isCopying && (
                <p className="text-blue-400 text-[10px] font-bold uppercase tracking-widest">Creating a new event based on "{event?.title}"</p>
              )}
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-neutral-800 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-8 space-y-8">
          {message && (
            <div className={`p-4 rounded-2xl text-sm font-medium flex items-center gap-2 ${
              message.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
            }`}>
              <AlertCircle size={18} />
              {message.text}
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-400">Band Event Name (Preferred)</label>
              <input
                type="text"
                required={!formData.venue_event_name}
                disabled={!(profile?.roles.includes('admin') || profile?.roles.includes('band_manager'))}
                value={formData.band_event_name || ''}
                onChange={(e) => setFormData({ ...formData, band_event_name: e.target.value })}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-600 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="e.g., Summer Tour 2026"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-400">Venue Event Name</label>
              <input
                type="text"
                required={!formData.band_event_name}
                disabled={!(profile?.roles.includes('admin') || profile?.roles.includes('venue_manager'))}
                value={formData.venue_event_name || ''}
                onChange={(e) => setFormData({ ...formData, venue_event_name: e.target.value })}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-600 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="e.g., Live Music Friday"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-neutral-400">Venue</label>
              <select
                required
                value={formData.venue_id || ''}
                onChange={(e) => {
                  setFormData({ ...formData, venue_id: e.target.value });
                  fetchSponsors(e.target.value);
                }}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-600 outline-none transition-all"
              >
                <option value="">Select a Venue</option>
                {venues
                  .filter(v => !(v as any).is_archived || v.id === formData.venue_id)
                  .map((v, index) => <option key={`venue-${v.id || index}`} value={v.id}>{v.name}{(v as any).is_archived ? ' (Archived)' : ''}</option>)}
              </select>
            </div>

            <div className="space-y-4 md:col-span-2">
              <label className="text-sm font-medium text-neutral-400">Event Image (Wide - 1920x1080 preferred)</label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="w-full sm:w-64 h-32 bg-neutral-800 rounded-2xl overflow-hidden border border-neutral-700 relative group">
                  {(useVenueImage ? venues.find(v => v.id === formData.venue_id)?.hero_url : formData.hero_url) ? (
                    <img 
                      src={useVenueImage ? venues.find(v => v.id === formData.venue_id)?.hero_url : formData.hero_url} 
                      alt="Event" 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-600">
                      <ImageIcon size={32} />
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col gap-3 w-full sm:w-auto">
                  <label className="flex items-center gap-3 p-3 bg-neutral-800/50 rounded-xl border border-neutral-700/50 cursor-pointer hover:border-neutral-600 transition-all">
                    <input
                      type="checkbox"
                      checked={useVenueImage}
                      onChange={(e) => setUseVenueImage(e.target.checked)}
                      className="w-5 h-5 rounded border-neutral-600 text-red-600 focus:ring-red-600 bg-neutral-900"
                    />
                    <div>
                      <div className="font-medium text-white text-sm">Use Venue's Hero Image</div>
                      <div className="text-xs text-neutral-400">Set the event image to the venue's default image</div>
                    </div>
                  </label>

                  {!useVenueImage && (
                    <div className="flex gap-2">
                      <ImageUpload 
                        type="hero"
                        onUploadComplete={(result) => {
                          const pcUrl = typeof result === 'string' ? result : (result.hero_pc || result.original);
                          setFormData(prev => ({ ...prev, hero_url: pcUrl }));
                        }}
                        className="flex-1 sm:flex-none bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer border border-neutral-700 text-center"
                      >
                        Upload Image
                      </ImageUpload>
                      <button
                        type="button"
                        onClick={() => setIsStockPickerOpen(true)}
                        className="flex-1 sm:flex-none bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all border border-neutral-700 flex items-center justify-center gap-2"
                      >
                        <ImageIcon size={16} />
                        Stock
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-neutral-400">Description</label>
              <textarea
                rows={3}
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-600 outline-none transition-all resize-none"
              />
            </div>
          </div>

          {/* Logistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-400">Event Date</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
                <input
                  type="date"
                  required
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className={`w-full bg-neutral-800 border rounded-xl py-3 pl-12 pr-4 text-white focus:ring-2 focus:ring-red-600 outline-none transition-all ${
                    dateError ? 'border-red-500 ring-1 ring-red-500' : 'border-neutral-700'
                  }`}
                />
              </div>
              {dateError && (
                <p className="text-red-500 text-[10px] font-bold uppercase tracking-wider ml-1">{dateError}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-400">Doors Open</label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
                <input
                  type="time"
                  value={formData.doors_open_time || ''}
                  onChange={(e) => setFormData({ ...formData, doors_open_time: e.target.value })}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl py-3 pl-12 pr-4 text-white focus:ring-2 focus:ring-red-600 outline-none transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-400">Start Time</label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl py-3 pl-12 pr-4 text-white focus:ring-2 focus:ring-red-600 outline-none transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-400">End Time</label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl py-3 pl-12 pr-4 text-white focus:ring-2 focus:ring-red-600 outline-none transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-400">Price Low ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
                <input
                  type="number"
                  value={formData.ticket_price_low || 0}
                  onChange={(e) => setFormData({ ...formData, ticket_price_low: Number(e.target.value) })}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl py-3 pl-12 pr-4 text-white focus:ring-2 focus:ring-red-600 outline-none transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-400">Price High ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
                <input
                  type="number"
                  value={formData.ticket_price_high || 0}
                  onChange={(e) => setFormData({ ...formData, ticket_price_high: Number(e.target.value) })}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl py-3 pl-12 pr-4 text-white focus:ring-2 focus:ring-red-600 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Genres */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-neutral-400">Genres</label>
              {!isAddingGenre ? (
                <button
                  type="button"
                  onClick={() => setIsAddingGenre(true)}
                  className="text-red-600 hover:text-red-500 text-xs font-bold uppercase tracking-widest flex items-center gap-1"
                >
                  <Plus size={14} /> Add Genre
                </button>
              ) : (
                <form onSubmit={handleAddGenre} className="flex gap-2">
                  <input
                    autoFocus
                    type="text"
                    value={newGenreName}
                    onChange={(e) => setNewGenreName(e.target.value)}
                    placeholder="New genre..."
                    className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1 text-xs focus:ring-1 focus:ring-red-600 outline-none"
                  />
                  <button 
                    type="submit"
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-xs font-bold transition-all"
                  >
                    Add
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setIsAddingGenre(false);
                      setNewGenreName('');
                    }}
                    className="text-neutral-500 hover:text-white text-xs font-bold uppercase"
                  >
                    Cancel
                  </button>
                </form>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {genres.map((genre, index) => (
                <button
                  key={`genre-${genre.id || index}`}
                  type="button"
                  onClick={() => {
                    if (selectedGenres.includes(genre.id)) {
                      setSelectedGenres(selectedGenres.filter(id => id !== genre.id));
                    } else {
                      setSelectedGenres([...selectedGenres, genre.id]);
                    }
                  }}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    selectedGenres.includes(genre.id)
                      ? 'bg-red-600 text-white'
                      : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                  }`}
                >
                  {genre.name}
                </button>
              ))}
            </div>
          </div>

          {/* Acts */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Music size={20} className="text-red-600" />
                Acts
              </h3>
              <button
                type="button"
                onClick={() => setActs([...acts, { band_id: '', start_time: '' }])}
                className="text-red-600 hover:text-red-500 text-sm font-bold uppercase tracking-widest flex items-center gap-1"
              >
                <Plus size={16} /> {acts.length > 0 ? 'Add Another Act' : 'Add Act'}
              </button>
            </div>
            <div className="space-y-3">
              {acts.map((act, idx) => (
                <div key={act.id || `new-act-${idx}`} className="flex flex-col md:flex-row gap-4 p-4 bg-neutral-800/50 rounded-2xl border border-neutral-700">
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] font-bold uppercase text-neutral-500 ml-1">Band</label>
                    <select
                      required
                      value={act.band_id || ''}
                      onChange={(e) => {
                        const newActs = [...acts];
                        newActs[idx].band_id = e.target.value;
                        setActs(newActs);
                      }}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-red-600 outline-none"
                    >
                      <option value="">Select a Band</option>
                      {bands
                        .filter(b => !(b as any).is_archived || b.id === act.band_id)
                        .map((b, index) => <option key={`band-${b.id || index}`} value={b.id}>{b.name}{(b as any).is_archived ? ' (Archived)' : ''}</option>)}
                    </select>
                  </div>
                  <div className="w-full md:w-48 space-y-1">
                    <label className="text-[10px] font-bold uppercase text-neutral-500 ml-1">Start Time</label>
                    <input
                      type="time"
                      required
                      value={act.start_time ? (act.start_time.includes('T') ? act.start_time.split('T')[1].slice(0, 5) : act.start_time) : ''}
                      onChange={(e) => {
                        const newActs = [...acts];
                        newActs[idx].start_time = e.target.value;
                        setActs(newActs);
                      }}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-red-600 outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setActs(acts.filter((_, i) => i !== idx))}
                    className="self-end md:self-center p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Flags */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <FlagToggle 
              label="Public" 
              active={formData.is_public || false} 
              onToggle={() => setFormData({ ...formData, is_public: !formData.is_public })} 
              disabled={!isVenueManager && !isAdmin}
            />
            <FlagToggle 
              label="Published" 
              active={formData.is_published || false} 
              onToggle={() => setFormData({ ...formData, is_published: !formData.is_published })} 
              disabled={!isVenueManager && !isAdmin}
            />
            <FlagToggle 
              label="Venue Confirmed" 
              active={formData.venue_confirmed || false} 
              onToggle={() => setFormData({ ...formData, venue_confirmed: !formData.venue_confirmed })} 
              disabled={!isVenueManager && !isAdmin}
            />
            <FlagToggle 
              label="Band Confirmed" 
              active={formData.band_confirmed || false} 
              onToggle={() => setFormData({ ...formData, band_confirmed: !formData.band_confirmed })} 
              disabled={!isBandManager && !isAdmin}
            />
          </div>

          <div className="pt-6 border-t border-neutral-800 flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl font-semibold text-neutral-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !!dateError}
              className={`${
                isCopying ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20' : 'bg-red-600 hover:bg-red-700 shadow-red-600/20'
              } text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {saving ? <Loader2 className="animate-spin" size={20} /> : (isCopying ? <Copy size={20} /> : <Save size={20} />)}
              {isCopying ? 'Create Copy' : (event ? 'Update Event' : 'Create Event')}
            </button>
          </div>
        </form>
      </motion.div>

      <StockImagePicker 
        isOpen={isStockPickerOpen}
        type="hero"
        category="generic"
        onSelect={(image) => {
          setFormData(prev => ({ ...prev, hero_url: image.url }));
          setIsStockPickerOpen(false);
        }}
        onClose={() => setIsStockPickerOpen(false)}
      />
    </motion.div>
  );
}

function FlagToggle({ label, active, onToggle, disabled }: { label: string, active: boolean, onToggle: () => void, disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all gap-2 ${
        active 
          ? 'bg-red-600/10 border-red-600/50 text-red-600' 
          : 'bg-neutral-800/50 border-neutral-700 text-neutral-500'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-neutral-600'}`}
    >
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
      <div className={`w-10 h-5 rounded-full relative transition-colors ${active ? 'bg-red-600' : 'bg-neutral-700'}`}>
        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${active ? 'left-6' : 'left-1'}`} />
      </div>
    </button>
  );
}
