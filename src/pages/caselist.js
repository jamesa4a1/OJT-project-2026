import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeContext } from '../App';

const Caselist = () => {
  const { isDark } = useContext(ThemeContext) || { isDark: false };
  const [cases, setCases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState(null);
  const navigate = useNavigate();
  const [sortOption, setSortOption] = useState('RESPONDENT');
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFullImage, setShowFullImage] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(null); // Track which case is being restored
  const [notification, setNotification] = useState(null); // Track notification state
  const [showAutoDeleteModal, setShowAutoDeleteModal] = useState(false); // Track auto-delete modal state
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(null); // Track delete confirmation modal
  const [isDeleting, setIsDeleting] = useState(null); // Track which case is being deleted
  const [autoDeleteConfig, setAutoDeleteConfig] = useState({
    scheduleType: 'weekly', // 'daily', 'weekly', 'monthly'
    dayOfWeek: 'Monday', // For weekly
    dayOfMonth: '1', // For monthly
    time: '00:00', // HH:MM format
  });

  // Function to delete a case permanently
  const handleDeleteCase = async (docketNo) => {
    setIsDeleting(docketNo);
    console.log('Attempting to delete case:', docketNo);
    try {
      const response = await axios.delete('http://localhost:5000/delete-case', {
        data: { docket_no: docketNo },
      });

      console.log('Delete response received:', response.data);
      if (response.data) {
        // Remove the deleted case from the current list
        setCases((prevCases) => prevCases.filter((c) => c.DOCKET_NO !== docketNo));
        console.log('Case removed from list, showing success alert');

        // Show success notification
        setNotification({
          type: 'success',
          title: 'Case Permanently Deleted!',
          message: `Case ${docketNo} has been permanently deleted.`,
          icon: 'fa-trash-alt',
        });

        // Auto-dismiss after 4 seconds
        setTimeout(() => setNotification(null), 4000);
        setDeleteConfirmModal(null);
      }
    } catch (error) {
      console.error('Full error object:', error);
      console.error('Error response status:', error.response?.status);
      console.error('Error response data:', error.response?.data);
      console.error('Error message:', error.message);

      // Show error notification
      setNotification({
        type: 'error',
        title: 'Deletion Failed',
        message: error.response?.data?.message || 'Failed to delete case. Please try again.',
        icon: 'fa-exclamation-circle',
      });

      // Auto-dismiss after 5 seconds
      setTimeout(() => setNotification(null), 5000);
      setDeleteConfirmModal(null);
    } finally {
      setIsDeleting(null);
    }
  };

  // Function to restore a deleted case
  const handleRestoreCase = async (docketNo) => {
    setIsRestoring(docketNo);
    console.log('Attempting to restore case:', docketNo);
    try {
      console.log('Sending PATCH request to /restore-case with:', { docket_no: docketNo });
      const response = await axios.patch('http://localhost:5000/restore-case', {
        docket_no: docketNo,
      });

      console.log('Restore response received:', response.data);
      if (response.data) {
        // Remove the restored case from the current list
        setCases((prevCases) => prevCases.filter((c) => c.DOCKET_NO !== docketNo));
        console.log('Case removed from list, showing success alert');

        // Show success notification
        setNotification({
          type: 'success',
          title: 'Case Restored Successfully!',
          message: `Case ${docketNo} has been restored and is now active.`,
          icon: 'fa-check-circle',
        });

        // Auto-dismiss after 4 seconds
        setTimeout(() => setNotification(null), 4000);
      }
    } catch (error) {
      console.error('Full error object:', error);
      console.error('Error response status:', error.response?.status);
      console.error('Error response data:', error.response?.data);
      console.error('Error message:', error.message);

      // Show error notification
      setNotification({
        type: 'error',
        title: 'Restoration Failed',
        message: error.response?.data?.message || 'Failed to restore case. Please try again.',
        icon: 'fa-exclamation-circle',
      });

      // Auto-dismiss after 5 seconds
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setIsRestoring(null);
    }
  };

  // Function to download Excel file
  const handleDownloadExcel = async () => {
    setIsDownloading(true);
    try {
      const response = await axios.get('http://localhost:5000/download-excel', {
        responseType: 'blob',
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'cases.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading Excel:', error);
      alert('Failed to download Excel file');
    } finally {
      setIsDownloading(false);
    }
  };

  // Function to configure automatic deletion
  const handleAutoDeleteConfig = async () => {
    try {
      console.log('Auto-delete configuration:', autoDeleteConfig);

      // Call API to set up automatic deletion schedule
      const response = await axios.post('http://localhost:5000/configure-auto-delete', {
        scheduleType: autoDeleteConfig.scheduleType,
        dayOfWeek: autoDeleteConfig.dayOfWeek,
        dayOfMonth: autoDeleteConfig.dayOfMonth,
        time: autoDeleteConfig.time,
      });

      setNotification({
        type: 'success',
        title: 'Auto-Delete Configured!',
        message: `Deleted cases will be permanently deleted ${autoDeleteConfig.scheduleType} at ${autoDeleteConfig.time}.`,
        icon: 'fa-check-circle',
      });

      setTimeout(() => setNotification(null), 4000);
      setShowAutoDeleteModal(false);
    } catch (error) {
      console.error('Error configuring auto-delete:', error);
      setNotification({
        type: 'error',
        title: 'Configuration Failed',
        message: 'Failed to configure automatic deletion. Please try again.',
        icon: 'fa-exclamation-circle',
      });

      setTimeout(() => setNotification(null), 5000);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    axios
      .get('http://localhost:5000/deleted-cases')
      .then((response) => {
        setCases(response.data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('There was an error fetching the deleted cases!', error);
        setIsLoading(false);
      });
  }, []);

  const handleSort = (option, direction) => {
    setSortOption(option);
    setSortDirection(direction);
    const sortedCases = [...cases].sort((a, b) => {
      if (a[option] < b[option]) return direction === 'asc' ? -1 : 1;
      if (a[option] > b[option]) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    setCases(sortedCases);
  };

  // Filter only by Docket No or IS Case Number
  const filteredCases = cases.filter(
    (c) =>
      c.DOCKET_NO?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.IS_CASE_NO?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.CRIM_CASE_NO?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div
      className={`min-h-screen py-8 px-4 relative overflow-hidden transition-colors duration-300 ${
        isDark 
          ? 'bg-slate-900' 
          : 'bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100'
      }`}
    >
      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            className="fixed top-0 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div
              className={`rounded-b-2xl px-6 py-4 shadow-lg backdrop-blur-xl border-b-2 ${
                notification.type === 'success'
                  ? 'bg-teal-500/95 border-teal-400'
                  : 'bg-red-500/95 border-red-400'
              } flex items-center gap-3 min-w-max`}
            >
              <div
                className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                  notification.type === 'success' ? 'bg-white/30' : 'bg-white/30'
                }`}
              >
                <i className={`fas ${notification.icon} text-white text-sm`}></i>
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold text-sm m-0">{notification.title}</p>
                <p className="text-white/90 text-xs m-0">{notification.message}</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setNotification(null)}
                className="flex-shrink-0 w-5 h-5 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white/90 hover:text-white border-none cursor-pointer transition-colors"
              >
                <i className="fas fa-times text-xs"></i>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`absolute inset-0 overflow-hidden pointer-events-none ${isDark ? 'opacity-50' : 'opacity-100'}`}>
        <div className={`absolute top-20 right-20 w-72 h-72 ${isDark ? 'bg-violet-500/10' : 'bg-violet-500/5'} rounded-full blur-3xl`}></div>
        <div className={`absolute bottom-20 left-20 w-72 h-72 ${isDark ? 'bg-blue-500/10' : 'bg-blue-500/5'} rounded-full blur-3xl`}></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 max-w-7xl mx-auto"
      >
        {/* Header with HeroUI Design */}
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-3
                       bg-gradient-to-br from-red-500 via-red-600 to-red-700 shadow-lg shadow-red-500/30"
          >
            <i className="fas fa-trash-alt text-xl text-white"></i>
          </motion.div>
          <h1 className={`text-2xl md:text-3xl font-bold mb-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Terminated Cases</h1>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Browse all Terminated cases by the administrator</p>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-3 mb-5 items-center justify-between">
          <motion.button
            whileHover={{ x: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/admin-dashboard')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium
                       transition-all duration-300 shadow-sm cursor-pointer border-none ${
                         isDark 
                           ? 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700' 
                           : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                       }`}
          >
            <i className="fas fa-arrow-left"></i>
            <span>Back to Dashboard</span>
          </motion.button>

          <div className="flex flex-wrap gap-4 items-center">
            {/* Search by Docket/IS Case Number */}
            <div className="relative">
              <i className={`fas fa-search absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}></i>
              <input
                type="text"
                placeholder="Search by Docket/IS Case No..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-xl border-2 border-slate-200 bg-white
                           focus:border-red-500 focus:ring-4 focus:ring-red-500/20
                           transition-all duration-300 outline-none w-72"
              />
            </div>

            {/* Sort */}
            <select
              className="px-4 py-2 rounded-xl border-2 border-slate-200 bg-white
                         focus:border-red-500 outline-none cursor-pointer"
              onChange={(e) => handleSort(sortOption, e.target.value)}
              value={sortDirection}
            >
              <option value="asc">A-Z</option>
              <option value="desc">Z-A</option>
            </select>

            {/* Auto-Delete Configuration Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAutoDeleteModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl
                         bg-purple-600 text-white font-medium
                         hover:bg-purple-700 transition-all duration-300 shadow-sm cursor-pointer"
            >
              <i className="fas fa-clock"></i>
              <span>Auto-Delete Schedule</span>
            </motion.button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 font-medium">Loading deleted cases...</p>
          </div>
        ) : (
          <>
            {/* Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden"
            >
              <table className="w-full">
                <thead className="bg-gradient-to-r from-red-600 via-red-700 to-red-600 text-white">
                  <tr>
                    <th className="px-3 py-3 text-left font-bold text-xs uppercase tracking-wide whitespace-nowrap">
                      <i className="fas fa-hashtag mr-1.5 text-xs"></i>Docket
                    </th>
                    <th className="px-3 py-3 text-left font-bold text-xs uppercase tracking-wide">
                      <i className="fas fa-user mr-1.5 text-xs"></i>Complainant
                    </th>
                    <th className="px-3 py-3 text-left font-bold text-xs uppercase tracking-wide">
                      <i className="fas fa-user-tag mr-1.5 text-xs"></i>Respondent
                    </th>
                    <th className="px-3 py-3 text-left font-bold text-xs uppercase tracking-wide whitespace-nowrap">
                      <i className="fas fa-gavel mr-1.5 text-xs"></i>Offense
                    </th>
                    <th className="px-3 py-3 text-left font-bold text-xs uppercase tracking-wide whitespace-nowrap">
                      <i className="fas fa-calendar mr-1.5 text-xs"></i>Filed
                    </th>
                    <th className="px-3 py-3 text-left font-bold text-xs uppercase tracking-wide whitespace-nowrap">
                      <i className="fas fa-user-tie mr-1.5 text-xs"></i>Prosecutor
                    </th>
                    <th className="px-3 py-3 text-center font-bold text-xs uppercase tracking-wide whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCases.map((caseItem, index) => (
                    <motion.tr
                      key={caseItem.DOCKET_NO}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-slate-100 hover:bg-red-50/30 transition-colors"
                    >
                      <td className="px-3 py-3 align-middle whitespace-nowrap">
                        <span className="font-mono font-bold text-red-700 text-xs">
                          {caseItem.DOCKET_NO || caseItem.IS_CASE_NO}
                        </span>
                      </td>
                      <td className="px-3 py-3 align-middle">
                        <span className="font-medium text-slate-800 text-xs line-clamp-1">
                          {caseItem.COMPLAINANT}
                        </span>
                      </td>
                      <td className="px-3 py-3 align-middle">
                        <span className="font-medium text-slate-800 text-xs line-clamp-1">
                          {caseItem.RESPONDENT}
                        </span>
                      </td>
                      <td className="px-3 py-3 align-middle">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-100 text-orange-800 text-xs font-semibold whitespace-nowrap">
                          <i className="fas fa-exclamation-triangle text-xs flex-shrink-0"></i>
                          <span className="truncate max-w-xs">{caseItem.OFFENSE || 'N/A'}</span>
                        </span>
                      </td>
                      <td className="px-3 py-3 align-middle whitespace-nowrap">
                        <span className="font-medium text-slate-700 text-xs">
                          {caseItem.DATE_FILED
                            ? new Date(caseItem.DATE_FILED).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: '2-digit',
                              })
                            : 'N/A'}
                        </span>
                      </td>
                      <td className="px-3 py-3 align-middle whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                          <i className="fas fa-user-tie text-xs flex-shrink-0"></i>
                          {caseItem.RESOLVING_PROSECUTOR || 'N/A'}
                        </span>
                      </td>
                      <td className="px-3 py-3 align-middle">
                        <div className="flex items-center justify-center gap-1">
                          <motion.button
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleRestoreCase(caseItem.DOCKET_NO)}
                            disabled={isRestoring === caseItem.DOCKET_NO}
                            className="inline-flex items-center justify-center gap-1 w-20 h-8 rounded-lg
                                         bg-gradient-to-r from-green-600 to-green-700 text-white
                                         font-semibold text-xs shadow-md shadow-green-500/30
                                         hover:shadow-green-500/40 transition-all duration-300 border-none cursor-pointer
                                         disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                            title="Restore this case"
                          >
                            {isRestoring === caseItem.DOCKET_NO ? (
                              <>
                                <i className="fas fa-spinner fa-spin text-xs"></i>
                              </>
                            ) : (
                              <>
                                <i className="fas fa-undo text-xs"></i>
                                <span>Restore</span>
                              </>
                            )}
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedCase(caseItem)}
                            className="inline-flex items-center justify-center gap-1 w-16 h-8 rounded-lg
                                         bg-gradient-to-r from-blue-600 to-blue-700 text-white
                                         font-semibold text-xs shadow-md shadow-blue-500/30
                                         hover:shadow-blue-500/40 transition-all duration-300 border-none cursor-pointer whitespace-nowrap"
                            title="View case details"
                          >
                            <i className="fas fa-eye text-xs"></i>
                            <span>View</span>
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setDeleteConfirmModal(caseItem)}
                            disabled={isDeleting === caseItem.DOCKET_NO}
                            className="inline-flex items-center justify-center gap-1 w-20 h-8 rounded-lg
                                         bg-gradient-to-r from-orange-600 to-orange-700 text-white
                                         font-semibold text-xs shadow-md shadow-orange-500/30
                                         hover:shadow-orange-500/40 transition-all duration-300 border-none cursor-pointer
                                         disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                            title="Permanently delete this case"
                          >
                            {isDeleting === caseItem.DOCKET_NO ? (
                              <>
                                <i className="fas fa-spinner fa-spin text-xs"></i>
                              </>
                            ) : (
                              <>
                                <i className="fas fa-trash text-xs"></i>
                                <span>Delete</span>
                              </>
                            )}
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>

              {filteredCases.length === 0 && (
                <div className="text-center py-12">
                  <i className="fas fa-trash-alt text-4xl text-slate-300 mb-4"></i>
                  <p className="text-slate-500 font-medium">No deleted cases yet</p>
                  <p className="text-slate-400 text-sm">
                    Cases deleted by the admin will appear here
                  </p>
                </div>
              )}
            </motion.div>
          </>
        )}

        {/* Modal */}
        <AnimatePresence>
          {selectedCase && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
              onClick={() => setSelectedCase(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                        <i className="fas fa-file-alt text-blue-600"></i>
                      </div>
                      Case Details
                    </h2>
                    <button
                      onClick={() => setSelectedCase(null)}
                      className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center
                                 hover:bg-slate-200 transition-colors cursor-pointer border-none"
                    >
                      <i className="fas fa-times text-slate-600"></i>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {[
                      { label: 'Docket Number', value: selectedCase.DOCKET_NO, icon: 'fa-hashtag' },
                      { label: 'Date Filed', value: selectedCase.DATE_FILED, icon: 'fa-calendar' },
                      { label: 'Complainant', value: selectedCase.COMPLAINANT, icon: 'fa-user' },
                      { label: 'Respondent', value: selectedCase.RESPONDENT, icon: 'fa-user-tag' },
                      {
                        label: 'Offense',
                        value: selectedCase.OFFENSE,
                        icon: 'fa-exclamation-triangle',
                      },
                      {
                        label: 'Date Resolved',
                        value: selectedCase.DATE_RESOLVED,
                        icon: 'fa-calendar-check',
                      },
                      {
                        label: 'Resolving Prosecutor',
                        value: selectedCase.RESOLVING_PROSECUTOR,
                        icon: 'fa-user-tie',
                      },
                      {
                        label: 'Criminal Case No.',
                        value: selectedCase.CRIM_CASE_NO,
                        icon: 'fa-gavel',
                      },
                      { label: 'Branch', value: selectedCase.BRANCH, icon: 'fa-building' },
                      {
                        label: 'Date Filed in Court',
                        value: selectedCase.DATEFILED_IN_COURT,
                        icon: 'fa-landmark',
                      },
                      { label: 'Remarks', value: selectedCase.REMARKS, icon: 'fa-comment' },
                      { label: 'Penalty', value: selectedCase.PENALTY, icon: 'fa-balance-scale' },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <i className={`fas ${item.icon} text-blue-600 text-sm`}></i>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-medium uppercase">
                            {item.label}
                          </p>
                          <p className="text-slate-800 font-medium">{item.value || 'N/A'}</p>
                        </div>
                      </div>
                    ))}

                    {selectedCase.INDEX_CARDS && selectedCase.INDEX_CARDS !== 'N/A' && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-200">
                          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                            <i className="fas fa-image text-white text-sm"></i>
                          </div>
                          <span className="text-blue-700 font-medium">Index Card Image</span>
                        </div>
                        <div className="relative">
                          <img
                            src={`http://localhost:5000${selectedCase.INDEX_CARDS}`}
                            alt="Index Card"
                            onClick={() => setShowFullImage(true)}
                            className="w-full max-h-80 object-contain rounded-xl border-2 border-slate-200 shadow-md cursor-pointer hover:opacity-90 transition-opacity"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                          <div className="absolute bottom-2 left-2 px-3 py-1.5 bg-black/60 text-white text-xs rounded-lg">
                            <i className="fas fa-search-plus mr-1"></i> Click to view full size
                          </div>
                        </div>
                        <a
                          href={`http://localhost:5000${selectedCase.INDEX_CARDS}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-center px-4 py-2 rounded-lg bg-blue-500 text-white font-medium
                                     hover:bg-blue-600 transition-colors no-underline"
                        >
                          <i className="fas fa-external-link-alt mr-2"></i>Open in New Tab
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fullscreen Image Modal */}
        {showFullImage && selectedCase?.INDEX_CARDS && selectedCase.INDEX_CARDS !== 'N/A' && (
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
              src={`http://localhost:5000${selectedCase.INDEX_CARDS}`}
              alt="Full Size Index Card"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}

        {/* Auto-Delete Configuration Modal */}
        <AnimatePresence>
          {showAutoDeleteModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowAutoDeleteModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                      <i className="fas fa-clock text-purple-600"></i>
                    </div>
                    Auto-Delete Schedule
                  </h2>
                  <button
                    onClick={() => setShowAutoDeleteModal(false)}
                    className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center
                               hover:bg-slate-200 transition-colors cursor-pointer border-none"
                  >
                    <i className="fas fa-times text-slate-600"></i>
                  </button>
                </div>

                {/* Scheduled Time Info Banner */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-200 flex items-center justify-center flex-shrink-0">
                      <i className="fas fa-calendar-check text-purple-600 text-lg"></i>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 m-0">
                        <i className="fas fa-info-circle mr-2 text-purple-600"></i>
                        Auto deletion of cases will delete at{' '}
                        <span className="text-purple-600 font-bold">{autoDeleteConfig.time}</span>
                      </p>
                      <p className="text-xs text-slate-600 m-0 mt-1">
                        {autoDeleteConfig.scheduleType === 'daily' && '(Every day)'}
                        {autoDeleteConfig.scheduleType === 'weekly' &&
                          `(Every ${autoDeleteConfig.dayOfWeek})`}
                        {autoDeleteConfig.scheduleType === 'monthly' &&
                          `(On day ${autoDeleteConfig.dayOfMonth} of each month)`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Schedule Type */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      <i className="fas fa-hourglass-half mr-2 text-purple-600"></i>
                      Schedule Type
                    </label>
                    <select
                      value={autoDeleteConfig.scheduleType}
                      onChange={(e) =>
                        setAutoDeleteConfig({ ...autoDeleteConfig, scheduleType: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 bg-white
                                 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>

                  {/* Day of Week (for weekly) */}
                  {autoDeleteConfig.scheduleType === 'weekly' && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        <i className="fas fa-calendar mr-2 text-purple-600"></i>
                        Day of Week
                      </label>
                      <select
                        value={autoDeleteConfig.dayOfWeek}
                        onChange={(e) =>
                          setAutoDeleteConfig({ ...autoDeleteConfig, dayOfWeek: e.target.value })
                        }
                        className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 bg-white
                                   focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
                      >
                        <option value="Monday">Monday</option>
                        <option value="Tuesday">Tuesday</option>
                        <option value="Wednesday">Wednesday</option>
                        <option value="Thursday">Thursday</option>
                        <option value="Friday">Friday</option>
                        <option value="Saturday">Saturday</option>
                        <option value="Sunday">Sunday</option>
                      </select>
                    </div>
                  )}

                  {/* Day of Month (for monthly) */}
                  {autoDeleteConfig.scheduleType === 'monthly' && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        <i className="fas fa-calendar-days mr-2 text-purple-600"></i>
                        Day of Month
                      </label>
                      <select
                        value={autoDeleteConfig.dayOfMonth}
                        onChange={(e) =>
                          setAutoDeleteConfig({ ...autoDeleteConfig, dayOfMonth: e.target.value })
                        }
                        className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 bg-white
                                   focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
                      >
                        {Array.from({ length: 28 }, (_, i) => (
                          <option key={i + 1} value={String(i + 1)}>
                            Day {i + 1}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Time */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      <i className="fas fa-clock mr-2 text-purple-600"></i>
                      Deletion Time (24-hour format)
                    </label>
                    <input
                      type="time"
                      value={autoDeleteConfig.time}
                      onChange={(e) =>
                        setAutoDeleteConfig({ ...autoDeleteConfig, time: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 bg-white
                                 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
                    />
                  </div>

                  {/* Info Box */}
                  <div className="p-3 rounded-xl bg-purple-50 border border-purple-200">
                    <p className="text-sm text-purple-700 m-0">
                      <i className="fas fa-info-circle mr-2"></i>
                      All permanently deleted cases cannot be recovered. Make sure to back up
                      important data first.
                    </p>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-6 mt-6 border-t border-slate-200">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowAutoDeleteModal(false)}
                    className="flex-1 py-2.5 rounded-xl font-semibold border-none cursor-pointer
                               bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAutoDeleteConfig}
                    className="flex-1 py-2.5 rounded-xl font-semibold border-none cursor-pointer
                               bg-gradient-to-r from-purple-600 to-purple-700 text-white
                               hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg"
                  >
                    <i className="fas fa-check mr-2"></i>
                    Proceed
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {deleteConfirmModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
              onClick={() => setDeleteConfirmModal(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 mx-auto mb-4">
                  <i className="fas fa-exclamation-triangle text-3xl text-orange-600"></i>
                </div>

                <h2 className="text-2xl font-bold text-slate-800 text-center mb-2">
                  Permanently Delete Case?
                </h2>
                <p className="text-slate-600 text-center mb-2">
                  Case: <span className="font-bold text-orange-600">{deleteConfirmModal.DOCKET_NO}</span>
                </p>

                <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-lg mb-6">
                  <p className="text-sm text-orange-700 m-0">
                    <i className="fas fa-info-circle mr-2"></i>
                    This action cannot be undone. The case will be permanently deleted from the system.
                  </p>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex items-start gap-2 text-sm text-slate-600">
                    <i className="fas fa-user mt-0.5 flex-shrink-0 text-slate-400"></i>
                    <span><strong>Complainant:</strong> {deleteConfirmModal.COMPLAINANT}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-slate-600">
                    <i className="fas fa-user-tag mt-0.5 flex-shrink-0 text-slate-400"></i>
                    <span><strong>Respondent:</strong> {deleteConfirmModal.RESPONDENT}</span>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setDeleteConfirmModal(null)}
                    className="flex-1 py-2.5 rounded-xl font-semibold border-none cursor-pointer
                               bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleDeleteCase(deleteConfirmModal.DOCKET_NO)}
                    disabled={isDeleting === deleteConfirmModal.DOCKET_NO}
                    className="flex-1 py-2.5 rounded-xl font-semibold border-none cursor-pointer
                               bg-gradient-to-r from-orange-600 to-orange-700 text-white
                               hover:from-orange-700 hover:to-orange-800 transition-all shadow-lg
                               disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDeleting === deleteConfirmModal.DOCKET_NO ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-trash mr-2"></i>
                        Delete Permanently
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Caselist;
