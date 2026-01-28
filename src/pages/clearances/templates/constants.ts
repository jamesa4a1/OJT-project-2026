// Clearance Constants - Format Types, Options, etc.

import { FormatConfig } from './types';

// Certificate Format Types
export const FORMAT_TYPES: Record<string, FormatConfig> = {
  A: { label: 'Individual - No Criminal Record', hasCR: false, isFamily: false, isDerogatory: false, isBalsaff: false },
  B: { label: 'Individual - Has Criminal Record', hasCR: true, isFamily: false, isDerogatory: false, isBalsaff: false },
  C: { label: 'Family/Requester - No Criminal Record', hasCR: false, isFamily: true, isDerogatory: false, isBalsaff: false },
  D: { label: 'Family/Requester - Has Criminal Record', hasCR: true, isFamily: true, isDerogatory: false, isBalsaff: false },
  E: { label: 'Individual - No Derogatory Record', hasCR: false, isFamily: false, isDerogatory: true, isBalsaff: false },
  F: { label: 'Individual - Balsaff Application (With Case)', hasCR: true, isFamily: false, isDerogatory: false, isBalsaff: true },
};

export const CIVIL_STATUS_OPTIONS = ['Single', 'Married', 'Widow', 'Widower', 'Separated', 'Divorced'];

export const CASE_STATUS_OPTIONS = [
  'Pending in Court',
  'Pending with Prosecutor', 
  'Dismissed',
  'Convicted',
  'Acquitted',
  'Referred to Other Agency',
  'Other'
];

export const PURPOSE_OPTIONS = [
  { name: 'Local Employment', fee: 50 },
  { name: 'Foreign Employment', fee: 100 },
  { name: 'Foreign Travel', fee: 200 },
  { name: 'Firearm License', fee: 1000 },
  { name: 'Permit to Carry Firearm', fee: 500 },
  { name: 'Business Permit', fee: 300 },
  { name: 'Retirement/Resignation', fee: 100 },
  { name: 'Certification of No Pending Case', fee: 75 },
  { name: 'Promotion', fee: 0 },
  { name: 'Probation', fee: 0 },
  { name: 'Plea Bargaining Agreement', fee: 0 },
  { name: 'For Family Verification', fee: 0 },
  { name: 'For Adoption Proceedings', fee: 0 },
  { name: 'No Derogatory Record', fee: 50 },
  { name: 'Application for Balsaff', fee: 100 },
  { name: 'Other', fee: 0 },
];

// Official DOJ and Bagong Pilipinas logos
export const DOJ_SEAL = '/images/logos/doj-seal.png';
export const BAGONG_PILIPINAS_SEAL = '/images/logos/bagong-pilipinas.png';

// Helper function to get ordinal suffix for dates (1st, 2nd, 3rd, etc.)
export const getOrdinalSuffix = (day: number): string => {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
};
