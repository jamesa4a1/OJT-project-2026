// Clearance Template Types and Interfaces

export interface CriminalCase {
  case_number: string;
  crime: string;
  date_info_filed: string;
  origin: string;
  status: string;
}

export interface FormData {
  format_type: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  suffix: string;
  alias: string;
  age: string;
  civil_status: string;
  nationality: string;
  address: string;
  purpose: string;
  purpose_fee: number;
  custom_purpose: string;
  issued_upon_request_by: string;
  date_issued: string;
  prc_id_number: string;
  validity_period: string;
  validity_expiry: string;
  // Criminal record fields (legacy - for single case)
  case_numbers: string;
  crime_description: string;
  legal_statute: string;
  date_of_commission: string;
  date_information_filed: string;
  case_status: string;
  court_branch: string;
  notes: string;
  // Multiple criminal cases for Format B/D/F
  criminal_cases: CriminalCase[];
}

export interface FormatConfig {
  label: string;
  hasCR: boolean;
  isFamily: boolean;
  isDerogatory: boolean;
  isBalsaff: boolean;
}

export interface TemplateProps {
  formData: FormData;
  fullName: string;
  generatedOR: string | null;
  getOrdinalSuffix: (day: number) => string;
}

export interface PreviewTemplateProps extends TemplateProps {
  textColor: string;
}
