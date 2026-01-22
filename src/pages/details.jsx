import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { ThemeContext } from '../App';

const Details = () => {
  const { docketNo } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDark } = useContext(ThemeContext) || { isDark: false };
  const [caseDetails, setCaseDetails] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showFullImage, setShowFullImage] = useState(false);
  const [imageError, setImageError] = useState(false);

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

  // Check if user is staff (read-only mode)
  const isStaff = user?.role === 'Staff';

  useEffect(() => {
    const fetchCaseDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/get-case?docket_no=${docketNo}`);
        if (response.data.length > 0) {
          setCaseDetails(response.data[0]);
        } else {
          setError('No case found.');
        }
      } catch (err) {
        setError('Error fetching case details.');
      }
      setIsLoading(false);
    };
    fetchCaseDetails();
  }, [docketNo]);

  const fields = [
    { label: 'Docket Number', key: 'DOCKET_NO', icon: 'fa-hashtag', color: 'blue' },
    { label: 'Date Filed', key: 'DATE_FILED', icon: 'fa-calendar', color: 'emerald' },
    { label: 'Complainant', key: 'COMPLAINANT', icon: 'fa-user', color: 'violet' },
    { label: 'Respondent', key: 'RESPONDENT', icon: 'fa-user-tag', color: 'amber' },
    { label: 'Offense', key: 'OFFENSE', icon: 'fa-exclamation-triangle', color: 'red' },
    { label: 'Date Resolved', key: 'DATE_RESOLVED', icon: 'fa-calendar-check', color: 'teal' },
    {
      label: 'Resolving Prosecutor',
      key: 'RESOLVING_PROSECUTOR',
      icon: 'fa-user-tie',
      color: 'indigo',
    },
    { label: 'Criminal Case Number', key: 'CRIM_CASE_NO', icon: 'fa-gavel', color: 'slate' },
    { label: 'Branch', key: 'BRANCH', icon: 'fa-building', color: 'cyan' },
    {
      label: 'Date Filed in Court',
      key: 'DATEFILED_IN_COURT',
      icon: 'fa-landmark',
      color: 'purple',
    },
    { label: 'Decision', key: 'REMARKS_DECISION', icon: 'fa-clipboard-check', color: 'green' },
    { label: 'Remarks', key: 'REMARKS', icon: 'fa-comment', color: 'orange' },
    { label: 'Penalty', key: 'PENALTY', icon: 'fa-balance-scale', color: 'rose' },
  ];

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600 border-blue-200',
    emerald: 'bg-emerald-100 text-emerald-600 border-emerald-200',
    violet: 'bg-violet-100 text-violet-600 border-violet-200',
    amber: 'bg-amber-100 text-amber-600 border-amber-200',
    red: 'bg-red-100 text-red-600 border-red-200',
    teal: 'bg-teal-100 text-teal-600 border-teal-200',
    indigo: 'bg-indigo-100 text-indigo-600 border-indigo-200',
    slate: 'bg-slate-100 text-slate-600 border-slate-200',
    cyan: 'bg-cyan-100 text-cyan-600 border-cyan-200',
    purple: 'bg-purple-100 text-purple-600 border-purple-200',
    green: 'bg-green-100 text-green-600 border-green-200',
    orange: 'bg-orange-100 text-orange-600 border-orange-200',
    rose: 'bg-rose-100 text-rose-600 border-rose-200',
  };

  if (isLoading) {
    return (
      <div
        className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100'} flex items-center justify-center`}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div
            className={`w-16 h-16 border-4 ${isDark ? 'border-blue-500/20 border-t-blue-500' : 'border-doj-navy/20 border-t-doj-navy'} rounded-full animate-spin mx-auto mb-4`}
          ></div>
          <p className={`${isDark ? 'text-slate-300' : 'text-slate-600'} font-medium`}>
            Loading case details...
          </p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-gradient-to-br from-slate-50 via-red-50/30 to-slate-100'} flex items-center justify-center p-4`}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${isDark ? 'bg-slate-800 border-red-500/30' : 'bg-white border-red-200'} rounded-3xl shadow-xl border p-8 max-w-md w-full text-center`}
        >
          <div
            className={`w-16 h-16 rounded-full ${isDark ? 'bg-red-500/20' : 'bg-red-100'} flex items-center justify-center mx-auto mb-4`}
          >
            <i
              className={`fas fa-exclamation-triangle text-3xl ${isDark ? 'text-red-400' : 'text-red-500'}`}
            ></i>
          </div>
          <h2 className={`text-xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'} mb-2`}>
            Error
          </h2>
          <p className={`${isDark ? 'text-red-400' : 'text-red-600'} mb-6`}>{error}</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg cursor-pointer border-none"
          >
            Go Back
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100'} py-8 px-4 relative overflow-hidden`}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className={`absolute top-20 right-20 w-72 h-72 ${isDark ? 'bg-blue-500/5' : 'bg-doj-navy/5'} rounded-full blur-3xl`}
        ></div>
        <div
          className={`absolute bottom-20 left-20 w-72 h-72 ${isDark ? 'bg-indigo-500/5' : 'bg-doj-blue/5'} rounded-full blur-3xl`}
        ></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${isDark ? 'bg-blue-500/20 border-blue-500/30' : 'bg-doj-navy/10 border-doj-navy/20'} border mb-4`}
          >
            <i
              className={`fas ${isStaff ? 'fa-eye' : 'fa-file-alt'} ${isDark ? 'text-blue-400' : 'text-doj-navy'}`}
            ></i>
            <span className={`${isDark ? 'text-blue-400' : 'text-doj-navy'} font-medium text-sm`}>
              {isStaff ? 'Case Viewer - Read Only' : 'Case Details'}
            </span>
          </div>
          <h1
            className={`text-3xl md:text-4xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'} mb-3`}
          >
            Case Information
          </h1>
          <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Viewing details for case {docketNo}
          </p>
        </div>

        {/* Back Button */}
        <motion.button
          whileHover={{ x: -5 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(-1)}
          className={`flex items-center gap-2 px-4 py-2 mb-6 rounded-xl ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'} border transition-all duration-300 shadow-sm cursor-pointer`}
        >
          <i className="fas fa-arrow-left"></i>
          <span className="font-medium">Go Back</span>
        </motion.button>

        {/* Staff View - Horizontal Layout */}
        {isStaff ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} rounded-3xl shadow-xl border overflow-hidden`}
          >
            {/* Header with Read-Only Badge */}
            <div className="p-6 bg-gradient-to-r from-teal-500 to-teal-600 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
              <div className="relative flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
                    <i className="fas fa-eye text-2xl"></i>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{caseDetails.DOCKET_NO}</h2>
                    <p className="text-white/80">{caseDetails.OFFENSE || 'Case Details'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 backdrop-blur-sm">
                  <i className="fas fa-lock text-sm"></i>
                  <span className="font-semibold text-sm">Read-Only Access</span>
                </div>
              </div>
            </div>

            {/* Horizontal Case Information Display */}
            <div className="p-8">
              {/* Case Identification Section */}
              <div
                className={`mb-6 p-6 rounded-2xl ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'} border ${isDark ? 'border-slate-600' : 'border-slate-200'}`}
              >
                <h3
                  className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'} mb-4 flex items-center gap-2`}
                >
                  <i className="fas fa-id-card text-teal-500"></i>
                  Case Identification
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label
                      className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wide mb-2 block`}
                    >
                      <i className="fas fa-hashtag mr-1"></i> Docket Number
                    </label>
                    <div
                      className={`px-4 py-3 rounded-xl ${isDark ? 'bg-slate-800 text-slate-200' : 'bg-white text-slate-800'} border ${isDark ? 'border-slate-600' : 'border-slate-200'} font-semibold`}
                    >
                      {caseDetails.DOCKET_NO || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <label
                      className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wide mb-2 block`}
                    >
                      <i className="fas fa-calendar mr-1"></i> Date Filed
                    </label>
                    <div
                      className={`px-4 py-3 rounded-xl ${isDark ? 'bg-slate-800 text-slate-200' : 'bg-white text-slate-800'} border ${isDark ? 'border-slate-600' : 'border-slate-200'} font-medium`}
                    >
                      {caseDetails.DATE_FILED || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <label
                      className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wide mb-2 block`}
                    >
                      <i className="fas fa-gavel mr-1"></i> Criminal Case No.
                    </label>
                    <div
                      className={`px-4 py-3 rounded-xl ${isDark ? 'bg-slate-800 text-slate-200' : 'bg-white text-slate-800'} border ${isDark ? 'border-slate-600' : 'border-slate-200'} font-medium`}
                    >
                      {caseDetails.CRIM_CASE_NO || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Parties Involved Section */}
              <div
                className={`mb-6 p-6 rounded-2xl ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'} border ${isDark ? 'border-slate-600' : 'border-slate-200'}`}
              >
                <h3
                  className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'} mb-4 flex items-center gap-2`}
                >
                  <i className="fas fa-users text-teal-500"></i>
                  Parties Involved
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wide mb-2 block`}
                    >
                      <i className="fas fa-user mr-1"></i> Complainant
                    </label>
                    <div
                      className={`px-4 py-3 rounded-xl ${isDark ? 'bg-slate-800 text-slate-200' : 'bg-white text-slate-800'} border ${isDark ? 'border-slate-600' : 'border-slate-200'} font-medium`}
                    >
                      {caseDetails.COMPLAINANT || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <label
                      className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wide mb-2 block`}
                    >
                      <i className="fas fa-user-tag mr-1"></i> Respondent
                    </label>
                    <div
                      className={`px-4 py-3 rounded-xl ${isDark ? 'bg-slate-800 text-slate-200' : 'bg-white text-slate-800'} border ${isDark ? 'border-slate-600' : 'border-slate-200'} font-medium`}
                    >
                      {caseDetails.RESPONDENT || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Offense Details Section */}
              <div
                className={`mb-6 p-6 rounded-2xl ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'} border ${isDark ? 'border-slate-600' : 'border-slate-200'}`}
              >
                <h3
                  className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'} mb-4 flex items-center gap-2`}
                >
                  <i className="fas fa-exclamation-triangle text-teal-500"></i>
                  Offense Information
                </h3>
                <div>
                  <label
                    className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wide mb-2 block`}
                  >
                    <i className="fas fa-file-alt mr-1"></i> Offense
                  </label>
                  <div
                    className={`px-4 py-3 rounded-xl ${isDark ? 'bg-slate-800 text-slate-200' : 'bg-white text-slate-800'} border ${isDark ? 'border-slate-600' : 'border-slate-200'} font-medium`}
                  >
                    {caseDetails.OFFENSE || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Resolution Details Section */}
              <div
                className={`mb-6 p-6 rounded-2xl ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'} border ${isDark ? 'border-slate-600' : 'border-slate-200'}`}
              >
                <h3
                  className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'} mb-4 flex items-center gap-2`}
                >
                  <i className="fas fa-clipboard-check text-teal-500"></i>
                  Resolution Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wide mb-2 block`}
                    >
                      <i className="fas fa-calendar-check mr-1"></i> Date Resolved
                    </label>
                    <div
                      className={`px-4 py-3 rounded-xl ${isDark ? 'bg-slate-800 text-slate-200' : 'bg-white text-slate-800'} border ${isDark ? 'border-slate-600' : 'border-slate-200'} font-medium`}
                    >
                      {caseDetails.DATE_RESOLVED || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <label
                      className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wide mb-2 block`}
                    >
                      <i className="fas fa-user-tie mr-1"></i> Resolving Prosecutor
                    </label>
                    <div
                      className={`px-4 py-3 rounded-xl ${isDark ? 'bg-slate-800 text-slate-200' : 'bg-white text-slate-800'} border ${isDark ? 'border-slate-600' : 'border-slate-200'} font-medium`}
                    >
                      {caseDetails.RESOLVING_PROSECUTOR || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <label
                      className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wide mb-2 block`}
                    >
                      <i className="fas fa-gavel mr-1"></i> Decision
                    </label>
                    <div
                      className={`px-4 py-3 rounded-xl ${isDark ? 'bg-slate-800 text-slate-200' : 'bg-white text-slate-800'} border ${isDark ? 'border-slate-600' : 'border-slate-200'} font-medium`}
                    >
                      {caseDetails.REMARKS_DECISION || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <label
                      className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wide mb-2 block`}
                    >
                      <i className="fas fa-balance-scale mr-1"></i> Penalty
                    </label>
                    <div
                      className={`px-4 py-3 rounded-xl ${isDark ? 'bg-slate-800 text-slate-200' : 'bg-white text-slate-800'} border ${isDark ? 'border-slate-600' : 'border-slate-200'} font-medium`}
                    >
                      {caseDetails.PENALTY || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Court Details Section */}
              <div
                className={`mb-6 p-6 rounded-2xl ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'} border ${isDark ? 'border-slate-600' : 'border-slate-200'}`}
              >
                <h3
                  className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'} mb-4 flex items-center gap-2`}
                >
                  <i className="fas fa-landmark text-teal-500"></i>
                  Court Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wide mb-2 block`}
                    >
                      <i className="fas fa-building mr-1"></i> Branch
                    </label>
                    <div
                      className={`px-4 py-3 rounded-xl ${isDark ? 'bg-slate-800 text-slate-200' : 'bg-white text-slate-800'} border ${isDark ? 'border-slate-600' : 'border-slate-200'} font-medium`}
                    >
                      {caseDetails.BRANCH || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <label
                      className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wide mb-2 block`}
                    >
                      <i className="fas fa-calendar-alt mr-1"></i> Date Filed in Court
                    </label>
                    <div
                      className={`px-4 py-3 rounded-xl ${isDark ? 'bg-slate-800 text-slate-200' : 'bg-white text-slate-800'} border ${isDark ? 'border-slate-600' : 'border-slate-200'} font-medium`}
                    >
                      {caseDetails.DATEFILED_IN_COURT || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Remarks Section */}
              <div
                className={`mb-6 p-6 rounded-2xl ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'} border ${isDark ? 'border-slate-600' : 'border-slate-200'}`}
              >
                <h3
                  className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'} mb-4 flex items-center gap-2`}
                >
                  <i className="fas fa-comment text-teal-500"></i>
                  Additional Remarks
                </h3>
                <div>
                  <label
                    className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wide mb-2 block`}
                  >
                    <i className="fas fa-sticky-note mr-1"></i> Remarks
                  </label>
                  <div
                    className={`px-4 py-3 rounded-xl ${isDark ? 'bg-slate-800 text-slate-200' : 'bg-white text-slate-800'} border ${isDark ? 'border-slate-600' : 'border-slate-200'} font-medium min-h-[100px]`}
                  >
                    {caseDetails.REMARKS || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Index Cards Section */}
              {caseDetails.INDEX_CARDS && caseDetails.INDEX_CARDS !== 'N/A' && (
                <div
                  className={`p-6 rounded-2xl ${isDark ? 'bg-slate-700/50' : 'bg-gradient-to-r from-teal-50/50 to-blue-50/50'} border ${isDark ? 'border-slate-600' : 'border-teal-100'}`}
                >
                  <h3
                    className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'} mb-4 flex items-center gap-2`}
                  >
                    <i className="fas fa-image text-teal-500"></i>
                    Index Card Image
                  </h3>
                  <div className="relative">
                    {!imageError ? (
                      <img
                        src={getImageUrl(caseDetails.INDEX_CARDS)}
                        alt="Index Card"
                        onClick={() => setShowFullImage(true)}
                        className={`w-full max-h-96 object-contain rounded-xl border-2 ${isDark ? 'border-slate-600' : 'border-slate-200'} shadow-md cursor-pointer hover:opacity-90 transition-opacity`}
                        onError={() => setImageError(true)}
                      />
                    ) : (
                      <div
                        className={`p-4 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-gray-100'} text-center`}
                      >
                        <i className="fas fa-exclamation-triangle text-yellow-500 text-2xl mb-2"></i>
                        <p className={`${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                          Image could not be loaded
                        </p>
                      </div>
                    )}
                    {!imageError && (
                      <div className="absolute bottom-3 left-3 px-4 py-2 bg-black/70 text-white text-sm rounded-xl backdrop-blur-sm">
                        <i className="fas fa-search-plus mr-2"></i> Click to view full size
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer with Go Back Button Only */}
            <div
              className={`p-6 ${isDark ? 'bg-slate-900/50' : 'bg-slate-50'} border-t ${isDark ? 'border-slate-700' : 'border-slate-200'}`}
            >
              <div className="flex justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(-1)}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold flex items-center gap-2 shadow-lg cursor-pointer border-none"
                >
                  <i className="fas fa-arrow-left"></i>Back to Dashboard
                </motion.button>
              </div>
            </div>
          </motion.div>
        ) : (
          // Admin/Clerk View - Original Grid Layout with Edit Capabilities
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} rounded-3xl shadow-xl border overflow-hidden`}
          >
            {/* Card Header */}
            <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
                  <i className="fas fa-folder-open text-2xl"></i>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{caseDetails.DOCKET_NO}</h2>
                  <p className="text-white/70">{caseDetails.OFFENSE || 'Case Details'}</p>
                </div>
              </div>
            </div>

            {/* Fields Grid */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fields.map((field, idx) => (
                  <motion.div
                    key={field.key}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`p-4 rounded-xl ${isDark ? 'bg-slate-700/50 border-slate-600 hover:bg-slate-700' : 'bg-slate-50 border-slate-100 hover:shadow-md'} border transition-all duration-300`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${colorClasses[field.color]}`}
                      >
                        <i className={`fas ${field.icon}`}></i>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-400'} uppercase tracking-wide mb-1`}
                        >
                          {field.label}
                        </p>
                        <p
                          className={`${isDark ? 'text-slate-200' : 'text-slate-800'} font-medium break-words`}
                        >
                          {caseDetails[field.key] || (
                            <span
                              className={`${isDark ? 'text-slate-500' : 'text-slate-400'} italic`}
                            >
                              Not provided
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Index Cards Link */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className={`mt-6 p-4 rounded-xl ${isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-gradient-to-r from-doj-navy/5 to-doj-blue/5 border-doj-navy/10'} border`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg ${isDark ? 'bg-blue-500/20' : 'bg-doj-navy/10'} flex items-center justify-center`}
                    >
                      <i
                        className={`fas fa-image ${isDark ? 'text-blue-400' : 'text-doj-navy'}`}
                      ></i>
                    </div>
                    <div>
                      <p
                        className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-400'} uppercase tracking-wide`}
                      >
                        Index Card Image
                      </p>
                      <p className={`${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                        {caseDetails.INDEX_CARDS && caseDetails.INDEX_CARDS !== 'N/A'
                          ? 'Image attached'
                          : 'No image attached'}
                      </p>
                    </div>
                  </div>
                  {caseDetails.INDEX_CARDS && caseDetails.INDEX_CARDS !== 'N/A' && (
                    <motion.a
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      href={getImageUrl(caseDetails.INDEX_CARDS)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`px-4 py-2 rounded-xl ${isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-doj-navy'} text-white font-medium flex items-center gap-2 hover:shadow-lg transition-all duration-300 no-underline`}
                    >
                      <i className="fas fa-eye"></i>View Image
                    </motion.a>
                  )}
                </div>
                {caseDetails.INDEX_CARDS && caseDetails.INDEX_CARDS !== 'N/A' && !imageError && (
                  <div className="mt-4 relative">
                    <img
                      src={getImageUrl(caseDetails.INDEX_CARDS)}
                      alt="Index Card"
                      onClick={() => setShowFullImage(true)}
                      className={`w-full max-h-96 object-contain rounded-lg border-2 ${isDark ? 'border-slate-600' : 'border-slate-200'} shadow-sm cursor-pointer hover:opacity-90 transition-opacity`}
                      onError={() => setImageError(true)}
                    />
                    <div className="absolute bottom-2 left-2 px-3 py-1.5 bg-black/60 text-white text-xs rounded-lg">
                      <i className="fas fa-search-plus mr-1"></i> Click to view full size
                    </div>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Actions */}
            <div
              className={`p-6 ${isDark ? 'bg-slate-900/50' : 'bg-slate-50'} border-t ${isDark ? 'border-slate-700' : 'border-slate-200'}`}
            >
              <div className="flex flex-wrap gap-3 justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/editcase')}
                  className="px-6 py-3 rounded-xl bg-amber-500 text-white font-semibold flex items-center gap-2 shadow-lg shadow-amber-500/30 cursor-pointer border-none hover:bg-amber-600 transition-colors"
                >
                  <i className="fas fa-edit"></i>Edit Case
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(-1)}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold flex items-center gap-2 shadow-lg cursor-pointer border-none"
                >
                  <i className="fas fa-arrow-left"></i>Go Back
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Fullscreen Image Modal */}
      {showFullImage &&
        caseDetails?.INDEX_CARDS &&
        caseDetails.INDEX_CARDS !== 'N/A' &&
        !imageError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowFullImage(false)}
            className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4"
            style={{ margin: 0 }}
          >
            <button
              onClick={() => setShowFullImage(false)}
              className="absolute top-4 right-4 w-12 h-12 bg-white/10 hover:bg-white/20 
                     text-white rounded-full flex items-center justify-center 
                     transition-all duration-300 cursor-pointer border-2 border-white/30 z-10"
            >
              <i className="fas fa-times text-2xl"></i>
            </button>
            <motion.img
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              src={getImageUrl(caseDetails.INDEX_CARDS)}
              alt="Full Size Index Card"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
    </div>
  );
};

export default Details;
