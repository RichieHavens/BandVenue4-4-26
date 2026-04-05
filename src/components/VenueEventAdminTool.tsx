import React, { useState } from 'react';
import { Plus, Loader2, Save, X, Calendar, Clock, MapPin, DollarSign, FileText, AlertCircle } from 'lucide-react';
import { VenueEventProfile } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../AuthContext';

export default function VenueEventAdminTool({ venueId }: { venueId: string }) {
  const { user } = useAuth();
  const [events, setEvents] = useState<VenueEventProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [formData, setFormData] = useState<Partial<VenueEventProfile>>({
    title: '',
    description: '',
    start_time: new Date().toISOString().split('T')[0] + 'T20:00',
    doors_open_time: '19:00',
    cover_charge: 0,
    overall_status: 'draft',
    has_multiple_acts: false,
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('venue_event_profiles')
      .insert({
        ...formData,
        venue_id: venueId,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving event:', error);
    } else {
      setEvents([...events, data]);
      setShowEditor(false);
    }
    setLoading(false);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Venue Event Admin Tool</h2>
        <button 
          onClick={() => setShowEditor(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-semibold transition-all flex items-center gap-2"
        >
          <Plus size={20} />
          New Event
        </button>
      </div>
      
      {showEditor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleSave} className="bg-neutral-900 p-6 rounded-2xl w-full max-w-lg space-y-4">
            <h3 className="text-xl font-bold">New Event</h3>
            <input 
              type="text" 
              placeholder="Event Title" 
              className="w-full bg-neutral-800 p-3 rounded-xl"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              required
            />
            <textarea 
              placeholder="Description" 
              className="w-full bg-neutral-800 p-3 rounded-xl"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
            <div className="flex gap-4">
              <input 
                type="datetime-local" 
                className="w-full bg-neutral-800 p-3 rounded-xl"
                value={formData.start_time}
                onChange={e => setFormData({...formData, start_time: e.target.value})}
                required
              />
              <input 
                type="time" 
                className="w-full bg-neutral-800 p-3 rounded-xl"
                value={formData.doors_open_time}
                onChange={e => setFormData({...formData, doors_open_time: e.target.value})}
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowEditor(false)} className="px-4 py-2 text-neutral-400">Cancel</button>
              <button type="submit" className="bg-red-600 text-white px-4 py-2 rounded-xl" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : 'Save Event'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
