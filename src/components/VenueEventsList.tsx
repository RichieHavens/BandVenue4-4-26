import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AppEvent } from '../types';
import { Loader2, Plus, Calendar, Clock } from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { cn } from '../lib/utils';

interface VenueEventsListProps {
  venueId: string;
  venueIds: string[];
}

export function VenueEventsList({ venueId, venueIds }: VenueEventsListProps) {
  const [events, setEvents] = useState<(AppEvent & { venues?: { name: string } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPast, setShowPast] = useState(false);
  const [scope, setScope] = useState<'this-venue' | 'all-venues'>('this-venue');

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true);
      let query = supabase
        .from('events')
        .select('*, venues(name)');
      
      if (scope === 'this-venue') {
        query = query.eq('venue_id', venueId);
      } else {
        query = query.in('venue_id', venueIds);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching events:', error);
      } else {
        setEvents(data || []);
      }
      setLoading(false);
    }
    fetchEvents();
  }, [venueId, venueIds, scope]);

  const now = new Date().toISOString();
  
  const upcomingEvents = events
    .filter(e => !e.start_time || e.start_time >= now)
    .sort((a, b) => {
      if (!a.start_time) return 1;
      if (!b.start_time) return -1;
      return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
    });

  const pastEvents = events
    .filter(e => e.start_time && e.start_time < now)
    .sort((a, b) => new Date(b.start_time!).getTime() - new Date(a.start_time!).getTime());

  const displayedEvents = showPast ? pastEvents : upcomingEvents;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-2xl font-bold whitespace-nowrap">{showPast ? 'Past Events' : 'Upcoming Events'}</h2>
        <div className="flex gap-2">
            <div className="flex bg-neutral-800 rounded-lg p-1">
                <button onClick={() => setScope('this-venue')} className={cn("px-3 py-1.5 text-sm rounded-md", scope === 'this-venue' ? "bg-neutral-700 text-white" : "text-neutral-400")}>This Venue</button>
                <button onClick={() => setScope('all-venues')} className={cn("px-3 py-1.5 text-sm rounded-md", scope === 'all-venues' ? "bg-neutral-700 text-white" : "text-neutral-400")}>All My Venues</button>
            </div>
            <Button variant="secondary" size="sm" className="h-10" onClick={() => setShowPast(!showPast)}>
                {showPast ? 'Show Upcoming' : 'Show Past'}
            </Button>
            <Button variant="primary" size="sm" className="flex items-center gap-1.5 h-10">
              <Plus size={16} /> Add Event
            </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-red-600" size={48} /></div>
      ) : displayedEvents.length === 0 ? (
        <div className="text-center p-12 bg-neutral-900 rounded-2xl border border-neutral-800">
            <p className="text-neutral-400">No {showPast ? 'past' : 'upcoming'} events found.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {displayedEvents.map(event => (
            <Card key={event.id} className="p-4 flex items-center justify-between">
                <div>
                    <h3 className="font-bold">
                        {event.title} 
                        {scope === 'all-venues' && event.venues?.name && <span className="text-neutral-500 text-sm font-normal"> at {event.venues.name}</span>}
                    </h3>
                    <p className="text-sm text-neutral-400 flex items-center gap-2">
                        <Calendar size={14} /> {event.start_time ? new Date(event.start_time).toLocaleDateString() : 'TBD'}
                        <Clock size={14} /> {event.start_time ? new Date(event.start_time).toLocaleTimeString() : ''}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" size="sm">View</Button>
                    <Button variant="secondary" size="sm">Edit</Button>
                    <Button variant="secondary" size="sm">Copy</Button>
                </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
