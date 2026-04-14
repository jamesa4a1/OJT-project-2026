// Shared Types for Clearance Templates
import React from 'react';

export interface CriminalCase {
  case_number: string;
  case_number_type?: string; // "NPS Docket No." or "Criminal Case No."
  crime: string;
  date_info_filed: string;
  date_type?: string; // "Date Info Filed" or "Date Filed"
  origin: string;
  status: string;
}

export interface FormData {
  format_type: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  suffix?: string;
  alias?: string;
  age: string | number;
  civil_status: string;
  nationality: string;
  address: string;
  purpose: string;
  purpose_fee: number;
  custom_purpose?: string;
  issued_upon_request_by?: string;
  date_issued: string;
  prc_id_number?: string;
  validity_period?: string;
  validity_expiry?: string;
  case_numbers?: string;
  crime_description?: string;
  legal_statute?: string;
  date_of_commission?: string;
  date_information_filed?: string;
  case_status?: string;
  court_branch?: string;
  notes?: string;
  criminal_cases?: CriminalCase[];
  or_number?: string;
  has_criminal_record?: boolean;
  // Additional fields for different formats
  sex?: string;
  birth_date?: string;
  birth_place?: string;
  height?: string;
  weight?: string;
  blood_type?: string;
  distinguishing_marks?: string;
  id_presented?: string;
  id_number?: string;
  right_thumbmark?: string;
  photo?: string;
  ctc_number?: string;
  ctc_issued_at?: string;
  ctc_issued_on?: string;
}

export interface ClearanceTemplateProps {
  data: FormData;
  isDark?: boolean;
}

// Common text color for all formats
export const TEXT_COLOR = '#000080';

// Common base style for preview components
export const getBaseStyle = (): React.CSSProperties => ({
  fontFamily: "'Century Gothic', Arial, sans-serif",
  fontSize: '10pt',
  lineHeight: 1.5,
  color: TEXT_COLOR,
});

// Utility function for ordinal suffix
export const getOrdinalSuffix = (day: number): string => {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
};

// Format date utility
export const formatDate = (dateStr: string): { day: number; suffix: string; monthYear: string; fullDate: string } => {
  const date = new Date(dateStr);
  const day = date.getDate();
  const suffix = getOrdinalSuffix(day);
  const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const fullDate = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  return { day, suffix, monthYear, fullDate };
};

// Format date string for print templates
export const formatDateString = (dateStr: string): string => {
  const date = new Date(dateStr);
  const day = date.getDate();
  const ordinal = getOrdinalSuffix(day);
  const month = date.toLocaleDateString('en-US', { month: 'long' });
  const year = date.getFullYear();
  return `${day}${ordinal} day of ${month}, ${year}`;
};

// Format full date for print templates
export const formatFullDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

// Build full name from form data
export const buildFullName = (data: FormData): string => {
  const middleName = data.middle_name?.trim();
  
  // Check if middle name is "of legal age" (case-insensitive)
  const isOfLegalAge = middleName?.toLowerCase() === 'of legal age';
  
  return [
    data.first_name?.toUpperCase(),
    data.last_name?.toUpperCase(),
    isOfLegalAge ? 'of legal age' : (middleName ? `y ${middleName.toUpperCase()}` : ''),
    data.suffix ? data.suffix.toUpperCase() : ''
  ].filter(Boolean).join(' ');
};

// Check if has criminal record
export const hasCriminalRecord = (data: FormData): boolean => {
  return !!(data.criminal_cases && data.criminal_cases.some(c => c.case_number && c.crime));
};

// Format types with descriptions
export const FORMAT_OPTIONS = [
  { value: 'A', label: 'Format A', description: 'Standard Certification (No Criminal Record - Basic)' },
  { value: 'B', label: 'Format B', description: 'Criminal Record Certification (With Case Details)' },
  { value: 'C', label: 'Format C', description: 'Standard Certification (With Signature & Thumbmark)' },
  { value: 'D', label: 'Format D', description: 'Criminal Record Certification (Table Format)' },
  { value: 'E', label: 'Format E', description: 'Overseas/Immigration Certification' },
  { value: 'F', label: 'Format F', description: 'Complete Certification (Full Details with Photo)' },
];

// Civil status options
export const CIVIL_STATUS_OPTIONS = [
  'Single',
  'Married',
  'Divorced',
  'Widowed',
  'Separated',
  'Blank',
  'Custom'
];

// Sex options
export const SEX_OPTIONS = ['Male', 'Female'];

// Blood type options
export const BLOOD_TYPE_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];

// Purpose options with fees
export const PURPOSE_OPTIONS = [
  { name: 'Employment', fee: 115 },
  { name: 'Local Employment', fee: 50 },
  { name: 'Visa Application', fee: 115 },
  { name: 'Immigration', fee: 115 },
  { name: 'Professional Licensing', fee: 115 },
  { name: 'Business License', fee: 115 },
  { name: 'Travel', fee: 115 },
  { name: 'Legal Proceedings', fee: 115 },
  { name: 'Adoption', fee: 115 },
  { name: 'Marriage', fee: 115 },
  { name: 'Other', fee: 115 }
];

// Fields required for each format
export const FORMAT_FIELDS: Record<string, string[]> = {
  'A': ['first_name', 'middle_name', 'last_name', 'suffix', 'age', 'civil_status', 'nationality', 'address', 'purpose', 'date_issued', 'prc_id_number'],
  'B': ['first_name', 'middle_name', 'last_name', 'suffix', 'age', 'civil_status', 'nationality', 'address', 'purpose', 'date_issued', 'prc_id_number', 'criminal_cases'],
  'C': ['first_name', 'middle_name', 'last_name', 'suffix', 'age', 'civil_status', 'nationality', 'address', 'purpose', 'date_issued', 'prc_id_number', 'validity_expiry', 'or_number'],
  'D': ['first_name', 'middle_name', 'last_name', 'suffix', 'age', 'civil_status', 'nationality', 'address', 'purpose', 'issued_upon_request_by', 'date_issued', 'prc_id_number', 'criminal_cases', 'id_number'],
  'E': ['first_name', 'middle_name', 'last_name', 'suffix', 'age', 'civil_status', 'nationality', 'address', 'purpose', 'date_issued', 'prc_id_number'],
  'F': ['first_name', 'middle_name', 'last_name', 'suffix', 'age', 'civil_status', 'nationality', 'address', 'photo', 'right_thumbmark'],
};
