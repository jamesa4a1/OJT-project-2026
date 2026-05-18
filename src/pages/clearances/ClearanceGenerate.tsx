import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { ThemeContext } from '../../App';
import config from '../../config';

// Import from unified template
import { 
  CIVIL_STATUS_OPTIONS, 
  PURPOSE_OPTIONS,
  FORMAT_OPTIONS,
  FORMAT_FIELDS,
  SEX_OPTIONS,
  BLOOD_TYPE_OPTIONS,
  ClearancePreview,
  getPrintTemplate,
} from './templates';

import type { CriminalCase, FormData } from './templates';

const FORMAT_C_ID_OPTIONS = [
  'DOJ ID No.',
  'Drivers License',
  'UMID CRN No.',
  'PRC ID',
  'National ID',
  'Comelec ID',
  'CTC No.',
  'Philpost ID No.',
] as const;

const normalizeFormatCIdLabel = (value: string): string => {
  switch (value.trim()) {
    case 'DOJ ID No':
      return 'DOJ ID No.';
    case 'CTC No':
      return 'CTC No.';
    case 'Philpost ID No':
      return 'Philpost ID No.';
    default:
      return value.trim();
  }
};

const FORMAT_C_VALIDITY_LABEL_OPTIONS = [
  'Valid Until',
  'Date of Issuance',
  'Expiration Date',
  'No entry',
] as const;

const ClearanceGenerate: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const location = useLocation();
  const caseState = (location.state as { fromCase?: Record<string, string>; format?: string } | null);
  const { user } = useAuth();
  const themeContext = useContext(ThemeContext);
  const isDark = themeContext?.isDark ?? false;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [generatedOR, setGeneratedOR] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0); // Key to force form re-render on reset
  const [textColor, setTextColor] = useState<'navy' | 'black'>('navy'); // Text color for certificate
  const [showColorDropdown, setShowColorDropdown] = useState(false); // Color dropdown visibility
  const [showMiddleNameDropdown, setShowMiddleNameDropdown] = useState(false); // Middle name dropdown visibility
  const [showAgeDropdown, setShowAgeDropdown] = useState(false); // Age dropdown visibility
  const [formatCIdType, setFormatCIdType] = useState<string>('DOJ ID No.');
  const [formatCCustomIdType, setFormatCCustomIdType] = useState<string>('');
  const [formatCValidityLabelType, setFormatCValidityLabelType] = useState<string>('Valid Until');
  const [formatCCustomValidityLabel, setFormatCCustomValidityLabel] = useState<string>('');
  
  // Multi-respondent state (when printing from a case with multiple respondents)
  const [respondentForms, setRespondentForms] = useState<FormData[]>([]);
  const [activeRespondentIndex, setActiveRespondentIndex] = useState(0);

  const normalizeCaseField = (value: unknown): string => {
    if (value === null || value === undefined) return '';

    const normalizePrimitive = (raw: unknown): string => {
      const str = String(raw ?? '').trim();
      if (!str) return '';
      if (/^(n\/a|na|null|undefined)$/i.test(str)) return '';
      return str;
    };

    const direct = normalizePrimitive(value);
    if (!direct) return '';

    // Common case from Manage Cases: values stored as JSON arrays like ["Pending"] or [""].
    if (direct.startsWith('[') || direct.startsWith('"')) {
      try {
        const parsed = JSON.parse(direct);
        if (Array.isArray(parsed)) {
          const joined = parsed
            .map((item) => normalizePrimitive(item))
            .filter(Boolean)
            .join(', ');
          return joined;
        }
        return normalizePrimitive(parsed);
      } catch {
        // Fall through to conservative cleanup when not valid JSON.
      }
    }

    // Fallback cleanup for bracket-wrapped single values.
    const cleaned = direct
      .replace(/^\[\s*['"]?/, '')
      .replace(/['"]?\s*\]$/, '')
      .trim();

    return normalizePrimitive(cleaned);
  };

  const normalizeCaseFieldList = (value: unknown): string[] => {
    if (value === null || value === undefined) return [];
    const raw = String(value).trim();
    if (!raw) return [];

    if (raw.startsWith('[') || raw.startsWith('"')) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => normalizeCaseField(item)).filter(Boolean);
        }
        const single = normalizeCaseField(parsed);
        return single ? [single] : [];
      } catch {
        // Fall through to comma-split fallback
      }
    }

    return raw
      .split(',')
      .map((item) => normalizeCaseField(item))
      .filter(Boolean);
  };

  const parseCaseStringArray = (value: unknown): string[] => {
    if (value === null || value === undefined) return [];

    const raw = String(value).trim();
    if (!raw) return [];

    const looksSerialized =
      (raw.startsWith('[') && raw.endsWith(']')) ||
      (raw.startsWith('{') && raw.endsWith('}'));

    if (raw.startsWith('[') || raw.startsWith('"')) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => normalizeCaseField(item)).filter(Boolean);
        }

        const single = normalizeCaseField(parsed);
        return single ? [single] : [];
      } catch {
        // Fall through to single-value normalization.
      }
    }

    const single = normalizeCaseField(raw);
    if (!single) return [];

    // Avoid leaking malformed serialized strings such as [""] into the UI/preview.
    if (looksSerialized) return [];

    return [single];
  };

  const getArrayValue = (values: string[], index: number): string => {
    return values[index] || '';
  };
  
  const getDefaultDate = () => {
    return new Date().toISOString().split('T')[0];
  };
  
  const getExpiryDate = (issuedDate: string, period: string) => {
    const date = new Date(issuedDate);
    if (period === '1 Year') {
      date.setFullYear(date.getFullYear() + 1);
    } else {
      date.setMonth(date.getMonth() + 6);
    }
    return date.toISOString().split('T')[0];
  };
  
  const [formData, setFormData] = useState<FormData>({
    format_type: 'A',
    first_name: '',
    middle_name: '',
    last_name: '',
    suffix: '',
    alias: '',
    age: '',
    sex: 'Male',
    civil_status: 'Single',
    nationality: 'Filipino',
    address: '',
    birth_date: '',
    birth_place: '',
    height: '',
    weight: '',
    blood_type: '',
    distinguishing_marks: '',
    id_presented: '',
    id_number: '',
    ctc_number: '',
    ctc_issued_at: '',
    ctc_issued_on: '',
    purpose: '',
    purpose_fee: 50,
    custom_purpose: '',
    issued_upon_request_by: '',
    date_issued: getDefaultDate(),
    prc_id_number: '',
    validity_period: '6 Months',
    validity_expiry: getExpiryDate(getDefaultDate(), '6 Months'),
    case_numbers: '',
    crime_description: '',
    legal_statute: '',
    date_of_commission: '',
    date_information_filed: '',
    case_status: '',
    court_branch: '',
    notes: '',
    criminal_cases: [{ case_number: '', case_number_type: 'Criminal Case No.', crime: '', date_info_filed: '', date_type: 'Date Info Filed', origin: 'Tagbilaran City', status: '' }],
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [hasCriminalRecord, setHasCriminalRecord] = useState(false);
  
  // State for custom purposes (persistent via localStorage)
  const [customPurposes, setCustomPurposes] = useState<{ name: string; fee: number }[]>(() => {
    try {
      const stored = localStorage.getItem('customPurposes');
      if (!stored) return [];

      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return [];

      return parsed
        .map((item) => ({
          name: String(item?.name || '').trim(),
          fee: Number(item?.fee) || 0,
        }))
        .filter((item) => item.name);
    } catch (error) {
      console.error('Error loading custom purposes:', error);
      return [];
    }
  });
  const [showAddPurposeModal, setShowAddPurposeModal] = useState(false);
  const [newPurposeName, setNewPurposeName] = useState('');
  const [newPurposeFee, setNewPurposeFee] = useState<number>(115);
  
  const normalizePurposeKey = (name: string) => name.trim().toLowerCase();

  // State for deleted purposes (persistent via localStorage)
  const [deletedPurposes, setDeletedPurposes] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('deletedPurposes');
      if (!stored) return new Set();

      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return new Set();

      return new Set(parsed.map((name) => normalizePurposeKey(String(name || ''))).filter(Boolean));
    } catch (e) {
      console.error('Error loading deleted purposes:', e);
      return new Set();
    }
  });
  const [showPurposeDropdown, setShowPurposeDropdown] = useState(false);

  // Save deleted purposes to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('deletedPurposes', JSON.stringify(Array.from(deletedPurposes)));
  }, [deletedPurposes]);

  // Save custom purposes to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('customPurposes', JSON.stringify(customPurposes));
  }, [customPurposes]);

  useEffect(() => {
    if (formData.format_type !== 'C' && formData.format_type !== 'D') return;

    const currentIdLabel = (formData.id_presented || '').trim();
    const normalizedIdLabel = normalizeFormatCIdLabel(currentIdLabel === 'UMID CM No' ? 'UMID CRN No.' : currentIdLabel);

    if (normalizedIdLabel !== currentIdLabel) {
      setFormData((prev: FormData) => ({ ...prev, id_presented: normalizedIdLabel }));
      return;
    }

    if (!currentIdLabel) {
      setFormatCIdType('DOJ ID No.');
      setFormatCCustomIdType('');
      return;
    }

    if (FORMAT_C_ID_OPTIONS.includes(currentIdLabel as (typeof FORMAT_C_ID_OPTIONS)[number])) {
      setFormatCIdType(normalizeFormatCIdLabel(currentIdLabel));
      setFormatCCustomIdType('');
      return;
    }

    setFormatCIdType('custom');
    setFormatCCustomIdType(currentIdLabel);
  }, [formData.format_type, formData.id_presented]);

  useEffect(() => {
    if (formData.format_type !== 'C' && formData.format_type !== 'D') return;

    const currentValidityLabel = (formData.id_number || '').trim();
    if (!currentValidityLabel) {
      setFormatCValidityLabelType('Valid Until');
      setFormatCCustomValidityLabel('');
      return;
    }

    if (FORMAT_C_VALIDITY_LABEL_OPTIONS.includes(currentValidityLabel as (typeof FORMAT_C_VALIDITY_LABEL_OPTIONS)[number])) {
      setFormatCValidityLabelType(currentValidityLabel);
      setFormatCCustomValidityLabel('');
      return;
    }

    setFormatCValidityLabelType('custom');
    setFormatCCustomValidityLabel(currentValidityLabel);
  }, [formData.format_type, formData.id_number]);

  // Load clearance data if editing
  useEffect(() => {
    if (editId) {
      axios.get(`${config.api.baseURL}/api/clearances/${editId}`)
        .then(response => {
          const data = response.data;
          
          // Reconstruct criminal_cases from database fields
          let reconstructedCriminalCases: CriminalCase[] = [];
          
          if (data.case_numbers || data.crime_description) {
            // Split case values from JSON arrays or comma-separated strings.
            const caseNumbers = normalizeCaseFieldList(data.case_numbers);
            const crimeDescriptions = normalizeCaseFieldList(data.crime_description);
            
            // Create criminal case objects with proper defaults for dropdown fields
            const maxLength = Math.max(caseNumbers.length, crimeDescriptions.length, 1);
            for (let i = 0; i < maxLength; i++) {
              reconstructedCriminalCases.push({
                case_number: caseNumbers[i] || '',
                case_number_type: 'Criminal Case No.', // Default value
                crime: crimeDescriptions[i] || '',
                date_info_filed: data.date_information_filed?.split('T')[0] || '',
                date_type: 'Date Info Filed', // Default value
                origin: 'Tagbilaran City',
                status: normalizeCaseField(data.case_status || '')
              });
            }
          }
          
          // If no criminal cases, provide default
          if (reconstructedCriminalCases.length === 0) {
            reconstructedCriminalCases = [{
              case_number: '',
              case_number_type: 'Criminal Case No.',
              crime: '',
              date_info_filed: '',
              date_type: 'Date Info Filed',
              origin: 'Tagbilaran City',
              status: ''
            }];
          }
          
          setFormData({
            format_type: 'A',
            first_name: data.first_name || '',
            middle_name: data.middle_name || '',
            last_name: data.last_name || '',
            suffix: data.suffix || '',
            alias: data.alias || '',
            age: data.age?.toString() || '',
            civil_status: data.civil_status || 'Single',
            nationality: data.nationality || 'Filipino',
            address: data.address || '',
            id_presented: data.id_presented || '',
            id_number: data.id_number || '',
            ctc_number: data.ctc_number || '',
            ctc_issued_at: data.ctc_issued_at || '',
            ctc_issued_on: data.ctc_issued_on || '',
            purpose: data.purpose || 'Local Employment',
            purpose_fee: data.purpose_fee || 0,
            custom_purpose: '',
            issued_upon_request_by: data.issued_upon_request_by || user?.name || '',
            date_issued: data.date_issued?.split('T')[0] || getDefaultDate(),
            prc_id_number: data.prc_id_number || '',
            validity_period: data.validity_period || '6 Months',
            validity_expiry: data.validity_expiry?.split('T')[0] || getExpiryDate(getDefaultDate(), '6 Months'),
            case_numbers: normalizeCaseFieldList(data.case_numbers).join(', '),
            crime_description: normalizeCaseFieldList(data.crime_description).join(', '),
            legal_statute: data.legal_statute || '',
            date_of_commission: data.date_of_commission?.split('T')[0] || '',
            date_information_filed: data.date_information_filed?.split('T')[0] || '',
            case_status: normalizeCaseField(data.case_status || ''),
            court_branch: normalizeCaseField(data.court_branch || ''),
            notes: data.notes || '',
            criminal_cases: reconstructedCriminalCases,
          });
          setGeneratedOR(data.or_number);
          setHasCriminalRecord(data.has_criminal_record || false);
        })
        .catch(err => {
          console.error('Error loading clearance:', err);
          setSubmitStatus({ type: 'error', message: 'Failed to load clearance data' });
        });
    }
  }, [editId, user?.name]);

  // Pre-fill form from a case record navigated from the Manage Cases page
  useEffect(() => {
    if (!caseState?.fromCase) return;
    const c = caseState.fromCase;

    // Parse respondent and address values safely from either JSON arrays or plain strings.
    const allNames = parseCaseStringArray(c.RESPONDENT);
    const allAddresses = parseCaseStringArray(c.ADDRESS_OF_RESPONDENT);
    const allCaseNumbers = parseCaseStringArray(c.CRIM_CASE_NO);
    const allCrimes = parseCaseStringArray(c.FINAL_OFFENSE || c.OFFENSE);
    const allStatuses = parseCaseStringArray(c.REMARKS_DECISION || c.STATUS);
    const allBranches = parseCaseStringArray(c.BRANCH);
    const allDateFiledInCourt = parseCaseStringArray(c.DATEFILED_IN_COURT || c.DATE_FILED);
    const allDateOfCommission = parseCaseStringArray(c.DATE_OF_COMMISSION);

    // Helper to parse a name into first/middle/last
    const parseName = (rawName: string) => {
      let firstName = '', middleName = '', lastName = '';
      if (rawName.includes(',')) {
        const [last, rest] = rawName.split(',').map((s: string) => s.trim());
        lastName = last;
        const parts = rest.split(' ').filter(Boolean);
        firstName = parts[0] || '';
        middleName = parts.slice(1).join(' ');
      } else {
        const parts = rawName.split(' ').filter(Boolean);
        if (parts.length === 1) {
          firstName = parts[0];
          lastName = '';
          middleName = '';
        } else {
          firstName = parts[0] || '';
          lastName = parts[parts.length - 1] || '';
          middleName = parts.slice(1, -1).join(' ');
        }
      }
      return { firstName, middleName, lastName };
    };

    const safeDate = (d: string) => (d && d !== '0000-00-00' ? d.split('T')[0] : '');

    const respondentCount = Math.max(
      allNames.length,
      allCaseNumbers.length,
      allCrimes.length,
      allStatuses.length,
      allBranches.length,
      allDateFiledInCourt.length,
      1
    );

    // Build a form data object for each respondent
    const forms: FormData[] = Array.from({ length: respondentCount }, (_, i) => {
      const name = getArrayValue(allNames, i);
      const { firstName, middleName, lastName } = parseName(name);
      const caseNumber = getArrayValue(allCaseNumbers, i);
      const crime = getArrayValue(allCrimes, i);
      const status = getArrayValue(allStatuses, i);
      const branch = getArrayValue(allBranches, i);
      const dateFiled = getArrayValue(allDateFiledInCourt, i);
      const dateOfCommission = getArrayValue(allDateOfCommission, i);

      return {
        ...formData, // inherit defaults
        format_type: caseState.format || 'A',
        first_name: firstName,
        middle_name: middleName,
        last_name: lastName,
        address: getArrayValue(allAddresses, i),
        crime_description: crime,
        case_numbers: caseNumber,
        case_status: status,
        court_branch: branch,
        date_of_commission: dateOfCommission || safeDate(c.DATE_OF_COMMISSION),
        date_information_filed: dateFiled || safeDate(c.DATE_FILED),
        criminal_cases: [{
          case_number: caseNumber,
          case_number_type: 'Criminal Case No.',
          crime,
          date_info_filed: dateFiled || safeDate(c.DATE_FILED),
          date_type: 'Date Info Filed',
          origin: branch || 'Tagbilaran City',
          status,
        }],
      };
    });

    // Set the first respondent as the active form
    if (forms.length > 0) {
      setFormData(forms[0]);
    }

    // If multiple respondents, store them all
    if (forms.length > 1) {
      setRespondentForms(forms);
      setActiveRespondentIndex(0);
    }

    setHasCriminalRecord(
      allCaseNumbers.some(Boolean) ||
      allCrimes.some(Boolean) ||
      allStatuses.some(Boolean)
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync formData edits back to respondentForms array
  useEffect(() => {
    if (respondentForms.length > 1) {
      setRespondentForms(prev => prev.map((f, i) => i === activeRespondentIndex ? { ...formData } : f));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]);

  // Switch active respondent
  const switchRespondent = (index: number) => {
    if (index === activeRespondentIndex || index < 0 || index >= respondentForms.length) return;
    // Save current form to array
    setRespondentForms(prev => prev.map((f, i) => i === activeRespondentIndex ? { ...formData } : f));
    // Load the selected respondent's form
    setFormData(respondentForms[index]);
    setActiveRespondentIndex(index);
    setFormKey(prev => prev + 1);
  };

  // Note: Form inputs are now properly managed through React state
  // No DOM manipulation is needed - inputs are controlled React components

  // Update expiry date when issued date or validity period changes (except for Format C)
  useEffect(() => {
    if (formData.date_issued && formData.validity_period && formData.format_type !== 'C' && formData.format_type !== 'D') {
      setFormData((prev: FormData) => ({
        ...prev,
        validity_expiry: getExpiryDate(prev.date_issued, prev.validity_period || '6 Months')
      }));
    }
  }, [formData.date_issued, formData.validity_period, formData.format_type]);

  // Auto-hide status message (4s for success, 6s for error)
  useEffect(() => {
    if (submitStatus) {
      const delay = submitStatus.type === 'success' ? 4000 : 6000;
      const timer = setTimeout(() => {
        setSubmitStatus(null);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [submitStatus]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'purpose') {
      // Search in both PURPOSE_OPTIONS and customPurposes
      let selectedPurpose = PURPOSE_OPTIONS.find((p: { name: string; fee: number }) => p.name === value);
      if (!selectedPurpose) {
        selectedPurpose = customPurposes.find((p: { name: string; fee: number }) => p.name === value);
      }
      setFormData((prev: FormData) => ({
        ...prev,
        purpose: value,
        purpose_fee: selectedPurpose?.fee || 0,
      }));
    } else {
      setFormData((prev: FormData) => ({ ...prev, [name]: value }));
    }
    
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  // Handler for removing a purpose from the dropdown
  const handleRemovePurpose = (purposeName: string) => {
    const purposeKey = normalizePurposeKey(purposeName);
    setCustomPurposes(prev => prev.filter((p) => normalizePurposeKey(p.name) !== purposeKey));
    setDeletedPurposes(prev => {
      const newDeleted = new Set(prev);
      newDeleted.add(purposeKey);
      return newDeleted;
    });
    
    // If the removed purpose was selected, clear it
    if (formData.purpose === purposeName) {
      setFormData(prev => ({
        ...prev,
        purpose: '',
        purpose_fee: 0,
      }));
    }
  };

  // Handler for adding a new purpose
  const handleAddPurpose = () => {
    if (!newPurposeName.trim()) {
      alert('Please enter a purpose name');
      return;
    }
    
    const newPurpose = { name: newPurposeName.trim(), fee: newPurposeFee };
    const newPurposeKey = normalizePurposeKey(newPurpose.name);
    const builtInMatch = PURPOSE_OPTIONS.find(
      (p) => normalizePurposeKey(p.name) === newPurposeKey
    );
    const customExists = customPurposes.some(
      (p) => normalizePurposeKey(p.name) === newPurposeKey
    );
    
    // If this matches a deleted built-in purpose, restore it (do not add custom duplicate).
    if (builtInMatch && deletedPurposes.has(newPurposeKey)) {
      setDeletedPurposes(prev => {
        const next = new Set(prev);
        next.delete(newPurposeKey);
        return next;
      });

      setFormData((prev: FormData) => ({
        ...prev,
        purpose: builtInMatch.name,
        purpose_fee: builtInMatch.fee,
      }));

      setNewPurposeName('');
      setNewPurposeFee(115);
      setShowAddPurposeModal(false);
      return;
    }

    // Active built-in/custom entries should still block duplicates.
    if ((builtInMatch && !deletedPurposes.has(newPurposeKey)) || customExists) {
      alert('This purpose already exists');
      return;
    }

    // Add to custom purposes
    setCustomPurposes(prev => [
      ...prev.filter((p) => normalizePurposeKey(p.name) !== newPurposeKey),
      newPurpose,
    ]);
    
    // Set as selected purpose
    setFormData((prev: FormData) => ({
      ...prev,
      purpose: newPurpose.name,
      purpose_fee: newPurpose.fee,
    }));
    
    // Reset modal
    setNewPurposeName('');
    setNewPurposeFee(115);
    setShowAddPurposeModal(false);
  };

  // Handle Enter key to move to next field
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
      e.preventDefault();
      
      // Get all focusable form elements in order (inputs and textareas only, not selects)
      const focusableElements = Array.from(
        document.querySelectorAll(
          'input:not([disabled]):not([readonly]), textarea:not([disabled]):not([readonly])'
        )
      ) as HTMLElement[];
      
      // Find current element's index
      const currentIndex = focusableElements.indexOf(e.target as HTMLElement);
      
      // Focus next element if it exists
      if (currentIndex !== -1 && currentIndex < focusableElements.length - 1) {
        const nextElement = focusableElements[currentIndex + 1];
        (nextElement as HTMLInputElement | HTMLTextAreaElement).focus();
        (nextElement as HTMLInputElement | HTMLTextAreaElement).select?.();
      }
    }
  };

  const activeBuiltInPurposes = PURPOSE_OPTIONS.filter(p => p.name !== 'Other' && !deletedPurposes.has(normalizePurposeKey(p.name)));
  const otherPurpose = PURPOSE_OPTIONS.find(p => p.name === 'Other');

  // Helper functions for managing multiple criminal cases
  const addCriminalCase = () => {
    setFormData((prev: FormData) => ({
      ...prev,
      criminal_cases: [...(prev.criminal_cases || []), { 
        case_number: '', 
        case_number_type: 'Criminal Case No.',
        crime: '', 
        date_info_filed: '', 
        date_type: 'Date Info Filed',
        origin: 'Tagbilaran City', 
        status: '' 
      }]
    }));
  };

  const removeCriminalCase = (index: number) => {
    if ((formData.criminal_cases?.length || 0) > 1) {
      setFormData((prev: FormData) => ({
        ...prev,
        criminal_cases: (prev.criminal_cases || []).filter((_: CriminalCase, i: number) => i !== index)
      }));
    }
  };

  const updateCriminalCase = (index: number, field: keyof CriminalCase, value: string) => {
    setFormData((prev: FormData) => ({
      ...prev,
      criminal_cases: (prev.criminal_cases || []).map((c: CriminalCase, i: number) => i === index ? { ...c, [field]: value } : c)
    }));
  };

  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    
    // Minimal save validation: only first name is required.
    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Generate detailed error message based on which fields are missing
      const errorMessages = [];
      const errorFields = [];
      
      // Basic information errors
      if (errors.first_name) { errorMessages.push('First name'); errorFields.push('first_name'); }
      if (errors.last_name) { errorMessages.push('Last name'); errorFields.push('last_name'); }
      if (errors.age) { errorMessages.push('Age (18-120 or "of legal age")'); errorFields.push('age'); }
      if (errors.civil_status) { errorMessages.push('Civil status'); errorFields.push('civil_status'); }
      if (errors.nationality) { errorMessages.push('Nationality'); errorFields.push('nationality'); }
      if (errors.address) { errorMessages.push('Address'); errorFields.push('address'); }
      
      // Format-specific field errors
      if (errors.purpose) { errorMessages.push('Purpose'); errorFields.push('purpose'); }
      if (errors.custom_purpose) { errorMessages.push('Purpose details'); errorFields.push('custom_purpose'); }
      if (errors.date_issued) { errorMessages.push('Date of issuance'); errorFields.push('date_issued'); }
      if (errors.prc_id_number) { errorMessages.push('O.R No'); errorFields.push('prc_id_number'); }
      if (errors.or_number) { errorMessages.push('O.R Number'); errorFields.push('or_number'); }
      if (errors.validity_expiry) { errorMessages.push('Valid until date'); errorFields.push('validity_expiry'); }
      if (errors.issued_upon_request_by) { errorMessages.push('Issued upon request by'); errorFields.push('issued_upon_request_by'); }
      if (errors.id_number) { errorMessages.push('ID number'); errorFields.push('id_number'); }
      if (errors.criminal_cases) { errorMessages.push('Criminal case information'); errorFields.push('criminal_cases'); }
      if (errors.photo) { errorMessages.push('Photo'); errorFields.push('photo'); }
      if (errors.right_thumbmark) { errorMessages.push('Right thumbmark'); errorFields.push('right_thumbmark'); }
      
      // Additional conditional field errors
      if (errors.sex) { errorMessages.push('Sex'); errorFields.push('sex'); }
      if (errors.birth_date) { errorMessages.push('Date of birth'); errorFields.push('birth_date'); }
      if (errors.birth_place) { errorMessages.push('Place of birth'); errorFields.push('birth_place'); }
      if (errors.height) { errorMessages.push('Height'); errorFields.push('height'); }
      if (errors.weight) { errorMessages.push('Weight'); errorFields.push('weight'); }
      if (errors.blood_type) { errorMessages.push('Blood type'); errorFields.push('blood_type'); }
      if (errors.distinguishing_marks) { errorMessages.push('Distinguishing marks'); errorFields.push('distinguishing_marks'); }
      if (errors.id_presented) { errorMessages.push('ID presented'); errorFields.push('id_presented'); }
      if (errors.ctc_number) { errorMessages.push('CTC number'); errorFields.push('ctc_number'); }
      if (errors.ctc_issued_at) { errorMessages.push('CTC issued at'); errorFields.push('ctc_issued_at'); }
      if (errors.ctc_issued_on) { errorMessages.push('CTC issued on'); errorFields.push('ctc_issued_on'); }
      
      const errorDisplay = errorMessages.length > 0 
        ? `Please fill up the empty fields: ${errorMessages.join(', ')}`
        : 'Please fill up the empty fields';
      
      setSubmitStatus({ type: 'error', message: errorDisplay });
      return;
    }
    
    setIsSubmitting(true);
    setSubmitStatus(null);
    
    try {
      const today = getDefaultDate();
      const ageValue = String(formData.age || '').trim();
      const normalizedAge = ageValue.toLowerCase() === 'of legal age'
        ? 18
        : Number.parseInt(ageValue, 10);
      const safeAge = Number.isNaN(normalizedAge) ? 18 : normalizedAge;
      const defaultPurpose = formData.purpose || 'Local Employment';
      const resolvedPurpose = formData.purpose === 'Other' ? (formData.custom_purpose || 'Other') : defaultPurpose;
      const defaultDateIssued = formData.date_issued || today;
      const defaultValidityPeriod = formData.validity_period || '6 Months';
      const defaultValidityExpiry = formData.validity_expiry || getExpiryDate(defaultDateIssued, defaultValidityPeriod);

      const payload = {
        ...formData,
        first_name: formData.first_name.trim(),
        last_name: formData.last_name?.trim() || '',
        age: safeAge,
        civil_status: formData.civil_status || 'Single',
        nationality: formData.nationality?.trim() || 'Filipino',
        address: formData.address?.trim() || '',
        purpose: resolvedPurpose,
        purpose_fee: formData.purpose_fee || (defaultPurpose === 'Local Employment' ? 50 : 0),
        date_issued: defaultDateIssued,
        validity_period: defaultValidityPeriod,
        validity_expiry: defaultValidityExpiry,
        issued_upon_request_by: formData.issued_upon_request_by || user?.name || '',
        has_criminal_record: hasCriminalRecord,
        issued_by_user_id: user?.id,
        issued_by_name: user?.name,
      };
      
      let response;
      if (editId) {
        response = await axios.put(`${config.api.baseURL}/api/clearances/${editId}`, {
          ...payload,
          updated_by_user_id: user?.id,
          updated_by_name: user?.name,
        });
      } else {
        response = await axios.post(`${config.api.baseURL}/api/clearances`, payload);
      }
      
      setSubmitStatus({ 
        type: 'success', 
        message: editId 
          ? 'Clearance updated successfully!' 
          : `Clearance created successfully! O.R. Number: ${response.data.data?.or_number || generatedOR}`
      });
      
      if (!editId && response.data.data?.or_number) {
        setGeneratedOR(response.data.data.or_number);
      }
      
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      console.error('Error saving clearance:', error);
      setSubmitStatus({ 
        type: 'error', 
        message: axiosError.response?.data?.error || 'Failed to save clearance' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearForm = () => {
    // Clear URL parameters to prevent edit mode interference
    if (editId) {
      navigate('/clearances/generate', { replace: true });
    }
    
    // Reset all form state to initial values
    const defaultDate = getDefaultDate();
    const defaultExpiryDate = getExpiryDate(defaultDate, '6 Months');
    
    setFormData({
      format_type: 'A',
      first_name: '',
      middle_name: '',
      last_name: '',
      suffix: '',
      alias: '',
      age: '',
      sex: 'Male',
      civil_status: 'Single',
      nationality: 'Filipino',
      address: '',
      birth_date: '',
      birth_place: '',
      height: '',
      weight: '',
      blood_type: '',
      distinguishing_marks: '',
      id_presented: '',
      id_number: '',
      ctc_number: '',
      ctc_issued_at: '',
      ctc_issued_on: '',
      purpose: '',
      purpose_fee: 50,
      custom_purpose: '',
      issued_upon_request_by: '',
      date_issued: defaultDate,
      prc_id_number: '',
      validity_period: '6 Months',
      validity_expiry: defaultExpiryDate,
      case_numbers: '',
      crime_description: '',
      legal_statute: '',
      date_of_commission: '',
      date_information_filed: '',
      case_status: '',
      court_branch: '',
      notes: '',
      criminal_cases: [{ case_number: '', case_number_type: 'Criminal Case No.', crime: '', date_info_filed: '', date_type: 'Date Info Filed', origin: 'Tagbilaran City', status: '' }],
    });
    setErrors({});
    setSubmitStatus(null);
    setGeneratedOR(null);
    setHasCriminalRecord(false);
    setRespondentForms([]);
    setActiveRespondentIndex(0);
    
    // Increment formKey to force complete form re-render with fresh inputs
    setFormKey(prev => prev + 1);
    
    // Focus on first available input field to improve UX
    setTimeout(() => {
      const firstInput = document.querySelector('input[name="first_name"]') as HTMLInputElement;
      if (firstInput) {
        firstInput.focus();
      }
    }, 50);
  };

  const handleDownloadPDF = async () => {
    const html2pdf = (await import('html2pdf.js')).default;
    
    // Build full name for print template
    const isMiddleNameOfLegalAge = formData.middle_name?.trim().toLowerCase() === 'of legal age';
    const printFullName = [
      formData.first_name.toUpperCase(),
      formData.last_name.toUpperCase(),
      formData.middle_name?.trim() ? (isMiddleNameOfLegalAge ? 'of legal age' : `y ${formData.middle_name.trim().toUpperCase()}`) : '',
      formData.suffix ? formData.suffix.toUpperCase() : ''
    ].filter(Boolean).join(' ');

    // Get the print template HTML
    const printDocument = getPrintTemplate({ formData, fullName: printFullName, generatedOR, textColor });
    
    // Verify it's actually the print template by checking for DOCTYPE
    if (!printDocument.includes('<!DOCTYPE html>')) {
      console.error('Print template generation failed, falling back to preview');
      // Fallback to the old method if print template fails
      const element = document.getElementById('certificate-preview');
      if (!element) return;
      
      const opt = {
        margin: 0.5,
        filename: `clearance_${generatedOR || 'preview'}_${formData.last_name}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      html2pdf().set(opt as any).from(element).save();
      return;
    }
    
    // Create a temporary element with the print template
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = printDocument;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '-9999px';
    document.body.appendChild(tempDiv);
    
    // Find the certificate container in the print template
    const element = (tempDiv.querySelector('.certificate-container') as HTMLElement) || tempDiv;
    
    const opt = {
      margin: 0.5,
      filename: `clearance_${generatedOR || 'preview'}_${formData.last_name}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await html2pdf().set(opt as any).from(element).save();
    } finally {
      // Clean up the temporary element
      document.body.removeChild(tempDiv);
    }
    
    if (editId) {
      try {
        await axios.post(`${config.api.baseURL}/api/clearances/${editId}/log-download`, {
          user_id: user?.id,
          user_name: user?.name,
        });
      } catch (err) {
        console.error('Error logging download:', err);
      }
    }
  };

  const handlePrint = () => {
    // Build full name for print template
    const isMiddleNameOfLegalAge = formData.middle_name?.trim().toLowerCase() === 'of legal age';
    const printFullName = [
      formData.first_name.toUpperCase(),
      formData.last_name.toUpperCase(),
      formData.middle_name?.trim() ? (isMiddleNameOfLegalAge ? 'of legal age' : `y ${formData.middle_name.trim().toUpperCase()}`) : '',
      formData.suffix ? formData.suffix.toUpperCase() : ''
    ].filter(Boolean).join(' ');

    // Get complete print document from the format file
    const printDocument = getPrintTemplate({ formData, fullName: printFullName, generatedOR, textColor });
    
    // Remove the auto-print script from the template since we handle printing via iframe
    const cleanedDocument = printDocument
      .replace(/<script>[\s\S]*?<\/script>/gi, '')
      .replace('</body>', '</body>');
    
    // Use a hidden iframe instead of window.open to avoid losing focus/tab switch
    // This keeps the main page fully interactive after printing
    const existingFrame = document.getElementById('print-frame') as HTMLIFrameElement;
    if (existingFrame) {
      document.body.removeChild(existingFrame);
    }
    
    const iframe = document.createElement('iframe');
    iframe.id = 'print-frame';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    iframe.style.opacity = '0';
    document.body.appendChild(iframe);
    
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      document.body.removeChild(iframe);
      return;
    }
    
    iframeDoc.open();
    iframeDoc.write(cleanedDocument);
    iframeDoc.close();
    
    // Wait for content to load, then print
    iframe.onload = () => {
      setTimeout(() => {
        try {
          iframe.contentWindow?.print();
        } catch (e) {
          console.error('Print failed:', e);
        }
        // Clean up after printing (with delay to allow print dialog to finish)
        setTimeout(() => {
          if (document.getElementById('print-frame')) {
            document.body.removeChild(iframe);
          }
        }, 1000);
      }, 300);
    };
  };

  // Print all respondent certificates at once
  const handlePrintAll = () => {
    if (respondentForms.length <= 1) {
      handlePrint();
      return;
    }
    // Save current form state to the array first
    const allForms = respondentForms.map((f, i) => i === activeRespondentIndex ? { ...formData } : f);
    
    // Build combined HTML for all respondents
    const allPages = allForms.map((rf) => {
      const isMiddleNameOfLegalAge = rf.middle_name?.trim().toLowerCase() === 'of legal age';
      const fullName = [
        rf.first_name.toUpperCase(),
        rf.last_name.toUpperCase(),
        rf.middle_name?.trim() ? (isMiddleNameOfLegalAge ? 'of legal age' : `y ${rf.middle_name.trim().toUpperCase()}`) : '',
        rf.suffix ? rf.suffix.toUpperCase() : ''
      ].filter(Boolean).join(' ');
      return getPrintTemplate({ formData: rf, fullName, generatedOR, textColor });
    });

    // Combine into a single print document with page breaks
    const combinedBody = allPages.map((doc, idx) => {
      // Extract body content from each full HTML document
      const bodyMatch = doc.match(/<body[^>]*>([\s\S]*)<\/body>/i);
      const bodyContent = bodyMatch ? bodyMatch[1] : doc;
      return `<div ${idx > 0 ? 'style="page-break-before: always;"' : ''}>${bodyContent}</div>`;
    }).join('\n');

    // Use the first template as base for styles
    const firstDoc = allPages[0];
    const headMatch = firstDoc.match(/<head[^>]*>([\s\S]*)<\/head>/i);
    const headContent = headMatch ? headMatch[1] : '';

    const combinedDocument = `<!DOCTYPE html><html><head>${headContent}</head><body>${combinedBody}</body></html>`
      .replace(/<script>[\s\S]*?<\/script>/gi, '');

    const existingFrame = document.getElementById('print-frame') as HTMLIFrameElement;
    if (existingFrame) document.body.removeChild(existingFrame);
    
    const iframe = document.createElement('iframe');
    iframe.id = 'print-frame';
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:none;opacity:0';
    document.body.appendChild(iframe);
    
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) { document.body.removeChild(iframe); return; }
    
    iframeDoc.open();
    iframeDoc.write(combinedDocument);
    iframeDoc.close();
    
    iframe.onload = () => {
      setTimeout(() => {
        try { iframe.contentWindow?.print(); } catch (e) { console.error('Print failed:', e); }
        setTimeout(() => { if (document.getElementById('print-frame')) document.body.removeChild(iframe); }, 1000);
      }, 300);
    };
  };

  const inputClasses = `w-full px-3 py-2.5 rounded-lg border-2 outline-none transition-all duration-200 text-sm ${
    isDark 
      ? 'bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20' 
      : 'bg-white border-slate-200 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
  }`;

  const labelClasses = `block text-xs font-semibold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/clearances')}
                className={`inline-flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 ${
                  isDark 
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white shadow-lg shadow-slate-900/25' 
                    : 'bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-900 shadow-lg shadow-gray-900/10'
                }`}
              >
                <i className="fas fa-arrow-left text-lg"></i>
              </motion.button>
              
              <div>
                <div className="flex items-center space-x-3">
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${
                    isDark ? 'bg-blue-900/50' : 'bg-blue-100'
                  }`}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="5" y="3" width="12" height="18" rx="1" stroke={isDark ? '#60a5fa' : '#2563eb'} strokeWidth="1.5" fill="none"/>
                      <rect x="8" y="1.5" width="6" height="2" rx="0.5" fill={isDark ? '#60a5fa' : '#2563eb'}/>
                      <line x1="7" y1="7" x2="16" y2="7" stroke={isDark ? '#60a5fa' : '#2563eb'} strokeWidth="1" opacity="0.5"/>
                      <line x1="7" y1="10" x2="16" y2="10" stroke={isDark ? '#60a5fa' : '#2563eb'} strokeWidth="1" opacity="0.5"/>
                      <line x1="7" y1="13" x2="13" y2="13" stroke={isDark ? '#60a5fa' : '#2563eb'} strokeWidth="1" opacity="0.5"/>
                      <circle cx="16" cy="16" r="3.5" fill={isDark ? '#60a5fa' : '#2563eb'} opacity="0.1"/>
                      <path d="M14.5 16L15.5 17L17.5 15" stroke={isDark ? '#60a5fa' : '#2563eb'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    </svg>
                  </div>
                  <h1 className={`text-3xl font-bold tracking-tight ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {editId ? 'Edit Clearance' : 'Issue Clearance'}
                  </h1>
                </div>
                <p className={`mt-1 text-sm ${
                  isDark ? 'text-slate-400' : 'text-gray-600'
                }`}>
                  Generate professional Certificate of Clearance documents with live preview
                </p>
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/clearances')}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg transition-all duration-200 ${
                isDark 
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white shadow-lg shadow-slate-900/25' 
                  : 'bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 shadow-lg shadow-gray-900/10'
              }`}
            >
              <i className="fas fa-history mr-2"></i>
              View History
            </motion.button>
          </div>
        </motion.div>

        {/* Fixed Toast Notification - visible from any scroll position */}
        <AnimatePresence>
          {submitStatus && (
            <motion.div
              initial={{ opacity: 0, y: -40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -40, scale: 0.95 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] w-[92%] max-w-lg"
            >
              <div className={`rounded-xl p-4 shadow-2xl backdrop-blur-sm ${
                submitStatus.type === 'success'
                  ? isDark 
                    ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/30 shadow-emerald-500/20' 
                    : 'bg-white text-emerald-800 border border-emerald-200 shadow-emerald-500/10'
                  : isDark 
                    ? 'bg-red-950/90 text-red-300 border border-red-500/30 shadow-red-500/20' 
                    : 'bg-white text-red-800 border border-red-200 shadow-red-500/10'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
                    submitStatus.type === 'success'
                      ? isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'
                      : isDark ? 'bg-red-500/20' : 'bg-red-100'
                  }`}>
                    {submitStatus.type === 'success' ? (
                      <i className="fas fa-check-circle text-emerald-500 text-lg"></i>
                    ) : (
                      <i className="fas fa-exclamation-circle text-red-500 text-lg"></i>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm ${
                      submitStatus.type === 'success'
                        ? isDark ? 'text-emerald-300' : 'text-emerald-800'
                        : isDark ? 'text-red-300' : 'text-red-800'
                    }`}>
                      {submitStatus.type === 'success' ? 'Success' : 'Missing Required Fields'}
                    </p>
                    <p className={`text-sm mt-0.5 ${
                      submitStatus.type === 'success'
                        ? isDark ? 'text-emerald-400' : 'text-emerald-600'
                        : isDark ? 'text-red-400' : 'text-red-600'
                    }`}>
                      {submitStatus.message}
                    </p>
                  </div>
                  <button
                    onClick={() => setSubmitStatus(null)}
                    className={`flex-shrink-0 p-1 rounded-md transition-colors bg-transparent border-none cursor-pointer ${
                      isDark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Respondent Navigation Tabs (shown when multiple respondents) */}
        {respondentForms.length > 1 && (
          <div className={`mb-4 p-4 rounded-2xl border ${
            isDark 
              ? 'bg-slate-800/70 border-slate-700/60' 
              : 'bg-white/80 border-slate-200/60 shadow-lg'
          }`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isDark ? 'bg-amber-900/50' : 'bg-amber-100'
              }`}>
                <i className="fas fa-users text-amber-500 text-sm"></i>
              </div>
              <div>
                <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {respondentForms.length} Respondents Found
                </p>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Click on a respondent tab to view/edit their certificate
                </p>
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {respondentForms.map((rf, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => switchRespondent(idx)}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 border-2 ${
                    idx === activeRespondentIndex
                      ? isDark
                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/30'
                        : 'bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-500/30'
                      : isDark
                        ? 'bg-slate-700 border-slate-600 text-slate-300 hover:border-blue-500/50 hover:text-white'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600'
                  }`}
                >
                  <i className="fas fa-user mr-1.5 text-xs"></i>
                  {rf.first_name || rf.last_name ? `${rf.first_name} ${rf.last_name}`.trim() : `Respondent ${idx + 1}`}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
          {/* Left Column - Certificate Preview */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="xl:col-span-3"
          >
            <div className={`rounded-2xl overflow-hidden backdrop-blur-sm ${
              isDark 
                ? 'bg-slate-800/70 border border-slate-700/60 shadow-2xl shadow-slate-900/25' 
                : 'bg-white/80 border border-slate-200/60 shadow-2xl shadow-gray-900/10'
            }`}>
              <div className={`px-8 py-6 border-b ${
                isDark 
                  ? 'border-slate-700/60 bg-gradient-to-r from-slate-800/80 to-slate-700/80' 
                  : 'border-slate-100/60 bg-gradient-to-r from-slate-50/80 to-white/80'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${
                      isDark ? 'bg-emerald-900/50' : 'bg-emerald-100'
                    }`}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="5" y="3" width="12" height="18" rx="1" stroke={isDark ? '#4ade80' : '#16a34a'} strokeWidth="1.5" fill="none"/>
                        <rect x="8" y="1.5" width="6" height="2" rx="0.5" fill={isDark ? '#4ade80' : '#16a34a'}/>
                        <line x1="7" y1="7" x2="16" y2="7" stroke={isDark ? '#4ade80' : '#16a34a'} strokeWidth="1" opacity="0.5"/>
                        <line x1="7" y1="10" x2="16" y2="10" stroke={isDark ? '#4ade80' : '#16a34a'} strokeWidth="1" opacity="0.5"/>
                        <line x1="7" y1="13" x2="13" y2="13" stroke={isDark ? '#4ade80' : '#16a34a'} strokeWidth="1" opacity="0.5"/>
                        <circle cx="16" cy="16" r="3.5" fill={isDark ? '#4ade80' : '#16a34a'} opacity="0.1"/>
                        <path d="M14.5 16L15.5 17L17.5 15" stroke={isDark ? '#4ade80' : '#16a34a'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className={`text-xl font-bold ${
                          isDark ? 'text-white' : 'text-slate-900'
                        }`}>
                          Certificate Preview
                        </h2>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          isDark ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-100 text-purple-700'
                        }`}>
                          Format {formData.format_type}
                        </span>
                      </div>
                      <p className={`text-sm ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        {FORMAT_OPTIONS.find(f => f.value === formData.format_type)?.description || 'Real-time preview of your certificate'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Color Dropdown Button */}
                    <div className="relative">
                      <motion.button
                        type="button"
                        onClick={() => setShowColorDropdown(!showColorDropdown)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`inline-flex items-center justify-center w-10 h-10 rounded-lg border-2 transition-all duration-200 ${
                          isDark 
                            ? 'bg-slate-700 border-slate-600 hover:border-purple-500 text-slate-300 hover:text-purple-300' 
                            : 'bg-white border-slate-200 hover:border-purple-500 text-slate-600 hover:text-purple-600'
                        }`}
                        title="Change text color"
                      >
                        <i className="fas fa-palette text-sm"></i>
                      </motion.button>
                      
                      <AnimatePresence>
                        {showColorDropdown && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className={`absolute -right-8 top-12 z-50 w-48 rounded-lg shadow-xl border overflow-hidden ${
                              isDark 
                                ? 'bg-slate-800 border-slate-700' 
                                : 'bg-white border-slate-200'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => { setTextColor('navy'); setShowColorDropdown(false); }}
                              className={`w-full px-4 py-3 text-left text-sm font-medium flex items-center gap-3 transition-colors whitespace-nowrap ${
                                textColor === 'navy'
                                  ? isDark ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-50 text-blue-700'
                                  : isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <span className="w-4 h-4 rounded-full bg-[#000080] border border-slate-300 flex-shrink-0"></span>
                              <span className="flex-1">Navy Blue</span>
                              {textColor === 'navy' && <i className="fas fa-check text-xs flex-shrink-0"></i>}
                            </button>
                            <button
                              type="button"
                              onClick={() => { setTextColor('black'); setShowColorDropdown(false); }}
                              className={`w-full px-4 py-3 text-left text-sm font-medium flex items-center gap-3 transition-colors whitespace-nowrap ${
                                textColor === 'black'
                                  ? isDark ? 'bg-slate-600 text-white' : 'bg-slate-100 text-slate-900'
                                  : isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <span className="w-4 h-4 rounded-full bg-black border border-slate-300 flex-shrink-0"></span>
                              <span className="flex-1">Black</span>
                              {textColor === 'black' && <i className="fas fa-check text-xs flex-shrink-0"></i>}
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <motion.button
                      type="button"
                      onClick={handlePrint}
                      disabled={!formData.first_name || !formData.last_name}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-xs font-semibold rounded-lg text-white bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 hover:from-green-600 hover:via-emerald-600 hover:to-teal-700 shadow-lg shadow-green-500/40 hover:shadow-xl hover:shadow-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 whitespace-nowrap"
                    >
                      <i className="fas fa-print mr-1.5"></i>
                      Print
                    </motion.button>

                    {respondentForms.length > 1 && (
                      <motion.button
                        type="button"
                        onClick={handlePrintAll}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-xs font-semibold rounded-lg text-white bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:via-orange-600 hover:to-amber-700 shadow-lg shadow-amber-500/40 hover:shadow-xl hover:shadow-amber-500/50 transition-all duration-200 whitespace-nowrap"
                      >
                        <i className="fas fa-print mr-1.5"></i>
                        Print All ({respondentForms.length})
                      </motion.button>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 overflow-visible" style={{ maxHeight: 'none', overflowX: 'hidden' }}>
                {/* Certificate Preview */}
                <div 
                  id="certificate-preview"
                  className="bg-white text-black rounded-lg shadow-lg mx-auto"
                  style={{ 
                    fontFamily: '"Century Gothic", Arial, sans-serif', 
                    fontSize: '14pt', 
                    lineHeight: '1.2',
                    width: '6.0in',
                    padding: '0.25in 0.2in 0.25in 0.2in',
                    margin: '0 auto',
                    boxSizing: 'border-box',
                    color: '#000000',
                    background: 'white'
                  }}
                >
                  {/* Use Complete Template with Full Header and Footer */}
                  <ClearancePreview 
                    data={formData} 
                    isDark={isDark} 
                    showFullTemplate={true}
                    generatedOR={generatedOR}
                    textColor={textColor}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column - Certificate Details Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="xl:col-span-2"
          >
            <div className={`rounded-2xl overflow-visible sticky top-6 backdrop-blur-sm ${
              isDark 
                ? 'bg-slate-800/70 border border-slate-700/60 shadow-2xl shadow-slate-900/25' 
                : 'bg-white/80 border border-slate-200/60 shadow-2xl shadow-gray-900/10'
            }`}>
              <div className={`px-4 py-3 border-b ${
                isDark 
                  ? 'border-slate-700/60 bg-gradient-to-r from-slate-800/80 to-slate-700/80' 
                  : 'border-slate-100/60 bg-gradient-to-r from-blue-50/80 to-white/80'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className={`inline-flex items-center justify-center w-6 h-6 rounded-lg ${
                      isDark ? 'bg-blue-900/50' : 'bg-blue-100'
                    }`}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="5" y="3" width="12" height="18" rx="1" stroke={isDark ? '#60a5fa' : '#2563eb'} strokeWidth="1.5" fill="none"/>
                        <rect x="8" y="1.5" width="6" height="2" rx="0.5" fill={isDark ? '#60a5fa' : '#2563eb'}/>
                        <line x1="7" y1="7" x2="16" y2="7" stroke={isDark ? '#60a5fa' : '#2563eb'} strokeWidth="1" opacity="0.5"/>
                        <line x1="7" y1="10" x2="16" y2="10" stroke={isDark ? '#60a5fa' : '#2563eb'} strokeWidth="1" opacity="0.5"/>
                        <line x1="7" y1="13" x2="13" y2="13" stroke={isDark ? '#60a5fa' : '#2563eb'} strokeWidth="1" opacity="0.5"/>
                        <circle cx="16" cy="16" r="3.5" fill={isDark ? '#60a5fa' : '#2563eb'} opacity="0.1"/>
                        <path d="M14.5 16L15.5 17L17.5 15" stroke={isDark ? '#60a5fa' : '#2563eb'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                      </svg>
                    </div>
                    <div>
                      <h2 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Certificate Details
                      </h2>
                      <p className={`text-xs leading-tight ${isDark ? 'text-slate-400' : 'text-blue-600'}`}>
                        Fill in the required information
                      </p>
                    </div>
                  </div>
                  <motion.button
                    type="button"
                    onClick={handleClearForm}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-semibold rounded-lg transition-all duration-200 whitespace-nowrap ${
                      isDark 
                        ? 'bg-red-950/40 hover:bg-red-900/50 text-red-300 hover:text-red-200 border border-red-800/30 shadow-lg shadow-red-900/10' 
                        : 'bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 border border-red-200 shadow-lg shadow-red-900/5'
                    }`}
                  >
                    <i className="fas fa-redo-alt mr-1.5"></i>
                    Reset Form
                  </motion.button>
                </div>
              </div>

              {/* Form Container */}
              <div className="p-3 overflow-y-auto overflow-x-hidden" style={{ maxHeight: 'calc(100vh - 220px)', wordWrap: 'break-word' }}>
                <form key={formKey} onSubmit={handleSubmit} className="space-y-3">
                  
                  {/* Format Selection Section */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      {FORMAT_OPTIONS.map((format) => (
                        <button
                          key={format.value}
                          type="button"
                          onClick={() => setFormData((prev: FormData) => ({ ...prev, format_type: format.value }))}
                          className={`p-2.5 rounded-xl border-2 text-left transition-all duration-200 ${
                            formData.format_type === format.value
                              ? isDark
                                ? 'border-purple-500 bg-purple-900/30 shadow-lg shadow-purple-500/20'
                                : 'border-purple-500 bg-purple-50 shadow-lg shadow-purple-500/20'
                              : isDark
                                ? 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`text-sm font-bold ${
                              formData.format_type === format.value
                                ? isDark ? 'text-purple-300' : 'text-purple-700'
                                : isDark ? 'text-white' : 'text-slate-900'
                            }`}>
                              {format.label}
                            </span>
                            {formData.format_type === format.value && (
                              <i className={`fas fa-check-circle text-xs ${isDark ? 'text-purple-400' : 'text-purple-500'}`}></i>
                            )}
                          </div>
                          <p className={`text-[10px] mt-0.5 leading-tight ${
                            formData.format_type === format.value
                              ? isDark ? 'text-purple-400' : 'text-purple-600'
                              : isDark ? 'text-slate-400' : 'text-slate-500'
                          }`}>
                            {format.description}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Step 1: Applicant Information */}
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className={`flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${
                        isDark ? 'bg-blue-500 text-white' : 'bg-blue-500 text-white'
                      }`}>
                        1
                      </div>
                      <div>
                        <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          Applicant Information
                        </h3>
                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          Enter applicant details
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5">
                      <div className="space-y-1.5">
                        <label className={`flex items-center space-x-2 text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          <i className="fas fa-user text-xs"></i>
                          <span>First Name *</span>
                        </label>
                        <input
                          type="text"
                          name="first_name"
                          value={formData.first_name}
                          onChange={handleInputChange}
                          onKeyDown={handleKeyDown}
                          className={`${inputClasses} ${errors.first_name ? 'border-red-500 focus:border-red-500' : ''}`}
                          placeholder="Enter first name"
                        />
                        {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>}
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className={`flex items-center space-x-2 text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          <i className="fas fa-user text-xs"></i>
                          <span>Last Name *</span>
                        </label>
                        <input
                          type="text"
                          name="last_name"
                          value={formData.last_name}
                          onChange={handleInputChange}
                          onKeyDown={handleKeyDown}
                          className={`${inputClasses} ${errors.last_name ? 'border-red-500 focus:border-red-500' : ''}`}
                          placeholder="Enter last name"
                        />
                        {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>}
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className={`flex items-center space-x-2 text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          <i className="fas fa-user text-xs"></i>
                          <span>Middle Name</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-2 rounded-lg border text-xs font-semibold ${isDark ? 'bg-slate-700/60 border-slate-600 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                            y
                          </span>
                          <div className="relative flex-1">
                            <input
                              type="text"
                              name="middle_name"
                              value={formData.middle_name}
                              onChange={handleInputChange}
                              onKeyDown={handleKeyDown}
                              className={`${inputClasses} pr-10`}
                              placeholder="Enter middle name"
                            />
                            <button
                              type="button"
                              title="Open middle name options"
                              onClick={() => setShowMiddleNameDropdown(!showMiddleNameDropdown)}
                              className={`absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded border text-xs transition-colors ${isDark ? 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'}`}
                            >
                              <i className="fas fa-chevron-down text-xs"></i>
                            </button>
                            {showMiddleNameDropdown && (
                              <div className={`absolute right-0 mt-1 w-44 rounded-lg border shadow-lg z-50 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData((prev: FormData) => ({ ...prev, middle_name: '' }));
                                    setShowMiddleNameDropdown(false);
                                  }}
                                  className={`w-full text-left px-3 py-2 text-xs hover:rounded-lg transition-colors ${isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-100'}`}
                                >
                                  No middle name
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className={`flex items-center space-x-2 text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          <i className="fas fa-id-card text-xs"></i>
                          <span>Suffix</span>
                        </label>
                        <input
                          type="text"
                          name="suffix"
                          value={formData.suffix}
                          onChange={handleInputChange}
                          onKeyDown={handleKeyDown}
                          className={inputClasses}
                          placeholder="Jr., Sr., III, etc."
                        />
                      </div>

                      {/* Sex - Show for formats B, C, E, F */}
                      {FORMAT_FIELDS[formData.format_type]?.includes('sex') && (
                        <div className="space-y-1.5">
                          <label className={`flex items-center space-x-2 text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            <i className="fas fa-venus-mars text-xs"></i>
                            <span>Sex *</span>
                          </label>
                          <select
                            name="sex"
                            value={formData.sex}
                            onChange={handleInputChange}
                            className={inputClasses}
                          >
                            {SEX_OPTIONS.map((sex: string) => (
                              <option key={sex} value={sex}>{sex}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      
                      <div className="space-y-1.5">
                        <label className={`flex items-center space-x-2 text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          <i className="fas fa-calendar-alt text-xs"></i>
                          <span>Age *</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            name="age"
                            value={formData.age}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            inputMode="numeric"
                            className={`${inputClasses} pr-12 ${errors.age ? 'border-red-500 focus:border-red-500' : ''}`}
                            placeholder="Enter age or choose option"
                          />
                          <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <button
                              type="button"
                              title="Open legal age option"
                              onClick={() => setShowAgeDropdown(!showAgeDropdown)}
                              className={`px-2 py-1 rounded border text-xs transition-colors ${isDark ? 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'}`}
                            >
                              <i className="fas fa-chevron-down text-xs"></i>
                            </button>
                            {showAgeDropdown && (
                              <div className={`absolute right-0 mt-1 w-40 rounded-lg border shadow-lg z-50 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextMiddleName = String(formData.middle_name || '').trim().toLowerCase() === 'of legal age'
                                      ? ''
                                      : formData.middle_name;
                                    setFormData({ ...formData, age: 'of legal age', middle_name: nextMiddleName });
                                    setShowAgeDropdown(false);
                                  }}
                                  className={`w-full text-left px-3 py-2 text-xs hover:rounded-lg transition-colors ${isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-100'}`}
                                >
                                  of legal age
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        {errors.age && <p className="text-red-500 text-xs mt-1">{errors.age}</p>}
                      </div>

                      {/* Birth Date - Show for formats B, C, E, F */}
                      {FORMAT_FIELDS[formData.format_type]?.includes('birth_date') && (
                        <div className="space-y-1.5">
                          <label className={`flex items-center space-x-2 text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            <i className="fas fa-birthday-cake text-xs"></i>
                            <span>Date of Birth *</span>
                          </label>
                          <input
                            type="date"
                            name="birth_date"
                            value={formData.birth_date}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            className={inputClasses}
                          />
                        </div>
                      )}

                      {/* Birth Place - Show for formats B, C, E, F */}
                      {FORMAT_FIELDS[formData.format_type]?.includes('birth_place') && (
                        <div className="space-y-1.5">
                          <label className={`flex items-center space-x-2 text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            <i className="fas fa-map-marker-alt text-xs"></i>
                            <span>Place of Birth *</span>
                          </label>
                          <input
                            type="text"
                            name="birth_place"
                            value={formData.birth_place}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            className={inputClasses}
                            placeholder="Enter place of birth"
                          />
                        </div>
                      )}
                      
                      <div className="space-y-1.5">
                        <label className={`flex items-center space-x-2 text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          <i className="fas fa-user text-xs"></i>
                          <span>Civil Status *</span>
                        </label>
                        <select
                          name="civil_status"
                          value={formData.civil_status === 'Custom' || (!CIVIL_STATUS_OPTIONS.slice(0, -1).includes(formData.civil_status) && formData.civil_status) ? 'Custom' : formData.civil_status}
                          onChange={handleInputChange}
                          className={`${inputClasses} ${errors.civil_status ? 'border-red-500 focus:border-red-500' : ''}`}
                        >
                          <option value="">Select civil status</option>
                          {CIVIL_STATUS_OPTIONS.map((status: string) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                        
                        {/* Custom Civil Status Input */}
                        {(formData.civil_status === 'Custom' || (!CIVIL_STATUS_OPTIONS.slice(0, -1).includes(formData.civil_status) && formData.civil_status && formData.civil_status !== '')) && (
                          <input
                            type="text"
                            value={formData.civil_status === 'Custom' ? '' : formData.civil_status}
                            onChange={(e) => setFormData({ ...formData, civil_status: e.target.value })}
                            onKeyDown={handleKeyDown}
                            className={inputClasses}
                            placeholder="Enter custom civil status"
                            autoFocus
                          />
                        )}
                        
                        {errors.civil_status && <p className="text-red-500 text-xs mt-1">{errors.civil_status}</p>}
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className={`flex items-center space-x-2 text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          <i className="fas fa-globe text-xs"></i>
                          <span>Nationality *</span>
                        </label>
                        <input
                          type="text"
                          name="nationality"
                          value={formData.nationality}
                          onChange={handleInputChange}
                          onKeyDown={handleKeyDown}
                          className={`${inputClasses} ${errors.nationality ? 'border-red-500 focus:border-red-500' : ''}`}
                          placeholder="Enter nationality"
                        />
                        {errors.nationality && <p className="text-red-500 text-xs mt-1">{errors.nationality}</p>}
                      </div>

                      {/* Height - Show for formats C, F */}
                      {FORMAT_FIELDS[formData.format_type]?.includes('height') && (
                        <div className="space-y-1.5">
                          <label className={`flex items-center space-x-2 text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            <i className="fas fa-ruler-vertical text-xs"></i>
                            <span>Height</span>
                          </label>
                          <input
                            type="text"
                            name="height"
                            value={formData.height}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            className={inputClasses}
                            placeholder="e.g., 5'6&quot; or 168 cm"
                          />
                        </div>
                      )}

                      {/* Weight - Show for formats C, F */}
                      {FORMAT_FIELDS[formData.format_type]?.includes('weight') && (
                        <div className="space-y-1.5">
                          <label className={`flex items-center space-x-2 text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            <i className="fas fa-weight text-xs"></i>
                            <span>Weight</span>
                          </label>
                          <input
                            type="text"
                            name="weight"
                            value={formData.weight}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            className={inputClasses}
                            placeholder="e.g., 65 kg or 143 lbs"
                          />
                        </div>
                      )}

                      {/* Blood Type - Show for format F */}
                      {FORMAT_FIELDS[formData.format_type]?.includes('blood_type') && (
                        <div className="space-y-1.5">
                          <label className={`flex items-center space-x-2 text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            <i className="fas fa-tint text-xs"></i>
                            <span>Blood Type</span>
                          </label>
                          <select
                            name="blood_type"
                            value={formData.blood_type}
                            onChange={handleInputChange}
                            className={inputClasses}
                          >
                            <option value="">Select blood type</option>
                            {BLOOD_TYPE_OPTIONS.map((type: string) => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Distinguishing Marks - Show for formats C, F */}
                      {FORMAT_FIELDS[formData.format_type]?.includes('distinguishing_marks') && (
                        <div className="space-y-1.5">
                          <label className={`flex items-center space-x-2 text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            <i className="fas fa-fingerprint text-xs"></i>
                            <span>Distinguishing Marks</span>
                          </label>
                          <input
                            type="text"
                            name="distinguishing_marks"
                            value={formData.distinguishing_marks}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            className={inputClasses}
                            placeholder="e.g., Mole on left cheek, scar on arm"
                          />
                        </div>
                      )}
                      
                      <div className="space-y-1.5">
                        <label className={`flex items-center space-x-2 text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          <i className="fas fa-building text-xs"></i>
                          <span>Complete Address *</span>
                        </label>
                        <textarea
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          onKeyDown={handleKeyDown}
                          rows={2}
                          className={`${inputClasses} ${errors.address ? 'border-red-500 focus:border-red-500' : ''}`}
                          placeholder="Enter complete address"
                        />
                        {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                      </div>
                    </div>
                  </div>

                  {/* ID Information Section - Show for formats E, F */}
                  {(FORMAT_FIELDS[formData.format_type]?.includes('id_presented') || FORMAT_FIELDS[formData.format_type]?.includes('ctc_number')) && (
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className={`flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${
                          isDark ? 'bg-indigo-500 text-white' : 'bg-indigo-500 text-white'
                        }`}>
                          <i className="fas fa-id-card text-[8px]"></i>
                        </div>
                        <div>
                          <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            ID Information
                          </h3>
                          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            Identification details
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-2.5">
                        {FORMAT_FIELDS[formData.format_type]?.includes('id_presented') && (
                          <>
                            <div className="space-y-1.5">
                              <label className={`flex items-center space-x-2 text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                <i className="fas fa-id-badge text-xs"></i>
                                <span>ID Presented</span>
                              </label>
                              <input
                                type="text"
                                name="id_presented"
                                value={formData.id_presented}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                className={inputClasses}
                                placeholder="e.g., Passport, Driver's License, PhilSys ID"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className={`flex items-center space-x-2 text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                <i className="fas fa-hashtag text-xs"></i>
                                <span>ID Number</span>
                              </label>
                              <input
                                type="text"
                                name="id_number"
                                value={formData.id_number}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                className={inputClasses}
                                placeholder="Enter ID number"
                              />
                            </div>
                          </>
                        )}

                        {FORMAT_FIELDS[formData.format_type]?.includes('ctc_number') && (
                          <>
                            <div className="space-y-1.5">
                              <label className={`flex items-center space-x-2 text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                <i className="fas fa-file-invoice text-xs"></i>
                                <span>CTC Number</span>
                              </label>
                              <input
                                type="text"
                                name="ctc_number"
                                value={formData.ctc_number}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                className={inputClasses}
                                placeholder="Enter CTC number"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className={`flex items-center space-x-2 text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                <i className="fas fa-map-pin text-xs"></i>
                                <span>CTC Issued At</span>
                              </label>
                              <input
                                type="text"
                                name="ctc_issued_at"
                                value={formData.ctc_issued_at}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                className={inputClasses}
                                placeholder="e.g., Tagbilaran City"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className={`flex items-center space-x-2 text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                <i className="fas fa-calendar text-xs"></i>
                                <span>CTC Issued On</span>
                              </label>
                              <input
                                type="date"
                                name="ctc_issued_on"
                                value={formData.ctc_issued_on}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                className={inputClasses}
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Step 2: Clearance Details - Moved after Criminal Cases for Format B */}
                  {formData.format_type !== 'B' && formData.format_type !== 'D' && formData.format_type !== 'E' && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className={`flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${
                        isDark ? 'bg-blue-500 text-white' : 'bg-blue-500 text-white'
                      }`}>
                        2
                      </div>
                      <div>
                        <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          Clearance Details
                        </h3>
                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          Purpose and clearance information
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2.5">
                      {formData.format_type !== 'E' && formData.format_type !== 'F' && (
                      <div className="space-y-1.5">
                        <label className={labelClasses}>Issued Upon Request By</label>
                        <input
                          type="text"
                          name="issued_upon_request_by"
                          value={formData.issued_upon_request_by}
                          onChange={handleInputChange}
                          onKeyDown={handleKeyDown}
                          className={inputClasses}
                          placeholder="Name of requester (if different from applicant)"
                        />
                      </div>
                      )}

                      {formData.format_type !== 'F' && (
                      <>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className={labelClasses}>Purpose *</label>
                          <motion.button
                            type="button"
                            onClick={() => setShowAddPurposeModal(true)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            title="Add new purpose"
                            className={`inline-flex items-center justify-center w-7 h-7 rounded-lg border transition-all duration-200 ${
                              isDark
                                ? 'bg-blue-900/40 border-blue-700 hover:bg-blue-900/60 text-blue-300 hover:text-blue-200'
                                : 'bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-600 hover:text-blue-700'
                            }`}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </motion.button>
                        </div>
                        {/* Custom Purpose Dropdown with Remove Icons */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setShowPurposeDropdown(!showPurposeDropdown)}
                            className={`w-full px-3 py-2 text-left rounded-lg border transition-all duration-200 flex items-center justify-between ${
                              errors.purpose
                                ? isDark ? 'border-red-500 bg-red-900/20' : 'border-red-500 bg-red-50'
                                : isDark ? 'border-slate-600 bg-slate-700 hover:bg-slate-650' : 'border-slate-300 bg-white hover:bg-slate-50'
                            }`}
                          >
                            <span className={isDark ? 'text-slate-200' : 'text-slate-900'}>
                              {formData.purpose || 'Select a purpose'}
                            </span>
                            <svg className={`w-4 h-4 transition-transform ${showPurposeDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                          </button>
                          
                          {showPurposeDropdown && (
                            <div className={`absolute top-full left-0 right-0 mt-1 rounded-lg border z-50 shadow-lg ${
                              isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-300'
                            }`}>
                              <div className="max-h-64 overflow-y-auto">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData(prev => ({ ...prev, purpose: '', purpose_fee: 0 }));
                                    setShowPurposeDropdown(false);
                                  }}
                                  className={`w-full text-left px-3 py-2 hover:bg-opacity-70 ${
                                    isDark ? 'hover:bg-slate-600' : 'hover:bg-slate-100'
                                  }`}
                                >
                                  <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Select a purpose</span>
                                </button>
                                
                                {/* Active Purposes */}
                                {activeBuiltInPurposes.map((opt) => (
                                  <div
                                    key={opt.name}
                                    className={`flex items-center justify-between px-3 py-2 hover:bg-opacity-70 ${
                                      formData.purpose === opt.name
                                        ? isDark ? 'bg-blue-900/40' : 'bg-blue-50'
                                        : isDark ? 'hover:bg-slate-600' : 'hover:bg-slate-100'
                                    }`}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setFormData(prev => ({ ...prev, purpose: opt.name, purpose_fee: opt.fee }));
                                        setShowPurposeDropdown(false);
                                      }}
                                      className="flex-1 text-left"
                                    >
                                      <span className={isDark ? 'text-slate-200' : 'text-slate-900'}>
                                        {opt.name}
                                      </span>
                                    </button>
                                    
                                    {opt.name !== 'Other' && (
                                      <motion.button
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          handleRemovePurpose(opt.name);
                                        }}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        className={`ml-2 p-1.5 rounded transition-all ${
                                          isDark
                                            ? 'hover:bg-red-900/40 text-red-400 hover:text-red-300'
                                            : 'hover:bg-red-100 text-red-600 hover:text-red-700'
                                        }`}
                                        title="Remove this purpose"
                                      >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                          <line x1="5" y1="12" x2="19" y2="12" />
                                        </svg>
                                      </motion.button>
                                    )}
                                  </div>
                                ))}
                                
                                {/* Custom Purposes */}
                                {customPurposes.filter(p => !deletedPurposes.has(normalizePurposeKey(p.name))).map((opt) => (
                                  <div
                                    key={opt.name}
                                    className={`flex items-center justify-between px-3 py-2 hover:bg-opacity-70 ${
                                      formData.purpose === opt.name
                                        ? isDark ? 'bg-blue-900/40' : 'bg-blue-50'
                                        : isDark ? 'hover:bg-slate-600' : 'hover:bg-slate-100'
                                    }`}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setFormData(prev => ({ ...prev, purpose: opt.name, purpose_fee: opt.fee }));
                                        setShowPurposeDropdown(false);
                                      }}
                                      className="flex-1 text-left"
                                    >
                                      <span className={isDark ? 'text-slate-200' : 'text-slate-900'}>
                                        {opt.name}
                                      </span>
                                    </button>
                                    
                                    <motion.button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleRemovePurpose(opt.name);
                                      }}
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.95 }}
                                      className={`ml-2 p-1.5 rounded transition-all ${
                                        isDark
                                          ? 'hover:bg-red-900/40 text-red-400 hover:text-red-300'
                                          : 'hover:bg-red-100 text-red-600 hover:text-red-700'
                                      }`}
                                      title="Remove this purpose"
                                    >
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                      </svg>
                                    </motion.button>
                                  </div>
                                ))}

                                {/* Other stays last */}
                                {otherPurpose && !deletedPurposes.has(normalizePurposeKey(otherPurpose.name)) && (
                                  <div
                                    key={otherPurpose.name}
                                    className={`flex items-center justify-between px-3 py-2 hover:bg-opacity-70 ${
                                      formData.purpose === otherPurpose.name
                                        ? isDark ? 'bg-blue-900/40' : 'bg-blue-50'
                                        : isDark ? 'hover:bg-slate-600' : 'hover:bg-slate-100'
                                    }`}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setFormData(prev => ({ ...prev, purpose: otherPurpose.name, purpose_fee: otherPurpose.fee }));
                                        setShowPurposeDropdown(false);
                                      }}
                                      className="flex-1 text-left"
                                    >
                                      <span className={isDark ? 'text-slate-200' : 'text-slate-900'}>
                                        {otherPurpose.name}
                                      </span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        {errors.purpose && <p className="text-red-500 text-xs mt-1">{errors.purpose}</p>}
                      </div>
                      
                      {formData.purpose === 'Other' && (
                        <div className="space-y-1.5">
                          <label className={labelClasses}>Specify Purpose *</label>
                          <input
                            type="text"
                            name="custom_purpose"
                            value={formData.custom_purpose}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            className={`${inputClasses} ${errors.custom_purpose ? 'border-red-500' : ''}`}
                            placeholder="Enter specific purpose"
                          />
                          {errors.custom_purpose && <p className="text-red-500 text-xs mt-1">{errors.custom_purpose}</p>}
                        </div>
                      )}
                      </>
                      )}
                    </div>
                  </div>
                  )}

                  {/* Step 3: Criminal Record Toggle (for formats that don't have direct criminal case inputs) */}
                  {formData.format_type !== 'A' && formData.format_type !== 'B' && formData.format_type !== 'C' && formData.format_type !== 'D' && formData.format_type !== 'E' && formData.format_type !== 'F' && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className={`flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${
                        isDark ? 'bg-blue-500 text-white' : 'bg-blue-500 text-white'
                      }`}>
                        3
                      </div>
                      <div>
                        <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          Criminal Record Status
                        </h3>
                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          Does this person have a criminal record?
                        </p>
                      </div>
                    </div>
                    
                    {/* Toggle for Criminal Record */}
                    <div className={`p-3 rounded-xl border-2 ${
                      isDark ? 'bg-slate-700/30 border-slate-600' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          Has Criminal Record
                        </span>
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={hasCriminalRecord}
                            onChange={(e) => setHasCriminalRecord(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className={`w-11 h-6 rounded-full peer transition-colors ${
                            hasCriminalRecord 
                              ? 'bg-red-500' 
                              : isDark ? 'bg-slate-600' : 'bg-slate-300'
                          }`}></div>
                          <div className={`absolute left-[2px] top-[2px] w-5 h-5 bg-white rounded-full transition-transform ${
                            hasCriminalRecord ? 'translate-x-5' : ''
                          }`}></div>
                        </div>
                      </label>
                    </div>

                    {/* Criminal Cases Section (Conditional) */}
                    {(hasCriminalRecord || formData.format_type === 'B' || formData.format_type === 'D') && (
                      <div className="space-y-3 mt-3">
                        <div className={`p-2 rounded-lg ${isDark ? 'bg-red-900/20 border border-red-500/30' : 'bg-red-50 border border-red-200'}`}>
                          <p className={`text-xs font-medium ${isDark ? 'text-red-300' : 'text-red-700'}`}>
                            <i className="fas fa-exclamation-triangle mr-1"></i>
                            Criminal record information will appear on the certificate
                          </p>
                        </div>
                        
                        {(formData.criminal_cases || []).map((crimCase: CriminalCase, index: number) => (
                          <div key={index} className={`p-3 rounded-xl border-2 ${
                            isDark ? 'bg-slate-700/50 border-red-500/30' : 'bg-red-50/50 border-red-200'
                          }`}>
                            <div className="flex items-center justify-between mb-2">
                              <h4 className={`font-semibold text-xs ${isDark ? 'text-red-300' : 'text-red-700'}`}>
                                <i className="fas fa-folder-open mr-1"></i>
                                Case #{index + 1}
                              </h4>
                              {(formData.criminal_cases?.length || 0) > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeCriminalCase(index)}
                                  className={`text-xs px-2 py-1 rounded-lg transition-colors ${
                                    isDark ? 'text-red-400 hover:bg-red-900/30' : 'text-red-600 hover:bg-red-100'
                                  }`}
                                >
                                  <i className="fas fa-trash-alt mr-1"></i>
                                  Remove
                                </button>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 gap-2">
                              {/* Case Number with Dropdown */}
                              <div className="flex gap-3">
                                <select
                                  value={crimCase.case_number_type || 'Criminal Case No.'}
                                  onChange={(e) => updateCriminalCase(index, 'case_number_type', e.target.value)}
                                  className={`${inputClasses} w-44 cursor-pointer`}
                                >
                                  <option value="Criminal Case No.">Criminal Case No.</option>
                                  <option value="NPS Docket No.">NPS Docket No.</option>
                                </select>
                                <input
                                  type="text"
                                  value={crimCase.case_number}
                                  onChange={(e) => updateCriminalCase(index, 'case_number', e.target.value)}
                                  className={`${inputClasses} flex-1`}
                                  placeholder=""
                                />
                              </div>
                              <input
                                type="text"
                                value={crimCase.crime}
                                onChange={(e) => updateCriminalCase(index, 'crime', e.target.value)}
                                className={inputClasses}
                                placeholder="Crime"
                              />
                              {/* Date with Dropdown */}
                              <div className="flex gap-3">
                                <select
                                  value={crimCase.date_type || 'Date Info Filed'}
                                  onChange={(e) => updateCriminalCase(index, 'date_type', e.target.value)}
                                  className={`${inputClasses} w-44 cursor-pointer`}
                                >
                                  <option value="Date Info Filed">Date Info Filed</option>
                                  <option value="Date Filed">Date Filed</option>
                                </select>
                                <input
                                  type="date"
                                  value={crimCase.date_info_filed}
                                  onChange={(e) => updateCriminalCase(index, 'date_info_filed', e.target.value)}
                                  className={`${inputClasses} flex-1`}
                                />
                              </div>
                              <input
                                type="text"
                                value={crimCase.origin}
                                onChange={(e) => updateCriminalCase(index, 'origin', e.target.value)}
                                className={inputClasses}
                                placeholder="Origin"
                              />
                              <input
                                type="text"
                                value={crimCase.status}
                                onChange={(e) => updateCriminalCase(index, 'status', e.target.value)}
                                className={inputClasses}
                                placeholder="Status"
                              />
                            </div>
                          </div>
                        ))}
                        
                        <button
                          type="button"
                          onClick={addCriminalCase}
                          className={`w-full py-2 rounded-xl border-2 border-dashed transition-all flex items-center justify-center gap-2 ${
                            isDark 
                              ? 'border-red-500/50 text-red-400 hover:bg-red-900/20' 
                              : 'border-red-300 text-red-600 hover:bg-red-50'
                          }`}
                        >
                          <i className="fas fa-plus-circle"></i>
                          <span className="font-medium text-xs">Add Another Case</span>
                        </button>
                      </div>
                    )}
                  </div>
                  )}

                  {/* Step 2B: Criminal Cases for Format B, D & F (Direct) */}
                  {(formData.format_type === 'B' || formData.format_type === 'D' || formData.format_type === 'F') && (
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className={`flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${
                          isDark ? 'bg-blue-500 text-white' : 'bg-blue-500 text-white'
                        }`}>
                          2
                        </div>
                        <div>
                          <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            Criminal Cases Details
                          </h3>
                          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {formData.format_type === 'F' ? 'Format F supports criminal case details with habitual delinquent clause' : 'Enter the criminal case information below'}
                          </p>
                        </div>
                      </div>

                      <div className={`p-2 rounded-lg ${isDark ? 'bg-red-900/20 border border-red-500/30' : 'bg-red-50 border border-red-200'}`}>
                        <p className={`text-xs font-medium ${isDark ? 'text-red-300' : 'text-red-700'}`}>
                          <i className="fas fa-exclamation-triangle mr-1"></i>
                          Criminal record information will appear on the certificate
                        </p>
                      </div>

                      <div className="space-y-3">
                        {(formData.criminal_cases || []).map((crimCase: CriminalCase, index: number) => (
                          <div key={index} className={`p-3 rounded-xl border-2 ${
                            isDark ? 'bg-slate-700/50 border-red-500/30' : 'bg-red-50/50 border-red-200'
                          }`}>
                            <div className="flex items-center justify-between mb-2">
                              <h4 className={`font-semibold text-xs ${isDark ? 'text-red-300' : 'text-red-700'}`}>
                                <i className="fas fa-folder-open mr-1"></i>
                                Case #{index + 1}
                              </h4>
                              {(formData.criminal_cases?.length || 0) > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeCriminalCase(index)}
                                  className={`text-xs px-2 py-1 rounded-lg transition-colors ${
                                    isDark ? 'text-red-400 hover:bg-red-900/30' : 'text-red-600 hover:bg-red-100'
                                  }`}
                                >
                                  <i className="fas fa-trash-alt mr-1"></i>
                                  Remove
                                </button>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 gap-2">
                              {formData.format_type === 'F' ? (
                                <>
                                  {/* Format F: Case Number with Dropdown */}
                                  <div className="flex gap-3">
                                    <select
                                      value={crimCase.case_number_type || 'Criminal Case No.'}
                                      onChange={(e) => updateCriminalCase(index, 'case_number_type', e.target.value)}
                                      className={`${inputClasses} w-50 cursor-pointer`}
                                    >
                                      <option value="Criminal Case No.">Criminal Case No.</option>
                                      <option value="NPS Docket No.">NPS Docket No.</option>
                                    </select>
                                    <input
                                      type="text"
                                      value={crimCase.case_number}
                                      onChange={(e) => updateCriminalCase(index, 'case_number', e.target.value)}
                                      className={`${inputClasses} flex-1`}
                                      placeholder=""
                                    />
                                  </div>
                                  {/* Format F: Date with Dropdown */}
                                  <div className="flex gap-3">
                                    <select
                                      value={crimCase.date_type || 'Date Info Filed'}
                                      onChange={(e) => updateCriminalCase(index, 'date_type', e.target.value)}
                                      className={`${inputClasses} w-44 cursor-pointer`}
                                    >
                                      <option value="Date Info Filed">Date Info Filed</option>
                                      <option value="Date Filed">Date Filed</option>
                                    </select>
                                    <input
                                      type="date"
                                      value={crimCase.date_info_filed}
                                      onChange={(e) => updateCriminalCase(index, 'date_info_filed', e.target.value)}
                                      className={`${inputClasses} flex-1`}
                                    />
                                  </div>
                                  {/* Format F: Crime */}
                                  <input
                                    type="text"
                                    value={crimCase.crime}
                                    onChange={(e) => updateCriminalCase(index, 'crime', e.target.value)}
                                    className={inputClasses}
                                    placeholder="Crime"
                                  />
                                  {/* Format F: Status */}
                                  <input
                                    type="text"
                                    value={crimCase.status}
                                    onChange={(e) => updateCriminalCase(index, 'status', e.target.value)}
                                    className={inputClasses}
                                    placeholder="Status"
                                  />
                                </>
                              ) : (
                                <>
                                  {/* Format B & D: Case Number with Dropdown */}
                                  <div className="flex gap-3">
                                    <select
                                      value={crimCase.case_number_type || 'Criminal Case No.'}
                                      onChange={(e) => updateCriminalCase(index, 'case_number_type', e.target.value)}
                                      className={`${inputClasses} w-50 cursor-pointer`}
                                    >
                                      <option value="Criminal Case No.">Criminal Case No.</option>
                                      <option value="NPS Docket No.">NPS Docket No.</option>
                                    </select>
                                    <input
                                      type="text"
                                      value={crimCase.case_number}
                                      onChange={(e) => updateCriminalCase(index, 'case_number', e.target.value)}
                                      className={`${inputClasses} flex-1`}
                                      placeholder=""
                                    />
                                  </div>
                                  {/* Format B & D: Crime */}
                                  <input
                                    type="text"
                                    value={crimCase.crime}
                                    onChange={(e) => updateCriminalCase(index, 'crime', e.target.value)}
                                    className={inputClasses}
                                    placeholder="Crime"
                                  />
                                  {/* Format B & D: Date with Dropdown */}
                                  <div className="flex gap-3">
                                    <select
                                      value={crimCase.date_type || 'Date Info Filed'}
                                      onChange={(e) => updateCriminalCase(index, 'date_type', e.target.value)}
                                      className={`${inputClasses} w-44 cursor-pointer`}
                                    >
                                      <option value="Date Info Filed">Date Info Filed</option>
                                      <option value="Date Filed">Date Filed</option>
                                    </select>
                                    <input
                                      type="date"
                                      value={crimCase.date_info_filed}
                                      onChange={(e) => updateCriminalCase(index, 'date_info_filed', e.target.value)}
                                      className={`${inputClasses} flex-1`}
                                    />
                                  </div>
                                  <input
                                    type="text"
                                    value={crimCase.origin}
                                    onChange={(e) => updateCriminalCase(index, 'origin', e.target.value)}
                                    className={inputClasses}
                                    placeholder="Origin"
                                  />
                                  <input
                                    type="text"
                                    value={crimCase.status}
                                    onChange={(e) => updateCriminalCase(index, 'status', e.target.value)}
                                    className={inputClasses}
                                    placeholder="Status"
                                  />
                                </>
                              )}
                            </div>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={addCriminalCase}
                          className={`w-full py-2 rounded-xl border-2 border-dashed transition-all flex items-center justify-center gap-2 ${
                            isDark 
                              ? 'border-red-500/50 text-red-400 hover:bg-red-900/20' 
                              : 'border-red-300 text-red-600 hover:bg-red-50'
                          }`}
                        >
                          <i className="fas fa-plus-circle"></i>
                          <span className="font-medium text-xs">Add Another Case</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 3B: Clearance Details for Format B & D */}
                  {(formData.format_type === 'B' || formData.format_type === 'D') && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className={`flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${
                        isDark ? 'bg-blue-500 text-white' : 'bg-blue-500 text-white'
                      }`}>
                        3
                      </div>
                      <div>
                        <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          Clearance Details
                        </h3>
                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          Purpose and clearance information
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2.5">
                      <div className="space-y-1.5">
                        <label className={labelClasses}>Issued Upon Request By</label>
                        <input
                          type="text"
                          name="issued_upon_request_by"
                          value={formData.issued_upon_request_by}
                          onChange={handleInputChange}
                          className={inputClasses}
                          placeholder="Name of requester (if different from applicant)"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className={labelClasses}>Purpose *</label>
                          <motion.button
                            type="button"
                            onClick={() => setShowAddPurposeModal(true)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            title="Add new purpose"
                            className={`inline-flex items-center justify-center w-7 h-7 rounded-lg border transition-all duration-200 ${
                              isDark
                                ? 'bg-blue-900/40 border-blue-700 hover:bg-blue-900/60 text-blue-300 hover:text-blue-200'
                                : 'bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-600 hover:text-blue-700'
                            }`}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </motion.button>
                        </div>
                        {/* Custom Purpose Dropdown with Remove Icons */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setShowPurposeDropdown(!showPurposeDropdown)}
                            className={`w-full px-3 py-2 text-left rounded-lg border transition-all duration-200 flex items-center justify-between ${
                              errors.purpose
                                ? isDark ? 'border-red-500 bg-red-900/20' : 'border-red-500 bg-red-50'
                                : isDark ? 'border-slate-600 bg-slate-700 hover:bg-slate-650' : 'border-slate-300 bg-white hover:bg-slate-50'
                            }`}
                          >
                            <span className={isDark ? 'text-slate-200' : 'text-slate-900'}>
                              {formData.purpose || 'Select a purpose'}
                            </span>
                            <svg className={`w-4 h-4 transition-transform ${showPurposeDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                          </button>
                          
                          {showPurposeDropdown && (
                            <div className={`absolute top-full left-0 right-0 mt-1 rounded-lg border z-50 shadow-lg ${
                              isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-300'
                            }`}>
                              <div className="max-h-64 overflow-y-auto">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData(prev => ({ ...prev, purpose: '', purpose_fee: 0 }));
                                    setShowPurposeDropdown(false);
                                  }}
                                  className={`w-full text-left px-3 py-2 hover:bg-opacity-70 ${
                                    isDark ? 'hover:bg-slate-600' : 'hover:bg-slate-100'
                                  }`}
                                >
                                  <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Select a purpose</span>
                                </button>
                                
                                {/* Active Purposes */}
                                {activeBuiltInPurposes.map((opt) => (
                                  <div
                                    key={opt.name}
                                    className={`flex items-center justify-between px-3 py-2 hover:bg-opacity-70 ${
                                      formData.purpose === opt.name
                                        ? isDark ? 'bg-blue-900/40' : 'bg-blue-50'
                                        : isDark ? 'hover:bg-slate-600' : 'hover:bg-slate-100'
                                    }`}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setFormData(prev => ({ ...prev, purpose: opt.name, purpose_fee: opt.fee }));
                                        setShowPurposeDropdown(false);
                                      }}
                                      className="flex-1 text-left"
                                    >
                                      <span className={isDark ? 'text-slate-200' : 'text-slate-900'}>
                                        {opt.name}
                                      </span>
                                    </button>
                                    
                                    {opt.name !== 'Other' && (
                                      <motion.button
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          handleRemovePurpose(opt.name);
                                        }}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        className={`ml-2 p-1.5 rounded transition-all ${
                                          isDark
                                            ? 'hover:bg-red-900/40 text-red-400 hover:text-red-300'
                                            : 'hover:bg-red-100 text-red-600 hover:text-red-700'
                                        }`}
                                        title="Remove this purpose"
                                      >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                          <line x1="5" y1="12" x2="19" y2="12" />
                                        </svg>
                                      </motion.button>
                                    )}
                                  </div>
                                ))}
                                
                                {/* Custom Purposes */}
                                {customPurposes.filter(p => !deletedPurposes.has(normalizePurposeKey(p.name))).map((opt) => (
                                  <div
                                    key={opt.name}
                                    className={`flex items-center justify-between px-3 py-2 hover:bg-opacity-70 ${
                                      formData.purpose === opt.name
                                        ? isDark ? 'bg-blue-900/40' : 'bg-blue-50'
                                        : isDark ? 'hover:bg-slate-600' : 'hover:bg-slate-100'
                                    }`}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setFormData(prev => ({ ...prev, purpose: opt.name, purpose_fee: opt.fee }));
                                        setShowPurposeDropdown(false);
                                      }}
                                      className="flex-1 text-left"
                                    >
                                      <span className={isDark ? 'text-slate-200' : 'text-slate-900'}>
                                        {opt.name}
                                      </span>
                                    </button>
                                    
                                    <motion.button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleRemovePurpose(opt.name);
                                      }}
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.95 }}
                                      className={`ml-2 p-1.5 rounded transition-all ${
                                        isDark
                                          ? 'hover:bg-red-900/40 text-red-400 hover:text-red-300'
                                          : 'hover:bg-red-100 text-red-600 hover:text-red-700'
                                      }`}
                                      title="Remove this purpose"
                                    >
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                      </svg>
                                    </motion.button>
                                  </div>
                                ))}

                                {/* Other stays last */}
                                {otherPurpose && !deletedPurposes.has(normalizePurposeKey(otherPurpose.name)) && (
                                  <div
                                    key={otherPurpose.name}
                                    className={`flex items-center justify-between px-3 py-2 hover:bg-opacity-70 ${
                                      formData.purpose === otherPurpose.name
                                        ? isDark ? 'bg-blue-900/40' : 'bg-blue-50'
                                        : isDark ? 'hover:bg-slate-600' : 'hover:bg-slate-100'
                                    }`}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setFormData(prev => ({ ...prev, purpose: otherPurpose.name, purpose_fee: otherPurpose.fee }));
                                        setShowPurposeDropdown(false);
                                      }}
                                      className="flex-1 text-left"
                                    >
                                      <span className={isDark ? 'text-slate-200' : 'text-slate-900'}>
                                        {otherPurpose.name}
                                      </span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        {errors.purpose && <p className="text-red-500 text-xs mt-1">{errors.purpose}</p>}
                      </div>
                      
                      {formData.purpose === 'Other' && (
                        <div className="space-y-1.5">
                          <label className={labelClasses}>Specify Purpose *</label>
                          <input
                            type="text"
                            name="custom_purpose"
                            value={formData.custom_purpose}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            className={`${inputClasses} ${errors.custom_purpose ? 'border-red-500' : ''}`}
                            placeholder="Enter specific purpose"
                          />
                          {errors.custom_purpose && <p className="text-red-500 text-xs mt-1">{errors.custom_purpose}</p>}
                        </div>
                      )}
                    </div>
                  </div>
                  )}

                  {/* Step 4/3: Issuance Information */}
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className={`flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${
                        isDark ? 'bg-blue-500 text-white' : 'bg-blue-500 text-white'
                      }`}>
                        4
                      </div>
                      <div>
                        <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          Issuance Information
                        </h3>
                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          Date and validity information
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2.5">

                      {/* For Format C: DOJ ID No above Valid Until */}
                      {formData.format_type === 'C' ? (
                        <>
                          <div className="space-y-1.5">
                            <label className={`flex items-center space-x-2 text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                              <i className="fas fa-id-card text-xs"></i>
                              <span>{(formData.id_presented?.trim() || 'DOJ ID No.')} *</span>
                              <select
                                value={formatCIdType}
                                onChange={(e) => {
                                  const selected = e.target.value;
                                  setFormatCIdType(selected);
                                  if (selected === 'custom') {
                                    setFormData((prev: FormData) => ({ ...prev, id_presented: formatCCustomIdType.trim() }));
                                  } else {
                                    setFormatCCustomIdType('');
                                    setFormData((prev: FormData) => ({ ...prev, id_presented: selected }));
                                  }
                                }}
                                className={`text-[11px] rounded border px-1.5 py-0.5 ${
                                  isDark ? 'bg-slate-800 border-slate-600 text-slate-200' : 'bg-white border-slate-300 text-slate-700'
                                }`}
                                aria-label="Select Format C ID label"
                              >
                                {FORMAT_C_ID_OPTIONS.map((option) => (
                                  <option key={option} value={option}>{option}</option>
                                ))}
                                <option value="custom">Custom</option>
                              </select>
                            </label>
                            {formatCIdType === 'custom' && (
                              <input
                                type="text"
                                value={formatCCustomIdType}
                                onChange={(e) => {
                                  const customLabel = e.target.value;
                                  setFormatCCustomIdType(customLabel);
                                  setFormData((prev: FormData) => ({ ...prev, id_presented: customLabel }));
                                }}
                                className={inputClasses}
                                placeholder="Type custom ID label"
                              />
                            )}
                            <input
                              type="text"
                              name="prc_id_number"
                              value={formData.prc_id_number}
                              onChange={handleInputChange}
                              className={inputClasses}
                              placeholder={`Enter ${(formData.id_presented?.trim() || 'DOJ ID')} Number`}
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className={`flex items-center space-x-2 text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                              <i className="fas fa-calendar text-xs"></i>
                              <span>{(formData.id_number?.trim() || 'Valid Until')} *</span>
                              <select
                                value={formatCValidityLabelType}
                                onChange={(e) => {
                                  const selected = e.target.value;
                                  setFormatCValidityLabelType(selected);

                                  if (selected === 'custom') {
                                    setFormData((prev: FormData) => ({ ...prev, id_number: formatCCustomValidityLabel.trim() }));
                                  } else {
                                    setFormatCCustomValidityLabel('');
                                    setFormData((prev: FormData) => ({ ...prev, id_number: selected }));
                                  }
                                }}
                                className={`text-[11px] rounded border px-1.5 py-0.5 ${
                                  isDark ? 'bg-slate-800 border-slate-600 text-slate-200' : 'bg-white border-slate-300 text-slate-700'
                                }`}
                                aria-label="Select Format C validity label"
                              >
                                {FORMAT_C_VALIDITY_LABEL_OPTIONS.map((option) => (
                                  <option key={option} value={option}>{option}</option>
                                ))}
                                <option value="custom">Custom</option>
                              </select>
                            </label>
                            {formatCValidityLabelType === 'custom' && (
                              <input
                                type="text"
                                value={formatCCustomValidityLabel}
                                onChange={(e) => {
                                  const customLabel = e.target.value;
                                  setFormatCCustomValidityLabel(customLabel);
                                  setFormData((prev: FormData) => ({ ...prev, id_number: customLabel }));
                                }}
                                className={inputClasses}
                                placeholder="Type custom validity label"
                              />
                            )}
                            <input
                              type="date"
                              name="validity_expiry"
                              value={formData.validity_expiry}
                              onChange={handleInputChange}
                              className={inputClasses}
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className={labelClasses}>Date of Issuance *</label>
                            <input
                              type="date"
                              name="date_issued"
                              value={formData.date_issued}
                              onChange={handleInputChange}
                              onKeyDown={handleKeyDown}
                              className={inputClasses}
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className={`flex items-center space-x-2 text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                              <i className="fas fa-receipt text-xs"></i>
                              <span>O.R No *</span>
                            </label>
                            <div className="flex gap-1 items-end">
                              <div className="flex-1">
                                <input
                                  type="text"
                                  name="or_number"
                                  value={formData.or_number}
                                  onChange={e => {
                                    const value = e.target.value.replace(/[^0-9]/g, '');
                                    setFormData((prev: FormData) => ({ ...prev, or_number: value, no_entry_or_no: false }));
                                    if (errors.or_number) setErrors((prev: Partial<Record<keyof FormData, string>>) => ({ ...prev, or_number: '' }));
                                  }}
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  disabled={formData.no_entry_or_no}
                                  className={`${inputClasses} ${errors.or_number ? 'border-red-500 focus:border-red-500' : ''} ${formData.no_entry_or_no ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  placeholder="Enter O.R Number"
                                />
                                {errors.or_number && <p className="text-red-500 text-xs mt-1">{errors.or_number}</p>}
                              </div>
                              <select
                                value={formData.no_entry_or_no ? 'no_entry' : 'with_entry'}
                                onChange={(e) => {
                                  const isNoEntry = e.target.value === 'no_entry';
                                  setFormData((prev: FormData) => ({ 
                                    ...prev, 
                                    no_entry_or_no: isNoEntry,
                                    or_number: isNoEntry ? '' : prev.or_number
                                  }));
                                }}
                                className={`px-3 py-2 rounded-lg border text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                                  isDark 
                                    ? 'bg-slate-700 border-slate-600 text-slate-200 hover:border-blue-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500' 
                                    : 'bg-white border-slate-300 text-slate-700 hover:border-blue-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-400'
                                }`}
                              >
                                <option value="with_entry">With Entry</option>
                                <option value="no_entry">No Entry</option>
                              </select>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className={labelClasses}>Validity Period *</label>
                            <div className="relative group">
                              <input
                                type="text"
                                name="validity_period"
                                value={formData.validity_period}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                className={`${inputClasses} pr-12 transition-all duration-200`}
                                placeholder="e.g., 6 Months, 1 Year, Custom Period"
                              />
                              <button
                                type="button"
                                aria-label="Toggle validity period dropdown"
                                className={`absolute inset-y-0 right-0 px-3 flex items-center justify-center transition-all duration-200 ${
                                  isDark
                                    ? 'text-slate-400 hover:text-blue-400 hover:bg-slate-700/50'
                                    : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                                } rounded-r-lg`}
                                onClick={() => document.getElementById('validity-dropdown-f')?.click()}
                              >
                                <i className="fas fa-chevron-down text-sm"></i>
                              </button>
                              <select
                                id="validity-dropdown-f"
                                value=""
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleInputChange({
                                      target: { name: 'validity_period', value: e.target.value }
                                    } as React.ChangeEvent<HTMLInputElement>);
                                    (e.target as HTMLSelectElement).value = '';
                                  }
                                }}
                                className={`absolute inset-y-0 right-0 opacity-0 w-full cursor-pointer appearance-none pointer-events-none`}
                              >
                                <option value="">Select a period</option>
                                <option value="6 Months">📅 6 Months</option>
                                <option value="1 Year">📅 1 Year</option>
                              </select>
                              <div className="hidden group-hover:block absolute top-full right-0 mt-1 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 py-1 z-50 transition-all duration-200">
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleInputChange({
                                      target: { name: 'validity_period', value: '6 Months' }
                                    } as React.ChangeEvent<HTMLInputElement>);
                                  }}
                                  className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-all duration-150 flex items-center gap-3 ${
                                    isDark
                                      ? 'text-slate-300 hover:bg-blue-600/20 hover:text-blue-400'
                                      : 'text-gray-700 hover:bg-blue-100 hover:text-blue-700'
                                  }`}
                                >
                                  <i className="fas fa-calendar text-blue-500"></i>
                                  <span>6 Months</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleInputChange({
                                      target: { name: 'validity_period', value: '1 Year' }
                                    } as React.ChangeEvent<HTMLInputElement>);
                                  }}
                                  className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-all duration-150 flex items-center gap-3 ${
                                    isDark
                                      ? 'text-slate-300 hover:bg-blue-600/20 hover:text-blue-400'
                                      : 'text-gray-700 hover:bg-blue-100 hover:text-blue-700'
                                  }`}
                                >
                                  <i className="fas fa-calendar text-blue-500"></i>
                                  <span>1 Year</span>
                                </button>
                                <div className={`my-1 border-t ${isDark ? 'border-slate-700' : 'border-gray-200'}`}></div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const customInput = document.querySelector('input[name="validity_period"]') as HTMLInputElement;
                                    if (customInput) customInput.focus();
                                  }}
                                  className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-all duration-150 flex items-center gap-3 ${
                                    isDark
                                      ? 'text-slate-400 hover:bg-slate-700/50 hover:text-blue-400'
                                      : 'text-gray-600 hover:bg-gray-100 hover:text-blue-700'
                                  }`}
                                >
                                  <i className="fas fa-pencil-alt text-slate-500"></i>
                                  <span>Custom Validity</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          {formData.format_type === 'D' && (
                            <div className="space-y-1.5">
                              <label className={`flex items-center space-x-2 text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                <i className="fas fa-id-card text-xs"></i>
                                <span>{(formData.id_presented?.trim() || 'National ID')} *</span>
                                <select
                                  value={formatCIdType}
                                  onChange={(e) => {
                                    const selected = e.target.value;
                                    setFormatCIdType(selected);
                                    if (selected === 'custom') {
                                      setFormData((prev: FormData) => ({ ...prev, id_presented: formatCCustomIdType.trim() }));
                                    } else {
                                      setFormatCCustomIdType('');
                                      setFormData((prev: FormData) => ({ ...prev, id_presented: selected }));
                                    }
                                  }}
                                  className={`text-[11px] rounded border px-1.5 py-0.5 ${
                                    isDark ? 'bg-slate-800 border-slate-600 text-slate-200' : 'bg-white border-slate-300 text-slate-700'
                                  }`}
                                  aria-label="Select Format D ID label"
                                >
                                  {FORMAT_C_ID_OPTIONS.map((option) => (
                                    <option key={option} value={option}>{option}</option>
                                  ))}
                                  <option value="custom">Custom</option>
                                </select>
                              </label>
                              {formatCIdType === 'custom' && (
                                <input
                                  type="text"
                                  value={formatCCustomIdType}
                                  onChange={(e) => {
                                    const customLabel = e.target.value;
                                    setFormatCCustomIdType(customLabel);
                                    setFormData((prev: FormData) => ({ ...prev, id_presented: customLabel }));
                                  }}
                                  className={inputClasses}
                                  placeholder="Type custom ID label"
                                />
                              )}
                              <input
                                type="text"
                                name="ctc_number"
                                value={formData.ctc_number}
                                onChange={handleInputChange}
                                className={inputClasses}
                                placeholder={`Enter ${(formData.id_presented?.trim() || 'National ID')} Number`}
                              />
                            </div>
                          )}
                          {formData.format_type === 'D' && (
                            <div className="space-y-1.5">
                              <label className={`flex items-center space-x-2 text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                <i className="fas fa-calendar text-xs"></i>
                                <span>{(formData.id_number?.trim() || 'Valid Until')} *</span>
                                <select
                                  value={formatCValidityLabelType}
                                  onChange={(e) => {
                                    const selected = e.target.value;
                                    setFormatCValidityLabelType(selected);

                                    if (selected === 'custom') {
                                      setFormData((prev: FormData) => ({ ...prev, id_number: formatCCustomValidityLabel.trim() }));
                                    } else {
                                      setFormatCCustomValidityLabel('');
                                      setFormData((prev: FormData) => ({ ...prev, id_number: selected }));
                                    }
                                  }}
                                  className={`text-[11px] rounded border px-1.5 py-0.5 ${
                                    isDark ? 'bg-slate-800 border-slate-600 text-slate-200' : 'bg-white border-slate-300 text-slate-700'
                                  }`}
                                  aria-label="Select Format D validity label"
                                >
                                  {FORMAT_C_VALIDITY_LABEL_OPTIONS.map((option) => (
                                    <option key={option} value={option}>{option}</option>
                                  ))}
                                  <option value="custom">Custom</option>
                                </select>
                              </label>
                              {formatCValidityLabelType === 'custom' && (
                                <input
                                  type="text"
                                  value={formatCCustomValidityLabel}
                                  onChange={(e) => {
                                    const customLabel = e.target.value;
                                    setFormatCCustomValidityLabel(customLabel);
                                    setFormData((prev: FormData) => ({ ...prev, id_number: customLabel }));
                                  }}
                                  className={inputClasses}
                                  placeholder="Type custom validity label"
                                />
                              )}
                              <input
                                type="date"
                                name="validity_expiry"
                                value={formData.validity_expiry}
                                onChange={handleInputChange}
                                className={inputClasses}
                              />
                            </div>
                          )}

                          <div className="space-y-1.5">
                            <label className={labelClasses}>Date of Issuance *</label>
                            <input
                              type="date"
                              name="date_issued"
                              value={formData.date_issued}
                              onChange={handleInputChange}
                              onKeyDown={handleKeyDown}
                              className={inputClasses}
                            />
                          </div>

                          {formData.format_type !== 'D' && (
                            <div className="space-y-1.5">
                              <label className={`flex items-center space-x-2 text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                <i className="fas fa-receipt text-xs"></i>
                                <span>O.R No *</span>
                              </label>
                              <div className="flex gap-1 items-end">
                                <div className="flex-1">
                                  <input
                                    type="text"
                                    name="prc_id_number"
                                    value={formData.prc_id_number}
                                    onChange={e => {
                                      const value = e.target.value.replace(/[^0-9]/g, '');
                                      setFormData((prev: FormData) => ({ ...prev, prc_id_number: value, no_entry_or_no: false }));
                                      if (errors.prc_id_number) setErrors((prev: Partial<Record<keyof FormData, string>>) => ({ ...prev, prc_id_number: '' }));
                                    }}
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    disabled={formData.no_entry_or_no}
                                    className={`${inputClasses} ${errors.prc_id_number ? 'border-red-500 focus:border-red-500' : ''} ${formData.no_entry_or_no ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    placeholder="Enter O.R Number"
                                  />
                                  {errors.prc_id_number && <p className="text-red-500 text-xs mt-1">{errors.prc_id_number}</p>}
                                </div>
                                <select
                                  value={formData.no_entry_or_no ? 'no_entry' : 'with_entry'}
                                  onChange={(e) => {
                                    const isNoEntry = e.target.value === 'no_entry';
                                    setFormData((prev: FormData) => ({
                                      ...prev,
                                      no_entry_or_no: isNoEntry,
                                      prc_id_number: isNoEntry ? '' : prev.prc_id_number
                                    }));
                                  }}
                                  className={`px-3 py-2 rounded-lg border text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                                    isDark
                                      ? 'bg-slate-700 border-slate-600 text-slate-200 hover:border-blue-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                                      : 'bg-white border-slate-300 text-slate-700 hover:border-blue-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-400'
                                  }`}
                                >
                                  <option value="with_entry">With Entry</option>
                                  <option value="no_entry">No Entry</option>
                                </select>
                              </div>
                            </div>
                          )}

                          {formData.format_type === 'D' && (
                            <div className="space-y-1.5">
                              <label className={`flex items-center space-x-2 text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                <i className="fas fa-receipt text-xs"></i>
                                <span>O.R No *</span>
                              </label>
                              <div className="flex gap-1 items-end">
                                <div className="flex-1">
                                  <input
                                    type="text"
                                    name="prc_id_number"
                                    value={formData.prc_id_number}
                                    onChange={e => {
                                      const value = e.target.value.replace(/[^0-9]/g, '');
                                      setFormData((prev: FormData) => ({ ...prev, prc_id_number: value, no_entry_or_no: false }));
                                      if (errors.prc_id_number) setErrors((prev: Partial<Record<keyof FormData, string>>) => ({ ...prev, prc_id_number: '' }));
                                    }}
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    disabled={formData.no_entry_or_no}
                                    className={`${inputClasses} ${errors.prc_id_number ? 'border-red-500 focus:border-red-500' : ''} ${formData.no_entry_or_no ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    placeholder="Enter O.R Number"
                                  />
                                  {errors.prc_id_number && <p className="text-red-500 text-xs mt-1">{errors.prc_id_number}</p>}
                                </div>
                                <select
                                  value={formData.no_entry_or_no ? 'no_entry' : 'with_entry'}
                                  onChange={(e) => {
                                    const isNoEntry = e.target.value === 'no_entry';
                                    setFormData((prev: FormData) => ({
                                      ...prev,
                                      no_entry_or_no: isNoEntry,
                                      prc_id_number: isNoEntry ? '' : prev.prc_id_number
                                    }));
                                  }}
                                  className={`px-3 py-2 rounded-lg border text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                                    isDark
                                      ? 'bg-slate-700 border-slate-600 text-slate-200 hover:border-blue-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                                      : 'bg-white border-slate-300 text-slate-700 hover:border-blue-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-400'
                                  }`}
                                >
                                  <option value="with_entry">With Entry</option>
                                  <option value="no_entry">No Entry</option>
                                </select>
                              </div>
                            </div>
                          )}

                          <div className="space-y-1.5">
                            <label className={labelClasses}>Validity Period *</label>
                            <div className="relative group">
                              <input
                                type="text"
                                name="validity_period"
                                value={formData.validity_period}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                className={`${inputClasses} pr-12 transition-all duration-200`}
                                placeholder="e.g., 6 Months, 1 Year, Custom Period"
                              />
                              <button
                                type="button"
                                aria-label="Toggle validity period dropdown"
                                className={`absolute inset-y-0 right-0 px-3 flex items-center justify-center transition-all duration-200 ${
                                  isDark
                                    ? 'text-slate-400 hover:text-blue-400 hover:bg-slate-700/50'
                                    : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                                } rounded-r-lg`}
                                onClick={() => document.getElementById('validity-dropdown-other')?.click()}
                              >
                                <i className="fas fa-chevron-down text-sm"></i>
                              </button>
                              <select
                                id="validity-dropdown-other"
                                value=""
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleInputChange({
                                      target: { name: 'validity_period', value: e.target.value }
                                    } as React.ChangeEvent<HTMLInputElement>);
                                    (e.target as HTMLSelectElement).value = '';
                                  }
                                }}
                                className="absolute inset-y-0 right-0 opacity-0 w-full cursor-pointer appearance-none pointer-events-none"
                              >
                                <option value="">Select a period</option>
                                <option value="6 Months">📅 6 Months</option>
                                <option value="1 Year">📅 1 Year</option>
                              </select>
                              <div className="hidden group-hover:block absolute top-full right-0 mt-1 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 py-1 z-50 transition-all duration-200">
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleInputChange({
                                      target: { name: 'validity_period', value: '6 Months' }
                                    } as React.ChangeEvent<HTMLInputElement>);
                                  }}
                                  className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-all duration-150 flex items-center gap-3 ${
                                    isDark
                                      ? 'text-slate-300 hover:bg-blue-600/20 hover:text-blue-400'
                                      : 'text-gray-700 hover:bg-blue-100 hover:text-blue-700'
                                  }`}
                                >
                                  <i className="fas fa-calendar text-blue-500"></i>
                                  <span>6 Months</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleInputChange({
                                      target: { name: 'validity_period', value: '1 Year' }
                                    } as React.ChangeEvent<HTMLInputElement>);
                                  }}
                                  className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-all duration-150 flex items-center gap-3 ${
                                    isDark
                                      ? 'text-slate-300 hover:bg-blue-600/20 hover:text-blue-400'
                                      : 'text-gray-700 hover:bg-blue-100 hover:text-blue-700'
                                  }`}
                                >
                                  <i className="fas fa-calendar text-blue-500"></i>
                                  <span>1 Year</span>
                                </button>
                                <div className={`my-1 border-t ${isDark ? 'border-slate-700' : 'border-gray-200'}`}></div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const customInput = document.querySelector('input[name="validity_period"]') as HTMLInputElement;
                                    if (customInput) customInput.focus();
                                  }}
                                  className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-all duration-150 flex items-center gap-3 ${
                                    isDark
                                      ? 'text-slate-400 hover:bg-slate-700/50 hover:text-blue-400'
                                      : 'text-gray-600 hover:bg-gray-100 hover:text-blue-700'
                                  }`}
                                >
                                  <i className="fas fa-pencil-alt text-slate-500"></i>
                                  <span>Custom Validity</span>
                                </button>
                              </div>
                            </div>
                          </div>

                        </>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-1.5">
                    <label className={labelClasses}>Additional Notes (optional)</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      rows={2}
                      className={inputClasses}
                      placeholder="Any additional notes or remarks..."
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <motion.button
                      type="submit"
                      disabled={isSubmitting}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className="w-full inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs font-semibold rounded-lg text-white bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-700 hover:via-blue-600 hover:to-indigo-700 shadow-lg shadow-blue-500/40 hover:shadow-xl hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-check-circle mr-2"></i>
                          {editId ? 'Update Clearance' : 'Save to Database'}
                        </>
                      )}
                    </motion.button>
                    
                    <motion.button
                      type="button"
                      onClick={handleDownloadPDF}
                      disabled={!formData.first_name || !formData.last_name}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className="w-full inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs font-semibold rounded-lg text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-700 shadow-lg shadow-teal-500/40 hover:shadow-xl hover:shadow-teal-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      <i className="fas fa-download mr-2"></i>
                      Download PDF
                    </motion.button>

                    <motion.button
                      type="button"
                      onClick={handlePrint}
                      disabled={!formData.first_name || !formData.last_name}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className="w-full inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs font-semibold rounded-lg text-white bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-600 hover:via-orange-600 hover:to-red-600 shadow-lg shadow-orange-500/40 hover:shadow-xl hover:shadow-orange-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      <i className="fas fa-print mr-2"></i>
                      Print Certificate
                    </motion.button>
                    

                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Add Purpose Modal */}
      <AnimatePresence>
        {showAddPurposeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddPurposeModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-md rounded-2xl shadow-2xl ${
                isDark
                  ? 'bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700'
                  : 'bg-gradient-to-br from-white to-slate-50 border border-slate-200'
              }`}
            >
              {/* Modal Header */}
              <div className={`px-6 py-4 border-b ${
                isDark
                  ? 'border-slate-700 bg-slate-800/50'
                  : 'border-slate-200 bg-white/50'
              }`}>
                <div className="flex items-center justify-between">
                  <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Add New Purpose
                  </h3>
                  <motion.button
                    type="button"
                    onClick={() => setShowAddPurposeModal(false)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all ${
                      isDark
                        ? 'hover:bg-slate-700 text-slate-400 hover:text-white'
                        : 'hover:bg-slate-200 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </motion.button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="px-6 py-4 space-y-4">
                <div className="space-y-2">
                  <label className={`block text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                    Purpose Name *
                  </label>
                  <input
                    type="text"
                    value={newPurposeName}
                    onChange={(e) => setNewPurposeName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddPurpose();
                      }
                    }}
                    placeholder="Enter purpose name"
                    className={`w-full px-3 py-2 rounded-lg border transition-all focus:outline-none focus:ring-2 ${
                      isDark
                        ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:ring-blue-500 focus:border-blue-500'
                        : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    autoFocus
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className={`px-6 py-4 flex gap-3 border-t ${
                isDark
                  ? 'border-slate-700 bg-slate-800/30'
                  : 'border-slate-200 bg-slate-50/50'
              }`}>
                <motion.button
                  type="button"
                  onClick={() => setShowAddPurposeModal(false)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                    isDark
                      ? 'bg-slate-700 hover:bg-slate-600 text-white'
                      : 'bg-slate-200 hover:bg-slate-300 text-slate-900'
                  }`}
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="button"
                  onClick={handleAddPurpose}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-all bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40"
                >
                  Add Purpose
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClearanceGenerate;
