export interface StockImage {
  id: string;
  url: string;
  thumbnail: string;
  category: 'venue' | 'band' | 'generic';
  type: 'hero' | 'logo';
  label: string;
}

export const STOCK_IMAGES: StockImage[] = [
  // Venue Heros
  {
    id: 'v-hero-1',
    url: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=1920',
    thumbnail: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=400',
    category: 'venue',
    type: 'hero',
    label: 'Concert Stage'
  },
  {
    id: 'v-hero-2',
    url: 'https://images.unsplash.com/photo-1514525253361-bee8718a340b?auto=format&fit=crop&q=80&w=1920',
    thumbnail: 'https://images.unsplash.com/photo-1514525253361-bee8718a340b?auto=format&fit=crop&q=80&w=400',
    category: 'venue',
    type: 'hero',
    label: 'Jazz Club'
  },
  {
    id: 'v-hero-3',
    url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=1920',
    thumbnail: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=400',
    category: 'venue',
    type: 'hero',
    label: 'Modern Bar'
  },
  {
    id: 'v-hero-4',
    url: 'https://images.unsplash.com/photo-1459749411177-042180ce673c?auto=format&fit=crop&q=80&w=1920',
    thumbnail: 'https://images.unsplash.com/photo-1459749411177-042180ce673c?auto=format&fit=crop&q=80&w=400',
    category: 'venue',
    type: 'hero',
    label: 'Outdoor Stage'
  },
  {
    id: 'v-hero-5',
    url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=1920',
    thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=400',
    category: 'venue',
    type: 'hero',
    label: 'Festival Crowd'
  },
  {
    id: 'v-hero-6',
    url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=1920',
    thumbnail: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=400',
    category: 'venue',
    type: 'hero',
    label: 'Underground Club'
  },
  {
    id: 'v-hero-7',
    url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=1920',
    thumbnail: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=400',
    category: 'venue',
    type: 'hero',
    label: 'Neon Party'
  },
  {
    id: 'v-hero-8',
    url: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&q=80&w=1920',
    thumbnail: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&q=80&w=400',
    category: 'venue',
    type: 'hero',
    label: 'Acoustic Lounge'
  },
  {
    id: 'v-hero-9',
    url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=1920',
    thumbnail: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=400',
    category: 'venue',
    type: 'hero',
    label: 'Neon Nightclub'
  },
  {
    id: 'v-hero-10',
    url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=1920',
    thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=400',
    category: 'venue',
    type: 'hero',
    label: 'Electronic Festival'
  },
  {
    id: 'v-hero-11',
    url: 'https://images.unsplash.com/photo-1514525253361-bee8718a340b?auto=format&fit=crop&q=80&w=1920',
    thumbnail: 'https://images.unsplash.com/photo-1514525253361-bee8718a340b?auto=format&fit=crop&q=80&w=400',
    category: 'venue',
    type: 'hero',
    label: 'Jazz Performance'
  },
  {
    id: 'v-hero-12',
    url: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=1920',
    thumbnail: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=400',
    category: 'venue',
    type: 'hero',
    label: 'Grand Concert Hall'
  },
  // Band Heros
  {
    id: 'b-hero-1',
    url: 'https://images.unsplash.com/photo-1528495612343-9ca9f4a4de28?auto=format&fit=crop&q=80&w=1920',
    thumbnail: 'https://images.unsplash.com/photo-1528495612343-9ca9f4a4de28?auto=format&fit=crop&q=80&w=400',
    category: 'band',
    type: 'hero',
    label: 'Rock Band'
  },
  {
    id: 'b-hero-2',
    url: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&q=80&w=1920',
    thumbnail: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&q=80&w=400',
    category: 'band',
    type: 'hero',
    label: 'Acoustic Guitar'
  },
  {
    id: 'b-hero-3',
    url: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=1920',
    thumbnail: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=400',
    category: 'band',
    type: 'hero',
    label: 'Recording Studio'
  },
  {
    id: 'b-hero-4',
    url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=1920',
    thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=400',
    category: 'band',
    type: 'hero',
    label: 'Crowd View'
  },
  {
    id: 'b-hero-5',
    url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=1920',
    thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400',
    category: 'band',
    type: 'hero',
    label: 'Microphone Close-up'
  },
  {
    id: 'b-hero-6',
    url: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&q=80&w=1920',
    thumbnail: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&q=80&w=400',
    category: 'band',
    type: 'hero',
    label: 'Drum Set'
  },
  {
    id: 'b-hero-7',
    url: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&q=80&w=1920',
    thumbnail: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&q=80&w=400',
    category: 'band',
    type: 'hero',
    label: 'Electric Guitar'
  },
  {
    id: 'b-hero-8',
    url: 'https://images.unsplash.com/photo-1514525253361-bee8718a340b?auto=format&fit=crop&q=80&w=1920',
    thumbnail: 'https://images.unsplash.com/photo-1514525253361-bee8718a340b?auto=format&fit=crop&q=80&w=400',
    category: 'band',
    type: 'hero',
    label: 'Stage Lights'
  },
  {
    id: 'b-hero-9',
    url: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&q=80&w=1920',
    thumbnail: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&q=80&w=400',
    category: 'band',
    type: 'hero',
    label: 'Drummer in Action'
  },
  {
    id: 'b-hero-10',
    url: 'https://images.unsplash.com/photo-1528495612343-9ca9f4a4de28?auto=format&fit=crop&q=80&w=1920',
    thumbnail: 'https://images.unsplash.com/photo-1528495612343-9ca9f4a4de28?auto=format&fit=crop&q=80&w=400',
    category: 'band',
    type: 'hero',
    label: 'Rock Concert'
  },
  {
    id: 'b-hero-11',
    url: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&q=80&w=1920',
    thumbnail: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&q=80&w=400',
    category: 'band',
    type: 'hero',
    label: 'Acoustic Guitarist'
  },
  {
    id: 'b-hero-12',
    url: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=1920',
    thumbnail: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=400',
    category: 'band',
    type: 'hero',
    label: 'Studio Session'
  },
  // Logos
  {
    id: 'l-1',
    url: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&q=80&w=400',
    thumbnail: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&q=80&w=150',
    category: 'generic',
    type: 'logo',
    label: 'Vinyl'
  },
  {
    id: 'l-2',
    url: 'https://images.unsplash.com/photo-1525362081669-2b476bb628c3?auto=format&fit=crop&q=80&w=400',
    thumbnail: 'https://images.unsplash.com/photo-1525362081669-2b476bb628c3?auto=format&fit=crop&q=80&w=150',
    category: 'generic',
    type: 'logo',
    label: 'Microphone'
  },
  {
    id: 'l-3',
    url: 'https://images.unsplash.com/photo-1550985616-10810253b84d?auto=format&fit=crop&q=80&w=400',
    thumbnail: 'https://images.unsplash.com/photo-1550985616-10810253b84d?auto=format&fit=crop&q=80&w=150',
    category: 'generic',
    type: 'logo',
    label: 'Guitar Pick'
  },
  {
    id: 'l-4',
    url: 'https://images.unsplash.com/photo-1507838596373-01c717a7e16c?auto=format&fit=crop&q=80&w=400',
    thumbnail: 'https://images.unsplash.com/photo-1507838596373-01c717a7e16c?auto=format&fit=crop&q=80&w=150',
    category: 'generic',
    type: 'logo',
    label: 'Music Note'
  },
  {
    id: 'l-5',
    url: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&q=80&w=400',
    thumbnail: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&q=80&w=150',
    category: 'generic',
    type: 'logo',
    label: 'Piano Keys'
  },
  {
    id: 'l-6',
    url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=400',
    thumbnail: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=150',
    category: 'generic',
    type: 'logo',
    label: 'Cocktail'
  },
  {
    id: 'l-7',
    url: 'https://images.unsplash.com/photo-1514525253361-bee8718a340b?auto=format&fit=crop&q=80&w=400',
    thumbnail: 'https://images.unsplash.com/photo-1514525253361-bee8718a340b?auto=format&fit=crop&q=80&w=150',
    category: 'generic',
    type: 'logo',
    label: 'Disco Ball'
  },
  {
    id: 'l-8',
    url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=400',
    thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=150',
    category: 'generic',
    type: 'logo',
    label: 'Headphones'
  },
  {
    id: 'l-9',
    url: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&q=80&w=400',
    thumbnail: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&q=80&w=150',
    category: 'generic',
    type: 'logo',
    label: 'Grand Piano'
  },
  {
    id: 'l-10',
    url: 'https://images.unsplash.com/photo-1507838596373-01c717a7e16c?auto=format&fit=crop&q=80&w=400',
    thumbnail: 'https://images.unsplash.com/photo-1507838596373-01c717a7e16c?auto=format&fit=crop&q=80&w=150',
    category: 'generic',
    type: 'logo',
    label: 'Musical Notes'
  },
  {
    id: 'l-11',
    url: 'https://images.unsplash.com/photo-1525362081669-2b476bb628c3?auto=format&fit=crop&q=80&w=400',
    thumbnail: 'https://images.unsplash.com/photo-1525362081669-2b476bb628c3?auto=format&fit=crop&q=80&w=150',
    category: 'generic',
    type: 'logo',
    label: 'Classic Mic'
  },
  {
    id: 'l-12',
    url: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&q=80&w=400',
    thumbnail: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&q=80&w=150',
    category: 'generic',
    type: 'logo',
    label: 'Vinyl Record'
  }
];
