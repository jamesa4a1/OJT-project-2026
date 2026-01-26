import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useValidation } from '../hooks/useValidation';
import { CaseCreateSchema } from '../schemas/cases';
import { Alert } from '../components/ui/Alert';
import { ThemeContext } from '../App';

const Newcase = () => {
  const navigate = useNavigate();
  const { isDark } = useContext(ThemeContext) || { isDark: false };
  const [isLoading, setIsLoading] = useState(false);
  const [indexCardImage, setIndexCardImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showFullImage, setShowFullImage] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { validate, errors: validationErrors } = useValidation(CaseCreateSchema);

  const [formData, setFormData] = useState({
    DOCKET_NO: '',
    DATE_FILED: '',
    COMPLAINANT: '',
    RESPONDENT: '',
    ADDRESS_OF_RESPONDENT: '',
    OFFENSE: '',
    DATE_OF_COMMISSION: '',
    DATE_RESOLVED: '',
    RESOLVING_PROSECUTOR: '',
    CRIM_CASE_NO: 'N/A',
    BRANCH: '',
    DATEFILED_IN_COURT: 'N/A',
    REMARKS_DECISION: '',
    PENALTY: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name.toUpperCase()]: value });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate with Zod
      const validatedData = await validate(formData);
      if (!validatedData) {
        setIsLoading(false);
        return;
      }

      const formDataToSend = new FormData();
      Object.keys(validatedData).forEach((key) => {
        formDataToSend.append(key, validatedData[key]);
      });
      if (indexCardImage) {
        formDataToSend.append('indexCardImage', indexCardImage);
      }

      const response = await axios.post('http://localhost:5000/add-case', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      console.log(response.data);
      setSuccess('Case added successfully!');

      // Reset form
      setFormData({
        DOCKET_NO: '',
        DATE_FILED: '',
        COMPLAINANT: '',
        RESPONDENT: '',
        ADDRESS_OF_RESPONDENT: '',
        OFFENSE: '',
        DATE_OF_COMMISSION: '',
        DATE_RESOLVED: '',
        RESOLVING_PROSECUTOR: '',
        CRIM_CASE_NO: 'N/A',
        BRANCH: '',
        DATEFILED_IN_COURT: 'N/A',
        REMARKS_DECISION: '',
        PENALTY: '',
      });
      removeImage();

      // Navigate after short delay
      setTimeout(() => {
        navigate('/caselist');
      }, 1500);
    } catch (error) {
      console.error('Error adding case:', error);
      const errorMessage = error.response?.data?.message || 'Failed to add case. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = `w-full px-5 py-3.5 rounded-xl border-2 transition-all duration-300 outline-none font-medium placeholder:text-slate-400 hover:shadow-md ${isDark ? 'border-slate-600/60 bg-slate-800/80 text-slate-100 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/20 hover:border-slate-500 hover:bg-slate-800' : 'border-slate-200/60 bg-white/80 text-slate-800 focus:border-doj-blue focus:ring-4 focus:ring-doj-blue/10 hover:border-slate-300 hover:bg-white'} backdrop-blur-sm shadow-sm`;

  const labelClass = `block text-sm font-bold mb-2.5 flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`min-h-screen p-6 transition-colors duration-300 ${isDark ? 'bg-slate-900' : 'bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100'}`}
    >
      <div className="w-full max-w-4xl mx-auto">
        {/* Enhanced Header with Gradient */}
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
            className={`inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-5 shadow-2xl ${
              isDark
                ? 'bg-gradient-to-br from-teal-500/30 to-cyan-500/30 shadow-teal-500/20'
                : 'bg-gradient-to-br from-doj-blue via-blue-500 to-blue-600 shadow-blue-500/30'
            }`}
          >
            <i className={`fas fa-folder-plus text-3xl ${isDark ? 'text-teal-300' : 'text-white'}`}></i>
          </motion.div>
          <h1 className={`text-5xl font-black bg-clip-text bg-gradient-to-r mb-4 ${
            isDark
              ? 'from-teal-300 via-cyan-300 to-blue-300 text-transparent'
              : 'from-doj-navy via-doj-blue to-blue-600 text-transparent'
          }`}>
            Add New Case
          </h1>
          <p className={`text-lg font-medium max-w-2xl mx-auto ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Fill in the details below to register a new case
          </p>
        </div>

        {/* Back Button - Left Aligned Below Header */}
        <motion.button
          whileHover={{ x: -5, scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/admin-dashboard')}
          className={`flex items-center gap-3 px-6 py-3.5 mb-8 rounded-2xl border-2 transition-all ${
            isDark
              ? 'bg-slate-800/80 backdrop-blur-sm border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
              : 'bg-white/80 backdrop-blur-sm border-slate-200/60 text-slate-700 hover:bg-gradient-to-r hover:from-doj-blue hover:to-blue-600 hover:border-doj-blue hover:text-white transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer font-bold'
          }`}
        >
          <i className="fas fa-arrow-left text-lg"></i>
          <span>Back to Menu</span>
        </motion.button>

        {/* Form Card - Enhanced with HeroUI styling */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className={`relative rounded-3xl shadow-2xl border-2 overflow-hidden backdrop-blur-sm transition-colors duration-300 ${
          isDark
            ? 'bg-gradient-to-br from-slate-800 via-slate-800 to-slate-700/30 border-slate-700/40'
            : 'bg-gradient-to-br from-white via-white to-slate-50/30 border-slate-200/40'
        }`}
      >
        <div className={`h-3 bg-gradient-to-r ${
          isDark
            ? 'from-teal-600 via-teal-500 to-cyan-500'
            : 'from-doj-navy via-doj-blue to-blue-600'
        }`}></div>
        
        {/* Background decorative circles */}
        <div className={`absolute top-20 right-0 w-96 h-96 rounded-full blur-3xl -mr-48 ${
          isDark
            ? 'bg-gradient-to-br from-teal-500/10 to-cyan-500/10'
            : 'bg-gradient-to-br from-blue-500/5 to-indigo-500/5'
        }`}></div>
        <div className={`absolute bottom-20 left-0 w-96 h-96 rounded-full blur-3xl -ml-48 ${
          isDark
            ? 'bg-gradient-to-tr from-emerald-500/10 to-teal-500/10'
            : 'bg-gradient-to-tr from-emerald-500/5 to-teal-500/5'
        }`}></div>
        
        <div className="relative p-10">
          {/* Success Alert */}
          {success && <Alert type="success" message={success} className="mb-6" />}

          {/* Error Alert */}
          {error && <Alert type="error" message={error} className="mb-6" />}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              <div className={`flex items-center gap-4 pb-4 border-b-2 ${
                isDark ? 'border-teal-500/30' : 'border-gradient-to-r from-doj-blue/30 via-doj-blue/20 to-transparent'
              }`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl ${
                  isDark
                    ? 'bg-gradient-to-br from-teal-500 via-teal-600 to-cyan-600 shadow-teal-500/30'
                    : 'bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 shadow-blue-500/30'
                }`}>
                  <i className="fas fa-file-alt text-white text-lg"></i>
                </div>
                <h3 className={`text-2xl font-black m-0 ${
                  isDark ? 'text-teal-300' : 'text-slate-800'
                }`}>Basic Information</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>
                    <i className="fas fa-hashtag text-doj-blue"></i>
                    <span>Docket/IS Case Number *</span>
                  </label>
                  <input
                    type="text"
                    name="DOCKET_NO"
                    value={formData.DOCKET_NO}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Enter docket number"
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    <i className="fas fa-calendar text-doj-blue"></i>
                    <span>Date Filed</span>
                  </label>
                  <input
                    type="date"
                    name="DATE_FILED"
                    value={formData.DATE_FILED}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* Section: Parties Involved - Enhanced */}
            <div className="space-y-6">
              <div className={`flex items-center gap-4 pb-4 border-b-2 ${
                isDark ? 'border-purple-500/30' : 'border-gradient-to-r from-violet-500/30 via-violet-500/20 to-transparent'
              }`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl ${
                  isDark
                    ? 'bg-gradient-to-br from-purple-500 via-purple-600 to-pink-600 shadow-purple-500/30'
                    : 'bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-600 shadow-violet-500/30'
                }`}>
                  <i className="fas fa-users text-white text-lg"></i>
                </div>
                <h3 className={`text-2xl font-black m-0 ${
                  isDark ? 'text-purple-300' : 'text-slate-800'
                }`}>Parties Involved</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>
                    <i className="fas fa-user text-emerald-500"></i>
                    <span>Complainant</span>
                  </label>
                  <input
                    type="text"
                    name="COMPLAINANT"
                    value={formData.COMPLAINANT}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Enter complainant name"
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    <i className="fas fa-user-tag text-red-500"></i>
                    <span>Respondent *</span>
                  </label>
                  <input
                    type="text"
                    name="RESPONDENT"
                    value={formData.RESPONDENT}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Enter respondent name"
                    required
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>
                  <i className="fas fa-map-marker-alt text-red-500"></i>
                  <span>Address of Respondent</span>
                </label>
                <input
                  type="text"
                  name="ADDRESS_OF_RESPONDENT"
                  value={formData.ADDRESS_OF_RESPONDENT}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Enter respondent's address"
                />
              </div>
            </div>

            {/* Section: Case Details - Enhanced */}
            <div className="space-y-6">
              <div className={`flex items-center gap-4 pb-4 border-b-2 ${
                isDark ? 'border-amber-500/30' : 'border-gradient-to-r from-amber-500/30 via-amber-500/20 to-transparent'
              }`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl ${
                  isDark
                    ? 'bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 shadow-amber-500/30'
                    : 'bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 shadow-amber-500/30'
                }`}>
                  <i className="fas fa-gavel text-white text-lg"></i>
                </div>
                <h3 className={`text-2xl font-black m-0 ${
                  isDark ? 'text-amber-300' : 'text-slate-800'
                }`}>Case Details</h3>
              </div>

              <div>
                <label className={labelClass}>
                  <i className="fas fa-exclamation-triangle text-amber-500"></i>
                  <span>Offense</span>
                </label>
                <input
                  type="text"
                  name="OFFENSE"
                  value={formData.OFFENSE}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Describe the offense"
                />
              </div>

              <div>
                <label className={labelClass}>
                  <i className="fas fa-calendar-day text-orange-500"></i>
                  <span>Date of Commission</span>
                </label>
                <input
                  type="date"
                  name="DATE_OF_COMMISSION"
                  value={formData.DATE_OF_COMMISSION}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>
                    <i className="fas fa-calendar-check text-emerald-500"></i>
                    <span>Date Resolved</span>
                  </label>
                  <input
                    type="date"
                    name="DATE_RESOLVED"
                    value={formData.DATE_RESOLVED}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    <i className="fas fa-user-tie text-doj-blue"></i>
                    <span>Resolving Prosecutor *</span>
                  </label>
                  <input
                    type="text"
                    name="RESOLVING_PROSECUTOR"
                    value={formData.RESOLVING_PROSECUTOR}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Prosecutor name"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Section: Court Information - Enhanced */}
            <div className="space-y-6">
              <div className={`flex items-center gap-4 pb-4 border-b-2 ${
                isDark ? 'border-slate-500/30' : 'border-gradient-to-r from-slate-400/30 via-slate-400/20 to-transparent'
              }`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl ${
                  isDark
                    ? 'bg-gradient-to-br from-slate-600 via-slate-700 to-gray-800 shadow-slate-600/30'
                    : 'bg-gradient-to-br from-slate-500 via-slate-600 to-gray-700 shadow-slate-500/30'
                }`}>
                  <i className="fas fa-landmark text-white text-lg"></i>
                </div>
                <h3 className={`text-2xl font-black m-0 ${
                  isDark ? 'text-slate-300' : 'text-slate-800'
                }`}>Court Information</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className={labelClass}>
                    <i className="fas fa-balance-scale text-slate-600"></i>
                    <span>Criminal Case No.</span>
                  </label>
                  <input
                    type="text"
                    name="CRIM_CASE_NO"
                    value={formData.CRIM_CASE_NO}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Case number"
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    <i className="fas fa-building text-slate-600"></i>
                    <span>Branch</span>
                  </label>
                  <input
                    type="text"
                    name="BRANCH"
                    value={formData.BRANCH}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Court branch"
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    <i className="fas fa-calendar-alt text-slate-600"></i>
                    <span>Date Filed in Court</span>
                  </label>
                  <input
                    type="date"
                    name="DATEFILED_IN_COURT"
                    value={formData.DATEFILED_IN_COURT}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* Section: Resolution - Enhanced */}
            <div className="space-y-6">
              <div className={`flex items-center gap-4 pb-4 border-b-2 ${
                isDark ? 'border-emerald-500/30' : 'border-gradient-to-r from-emerald-500/30 via-emerald-500/20 to-transparent'
              }`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl ${
                  isDark
                    ? 'bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 shadow-emerald-500/30'
                    : 'bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 shadow-emerald-500/30'
                }`}>
                  <i className="fas fa-clipboard-check text-white text-lg"></i>
                </div>
                <h3 className={`text-2xl font-black m-0 ${
                  isDark ? 'text-emerald-300' : 'text-slate-800'
                }`}>Resolution & Remarks</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>
                    <i className="fas fa-check-double text-emerald-500"></i>
                    <span>Remarks Decision</span>
                  </label>
                  <select
                    name="REMARKS_DECISION"
                    value={formData.REMARKS_DECISION || 'Pending'}
                    onChange={handleChange}
                    className={inputClass}
                    required
                  >
                    <option value="Pending">Pending</option>
                    <option value="Dismissed">Dismissed</option>
                    <option value="Convicted">Convicted</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>
                    <i className="fas fa-gavel text-emerald-500"></i>
                    <span>Penalty</span>
                  </label>
                  <input
                    type="text"
                    name="PENALTY"
                    value={formData.PENALTY}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Penalty imposed"
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>
                  <i className="fas fa-image text-doj-blue"></i>
                  <span>Index Card Image</span>
                </label>
                <div className="space-y-3">
                  {!imagePreview ? (
                    <label
                      className={`flex flex-col items-center justify-center w-full h-48 
                               border-3 border-dashed rounded-3xl 
                               transition-all duration-300 cursor-pointer group relative overflow-hidden backdrop-blur-sm ${
                                 isDark
                                   ? 'border-slate-600/60 hover:border-teal-500 hover:bg-gradient-to-br hover:from-teal-950 hover:to-cyan-950/30'
                                   : 'border-slate-300/60 hover:border-doj-blue hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50/30'
                               }`}
                    >
                      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity ${
                        isDark
                          ? 'bg-gradient-to-br from-teal-500/10 to-cyan-600/10'
                          : 'bg-gradient-to-br from-doj-blue/10 to-blue-600/10'
                      }`} />
                      <div className="relative flex flex-col items-center justify-center z-10">
                        <div className={`w-20 h-20 rounded-3xl 
                                      flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-xl ${
                                        isDark
                                          ? 'bg-gradient-to-br from-teal-500/20 via-teal-500/20 to-cyan-500/20'
                                          : 'bg-gradient-to-br from-doj-blue/20 via-blue-500/20 to-indigo-500/20'
                                      }`}>
                          <i className={`fas fa-cloud-upload-alt text-5xl group-hover:transition-colors ${
                            isDark ? 'text-teal-400 group-hover:text-cyan-400' : 'text-doj-blue group-hover:text-blue-600'
                          }`}></i>
                        </div>
                        <p className={`text-lg font-bold transition-colors ${
                          isDark
                            ? 'text-slate-300 group-hover:text-teal-400'
                            : 'text-slate-700 group-hover:text-doj-blue'
                        }`}>
                          Click to upload index card image
                        </p>
                        <p className={`text-sm mt-2 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>PNG, JPG, JPEG (Max 5MB)</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/png,image/jpeg,image/jpg"
                        onChange={handleImageChange}
                      />
                    </label>
                  ) : (
                    <div className="relative group">
                      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl ${
                        isDark
                          ? 'bg-gradient-to-br from-teal-500/20 to-cyan-500/20'
                          : 'bg-gradient-to-br from-doj-blue/20 to-blue-500/20'
                      }`} />
                      <img
                        src={imagePreview}
                        alt="Index Card Preview"
                        onClick={() => setShowFullImage(true)}
                        className={`w-full h-64 object-cover rounded-3xl border-3 
                                 cursor-pointer hover:scale-[1.02] transition-transform shadow-2xl ${
                                   isDark ? 'border-teal-500/40' : 'border-doj-blue/40'
                                 }`}
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-4 right-4 px-5 py-3 
                                 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold
                                 rounded-2xl shadow-2xl hover:shadow-red-500/50 transition-all cursor-pointer 
                                 flex items-center gap-2 z-10 border-2 border-white"
                      >
                        <i className="fas fa-times text-lg"></i>
                        Remove
                      </button>
                      <div className={`absolute bottom-4 left-4 px-5 py-3 backdrop-blur-md 
                                    text-sm font-semibold rounded-2xl flex items-center gap-2 border-2 border-white/20 shadow-xl ${
                                      isDark
                                        ? 'bg-black/80 text-white'
                                        : 'bg-black/80 text-white'
                                    }`}>
                        <i className="fas fa-search-plus text-lg"></i>
                        Click to view full size
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button - Enhanced */}
            <div className={`pt-10 border-t-2 ${isDark ? 'border-slate-700/60' : 'border-slate-200/60'}`}>
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: isLoading ? 1 : 1.03 }}
                whileTap={{ scale: isLoading ? 1 : 0.97 }}
                className={`w-full py-6 rounded-2xl font-black text-xl
                           shadow-2xl transition-all duration-300 border-none cursor-pointer
                           flex items-center justify-center gap-4 relative overflow-hidden
                           ${
                             isLoading
                               ? isDark ? 'bg-slate-600 cursor-not-allowed shadow-slate-600/50' : 'bg-slate-400 cursor-not-allowed shadow-slate-400/50'
                               : isDark
                                 ? 'bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 hover:from-emerald-700 hover:via-emerald-800 hover:to-teal-800 text-white shadow-emerald-600/60 hover:shadow-2xl hover:shadow-emerald-700/80'
                                 : 'bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-600 hover:via-emerald-700 hover:to-teal-700 text-white shadow-emerald-500/60 hover:shadow-2xl hover:shadow-emerald-600/80'
                           }`}
              >
                {!isLoading && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                                animate-shimmer" />
                )}
                {isLoading ? (
                  <>
                    <div className="w-7 h-7 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-plus-circle text-2xl"></i>
                    <span>Submit New Case</span>
                  </>
                )}
              </motion.button>
            </div>
          </form>
        </div>
      </motion.div>
      </div>

      {/* Fullscreen Image Modal */}
      {showFullImage && imagePreview && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowFullImage(false)}
          className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 ${
            isDark ? 'bg-black/95' : 'bg-black/90'
          }`}
          style={{ margin: 0 }}
        >
          <button
            onClick={() => setShowFullImage(false)}
            className={`absolute top-4 right-4 w-12 h-12 rounded-full flex items-center justify-center 
                        transition-all duration-300 cursor-pointer border-2 z-10 ${
                          isDark
                            ? 'bg-white/20 hover:bg-white/30 text-white border-white/40'
                            : 'bg-white/10 hover:bg-white/20 text-white border-white/30'
                        }`}
          >
            <i className="fas fa-times text-2xl"></i>
          </button>
          <motion.img
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            src={imagePreview}
            alt="Full Size Preview"
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </motion.div>
      )}
    </motion.div>
  );
};

export default Newcase;
