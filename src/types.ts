export type UserRole = 'venue_manager' | 'band_manager' | 'musician' | 'event_attendee' | 'syndication_manager' | 'admin';

export interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  address?: string;
  roles: UserRole[];
  default_role?: UserRole;
  avatar_url?: string;
  created_at: string;
}

export interface Genre {
  id: string;
  name: string;
}

export interface Person {
  id: string;
  user_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  roles: UserRole[];
  venue_ids: string[];
  band_ids: string[];
  last_login_at?: string;
  created_at: string;
  updated_at?: string;
  updated_by?: string;
  profiles?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface Venue {
  id: string;
  manager_id?: string;
  person_id?: string;
  name: string;
  description: string;
  address?: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  phone: string;
  email: string;
  website: string;
  food_description: string;
  tech_specs?: string;
  logo_url?: string;
  hero_url?: string;
  linkedin_url?: string;
  pinterest_url?: string;
  youtube_url?: string;
  instagram_url?: string;
  apple_music_url?: string;
  spotify_url?: string;
  facebook_url?: string;
  twitter_url?: string;
  images: string[];
  bag_policy?: string;
  is_archived?: boolean;
  created_at: string;
  updated_at?: string;
  updated_by?: string;
}

export interface VenueEventProfile {
  id: string;
  venue_id: string;
  title: string;
  description: string;
  start_time: string;
  end_time?: string;
  doors_open_time: string;
  cover_charge: number;
  recap?: string;
  internal_notes?: string;
  bag_policy?: string;
  overall_status: 'draft' | 'pending' | 'confirmed' | 'canceled' | 'past';
  has_multiple_acts: boolean;
  created_by: string;
  created_at: string;
  updated_at?: string;
}

export interface VenueEventAct {
  id: string;
  event_id: string;
  band_id?: string;
  start_time?: string;
  end_time?: string;
  act_status: 'empty' | 'pending' | 'confirmed' | 'canceled';
  sort_order: number;
}

export interface VenueEventDocument {
  id: string;
  event_id: string;
  file_name: string;
  file_url: string;
  document_type: 'contract' | 'tech_spec' | 'other';
  created_at: string;
}

export interface Band {
  id: string;
  manager_id?: string;
  person_id?: string;
  name: string;
  manager_first_name?: string;
  manager_last_name?: string;
  description: string;
  address?: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  phone: string;
  email: string;
  website: string;
  logo_url?: string;
  hero_url?: string;
  linkedin_url?: string;
  pinterest_url?: string;
  youtube_url?: string;
  instagram_url?: string;
  apple_music_url?: string;
  spotify_url?: string;
  facebook_url?: string;
  twitter_url?: string;
  images: string[];
  video_links: string[];
  is_published?: boolean;
  is_archived?: boolean;
  is_confirmed: boolean;
  created_by_venue_id?: string;
  created_at: string;
  updated_at?: string;
  updated_by?: string;
}

export interface MusicianProfile {
  id: string;
  phone: string;
  website: string;
  video_links: string[];
  description: string;
  looking_for_bands: boolean;
  instruments: string[];
  created_at: string;
}

export interface Event {
  id: string;
  venue_id: string;
  title: string;
  band_event_name?: string;
  venue_event_name?: string;
  description: string;
  start_time: string;
  end_time?: string;
  doors_open_time: string;
  ticket_price_low: number;
  ticket_price_high: number;
  ticket_disclaimer: string;
  venue_confirmed: boolean;
  band_confirmed: boolean;
  is_public: boolean;
  is_published: boolean;
  bag_policy?: string;
  hero_url?: string;
  venue_hero_url?: string;
  created_at: string;
  updated_at?: string;
  updated_by?: string;
  created_by?: string;
  status?: 'pending' | 'confirmed' | 'rejected';
  venues?: Venue;
  acts?: Act[];
}

export interface Act {
  id: string;
  event_id: string;
  band_id: string;
  start_time: string;
  created_at: string;
}

export interface VenueSponsor {
  id: string;
  venue_id: string;
  name: string;
  description: string;
  logo_url: string;
  created_at: string;
}

export interface BandMember {
  id: string;
  band_id: string;
  person_id: string;
  first_name: string;
  last_name: string;
  email: string;
  instrument_description: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface BookingInquiry {
  id: string;
  venue_id: string;
  band_id: string;
  event_id?: string;
  sender_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  message: string;
  proposed_date: string;
  created_at: string;
  updated_at: string;
}
