import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import AuthUI from './components/AuthUI';
import VenueProfileEditor from './components/VenueProfileEditor';
import BandProfileEditor from './components/BandProfileEditor';
import EventProfileEditor from './components/EventProfileEditor';
import ProfileManager from './components/ProfileManager';
import EventManager from './components/EventManager';
import DisclaimerOverlay from './components/DisclaimerOverlay';
import ResetPasswordView from './components/ResetPasswordView';
import AboutModal from './components/AboutModal';
import EventDetailsModal from './components/EventDetailsModal';
import { Toaster } from 'sonner';
import SupabaseErrorBoundary from './components/SupabaseErrorBoundary';

// Pages
import { EventsView } from './pages/EventsView';
import { VenuesView } from './pages/VenuesView';
import { BandsView } from './pages/BandsView';
import { MusiciansView } from './pages/MusiciansView';
import { FavoritesView } from './pages/FavoritesView';
import { SyndicationManagerView } from './pages/SyndicationManagerView';
import { AdminView } from './pages/AdminView';

import { 
  Loader2, LogOut, Music, Calendar, MapPin, Users, Settings, 
  ShieldCheck, UserCircle, Heart, Globe, LayoutDashboard, ChevronDown, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function AppContent() {
  const { user, profile, loading, signOut, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = React.useState('events');
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [pendingTab, setPendingTab] = useState<string | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);

  useEffect(() => {
    // Close dashboard when tab changes
    setIsDashboardOpen(false);
  }, [activeTab]);

  useEffect(() => {
    // Check if we are in a password reset flow
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      setIsResettingPassword(true);
    }
    
    // Also check for the specific route we set in AuthUI
    if (window.location.pathname === '/reset-password') {
      setIsResettingPassword(true);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <Loader2 className="animate-spin text-red-600" size={48} />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <DisclaimerOverlay />
        <AuthUI />
      </>
    );
  }

  if (isResettingPassword) {
    return <ResetPasswordView onComplete={() => {
      setIsResettingPassword(false);
      window.history.replaceState({}, document.title, "/");
      refreshProfile();
    }} />;
  }

  if (!profile || !profile.roles || profile.roles.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-950 p-4 text-center">
        <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-[2.5rem] max-w-md w-full shadow-2xl">
          <div className="w-16 h-16 bg-red-600/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="text-red-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold mb-4">Profile Not Found</h2>
          <p className="text-neutral-400 mb-8 leading-relaxed">
            We couldn't load your user profile. This might be a connection issue or your account setup may be incomplete.
          </p>
          <div className="space-y-4">
            <button 
              onClick={() => refreshProfile()}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-red-600/20"
            >
              Retry Loading
            </button>
            <button 
              onClick={() => signOut()}
              className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-3 rounded-xl transition-all"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  const discoveryTabs = [
    { id: 'events', label: 'Home', icon: Calendar },
    { id: 'venues', label: 'Venues', icon: MapPin },
    { id: 'bands', label: 'Bands', icon: Music },
    { id: 'musicians', label: 'Musicians', icon: Users },
  ];

  const managementTabs = [];
  
  if (profile?.roles.includes('admin')) {
    managementTabs.push({ id: 'admin', label: 'Admin Panel', icon: ShieldCheck });
  }

  managementTabs.push({ id: 'my-profile', label: 'My Profile', icon: UserCircle });

  if (profile?.roles.includes('venue_manager') || profile?.roles.includes('band_manager')) {
    managementTabs.push({ id: 'manage-events', label: 'Manage Events', icon: Calendar });
  }
  if (profile?.roles.includes('venue_manager')) {
    managementTabs.push({ id: 'my-venue', label: 'My Venue', icon: MapPin });
  }
  if (profile?.roles.includes('band_manager')) {
    managementTabs.push({ id: 'my-band', label: 'My Band', icon: Music });
  }
  if (profile?.roles.includes('event_attendee')) {
    managementTabs.push({ id: 'favorites', label: 'My Favorites', icon: Heart });
  }
  if (profile?.roles.includes('syndication_manager')) {
    managementTabs.push({ id: 'syndication', label: 'Syndication', icon: Globe });
  }

  const allTabs = [...discoveryTabs, ...managementTabs];

  const handleTabChange = (tabId: string) => {
    if (unsavedChanges) {
      setPendingTab(tabId);
    } else {
      setActiveTab(tabId);
    }
  };

  const handleLogout = () => {
    if (unsavedChanges) {
      setPendingTab('logout');
    } else {
      signOut();
    }
  };

  const confirmNavigation = () => {
    if (pendingTab) {
      const target = pendingTab;
      setUnsavedChanges(false);
      setPendingTab(null);
      if (target === 'logout') {
        signOut();
      } else {
        setActiveTab(target);
      }
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans">
      <Toaster position="top-center" richColors />
      <DisclaimerOverlay />
      {/* Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-neutral-900/90 backdrop-blur-xl border-t border-neutral-800 px-6 py-3 md:top-0 md:bottom-auto md:border-t-0 md:border-b z-[70] flex items-center h-[72px] md:h-[80px]">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-4">
          <div className="hidden md:flex items-center shrink-0">
            <div className="h-12 md:h-14 w-auto flex items-center">
              <img 
                src="/BandVenue_Logo.png" 
                alt="BandVenue Logo" 
                className="h-full w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
          
          <div className="flex flex-1 justify-around md:justify-center gap-2 md:gap-6">
            {discoveryTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`group relative flex flex-col md:flex-row items-center gap-1 md:gap-2 px-3 py-2 rounded-xl transition-all shrink-0 ${
                  activeTab === tab.id 
                    ? 'text-red-600 bg-red-600/5' 
                    : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50'
                }`}
              >
                <tab.icon size={18} className={activeTab === tab.id ? 'animate-pulse' : ''} />
                <span className="text-[9px] md:text-xs font-bold uppercase tracking-wider whitespace-nowrap">{tab.label}</span>
                {activeTab === tab.id && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute -bottom-[13px] md:-bottom-[21px] left-0 right-0 h-0.5 bg-red-600 shadow-[0_0_8px_rgba(249,115,22,0.5)]"
                  />
                )}
              </button>
            ))}
            
            {/* Mobile Dashboard Toggle */}
            {managementTabs.length > 0 && (
              <button
                onClick={() => setIsDashboardOpen(!isDashboardOpen)}
                className={`flex flex-col md:hidden items-center gap-1 px-3 py-2 transition-colors shrink-0 hover:text-red-500 ${
                  managementTabs.some(t => t.id === activeTab) ? 'text-red-600' : 'text-neutral-500'
                }`}
              >
                <LayoutDashboard size={18} />
                <span className="text-[9px] font-bold uppercase tracking-wider whitespace-nowrap">Manage</span>
              </button>
            )}

            {/* Mobile Logout */}
            <button
              onClick={handleLogout}
              className="flex flex-col md:hidden items-center gap-1 px-3 py-2 transition-colors shrink-0 text-neutral-500 hover:text-red-500"
            >
              <LogOut size={18} />
              <span className="text-[9px] font-bold uppercase tracking-wider whitespace-nowrap">Logout</span>
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2 shrink-0">
            {managementTabs.length > 0 && (
              <div className="relative">
                <button 
                  onClick={() => setIsDashboardOpen(!isDashboardOpen)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                    managementTabs.some(t => t.id === activeTab) || isDashboardOpen
                      ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-600/20'
                      : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:border-neutral-600'
                  }`}
                >
                  <LayoutDashboard size={18} />
                  <span className="text-xs font-bold uppercase tracking-widest">Dashboard</span>
                  <ChevronDown size={14} className={`transition-transform duration-300 ${isDashboardOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isDashboardOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsDashboardOpen(false)} />
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-64 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl z-50 overflow-hidden p-2"
                      >
                        <div className="px-3 py-2 mb-2 border-b border-neutral-800">
                          <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Management Tools</p>
                        </div>
                        {managementTabs.map((tab) => (
                          <button
                            key={tab.id}
                            onClick={() => {
                              handleTabChange(tab.id);
                              setIsDashboardOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                              activeTab === tab.id 
                                ? 'bg-red-600/10 text-red-600' 
                                : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                            }`}
                          >
                            <tab.icon size={16} />
                            <span className="text-sm font-medium">{tab.label}</span>
                          </button>
                        ))}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}

            <button 
              onClick={() => setIsAboutOpen(true)}
              className="p-2 text-neutral-500 hover:text-red-600 hover:bg-neutral-800 rounded-lg transition-all"
              title="About BandVenue"
            >
              <Info size={20} />
            </button>
            <button 
              onClick={() => handleTabChange('my-profile')}
              className={`p-2 rounded-lg transition-all flex items-center gap-2 ${activeTab === 'my-profile' ? 'text-red-600 bg-red-600/5' : 'text-neutral-500 hover:text-white hover:bg-neutral-800'}`}
              title="My Profile"
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-6 h-6 rounded-full object-cover border border-neutral-700" referrerPolicy="no-referrer" />
              ) : (
                <UserCircle size={20} />
              )}
            </button>
            <div className="w-px h-6 bg-neutral-800 mx-1" />
            <button 
              onClick={handleLogout}
              className="p-2 text-neutral-500 hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-all"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Management Overlay */}
      <AnimatePresence>
        {isDashboardOpen && (
          <div className="fixed inset-0 z-[60] md:hidden">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsDashboardOpen(false)} />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="absolute bottom-[72px] left-0 right-0 bg-neutral-900 border-t border-neutral-800 rounded-t-[2.5rem] p-8 pb-8 max-h-[70vh] overflow-y-auto no-scrollbar shadow-2xl"
            >
              <div className="w-12 h-1 bg-neutral-800 rounded-full mx-auto mb-8" />
              <h3 className="text-xl font-bold mb-6 text-center">Management Dashboard</h3>
              <div className="grid grid-cols-2 gap-4">
                {managementTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      handleTabChange(tab.id);
                      setIsDashboardOpen(false);
                    }}
                    className={`flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all ${
                      activeTab === tab.id 
                        ? 'bg-red-600/10 border-red-600 text-red-600' 
                        : 'bg-neutral-800 border-neutral-700 text-neutral-400'
                    }`}
                  >
                    <tab.icon size={24} />
                    <span className="text-xs font-bold uppercase tracking-wider text-center">{tab.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="pt-6 pb-24 md:pt-32 md:pb-12 max-w-7xl mx-auto px-4">
        {activeTab === 'events' && <EventsView />}
        {activeTab === 'manage-events' && <EventManager />}
        {activeTab === 'venues' && <VenuesView />}
        {activeTab === 'bands' && <BandsView />}
        {activeTab === 'musicians' && <MusiciansView />}
        {activeTab === 'my-venue' && <VenueProfileEditor onDirtyChange={setUnsavedChanges} onSaveSuccess={() => { setUnsavedChanges(false); setActiveTab('events'); }} />}
        {activeTab === 'my-band' && <BandProfileEditor onDirtyChange={setUnsavedChanges} onSaveSuccess={() => { setUnsavedChanges(false); setActiveTab('events'); }} />}
        {activeTab === 'my-profile' && <ProfileManager onDirtyChange={setUnsavedChanges} onSaveSuccess={() => { setUnsavedChanges(false); setActiveTab('events'); }} />}
        {activeTab === 'admin' && <AdminView />}
        {activeTab === 'syndication' && <SyndicationManagerView />}
        {activeTab === 'favorites' && <FavoritesView />}

        {/* Footer About Us */}
        <div className="mt-20 pt-8 border-t border-neutral-900 flex flex-col items-center gap-4">
          <button 
            onClick={() => setIsAboutOpen(true)}
            className="text-neutral-600 hover:text-red-600 text-[10px] font-bold uppercase tracking-[0.2em] transition-all"
          >
            About BandVenue
          </button>
          <p className="text-[10px] text-neutral-800 font-medium">© 2026 BandVenue. All rights reserved.</p>
        </div>
      </main>

      <AboutModal 
        isOpen={isAboutOpen} 
        onClose={() => setIsAboutOpen(false)} 
      />

      {/* Navigation Confirmation Modal */}
      <AnimatePresence>
        {pendingTab && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setPendingTab(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-[2.5rem] p-8 shadow-2xl"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-red-600/10 p-3 rounded-2xl">
                  <Settings className="text-red-600" size={24} />
                </div>
                <h3 className="text-2xl font-bold">Unsaved Changes</h3>
              </div>
              <p className="text-neutral-400 mb-8 leading-relaxed">
                You have unsaved changes on this page. If you leave now, your progress will be lost. Are you sure you want to continue?
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setPendingTab(null)}
                  className="flex-1 px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-2xl transition-all"
                >
                  Stay Here
                </button>
                <button
                  onClick={confirmNavigation}
                  className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-red-600/20"
                >
                  Leave Page
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SupabaseErrorBoundary>
        <AppContent />
      </SupabaseErrorBoundary>
    </AuthProvider>
  );
}
