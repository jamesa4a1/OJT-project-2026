import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { ThemeContext } from '../../App';
import config from '../../config';

// Import templates from separate files
import { 
  FORMAT_TYPES, 
  CIVIL_STATUS_OPTIONS, 
  CASE_STATUS_OPTIONS, 
  PURPOSE_OPTIONS,
  getOrdinalSuffix,
  getPrintTemplateByFormat,
  FormatAPreview,
  FormatBPreview,
  FormatCPreview,
  FormatDPreview,
  FormatEPreview,
  FormatFPreview,
} from './templates';
import type { CriminalCase, FormData } from './templates/types';


// Official DOJ and Bagong Pilipinas logos - Replace these paths with actual logo files
const DOJ_SEAL = '/images/logos/doj-seal.png';
const BAGONG_PILIPINAS_SEAL = '/images/logos/bagong-pilipinas.png';

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
    civil_status: 'Single',
    nationality: 'Filipino',
    address: '',
    purpose: 'Local Employment',
    purpose_fee: 50,
    custom_purpose: '',
    issued_upon_request_by: user?.name || '',
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

  // Load clearance data if editing
  useEffect(() => {
    if (editId) {
      axios.get(`${config.api.baseURL}/api/clearances/${editId}`)
        .then(response => {
          const data = response.data;
          setFormData({
            format_type: data.format_type || 'A',
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
        })
        .catch(err => {
          console.error('Error loading clearance:', err);
          setSubmitStatus({ type: 'error', message: 'Failed to load clearance data' });
        });
    }
  }, [editId, user?.name]);

  // Update expiry date when issued date or validity period changes
  useEffect(() => {
    if (formData.date_issued) {
      setFormData(prev => ({
        ...prev,
        validity_expiry: getExpiryDate(prev.date_issued, prev.validity_period)
      }));
    }
  }, [formData.date_issued, formData.validity_period]);

  // Initialize criminal_cases when format changes
  useEffect(() => {
    const formatConfig = FORMAT_TYPES[formData.format_type as keyof typeof FORMAT_TYPES];
    if (formatConfig.hasCR) {
      // If format requires criminal records, ensure criminal_cases is initialized
      if (!formData.criminal_cases || formData.criminal_cases.length === 0) {
        setFormData(prev => ({
          ...prev,
          criminal_cases: [{ case_number: '', crime: '', date_info_filed: '', origin: 'Tagbilaran City', status: '' }]
        }));
      }
    }
  }, [formData.format_type]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Handle purpose selection with fee
    if (name === 'purpose') {
      const selectedPurpose = PURPOSE_OPTIONS.find(p => p.name === value);
      setFormData(prev => ({
        ...prev,
        purpose: value,
        purpose_fee: selectedPurpose?.fee || 0,
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error when user starts typing
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Helper functions for managing multiple criminal cases
  const addCriminalCase = () => {
    setFormData(prev => ({
      ...prev,
      criminal_cases: [...prev.criminal_cases, { case_number: '', crime: '', date_info_filed: '', origin: 'Tagbilaran City', status: '' }]
    }));
  };

  const removeCriminalCase = (index: number) => {
    if (formData.criminal_cases.length > 1) {
      setFormData(prev => ({
        ...prev,
        criminal_cases: prev.criminal_cases.filter((_, i) => i !== index)
      }));
    }
  };

  const updateCriminalCase = (index: number, field: keyof CriminalCase, value: string) => {
    setFormData(prev => ({
      ...prev,
      criminal_cases: prev.criminal_cases.map((c, i) => i === index ? { ...c, [field]: value } : c)
    }));
  };

  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    const formatConfig = FORMAT_TYPES[formData.format_type as keyof typeof FORMAT_TYPES];
    
    // Required fields
    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
    if (!formData.age || parseInt(formData.age) < 18 || parseInt(formData.age) > 120) {
      newErrors.age = 'Age must be between 18 and 120';
    }
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.purpose) newErrors.purpose = 'Purpose is required';
    if (formData.purpose === 'Other' && !formData.custom_purpose.trim()) {
      newErrors.custom_purpose = 'Please specify the purpose';
    }
    if (!formData.prc_id_number.trim()) newErrors.prc_id_number = 'O.R No is required';
    
    // Criminal record fields (required for Format B and D)
    if (formatConfig.hasCR) {
      if (!formData.case_numbers.trim()) newErrors.case_numbers = 'Case number(s) required';
      if (!formData.crime_description.trim()) newErrors.crime_description = 'Crime description required';
      if (!formData.legal_statute.trim()) newErrors.legal_statute = 'Legal statute required';
      if (!formData.date_of_commission) newErrors.date_of_commission = 'Date of commission required';
      if (!formData.date_information_filed) newErrors.date_information_filed = 'Date filed required';
      if (!formData.case_status) newErrors.case_status = 'Case status required';
      if (!formData.court_branch.trim()) newErrors.court_branch = 'Court/Branch required';
    }
    
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
      const formatConfig = FORMAT_TYPES[formData.format_type as keyof typeof FORMAT_TYPES];
      const payload = {
        ...formData,
        purpose: formData.purpose === 'Other' ? formData.custom_purpose : formData.purpose,
        has_criminal_record: formatConfig.hasCR,
        age: parseInt(formData.age),
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
      
    } catch (error: any) {
      console.error('Error saving clearance:', error);
      setSubmitStatus({ 
        type: 'error', 
        message: error.response?.data?.error || 'Failed to save clearance' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearForm = () => {
    setFormData({
      format_type: 'A',
      first_name: '',
      middle_name: '',
      last_name: '',
      suffix: '',
      alias: '',
      age: '',
      civil_status: 'Single',
      nationality: 'Filipino',
      address: '',
      purpose: 'Local Employment',
      purpose_fee: 50,
      custom_purpose: '',
      issued_upon_request_by: user?.name || '',
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
    setErrors({});
    setSubmitStatus(null);
    setGeneratedOR(null);
  };

  const handleDownloadPDF = async () => {
    // Dynamic import of html2pdf
    const html2pdf = (await import('html2pdf.js')).default;
    
    const element = document.getElementById('certificate-preview');
    if (!element) return;
    
    const opt = {
      margin: 0.5,
      filename: `clearance_${generatedOR || 'preview'}_${formData.last_name}.pdf`,
      image: { type: 'jpeg' as 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    html2pdf().set(opt as any).from(element).save();
    
    // Log the download if we have a clearance ID
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
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const certificateElement = document.getElementById('certificate-preview');
    if (!certificateElement) return;
    
    // Build clean certificate content for print (matching Word document format exactly)
    const printDocument = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Certificate</title>
          <style>
            @page {
              size: 9.5in 12in;
              margin: 0.75in 0.75in 0.5in 0.75in;
            }
            
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            
            body {
              margin: 0;
              padding: 0;
              font-family: "Century Gothic", Arial, sans-serif;
              font-size: 12pt;
              line-height: 1.0;
              color: ${formData.format_type === 'A' ? '#00008B' : '#000000'};
              background: white;
            }
            
            .certificate-container {
              width: 100%;
              max-width: 7in;
              margin: 0 auto;
              padding: 0;
            }
            
            /* Header Section */
            .header {
              display: flex;
              align-items: flex-start;
              justify-content: space-between;
              margin-bottom: 4pt;
            }
            
            .header img {
              width: 0.8in;
              height: 0.8in;
              object-fit: contain;
            }
            
            .header-text {
              flex: 1;
              text-align: center;
              padding: 0 8px;
            }
            
            .header-text p {
              margin: 0;
              line-height: 1.0;
            }
            
            .header-text .republic {
              font-size: 12pt;
              font-style: normal;
            }
            
            .header-text .dept {
              font-size: 12pt;
              font-style: normal;
            }
            
            .header-text .office {
              font-size: 12pt;
              font-weight: bold;
            }
            
            .header-text .city {
              font-size: 12pt;
              font-style: normal;
            }
            
            .header-text .address {
              font-size: 9pt;
              font-style: italic;
            }
            
            .header-text .email {
              font-size: 9pt;
              font-style: italic;
            }
            
            .header-text .email a {
              color: #0000FF;
              text-decoration: underline;
              font-style: italic;
            }
            
            /* Title */
            .title {
              text-align: center;
              margin: 4pt 0 8pt 0;
            }
            
            .title h1 {
              font-size: 16pt;
              font-weight: bold;
              letter-spacing: 0.15em;
              margin: 0;
              color: ${formData.format_type === 'A' ? '#00008B' : '#000000'};
            }
            
            /* Salutation */
            .salutation {
              font-size: 12pt;
              font-weight: bold;
              margin-bottom: 4pt;
            }
            
            /* Body */
            .body-text {
              font-size: 12pt;
              line-height: 1.0;
              text-align: justify;
              text-indent: 0.3in;
              margin-bottom: 6pt;
            }
            
            .body-text strong {
              font-weight: bold;
            }
            
            /* NO CRIMINAL RECORD */
            .no-record {
              text-align: center;
              margin: 8pt 0;
              font-size: 25pt;
            }
            
            .no-record p {
              font-size: 25pt;
              font-weight: bold;
              color: #008000 !important;
              margin: 0;
            }
            
            /* Details */
            .details {
              margin-left: 0.3in;
              font-size: 12pt;
              line-height: 1.0;
            }
            
            .details p {
              margin: 0 0 2pt 0;
            }
            
            /* Witness */
            .witness {
              font-size: 12pt;
              line-height: 1.0;
              text-align: justify;
              text-indent: 0.3in;
              
            }
            
            /* Signature Section */
            .signature {
              text-align: right;
              margin-top: 14pt;
              margin-right: 0.3in;
              display: flex;
              flex-direction: column;
              align-items: flex-end;
            }
            
            .signature .for-prosecutor {
              font-size: 12pt;
              font-weight: bold;
              margin-bottom: 32pt;
              text-align: right;
            }
            
            .signature .name {
              font-size: 12pt;
              font-weight: bold;
              margin-bottom: 0;
              margin-right: 25pt;
            }
            
            .signature .position {
              font-size: 12pt;
              font-style: italic;
              margin-top: 0pt;
              margin-right: 5pt;
            }
            
            /* Footer */
            .footer {
              margin-top: 18pt;
              font-size: 12pt;
            }
            
            .footer p {
              margin: 0 0 2pt 0;
            }
            
            .footer .note {
              font-style: italic;
              font-size: 12pt;
              margin-top: 8pt;
            }
            
            @media print {
              body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              
              .no-record p {
                color: #008000 !important;
              }
              
              .header-text .email a {
                color: #0000FF !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="certificate-container">
            <!-- Header -->
            <div class="header">
              <img src="${(document.querySelector('#certificate-preview img:first-of-type') as HTMLImageElement)?.src || ''}" alt="DOJ Seal" />
              <div class="header-text">
                <p class="republic">Republic of the Philippines</p>
                <p class="dept">Department of Justice</p>
                <p class="office">OFFICE OF THE CITY PROSECUTOR</p>
                <p class="city">City of Tagbilaran</p>
                <p class="address">Hall of Justice Building, Brgy. Cogon, Tagbilaran City</p>
                <p class="address">Tel. No. 411-3403/411-2306</p>
                <p class="email">Email: <a href="mailto:ocptagbilaran@doj.gov.ph">ocptagbilaran@doj.gov.ph</a></p>
              </div>
              <img src="${(document.querySelectorAll('#certificate-preview img')[1] as HTMLImageElement)?.src || ''}" alt="Bagong Pilipinas" />
            </div>
            
            <br>
            
            <!-- Title -->
            <div class="title">
              <h1>C E R T I F I C A T I O N</h1>
            </div>
            
            <br>
            
            <!-- Salutation -->
            <p class="salutation">TO WHOM IT MAY CONCERN:</p>
            
            <br>
            
            <!-- Body - Format Specific Content (imported from template files) -->
            ${getPrintTemplateByFormat(formData.format_type, { formData, fullName, generatedOR, getOrdinalSuffix })}
            
            <br>
            
            <!-- Signature -->
            <div class="signature">
              <p class="for-prosecutor">FOR THE CITY PROSECUTOR:</p>
             
              
              <p class="name">REGIE C. POCON</p>
              <p class="position">Administrative Officer V</p>
            </div>
            
            <br>
            
            <!-- Footer -->
            <div class="footer">
              <p>O.R No: <strong><u>${formData.prc_id_number || generatedOR || '________'}</u></strong></p>
              <p>Date: <strong><u>${new Date(formData.date_issued).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</u></strong></p>
              <br>
              <p class="note">Note: Valid until 6 months from the date issued.</p>
            </div>
          </div>
          
          <script>
            window.onload = function() {
              document.title = '';
              setTimeout(() => { window.print(); }, 200);
              window.onafterprint = function() { window.close(); };
            };
          </script>
        </body>
      </html>
    `;
    
    // Write the document and print
    printWindow.document.write(printDocument);
    printWindow.document.close();
  };

  const formatConfig = FORMAT_TYPES[formData.format_type as keyof typeof FORMAT_TYPES];
  
  // Determine text color based on format (Form A = navy blue, others = black)
  const textColor = formData.format_type === 'A' ? '#00008B' : '#000000';
  
  // Build full name for preview
  const fullName = [
    formData.first_name.toUpperCase(),
    formData.middle_name ? `${formData.middle_name.charAt(0).toUpperCase()}.` : '',
    formData.last_name.toUpperCase(),
    formData.suffix ? formData.suffix.toUpperCase() : ''
  ].filter(Boolean).join(' ');

  const inputClasses = `w-full px-3 py-2.5 rounded-lg border-2 outline-none transition-all duration-200 text-sm ${
    isDark 
      ? 'bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20' 
      : 'bg-white border-slate-200 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
  }`;

  const labelClasses = `block text-xs font-semibold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`;
  
  const fieldSpacing = 'space-y-1.5';
  const fieldContainerClass = 'space-y-1.5';

  const labelClasses2 = `block text-xs font-semibold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`;

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
                    isDark ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-600'
                  }`}>
                    <i className="fas fa-file-alt"></i>
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
              onAnimationComplete={() => {
                if (submitStatus.type === 'success') {
                  const timer = setTimeout(() => {
                    setSubmitStatus(null);
                  }, 3000);
                  return () => clearTimeout(timer);
                }
              }}
              className={`relative overflow-hidden rounded-xl p-4 ${
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
                  {submitStatus.type === 'error' && Object.keys(errors).length > 0 && (
                    <ul className="mt-2 text-sm space-y-1 opacity-90">
                      {Object.entries(errors).map(([field, message]) => (
                        <li key={field} className="flex items-center space-x-2">
                          <span className="w-1 h-1 bg-current rounded-full flex-shrink-0"></span>
                          <span>{message}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              {/* Accent line */}
              <div className={`absolute bottom-0 left-0 right-0 h-1 ${
                submitStatus.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
              }`} />
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
                      isDark ? 'bg-emerald-900/50 text-emerald-400' : 'bg-emerald-100 text-emerald-600'
                    }`}>
                      <i className="fas fa-eye"></i>
                    </div>
                    <div>
                      <h2 className={`text-xl font-bold ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}>
                        Certificate Preview
                      </h2>
                      <p className={`text-sm ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        Real-time preview of your certificate
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

              <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                {/* Certificate Preview - Official Format A */}
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
                  {/* Header with Official Logos - Form A Format */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
                    {/* DOJ Seal - Left - 1.2" x 1.2" */}
                    <div style={{ flexShrink: 0, width: '0.8in' }}>
                      <img 
                        src={DOJ_SEAL} 
                        alt="DOJ Seal" 
                        style={{ 
                          width: '0.8in', 
                          height: '0.8in',
                          objectFit: 'contain'
                        }}
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>

                    {/* Center Text - Official Format */}
                    <div style={{ flex: 1, textAlign: 'center', fontFamily: '"Century Gothic", Arial, sans-serif', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                      <p style={{ 
                        color: textColor, 
                        fontSize: '9pt', 
                        fontStyle: 'italic',
                        marginBottom: '1pt',
                        lineHeight: '1.1',
                        fontWeight: 'normal',
                        margin: '0'
                      }}>Republic of the Philippines</p>
                      <p style={{ 
                        color: textColor, 
                        fontSize: '9pt', 
                        fontStyle: 'italic',
                        marginBottom: '1pt',
                        lineHeight: '1.1',
                        fontWeight: 'normal',
                        margin: '0'
                      }}>Department of Justice</p>
                      <p style={{ 
                        color: textColor, 
                        fontSize: '11pt', 
                        fontWeight: 'bold', 
                        marginBottom: '1pt',
                        lineHeight: '1.1',
                        margin: '0'
                      }}>OFFICE OF THE CITY PROSECUTOR</p>
                      <p style={{ 
                        color: textColor, 
                        fontSize: '9pt', 
                        marginBottom: '2pt',
                        lineHeight: '1.1',
                        fontWeight: 'normal',
                        margin: '0'
                      }}>City of Tagbilaran</p>
                      <p style={{ 
                        color: textColor, 
                        fontSize: '7pt', 
                        fontStyle: 'italic', 
                        marginBottom: '1pt',
                        lineHeight: '1.1',
                        fontWeight: 'normal',
                        margin: '0'
                      }}>Hall of Justice Building, Brgy. Cogon, Tagbilaran City</p>
                      <p style={{ 
                        color: textColor, 
                        fontSize: '7pt', 
                        fontStyle: 'italic', 
                        marginBottom: '1pt',
                        lineHeight: '1.1',
                        fontWeight: 'normal',
                        margin: '0'
                      }}>Tel. No. 411-3403/411-2306</p>
                      <p style={{ 
                        color: '#000000', 
                        fontSize: '10pt',
                        fontStyle: 'italic', 
                        marginBottom: '0pt',
                        lineHeight: '1.1',
                        fontWeight: 'normal',
                        margin: '0'
                      }}>
                        Email: <a href="mailto:ocptagbilaran@doj.gov.ph" className="blue-link" style={{ 
                          color: '#0000FF', 
                          textDecoration: 'underline'
                        }}>ocptagbilaran@doj.gov.ph</a>
                      </p>
                    </div>

                    {/* Bagong Pilipinas - Right - 1.2" x 1.2" */}
                    <div style={{ flexShrink: 0, width: '0.8in', textAlign: 'center' }}>
                      <img 
                        src={BAGONG_PILIPINAS_SEAL} 
                        alt="Bagong Pilipinas" 
                        style={{ 
                          width: '0.8in', 
                          height: '0.8in',
                          objectFit: 'contain'
                        }}
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                  </div>

                  {/* CERTIFICATION Title - 14-16pt, bold, all caps, centered */}
                  <div style={{ textAlign: 'center', margin: '24pt 0 24pt 0' }}>
                    <h1 style={{ 
                      color: textColor, 
                      fontSize: '20pt', 
                      fontWeight: 'bold', 
                      letterSpacing: '0.1em',
                      fontFamily: '"Century Gothic", Arial, sans-serif',
                      margin: '0',
                      padding: '0',
                      textTransform: 'uppercase',
                    } as React.CSSProperties}>
                      CERTIFICATION
                    </h1>
                  </div>

                  {/* Body Content - Form A Official Format */}
                  <div style={{ 
                    textAlign: 'justify', 
                    color: textColor, 
                    lineHeight: '1.2',
                    fontSize: '9pt',
                    fontFamily: '"Century Gothic", Arial, sans-serif'
                  }}>
                    {/* TO WHOM IT MAY CONCERN - 11-12pt, bold, all caps, left aligned */}
                    <p style={{ 
                      fontWeight: 'bold', 
                      marginBottom: '12pt',
                      textAlign: 'left',
                      fontSize: '10pt',
                      textTransform: 'uppercase'
                    }}>TO WHOM IT MAY CONCERN:</p>
                    
                    {/* Format-specific content - imported from template files */}
                    {formData.format_type === 'E' ? (
                      <FormatEPreview formData={formData} fullName={fullName} textColor={textColor} generatedOR={generatedOR} getOrdinalSuffix={getOrdinalSuffix} />
                    ) : formData.format_type === 'F' ? (
                      <FormatFPreview formData={formData} fullName={fullName} textColor={textColor} generatedOR={generatedOR} getOrdinalSuffix={getOrdinalSuffix} />
                    ) : formData.format_type === 'B' ? (
                      <FormatBPreview formData={formData} fullName={fullName} textColor={textColor} generatedOR={generatedOR} getOrdinalSuffix={getOrdinalSuffix} />
                    ) : formData.format_type === 'D' ? (
                      <FormatDPreview formData={formData} fullName={fullName} textColor={textColor} generatedOR={generatedOR} getOrdinalSuffix={getOrdinalSuffix} />
                    ) : formData.format_type === 'C' ? (
                      <FormatCPreview formData={formData} fullName={fullName} textColor={textColor} generatedOR={generatedOR} getOrdinalSuffix={getOrdinalSuffix} />
                    ) : (
                      <FormatAPreview formData={formData} fullName={fullName} textColor={textColor} generatedOR={generatedOR} getOrdinalSuffix={getOrdinalSuffix} />
                    )}

                  </div>

                  {/* Signature Section - Form A Format */}
                  <div style={{ 
                    marginTop: '18pt',
                    textAlign: 'center',
                    color: textColor,
                    fontFamily: 'Century Gothic',
                    marginRight: '-205pt',
                    
                  }}>
                    {/* FOR THE CITY PROSECUTOR - 11-12pt, bold, all caps, centered */}
                    <p style={{ 
                      fontWeight: 'bold',
                      fontSize: '10pt',
                      marginBottom: '48pt',
                      textTransform: 'uppercase',
                      color: textColor,
                    }}>FOR THE CITY PROSECUTOR:</p>
                    
                    {/* Signature area with name and title */}
                    <div>
                      {/* Name - 11-12pt, bold, centered */}
                      <p style={{ 
                        fontWeight: 'bold',
                        fontSize: '10pt',
                        marginBottom: '2pt',
                        color: textColor,
                      }}>REGIE C. POCON</p>
                      {/* Title - 10-11pt, normal, italicized, centered */}
                      <p style={{ 
                        fontSize: '9pt',
                        fontStyle: 'italic',
                        fontWeight: 'normal',
                        color: textColor,
                      }}>Administrative Officer V</p>
                    </div>
                  </div>

                  {/* Footer - O.R No, Date, and Note */}
                  <div style={{ 
                    marginTop: '48pt',
                    color: '#000000', 
                    fontSize: '13pt',
                    fontFamily: '"Century Gothic", Arial, sans-serif'
                  }}>
                    {/* O.R No - 10pt, bold, underlined */}
                    <p style={{ marginBottom: '3pt', color: textColor }}>
                      O.R No: <strong style={{ textDecoration: 'underline', color: textColor, fontWeight: 'bold' }}>{formData.prc_id_number || generatedOR || '________'}</strong>
                    </p>
                    {/* Date - 10pt, bold, underlined */}
                    <p style={{ marginBottom: '12pt', color: textColor }}>
                      Date: <strong style={{ textDecoration: 'underline', color: textColor, fontWeight: 'bold'}}>{new Date(formData.date_issued).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>
                    </p>
                    {/* Note - 8-9pt, italicized */}
                    <p style={{ fontStyle: 'italic', fontSize: '12pt', color: textColor }}>
                      Note: Valid until 6 months from the date issued.
                    </p>
                  </div>
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
              <div className={`px-5 py-4 border-b ${
                isDark 
                  ? 'border-slate-700/60 bg-gradient-to-r from-slate-800/80 to-slate-700/80' 
                  : 'border-slate-100/60 bg-gradient-to-r from-slate-50/80 to-white/80'
              }`}>
                <div className="flex items-center space-x-2">
                  <div className={`inline-flex items-center justify-center w-7 h-7 rounded-lg ${
                    isDark ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-600'
                  }`}>
                    <i className="fas fa-edit text-sm"></i>
                  </div>
                  <div>
                    <h2 className={`text-base font-bold ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}>
                      Certificate Details
                    </h2>
                    <p className={`text-xs ${
                      isDark ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      Fill in the required information
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Container - Compact and Scrollable */}
              <div className="p-4 overflow-y-auto overflow-x-hidden" style={{ maxHeight: 'calc(100vh - 240px)', wordWrap: 'break-word' }}>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Step 1: Certificate Format */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold ${
                        isDark ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'
                      }`}>
                        1
                      </div>
                      <div>
                        <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          Certificate Format
                        </h3>
                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          Select format type
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2">
                      {Object.entries(FORMAT_TYPES).map(([key, config]) => (
                        <motion.button
                          key={key}
                          type="button"
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => setFormData(prev => ({ ...prev, format_type: key }))}
                          className={`group relative p-2 rounded-md text-left border-2 transition-all duration-200 overflow-hidden ${
                            formData.format_type === key
                              ? isDark
                                ? 'border-blue-400 bg-blue-900/30 shadow-lg shadow-blue-500/25'
                                : 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/25'
                              : isDark 
                                ? 'border-slate-600 hover:border-slate-500 bg-slate-700/30 hover:bg-slate-700/50'
                                : 'border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-start space-x-2">
                            <div className={`flex items-center justify-center w-4 h-4 rounded-full border-2 transition-all flex-shrink-0 mt-0.5 ${
                              formData.format_type === key 
                                ? 'border-blue-500 bg-blue-500' 
                                : isDark ? 'border-slate-500 group-hover:border-slate-400' : 'border-slate-300 group-hover:border-slate-400'
                            }`}>
                              {formData.format_type === key && (
                                <i className="fas fa-check text-white text-xs"></i>
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className={`text-sm font-bold ${
                                  formData.format_type === key
                                    ? isDark ? 'text-blue-300' : 'text-blue-700'
                                    : isDark ? 'text-slate-300' : 'text-slate-700'
                                }`}>
                                  Format {key}
                                </span>
                                {config.hasCR && (
                                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                                    isDark ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-700'
                                  }`}>
                                    Criminal Record
                                  </span>
                                )}
                              </div>
                              <p className={`text-xs leading-relaxed ${
                                formData.format_type === key
                                  ? isDark ? 'text-blue-200' : 'text-blue-600'
                                  : isDark ? 'text-slate-400' : 'text-slate-600'
                              }`}>
                                {config.label}
                              </p>
                            </div>
                          </div>
                          
                          {/* Selection indicator */}
                          {formData.format_type === key && (
                            <motion.div
                              layoutId="selectedFormat"
                              className="absolute inset-0 rounded-xl border-2 border-blue-400 bg-blue-500/5 pointer-events-none"
                              initial={false}
                              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Step 2: Applicant Information */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold ${
                        isDark ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'
                      }`}>
                        2
                      </div>
                      <div>
                        <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          Applicant Information
                        </h3>
                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          Enter applicant details
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
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
                          className={`${inputClasses} ${errors.first_name ? 'border-red-500 focus:border-red-500' : ''}`}
                          placeholder="Enter first name"
                        />
                        {errors.first_name && <p className="text-red-500 text-xs mt-1 flex items-center space-x-1">
                          <i className="fas fa-exclamation-triangle text-xs"></i>
                          <span>{errors.first_name}</span>
                        </p>}
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
                          className={`${inputClasses} ${errors.last_name ? 'border-red-500 focus:border-red-500' : ''}`}
                          placeholder="Enter last name"
                        />
                        {errors.last_name && <p className="text-red-500 text-xs mt-1 flex items-center space-x-1">
                          <i className="fas fa-exclamation-triangle text-xs"></i>
                          <span>{errors.last_name}</span>
                        </p>}
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
                          className={inputClasses}
                          placeholder="Jr., Sr., III, etc."
                        />
                      </div>

                      {formatConfig.hasCR && (
                        <div className="space-y-1.5">
                          <label className={`flex items-center space-x-2 text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            <i className="fas fa-user text-xs"></i>
                            <span>Alias (if any)</span>
                          </label>
                          <input
                            type="text"
                            name="alias"
                            value={formData.alias}
                            onChange={handleInputChange}
                            className={inputClasses}
                            placeholder='e.g., alias "NICKNAME"'
                          />
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
                          min="18"
                          max="120"
                          className={`${inputClasses} ${errors.age ? 'border-red-500 focus:border-red-500' : ''}`}
                          placeholder="Enter age"
                        />
                        {errors.age && <p className="text-red-500 text-xs mt-1 flex items-center space-x-1">
                          <i className="fas fa-exclamation-triangle text-xs"></i>
                          <span>{errors.age}</span>
                        </p>}
                      </div>
                      
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
                          {CIVIL_STATUS_OPTIONS.map(status => (
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
                          className={inputClasses}
                          placeholder="Enter nationality"
                        />
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className={`flex items-center space-x-2 text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          <i className="fas fa-building text-xs"></i>
                          <span>Complete Address *</span>
                        </label>
                        <textarea
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          rows={2}
                          className={`${inputClasses} ${errors.address ? 'border-red-500 focus:border-red-500' : ''}`}
                          placeholder="Enter complete address"
                        />
                        {errors.address && <p className="text-red-500 text-xs mt-1 flex items-center space-x-1">
                          <i className="fas fa-exclamation-triangle text-xs"></i>
                          <span>{errors.address}</span>
                        </p>}
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Clearance Details */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
                        isDark ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'
                      }`}>
                        3
                      </div>
                      <div>
                        <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          Clearance Details
                        </h3>
                        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          Purpose and additional clearance information
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2 space-y-2">
                        <label className={labelClasses}>Purpose *</label>
                        <select
                          name="purpose"
                          value={formData.purpose}
                          onChange={handleInputChange}
                          className={`${inputClasses} ${errors.purpose ? 'border-red-500' : ''}`}
                        >
                          {PURPOSE_OPTIONS.map(opt => (
                            <option key={opt.name} value={opt.name}>
                              {opt.name} {opt.fee > 0 ? `(PHP ${opt.fee.toLocaleString()})` : ''}
                            </option>
                          ))}
                        </select>
                        {errors.purpose && <p className="text-red-500 text-xs mt-1">{errors.purpose}</p>}
                      </div>
                      {formData.purpose === 'Other' && (
                        <div className="md:col-span-2 space-y-2">
                          <label className={labelClasses}>Specify Purpose *</label>
                          <input
                            type="text"
                            name="custom_purpose"
                            value={formData.custom_purpose}
                            onChange={handleInputChange}
                            className={`${inputClasses} ${errors.custom_purpose ? 'border-red-500' : ''}`}
                            placeholder="Enter specific purpose"
                          />
                          {errors.custom_purpose && <p className="text-red-500 text-xs mt-1">{errors.custom_purpose}</p>}
                        </div>
                      )}
                      <div className="md:col-span-2 space-y-2">
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
                    </div>
                  </div>

                  {/* Step 4: Criminal Record Details (Conditional) */}
                  {formatConfig.hasCR && (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
                          isDark ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700'
                        }`}>
                          4
                        </div>
                        <div>
                          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            <i className="fas fa-exclamation-triangle mr-2 text-red-500"></i>
                            Criminal Record Details
                          </h3>
                          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            Add criminal case entries (you can add multiple cases)
                          </p>
                        </div>
                      </div>
                      
                      {/* Multiple Criminal Cases */}
                      {formData.criminal_cases.map((crimCase, index) => (
                        <div key={index} className={`p-4 rounded-xl border-2 ${
                          isDark ? 'bg-slate-700/50 border-red-500/30' : 'bg-red-50/50 border-red-200'
                        }`}>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className={`font-semibold text-sm ${isDark ? 'text-red-300' : 'text-red-700'}`}>
                              <i className="fas fa-folder-open mr-2"></i>
                              Case #{index + 1}
                            </h4>
                            {formData.criminal_cases.length > 1 && (
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
                          
                          <div className="grid grid-cols-1 gap-3">
                            <div className="space-y-1.5">
                              <label className={`flex items-center space-x-2 text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                <i className="fas fa-hashtag text-xs"></i>
                                <span>Crim. Case No. *</span>
                              </label>
                              <input
                                type="text"
                                value={crimCase.case_number}
                                onChange={(e) => updateCriminalCase(index, 'case_number', e.target.value)}
                                className={inputClasses}
                                placeholder="e.g., R-10705 & R-10707 Br. 3"
                              />
                            </div>
                            
                            <div className="space-y-1.5">
                              <label className={`flex items-center space-x-2 text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                <i className="fas fa-gavel text-xs"></i>
                                <span>Crime *</span>
                              </label>
                              <input
                                type="text"
                                value={crimCase.crime}
                                onChange={(e) => updateCriminalCase(index, 'crime', e.target.value)}
                                className={inputClasses}
                                placeholder="e.g., Frustrated Homicide (2 counts)"
                              />
                            </div>
                            
                            <div className="space-y-1.5">
                              <label className={`flex items-center space-x-2 text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                <i className="fas fa-calendar text-xs"></i>
                                <span>Date Info Filed *</span>
                              </label>
                              <input
                                type="date"
                                value={crimCase.date_info_filed}
                                onChange={(e) => updateCriminalCase(index, 'date_info_filed', e.target.value)}
                                className={inputClasses}
                              />
                            </div>
                            
                            <div className="space-y-1.5">
                              <label className={`flex items-center space-x-2 text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                <i className="fas fa-map-marker-alt text-xs"></i>
                                <span>Origin *</span>
                              </label>
                              <input
                                type="text"
                                value={crimCase.origin}
                                onChange={(e) => updateCriminalCase(index, 'origin', e.target.value)}
                                className={inputClasses}
                                placeholder="Tagbilaran City"
                              />
                            </div>
                            
                            <div className="space-y-1.5">
                              <label className={`flex items-center space-x-2 text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                <i className="fas fa-info-circle text-xs"></i>
                                <span>Status *</span>
                              </label>
                              <input
                                type="text"
                                value={crimCase.status}
                                onChange={(e) => updateCriminalCase(index, 'status', e.target.value)}
                                className={inputClasses}
                                placeholder="e.g., Dismissed 11/16/2001"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* Add Case Button */}
                      <button
                        type="button"
                        onClick={addCriminalCase}
                        className={`w-full py-2.5 rounded-xl border-2 border-dashed transition-all flex items-center justify-center gap-2 ${
                          isDark 
                            ? 'border-red-500/50 text-red-400 hover:bg-red-900/20 hover:border-red-400' 
                            : 'border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400'
                        }`}
                      >
                        <i className="fas fa-plus-circle"></i>
                        <span className="font-medium text-sm">Add Another Case</span>
                      </button>
                    </div>
                  )}

                  {/* Step 5: Issuance Information */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
                        isDark ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {formatConfig.hasCR ? '5' : '4'}
                      </div>
                      <div>
                        <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          Issuance Information
                        </h3>
                        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          Date and validity information for the certificate
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className={labelClasses}>Date of Issuance *</label>
                        <input
                          type="date"
                          name="date_issued"
                          value={formData.date_issued}
                          onChange={handleInputChange}
                          className={inputClasses}
                        />
                      </div>
                      <div className="space-y-2">
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
                      <div className="space-y-2">
                        <label className={labelClasses}>Valid Until</label>
                        <input
                          type="date"
                          name="validity_expiry"
                          value={formData.validity_expiry}
                          readOnly
                          className={`${inputClasses} cursor-not-allowed opacity-70`}
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
                            // Only allow numbers
                            const value = e.target.value.replace(/[^0-9]/g, '');
                            setFormData(prev => ({ ...prev, prc_id_number: value }));
                            if (errors.prc_id_number) setErrors(prev => ({ ...prev, prc_id_number: '' }));
                          }}
                          onPaste={e => {
                            const paste = e.clipboardData.getData('text');
                            if (/\D/.test(paste)) e.preventDefault();
                          }}
                          inputMode="numeric"
                          pattern="[0-9]*"
                          className={`${inputClasses} ${errors.prc_id_number ? 'border-red-500 focus:border-red-500' : ''}`}
                          placeholder="Enter O.R Number"
                        />
                        {errors.prc_id_number && <p className="text-red-500 text-xs mt-1 flex items-center space-x-1">
                          <i className="fas fa-exclamation-triangle text-xs"></i>
                          <span>{errors.prc_id_number}</span>
                        </p>}
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <label className={labelClasses}>Additional Notes (optional)</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
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
                      onClick={handleClearForm}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className={`w-full inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs font-semibold rounded-lg transition-all duration-200 ${
                        isDark 
                          ? 'bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white shadow-lg shadow-slate-900/40 hover:shadow-xl hover:shadow-slate-900/50' 
                          : 'bg-gradient-to-r from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400 text-gray-700 hover:text-gray-800 shadow-lg shadow-gray-400/30 hover:shadow-xl hover:shadow-gray-400/40'
                      }`}
                    >
                      <i className="fas fa-trash mr-2"></i>
                      Clear Form
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
