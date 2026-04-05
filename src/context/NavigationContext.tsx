import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from '../AuthContext';
import { 
  ShieldCheck, UserCircle, Calendar, LayoutDashboard, MapPin, Music, Heart, Globe, Users
} from 'lucide-react';

interface NavigationContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  managementTabs: { id: string; label: string; icon: React.ElementType }[];
  discoveryTabs: { id: string; label: string; icon: React.ElementType }[];
  handleTabChange: (tabId: string) => void;
  unsavedChanges: boolean;
  setUnsavedChanges: (dirty: boolean) => void;
  pendingTab: string | null;
  setPendingTab: (tab: string | null) => void;
  confirmNavigation: () => Promise<void>;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, signOut, activeRole } = useAuth();
  const [activeTab, setActiveTab] = React.useState('events');
  const [unsavedChanges, setUnsavedChanges] = React.useState(false);
  const [pendingTab, setPendingTab] = React.useState<string | null>(null);
  
  console.log('NavigationProvider initialized', { user: !!user, profile: !!profile, loading });

  const discoveryTabs = [
    { id: 'venues', label: 'Venues', icon: MapPin },
    { id: 'bands', label: 'Bands', icon: Music },
    { id: 'musicians', label: 'Musicians', icon: Users },
  ];

  const managementTabs = useMemo(() => {
    const tabs: { id: string; label: string; icon: React.ElementType }[] = [];
    
    if (loading || !user || !profile || !activeRole) {
      return tabs;
    }

    // Always show these for any authenticated user
    tabs.push({ id: 'my-profile', label: 'My Profile', icon: UserCircle });
    tabs.push({ id: 'my-reports', label: 'My Reports', icon: Calendar });

    // Role-specific tabs
    if (activeRole === 'admin') {
      tabs.push({ id: 'admin', label: 'Data Admin', icon: ShieldCheck });
      tabs.push({ id: 'manage-events', label: 'Manage Events', icon: Calendar });
      tabs.push({ id: 'syndication', label: 'Syndication', icon: Globe });
      tabs.push({ id: 'venue-manager', label: 'Venue Manager', icon: LayoutDashboard });
    }

    if (activeRole === 'venue_manager') {
      tabs.push({ id: 'manage-events', label: 'Manage Events', icon: Calendar });
      tabs.push({ id: 'venue-manager', label: 'Venue Manager', icon: LayoutDashboard });
      tabs.push({ id: 'my-venue', label: 'My Venue', icon: MapPin });
    }

    if (activeRole === 'band_manager') {
      tabs.push({ id: 'manage-events', label: 'Manage Events', icon: Calendar });
      tabs.push({ id: 'my-band', label: 'My Band', icon: Music });
    }

    if (activeRole === 'event_attendee') {
      tabs.push({ id: 'favorites', label: 'My Favorites', icon: Heart });
    }

    if (activeRole === 'syndication_manager') {
      tabs.push({ id: 'syndication', label: 'Syndication', icon: Globe });
    }

    return tabs;
  }, [user, profile, loading, activeRole]);

  const handleTabChange = (tabId: string) => {
    if (unsavedChanges) {
      setPendingTab(tabId);
    } else {
      setActiveTab(tabId);
    }
  };

  const confirmNavigation = async () => {
    if (pendingTab) {
      const target = pendingTab;
      setUnsavedChanges(false);
      setPendingTab(null);
      if (target === 'logout') {
        await signOut();
        setActiveTab('events');
      } else {
        setActiveTab(target);
      }
    }
  };

  return (
    <NavigationContext.Provider value={{ 
      activeTab, 
      setActiveTab, 
      managementTabs, 
      discoveryTabs, 
      handleTabChange,
      unsavedChanges,
      setUnsavedChanges,
      pendingTab,
      setPendingTab,
      confirmNavigation
    }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigationContext() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigationContext must be used within a NavigationProvider');
  }
  return context;
}
