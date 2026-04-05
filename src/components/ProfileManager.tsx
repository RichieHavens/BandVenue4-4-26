import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../AuthContext';
import { UserRole, MusicianProfile } from '../types';
import { Save, Loader2, User, Mail, Shield, Check, Phone, MapPin, Globe, Video, Trash2, Settings, Music, Camera, Eye, Lock, Edit2, X } from 'lucide-react';
import { formatPhoneNumber } from '../lib/phoneFormatter';
import { US_STATES, CA_PROVINCES, AddressParts, formatAddress, parseAddress, validateZipForState } from '../lib/geo';
import { handleSupabaseError, OperationType } from '../lib/error-handler';
import { updateUserEmail } from '../lib/authService';
import ImageUpload from './ImageUpload';
import { UploadedImageSet } from '../lib/imageUtils';
import ProfilePreviewModal from './ProfilePreviewModal';

type Tab = 'account' | 'musician' | 'security';

export default function ProfileManager({ onDirtyChange, onSaveSuccess }: { onDirtyChange?: (dirty: boolean) => void, onSaveSuccess?: () => void }) {
  const { user, profile, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('account');
  
  // Account State
  const [firstName, setFirstName] = useState(profile?.first_name || '');
  const [lastName, setLastName] = useState(profile?.last_name || '');
  const [accountPhone, setAccountPhone] = useState(profile?.phone || '');
  const [addressParts, setAddressParts] = useState<AddressParts>(parseAddress(profile?.address || ''));
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>(profile?.roles || []);
  const [defaultRole, setDefaultRole] = useState<UserRole | undefined>(profile?.default_role);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  
  // Email Update State
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [updatingEmail, setUpdatingEmail] = useState(false);
  
  // Security State
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Musician State
  const [musicianData, setMusicianData] = useState<Partial<MusicianProfile>>({
    phone: '',
    website: '',
    video_links: [],
    description: '',
    looking_for_bands: false,
    instruments: []
  });
  const [initialMusicianData, setInitialMusicianData] = useState<Partial<MusicianProfile> | null>(null);
  const [loadingMusician, setLoadingMusician] = useState(false);

  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  async function logUpdate(changes: any) {
    try {
      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        table_name: 'profiles',
        record_id: user?.id,
        changes: changes
      });
    } catch (error) {
      console.error('Error logging update:', error);
    }
  }

  // Track if form is dirty
  useEffect(() => {
    if (!profile) return;
    
    const isAccountDirty = 
      firstName !== (profile.first_name || '') ||
      lastName !== (profile.last_name || '') ||
      accountPhone !== (profile.phone || '') ||
      avatarUrl !== (profile.avatar_url || '') ||
      formatAddress(addressParts) !== (profile.address || '') ||
      defaultRole !== profile.default_role ||
      JSON.stringify(selectedRoles.sort()) !== JSON.stringify((profile.roles || []).sort());
    
    let isMusicianDirty = false;
    if (initialMusicianData) {
      isMusicianDirty = 
        musicianData.phone !== initialMusicianData.phone ||
        musicianData.website !== initialMusicianData.website ||
        musicianData.description !== initialMusicianData.description ||
        musicianData.looking_for_bands !== initialMusicianData.looking_for_bands ||
        JSON.stringify(musicianData.video_links) !== JSON.stringify(initialMusicianData.video_links) ||
        JSON.stringify(musicianData.instruments?.sort()) !== JSON.stringify((initialMusicianData.instruments || []).sort());
    }
    
    onDirtyChange?.(isAccountDirty || isMusicianDirty);
  }, [firstName, lastName, accountPhone, addressParts, selectedRoles, profile, musicianData, initialMusicianData, onDirtyChange]);

  useEffect(() => {
    console.log('ProfileManager: Profile updated:', profile);
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setAccountPhone(profile.phone || '');
      setAddressParts(parseAddress(profile.address || ''));
      setSelectedRoles(profile.roles || []);
      setDefaultRole(profile.default_role);
      setAvatarUrl(profile.avatar_url || '');
      
      // If profile is missing basic info, try to fetch from people table as fallback
      if (!profile.first_name || !profile.last_name || !profile.phone) {
        console.log('ProfileManager: Missing info, fetching fallback from people table...');
        const fetchPeopleFallback = async () => {
          try {
            const { data: personData } = await supabase
              .from('people')
              .select('*')
              .eq('user_id', user?.id)
              .maybeSingle();
            
            console.log('ProfileManager: Fallback result:', personData);
            if (personData) {
              if (!profile.first_name && personData.first_name) setFirstName(personData.first_name);
              if (!profile.last_name && personData.last_name) setLastName(personData.last_name);
              if (!profile.phone && personData.phone) setAccountPhone(personData.phone);
            }
          } catch (error) {
            console.error('Error fetching people fallback:', error);
          }
        };
        fetchPeopleFallback();
      }

      if (profile.roles.includes('musician')) {
        fetchMusicianProfile();
      }
    }
  }, [profile, user?.id]);

  async function fetchMusicianProfile() {
    setLoadingMusician(true);
    try {
      const { data, error } = await supabase
        .from('musicians')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      const defaultMusician = {
        phone: '',
        website: '',
        video_links: [],
        description: '',
        looking_for_bands: false,
        instruments: []
      };

      if (data) {
        const cleanedData = {
          ...defaultMusician,
          ...data,
          website: data.website?.replace(/^https?:\/\//, '').replace(/^www\./, '') || ''
        };
        setMusicianData(cleanedData);
        setInitialMusicianData(cleanedData);
      } else {
        setMusicianData(defaultMusician);
        setInitialMusicianData(defaultMusician);
      }
    } catch (error) {
      console.error('Error fetching musician profile:', error);
    } finally {
      setLoadingMusician(false);
    }
  }

  const validatePhone = (phoneStr: string) => {
    if (!phoneStr) return true;
    const digits = phoneStr.replace(/\D/g, '');
    return digits.length >= 10;
  };

  const handleCreateSoloAct = async () => {
    if (!user?.id) return;
    setSaving(true);
    setMessage(null);

    try {
      // 1. Ensure we have a person record
      let personId = null;
      const { data: existingPerson } = await supabase
        .from('people')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (existingPerson) {
        personId = existingPerson.id;
      }

      // 2. Create the band profile
      const bandName = `${firstName} ${lastName}`.trim() || 'Solo Act';
      
      const { data: newBand, error: bandError } = await supabase
        .from('bands')
        .insert({
          name: bandName,
          manager_id: user.id,
          person_id: personId,
          description: musicianData.description || '',
          phone: musicianData.phone || accountPhone || '',
          website: musicianData.website || '',
          video_links: musicianData.video_links || [],
          logo_url: avatarUrl || '',
          city: addressParts.city || '',
          state: addressParts.state || '',
          country: addressParts.country || 'US',
          is_published: false
        })
        .select()
        .single();

      if (bandError) throw bandError;

      setMessage({ type: 'success', text: 'Solo Act created successfully! You can now manage it from the Admin Dashboard or My Band tab.' });
    } catch (error: any) {
      console.error('Error creating solo act:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to create solo act.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    // Validate Account Phone
    if (!validatePhone(accountPhone)) {
      setMessage({ type: 'error', text: 'Please enter a valid account phone number (10 digits).' });
      setSaving(false);
      return;
    }

    // Validate Musician Phone if active
    if (selectedRoles.includes('musician') && !validatePhone(musicianData.phone || '')) {
      setMessage({ type: 'error', text: 'Please enter a valid musician phone number (10 digits).' });
      setSaving(false);
      return;
    }

    const zipValidation = validateZipForState(addressParts.zip, addressParts.state, addressParts.country);
    if (!zipValidation.isValid) {
      setMessage({ type: 'error', text: zipValidation.message || 'Invalid Zip/Postal Code for the selected state/province.' });
      setSaving(false);
      return;
    }

    try {
      if (!user?.id) {
        throw new Error('User not authenticated. Please log in again.');
      }

      const changes: any = {};
      if (firstName !== (profile?.first_name || '')) changes.first_name = firstName;
      if (lastName !== (profile?.last_name || '')) changes.last_name = lastName;
      if (accountPhone !== (profile?.phone || '')) changes.phone = accountPhone;
      if (avatarUrl !== (profile?.avatar_url || '')) changes.avatar_url = avatarUrl;
      if (defaultRole !== profile?.default_role) changes.default_role = defaultRole;
      const newAddress = formatAddress(addressParts);
      if (newAddress !== (profile?.address || '')) changes.address = newAddress;
      if (JSON.stringify(selectedRoles.sort()) !== JSON.stringify((profile?.roles || []).sort())) changes.roles = selectedRoles;

      // 1. Save Profile
      const rolesToSave = [...selectedRoles];
      if (profile?.roles.includes('admin') && !rolesToSave.includes('admin')) rolesToSave.push('admin');
      if (profile?.roles.includes('syndication_manager') && !rolesToSave.includes('syndication_manager')) rolesToSave.push('syndication_manager');

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          first_name: firstName,
          last_name: lastName,
          phone: accountPhone,
          address: newAddress,
          roles: rolesToSave,
          default_role: defaultRole,
          avatar_url: avatarUrl
        });

      if (profileError) {
        await handleSupabaseError(profileError, OperationType.UPDATE, 'profiles');
      }

      // 2. Sync with People table
      const { error: peopleError } = await supabase
        .from('people')
        .upsert({
          user_id: user.id,
          email: user.email,
          first_name: firstName,
          last_name: lastName,
          phone: accountPhone,
          roles: rolesToSave,
          updated_at: new Date().toISOString(),
          updated_by: user.id
        }, { onConflict: 'email' });

      if (peopleError) {
        console.warn('Failed to sync with people table:', peopleError);
      }

      // 3. Save Musician Profile if role is selected
      if (selectedRoles.includes('musician')) {
        let finalWebsite = musicianData.website || '';
        if (finalWebsite && !finalWebsite.startsWith('http')) {
          finalWebsite = `https://${finalWebsite}`;
        }

        const { error: musicianError } = await supabase
          .from('musicians')
          .upsert({
            id: user.id,
            phone: musicianData.phone || '',
            website: finalWebsite,
            video_links: musicianData.video_links || [],
            description: musicianData.description || '',
            looking_for_bands: musicianData.looking_for_bands || false,
            instruments: musicianData.instruments || []
          }, { 
            onConflict: 'id' 
          });

        if (musicianError) {
          await handleSupabaseError(musicianError, OperationType.UPDATE, 'musicians');
        }
        
        // Update local musician state
        const updatedMusician = { ...musicianData, website: finalWebsite.replace(/^https?:\/\//, '').replace(/^www\./, '') };
        setMusicianData(updatedMusician);
        setInitialMusicianData(updatedMusician);
      }

      if (Object.keys(changes).length > 0) {
        await logUpdate(changes);
      }

      await refreshProfile();
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      
      setTimeout(() => {
        onSaveSuccess?.();
      }, 1500);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }

    setChangingPassword(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      
      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || newEmail === user?.email) {
      setMessage({ type: 'error', text: 'Please enter a new email address.' });
      return;
    }

    setUpdatingEmail(true);
    setMessage(null);

    try {
      await updateUserEmail(newEmail, user?.email || '', user?.id || '');
      setMessage({ type: 'success', text: 'Email update initiated! Please check your new email for a confirmation link.' });
      setIsEditingEmail(false);
      setNewEmail('');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setUpdatingEmail(false);
    }
  };

  const publicRoles: { id: UserRole, label: string, description: string }[] = [
    { id: 'venue_manager', label: 'Venue Manager', description: 'Manage your music venue and events.' },
    { id: 'band_manager', label: 'Band Manager', description: 'Manage your band, musicians, and bookings.' },
    { id: 'musician', label: 'Musician', description: 'Showcase your talent and find bands.' },
    { id: 'event_attendee', label: 'Event Attendee', description: 'Find and follow your favorite music.' },
  ];

  const toggleRole = (roleId: UserRole) => {
    if (selectedRoles.includes(roleId)) {
      if (selectedRoles.filter(r => publicRoles.some(pr => pr.id === r)).length <= 1 && !profile?.roles.includes('admin')) {
        return;
      }
      setSelectedRoles(selectedRoles.filter(r => r !== roleId));
    } else {
      setSelectedRoles([...selectedRoles, roleId]);
      // If re-selecting musician, try to fetch existing data if we don't have it
      if (roleId === 'musician' && !musicianData.id) {
        fetchMusicianProfile();
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold text-white">My Profile</h2>
        <p className="text-neutral-400">Manage your personal information and musician details in one place.</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-neutral-900 p-1 rounded-2xl border border-neutral-800 w-fit">
        <button
          onClick={() => setActiveTab('account')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'account' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          <Settings size={18} />
          Account Settings
        </button>
        {selectedRoles.includes('musician') && (
          <button
            onClick={() => setActiveTab('musician')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'musician' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Music size={18} />
            Musician Details
          </button>
        )}
        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'security' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          <Shield size={18} />
          Security
        </button>
      </div>

      {activeTab === 'security' ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-[2.5rem] p-8 md:p-10 space-y-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="text-red-600" size={24} />
            <h3 className="text-xl font-bold text-white">Change Password</h3>
          </div>
          <p className="text-neutral-400 text-sm">Update your account password. We recommend using a strong, unique password.</p>
          
          <form onSubmit={handlePasswordChange} className="space-y-6 max-w-md">
            <div className="space-y-2">
              <label className="text-sm font-bold text-neutral-500 uppercase tracking-widest">New Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-2xl py-3 pl-12 pr-4 text-white focus:ring-2 focus:ring-red-600 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-neutral-500 uppercase tracking-widest">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
                <input
                  type="password"
                  required
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-2xl py-3 pl-12 pr-4 text-white focus:ring-2 focus:ring-red-600 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {message && (
              <div className={`p-4 rounded-2xl text-sm font-medium ${
                message.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
              }`}>
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={changingPassword}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-3 transition-all shadow-lg shadow-red-600/20 disabled:opacity-50"
            >
              {changingPassword ? <Loader2 className="animate-spin" size={20} /> : <Shield size={20} />}
              Update Password
            </button>
          </form>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-8">
          {activeTab === 'account' ? (
          <div className="space-y-8">
            {/* Basic Info */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-[2.5rem] p-8 md:p-10 space-y-8">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Avatar Upload */}
                <div className="flex flex-col items-center gap-4">
                  <div className="w-32 h-32 rounded-full bg-neutral-800 border-2 border-neutral-700 overflow-hidden relative group">
                    {avatarUrl ? (
                      <>
                        <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <button
                          type="button"
                          onClick={() => setAvatarUrl('')}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all z-10 opacity-0 group-hover:opacity-100"
                          title="Delete Profile Photo"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-600">
                        <User size={48} />
                      </div>
                    )}
                    <ImageUpload 
                      type="logo"
                      onUploadComplete={(urlSet) => {
                        if (typeof urlSet !== 'string') {
                          // Use the logo (400x400) image for the avatar
                          setAvatarUrl(urlSet.logo || urlSet.original);
                        }
                      }}
                      className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <Camera size={24} className="text-white" />
                    </ImageUpload>
                  </div>
                  <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Profile Photo</span>
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-neutral-500 uppercase tracking-widest">First Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
                      <input
                        type="text"
                        value={firstName || ''}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-2xl py-3 pl-12 pr-4 text-white focus:ring-2 focus:ring-red-600 outline-none transition-all"
                        placeholder="John"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-neutral-500 uppercase tracking-widest">Last Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
                      <input
                        type="text"
                        value={lastName || ''}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-2xl py-3 pl-12 pr-4 text-white focus:ring-2 focus:ring-red-600 outline-none transition-all"
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-neutral-500 uppercase tracking-widest">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
                      <input
                        type="email"
                        value={isEditingEmail ? newEmail : (user?.email || '')}
                        onChange={(e) => setNewEmail(e.target.value)}
                        disabled={!isEditingEmail || updatingEmail}
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-2xl py-3 pl-12 pr-24 text-white focus:ring-2 focus:ring-red-600 outline-none transition-all disabled:bg-neutral-800/50 disabled:text-neutral-500 disabled:cursor-not-allowed"
                        placeholder="new-email@example.com"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        {isEditingEmail ? (
                          <>
                            <button
                              type="button"
                              onClick={handleEmailChange}
                              disabled={updatingEmail || !newEmail || newEmail === user?.email}
                              className="p-2 text-green-500 hover:bg-green-500/10 rounded-lg transition-all disabled:opacity-50"
                            >
                              {updatingEmail ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                            </button>
                            <button
                              type="button"
                              onClick={() => { setIsEditingEmail(false); setNewEmail(''); }}
                              className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                            >
                              <X size={18} />
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => { setIsEditingEmail(true); setNewEmail(user?.email || ''); }}
                            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-700 rounded-lg transition-all"
                          >
                            <Edit2 size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-neutral-500 uppercase tracking-widest">Phone Number</label>
                    <div className="relative">
                      <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${accountPhone && !validatePhone(accountPhone) ? 'text-red-500' : 'text-neutral-500'}`} size={18} />
                      <input
                        type="tel"
                        value={accountPhone || ''}
                        onChange={(e) => setAccountPhone(formatPhoneNumber(e.target.value))}
                        className={`w-full bg-neutral-800 border rounded-2xl py-3 pl-12 pr-4 text-white focus:ring-2 focus:ring-red-600 outline-none transition-all ${
                          accountPhone && !validatePhone(accountPhone) ? 'border-red-500/50' : 'border-neutral-700'
                        }`}
                        placeholder="(555) 000-0000"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Address Section */}
              <div className="space-y-4 md:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-neutral-500 uppercase tracking-widest">Address Information</label>
                  <div className="flex bg-neutral-800 p-1 rounded-xl border border-neutral-700">
                    <button
                      type="button"
                      onClick={() => setAddressParts({ ...addressParts, country: 'US', state: '' })}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        addressParts.country === 'US' ? 'bg-red-600 text-white' : 'text-neutral-500 hover:text-neutral-300'
                      }`}
                    >
                      USA
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddressParts({ ...addressParts, country: 'CA', state: '' })}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        addressParts.country === 'CA' ? 'bg-red-600 text-white' : 'text-neutral-500 hover:text-neutral-300'
                      }`}
                    >
                      CANADA
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider">Street Address</label>
                    <input
                      type="text"
                      value={addressParts.street || ''}
                      onChange={(e) => setAddressParts({ ...addressParts, street: e.target.value })}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-2xl py-3 px-4 text-white focus:ring-2 focus:ring-red-600 outline-none transition-all"
                      placeholder="123 Music Ave"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider">City</label>
                    <input
                      type="text"
                      value={addressParts.city || ''}
                      onChange={(e) => setAddressParts({ ...addressParts, city: e.target.value })}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-2xl py-3 px-4 text-white focus:ring-2 focus:ring-red-600 outline-none transition-all"
                      placeholder="Nashville"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider">{addressParts.country === 'US' ? 'State' : 'Province'}</label>
                      <select
                        value={addressParts.state || ''}
                        onChange={(e) => setAddressParts({ ...addressParts, state: e.target.value })}
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-2xl py-3 px-4 text-white focus:ring-2 focus:ring-red-600 outline-none transition-all appearance-none"
                      >
                        <option value="">Select...</option>
                        {(addressParts.country === 'US' ? US_STATES : CA_PROVINCES).map((item) => (
                          <option key={item.code} value={item.code}>{item.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider">Zip/Postal</label>
                      <input
                        type="text"
                        value={addressParts.zip || ''}
                        onChange={(e) => setAddressParts({ ...addressParts, zip: e.target.value })}
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-2xl py-3 px-4 text-white focus:ring-2 focus:ring-red-600 outline-none transition-all"
                        placeholder={addressParts.country === 'US' ? '37201' : 'M5V 2T6'}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Roles */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-[2.5rem] p-8 md:p-10 space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="text-red-600" size={24} />
                <h3 className="text-xl font-bold text-white">Account Roles</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {publicRoles.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => toggleRole(role.id)}
                    className={`flex flex-col p-6 rounded-3xl border text-left transition-all relative group ${
                      selectedRoles.includes(role.id)
                        ? 'bg-red-600/10 border-red-600'
                        : 'bg-neutral-800 border-neutral-700 hover:border-neutral-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-bold ${selectedRoles.includes(role.id) ? 'text-white' : 'text-neutral-400'}`}>{role.label}</span>
                      {selectedRoles.includes(role.id) && <div className="bg-red-600 rounded-full p-1"><Check size={12} className="text-white" /></div>}
                    </div>
                    <p className="text-xs text-neutral-500 leading-relaxed">{role.description}</p>
                  </button>
                ))}
              </div>

              {selectedRoles.length > 1 && (
                <div className="mt-8 p-6 bg-neutral-800/50 border border-neutral-700 rounded-3xl space-y-4">
                  <div className="flex items-center gap-3">
                    <Settings className="text-red-600" size={20} />
                    <h4 className="font-bold text-white">Default Session Role</h4>
                  </div>
                  <p className="text-xs text-neutral-400">Choose which role should be active by default when you log in. You can always switch roles using the switcher in the navigation bar.</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedRoles.map((roleId) => {
                      const roleInfo = publicRoles.find(pr => pr.id === roleId) || (roleId === 'admin' ? { label: 'Super Admin' } : { label: roleId });
                      return (
                        <button
                          key={roleId}
                          type="button"
                          onClick={() => setDefaultRole(roleId)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                            defaultRole === roleId
                              ? 'bg-red-600 border-red-600 text-white'
                              : 'bg-neutral-900 border-neutral-700 text-neutral-500 hover:border-neutral-600'
                          }`}
                        >
                          {roleInfo.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-neutral-900 border border-neutral-800 rounded-[2.5rem] p-8 md:p-10 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-red-600/10 border border-red-600/20 p-6 rounded-2xl">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Book Gigs as a Solo Act?</h3>
                <p className="text-sm text-neutral-400">Generate a Band profile from your musician details so venues can book you.</p>
              </div>
              <button
                type="button"
                onClick={handleCreateSoloAct}
                disabled={saving}
                className="shrink-0 bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="animate-spin" size={18} /> : <Music size={18} />}
                Create Solo Act
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-neutral-500 uppercase tracking-widest">Musician Phone</label>
                <div className="relative">
                  <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${musicianData.phone && !validatePhone(musicianData.phone) ? 'text-red-500' : 'text-neutral-500'}`} size={18} />
                  <input
                    type="tel"
                    value={musicianData.phone || ''}
                    onChange={(e) => setMusicianData({ ...musicianData, phone: formatPhoneNumber(e.target.value) })}
                    className={`w-full bg-neutral-800 border rounded-2xl py-3 pl-12 pr-4 text-white focus:ring-2 focus:ring-red-600 outline-none transition-all ${
                      musicianData.phone && !validatePhone(musicianData.phone) ? 'border-red-500/50' : 'border-neutral-700'
                    }`}
                    placeholder="(555) 000-0000"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-neutral-500 uppercase tracking-widest">Personal Website</label>
                <div className="relative flex items-center">
                  <Globe className="absolute left-4 text-neutral-500" size={18} />
                  <input
                    type="text"
                    value={musicianData.website || ''}
                    onChange={(e) => setMusicianData({ ...musicianData, website: e.target.value })}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-2xl py-3 pl-12 pr-4 text-white focus:ring-2 focus:ring-red-600 outline-none transition-all"
                    placeholder="www.yourname.com"
                  />
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-neutral-500 uppercase tracking-widest">Bio / Description</label>
                <textarea
                  rows={4}
                  value={musicianData.description || ''}
                  onChange={(e) => setMusicianData({ ...musicianData, description: e.target.value })}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-2xl px-4 py-3 text-white focus:ring-2 focus:ring-red-600 outline-none transition-all resize-none"
                />
              </div>
              
              <div className="md:col-span-2 p-4 bg-neutral-800/50 rounded-2xl border border-neutral-700 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="looking_for_bands"
                  checked={musicianData.looking_for_bands}
                  onChange={(e) => setMusicianData({ ...musicianData, looking_for_bands: e.target.checked })}
                  className="w-5 h-5 rounded border-neutral-700 bg-neutral-800 text-red-600 focus:ring-red-600"
                />
                <label htmlFor="looking_for_bands" className="text-sm font-medium text-neutral-200 cursor-pointer">
                  I am currently looking for bands or events to join
                </label>
              </div>

              <div className="md:col-span-2 space-y-4">
                <label className="text-sm font-bold text-neutral-500 uppercase tracking-widest">Instruments</label>
                <div className="flex flex-wrap gap-2">
                  {['Guitar', 'Bass', 'Drums', 'Vocals', 'Keyboard', 'Saxophone', 'Trumpet', 'Violin'].map((inst) => (
                    <button
                      key={inst}
                      type="button"
                      onClick={() => {
                        const current = musicianData.instruments || [];
                        if (current.includes(inst)) {
                          setMusicianData({ ...musicianData, instruments: current.filter(i => i !== inst) });
                        } else {
                          setMusicianData({ ...musicianData, instruments: [...current, inst] });
                        }
                      }}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                        (musicianData.instruments || []).includes(inst)
                          ? 'bg-red-600 text-white'
                          : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                      }`}
                    >
                      {inst}
                    </button>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-neutral-500 uppercase tracking-widest">Video Links (Up to 5)</label>
                  <span className="text-xs text-neutral-500">{musicianData.video_links?.length || 0} / 5</span>
                </div>
                <div className="space-y-2">
                  {musicianData.video_links?.map((link, idx) => (
                    <div key={idx} className="flex gap-2">
                      <div className="flex-1 bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2 text-sm text-neutral-300 truncate">{link}</div>
                      <button
                        type="button"
                        onClick={() => setMusicianData({ ...musicianData, video_links: musicianData.video_links?.filter((_, i) => i !== idx) })}
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  {(musicianData.video_links?.length || 0) < 5 && (
                    <button
                      type="button"
                      onClick={() => {
                        const url = prompt('Enter video URL:');
                        if (url) setMusicianData({ ...musicianData, video_links: [...(musicianData.video_links || []), url] });
                      }}
                      className="w-full border border-dashed border-neutral-700 rounded-xl py-3 text-neutral-500 hover:border-red-600 hover:text-red-600 transition-all flex items-center justify-center gap-2"
                    >
                      <Video size={18} />
                      <span className="text-sm font-bold uppercase tracking-widest">Add Video Link</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {message && (
          <div className={`p-4 rounded-2xl text-sm font-medium ${
            message.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
          }`}>
            {message.text}
          </div>
        )}

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="bg-neutral-800 hover:bg-neutral-700 text-white px-6 py-4 rounded-2xl font-bold flex items-center gap-3 transition-all"
          >
            <Eye size={20} />
            Preview Profile
          </button>
          <button
            type="submit"
            disabled={saving}
            className="bg-red-600 hover:bg-red-700 text-white px-10 py-4 rounded-2xl font-bold flex items-center gap-3 transition-all shadow-lg shadow-red-600/20 disabled:opacity-50"
          >
            {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            Save All Changes
          </button>
        </div>
      </form>
    )}

    <ProfilePreviewModal 
        isOpen={showPreview} 
        onClose={() => setShowPreview(false)} 
        type="profile" 
        data={{ 
          first_name: firstName, 
          last_name: lastName, 
          email: user?.email, 
          phone: accountPhone,
          avatar_url: avatarUrl,
          roles: selectedRoles,
          musicianData: musicianData
        }} 
      />
    </div>
  );
}
