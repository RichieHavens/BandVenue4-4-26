import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Calendar, MapPin, Search, Plus, History, Clock, Loader2, ArrowRight, Copy } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AppEvent, Venue, Band } from '../types';
import { formatDate, formatTime } from '../lib/utils';
import { useAuth } from '../AuthContext';

interface NewGigFlowProps {
  bandId: string;
  onComplete: () => void;
  onCancel: () => void;
}

export default function NewGigFlow({ bandId, onComplete, onCancel }: NewGigFlowProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [venueSearch, setVenueSearch] = useState('');
  const [history, setHistory] = useState<AppEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchVenues();
  }, []);

  useEffect(() => {
    if (selectedVenue) {
      fetchVenueHistory();
    }
  }, [selectedVenue]);

  async function fetchVenues() {
    try {
      setLoading(true);
      // Fetch venues where the user is the manager
      const { data: managedVenues, error: managedError } = await supabase
        .from('venues')
        .select('*')
        .eq('manager_id', user?.id)
        .order('name');
      
      if (managedError) throw managedError;

      // Fetch venues where the user's managed bands have events
      // First get IDs of managed bands
      const { data: managedBands } = await supabase
        .from('bands')
        .select('id')
        .eq('manager_id', user?.id);
      
      const bandIds = managedBands?.map(b => b.id) || [];
      
      let associatedVenues: Venue[] = [];
      if (bandIds.length > 0) {
        const { data: eventVenues, error: eventError } = await supabase
          .from('events')
          .select('venues (*)')
          .in('acts.band_id', bandIds);
        
        if (!eventError && eventVenues) {
          associatedVenues = eventVenues.map((ev: any) => ev.venues).filter(Boolean);
        }
      }

      // Combine and unique
      const combined = [...(managedVenues || []), ...associatedVenues];
      const unique = Array.from(new Map(combined.map(v => [v.id, v])).values());
      unique.sort((a, b) => a.name.localeCompare(b.name));
      
      setVenues(unique);
    } catch (err) {
      console.error('Error fetching venues:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchVenueHistory() {
    if (!selectedVenue) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select('*, acts(*)')
        .eq('venue_id', selectedVenue.id)
        .order('start_time', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      setHistory(data || []);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateNew = async (template?: AppEvent) => {
    try {
      setCreating(true);
      const startTime = template ? `${selectedDate}T${formatTime(template.start_time || '20:00:00')}` : `${selectedDate}T20:00:00`;
      
      const newEvent: any = {
        venue_id: selectedVenue?.id,
        title: template?.title || 'New Event',
        description: template?.description || '',
        hero_url: template?.hero_url || selectedVenue?.hero_url || '',
        status: 'draft',
        is_public: false,
        created_by_id: user?.id,
        start_time: startTime
      };

      const { data: createdEvent, error: eventError } = await supabase
        .from('events')
        .insert(newEvent)
        .select()
        .single();

      if (eventError) throw eventError;

      // Create initial act for the band
      const { error: actError } = await supabase
        .from('acts')
        .insert({
          event_id: createdEvent.id,
          band_id: bandId,
          start_time: startTime
        });

      if (actError) throw actError;

      onComplete();
    } catch (err) {
      console.error('Error creating gig:', err);
      alert('Failed to create gig. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const filteredVenues = venues.filter(v => 
    v.name.toLowerCase().includes(venueSearch.toLowerCase())
  );

  const upcomingEvents = history.filter(e => e.start_time && new Date(e.start_time) >= new Date());
  const pastEvents = history.filter(e => e.start_time && new Date(e.start_time) < new Date());

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white">New Gig</h2>
        <Button variant="ghost" onClick={onCancel} disabled={creating}>Cancel</Button>
      </div>

      {step === 1 && (
        <Card className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Select Date</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={20} />
                <Input 
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="pl-12 h-14 text-lg"
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Select Venue</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={20} />
                <Input 
                  placeholder="Search venues..."
                  value={venueSearch}
                  onChange={(e) => setVenueSearch(e.target.value)}
                  className="pl-12 h-14"
                />
              </div>

              <div className="max-h-[300px] overflow-y-auto custom-scrollbar border border-neutral-800 rounded-2xl bg-neutral-950/50">
                {loading && venues.length === 0 ? (
                  <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-blue-500" /></div>
                ) : (
                  <div className="divide-y divide-neutral-800">
                    {filteredVenues.map(venue => (
                      <button
                        key={venue.id}
                        onClick={() => {
                          setSelectedVenue(venue);
                          setStep(2);
                        }}
                        className="w-full text-left px-6 py-4 hover:bg-neutral-800 transition-colors flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-4">
                          <MapPin size={18} className="text-neutral-500 group-hover:text-blue-500 transition-colors" />
                          <div>
                            <p className="font-bold text-white">{venue.name}</p>
                            <p className="text-sm text-neutral-500">{venue.city}, {venue.state}</p>
                          </div>
                        </div>
                        <ArrowRight size={16} className="text-neutral-700 group-hover:text-white transition-colors" />
                      </button>
                    ))}
                    <button
                      onClick={() => handleCreateNew()}
                      className="w-full text-left px-6 py-4 hover:bg-blue-600/10 transition-colors flex items-center gap-4 text-blue-500 group"
                    >
                      <Plus size={20} />
                      <span className="font-bold">+ New Venue / Start Fresh</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {step === 2 && selectedVenue && (
        <div className="space-y-8 animate-in slide-in-from-right duration-300">
          <div className="flex items-center gap-4 bg-neutral-900 border border-neutral-800 p-6 rounded-3xl">
            <div className="w-16 h-16 rounded-2xl bg-neutral-800 overflow-hidden shrink-0">
              <img src={selectedVenue.logo_url || selectedVenue.hero_url || ''} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt="" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white">{selectedVenue.name}</h3>
              <p className="text-neutral-400 text-sm">{formatDate(selectedDate)}</p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setStep(1)}>Change</Button>
          </div>

          <Card className="p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-8 border-b border-neutral-800">
              <div>
                <h4 className="text-2xl font-bold text-white mb-2">Venue History</h4>
                <p className="text-neutral-400">Copy a previous gig or start fresh.</p>
              </div>
              <Button onClick={() => handleCreateNew()} disabled={creating} className="h-12 px-8">
                {creating ? <Loader2 className="animate-spin mr-2" /> : <Plus className="mr-2" size={20} />}
                Add New Gig
              </Button>
            </div>

            {loading ? (
              <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-blue-500" size={48} /></div>
            ) : (
              <div className="space-y-8">
                {upcomingEvents.length > 0 && (
                  <div className="space-y-4">
                    <h5 className="text-xs font-black uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                      <Clock size={14} /> Upcoming Events Here
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {upcomingEvents.map(event => (
                        <div key={event.id} className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl flex items-center justify-between group hover:border-neutral-700 transition-all">
                          <div>
                            <p className="font-bold text-white group-hover:text-blue-400 transition-colors">{event.title}</p>
                            <p className="text-sm text-neutral-500">{formatDate(event.start_time)}</p>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => handleCreateNew(event)} disabled={creating}>
                            <Copy size={16} className="mr-2" /> Copy New
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {pastEvents.length > 0 && (
                  <div className="space-y-4">
                    <h5 className="text-xs font-black uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                      <History size={14} /> Past Events Here
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {pastEvents.map(event => (
                        <div key={event.id} className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl flex items-center justify-between group hover:border-neutral-700 transition-all">
                          <div>
                            <p className="font-bold text-white group-hover:text-blue-400 transition-colors">{event.title}</p>
                            <p className="text-sm text-neutral-500">{formatDate(event.start_time)}</p>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => handleCreateNew(event)} disabled={creating}>
                            <Copy size={16} className="mr-2" /> Copy New
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {upcomingEvents.length === 0 && pastEvents.length === 0 && (
                  <div className="text-center py-12 bg-neutral-900/50 rounded-2xl border border-dashed border-neutral-800">
                    <History size={40} className="mx-auto text-neutral-700 mb-4" />
                    <p className="text-neutral-500">No event history found for this venue.</p>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
