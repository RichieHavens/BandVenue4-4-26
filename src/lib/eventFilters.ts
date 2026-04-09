import { AppEvent } from '../types';

export const isActionRequired = (event: AppEvent) => {
  const hasBand = event.acts && event.acts.length > 0 && event.acts.some((a: any) => a.band_id);
  let missingCount = 0;
  if (!hasBand) missingCount++;
  if (hasBand && !event.band_confirmed) missingCount++;
  if (!event.venue_confirmed) missingCount++;
  if (!event.hero_url) missingCount++;
  
  // If it's almost ready, we don't count it as a general "Action Required" to avoid double counting in the top cards
  if (missingCount === 1 && !event.is_published) return false;
  
  const noBand = !hasBand;
  const missingPromo = !event.hero_url;
  const needsVenueConfirm = !event.venue_confirmed;
  return noBand || missingPromo || needsVenueConfirm;
};

export const isOpenSlot = (event: AppEvent) => {
  return !event.acts || event.acts.length === 0 || !event.acts.some((a: any) => a.band_id);
};

export const isUnconfirmedAct = (event: AppEvent) => {
  const hasBand = event.acts && event.acts.length > 0 && event.acts.some((a: any) => a.band_id);
  return hasBand && !event.band_confirmed;
};

export const isUnpublished = (event: AppEvent) => !event.is_published;
export const isUnconfirmedVenue = (event: AppEvent) => !event.venue_confirmed;
export const isUnconfirmedBand = (event: AppEvent) => !event.band_confirmed;
export const isMissingDate = (event: AppEvent) => !event.start_time;
export const isConfirmedEvent = (event: AppEvent) => event.venue_confirmed && event.band_confirmed && !!event.hero_url;
