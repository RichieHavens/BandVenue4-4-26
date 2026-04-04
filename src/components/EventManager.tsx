import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../AuthContext';
import { Event, Act, Band, Venue } from '../types';
import { Plus, Calendar, Clock, MapPin, Music, Trash2, Check, X, Loader2, AlertCircle, Edit2, Copy, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import EventEditor from './EventEditor';
import { formatDate, formatTime } from '../lib/utils';

export default function EventManager() {
  const { user, profile } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | undefined>(undefined);
  const [showPastEvents, setShowPastEvents] = useState(false);
  const [attentionFilter, setAttentionFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [isCopying, setIsCopying] = useState(false);

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user]);

  async function fetchEvents() {
    try {
      setLoading(true);
      let query = supabase
        .from('events')
        .select('*, venues(*), event_genres(genres(name)), profiles!updated_by(first_name, last_name), acts(band_id, bands(name))')
        .order('created_at', { ascending: false });
      
      if (profile?.roles.includes('venue_manager')) {
        const { data: myVenues } = await supabase.from('venues').select('id').eq('manager_id', user?.id);
        if (myVenues && myVenues.length > 0) {
          query = query.in('venue_id', myVenues.map(v => v.id));
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      
      const processedEvents = (data || []).map(event => ({
        ...event,
        event_genres: Array.from(new Set((event as any).event_genres?.map((eg: any) => eg.genres?.name).filter(Boolean))) || []
      }));
      
      setEvents(processedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredEvents = events.filter(event => {
    // Past events filter
    if (!showPastEvents && event.start_time && new Date(event.start_time) < new Date(new Date().setHours(0, 0, 0, 0))) {
      return false;
    }

    // Attention filter
    if (attentionFilter !== 'all') {
      const isUnpublished = !event.is_published;
      const isUnconfirmedVenue = !event.venue_confirmed;
      const isUnconfirmedBand = !event.band_confirmed;
      const isMissingDate = !event.start_time;
      const needsAnyAttention = isUnpublished || isUnconfirmedVenue || isUnconfirmedBand || isMissingDate;

      if (attentionFilter === 'needs_attention' && !needsAnyAttention) return false;
      if (attentionFilter === 'unpublished' && !isUnpublished) return false;
      if (attentionFilter === 'unconfirmed_venue' && !isUnconfirmedVenue) return false;
      if (attentionFilter === 'unconfirmed_band' && !isUnconfirmedBand) return false;
      if (attentionFilter === 'missing_date' && !isMissingDate) return false;
    }

    // Entity filter (Venue or Band)
    if (entityFilter !== 'all') {
      const [type, id] = entityFilter.split(':');
      if (type === 'venue') {
        if (event.venue_id !== id) return false;
      } else if (type === 'band') {
        const hasBand = (event as any).acts?.some((act: any) => act.band_id === id);
        if (!hasBand) return false;
      }
    }

    return true;
  });

  // Extract unique venues and bands for filters
  const uniqueVenues = (Array.from(new Map(
    events.map(e => e.venues).filter(Boolean).map(v => [v!.id, v!])
  ).values()) as any[]).sort((a, b) => a.name.localeCompare(b.name));

  const uniqueBands = (Array.from(new Map(
    events.flatMap(e => (e as any).acts || []).filter(a => a.bands).map(a => [a.band_id, { id: a.band_id, name: a.bands.name }])
  ).values()) as any[]).sort((a, b) => a.name.localeCompare(b.name));

  const handleCopyAsNew = (event: Event) => {
    const { id, created_at, updated_at, updated_by, ...rest } = event;
    const copiedEvent = {
      ...rest,
      start_time: undefined,
      end_time: undefined,
      is_published: false,
      venue_confirmed: false,
      band_confirmed: false
    } as any;
    
    setSelectedEvent(copiedEvent);
    setIsCopying(true);
    setShowEditor(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-4xl font-bold tracking-tight">Event Management</h2>
        <div className="flex flex-wrap items-center gap-3">
          {/* Attention Filter Dropdown */}
          <div className="relative group">
            <select
              value={attentionFilter}
              onChange={(e) => setAttentionFilter(e.target.value)}
              className={`appearance-none pl-10 pr-8 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border outline-none cursor-pointer ${
                attentionFilter !== 'all'
                  ? 'bg-red-500/10 border-red-500/50 text-red-500'
                  : 'bg-neutral-800 border-neutral-700 text-neutral-500 hover:border-neutral-600'
              }`}
            >
              <option value="all">All Statuses</option>
              <option value="needs_attention">Needs Attention (Any)</option>
              <option value="unpublished">Unpublished (Draft)</option>
              <option value="unconfirmed_venue">Unconfirmed Venue</option>
              <option value="unconfirmed_band">Unconfirmed Band</option>
              <option value="missing_date">Missing Date/Time</option>
            </select>
            <AlertCircle size={14} className={`absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none ${attentionFilter !== 'all' ? 'text-red-500' : 'text-neutral-500'}`} />
          </div>

          {/* Venue/Band Filter Dropdown */}
          <div className="relative group">
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className={`appearance-none pl-10 pr-8 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border outline-none cursor-pointer max-w-[200px] ${
                entityFilter !== 'all'
                  ? 'bg-blue-500/10 border-blue-500/50 text-blue-500'
                  : 'bg-neutral-800 border-neutral-700 text-neutral-500 hover:border-neutral-600'
              }`}
            >
              <option value="all">All Venues & Bands</option>
              {uniqueVenues.length > 0 && (
                <optgroup label="Venues" key="venues-group">
                  {uniqueVenues.map((v, index) => (
                    <option key={`venue-${v.id || index}`} value={`venue:${v.id}`}>{v.name}</option>
                  ))}
                </optgroup>
              )}
              {uniqueBands.length > 0 && (
                <optgroup label="Bands" key="bands-group">
                  {uniqueBands.map((b, index) => (
                    <option key={`band-${b.id || index}`} value={`band:${b.id}`}>{b.name}</option>
                  ))}
                </optgroup>
              )}
            </select>
            <MapPin size={14} className={`absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none ${entityFilter !== 'all' ? 'text-blue-500' : 'text-neutral-500'}`} />
          </div>

          <button 
            onClick={() => setShowPastEvents(!showPastEvents)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border ${
              showPastEvents 
                ? 'bg-red-600/10 border-red-600/50 text-red-600' 
                : 'bg-neutral-800 border-neutral-700 text-neutral-500 hover:border-neutral-600'
            }`}
          >
            <Filter size={14} />
            {showPastEvents ? 'Showing All' : 'Hide Past'}
          </button>
          <button 
            onClick={() => {
              setSelectedEvent(undefined);
              setIsCopying(false);
              setShowEditor(true);
            }}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-xl font-semibold transition-all shadow-lg shadow-red-600/20 flex items-center gap-2"
          >
            <Plus size={20} />
            Create Event
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-red-600" size={48} /></div>
      ) : (
        <div className="space-y-px">
          {filteredEvents.map((event, index) => {
            const needsAttention = !event.is_published || !event.venue_confirmed || !event.band_confirmed || !event.start_time;
            
            return (
              <div key={`event-${event.id || index}`} className="bg-neutral-900/40 border-b border-neutral-800/50 flex items-center gap-3 px-3 py-1.5 group hover:bg-neutral-800/60 transition-all relative overflow-hidden first:rounded-t-xl last:rounded-b-xl last:border-b-0">
                {needsAttention && (
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-red-500/60" />
                )}
                
                {/* Status Dot */}
                <div className="shrink-0 w-2 h-2 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center relative">
                  {needsAttention && (
                    <div className="absolute inset-0 bg-red-500 rounded-full animate-pulse" />
                  )}
                  {!needsAttention && event.is_published && (
                    <div className="absolute inset-0 bg-green-500 rounded-full opacity-40" />
                  )}
                </div>

                {/* Thumbnail - Tiny */}
                <div className="hidden sm:block w-8 h-8 rounded bg-neutral-800 shrink-0 border border-neutral-700/30 overflow-hidden">
                  <img 
                    src={event.hero_url || `https://picsum.photos/seed/event${event.id}/64/64`} 
                    alt="" 
                    className="w-full h-full object-cover opacity-30 group-hover:opacity-50 transition-opacity"
                    referrerPolicy="no-referrer"
                  />
                </div>
                
                {/* Title & Genres */}
                <div className="flex-1 min-w-0 flex items-center gap-3">
                  <h3 className={`text-sm font-bold truncate ${!event.is_published ? 'text-neutral-500' : 'text-neutral-200'}`}>
                    {event.title}
                  </h3>
                  <div className="hidden lg:flex gap-1 shrink-0">
                    {(event as any).event_genres?.slice(0, 2).map((genre: string, index: number) => (
                      <span key={`${event.id}-${genre}-${index}`} className="text-[8px] px-1.5 py-0 bg-red-600/5 text-red-600/60 rounded-full border border-red-600/10 uppercase font-bold tracking-tighter">
                        {genre}
                      </span>
                    ))}
                    {!event.is_published && (
                      <span className="text-[8px] px-1.5 py-0 bg-neutral-800 text-neutral-600 rounded-full border border-neutral-700 uppercase font-bold tracking-tighter">
                        Draft
                      </span>
                    )}
                  </div>
                </div>

                {/* Metadata Columns */}
                <div className="hidden md:flex items-center gap-6 text-[10px] font-mono shrink-0">
                  <div className={`flex items-center gap-1.5 w-32 ${!event.venue_confirmed ? "text-red-500/60" : "text-neutral-500"}`}>
                    <MapPin size={10} className="opacity-40" />
                    <span className="truncate">{(event as any).venues?.name || '---'}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 w-24 ${!event.start_time ? "text-red-500/60" : "text-neutral-500"}`}>
                    <Calendar size={10} className="opacity-40" />
                    <span>{event.start_time ? formatDate(event.start_time) : 'No Date'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 w-16 text-neutral-500">
                    <Clock size={10} className="opacity-40" />
                    <span>{event.start_time ? formatTime(event.start_time) : '--:--'}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0 ml-auto">
                  <button
                    onClick={() => handleCopyAsNew(event)}
                    title="Copy"
                    className="p-1.5 text-neutral-600 hover:text-blue-500 hover:bg-blue-500/10 rounded transition-all"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedEvent(event);
                      setIsCopying(false);
                      setShowEditor(true);
                    }}
                    title="Edit"
                    className="p-1.5 text-neutral-600 hover:text-red-600 hover:bg-red-600/10 rounded transition-all"
                  >
                    <Edit2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
          {filteredEvents.length === 0 && (
            <div className="text-center py-20 bg-neutral-900/30 rounded-3xl border border-dashed border-neutral-800">
              <Calendar className="mx-auto text-neutral-700 mb-4" size={48} />
              <p className="text-neutral-500">No events found matching your criteria.</p>
            </div>
          )}
        </div>
      )}

      {showEditor && (
        <EventEditor 
          event={selectedEvent} 
          isCopying={isCopying}
          onClose={() => setShowEditor(false)} 
          onSave={fetchEvents} 
        />
      )}
    </div>
  );
}
