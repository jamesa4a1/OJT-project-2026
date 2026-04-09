import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ImageModal from '../components/ImageModal';
import useAutoRefresh from '../hooks/useAutoRefresh';
import { useValidation } from '../hooks/useValidation';
import { CaseUpdateSchema } from '../schemas/cases';
import Alert from '../components/ui/Alert';
import { API_BASE } from '../config/api';
import { useSocket, CASE_EVENTS } from '../hooks/useSocket';

const Editcase = () => {
  const [searchQuery, setSearchQuery] = useState({ DOCKET_NO: '', RESPONDENT: '' });
  const [caseData, setCaseData] = useState(null);
  const [allCases, setAllCases] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editedCase, setEditedCase] = useState({}); // Store edited values directly
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [indexCardImage, setIndexCardImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showFullImage, setShowFullImage] = useState(null);
  const [currentImageError, setCurrentImageError] = useState(false);
  const [showStatusField, setShowStatusField] = useState(false);
  const [isStatusFiledInCourt, setIsStatusFiledInCourt] = useState(false);
  const [isRemarksOther, setIsRemarksOther] = useState(false);
  const [isEditMRFiled, setIsEditMRFiled] = useState(false);
  const [editMRFiledBy, setEditMRFiledBy] = useState(['']);
  const [editMRFiledByType, setEditMRFiledByType] = useState(['Respondents']);
  const [editMRDateFiling, setEditMRDateFiling] = useState(['']);
  const [editMRDateResolved, setEditMRDateResolved] = useState(['']);
  const [editMRFinding, setEditMRFinding] = useState(['']);
  const [editCrimCaseNos, setEditCrimCaseNos] = useState(['']);
  const [editBranches, setEditBranches] = useState(['']);
  const [editDatesFiledInCourt, setEditDatesFiledInCourt] = useState(['']);
  const [editFinalOffenses, setEditFinalOffenses] = useState(['']);
  const navigate = useNavigate();
  const { validate, errors: validationErrors } = useValidation(CaseUpdateSchema);

  const requiresCourtInfo = (value) => {
    const normalized = String(value || '').toLowerCase().trim();
    return normalized === 'filed in court' || normalized === 'archived';
  };

  const parseList = (value) => {
    if (!value) return [];
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item || '').trim()).filter(Boolean);
      }
    } catch {}
    const text = String(value).trim();
    return text ? [text] : [];
  };

  const parseJsonOrFill = (raw, length, fallback) => {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return Array.from({ length }, (_, i) => parsed[i] || fallback);
      }
    } catch {}
    return Array.from({ length }, () => raw || fallback);
  };

  // Helper function to get proper image URL
  const getImageUrl = (indexCardPath) => {
    if (!indexCardPath || indexCardPath === 'N/A') return null;
    // If it's already a full URL (external), use as-is
    if (indexCardPath.startsWith('http://') || indexCardPath.startsWith('https://')) {
      return indexCardPath;
    }
    // Otherwise, it's a local path - prepend server URL
    return `${API_BASE}${indexCardPath}`;
  };

  // Fetch all cases
  const fetchAllCases = async () => {
    try {
      const response = await axios.get(`${API_BASE}/cases`);
      setAllCases(response.data);
    } catch (err) {
      console.error('Error fetching cases:', err);
    }
  };

  // Fetch on component mount
  useEffect(() => {
    fetchAllCases();
  }, []);

  // Auto-refresh every 5 seconds for real-time updates across PCs
  useAutoRefresh(fetchAllCases, 5000);

  // Real-time updates: auto-refresh when cases change on any PC
  useSocket(CASE_EVENTS, fetchAllCases);

  const handleChange = (e) => {
    setSearchQuery({ ...searchQuery, [e.target.name]: e.target.value });
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.DOCKET_NO && !searchQuery.RESPONDENT) {
      setError('Please enter at least one search criteria.');
      return;
    }
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/get-case`, {
        params: { docket_no: searchQuery.DOCKET_NO, respondent: searchQuery.RESPONDENT },
      });
      setCaseData(response.data);
      setError('');
    } catch {
      setError('No matching case found or an error occurred.');
      setCaseData(null);
      // Reset MR states on search failure
      setEditMRFiledBy(['']);
      setEditMRFiledByType(['Respondents']);
      setEditMRDateFiling(['']);
      setEditMRDateResolved(['']);
      setEditMRFinding(['']);
      setIsEditMRFiled(false);
    }
    setSearchPerformed(true);
    setIsLoading(false);
  };

  const handleSelectCase = (selectedCase) => {
    setCaseData([selectedCase]);
    setEditedCase({}); // Start with empty object - only store actual changes
    setSearchPerformed(true);
    setError('');
    setIndexCardImage(null);
    setImagePreview(null);
    setCurrentImageError(false); // Reset image error for new case
    // Initialise Status toggle from existing case data
    const hasStatus = selectedCase.STATUS && selectedCase.STATUS !== '';
    setShowStatusField(hasStatus);
    setIsStatusFiledInCourt(
      requiresCourtInfo(selectedCase.STATUS) || requiresCourtInfo(selectedCase.REMARKS_DECISION)
    );
    
    // Parse MR Filed arrays
    const parseMRArray = (raw, fallback) => {
      if (!raw) return [fallback];
      try { const a = JSON.parse(raw); if (Array.isArray(a)) return a.length > 0 ? a : [fallback]; } catch {}
      return [raw || fallback];
    };
    const mrFiledByArr = parseMRArray(selectedCase.MR_FILED_BY, '');
    // Parse type and name from stored values like "Complainant: John" or legacy "Complainants"
    const mrTypes = mrFiledByArr.map(v => {
      if (v.startsWith('Complainant:')) return 'Complainants';
      if (v.startsWith('Respondent:')) return 'Respondents';
      if (v === 'Complainants' || v === 'Respondents') return v;
      return '';
    });
    const mrNames = mrFiledByArr.map(v => {
      if (v.startsWith('Complainant:')) return v.replace('Complainant:', '').trim();
      if (v.startsWith('Respondent:')) return v.replace('Respondent:', '').trim();
      if (v === 'Complainants' || v === 'Respondents') return '';
      return v;
    });
    setEditMRFiledByType(mrTypes);
    setEditMRFiledBy(mrNames);
    setEditMRDateFiling(parseMRArray(selectedCase.DATE_MR_FILING, '').map(d => d?.split('T')[0] || ''));
    setEditMRDateResolved(parseMRArray(selectedCase.DATE_MR_RESOLVED, '').map(d => d?.split('T')[0] || ''));
    setEditMRFinding(parseMRArray(selectedCase.MR_FINDING, ''));
    const respondentList = parseList(selectedCase.RESPONDENT);
    const respondentCount = Math.max(1, respondentList.length);
    setEditCrimCaseNos(parseJsonOrFill(selectedCase.CRIM_CASE_NO, respondentCount, '').map((value) => value || ''));
    setEditBranches(parseJsonOrFill(selectedCase.BRANCH, respondentCount, '').map((value) => value || ''));
    setEditDatesFiledInCourt(
      parseJsonOrFill(selectedCase.DATEFILED_IN_COURT, respondentCount, '').map((value) => value?.split('T')[0] || '')
    );
    setEditFinalOffenses(parseJsonOrFill(selectedCase.FINAL_OFFENSE, respondentCount, '').map((value) => value || ''));
    
    // Auto-expand MR Filed section if any MR data exists
    const hasMRData = selectedCase.MR_FILED_BY || selectedCase.DATE_MR_FILING || selectedCase.DATE_MR_RESOLVED || selectedCase.MR_FINDING;
    setIsEditMRFiled(!!hasMRData);
    // Initialise Remarks Other from existing case data
    const isRemarks = selectedCase.REMARKS_DECISION && !['Pending', 'Dismissed', 'Provisional dismissal', 'Convicted', 'For Resolution', 'Archived'].includes(selectedCase.REMARKS_DECISION);
    setIsRemarksOther(isRemarks);
    // Scroll to the edit form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFieldChange = (field, value) => {
    setEditedCase((prev) => ({ ...prev, [field]: value }));
    setError('');
    setSuccess('');
    
    // Handle special logic for REMARKS_DECISION field
    if (field === 'REMARKS_DECISION') {
      const isOther = !['Pending', 'Dismissed', 'Provisional dismissal', 'Convicted', 'For Resolution', 'Archived'].includes(value);
      setIsRemarksOther(isOther);
      setIsStatusFiledInCourt(requiresCourtInfo(value));
      if (String(value).toLowerCase() === 'archived') {
        setShowStatusField(true);
        setEditedCase((prev) => ({ ...prev, STATUS: 'Archived' }));
      }
    }
    
    // Handle special logic for STATUS field
    if (field === 'STATUS') {
      setIsStatusFiledInCourt(requiresCourtInfo(value));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      setIndexCardImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setIndexCardImage(null);
    setImagePreview(null);
  };

  const handleSave = async () => {
    if (!caseData || caseData.length === 0) {
      setError('No case selected to update.');
      return;
    }

    const originalCase = caseData[0];

    // Only send fields that were explicitly changed by the user
    const changedFields = { ...editedCase };
    delete changedFields.id;
    delete changedFields.INDEX_CARDS;

    if (Object.keys(changedFields).length === 0 && !indexCardImage) {
      setError('No changes detected. Please modify at least one field.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate with Zod
      const validatedData = await validate({
        id: originalCase.id,
        updated_fields: changedFields,
      });

      if (!validatedData) {
        setIsLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append('id', validatedData.id);

      if (indexCardImage) {
        formData.append('indexCardImage', indexCardImage);
      }

      // Add validated changed fields
      Object.keys(validatedData.updated_fields).forEach((key) => {
        formData.append(key, validatedData.updated_fields[key]);
      });

      // Add MR fields as JSON arrays
      formData.append('MR_FILED_BY', JSON.stringify(editMRFiledBy.map((name, i) => {
        const type = editMRFiledByType[i] || '';
        if (!type && !name) return '';
        if (type === 'Complainants') return name ? `Complainant: ${name}` : '';
        if (type === 'Respondents') return name ? `Respondent: ${name}` : '';
        return name;
      }).filter(v => v.trim() !== '')));
      formData.append('DATE_MR_FILING', JSON.stringify(editMRDateFiling));
      formData.append('DATE_MR_RESOLVED', JSON.stringify(editMRDateResolved));
      formData.append('MR_FINDING', JSON.stringify(editMRFinding.filter(v => v.trim() !== '')));
      formData.append('CRIM_CASE_NO', JSON.stringify(editCrimCaseNos.map((value) => value || '')));
      formData.append('BRANCH', JSON.stringify(editBranches.map((value) => value || '')));
      formData.append('DATEFILED_IN_COURT', JSON.stringify(editDatesFiledInCourt.map((value) => value || '')));
      formData.append('FINAL_OFFENSE', JSON.stringify(editFinalOffenses.map((value) => value || '')));

      console.log('Sending update with id:', validatedData.id);
      console.log('Changed fields:', validatedData.updated_fields);
      console.log('Has image:', !!indexCardImage);

      const response = await axios.post(`${API_BASE}/update-case-with-image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      console.log('Response:', response.data);
      setSuccess('✅ Case updated successfully!');
      setError(''); // Clear any previous errors

      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Navigate after delay to show success message
      setTimeout(() => {
        navigate(`/details/${originalCase.DOCKET_NO}`);
      }, 2000);
    } catch (error) {
      console.error('Error updating case:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to update case. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = `w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white
                      focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20
                      transition-all duration-300 outline-none text-slate-700`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/20 to-slate-100 py-8 px-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 border border-amber-200 mb-4">
            <i className="fas fa-edit text-amber-600"></i>
            <span className="text-amber-700 font-medium text-sm">Edit Case</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-3">Edit Case Details</h1>
          <p className="text-slate-500">Search for a case and modify its information</p>
        </div>

        {/* Back Button */}
        <motion.button
          whileHover={{ x: -5 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 px-4 py-2 mb-6 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all duration-300 shadow-sm cursor-pointer"
        >
          <i className="fas fa-arrow-left"></i>
          <span className="font-medium">Back to Menu</span>
        </motion.button>

        {/* Search Form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden mb-8"
        >
          <div className="p-8">
            <form onSubmit={handleSearch} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    <i className="fas fa-hashtag text-amber-500 mr-2"></i>Docket Number
                  </label>
                  <input
                    type="text"
                    name="DOCKET_NO"
                    value={searchQuery.DOCKET_NO}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Enter docket number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    <i className="fas fa-user-tag text-amber-500 mr-2"></i>Respondent
                  </label>
                  <input
                    type="text"
                    name="RESPONDENT"
                    value={searchQuery.RESPONDENT}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Enter respondent name"
                  />
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3"
                >
                  <i className="fas fa-exclamation-circle"></i>
                  <span>{error}</span>
                </motion.div>
              )}

              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full py-4 rounded-xl font-semibold text-lg shadow-lg transition-all duration-300 border-none cursor-pointer flex items-center justify-center gap-3
                  ${isLoading ? 'bg-slate-400' : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-amber-500/30'}`}
              >
                {isLoading ? (
                  <>
                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-search"></i>
                    <span>Search Case</span>
                  </>
                )}
              </motion.button>
            </form>
          </div>
        </motion.div>

        {/* Edit Form */}
        {searchPerformed && caseData && caseData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-xl border border-amber-200 overflow-hidden mb-6"
          >
            <div className="p-6 border-b border-amber-100 bg-gradient-to-r from-amber-50 to-white">
              <h3 className="font-bold text-amber-800 flex items-center gap-2 text-xl">
                <i className="fas fa-edit"></i>
                Editing Case: {caseData[0].DOCKET_NO}
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Modify any field and click save to update
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
              className="p-6"
            >
              {/* Case Identification Strip */}
              <div className="mb-6 rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-amber-50/40 p-4 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="rounded-xl border border-slate-200 bg-white/80 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-1">
                      Docket Number
                    </p>
                    <p className="text-sm font-semibold text-slate-800 break-words">
                      {caseData[0].DOCKET_NO || 'N/A'}
                    </p>
                  </div>
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700 mb-1">
                      Criminal Case No.
                    </p>
                    <p className="text-sm font-semibold text-emerald-900 break-words">
                      {caseData[0].CRIM_CASE_NO || 'Not provided'}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white/80 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-1">
                      Current Status
                    </p>
                    <p className="text-sm font-semibold text-slate-800 break-words">
                      {caseData[0].STATUS || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Success Alert */}
              {success && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="mb-6 p-5 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 shadow-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                        <i className="fas fa-check text-white text-xl"></i>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-green-800 mb-1">Success!</h4>
                      <p className="text-green-700 font-medium">{success}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <i className="fas fa-sync-alt text-green-600"></i>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Error Alert */}
              {error && <Alert type="error" message={error} className="mb-6" />}

              {/* Case Information Section */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <i className="fas fa-info-circle text-blue-500"></i>
                  Case Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      <i className="fas fa-hashtag text-amber-500 mr-2"></i>Docket Number
                    </label>
                    <input
                      type="text"
                      value={
                        editedCase.DOCKET_NO !== undefined
                          ? editedCase.DOCKET_NO
                          : caseData[0].DOCKET_NO || ''
                      }
                      onChange={(e) => handleFieldChange('DOCKET_NO', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
                      placeholder="Enter docket number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      <i className="fas fa-calendar text-amber-500 mr-2"></i>Date Filed
                    </label>
                    <input
                      type="date"
                      value={
                        editedCase.DATE_FILED !== undefined
                          ? editedCase.DATE_FILED
                          : caseData[0].DATE_FILED?.split('T')[0] || ''
                      }
                      onChange={(e) => handleFieldChange('DATE_FILED', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      <i className="fas fa-user text-amber-500 mr-2"></i>Complainant
                    </label>
                    <input
                      type="text"
                      value={
                        editedCase.COMPLAINANT !== undefined
                          ? editedCase.COMPLAINANT
                          : caseData[0].COMPLAINANT || ''
                      }
                      onChange={(e) => handleFieldChange('COMPLAINANT', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
                      placeholder="Enter complainant name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      <i className="fas fa-user-tag text-amber-500 mr-2"></i>Respondent
                    </label>
                    <input
                      type="text"
                      value={
                        editedCase.RESPONDENT !== undefined
                          ? editedCase.RESPONDENT
                          : caseData[0].RESPONDENT || ''
                      }
                      onChange={(e) => handleFieldChange('RESPONDENT', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
                      placeholder="Enter respondent name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      <i className="fas fa-map-marker-alt text-amber-500 mr-2"></i>Address of
                      Respondent
                    </label>
                    {(() => {
                      const rawRespondents = editedCase.RESPONDENT !== undefined
                        ? editedCase.RESPONDENT
                        : caseData[0].RESPONDENT || '';
                      const rawAddresses = editedCase.ADDRESS_OF_RESPONDENT !== undefined
                        ? editedCase.ADDRESS_OF_RESPONDENT
                        : caseData[0].ADDRESS_OF_RESPONDENT || '';
                      let respondentList = [];
                      try { respondentList = JSON.parse(rawRespondents); } catch { respondentList = rawRespondents ? [rawRespondents] : []; }
                      let addressList = [];
                      try { addressList = JSON.parse(rawAddresses); } catch { addressList = rawAddresses ? [rawAddresses] : []; }
                      const count = Math.max(respondentList.length, 1);
                      return Array.from({ length: count }).map((_, i) => (
                        <div key={i} className={i > 0 ? 'mt-2' : ''}>
                          {count > 1 && (
                            <span className="text-xs text-slate-500 mb-1 block">
                              {respondentList[i] ? `${respondentList[i]}'s address` : `Respondent ${i + 1} address`}
                            </span>
                          )}
                          <input
                            type="text"
                            value={addressList[i] || ''}
                            onChange={(e) => {
                              const updated = [...addressList];
                              updated[i] = e.target.value;
                              handleFieldChange('ADDRESS_OF_RESPONDENT', JSON.stringify(updated));
                            }}
                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
                            placeholder={`Enter address${count > 1 ? ` for ${respondentList[i] || `respondent ${i + 1}`}` : ''}`}
                          />
                        </div>
                      ));
                    })()}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      <i className="fas fa-exclamation-triangle text-amber-500 mr-2"></i>Offense
                    </label>
                    <input
                      type="text"
                      value={
                        editedCase.OFFENSE !== undefined
                          ? editedCase.OFFENSE
                          : caseData[0].OFFENSE || ''
                      }
                      onChange={(e) => handleFieldChange('OFFENSE', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
                      placeholder="Enter offense"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      <i className="fas fa-calendar-day text-amber-500 mr-2"></i>Date of Commission
                    </label>
                    <input
                      type="date"
                      value={
                        editedCase.DATE_OF_COMMISSION !== undefined
                          ? editedCase.DATE_OF_COMMISSION
                          : caseData[0].DATE_OF_COMMISSION?.split('T')[0] || ''
                      }
                      onChange={(e) => handleFieldChange('DATE_OF_COMMISSION', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Resolution Section */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <i className="fas fa-gavel text-green-500"></i>
                  Resolution Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      <i className="fas fa-calendar-check text-amber-500 mr-2"></i>Date Resolved
                    </label>
                    <input
                      type="date"
                      value={
                        editedCase.DATE_RESOLVED !== undefined
                          ? editedCase.DATE_RESOLVED
                          : caseData[0].DATE_RESOLVED?.split('T')[0] || ''
                      }
                      onChange={(e) => handleFieldChange('DATE_RESOLVED', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      <i className="fas fa-user-tie text-amber-500 mr-2"></i>Resolving Prosecutor
                    </label>
                    <input
                      type="text"
                      value={
                        editedCase.RESOLVING_PROSECUTOR !== undefined
                          ? editedCase.RESOLVING_PROSECUTOR
                          : caseData[0].RESOLVING_PROSECUTOR || ''
                      }
                      onChange={(e) => handleFieldChange('RESOLVING_PROSECUTOR', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
                      placeholder="Enter prosecutor name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      <i className="fas fa-clipboard-check text-amber-500 mr-2"></i>Recommendation
                    </label>
                    <select
                      value={
                        editedCase.REMARKS_DECISION !== undefined
                          ? editedCase.REMARKS_DECISION || 'Pending'
                          : caseData[0].REMARKS_DECISION || 'Pending'
                      }
                      onChange={(e) => handleFieldChange('REMARKS_DECISION', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Dismissed">Dismissed</option>
                      <option value="Provisional dismissal">Provisional dismissal</option>
                      <option value="Convicted">Convicted</option>
                      <option value="For Resolution">For Resolution</option>
                      <option value="Archived">Archived</option>
                      <option value="Other">Other (Custom)</option>
                    </select>
                    {isRemarksOther && (
                      <input
                        type="text"
                        value={
                          editedCase.REMARKS_DECISION !== undefined
                            ? editedCase.REMARKS_DECISION
                            : caseData[0].REMARKS_DECISION || ''
                        }
                        onChange={(e) => handleFieldChange('REMARKS_DECISION', e.target.value)}
                        className="w-full px-4 py-3 mt-2 rounded-xl border-2 border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all font-semibold"
                        placeholder="Enter custom remarks decision"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => setShowStatusField(v => !v)}
                      className={`w-full mt-2 flex items-center justify-center gap-1 px-2.5 py-2 rounded-lg text-xs font-semibold border transition-all duration-200 cursor-pointer ${
                        showStatusField
                          ? 'bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600'
                          : 'bg-white text-emerald-600 border-emerald-400 hover:bg-emerald-50'
                      }`}
                    >
                      <i className={`fas ${showStatusField ? 'fa-minus' : 'fa-plus'} text-xs`}></i>
                      New Status
                    </button>
                    {showStatusField && (
                      <div className="mt-2">
                        <label className="text-xs font-bold text-emerald-700 mb-1 flex items-center gap-1.5">
                          <i className="fas fa-tasks text-emerald-500"></i>
                          New Status
                        </label>
                        <select
                          value={
                            editedCase.STATUS !== undefined
                              ? editedCase.STATUS || 'Pending'
                              : caseData[0].STATUS || 'Pending'
                          }
                          onChange={(e) => {
                            handleFieldChange('STATUS', e.target.value);
                            setIsStatusFiledInCourt(requiresCourtInfo(e.target.value));
                          }}
                          className="w-full px-4 py-3 rounded-xl border-2 border-emerald-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all font-semibold"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Dismissed">Dismissed</option>
                          <option value="Provisional dismissal">Provisional dismissal</option>
                          <option value="Convicted">Convicted</option>
                          <option value="For Resolution">For Resolution</option>
                          <option value="Archived">Archived</option>
                          <option value="Filed in Court">Filed in Court</option>
                          <option value="Other">Other (Custom)</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      <i className="fas fa-balance-scale text-amber-500 mr-2"></i>Penalty
                    </label>
                    <input
                      type="text"
                      value={
                        editedCase.PENALTY !== undefined
                          ? editedCase.PENALTY
                          : caseData[0].PENALTY || ''
                      }
                      onChange={(e) => handleFieldChange('PENALTY', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
                      placeholder="Enter penalty"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      <i className="fas fa-calendar-check text-amber-500 mr-2"></i>Decision Date
                    </label>
                    <input
                      type="date"
                      value={
                        editedCase.DECISION_DATE !== undefined
                          ? editedCase.DECISION_DATE
                          : caseData[0].DECISION_DATE ? new Date(caseData[0].DECISION_DATE).toISOString().split('T')[0] : ''
                      }
                      onChange={(e) => handleFieldChange('DECISION_DATE', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Court Information Section — shown for every respondent */}
              <div className={`mb-3 ${isStatusFiledInCourt ? 'opacity-100' : 'opacity-100'}`}>
                <div className="bg-emerald-50/40 rounded-lg border border-emerald-100 p-2">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <h4 className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 uppercase tracking-wide">
                      <i className="fas fa-landmark text-emerald-600"></i>
                      Court Information
                    </h4>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
                      {isStatusFiledInCourt ? 'Status-linked' : 'Always visible'}
                    </span>
                  </div>

                  {(() => {
                    const respondentList = parseList(editedCase.RESPONDENT !== undefined ? editedCase.RESPONDENT : (caseData?.[0]?.RESPONDENT || ''));
                    const rowCount = Math.max(respondentList.length, editCrimCaseNos.length, editBranches.length, editDatesFiledInCourt.length, editFinalOffenses.length, 1);
                    return Array.from({ length: rowCount }).map((_, index) => (
                      <div key={index} className={`rounded-md border border-emerald-100 bg-white/80 p-2 ${index > 0 ? 'mt-2' : ''}`}>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">
                            {respondentList[index] ? `${index + 1}. ${respondentList[index]}` : `Respondent ${index + 1}`}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">
                              Criminal Case No.
                            </label>
                            <div className="relative">
                              <i className="fas fa-gavel absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]"></i>
                              <input
                                type="text"
                                value={editCrimCaseNos[index] || ''}
                                onChange={(e) => {
                                  const updated = [...editCrimCaseNos];
                                  updated[index] = e.target.value;
                                  setEditCrimCaseNos(updated);
                                }}
                                className="w-full pl-7 pr-2 py-1.5 rounded border border-slate-200 text-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 transition-all font-medium bg-white"
                                placeholder="Ex. CRIM-2024-001"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">
                              Branch
                            </label>
                            <div className="relative">
                              <i className="fas fa-building absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]"></i>
                              <input
                                type="text"
                                value={editBranches[index] || ''}
                                onChange={(e) => {
                                  const updated = [...editBranches];
                                  updated[index] = e.target.value;
                                  setEditBranches(updated);
                                }}
                                className="w-full pl-7 pr-2 py-1.5 rounded border border-slate-200 text-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 transition-all font-medium bg-white"
                                placeholder="Ex. Branch 1"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">
                              Date Filed
                            </label>
                            <div className="relative">
                              <input
                                type="date"
                                value={editDatesFiledInCourt[index] || ''}
                                onChange={(e) => {
                                  const updated = [...editDatesFiledInCourt];
                                  updated[index] = e.target.value;
                                  setEditDatesFiledInCourt(updated);
                                }}
                                className="w-full px-2 py-1.5 rounded border border-slate-200 text-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 transition-all font-medium bg-white"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">
                              Final Offense
                            </label>
                            <div className="relative">
                              <i className="fas fa-exclamation-circle absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]"></i>
                              <input
                                type="text"
                                value={editFinalOffenses[index] || ''}
                                onChange={(e) => {
                                  const updated = [...editFinalOffenses];
                                  updated[index] = e.target.value;
                                  setEditFinalOffenses(updated);
                                }}
                                className="w-full pl-7 pr-2 py-1.5 rounded border border-slate-200 text-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 transition-all font-medium bg-white"
                                placeholder="Final offense"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* MR Filed Section */}
              <div className="mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <button
                    type="button"
                    onClick={() => setIsEditMRFiled(v => !v)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border-2 transition-all duration-200 cursor-pointer ${
                      isEditMRFiled
                        ? 'bg-amber-500 text-white border-amber-500 hover:bg-amber-600'
                        : 'bg-white text-amber-600 border-amber-400 hover:bg-amber-50'
                    }`}
                  >
                    <i className={`fas ${isEditMRFiled ? 'fa-chevron-up' : 'fa-chevron-down'} text-xs`}></i>
                    MR Filed
                  </button>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                    <i className="fas fa-folder-open text-amber-500 mr-1.5"></i>Optional Fields
                  </span>
                </div>

                {isEditMRFiled && (
                  <div className="p-4 rounded-2xl border-2 border-amber-200 bg-amber-50/40">
                    <div className="flex items-center gap-2 mb-3">
                      <i className="fas fa-folder-open text-amber-500"></i>
                      <span className="text-[11px] font-bold uppercase tracking-widest text-amber-700">MR Filed Information</span>
                    </div>
                    <div className="flex gap-3 mb-1.5 px-0.5">
                      <label className="flex-[2] text-[11px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">
                        <i className="fas fa-user text-amber-500 mr-1.5"></i>MR Filed By
                      </label>
                      <label className="flex-1 text-[11px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">
                        <i className="fas fa-calendar-alt text-amber-500 mr-1.5"></i>Date of MR Filing
                      </label>
                      <label className="flex-1 text-[11px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">
                        <i className="fas fa-calendar-check text-amber-500 mr-1.5"></i>Date MR Resolved
                      </label>
                      <label className="flex-1 text-[11px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">
                        <i className="fas fa-search text-amber-500 mr-1.5"></i>Finding
                      </label>
                      <span className="w-9 flex-shrink-0"></span>
                    </div>
                    {editMRFiledBy.map((_, mrIndex) => (
                      <div key={mrIndex} className={`flex gap-3 ${mrIndex > 0 ? 'mt-2' : ''}`}>
                        <div className="flex-[2] flex gap-2">
                          <select
                            value={editMRFiledByType[mrIndex] || 'Respondents'}
                            onChange={(e) => { const u = [...editMRFiledByType]; u[mrIndex] = e.target.value; setEditMRFiledByType(u); }}
                            className="w-[130px] flex-shrink-0 px-3 py-2.5 rounded-xl border-2 border-amber-200 bg-white text-slate-800 text-sm font-medium focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 focus:outline-none transition-all"
                          >
                            <option value="Respondents">Respondents</option>
                            <option value="Complainants">Complainants</option>
                          </select>
                          <input
                            type="text"
                            value={editMRFiledBy[mrIndex] || ''}
                            title={editMRFiledBy[mrIndex] || ''}
                            onChange={(e) => { const u = [...editMRFiledBy]; u[mrIndex] = e.target.value; setEditMRFiledBy(u); }}
                            placeholder={(editMRFiledByType[mrIndex] || 'Respondents') === 'Complainants' ? 'Enter complainant name' : 'Enter respondent name'}
                            className="flex-1 px-3 py-2.5 rounded-xl border-2 border-amber-200 bg-white text-slate-800 text-sm font-medium placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 focus:outline-none transition-all"
                          />
                        </div>
                        <input
                          type="date"
                          value={editMRDateFiling[mrIndex] || ''}
                          onChange={(e) => { const u = [...editMRDateFiling]; u[mrIndex] = e.target.value; setEditMRDateFiling(u); }}
                          className="flex-1 px-4 py-2.5 rounded-xl border-2 border-amber-200 bg-white text-slate-800 text-sm font-medium focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 focus:outline-none transition-all"
                        />
                        <input
                          type="date"
                          value={editMRDateResolved[mrIndex] || ''}
                          onChange={(e) => { const u = [...editMRDateResolved]; u[mrIndex] = e.target.value; setEditMRDateResolved(u); }}
                          className="flex-1 px-4 py-2.5 rounded-xl border-2 border-amber-200 bg-white text-slate-800 text-sm font-medium focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 focus:outline-none transition-all"
                        />
                        <select
                          value={editMRFinding[mrIndex] || ''}
                          onChange={(e) => { const u = [...editMRFinding]; u[mrIndex] = e.target.value; setEditMRFinding(u); }}
                          className="flex-1 px-4 py-2.5 rounded-xl border-2 border-amber-200 bg-white text-slate-800 text-sm font-medium focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 focus:outline-none transition-all"
                        >
                          <option value="">-- Select --</option>
                          <option value="Granted">Granted</option>
                          <option value="Partially Granted">Partially Granted</option>
                          <option value="Denied">Denied</option>
                        </select>
                        {editMRFiledBy.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditMRFiledBy(editMRFiledBy.filter((_, i) => i !== mrIndex));
                              setEditMRFiledByType(editMRFiledByType.filter((_, i) => i !== mrIndex));
                              setEditMRDateFiling(editMRDateFiling.filter((_, i) => i !== mrIndex));
                              setEditMRDateResolved(editMRDateResolved.filter((_, i) => i !== mrIndex));
                              setEditMRFinding(editMRFinding.filter((_, i) => i !== mrIndex));
                            }}
                            className="w-9 flex-shrink-0 rounded-lg border-2 bg-red-50 border-red-200 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors cursor-pointer"
                            title="Remove MR entry"
                          >
                            <i className="fas fa-minus text-xs"></i>
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setEditMRFiledBy([...editMRFiledBy, '']);
                        setEditMRFiledByType([...editMRFiledByType, 'Respondents']);
                        setEditMRDateFiling([...editMRDateFiling, '']);
                        setEditMRDateResolved([...editMRDateResolved, '']);
                        setEditMRFinding([...editMRFinding, '']);
                      }}
                      className="mt-2 flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-lg transition-colors border-none cursor-pointer bg-amber-50 text-amber-600 hover:bg-amber-100"
                    >
                      <i className="fas fa-plus text-xs"></i>Add MR Entry
                    </button>
                  </div>
                )}
              </div>

              {/* Index Card Section */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <i className="fas fa-image text-blue-500"></i>
                  Index Card Image
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Current Image - Left Side */}
                  {caseData[0].INDEX_CARDS && caseData[0].INDEX_CARDS !== 'N/A' ? (
                    <div>
                      <p className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
                        <i className="fas fa-image text-blue-500 mr-1"></i>Current Image
                      </p>
                      <div className="relative w-full h-48 rounded-lg border-2 border-slate-300 bg-slate-50 p-2 flex items-center justify-center overflow-hidden">
                        {!currentImageError ? (
                          <>
                            <img
                              src={getImageUrl(caseData[0].INDEX_CARDS)}
                              alt="Current Index Card"
                              onClick={() => setShowFullImage(caseData[0].INDEX_CARDS)}
                              className="max-w-full max-h-full object-contain cursor-pointer hover:opacity-90 transition-opacity shadow-md rounded"
                              onError={() => setCurrentImageError(true)}
                            />
                            <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 bg-black/70 text-white text-[10px] rounded">
                              <i className="fas fa-search-plus mr-0.5"></i> Full size
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center p-4 text-center">
                            <i className="fas fa-exclamation-triangle text-2xl mb-2 text-amber-400"></i>
                            <p className="font-semibold text-slate-600 text-xs mb-1">Image not loading</p>
                            <p className="text-[10px] text-slate-500">Upload new image</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center h-48">
                      <p className="text-xs text-slate-500 text-center">
                        <i className="fas fa-image text-slate-400 mr-1"></i>
                        No image stored
                      </p>
                    </div>
                  )}

                  {/* Upload / New Preview - Right Side */}
                  <div>
                    {imagePreview ? (
                      <div>
                        <p className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
                          <i className="fas fa-image text-amber-500 mr-1"></i>New Preview
                        </p>
                        <div className="relative w-full h-48 rounded-lg border-2 border-amber-300 bg-white p-2 flex items-center justify-center overflow-hidden">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            onClick={() => setShowFullImage(imagePreview)}
                            className="max-w-full max-h-full object-contain cursor-pointer hover:opacity-90 transition-opacity rounded"
                          />
                          <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 bg-black/60 text-white text-[10px] rounded">
                            <i className="fas fa-search-plus mr-0.5"></i> Full size
                          </div>
                          <button
                            type="button"
                            onClick={removeImage}
                            className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 hover:bg-red-600 text-white 
                                     rounded-md shadow-lg transition-colors cursor-pointer text-xs flex items-center justify-center z-10"
                            title="Remove image"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label
                        className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed 
                                       border-slate-300 rounded-lg hover:border-amber-500 hover:bg-amber-50/30 
                                       transition-all duration-300 cursor-pointer group"
                      >
                        <div className="flex flex-col items-center justify-center">
                          <i className="fas fa-cloud-upload-alt text-2xl text-slate-400 group-hover:text-amber-500 mb-2 transition-colors"></i>
                          <p className="text-sm text-slate-600 group-hover:text-amber-600 font-semibold">
                            {caseData[0].INDEX_CARDS && caseData[0].INDEX_CARDS !== 'N/A'
                              ? 'Upload New'
                              : 'Upload Image'}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">PNG, JPG, JPEG</p>
                          <p className="text-[10px] text-slate-400">Max 5MB</p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/png,image/jpeg,image/jpg"
                          onChange={handleImageChange}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 border-t border-slate-200">
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 py-4 rounded-xl font-semibold text-lg shadow-lg transition-all duration-300 
                           bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:shadow-xl
                           disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {isLoading ? (
                    <>
                      <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save"></i>
                      <span>Save Changes</span>
                    </>
                  )}
                </motion.button>

                <motion.button
                  type="button"
                  onClick={() => {
                    setCaseData(null);
                    setSearchPerformed(false);
                    setEditedCase({});
                    setIndexCardImage(null);
                    setImagePreview(null);
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-8 py-4 rounded-xl font-semibold text-lg shadow-lg transition-all duration-300 
                           bg-slate-500 hover:bg-slate-600 text-white"
                >
                  <i className="fas fa-times mr-2"></i>
                  Cancel
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}

        {searchPerformed && (!caseData || caseData.length === 0) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-3xl shadow-xl border border-slate-200 p-12 text-center"
          >
            <i className="fas fa-folder-open text-4xl text-slate-300 mb-4"></i>
            <p className="text-slate-500">No cases found matching your search criteria.</p>
          </motion.div>
        )}

        {/* Display All Cases */}
        {!searchPerformed && allCases.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden"
          >
            <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-amber-50 to-slate-50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <i className="fas fa-list text-amber-500"></i>
                All Available Cases ({allCases.length})
              </h2>
              <p className="text-sm text-slate-500 mt-1">Click on any case to edit its details</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto">
                {allCases.map((caseItem, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectCase(caseItem)}
                    className="p-4 rounded-xl border-2 border-slate-200 hover:border-amber-400 
                             bg-gradient-to-br from-white to-slate-50 hover:from-amber-50 hover:to-white
                             cursor-pointer transition-all duration-300 shadow-sm hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                          <i className="fas fa-file-alt text-amber-600 text-sm"></i>
                        </div>
                        <span className="text-xs font-semibold text-amber-600 uppercase tracking-wide">
                          Case #{idx + 1}
                        </span>
                      </div>
                      <i className="fas fa-chevron-right text-slate-400 text-sm"></i>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-slate-500 font-medium">Docket Number</p>
                        <p className="text-sm font-bold text-slate-800 truncate">
                          {caseItem.DOCKET_NO}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-medium">Respondent</p>
                        <p className="text-sm font-semibold text-slate-700 truncate">
                          {caseItem.RESPONDENT || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-medium">Date Filed</p>
                        <p className="text-xs text-slate-600">{caseItem.DATE_FILED || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <button
                        className="w-full py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-600 
                                       text-white font-medium text-sm transition-colors flex items-center 
                                       justify-center gap-2"
                      >
                        <i className="fas fa-edit"></i>
                        <span>Edit This Case</span>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Professional Image Modal */}
      <ImageModal
        isOpen={showFullImage !== null}
        onClose={() => setShowFullImage(null)}
        imageUrl={
          showFullImage
            ? showFullImage.startsWith('data:')
              ? showFullImage
              : getImageUrl(showFullImage)
            : ''
        }
        imageName={
          caseData && caseData[0]?.DOCKET_NO
            ? `Index-Card-${caseData[0].DOCKET_NO}.jpg`
            : 'index-card.jpg'
        }
      />
    </div>
  );
};

export default Editcase;
