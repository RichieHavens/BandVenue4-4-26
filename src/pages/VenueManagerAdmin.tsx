import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { supabase } from '../lib/supabase';
import VenueEventAdminTool from '../components/VenueEventAdminTool';
import { LayoutDashboard, Calendar } from 'lucide-react';

export function VenueManagerAdmin() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [venueId, setVenueId] = useState<string>('');

  React.useEffect(() => {
    async function fetchVenue() {
      if (profile?.id) {
        const { data, error } = await supabase
          .from('venues')
          .select('id')
          .eq('manager_id', profile.id)
          .single();
        
        if (data) {
          setVenueId(data.id);
        }
      }
    }
    fetchVenue();
  }, [profile?.id]);

  return (
    <div className="p-6 space-y-6">
      <header className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Venue Manager Admin</h1>
        <div className="text-neutral-400">
          Welcome, {profile?.first_name} {profile?.last_name}
        </div>
      </header>

      <nav className="flex gap-4 border-b border-neutral-700 pb-4">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold ${
            activeTab === 'dashboard' ? 'bg-red-600 text-white' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <LayoutDashboard size={18} />
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold ${
            activeTab === 'events' ? 'bg-red-600 text-white' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Calendar size={18} />
          Venue Event Manager
        </button>
      </nav>

      <main>
        {activeTab === 'dashboard' && (
          <div className="p-12 text-center text-neutral-500 bg-neutral-800 rounded-2xl">
            Venue Dashboard Overview (Coming Soon)
          </div>
        )}
        {activeTab === 'events' && (
          <VenueEventAdminTool venueId={venueId} />
        )}
      </main>
    </div>
  );
}
