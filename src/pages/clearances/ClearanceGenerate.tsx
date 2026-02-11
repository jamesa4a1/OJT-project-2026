import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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

const ClearanceGenerate: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const { user } = useAuth();
  const themeContext = useContext(ThemeContext);
  const isDark = themeContext?.isDark ?? false;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [generatedOR, setGeneratedOR] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0); // Key to force form re-render on reset
  
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
    criminal_cases: [{ case_number: '', crime: '', date_info_filed: '', origin: 'Tagbilaran City', status: '' }],
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [hasCriminalRecord, setHasCriminalRecord] = useState(false);

  // Load clearance data if editing
  useEffect(() => {
    if (editId) {
      axios.get(`${config.api.baseURL}/api/clearances/${editId}`)
        .then(response => {
          const data = response.data;
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
            purpose: data.purpose || 'Local Employment',
            purpose_fee: data.purpose_fee || 0,
            custom_purpose: '',
            issued_upon_request_by: data.issued_upon_request_by || user?.name || '',
            date_issued: data.date_issued?.split('T')[0] || getDefaultDate(),
            prc_id_number: data.prc_id_number || '',
            validity_period: data.validity_period || '6 Months',
            validity_expiry: data.validity_expiry?.split('T')[0] || getExpiryDate(getDefaultDate(), '6 Months'),
            case_numbers: data.case_numbers || '',
            crime_description: data.crime_description || '',
            legal_statute: data.legal_statute || '',
            date_of_commission: data.date_of_commission?.split('T')[0] || '',
            date_information_filed: data.date_information_filed?.split('T')[0] || '',
            case_status: data.case_status || '',
            court_branch: data.court_branch || '',
            notes: data.notes || '',
            criminal_cases: data.criminal_cases || [{ case_number: '', crime: '', date_info_filed: '', origin: 'Tagbilaran City', status: '' }],
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

  // Note: Form inputs are now properly managed through React state
  // No DOM manipulation is needed - inputs are controlled React components

  // Update expiry date when issued date or validity period changes (except for Format C)
  useEffect(() => {
    if (formData.date_issued && formData.validity_period && formData.format_type !== 'C') {
      setFormData((prev: FormData) => ({
        ...prev,
        validity_expiry: getExpiryDate(prev.date_issued, prev.validity_period || '6 Months')
      }));
    }
  }, [formData.date_issued, formData.validity_period, formData.format_type]);

  // Auto-hide success message after 4 seconds
  useEffect(() => {
    if (submitStatus?.type === 'success') {
      const timer = setTimeout(() => {
        setSubmitStatus(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [submitStatus]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'purpose') {
      const selectedPurpose = PURPOSE_OPTIONS.find((p: { name: string; fee: number }) => p.name === value);
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

  // Helper functions for managing multiple criminal cases
  const addCriminalCase = () => {
    setFormData((prev: FormData) => ({
      ...prev,
      criminal_cases: [...(prev.criminal_cases || []), { case_number: '', crime: '', date_info_filed: '', origin: 'Tagbilaran City', status: '' }]
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
    
    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
    if (!formData.age || parseInt(formData.age.toString()) < 18 || parseInt(formData.age.toString()) > 120) {
      newErrors.age = 'Age must be between 18 and 120';
    }
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.purpose) newErrors.purpose = 'Purpose is required';
    if (formData.purpose === 'Other' && !formData.custom_purpose?.trim()) {
      newErrors.custom_purpose = 'Please specify the purpose';
    }
    if (!formData.prc_id_number?.trim()) newErrors.prc_id_number = 'O.R No is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setSubmitStatus({ type: 'error', message: 'Please fix the errors in the form' });
      return;
    }
    
    setIsSubmitting(true);
    setSubmitStatus(null);
    
    try {
      const payload = {
        ...formData,
        purpose: formData.purpose === 'Other' ? formData.custom_purpose : formData.purpose,
        has_criminal_record: hasCriminalRecord,
        age: parseInt(formData.age.toString()),
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
      criminal_cases: [{ case_number: '', crime: '', date_info_filed: '', origin: 'Tagbilaran City', status: '' }],
    });
    setErrors({});
    setSubmitStatus(null);
    setGeneratedOR(null);
    setHasCriminalRecord(false);
    
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
    const printFullName = [
      formData.first_name.toUpperCase(),
      formData.middle_name ? `${formData.middle_name.charAt(0).toUpperCase()}.` : '',
      formData.last_name.toUpperCase(),
      formData.suffix ? formData.suffix.toUpperCase() : ''
    ].filter(Boolean).join(' ');

    // Get the print template HTML
    const printDocument = getPrintTemplate({ formData, fullName: printFullName, generatedOR });
    
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
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    // Build full name for print template
    const printFullName = [
      formData.first_name.toUpperCase(),
      formData.middle_name ? `${formData.middle_name.charAt(0).toUpperCase()}.` : '',
      formData.last_name.toUpperCase(),
      formData.suffix ? formData.suffix.toUpperCase() : ''
    ].filter(Boolean).join(' ');

    // Get complete print document from the format file
    // Each format file now contains a complete standalone HTML document
    const printDocument = getPrintTemplate({ formData, fullName: printFullName, generatedOR });
    
    printWindow.document.write(printDocument);
    printWindow.document.close();
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

        {/* Status Message */}
        <AnimatePresence>
          {submitStatus && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className={`relative overflow-hidden rounded-xl p-4 mb-6 ${
                submitStatus.type === 'success'
                  ? isDark 
                    ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-500/30 shadow-lg shadow-emerald-500/10' 
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-lg shadow-emerald-500/10'
                  : isDark 
                    ? 'bg-red-950/50 text-red-300 border border-red-500/30 shadow-lg shadow-red-500/10' 
                    : 'bg-red-50 text-red-800 border border-red-200 shadow-lg shadow-red-500/10'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {submitStatus.type === 'success' ? (
                    <i className="fas fa-check-circle text-emerald-500"></i>
                  ) : (
                    <i className="fas fa-exclamation-triangle text-red-500"></i>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{submitStatus.message}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
                          <span>Middle Name</span>
                        </label>
                        <input
                          type="text"
                          name="middle_name"
                          value={formData.middle_name}
                          onChange={handleInputChange}
                          onKeyDown={handleKeyDown}
                          className={inputClasses}
                          placeholder="Enter middle name"
                        />
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
                        <input
                          type="number"
                          name="age"
                          value={formData.age}
                          onChange={handleInputChange}
                          onKeyDown={handleKeyDown}
                          min="18"
                          max="120"
                          className={`${inputClasses} ${errors.age ? 'border-red-500 focus:border-red-500' : ''}`}
                          placeholder="Enter age"
                        />
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
                          value={formData.civil_status}
                          onChange={handleInputChange}
                          className={inputClasses}
                        >
                          {CIVIL_STATUS_OPTIONS.map((status: string) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
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
                          className={inputClasses}
                          placeholder="Enter nationality"
                        />
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
                  {formData.format_type !== 'B' && (
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

                      <div className="space-y-1.5">
                        <label className={labelClasses}>Purpose *</label>
                        <select
                          name="purpose"
                          value={formData.purpose}
                          onChange={handleInputChange}
                          className={`${inputClasses} ${errors.purpose ? 'border-red-500' : ''}`}
                        >
                          {PURPOSE_OPTIONS.map((opt: { name: string; fee: number }) => (
                            <option key={opt.name} value={opt.name}>
                              {opt.name} {opt.fee > 0 ? `(PHP ${opt.fee.toLocaleString()})` : ''}
                            </option>
                          ))}
                        </select>
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

                  {/* Step 3: Criminal Record Toggle */}
                  {formData.format_type !== 'A' && formData.format_type !== 'B' && formData.format_type !== 'C' && formData.format_type !== 'D' && (
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
                          {formData.format_type === 'D' ? 'Format D is designed for criminal records' : 'Does this person have a criminal record?'}
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
                              <input
                                type="text"
                                value={crimCase.case_number}
                                onChange={(e) => updateCriminalCase(index, 'case_number', e.target.value)}
                                className={inputClasses}
                                placeholder="Case Number"
                              />
                              <input
                                type="text"
                                value={crimCase.crime}
                                onChange={(e) => updateCriminalCase(index, 'crime', e.target.value)}
                                className={inputClasses}
                                placeholder="Crime"
                              />
                              <input
                                type="date"
                                value={crimCase.date_info_filed}
                                onChange={(e) => updateCriminalCase(index, 'date_info_filed', e.target.value)}
                                className={inputClasses}
                              />
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

                  {/* Step 2B: Criminal Cases for Format B & D (Direct) */}
                  {(formData.format_type === 'B' || formData.format_type === 'D') && (
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
                            Enter the criminal case information below
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
                              <input
                                type="text"
                                value={crimCase.case_number}
                                onChange={(e) => updateCriminalCase(index, 'case_number', e.target.value)}
                                className={inputClasses}
                                placeholder="Case Number"
                              />
                              <input
                                type="text"
                                value={crimCase.crime}
                                onChange={(e) => updateCriminalCase(index, 'crime', e.target.value)}
                                className={inputClasses}
                                placeholder="Crime"
                              />
                              <input
                                type="date"
                                value={crimCase.date_info_filed}
                                onChange={(e) => updateCriminalCase(index, 'date_info_filed', e.target.value)}
                                className={inputClasses}
                              />
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
                        <label className={labelClasses}>Purpose *</label>
                        <select
                          name="purpose"
                          value={formData.purpose}
                          onChange={handleInputChange}
                          className={`${inputClasses} ${errors.purpose ? 'border-red-500' : ''}`}
                        >
                          {PURPOSE_OPTIONS.map((opt: { name: string; fee: number }) => (
                            <option key={opt.name} value={opt.name}>
                              {opt.name} {opt.fee > 0 ? `(PHP ${opt.fee.toLocaleString()})` : ''}
                            </option>
                          ))}
                        </select>
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
                      {/* For Format C: Different field order */}
                      {formData.format_type === 'C' ? (
                        <>
                          <div className="space-y-1.5">
                            <label className={`flex items-center space-x-2 text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                              <i className="fas fa-calendar text-xs"></i>
                              <span>Valid Until *</span>
                            </label>
                            <input
                              type="date"
                              name="validity_expiry"
                              value={formData.validity_expiry}
                              onChange={handleInputChange}
                              className={inputClasses}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className={`flex items-center space-x-2 text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                              <i className="fas fa-id-card text-xs"></i>
                              <span>DOJ ID No *</span>
                            </label>
                            <input
                              type="text"
                              name="prc_id_number"
                              value={formData.prc_id_number}
                              onChange={e => {
                                const value = e.target.value.replace(/[^0-9]/g, '');
                                setFormData((prev: FormData) => ({ ...prev, prc_id_number: value }));
                              }}
                              inputMode="numeric"
                              pattern="[0-9]*"
                              className={inputClasses}
                              placeholder="Enter DOJ ID Number"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className={`flex items-center space-x-2 text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                              <i className="fas fa-receipt text-xs"></i>
                              <span>O.R No *</span>
                            </label>
                            <input
                              type="text"
                              onChange={e => {
                                const value = e.target.value.replace(/[^0-9]/g, '');
                                setFormData((prev: FormData) => ({ ...prev, or_number: value }));
                                if (errors.or_number) setErrors((prev: Partial<Record<keyof FormData, string>>) => ({ ...prev, or_number: '' }));
                              }}
                              inputMode="numeric"
                              pattern="[0-9]*"
                              className={`${inputClasses} ${errors.or_number ? 'border-red-500 focus:border-red-500' : ''}`}
                              placeholder="Enter O.R Number"
                            />
                            {errors.or_number && <p className="text-red-500 text-xs mt-1">{errors.or_number}</p>}
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
                            <label className={labelClasses}>Validity Period *</label>
                            <select
                              name="validity_period"
                              value={formData.validity_period}
                              onChange={handleInputChange}
                              className={inputClasses}
                            >
                              <option value="6 Months">6 Months</option>
                              <option value="1 Year">1 Year</option>
                            </select>
                          </div>
                        </>
                      ) : (
                        <>
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
                            <label className={labelClasses}>Valid Until</label>
                            <input
                              type="date"
                              name="validity_expiry"
                              value={formData.validity_expiry}
                              disabled
                              className={inputClasses}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className={`flex items-center space-x-2 text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                              <i className="fas fa-receipt text-xs"></i>
                              <span>O.R No *</span>
                            </label>
                            <input
                              type="text"
                              name="prc_id_number"
                              value={formData.prc_id_number}
                              onChange={e => {
                                const value = e.target.value.replace(/[^0-9]/g, '');
                                setFormData((prev: FormData) => ({ ...prev, prc_id_number: value }));
                                if (errors.prc_id_number) setErrors((prev: Partial<Record<keyof FormData, string>>) => ({ ...prev, prc_id_number: '' }));
                              }}
                              inputMode="numeric"
                              pattern="[0-9]*"
                              className={`${inputClasses} ${errors.prc_id_number ? 'border-red-500 focus:border-red-500' : ''}`}
                              placeholder="Enter O.R Number"
                            />
                            {errors.prc_id_number && <p className="text-red-500 text-xs mt-1">{errors.prc_id_number}</p>}
                          </div>
                          <div className="space-y-1.5">
                            <label className={labelClasses}>Validity Period *</label>
                            <select
                              name="validity_period"
                              value={formData.validity_period}
                              onChange={handleInputChange}
                              className={inputClasses}
                            >
                              <option value="6 Months">6 Months</option>
                              <option value="1 Year">1 Year</option>
                            </select>
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
                    

                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ClearanceGenerate;
