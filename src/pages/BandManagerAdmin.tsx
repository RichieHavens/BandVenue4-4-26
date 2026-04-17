import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { supabase } from '../lib/supabase';
import { BandProfileEditor } from '../components/BandProfileEditor';
import EventManager from '../components/EventManager';
import RolePersonalizedHeader from '../components/RolePersonalizedHeader';
import { LayoutDashboard, Calendar, Music, Loader2, ChevronRight, UserCircle, Search, ShieldCheck, Plus, ChevronDown } from 'lucide-react';
import { Band } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import NewGigFlow from '../components/NewGigFlow';

export function BandManagerAdmin() {
  const { profile, activeRole } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [bands, setBands] = useState<Band[]>([]);
  const [bandId, setBandId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showBandSelector, setShowBandSelector] = useState(false);

  useEffect(() => {
    async function fetchBands() {
      if (profile?.id) {
        setLoading(true);
        try {
          // Fetch bands where the user is the manager_id
          const { data, error } = await supabase
            .from('bands_ordered')
            .select('*')
            .eq('manager_id', profile.id)
            .order('name');
          
          if (error) throw error;
          
          if (data) {
            setBands(data);
            // If only one band, auto-select it
            if (data.length === 1 && !bandId) {
              setBandId(data[0].id);
            }
          }
        } catch (err) {
          console.error('Error fetching managed bands:', err);
        } finally {
          setLoading(false);
        }
      }
    }
    fetchBands();
  }, [profile?.id]);

  const selectedBand = bands.find(b => b.id === bandId);
  const filteredBands = bands.filter(b => b.name.toLowerCase().includes(search.toLowerCase()));

  if (activeRole !== 'band_manager' && activeRole !== 'super_admin') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
        <div className="bg-red-600/10 p-6 rounded-3xl mb-6">
          <ShieldCheck className="text-red-500" size={48} />
        </div>
        <h2 className="text-3xl font-bold mb-4 text-white">Access Denied</h2>
        <p className="text-neutral-400 max-w-md mx-auto leading-relaxed">
          You do not have the required permissions to access the Band Manager dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-4">
        <div className="relative">
          {bands.length > 1 ? (
            <div className="relative">
              <button 
                onClick={() => setShowBandSelector(!showBandSelector)}
                className="flex items-center gap-3 px-6 py-3 bg-neutral-900 border border-neutral-800 rounded-2xl hover:bg-neutral-800 transition-all text-left min-w-[240px]"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center text-blue-500 overflow-hidden">
                  {selectedBand?.logo_url ? (
                    <img src={selectedBand.logo_url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <Music size={16} />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Currently Managing</p>
                  <p className="font-bold text-white truncate">{selectedBand?.name || 'Select Band'}</p>
                </div>
                <ChevronDown size={18} className={`text-neutral-500 transition-transform ${showBandSelector ? 'rotate-180' : ''}`} />
              </button>

              {showBandSelector && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="p-2">
                    {bands.map(band => (
                      <button
                        key={band.id}
                        onClick={() => {
                          setBandId(band.id);
                          setShowBandSelector(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                          bandId === band.id ? 'bg-blue-600/10 text-white' : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                        }`}
                      >
                        <div className="w-6 h-6 rounded bg-neutral-800 overflow-hidden">
                          {band.logo_url && <img src={band.logo_url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />}
                        </div>
                        <span className="font-bold text-sm">{band.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3 px-6 py-3 bg-neutral-900/50 border border-neutral-800 rounded-2xl">
              <Music size={18} className="text-blue-500" />
              <span className="font-bold text-white leading-tight">{selectedBand?.name || 'Band Dashboard'}</span>
            </div>
          )}
        </div>

        <Button 
          className="h-14 px-8 shadow-xl shadow-blue-600/20"
          onClick={() => {
            if (!bandId && bands.length > 0) {
              setBandId(bands[0].id);
            }
            setActiveTab('new-gig');
          }}
        >
          <Plus size={20} className="mr-2" />
          New Gig
        </Button>
      </div>

      <RolePersonalizedHeader pageId="band-manager" />

      <nav className="flex gap-4 border-b border-neutral-700 pb-4 overflow-x-auto no-scrollbar">
        <Button
          variant={activeTab === 'dashboard' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-2"
        >
          <LayoutDashboard size={18} />
          Dashboard
        </Button>
        <Button
          variant={activeTab === 'events' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('events')}
          className="flex items-center gap-2"
        >
          <Calendar size={18} />
          Events History
        </Button>
      </nav>

      <main>
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6">
                <p className="text-neutral-400 text-xs font-bold uppercase tracking-widest mb-2">Total Bands</p>
                <p className="text-4xl font-bold text-white">{bands.length}</p>
              </Card>
              <Card className="p-6">
                <p className="text-neutral-400 text-xs font-bold uppercase tracking-widest mb-2">Upcoming Gigs</p>
                <p className="text-4xl font-bold text-white">--</p>
              </Card>
              <Card className="p-6">
                <p className="text-neutral-400 text-xs font-bold uppercase tracking-widest mb-2">Pending Bookings</p>
                <p className="text-4xl font-bold text-white">--</p>
              </Card>
            </div>

            {bands.length > 0 && !bandId && (
              <div className="bg-amber-600/10 border border-amber-600/20 p-6 rounded-2xl flex items-center gap-4">
                <div className="bg-amber-600 p-2 rounded-lg">
                  <Music size={20} className="text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-white">Select a Band to Manage</h4>
                  <p className="text-sm text-neutral-400">You have multiple bands. Please select one from the "My Bands" tab to manage its events and profile.</p>
                </div>
              </div>
            )}

            {selectedBand && (
              <Card className="p-8 flex flex-col md:flex-row gap-8 items-center">
                <div className="w-32 h-32 rounded-2xl bg-neutral-900 overflow-hidden shrink-0">
                  <img 
                    src={selectedBand.logo_url || `https://picsum.photos/seed/band${selectedBand.id}/200/200`} 
                    alt={selectedBand.name} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-3xl font-bold mb-2 text-white">{selectedBand.name}</h3>
                  <p className="text-neutral-400 mb-4">
                    {selectedBand.description || 'No description provided.'}
                  </p>
                  <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                    <Button 
                      onClick={() => setActiveTab('new-gig')}
                    >
                      New Gig
                    </Button>
                    <Button 
                      variant="secondary"
                      onClick={() => setActiveTab('events')}
                    >
                      View Gigs
                    </Button>
                    <Button 
                      variant="secondary"
                      onClick={() => setActiveTab('profile')}
                    >
                      Edit Profile
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'bands' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-white">My Managed Bands</h2>
              <div className="relative w-full md:w-72">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                <Input
                  placeholder="Search your bands..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-12"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-blue-500" size={48} />
              </div>
            ) : filteredBands.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredBands.map((band) => (
                  <Card 
                    key={band.id}
                    className={`flex gap-6 p-6 transition-all group ${
                      bandId === band.id ? 'border-blue-500 ring-1 ring-blue-500' : 'border-neutral-700 hover:border-neutral-600'
                    }`}
                  >
                    <div className="w-24 h-24 rounded-2xl bg-neutral-900 overflow-hidden shrink-0">
                      <img 
                        src={band.logo_url || `https://picsum.photos/seed/band${band.id}/200/200`} 
                        alt={band.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold mb-1 truncate text-white">{band.name}</h3>
                      <p className="text-neutral-400 text-sm mb-4 truncate">{band.description || 'No description'}</p>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setBandId(band.id);
                            setActiveTab('events');
                          }}
                          className="text-xs text-blue-500 hover:text-blue-400"
                        >
                          Manage
                        </Button>
                        <span className="text-neutral-700">|</span>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setBandId(band.id);
                            setActiveTab('profile');
                          }}
                          className="text-xs text-neutral-400 hover:text-white"
                        >
                          Profile
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <Music className="mx-auto text-neutral-600 mb-4" size={48} />
                <p className="text-neutral-400">No bands found matching your search.</p>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'new-gig' && (
          <NewGigFlow 
            bandId={bandId} 
            onComplete={() => setActiveTab('events')}
            onCancel={() => setActiveTab('dashboard')} 
          />
        )}

        {activeTab === 'events' && (
          bandId ? (
            <EventManager bandId={bandId} />
          ) : (
            <Card className="p-12 text-center text-neutral-400">
              <Calendar className="mx-auto mb-4 opacity-20" size={48} />
              <p>Please select a band to manage its events.</p>
            </Card>
          )
        )}

        {activeTab === 'profile' && (
          bandId ? (
            <BandProfileEditor bandId={bandId} />
          ) : (
            <Card className="p-12 text-center text-neutral-400">
              <UserCircle className="mx-auto mb-4 opacity-20" size={48} />
              <p>Please select a band from the "My Bands" tab first.</p>
            </Card>
          )
        )}
      </main>
    </div>
  );
}
