export const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
];

export const CA_PROVINCES = [
  { code: 'AB', name: 'Alberta' },
  { code: 'BC', name: 'British Columbia' },
  { code: 'MB', name: 'Manitoba' },
  { code: 'NB', name: 'New Brunswick' },
  { code: 'NL', name: 'Newfoundland and Labrador' },
  { code: 'NS', name: 'Nova Scotia' },
  { code: 'ON', name: 'Ontario' },
  { code: 'PE', name: 'Prince Edward Island' },
  { code: 'QC', name: 'Quebec' },
  { code: 'SK', name: 'Saskatchewan' },
  { code: 'NT', name: 'Northwest Territories' },
  { code: 'NU', name: 'Nunavut' },
  { code: 'YT', name: 'Yukon' },
];

export interface AddressParts {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: 'US' | 'CA';
}

export const formatAddress = (parts: AddressParts) => {
  if (!parts.street && !parts.city && !parts.state && !parts.zip) return '';
  return `${parts.street}|${parts.city}|${parts.state}|${parts.zip}|${parts.country}`;
};

export const parseAddress = (address: string): AddressParts => {
  if (!address || !address.includes('|')) {
    return { street: address || '', city: '', state: '', zip: '', country: 'US' };
  }
  const [street, city, state, zip, country] = address.split('|');
  return { 
    street: street || '', 
    city: city || '', 
    state: state || '', 
    zip: zip || '', 
    country: (country as 'US' | 'CA') || 'US' 
  };
};

export const displayAddress = (address: string | undefined | null): string => {
  if (!address) return '';
  if (!address.includes('|')) return address;
  
  const [street, city, state, zip, country] = address.split('|');
  const cityStateZip = [
    city,
    [state, zip].filter(Boolean).join(' ')
  ].filter(Boolean).join(', ');

  return [street, cityStateZip, country !== 'US' ? country : null].filter(Boolean).join(', ');
};

export const US_ZIP_MAP: Record<string, string[]> = {
  'AL': ['35', '36'], 'AK': ['99'], 'AZ': ['85', '86'], 'AR': ['72'],
  'CA': ['90', '91', '92', '93', '94', '95', '96'], 'CO': ['80', '81'],
  'CT': ['06'], 'DE': ['19'], 'FL': ['32', '33', '34'], 'GA': ['30', '31'],
  'HI': ['96'], 'ID': ['83'], 'IL': ['60', '61', '62'], 'IN': ['46', '47'],
  'IA': ['50', '51', '52'], 'KS': ['66', '67'], 'KY': ['40', '41', '42'],
  'LA': ['70', '71'], 'ME': ['03', '04'], 'MD': ['20', '21'], 'MA': ['01', '02'],
  'MI': ['48', '49'], 'MN': ['55', '56'], 'MS': ['38', '39'], 'MO': ['63', '64', '65'],
  'MT': ['59'], 'NE': ['68', '69'], 'NV': ['88', '89'], 'NH': ['03'],
  'NJ': ['07', '08'], 'NM': ['87', '88'], 'NY': ['10', '11', '12', '13', '14'],
  'NC': ['27', '28'], 'ND': ['58'], 'OH': ['43', '44', '45'], 'OK': ['73', '74'],
  'OR': ['97'], 'PA': ['15', '16', '17', '18', '19'], 'RI': ['02'], 'SC': ['29'],
  'SD': ['57'], 'TN': ['37', '38'], 'TX': ['75', '76', '77', '78', '79'],
  'UT': ['84'], 'VT': ['05'], 'VA': ['22', '23', '24'], 'WA': ['98', '99'],
  'WV': ['24', '25', '26'], 'WI': ['53', '54'], 'WY': ['82'],
};

export const CA_POSTAL_MAP: Record<string, string[]> = {
  'AB': ['T'], 'BC': ['V'], 'MB': ['R'], 'NB': ['E'], 'NL': ['A'], 'NS': ['B'],
  'ON': ['K', 'L', 'M', 'N', 'P'], 'PE': ['C'], 'QC': ['G', 'H', 'J'], 'SK': ['S'],
  'NT': ['X'], 'NU': ['X'], 'YT': ['Y'],
};

export const validateZipForState = (zip: string, state: string, country: 'US' | 'CA'): { isValid: boolean, message?: string } => {
  if (!zip || !state) return { isValid: true };
  
  const cleanZip = zip.trim().toUpperCase().replace(/\s/g, '');
  
  if (country === 'US') {
    if (!/^\d{5}(-\d{4})?$/.test(cleanZip)) {
      return { isValid: false, message: 'Invalid Zip Code format (12345 or 12345-6789)' };
    }
    const validPrefixes = US_ZIP_MAP[state];
    if (validPrefixes && !validPrefixes.some(p => cleanZip.startsWith(p))) {
      return { isValid: false, message: `Zip Code ${cleanZip.substring(0, 5)} is not valid for ${state}` };
    }
  } else {
    if (!/^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(cleanZip)) {
      return { isValid: false, message: 'Invalid Postal Code format (A1A1A1)' };
    }
    const validLetters = CA_POSTAL_MAP[state];
    if (validLetters && !validLetters.includes(cleanZip[0])) {
      return { isValid: false, message: `Postal Code starting with ${cleanZip[0]} is not valid for ${state}` };
    }
  }
  
  return { isValid: true };
};
