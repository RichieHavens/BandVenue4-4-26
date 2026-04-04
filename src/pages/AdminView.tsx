import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../AuthContext';
import { supabase } from '../lib/supabase';
import { Venue, Band, Event } from '../types';
import { 
  Loader2, Trash2, ShieldCheck, Globe, Sparkles, Settings, 
  MapPin, Music, Calendar, Clock, Search, Filter, UserCircle, Heart,
  Home, Info, LayoutDashboard, ChevronDown, CheckCircle, LayoutGrid, List, X, Upload, Plus, Archive, RefreshCcw
} from 'lucide-react';
import VenueProfileEditor from '../components/VenueProfileEditor';
import BandProfileEditor from '../components/BandProfileEditor';
import EventProfileEditor from '../components/EventProfileEditor';
import EventEditor from '../components/EventEditor';
import DeduplicationTool from '../components/DeduplicationTool';
import PeopleManager from '../components/PeopleManager';
import { ScraperView } from './ScraperView';
import { formatDate, formatTime } from '../lib/utils';

export function AdminView() {
  const { user, profile, refreshProfile } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState('venues');
  const [genres, setGenres] = useState<any[]>([]);
  const [loadingGenres, setLoadingGenres] = useState(false);
  const [isAddingGenre, setIsAddingGenre] = useState(false);
  const [newGenreName, setNewGenreName] = useState('');
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loadingVenues, setLoadingVenues] = useState(false);
  const [venueSearch, setVenueSearch] = useState('');
  const [venueFilter, setVenueFilter] = useState('');
  const [bands, setBands] = useState<Band[]>([]);
  const [loadingBands, setLoadingBands] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [showPastEvents, setShowPastEvents] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ message: string, onConfirm: () => void } | null>(null);
  const [errorMessage, setErrorMessage] = useState<React.ReactNode | null>(null);

  const filteredVenues = useMemo(() => {
    return venues.filter(v => {
      const matchesSearch = v.name.toLowerCase().includes(venueSearch.toLowerCase());
      let matchesFilter = true;
      if (venueFilter === 'archived') {
        matchesFilter = !!(v as any).is_archived;
      } else {
        if ((v as any).is_archived) return false;
        if (venueFilter === 'missing_address') matchesFilter = !v.address;
        if (venueFilter === 'missing_phone') matchesFilter = !v.phone;
        if (venueFilter === 'missing_email') matchesFilter = !v.email;
      }
      return matchesSearch && matchesFilter;
    });
  }, [venues, venueSearch, venueFilter]);

  const [bandSearch, setBandSearch] = useState('');
  const [bandFilter, setBandFilter] = useState('');

  const filteredBands = useMemo(() => {
    return bands.filter(b => {
      const matchesSearch = b.name.toLowerCase().includes(bandSearch.toLowerCase());
      let matchesFilter = true;
      if (bandFilter === 'archived') {
        matchesFilter = !!(b as any).is_archived;
      } else {
        if ((b as any).is_archived) return false;
        if (bandFilter === 'missing_phone') matchesFilter = !b.phone;
        if (bandFilter === 'missing_email') matchesFilter = !b.email;
        if (bandFilter === 'missing_city') matchesFilter = !b.city;
        if (bandFilter === 'missing_state') matchesFilter = !b.state;
        if (bandFilter === 'missing_logo') matchesFilter = !b.logo_url;
        if (bandFilter === 'missing_hero') matchesFilter = !b.hero_url;
        if (bandFilter === 'missing_description') matchesFilter = !b.description;
        if (bandFilter === 'unpublished') matchesFilter = !b.is_published;
      }
      return matchesSearch && matchesFilter;
    });
  }, [bands, bandSearch, bandFilter]);

  const [eventSearch, setEventSearch] = useState('');
  const [eventFilter, setEventFilter] = useState('');

  const filteredEvents = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    let filtered = events.filter(e => {
      const searchLower = eventSearch.toLowerCase();
      const matchesSearch = 
        e.title.toLowerCase().includes(searchLower) ||
        (e.venues?.name && e.venues.name.toLowerCase().includes(searchLower)) ||
        (e.acts && e.acts.some((act: any) => act.bands?.name && act.bands.name.toLowerCase().includes(searchLower)));
        
      let matchesFilter = true;
      if (eventFilter === 'missing_start_time') matchesFilter = !e.start_time;
      if (eventFilter === 'missing_venue') matchesFilter = !e.venue_id;
      
      let matchesPast = true;
      if (!showPastEvents) {
        const eventDate = e.start_time ? new Date(e.start_time) : (e.acts?.[0]?.start_time ? new Date(e.acts[0].start_time) : null);
        if (eventDate && eventDate < now) {
          matchesPast = false;
        }
      }
      
      return matchesSearch && matchesFilter && matchesPast;
    });

    // Sort: Upcoming events (ascending) -> Past events (descending) -> No date events
    filtered.sort((a, b) => {
      const dateA = a.start_time ? new Date(a.start_time).getTime() : (a.acts?.[0]?.start_time ? new Date(a.acts[0].start_time).getTime() : null);
      const dateB = b.start_time ? new Date(b.start_time).getTime() : (b.acts?.[0]?.start_time ? new Date(b.acts[0].start_time).getTime() : null);
      
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;

      const isPastA = dateA < now.getTime();
      const isPastB = dateB < now.getTime();

      if (isPastA && !isPastB) return 1; // Past events go after upcoming events
      if (!isPastA && isPastB) return -1;

      if (!isPastA && !isPastB) {
        return dateA - dateB; // Upcoming events: ascending (closest to now first)
      } else {
        return dateB - dateA; // Past events: descending (closest to now first)
      }
    });

    return filtered;
  }, [events, eventSearch, eventFilter, showPastEvents]);
  const [copyEvent, setCopyEvent] = useState<Event | undefined>(undefined);
  const [showCopyEditor, setShowCopyEditor] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [stockImages, setStockImages] = useState<any[]>([]);
  const [loadingStock, setLoadingStock] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const heroFileInputRef = useRef<HTMLInputElement>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (activeSubTab === 'genres') fetchGenres();
    if (activeSubTab === 'venues') fetchVenues();
    if (activeSubTab === 'bands') fetchBands();
    if (activeSubTab === 'events') fetchEvents();
    if (activeSubTab === 'stock') fetchStockImages();
  }, [activeSubTab]);

  async function handleHeroUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingHero(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `home-hero-${Date.now()}.${fileExt}`;
      const filePath = `heroes/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase.from('stock_images').insert({
        url: publicUrl,
        thumbnail: publicUrl,
        label: 'Home Page Hero',
        type: 'hero',
        category: 'home',
        created_at: new Date().toISOString()
      });

      if (dbError) throw dbError;

      alert('Home Page Hero updated successfully!');
      fetchStockImages();
    } catch (error: any) {
      console.error('Error uploading hero image:', error);
      alert(error.message || 'Error uploading image');
    } finally {
      setUploadingHero(false);
      if (e.target) e.target.value = ''; // Reset input
    }
  }

  async function fetchStockImages() {
    setLoadingStock(true);
    const { data, error } = await supabase.from('stock_images').select('*').order('created_at', { ascending: false });
    if (data) setStockImages(data);
    setLoadingStock(false);
  }

  async function handleAddStockImage() {
    const url = prompt('Enter image URL:');
    if (!url) return;
    const label = prompt('Enter label:');
    const type = prompt('Enter type (hero/logo):', 'hero');
    const category = prompt('Enter category (venue/band/generic):', 'generic');

    const { error } = await supabase.from('stock_images').insert({
      url,
      thumbnail: url, // Simplified for now
      label,
      type,
      category,
      created_at: new Date().toISOString()
    });

    if (error) alert(error.message);
    else fetchStockImages();
  }

  async function handleDeleteStockImage(id: string) {
    setConfirmDialog({
      message: 'Are you sure you want to delete this image?',
      onConfirm: async () => {
        try {
          const { error } = await supabase.from('stock_images').delete().eq('id', id);
          if (error) throw error;
          fetchStockImages();
        } catch (error: any) {
          console.error('Error deleting image:', error);
          setErrorMessage(error.message || 'Failed to delete image');
        } finally {
          setConfirmDialog(null);
        }
      }
    });
  }

  async function handleDeleteOrArchiveBand(id: string, isArchived: boolean) {
    if (isArchived) {
      setConfirmDialog({
        message: 'Are you sure you want to restore this band?',
        onConfirm: async () => {
          try {
            const { error } = await supabase.from('bands').update({ is_archived: false }).eq('id', id);
            if (error) throw error;
            fetchBands();
          } catch (error: any) {
            console.error('Error restoring band:', error);
            setErrorMessage(error.message || 'Failed to restore band');
          } finally {
            setConfirmDialog(null);
          }
        }
      });
      return;
    }

    try {
      // Check for existing acts first
      const { data: acts, error: actsError } = await supabase
        .from('acts')
        .select('id')
        .eq('band_id', id);
        
      if (actsError) throw actsError;
      
      const hasActs = acts && acts.length > 0;

      setConfirmDialog({
        message: hasActs 
          ? `This band is scheduled for ${acts.length} act(s). It cannot be permanently deleted, but it will be archived instead. Are you sure you want to archive it?`
          : 'This band has no scheduled acts. Are you sure you want to permanently delete it? This action cannot be undone.',
        onConfirm: async () => {
          try {
            if (hasActs) {
              const { error } = await supabase.from('bands').update({ is_archived: true }).eq('id', id);
              if (error) throw error;
            } else {
              const { error } = await supabase.from('bands').delete().eq('id', id);
              if (error) throw error;
            }
            fetchBands();
          } catch (error: any) {
            console.error('Error deleting/archiving band:', error);
            setErrorMessage(error.message || 'Failed to delete/archive band');
          } finally {
            setConfirmDialog(null);
          }
        }
      });
    } catch (error: any) {
      console.error('Error checking band acts:', error);
      setErrorMessage(error.message || 'Failed to check band acts');
    }
  }

  async function handleDeleteOrArchiveVenue(id: string, isArchived: boolean) {
    if (isArchived) {
      setConfirmDialog({
        message: 'Are you sure you want to restore this venue?',
        onConfirm: async () => {
          try {
            const { error } = await supabase.from('venues').update({ is_archived: false }).eq('id', id);
            if (error) throw error;
            fetchVenues();
          } catch (error: any) {
            console.error('Error restoring venue:', error);
            setErrorMessage(error.message || 'Failed to restore venue');
          } finally {
            setConfirmDialog(null);
          }
        }
      });
      return;
    }

    try {
      // Check for existing events first
      const { data: venueEvents, error: eventsError } = await supabase
        .from('events')
        .select('id')
        .eq('venue_id', id);
        
      if (eventsError) throw eventsError;
      
      const hasEvents = venueEvents && venueEvents.length > 0;

      setConfirmDialog({
        message: hasEvents 
          ? `This venue has ${venueEvents.length} event(s) associated with it. It cannot be permanently deleted, but it will be archived instead. Are you sure you want to archive it?`
          : 'This venue has no events. Are you sure you want to permanently delete it? This action cannot be undone.',
        onConfirm: async () => {
          try {
            if (hasEvents) {
              const { error } = await supabase.from('venues').update({ is_archived: true }).eq('id', id);
              if (error) throw error;
            } else {
              const { error } = await supabase.from('venues').delete().eq('id', id);
              if (error) throw error;
            }
            fetchVenues();
          } catch (error: any) {
            console.error('Error deleting/archiving venue:', error);
            setErrorMessage(error.message || 'Failed to delete/archive venue');
          } finally {
            setConfirmDialog(null);
          }
        }
      });
    } catch (error: any) {
      console.error('Error checking venue events:', error);
      setErrorMessage(error.message || 'Failed to check venue events');
    }
  }

  async function fetchGenres() {
    setLoadingGenres(true);
    const { data } = await supabase.from('genres').select('*').order('name');
    if (data) setGenres(data);
    setLoadingGenres(false);
  }

  async function fetchVenues() {
    setLoadingVenues(true);
    const { data } = await supabase
      .from('venues')
      .select('*, profiles!updated_by(first_name, last_name, email)')
      .order('name');
    if (data) setVenues(data);
    setLoadingVenues(false);
  }

  async function fetchBands() {
    setLoadingBands(true);
    const { data } = await supabase
      .from('bands')
      .select('*, profiles!updated_by(first_name, last_name, email)')
      .order('name');
    if (data) setBands(data);
    setLoadingBands(false);
  }

  async function fetchEvents() {
    setLoadingEvents(true);
    const { data } = await supabase
      .from('events')
      .select('*, profiles!updated_by(first_name, last_name, email), venues(name), acts(start_time, bands(name))')
      .order('created_at', { ascending: false });
    if (data) setEvents(data);
    setLoadingEvents(false);
  }


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
    
    setCopyEvent(copiedEvent);
    setShowCopyEditor(true);
  };

  async function handleAddGenre(e: React.FormEvent) {
    e.preventDefault();
    if (!newGenreName.trim()) return;
    
    const { error } = await supabase.from('genres').insert({ name: newGenreName.trim() });
    if (error) {
      alert(error.message);
    } else {
      setNewGenreName('');
      setIsAddingGenre(false);
      fetchGenres();
    }
  }

  async function handleDeleteGenre(id: string) {
    setConfirmDialog({
      message: 'Are you sure you want to delete this genre?',
      onConfirm: async () => {
        try {
          const { error } = await supabase.from('genres').delete().eq('id', id);
          if (error) throw error;
          fetchGenres();
        } catch (error: any) {
          console.error('Error deleting genre:', error);
          setErrorMessage(error.message || 'Failed to delete genre');
        } finally {
          setConfirmDialog(null);
        }
      }
    });
  }

  async function clearTestData() {
    if (!user) return;
    setConfirmDialog({
      message: 'This will delete ALL venues, bands, and events owned by you. Are you sure?',
      onConfirm: async () => {
        setIsSeeding(true);
        try {
          // Delete in order to respect foreign keys
          const { error: eErr } = await supabase.from('events').delete().eq('venue_id', (await supabase.from('venues').select('id').eq('manager_id', user.id)).data?.[0]?.id || '');
          const { error: vErr } = await supabase.from('venues').delete().eq('manager_id', user.id);
          const { error: bErr } = await supabase.from('bands').delete().eq('manager_id', user.id);
          
          if (vErr || bErr) throw vErr || bErr;
          
          alert('Data cleared successfully!');
          refreshProfile();
        } catch (error: any) {
          console.error('Error clearing data:', error);
          setErrorMessage(error.message || 'Failed to clear data');
        } finally {
          setIsSeeding(false);
          setConfirmDialog(null);
        }
      }
    });
  }

  async function seedTestData() {
    if (!user) return;
    setIsSeeding(true);
    try {
      // 1. Create 5 Test Venues
      const venueNames = ['The Jazz Corner', 'Rock Arena', 'Blues Bar', 'Classical Hall', 'Indie Stage'];
      const { data: insertedVenues, error: vError } = await supabase
        .from('venues')
        .insert(venueNames.map((name, i) => ({
          manager_id: user.id,
          name: `Test Venue ${i + 1}: ${name}`,
          address: `${100 + i} Main St, Buffalo, NY`,
          description: `A great place for ${name.split(' ')[0]} music.`,
          phone: '555-010' + i,
          email: `venue${i}@example.com`,
          website: `https://venue${i}.com`,
          images: [`https://picsum.photos/seed/venue${i}/800/600`]
        })))
        .select();

      if (vError) throw vError;

      // 2. Create 1 Test Band
      const { data: insertedBand, error: bandError } = await supabase
        .from('bands')
        .insert([{
          manager_id: user.id,
          name: 'The Test Band',
          description: 'A band created for testing purposes.',
          phone: '555-TEST',
          email: 'testband@example.com',
          website: 'https://testband.com',
          images: ['https://picsum.photos/seed/testband/800/600']
        }])
        .select()
        .single();

      if (bandError) throw bandError;

      // 3. Create 3 Test Events for each Venue
      for (const venue of insertedVenues || []) {
        for (let j = 1; j <= 3; j++) {
          const startTime = new Date();
          startTime.setDate(startTime.getDate() + (parseInt(venue.name.split(' ').pop() || '0') * 2) + j);
          
          const { data: insertedEvent, error: eventError } = await supabase
            .from('events')
            .insert([{
              venue_id: venue.id,
              title: `Test Event ${venue.name.split(' ').pop()} - ${j}`,
              description: `Test Description for Event ${j} at ${venue.name}`,
              doors_open_time: '19:00:00',
              ticket_price_low: 10,
              ticket_price_high: 25,
              ticket_disclaimer: 'Test Disclaimer',
              venue_confirmed: true,
              band_confirmed: true,
              is_public: true,
              is_published: true
            }])
            .select()
            .single();

          if (eventError) throw eventError;

          // 4. Create Act for the Event
          const { error: actError } = await supabase
            .from('acts')
            .insert([{
              event_id: insertedEvent.id,
              band_id: insertedBand.id,
              start_time: startTime.toISOString()
            }]);

          if (actError) throw actError;
        }
      }

      alert('Seed data created successfully!');
      refreshProfile();
    } catch (error) {
      console.error('Error seeding data:', error);
      alert('Error seeding data. Check console.');
    } finally {
      setIsSeeding(false);
    }
  }

  const tabs = [
    { id: 'venues', label: 'Venues' },
    { id: 'bands', label: 'Bands' },
    { id: 'people', label: 'People' },
    { id: 'stock', label: 'Images' },
    { id: 'scraper', label: 'Uploads' },
    { id: 'sponsors', label: 'Sponsors' },
    { id: 'events', label: 'Events' },
    { id: 'syndication', label: 'Syndication' },
    { id: 'genres', label: 'Genres' },
    { id: 'deduplication', label: 'Deduplication' },
    { id: 'system', label: 'System' },
  ];

  const activeTabLabel = tabs.find(t => t.id === activeSubTab)?.label || 'Select Tab';

  return (
    <div className="space-y-8">
      {confirmDialog && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 w-full max-w-md relative">
            <h3 className="text-xl font-bold text-white mb-4">Confirm Action</h3>
            <p className="text-neutral-400 mb-8">{confirmDialog.message}</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-6 py-2.5 rounded-xl font-bold text-neutral-400 hover:text-white transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl flex justify-between items-start">
          <div className="flex-1">{errorMessage}</div>
          <button onClick={() => setErrorMessage(null)} className="text-red-500 hover:text-red-400 ml-4 mt-1">
            <X size={20} />
          </button>
        </div>
      )}

      <h2 className="text-4xl font-bold tracking-tight">Admin Dashboard</h2>
      
      <div className="relative" ref={dropdownRef}>
        <button 
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full md:w-64 flex justify-between items-center px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl text-sm font-bold uppercase tracking-widest text-white hover:bg-neutral-800 transition-all"
        >
          {activeTabLabel}
          <ChevronDown size={16} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {isDropdownOpen && (
          <div className="absolute top-full left-0 w-full md:w-64 mt-2 bg-neutral-900 border border-neutral-800 rounded-xl shadow-xl z-50 overflow-hidden">
            {tabs.map((tab) => (
              <button 
                key={tab.id}
                onClick={() => {
                  setActiveSubTab(tab.id);
                  setIsDropdownOpen(false);
                }}
                className={`w-full px-4 py-3 text-sm font-bold uppercase tracking-widest transition-all text-left ${
                  activeSubTab === tab.id 
                    ? 'bg-red-600 text-white' 
                    : 'text-neutral-500 hover:bg-neutral-800 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-grow bg-neutral-900 border border-neutral-800 rounded-3xl p-8">
          {activeSubTab === 'people' && (
            <PeopleManager />
          )}
          {activeSubTab === 'genres' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Manage Genres</h3>
                {!isAddingGenre ? (
                  <button 
                    onClick={() => setIsAddingGenre(true)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2"
                  >
                    <Plus size={16} /> Add Genre
                  </button>
                ) : (
                  <form onSubmit={handleAddGenre} className="flex gap-2">
                    <input
                      autoFocus
                      type="text"
                      value={newGenreName}
                      onChange={(e) => setNewGenreName(e.target.value)}
                      placeholder="Genre name..."
                      className="bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-red-600 outline-none"
                    />
                    <button 
                      type="submit"
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all"
                    >
                      Save
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        setIsAddingGenre(false);
                        setNewGenreName('');
                      }}
                      className="bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all"
                    >
                      Cancel
                    </button>
                  </form>
                )}
              </div>
              {loadingGenres ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-red-600" size={32} /></div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {genres.map((g) => (
                    <div key={g.id} className="p-4 bg-neutral-800 rounded-2xl flex justify-between items-center group">
                      <span className="font-medium">{g.name}</span>
                      <button 
                        onClick={() => handleDeleteGenre(g.id)}
                        className="text-neutral-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  {genres.length === 0 && (
                    <div className="col-span-full text-center text-neutral-500 py-8">No genres found.</div>
                  )}
                </div>
              )}
            </div>
          )}
          {activeSubTab === 'sponsors' && (
            <div className="space-y-6 text-center py-12">
              <div className="w-20 h-20 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="text-neutral-600" size={32} />
              </div>
              <h3 className="text-xl font-bold">Global Sponsors</h3>
              <p className="text-neutral-500 max-w-md mx-auto">Manage sponsors that appear across the entire platform and all syndication partners.</p>
              <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-xl font-bold transition-all">
                Add Global Sponsor
              </button>
            </div>
          )}
          {activeSubTab === 'syndication' && (
            <div className="space-y-6 text-center py-12">
              <div className="w-20 h-20 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="text-neutral-600" size={32} />
              </div>
              <h3 className="text-xl font-bold">Syndication Partners</h3>
              <p className="text-neutral-500 max-w-md mx-auto">Manage external websites and platforms that display your event data.</p>
              <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-xl font-bold transition-all">
                Add Partner
              </button>
            </div>
          )}
          {activeSubTab === 'venues' && !editingId && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Manage Venues</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search venues..."
                    className="bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-red-600 outline-none"
                    value={venueSearch}
                    onChange={(e) => setVenueSearch(e.target.value)}
                  />
                  <select
                    className="bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-red-600 outline-none"
                    value={venueFilter}
                    onChange={(e) => setVenueFilter(e.target.value)}
                  >
                    <option value="">All Venues</option>
                    <option value="missing_address">Missing Address</option>
                    <option value="missing_phone">Missing Phone</option>
                    <option value="missing_email">Missing Email</option>
                    <option value="archived">Archived Venues</option>
                  </select>
                </div>
              </div>
              {loadingVenues ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-red-600" size={32} /></div>
              ) : (
                <div className="space-y-2">
                  {filteredVenues.map((v: any) => (
                    <div key={v.id} className="p-4 bg-neutral-800 rounded-2xl flex justify-between items-center group">
                      <div className="space-y-1">
                        <span className="font-medium block">{v.name}</span>
                        {v.updated_at && (
                          <div className="flex items-center gap-2 text-[10px] text-neutral-500 font-medium uppercase tracking-wider">
                            <Clock size={10} />
                            <span>Last Edit: {formatDate(v.updated_at)} at {formatTime(v.updated_at)}</span>
                            {v.profiles && (
                              <>
                                <span className="text-neutral-700">•</span>
                                <span className="text-red-600/70">By {v.profiles.first_name} {v.profiles.last_name} ({v.profiles.email})</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setEditingId(v.id)}
                          className="text-neutral-500 hover:text-red-600 transition-all cursor-pointer bg-neutral-900/50 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteOrArchiveVenue(v.id, !!(v as any).is_archived)}
                          className={`transition-all cursor-pointer px-3 py-2 rounded-xl ${
                            (v as any).is_archived 
                              ? 'bg-green-600/10 text-green-500 hover:bg-green-600/20' 
                              : 'bg-neutral-900/50 text-neutral-500 hover:text-red-600'
                          }`}
                          title={(v as any).is_archived ? "Restore Venue" : "Delete/Archive Venue"}
                        >
                          {(v as any).is_archived ? <RefreshCcw size={16} /> : <Trash2 size={16} />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {activeSubTab === 'venues' && editingId && (
            <div className="space-y-6">
              <button onClick={() => setEditingId(null)} className="text-neutral-500 hover:text-white">← Back to List</button>
              <VenueProfileEditor venueId={editingId} hideDropdown={true} />
            </div>
          )}
          {activeSubTab === 'bands' && !editingId && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Manage Bands</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search bands..."
                    className="bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-red-600 outline-none"
                    value={bandSearch}
                    onChange={(e) => setBandSearch(e.target.value)}
                  />
                  <select
                    className="bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-red-600 outline-none"
                    value={bandFilter}
                    onChange={(e) => setBandFilter(e.target.value)}
                  >
                    <option value="">All Bands</option>
                    <option value="missing_phone">Missing Phone</option>
                    <option value="missing_email">Missing Email</option>
                    <option value="missing_city">Missing City</option>
                    <option value="missing_state">Missing State</option>
                    <option value="missing_logo">Missing Logo</option>
                    <option value="missing_hero">Missing Hero Image</option>
                    <option value="missing_description">Missing Description</option>
                    <option value="unpublished">Unpublished</option>
                    <option value="archived">Archived Bands</option>
                  </select>
                </div>
              </div>
              {loadingBands ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-red-600" size={32} /></div>
              ) : (
                <div className="space-y-2">
                  {filteredBands.map((b: any) => (
                    <div key={b.id} className="p-4 bg-neutral-800 rounded-2xl flex justify-between items-center group">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium block">{b.name}</span>
                          {b.is_published && <span className="px-2 py-0.5 bg-green-500/10 text-green-500 rounded text-[10px] font-bold uppercase">Published</span>}
                        </div>
                        {b.updated_at && (
                          <div className="flex items-center gap-2 text-[10px] text-neutral-500 font-medium uppercase tracking-wider">
                            <Clock size={10} />
                            <span>Last Edit: {formatDate(b.updated_at)} at {formatTime(b.updated_at)}</span>
                            {b.profiles && (
                              <>
                                <span className="text-neutral-700">•</span>
                                <span className="text-red-600/70">By {b.profiles.first_name} {b.profiles.last_name} ({b.profiles.email})</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setEditingId(b.id)}
                          className="text-neutral-500 hover:text-red-600 transition-all cursor-pointer bg-neutral-900/50 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteOrArchiveBand(b.id, !!(b as any).is_archived)}
                          className={`transition-all cursor-pointer px-3 py-2 rounded-xl ${
                            (b as any).is_archived 
                              ? 'bg-green-600/10 text-green-500 hover:bg-green-600/20' 
                              : 'bg-neutral-900/50 text-neutral-500 hover:text-red-600'
                          }`}
                          title={(b as any).is_archived ? "Restore Band" : "Delete/Archive Band"}
                        >
                          {(b as any).is_archived ? <RefreshCcw size={16} /> : <Trash2 size={16} />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {activeSubTab === 'bands' && editingId && (
            <div className="space-y-6">
              <button onClick={() => setEditingId(null)} className="text-neutral-500 hover:text-white">← Back to List</button>
              <BandProfileEditor bandId={editingId} />
            </div>
          )}
          {activeSubTab === 'events' && !editingId && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Manage Events</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search events, venues, or bands..."
                    className="bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-red-600 outline-none w-64"
                    value={eventSearch}
                    onChange={(e) => setEventSearch(e.target.value)}
                  />
                  <select
                    className="bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-red-600 outline-none"
                    value={eventFilter}
                    onChange={(e) => setEventFilter(e.target.value)}
                  >
                    <option value="">All Events</option>
                    <option value="missing_start_time">Missing Start Time</option>
                    <option value="missing_venue">Missing Venue</option>
                  </select>
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
                </div>
              </div>
              {loadingEvents ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-red-600" size={32} /></div>
              ) : (
                <div className="space-y-2">
                  {filteredEvents.map((e: any) => (
                    <div key={e.id} className="p-4 bg-neutral-800 rounded-2xl flex justify-between items-center group">
                      <div className="space-y-1">
                        <span className="font-medium block">{e.title}</span>
                        <div className="flex items-center gap-3 text-[10px] text-neutral-500 font-medium uppercase tracking-wider">
                          <span className="flex items-center gap-1">
                            <Calendar size={10} /> 
                            {e.start_time ? formatDate(e.start_time) : (e.acts?.[0]?.start_time ? formatDate(e.acts[0].start_time) : 'No Date')}
                          </span>
                          {e.venues && (
                            <span className="flex items-center gap-1"><MapPin size={10} /> {e.venues.name}</span>
                          )}
                          {e.updated_at && (
                            <div className="flex items-center gap-2">
                              <span className="text-neutral-700">•</span>
                              <Clock size={10} />
                              <span>Last Edit: {formatDate(e.updated_at)} at {formatTime(e.updated_at)}</span>
                              {e.profiles && (
                                <>
                                  <span className="text-neutral-700">•</span>
                                  <span className="text-red-600/70">By {e.profiles.first_name} {e.profiles.last_name} ({e.profiles.email})</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleCopyAsNew(e)}
                          className="bg-blue-500/10 hover:bg-blue-500 text-blue-500 hover:text-white border border-blue-500/20 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
                        >
                          Copy
                        </button>
                        <button 
                          onClick={() => setEditingId(e.id)}
                          className="bg-red-600/10 hover:bg-red-600 text-red-600 hover:text-white border border-red-600/20 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                  {filteredEvents.length === 0 && (
                    <div className="text-center py-12 text-neutral-500">No events found.</div>
                  )}
                </div>
              )}
              {showCopyEditor && (
                <EventEditor 
                  event={copyEvent}
                  isCopying={true}
                  onClose={() => setShowCopyEditor(false)}
                  onSave={() => {
                    fetchEvents();
                    setShowCopyEditor(false);
                  }}
                />
              )}
            </div>
          )}
          {activeSubTab === 'events' && editingId && (
            <div className="space-y-6">
              <button onClick={() => setEditingId(null)} className="text-neutral-500 hover:text-white">← Back to List</button>
              <EventProfileEditor eventId={editingId} />
            </div>
          )}
          {activeSubTab === 'scraper' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-red-600/10 rounded-2xl flex items-center justify-center text-red-600">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Uploads</h3>
                  <p className="text-neutral-500 text-sm">Manage your uploads.</p>
                </div>
              </div>
              <ScraperView />
            </div>
          )}
          {activeSubTab === 'stock' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Images</h3>
                  <p className="text-neutral-500 text-sm mt-1">Manage the library of images.</p>
                </div>
                <div className="flex gap-2">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={heroFileInputRef} 
                    onChange={handleHeroUpload} 
                  />
                  <button
                    onClick={() => heroFileInputRef.current?.click()}
                    disabled={uploadingHero}
                    className="px-6 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all border border-neutral-700 flex items-center gap-2"
                  >
                    {uploadingHero ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    {uploadingHero ? 'Uploading...' : 'Upload Home Hero'}
                  </button>
                  <button
                    onClick={handleAddStockImage}
                    className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all"
                  >
                    Add Stock Image URL
                  </button>
                </div>
              </div>

              {loadingStock ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="animate-spin text-red-600" size={32} />
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {stockImages.map((img) => (
                    <div key={img.id} className="group relative aspect-square rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-800">
                      <img src={img.thumbnail} alt={img.label} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                        <p className="text-white text-[10px] font-bold truncate">{img.label}</p>
                        <p className="text-red-600 text-[8px] font-bold uppercase tracking-widest">{img.type} / {img.category}</p>
                        <button
                          onClick={() => handleDeleteStockImage(img.id)}
                          className="mt-2 w-full py-1 bg-red-500 hover:bg-red-600 text-white text-[8px] font-bold uppercase tracking-widest rounded-lg transition-all"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                  {stockImages.length === 0 && (
                    <div className="col-span-full py-20 text-center text-neutral-500">
                      <p>No dynamic stock images found. The library is currently using hardcoded defaults.</p>
                      <p className="text-xs mt-2">Add images here to populate the dynamic library.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {activeSubTab === 'deduplication' && (
            <DeduplicationTool />
          )}
          {activeSubTab === 'system' && (
            <div className="space-y-6 text-center py-12">
              <div className="w-20 h-20 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Settings className="text-neutral-600" size={32} />
              </div>
              <h3 className="text-xl font-bold">System Utilities</h3>
              <p className="text-neutral-500 max-w-md mx-auto">Perform administrative tasks and manage system data.</p>
              
              <div className="flex flex-col gap-4 max-w-xs mx-auto">
                <button 
                  onClick={seedTestData}
                  disabled={isSeeding}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-neutral-700 text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                >
                  {isSeeding ? <Loader2 className="animate-spin" size={18} /> : null}
                  {isSeeding ? 'Processing...' : 'Seed Test Data'}
                </button>
                
                <button 
                  onClick={clearTestData}
                  disabled={isSeeding}
                  className="bg-neutral-800 hover:bg-red-900/30 hover:text-red-500 text-neutral-400 px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 border border-neutral-700"
                >
                  {isSeeding ? <Loader2 className="animate-spin" size={18} /> : null}
                  {isSeeding ? 'Processing...' : 'Clear All My Data'}
                </button>
              </div>
              
              <p className="text-xs text-neutral-600 mt-4">Seed data creates 5 venues, 1 band, and 15 events. Clear data removes everything owned by you.</p>
            </div>
          )}
        </div>
    </div>
  );
}