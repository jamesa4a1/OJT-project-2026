import React, { useEffect, useState, useContext, useCallback } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeContext } from '../App';
import useAutoRefresh from '../hooks/useAutoRefresh';
import { useSocket, CASE_EVENTS } from '../hooks/useSocket';
import { API_BASE } from '../config/api';

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
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(null); // Track delete confirmation modal
  const [isDeleting, setIsDeleting] = useState(null); // Track which case is being deleted
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false); // Track delete all confirmation modal
  const [isDeletingAll, setIsDeletingAll] = useState(false); // Track delete all loading state

  // Function to permanently delete all terminated cases
  const handleDeleteAllCases = async () => {
    setIsDeletingAll(true);
    try {
      const response = await axios.delete(`${API_BASE}/permanent-delete-all-cases`);

      if (response.data) {
        // Show success notification
        setNotification({
          type: 'success',
          title: 'All Cases Permanently Deleted!',
          message: `${response.data.deletedCount || 'All'} terminated cases have been permanently deleted from the database.`,
          icon: 'fa-trash-alt',
        });

        // Auto-dismiss after 4 seconds
        setTimeout(() => setNotification(null), 4000);
        setShowDeleteAllModal(false);
        // Re-fetch from server to confirm cleared state
        fetchDeletedCases();
      }
    } catch (error) {
      console.error('Error deleting all cases:', error);

      // Show error notification
      setNotification({
        type: 'error',
        title: 'Deletion Failed',
        message: error.response?.data?.message || 'Failed to delete all cases. Please try again.',
        icon: 'fa-exclamation-circle',
      });

      // Auto-dismiss after 5 seconds
      setTimeout(() => setNotification(null), 5000);
      setShowDeleteAllModal(false);
    } finally {
      setIsDeletingAll(false);
    }
  };

  // Function to delete a case permanently
  const handleDeleteCase = async (docketNo) => {
    setIsDeleting(docketNo);
    console.log('Attempting to permanently delete case:', docketNo);
    try {
      const response = await axios.delete(`${API_BASE}/permanent-delete-case`, {
        data: { docket_no: docketNo },
      });

      console.log('Permanent delete response received:', response.data);
      if (response.data) {
        console.log('Case removed from list, showing success alert');

        // Show success notification
        setNotification({
          type: 'success',
          title: 'Case Permanently Deleted!',
          message: `Case ${docketNo} has been permanently deleted from the database.`,
          icon: 'fa-trash-alt',
        });

        // Auto-dismiss after 4 seconds
        setTimeout(() => setNotification(null), 4000);
        setDeleteConfirmModal(null);
        // Re-fetch from server to get accurate updated list
        fetchDeletedCases();
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
      const response = await axios.patch(`${API_BASE}/restore-case`, {
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

  // Function to export terminated cases to Excel
  const handleExportExcel = () => {
    if (cases.length === 0) return;

    const formatDate = (val) => {
      if (!val) return '';
      const d = new Date(val);
      return isNaN(d) ? val : d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const parseRespondents = (val) => {
      if (!val || val === 'N/A') return '';
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed.filter(Boolean).join(', ');
      } catch { /* not JSON */ }
      return val;
    };

    const headers = [
      'Docket No',
      'Date Filed',
      'Complainant',
      'Respondent',
      'Offense',
      'Resolving Prosecutor',
      'Filed in Court',
      'Recommendation',
      'Final Offense',
      'Penalty',
      'Decision Date',
      'Date Resolved',
      'Status',
    ];

    // Title row + blank row + header row + data rows
    const titleRow = [`TERMINATED CASES — Exported ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`];
    const blankRow = [];

    const dataRows = cases.map((c) => [
      c.DOCKET_NO || '',
      formatDate(c.DATE_FILED),
      c.COMPLAINANT || '',
      parseRespondents(c.RESPONDENT),
      c.OFFENSE || '',
      c.RESOLVING_PROSECUTOR || '',
      c.FILED_IN_COURT || '',
      c.REMARKS_DECISION || '',
      c.FINAL_OFFENSE || '',
      c.PENALTY || '',
      formatDate(c.DECISION_DATE),
      formatDate(c.DATE_RESOLVED),
      c.STATUS || '',
    ]);

    const ws = XLSX.utils.aoa_to_sheet([titleRow, blankRow, headers, ...dataRows]);

    // Merge title across all columns
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }];

    // Column widths
    ws['!cols'] = [
      { wch: 18 },  // Docket No
      { wch: 18 },  // Date Filed
      { wch: 28 },  // Complainant
      { wch: 35 },  // Respondent
      { wch: 30 },  // Offense
      { wch: 28 },  // Resolving Prosecutor
      { wch: 18 },  // Filed in Court
      { wch: 20 },  // Recommendation
      { wch: 30 },  // Final Offense
      { wch: 20 },  // Penalty
      { wch: 18 },  // Decision Date
      { wch: 18 },  // Date Resolved
      { wch: 18 },  // Status
    ];

    // Style title cell
    if (ws['A1']) {
      ws['A1'].s = {
        font: { bold: true, sz: 14 },
        alignment: { horizontal: 'center', vertical: 'center' },
      };
    }

    // Style header row (row index 2 = A3)
    headers.forEach((_, ci) => {
      const cellAddr = XLSX.utils.encode_cell({ r: 2, c: ci });
      if (!ws[cellAddr]) ws[cellAddr] = { v: headers[ci], t: 's' };
      ws[cellAddr].s = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: 'C0392B' } },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } },
        },
      };
    });

    // Style data rows with alternating colors and borders
    dataRows.forEach((row, ri) => {
      const isEven = ri % 2 === 0;
      row.forEach((_, ci) => {
        const cellAddr = XLSX.utils.encode_cell({ r: ri + 3, c: ci });
        if (!ws[cellAddr]) ws[cellAddr] = { v: '', t: 's' };
        ws[cellAddr].s = {
          fill: { fgColor: { rgb: isEven ? 'FFFFFF' : 'FDECEA' } },
          alignment: { vertical: 'center', wrapText: true },
          border: {
            top: { style: 'thin', color: { rgb: 'DDDDDD' } },
            bottom: { style: 'thin', color: { rgb: 'DDDDDD' } },
            left: { style: 'thin', color: { rgb: 'DDDDDD' } },
            right: { style: 'thin', color: { rgb: 'DDDDDD' } },
          },
        };
      });
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Terminated Cases');
    XLSX.writeFile(wb, `Terminated_Cases_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Function to download Excel file
  const handleDownloadExcel = async () => {
    setIsDownloading(true);
    try {
      const response = await axios.get(`${API_BASE}/download-excel`, {
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

  const fetchDeletedCases = useCallback(() => {
    axios
      .get(`${API_BASE}/deleted-cases`)
      .then((response) => {
        setCases(response.data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('There was an error fetching the deleted cases!', error);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchDeletedCases();
  }, [fetchDeletedCases]);

  useEffect(() => {
    setIsLoading(true);
    fetchDeletedCases();
  }, [fetchDeletedCases]);

  // Auto-refresh every 5 seconds — paused while a deletion is in progress to prevent overwriting state
  useAutoRefresh(fetchDeletedCases, 5000, isDeleting === null && !isDeletingAll);

  // Real-time updates: auto-refresh when cases change on any PC
  useSocket(CASE_EVENTS, fetchDeletedCases);

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
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[9999]"
          >
            <div
              className={`rounded-2xl px-6 py-4 shadow-2xl backdrop-blur-xl border-2 ${
                notification.type === 'success'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-600 border-teal-400/30'
                  : 'bg-gradient-to-r from-red-500 to-red-600 border-red-400/30'
              } flex items-center gap-3 min-w-[320px] max-w-[90vw] mx-4`}
            >
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  notification.type === 'success' ? 'bg-white/20' : 'bg-white/20'
                }`}
              >
                <i className={`fas ${notification.icon} text-white text-sm`}></i>
              </div>
              <div className="flex-1">
                <p className="text-white font-bold text-base m-0">{notification.title}</p>
                <p className="text-white/90 text-sm m-0 mt-1">{notification.message}</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setNotification(null)}
                className="flex-shrink-0 w-7 h-7 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white/90 hover:text-white border-none cursor-pointer transition-colors"
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

            {/* Delete All Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleExportExcel}
              disabled={cases.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl
                         bg-emerald-600 text-white font-medium
                         hover:bg-emerald-700 transition-all duration-300 shadow-sm cursor-pointer
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="fas fa-file-excel"></i>
              <span>Export Excel</span>
            </motion.button>

            {/* Delete All Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowDeleteAllModal(true)}
              disabled={cases.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl
                         bg-red-600 text-white font-medium
                         hover:bg-red-700 transition-all duration-300 shadow-sm cursor-pointer
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="fas fa-trash-alt"></i>
              <span>Delete All</span>
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
                        <div className="flex flex-col gap-0.5">
                          {(() => {
                            try {
                              const arr = JSON.parse(caseItem.COMPLAINANT);
                              if (Array.isArray(arr)) return arr.filter(Boolean).map((name, i) => (
                                <span key={i} className="font-medium text-slate-800 text-xs">{name}</span>
                              ));
                            } catch {}
                            return <span className="font-medium text-slate-800 text-xs">{caseItem.COMPLAINANT}</span>;
                          })()}
                        </div>
                      </td>
                      <td className="px-3 py-3 align-middle">
                        <div className="flex flex-col gap-0.5">
                          {(() => {
                            try {
                              const arr = JSON.parse(caseItem.RESPONDENT);
                              if (Array.isArray(arr)) return arr.filter(Boolean).map((name, i) => (
                                <span key={i} className="font-medium text-slate-800 text-xs">{name}</span>
                              ));
                            } catch {}
                            return <span className="font-medium text-slate-800 text-xs">{caseItem.RESPONDENT}</span>;
                          })()}
                        </div>
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

                    {/* MR Filed Section */}
                    {(selectedCase.MR_FILED_BY || selectedCase.DATE_MR_FILING || selectedCase.DATE_MR_RESOLVED || selectedCase.MR_FINDING) && (
                      <div className="mt-2">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200 mb-3">
                          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
                            <i className="fas fa-folder-open text-white text-sm"></i>
                          </div>
                          <span className="text-amber-700 font-medium text-sm uppercase tracking-wide">MR Filed Information</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { label: 'MR Filed By', value: selectedCase.MR_FILED_BY, icon: 'fa-user' },
                            { label: 'Date of MR Filing', value: selectedCase.DATE_MR_FILING, icon: 'fa-calendar' },
                            { label: 'Date MR Resolved', value: selectedCase.DATE_MR_RESOLVED, icon: 'fa-calendar-check' },
                            { label: 'Finding', value: selectedCase.MR_FINDING, icon: 'fa-search' },
                          ].map((item, idx) => (
                            <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-amber-50/60 border border-amber-100">
                              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                                <i className={`fas ${item.icon} text-amber-600 text-sm`}></i>
                              </div>
                              <div>
                                <p className="text-xs text-amber-600 font-medium uppercase">{item.label}</p>
                                <p className="text-slate-800 font-medium">{item.value || 'N/A'}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

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
                            src={`${API_BASE}${selectedCase.INDEX_CARDS}`}
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
                          href={`${API_BASE}${selectedCase.INDEX_CARDS}`}
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
              src={`${API_BASE}${selectedCase.INDEX_CARDS}`}
              alt="Full Size Index Card"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}

        {/* Delete All Confirmation Modal */}
        <AnimatePresence>
          {showDeleteAllModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowDeleteAllModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mx-auto mb-4">
                  <i className="fas fa-exclamation-triangle text-3xl text-red-600"></i>
                </div>

                <h2 className="text-2xl font-bold text-slate-800 text-center mb-2">
                  Delete All Terminated Cases?
                </h2>
                <p className="text-slate-600 text-center mb-4">
                  You are about to permanently delete <span className="font-bold text-red-600">{cases.length}</span> terminated case(s).
                </p>

                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-6">
                  <p className="text-sm text-red-700 m-0">
                    <i className="fas fa-exclamation-circle mr-2"></i>
                    <strong>Warning:</strong> This action cannot be undone. All terminated cases will be permanently deleted from the database and cannot be recovered.
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowDeleteAllModal(false)}
                    className="flex-1 py-2.5 rounded-xl font-semibold border-none cursor-pointer
                               bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDeleteAllCases}
                    disabled={isDeletingAll}
                    className="flex-1 py-2.5 rounded-xl font-semibold border-none cursor-pointer
                               bg-gradient-to-r from-red-600 to-red-700 text-white
                               hover:from-red-700 hover:to-red-800 transition-all shadow-lg
                               disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDeletingAll ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-trash mr-2"></i>
                        Delete All
                      </>
                    )}
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
