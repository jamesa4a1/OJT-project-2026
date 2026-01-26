import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ImageModal from '../components/ImageModal';
import { useValidation } from '../hooks/useValidation';
import { CaseUpdateSchema } from '../schemas/cases';
import Alert from '../components/ui/Alert';

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
  const navigate = useNavigate();
  const { validate, errors: validationErrors } = useValidation(CaseUpdateSchema);

  // Helper function to get proper image URL
  const getImageUrl = (indexCardPath) => {
    if (!indexCardPath || indexCardPath === 'N/A') return null;
    // If it's already a full URL (external), use as-is
    if (indexCardPath.startsWith('http://') || indexCardPath.startsWith('https://')) {
      return indexCardPath;
    }
    // Otherwise, it's a local path - prepend server URL
    return `http://localhost:5000${indexCardPath}`;
  };

  // Fetch all cases on component mount
  useEffect(() => {
    const fetchAllCases = async () => {
      try {
        const response = await axios.get('http://localhost:5000/cases');
        setAllCases(response.data);
      } catch (err) {
        console.error('Error fetching cases:', err);
      }
    };
    fetchAllCases();
  }, []);

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
      const response = await axios.get('http://localhost:5000/get-case', {
        params: { docket_no: searchQuery.DOCKET_NO, respondent: searchQuery.RESPONDENT },
      });
      setCaseData(response.data);
      setError('');
    } catch (err) {
      setError('No matching case found or an error occurred.');
      setCaseData(null);
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
    // Scroll to the edit form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFieldChange = (field, value) => {
    setEditedCase((prev) => ({ ...prev, [field]: value }));
    setError('');
    setSuccess('');
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

      console.log('Sending update with id:', validatedData.id);
      console.log('Changed fields:', validatedData.updated_fields);
      console.log('Has image:', !!indexCardImage);

      const response = await axios.post('http://localhost:5000/update-case-with-image', formData, {
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
                    <input
                      type="text"
                      value={
                        editedCase.ADDRESS_OF_RESPONDENT !== undefined
                          ? editedCase.ADDRESS_OF_RESPONDENT
                          : caseData[0].ADDRESS_OF_RESPONDENT || ''
                      }
                      onChange={(e) => handleFieldChange('ADDRESS_OF_RESPONDENT', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
                      placeholder="Enter respondent address"
                    />
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
                      <i className="fas fa-clipboard-check text-amber-500 mr-2"></i>Decision
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
                      <option value="Convicted">Convicted</option>
                    </select>
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
                </div>
              </div>

              {/* Court Information Section */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <i className="fas fa-landmark text-purple-500"></i>
                  Court Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      <i className="fas fa-gavel text-amber-500 mr-2"></i>Criminal Case Number
                    </label>
                    <input
                      type="text"
                      value={
                        editedCase.CRIM_CASE_NO !== undefined
                          ? editedCase.CRIM_CASE_NO
                          : caseData[0].CRIM_CASE_NO || ''
                      }
                      onChange={(e) => handleFieldChange('CRIM_CASE_NO', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
                      placeholder="Enter criminal case number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      <i className="fas fa-building text-amber-500 mr-2"></i>Branch
                    </label>
                    <input
                      type="text"
                      value={
                        editedCase.BRANCH !== undefined
                          ? editedCase.BRANCH
                          : caseData[0].BRANCH || ''
                      }
                      onChange={(e) => handleFieldChange('BRANCH', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
                      placeholder="Enter court branch"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      <i className="fas fa-landmark text-amber-500 mr-2"></i>Date Filed in Court
                    </label>
                    <input
                      type="date"
                      value={
                        editedCase.DATEFILED_IN_COURT !== undefined
                          ? editedCase.DATEFILED_IN_COURT
                          : caseData[0].DATEFILED_IN_COURT?.split('T')[0] || ''
                      }
                      onChange={(e) => handleFieldChange('DATEFILED_IN_COURT', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Index Card Section */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <i className="fas fa-image text-blue-500"></i>
                  Index Card Image
                </h4>

                {caseData[0].INDEX_CARDS && caseData[0].INDEX_CARDS !== 'N/A' ? (
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-slate-700 mb-2">
                      <i className="fas fa-image text-blue-500 mr-2"></i>Current Image:
                    </p>
                    <div className="relative w-full min-h-[300px] rounded-xl border-2 border-slate-300 bg-slate-50 p-4 flex items-center justify-center">
                      {!currentImageError ? (
                        <>
                          <img
                            src={getImageUrl(caseData[0].INDEX_CARDS)}
                            alt="Current Index Card"
                            onClick={() => setShowFullImage(caseData[0].INDEX_CARDS)}
                            className="max-w-full max-h-[400px] object-contain cursor-pointer hover:opacity-90 transition-opacity shadow-lg rounded"
                            onError={() => setCurrentImageError(true)}
                          />
                          <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-black/70 text-white text-xs rounded-lg">
                            <i className="fas fa-search-plus mr-1"></i> Click to view full size
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-8 text-slate-400">
                          <i className="fas fa-exclamation-triangle text-4xl mb-3 text-amber-400"></i>
                          <p className="font-semibold text-slate-600 mb-2">Image not loading</p>
                          <p className="text-xs text-slate-500 text-center">
                            The stored path may be invalid.
                            <br />
                            Upload a new image to fix this.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mb-4 p-4 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
                    <p className="text-sm text-slate-500 text-center">
                      <i className="fas fa-image text-slate-400 mr-2"></i>
                      No image currently stored for this case
                    </p>
                  </div>
                )}

                {imagePreview && (
                  <div className="mb-4 relative">
                    <p className="text-sm font-semibold text-slate-700 mb-2">
                      <i className="fas fa-image text-amber-500 mr-2"></i>New Image Preview:
                    </p>
                    <img
                      src={imagePreview}
                      alt="Preview"
                      onClick={() => setShowFullImage(imagePreview)}
                      className="w-full max-h-60 object-contain rounded-xl border-2 border-amber-300 cursor-pointer hover:opacity-90 transition-opacity"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white 
                               rounded-lg shadow-lg transition-colors cursor-pointer font-medium z-10"
                    >
                      <i className="fas fa-times mr-2"></i> Remove
                    </button>
                    <div className="absolute bottom-2 left-2 px-3 py-1.5 bg-black/60 text-white text-xs rounded-lg">
                      <i className="fas fa-search-plus mr-1"></i> Click to view full size
                    </div>
                  </div>
                )}

                <div>
                  <label
                    className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed 
                                   border-slate-300 rounded-xl hover:border-amber-500 hover:bg-amber-50/50 
                                   transition-all duration-300 cursor-pointer group"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <i className="fas fa-cloud-upload-alt text-4xl text-slate-400 group-hover:text-amber-500 mb-3 transition-colors"></i>
                      <p className="text-base text-slate-600 group-hover:text-amber-600 font-medium">
                        {imagePreview
                          ? 'Change Image'
                          : caseData[0].INDEX_CARDS && caseData[0].INDEX_CARDS !== 'N/A'
                            ? 'Upload New Image'
                            : 'Upload Index Card Image'}
                      </p>
                      <p className="text-sm text-slate-400 mt-1">PNG, JPG, JPEG (Max 5MB)</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/png,image/jpeg,image/jpg"
                      onChange={handleImageChange}
                    />
                  </label>
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
