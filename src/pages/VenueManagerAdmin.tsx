import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { supabase } from '../lib/supabase';
import { Venue } from '../types';
import { Loader2 } from 'lucide-react';
import VenueWorkspaceLayout from '../components/VenueWorkspaceLayout';

export function VenueManagerAdmin() {
  const { profile } = useAuth();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventCounts, setEventCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    async function fetchVenues() {
      if (profile?.id) {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from('venues')
            .select('*')
            .eq('manager_id', profile.id)
            .order('name');
          
          if (error) throw error;
          
          if (data) {
            setVenues(data);
          }
        } catch (err) {
          console.error('Error fetching managed venues:', err);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }
    fetchVenues();
  }, [profile?.id]);

  useEffect(() => {
    async function fetchEventCounts() {
      if (venues.length === 0) return;
      const venueIds = venues.map(v => v.id);
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('events')
        .select('venue_id')
        .in('venue_id', venueIds)
        .or(`start_time.gte.${now},start_time.is.null`);
      
      if (data) {
        const counts: Record<string, number> = {};
        data.forEach(e => {
          counts[e.venue_id] = (counts[e.venue_id] || 0) + 1;
        });
        setEventCounts(counts);
      }
    }
    fetchEventCounts();
  }, [venues]);

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-red-600" size={48} /></div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Venue Manager Workspace</h1>
      {venues.length > 0 ? (
        <VenueWorkspaceLayout venues={venues} loading={loading} eventCounts={eventCounts} />
      ) : (
        <div className="text-center p-12 bg-neutral-900 rounded-2xl border border-neutral-800">
          <h2 className="text-xl font-bold mb-2">No Venues Found</h2>
          <p className="text-neutral-400">You don't have any venues assigned to your account yet.</p>
        </div>
      )}
    </div>
  );
}
