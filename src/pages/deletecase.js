import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ThemeContext } from '../App';
import ImageModal from '../components/ImageModal';

const Deletecase = () => {
  const { isDark } = useContext(ThemeContext) || { isDark: false };
  const { user } = useAuth();
  const [cases, setCases] = useState([]);
  const [filteredCases, setFilteredCases] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('default'); // 'default', 'complainant-asc', 'date-asc', 'date-desc'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'terminated'
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [editedCase, setEditedCase] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showFullscreenImage, setShowFullscreenImage] = useState(false);
  const navigate = useNavigate();

  // Fetch all cases on component mount
  useEffect(() => {
    fetchAllCases();
  }, []);

  // Filter cases when search term changes
  useEffect(() => {
    let filtered = cases;

    // Apply status filter
    if (statusFilter === 'pending') {
      filtered = filtered.filter((c) => {
        const status = (c.REMARKS_DECISION || '').toLowerCase();
        return status === 'pending';
      });
    } else if (statusFilter === 'dismissed') {
      filtered = filtered.filter((c) => {
        const status = (c.REMARKS_DECISION || '').toLowerCase();
        return status === 'dismissed';
      });
    } else if (statusFilter === 'convicted') {
      filtered = filtered.filter((c) => {
        const status = (c.REMARKS_DECISION || '').toLowerCase();
        return status === 'convicted';
      });
    }

    // Apply search filter
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(
        (c) =>
          c.DOCKET_NO?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.COMPLAINANT?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.RESPONDENT?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.OFFENSE?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    let sorted = [...filtered];
    if (sortOption === 'complainant-asc') {
      sorted.sort((a, b) => {
        const nameA = (a.COMPLAINANT || '').toLowerCase();
        const nameB = (b.COMPLAINANT || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });
    } else if (sortOption === 'date-asc') {
      sorted.sort((a, b) => new Date(a.DATE_FILED || 0) - new Date(b.DATE_FILED || 0));
    } else if (sortOption === 'date-desc') {
      sorted.sort((a, b) => new Date(b.DATE_FILED || 0) - new Date(a.DATE_FILED || 0));
    }

    setFilteredCases(sorted);
  }, [searchTerm, cases, sortOption, statusFilter]);

  const fetchAllCases = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await axios.get('http://localhost:5000/cases');
      setCases(response.data);
      setFilteredCases(response.data);
    } catch (err) {
      console.error('Error fetching cases:', err);
      if (err.response) {
        // Server responded with error
        if (err.response.status === 503) {
          setError('❌ Database connection failed. Please ensure MySQL/XAMPP is running and the database is accessible.');
        } else {
          setError(err.response.data?.message || 'Error fetching cases from server.');
        }
      } else if (err.request) {
        // Request was made but no response
        setError('❌ Cannot connect to server. Please ensure the server is running on http://localhost:5000');
      } else {
        // Something else happened
        setError('Error fetching cases: ' + err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (caseItem) => {
    setSelectedCase(caseItem);
    setShowConfirm(true);
  };

  const handleViewClick = (caseItem) => {
    setSelectedCase(caseItem);
    setShowViewModal(true);
  };

  const handleEditClick = (caseItem) => {
    setSelectedCase(caseItem);
    setEditedCase(caseItem);
    setSelectedImage(null);
    // Set imagePreview with proper path handling
    const imagePath = caseItem.INDEX_CARDS;
    console.log('INDEX_CARDS from database:', imagePath);
    if (imagePath && imagePath !== 'N/A' && imagePath.trim() !== '') {
      setImagePreview(imagePath);
    } else {
      setImagePreview(null);
    }
    setShowEditModal(true);
  };

  const handleFieldChange = (field, value) => {
    setEditedCase((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdate = async () => {
    if (!editedCase || !editedCase.id) return;
    setIsLoading(true);
    console.log('📝 Updating case with data:', editedCase);
    try {
      let response;

      // If there's an image to upload, use the image upload endpoint
      if (selectedImage) {
        console.log('📷 Uploading with image');
        const formData = new FormData();
        formData.append('id', editedCase.id);
        formData.append('indexCardImage', selectedImage);

        // Append all other fields
        Object.keys(editedCase).forEach((key) => {
          if (key !== 'id' && key !== 'INDEX_CARDS' && editedCase[key] !== undefined) {
            formData.append(key, editedCase[key] || '');
          }
        });

        response = await axios.post('http://localhost:5000/update-case-with-image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        // No image, use regular update
        console.log('📄 Updating without image');
        const updateData = {
          id: editedCase.id,
          updated_fields: {
            DATE_FILED: editedCase.DATE_FILED,
            COMPLAINANT: editedCase.COMPLAINANT,
            RESPONDENT: editedCase.RESPONDENT,
            ADDRESS_OF_RESPONDENT: editedCase.ADDRESS_OF_RESPONDENT,
            OFFENSE: editedCase.OFFENSE,
            DATE_OF_COMMISSION: editedCase.DATE_OF_COMMISSION,
            DATE_RESOLVED: editedCase.DATE_RESOLVED,
            RESOLVING_PROSECUTOR: editedCase.RESOLVING_PROSECUTOR,
            REMARKS_DECISION: editedCase.REMARKS_DECISION,
            PENALTY: editedCase.PENALTY,
            CRIM_CASE_NO: editedCase.CRIM_CASE_NO,
            BRANCH: editedCase.BRANCH,
            DATEFILED_IN_COURT: editedCase.DATEFILED_IN_COURT,
          },
        };
        console.log('📤 Sending update data:', updateData);
        response = await axios.post('http://localhost:5000/update-case', updateData);
      }

      if (response.status === 200) {
        setShowEditModal(false);
        setSelectedCase(null);
        setEditedCase({});
        setSelectedImage(null);
        setImagePreview(null);
        setError('');
        fetchAllCases(); // Refresh to get updated data
      }
    } catch (err) {
      console.error('Update error:', err);
      if (err.response) {
        // Server responded with error
        if (err.response.status === 503) {
          setError('❌ Database connection failed. Please ensure MySQL/XAMPP is running and the database is accessible.');
        } else if (err.response.status === 400) {
          const errorMsg = err.response.data?.errors 
            ? err.response.data.errors.map(e => `${e.field}: ${e.message}`).join(', ')
            : err.response.data?.message || 'Invalid data provided';
          setError('❌ Validation error: ' + errorMsg);
        } else {
          setError('❌ ' + (err.response.data?.message || 'Error updating case. Please try again.'));
        }
      } else if (err.request) {
        setError('❌ Cannot connect to server. Please ensure the server is running on http://localhost:5000');
      } else {
        setError('❌ Error updating case: ' + err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCase) return;
    setIsLoading(true);
    try {
      await axios.delete('http://localhost:5000/delete-case', {
        data: { docket_no: selectedCase.DOCKET_NO },
      });
      // Remove from local state
      setCases((prev) => prev.filter((c) => c.id !== selectedCase.id));
      setShowConfirm(false);
      setSelectedCase(null);
    } catch (err) {
      setError('Error deleting case. Please try again.');
    }
    setIsLoading(false);
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === '0000-00-00') return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-CA');
    } catch {
      return dateString;
    }
  };

  return (
    <div
      className={`min-h-screen py-2 px-4 relative overflow-hidden ${
        isDark
          ? 'bg-slate-900'
          : 'bg-gradient-to-br from-slate-50 via-red-50/20 to-slate-100'
      }`}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-20 right-20 w-72 h-72 rounded-full blur-3xl ${isDark ? 'bg-red-500/10' : 'bg-red-500/5'}`}></div>
        <div className={`absolute bottom-20 left-20 w-72 h-72 rounded-full blur-3xl ${isDark ? 'bg-slate-500/10' : 'bg-slate-500/5'}`}></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-full mx-auto px-3 lg:px-4"
      >
        {/* Header */}
        <div className="text-center mb-2">
          <h1 className={`text-2xl md:text-3xl font-bold mb-1 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>Manage Cases</h1>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {user?.role === 'Admin'
              ? 'View, modify, and delete cases from the system'
              : 'View and Modify Cases from System'}
          </p>
        </div>

        {/* Back Button & Search */}
        <div className="flex flex-col gap-2 mb-3">
          {/* Controls Row */}
          <div className="flex flex-col lg:flex-row gap-2 items-center justify-start">
            {/* Back Button */}
            <motion.button
              whileHover={{ x: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/admin-dashboard')}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg border transition-all duration-300 shadow-sm cursor-pointer text-sm ${
                isDark
                  ? 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <i className="fas fa-arrow-left text-xs"></i>
              <span className="font-medium">Back</span>
            </motion.button>
            {/* Search Bar */}
            <div className="relative w-full lg:w-80">
              <i className={`fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}></i>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className={`w-full pl-9 pr-3 py-2 rounded-lg border-2 transition-all duration-300 outline-none text-sm ${
                  isDark
                    ? 'border-slate-600 bg-slate-700 text-slate-100 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                    : 'border-slate-200 bg-white text-slate-700 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                }`}
              />
            </div>

            {/* Sort Dropdown */}
            <div className="relative w-full lg:w-56">
              <i className={`fas fa-sort-amount-down absolute left-3 top-1/2 -translate-y-1/2 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}></i>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className={`w-full pl-9 pr-3 py-2 rounded-lg border-2 transition-all duration-300 outline-none cursor-pointer text-sm ${
                  isDark
                    ? 'border-slate-600 bg-slate-700 text-slate-100 focus:border-red-500 focus:ring-4 focus:ring-red-500/20'
                    : 'border-slate-200 bg-white text-slate-700 focus:border-red-500 focus:ring-4 focus:ring-red-500/20'
                }`}
              >
                <option value="default">Default Order</option>
                <option value="complainant-asc">Complainant (A-Z)</option>
                <option value="date-asc">Date Filed (Oldest First)</option>
                <option value="date-desc">Date Filed (Newest First)</option>
              </select>
            </div>

            {/* Status Filter Dropdown */}
            <div className="relative w-full lg:w-64">
              <i className={`fas fa-filter absolute left-4 top-1/2 -translate-y-1/2 text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}></i>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`w-full pl-9 pr-3 py-2 rounded-lg border-2 transition-all duration-300 outline-none cursor-pointer font-semibold text-sm ${
                  isDark
                    ? 'border-slate-600 bg-slate-700 text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                    : 'border-slate-200 bg-white text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                }`}
              >
                <option value="all">All Cases</option>
                <option value="pending">Pending</option>
                <option value="dismissed">Dismissed</option>
                <option value="convicted">Convicted</option>
              </select>
            </div>

            {/* Refresh Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={fetchAllCases}
              className={`flex items-center gap-1 px-4 py-2 rounded-lg transition-all duration-300 shadow-sm cursor-pointer min-w-fit font-medium whitespace-nowrap text-sm ${
                isDark
                  ? 'bg-slate-700 text-slate-100 hover:bg-slate-600'
                  : 'bg-slate-700 text-white hover:bg-slate-800'
              }`}
            >
              <i className={`fas fa-sync-alt ${isLoading ? 'animate-spin' : ''}`}></i>
              <span className="font-medium hidden sm:inline">Refresh</span>
            </motion.button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`p-4 rounded-xl border flex items-center gap-3 mb-6 ${
              isDark
                ? 'bg-red-950/30 border-red-800 text-red-300'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}
          >
            <i className="fas fa-exclamation-circle"></i>
            <span>{error}</span>
          </motion.div>
        )}

        {/* Cases Count */}
        <div className={`mb-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          <span className="font-semibold">{filteredCases.length}</span> case
          {filteredCases.length !== 1 ? 's' : ''} found
        </div>

        {/* Cases Table */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`rounded-3xl shadow-xl border overflow-hidden ${
            isDark
              ? 'bg-slate-800 border-slate-700'
              : 'bg-white border-slate-200'
          }`}
        >
          {isLoading && cases.length === 0 ? (
            <div className="p-12 text-center">
              <div className={`w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4 ${
                isDark
                  ? 'border-slate-600 border-t-blue-500'
                  : 'border-slate-200 border-t-red-500'
              }`}></div>
              <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>Loading cases...</p>
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="p-12 text-center">
              <i className={`fas fa-folder-open text-6xl mb-4 ${isDark ? 'text-slate-600' : 'text-slate-300'}`}></i>
              <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>No cases found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`bg-gradient-to-r ${isDark ? 'from-slate-700 to-slate-800' : 'from-slate-700 to-slate-800'} text-white`}>
                    <th className="px-4 py-4 text-left font-semibold">Docket No</th>
                    <th className="px-4 py-4 text-left font-semibold">Date Filed</th>
                    <th className="px-4 py-4 text-left font-semibold">Complainant</th>
                    <th className="px-4 py-4 text-left font-semibold">Respondent</th>
                    <th className="px-4 py-4 text-left font-semibold">Offense</th>
                    <th className="px-4 py-4 text-left font-semibold">Decision</th>
                    <th className="px-4 py-4 text-center font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCases.map((caseItem, index) => (
                    <motion.tr
                      key={caseItem.id || index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className={`border-b transition-colors ${
                        isDark
                          ? 'border-slate-700 hover:bg-slate-700/50'
                          : 'border-slate-100 hover:bg-red-50/50'
                      } ${index % 2 === 0 ? (isDark ? 'bg-slate-800' : 'bg-white') : (isDark ? 'bg-slate-700/40' : 'bg-slate-50/50')}`}
                    >
                      <td className="px-4 py-4">
                        <span className={`font-mono font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                          {caseItem.DOCKET_NO || 'N/A'}
                        </span>
                      </td>
                      <td className={`px-4 py-4 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                        {formatDate(caseItem.DATE_FILED)}
                      </td>
                      <td className={`px-4 py-4 font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                        {caseItem.COMPLAINANT || 'N/A'}
                      </td>
                      <td className={`px-4 py-4 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{caseItem.RESPONDENT || 'N/A'}</td>
                      <td className="px-4 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          isDark
                            ? 'bg-slate-700 text-slate-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {caseItem.OFFENSE || 'N/A'}
                        </span>
                      </td>
                      <td className={`px-4 py-4 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                        {(() => {
                          const decision = (caseItem.REMARKS_DECISION || '').toLowerCase();
                          if (decision === 'pending')
                            return (
                              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                isDark
                                  ? 'bg-yellow-900/30 text-yellow-300'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                Pending
                              </span>
                            );
                          if (decision === 'dismissed')
                            return (
                              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                isDark
                                  ? 'bg-blue-900/30 text-blue-300'
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                Dismissed
                              </span>
                            );
                          if (decision === 'convicted')
                            return (
                              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                isDark
                                  ? 'bg-green-900/30 text-green-300'
                                  : 'bg-green-100 text-green-700'
                              }`}>
                                Convicted
                              </span>
                            );
                          return (
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              isDark
                                ? 'bg-slate-700 text-slate-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {caseItem.REMARKS_DECISION || 'N/A'}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {/* View Button */}
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleViewClick(caseItem)}
                            className="w-10 h-10 rounded-xl bg-blue-500 text-white hover:bg-blue-600 
                                     transition-all duration-300 shadow-lg shadow-blue-500/30
                                     flex items-center justify-center cursor-pointer border-none"
                            title="View Details"
                          >
                            <i className="fas fa-eye"></i>
                          </motion.button>

                          {/* Edit Button */}
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleEditClick(caseItem)}
                            className="w-10 h-10 rounded-xl bg-green-500 text-white hover:bg-green-600 
                                     transition-all duration-300 shadow-lg shadow-green-500/30
                                     flex items-center justify-center cursor-pointer border-none"
                            title="Edit Case"
                          >
                            <i className="fas fa-edit"></i>
                          </motion.button>

                          {/* Delete Button - Only for Admin */}
                          {user?.role === 'Admin' && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleDeleteClick(caseItem)}
                              className="w-10 h-10 rounded-xl bg-red-500 text-white hover:bg-red-600 
                                       transition-all duration-300 shadow-lg shadow-red-500/30
                                       flex items-center justify-center cursor-pointer border-none"
                              title="Delete Case"
                            >
                              <i className="fas fa-trash-alt"></i>
                            </motion.button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* View Modal */}
        <AnimatePresence>
          {showViewModal && selectedCase && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowViewModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className={`rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden ${
                  isDark ? 'bg-slate-800' : 'bg-white'
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className={`p-6 border-b ${isDark ? 'bg-blue-600 border-blue-700' : 'bg-gradient-to-r from-blue-500 to-blue-600 border-slate-200'}`}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white flex items-center gap-3">
                      <i className="fas fa-file-alt"></i>
                      Case Details
                    </h3>
                    <button
                      onClick={() => setShowViewModal(false)}
                      className="w-10 h-10 rounded-full bg-white/20 text-white hover:bg-white/30 
                               transition-colors flex items-center justify-center cursor-pointer border-none"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                  <p className={`mt-1 ${isDark ? 'text-blue-200' : 'text-blue-100'}`}>Docket No: {selectedCase.DOCKET_NO}</p>
                </div>

                {/* Modal Content */}
                <div className={`p-6 overflow-y-auto max-h-[60vh] ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { label: 'Docket Number', value: selectedCase.DOCKET_NO, icon: 'fa-hashtag' },
                      {
                        label: 'Date Filed',
                        value: formatDate(selectedCase.DATE_FILED),
                        icon: 'fa-calendar',
                      },
                      { label: 'Complainant', value: selectedCase.COMPLAINANT, icon: 'fa-user' },
                      { label: 'Respondent', value: selectedCase.RESPONDENT, icon: 'fa-user-tie' },
                      { label: 'Offense', value: selectedCase.OFFENSE, icon: 'fa-gavel' },
                      {
                        label: 'Date Resolved',
                        value: formatDate(selectedCase.DATE_RESOLVED),
                        icon: 'fa-calendar-check',
                      },
                      {
                        label: 'Resolving Prosecutor',
                        value: selectedCase.RESOLVING_PROSECUTOR,
                        icon: 'fa-user-shield',
                      },
                      {
                        label: 'Criminal Case No',
                        value: selectedCase.CRIM_CASE_NO,
                        icon: 'fa-file-contract',
                      },
                      { label: 'Branch', value: selectedCase.BRANCH, icon: 'fa-building' },
                      {
                        label: 'Date Filed in Court',
                        value: formatDate(selectedCase.DATEFILED_IN_COURT),
                        icon: 'fa-landmark',
                      },
                      { label: 'Remarks', value: selectedCase.REMARKS, icon: 'fa-comment' },
                      {
                        label: 'Remarks Decision',
                        value: selectedCase.REMARKS_DECISION,
                        icon: 'fa-balance-scale',
                      },
                      {
                        label: 'Penalty',
                        value: selectedCase.PENALTY,
                        icon: 'fa-exclamation-triangle',
                      },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl transition-colors ${
                          isDark
                            ? 'bg-slate-700 hover:bg-slate-600'
                            : 'bg-slate-50 hover:bg-slate-100'
                        }`}
                      >
                        <p className={`text-xs uppercase flex items-center gap-2 mb-1 ${
                          isDark ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                          <i className={`fas ${item.icon} text-blue-500`}></i>
                          {item.label}
                        </p>
                        <p className={`font-medium ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{item.value || 'N/A'}</p>
                      </div>
                    ))}
                  </div>

                  {/* Index Cards */}
                  {selectedCase.INDEX_CARDS && selectedCase.INDEX_CARDS !== 'N/A' && (
                    <div className={`mt-4 p-4 rounded-xl ${
                      isDark
                        ? 'bg-slate-700'
                        : 'bg-slate-50'
                    }`}>
                      <p className={`text-xs uppercase flex items-center gap-2 mb-2 ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        <i className="fas fa-id-card text-blue-500"></i>
                        Index Cards
                      </p>
                      <p className={`font-medium break-all text-sm ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                        {selectedCase.INDEX_CARDS}
                      </p>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className={`p-6 border-t flex gap-4 ${
                  isDark
                    ? 'bg-slate-800 border-slate-700'
                    : 'bg-slate-50 border-slate-200'
                }`}>
                  <button
                    onClick={() => setShowViewModal(false)}
                    className={`flex-1 py-3 rounded-xl font-semibold border-none cursor-pointer transition-colors ${
                      isDark
                        ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      handleDeleteClick(selectedCase);
                    }}
                    className="flex-1 py-3 rounded-xl font-semibold bg-red-500 text-white 
                             hover:bg-red-600 transition-colors border-none cursor-pointer flex items-center justify-center gap-2"
                  >
                    <i className="fas fa-trash-alt"></i>
                    Delete This Case
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Edit Modal */}
        <AnimatePresence>
          {showEditModal && editedCase && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowEditModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className={`rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden ${
                  isDark ? 'bg-slate-800' : 'bg-white'
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className={`p-6 border-b ${isDark ? 'bg-green-600 border-green-700' : 'bg-gradient-to-r from-green-500 to-green-600 border-slate-200'}`}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white flex items-center gap-3">
                      <i className="fas fa-edit"></i>
                      Edit Case
                    </h3>
                    <button
                      onClick={() => setShowEditModal(false)}
                      className="w-10 h-10 rounded-full bg-white/20 text-white hover:bg-white/30 
                               transition-colors flex items-center justify-center cursor-pointer border-none"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                  <p className={`mt-1 ${isDark ? 'text-green-200' : 'text-green-100'}`}>Docket No: {editedCase.DOCKET_NO}</p>
                </div>

                {/* Modal Content */}
                <div className={`p-6 overflow-y-auto max-h-[60vh] ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        <i className="fas fa-calendar text-green-500 mr-2"></i>Date Filed
                      </label>
                      <input
                        type="date"
                        value={editedCase.DATE_FILED?.split('T')[0] || ''}
                        onChange={(e) => handleFieldChange('DATE_FILED', e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
                          isDark
                            ? 'border-slate-600 bg-slate-700 text-slate-100 focus:border-green-500 focus:ring-2 focus:ring-green-500/20'
                            : 'border-slate-200 bg-white text-slate-900 focus:border-green-500 focus:ring-2 focus:ring-green-200'
                        }`}
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        <i className="fas fa-user text-green-500 mr-2"></i>Complainant
                      </label>
                      <input
                        type="text"
                        value={editedCase.COMPLAINANT || ''}
                        onChange={(e) => handleFieldChange('COMPLAINANT', e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
                          isDark
                            ? 'border-slate-600 bg-slate-700 text-slate-100 focus:border-green-500 focus:ring-2 focus:ring-green-500/20'
                            : 'border-slate-200 bg-white text-slate-900 focus:border-green-500 focus:ring-2 focus:ring-green-200'
                        }`}
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        <i className="fas fa-user-shield text-green-500 mr-2"></i>Respondent
                      </label>
                      <input
                        type="text"
                        value={editedCase.RESPONDENT || ''}
                        onChange={(e) => handleFieldChange('RESPONDENT', e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
                          isDark
                            ? 'border-slate-600 bg-slate-700 text-slate-100 focus:border-green-500 focus:ring-2 focus:ring-green-500/20'
                            : 'border-slate-200 bg-white text-slate-900 focus:border-green-500 focus:ring-2 focus:ring-green-200'
                        }`}
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        <i className="fas fa-map-marker-alt text-green-500 mr-2"></i>Address of Respondent
                      </label>
                      <input
                        type="text"
                        value={editedCase.ADDRESS_OF_RESPONDENT || ''}
                        onChange={(e) => handleFieldChange('ADDRESS_OF_RESPONDENT', e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
                          isDark
                            ? 'border-slate-600 bg-slate-700 text-slate-100 focus:border-green-500 focus:ring-2 focus:ring-green-500/20'
                            : 'border-slate-200 bg-white text-slate-900 focus:border-green-500 focus:ring-2 focus:ring-green-200'
                        }`}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        <i className="fas fa-exclamation-triangle text-green-500 mr-2"></i>Offense
                      </label>
                      <input
                        type="text"
                        value={editedCase.OFFENSE || ''}
                        onChange={(e) => handleFieldChange('OFFENSE', e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
                          isDark
                            ? 'border-slate-600 bg-slate-700 text-slate-100 focus:border-green-500 focus:ring-2 focus:ring-green-500/20'
                            : 'border-slate-200 bg-white text-slate-900 focus:border-green-500 focus:ring-2 focus:ring-green-200'
                        }`}
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        <i className="fas fa-calendar-day text-green-500 mr-2"></i>Date of Commission
                      </label>
                      <input
                        type="date"
                        value={editedCase.DATE_OF_COMMISSION?.split('T')[0] || ''}
                        onChange={(e) => handleFieldChange('DATE_OF_COMMISSION', e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
                          isDark
                            ? 'border-slate-600 bg-slate-700 text-slate-100 focus:border-green-500 focus:ring-2 focus:ring-green-500/20'
                            : 'border-slate-200 bg-white text-slate-900 focus:border-green-500 focus:ring-2 focus:ring-green-200'
                        }`}
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        <i className="fas fa-calendar-check text-green-500 mr-2"></i>Date Resolved
                      </label>
                      <input
                        type="date"
                        value={editedCase.DATE_RESOLVED?.split('T')[0] || ''}
                        onChange={(e) => handleFieldChange('DATE_RESOLVED', e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
                          isDark
                            ? 'border-slate-600 bg-slate-700 text-slate-100 focus:border-green-500 focus:ring-2 focus:ring-green-500/20'
                            : 'border-slate-200 bg-white text-slate-900 focus:border-green-500 focus:ring-2 focus:ring-green-200'
                        }`}
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        <i className="fas fa-user-tie text-green-500 mr-2"></i>Resolving Prosecutor
                      </label>
                      <input
                        type="text"
                        value={editedCase.RESOLVING_PROSECUTOR || ''}
                        onChange={(e) => handleFieldChange('RESOLVING_PROSECUTOR', e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
                          isDark
                            ? 'border-slate-600 bg-slate-700 text-slate-100 focus:border-green-500 focus:ring-2 focus:ring-green-500/20'
                            : 'border-slate-200 bg-white text-slate-900 focus:border-green-500 focus:ring-2 focus:ring-green-200'
                        }`}
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        <i className="fas fa-clipboard-check text-green-500 mr-2"></i>Decision
                      </label>
                      <select
                        value={editedCase.REMARKS_DECISION || 'Pending'}
                        onChange={(e) => handleFieldChange('REMARKS_DECISION', e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
                          isDark
                            ? 'border-slate-600 bg-slate-700 text-slate-100 focus:border-green-500 focus:ring-2 focus:ring-green-500/20'
                            : 'border-slate-200 bg-white text-slate-900 focus:border-green-500 focus:ring-2 focus:ring-green-200'
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Dismissed">Dismissed</option>
                        <option value="Convicted">Convicted</option>
                      </select>
                    </div>

                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        <i className="fas fa-balance-scale text-green-500 mr-2"></i>Penalty
                      </label>
                      <input
                        type="text"
                        value={editedCase.PENALTY || ''}
                        onChange={(e) => handleFieldChange('PENALTY', e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
                          isDark
                            ? 'border-slate-600 bg-slate-700 text-slate-100 focus:border-green-500 focus:ring-2 focus:ring-green-500/20'
                            : 'border-slate-200 bg-white text-slate-900 focus:border-green-500 focus:ring-2 focus:ring-green-200'
                        }`}
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        <i className="fas fa-file-contract text-green-500 mr-2"></i>Criminal Case No
                      </label>
                      <input
                        type="text"
                        value={editedCase.CRIM_CASE_NO || ''}
                        onChange={(e) => handleFieldChange('CRIM_CASE_NO', e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
                          isDark
                            ? 'border-slate-600 bg-slate-700 text-slate-100 focus:border-green-500 focus:ring-2 focus:ring-green-500/20'
                            : 'border-slate-200 bg-white text-slate-900 focus:border-green-500 focus:ring-2 focus:ring-green-200'
                        }`}
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        <i className="fas fa-building text-green-500 mr-2"></i>Branch
                      </label>
                      <input
                        type="text"
                        value={editedCase.BRANCH || ''}
                        onChange={(e) => handleFieldChange('BRANCH', e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
                          isDark
                            ? 'border-slate-600 bg-slate-700 text-slate-100 focus:border-green-500 focus:ring-2 focus:ring-green-500/20'
                            : 'border-slate-200 bg-white text-slate-900 focus:border-green-500 focus:ring-2 focus:ring-green-200'
                        }`}
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        <i className="fas fa-landmark text-green-500 mr-2"></i>Date Filed in Court
                      </label>
                      <input
                        type="date"
                        value={editedCase.DATEFILED_IN_COURT?.split('T')[0] || ''}
                        onChange={(e) => handleFieldChange('DATEFILED_IN_COURT', e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
                          isDark
                            ? 'border-slate-600 bg-slate-700 text-slate-100 focus:border-green-500 focus:ring-2 focus:ring-green-500/20'
                            : 'border-slate-200 bg-white text-slate-900 focus:border-green-500 focus:ring-2 focus:ring-green-200'
                        }`}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        <i className="fas fa-id-card text-green-500 mr-2"></i>Index Card Image
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
                          isDark
                            ? 'border-slate-600 bg-slate-700 text-slate-100 focus:border-green-500 focus:ring-2 focus:ring-green-500/20'
                            : 'border-slate-200 bg-white text-slate-900 focus:border-green-500 focus:ring-2 focus:ring-green-200'
                        }`}
                      />
                      {imagePreview && (
                        <div className="mt-3">
                          <p className={`text-xs mb-2 flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            <i className="fas fa-expand-arrows-alt text-amber-500"></i>
                            Click image to view fullscreen
                          </p>
                          <motion.img
                            src={
                              imagePreview.startsWith('data:')
                                ? imagePreview
                                : `http://localhost:5000${imagePreview.startsWith('/') ? imagePreview : '/' + imagePreview}`
                            }
                            alt="Index Card Preview"
                            className={`max-w-full h-auto rounded-xl border-2 max-h-64 object-contain cursor-pointer shadow-lg ${
                              isDark ? 'border-slate-600' : 'border-slate-200'
                            }`}
                            onClick={() => setShowFullscreenImage(true)}
                            whileHover={{
                              scale: 1.02,
                              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                            }}
                            whileTap={{ scale: 0.98 }}
                            onError={(e) => {
                              console.error('Image failed to load:', imagePreview);
                              console.error('Constructed URL:', e.target.src);
                              e.target.onerror = null;
                              e.target.src = '';
                            }}
                            style={{ display: 'block' }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className={`p-6 border-t flex gap-4 ${
                  isDark
                    ? 'bg-slate-800 border-slate-700'
                    : 'bg-slate-50 border-slate-200'
                }`}>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className={`flex-1 py-3 rounded-xl font-semibold border-none cursor-pointer transition-colors ${
                      isDark
                        ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdate}
                    disabled={isLoading}
                    className={`flex-1 py-3 rounded-xl font-semibold border-none cursor-pointer
                             flex items-center justify-center gap-2 transition-colors ${
                               isDark
                                 ? 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-50'
                                 : 'bg-green-500 text-white hover:bg-green-600 disabled:opacity-50'
                             }`}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Updating...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save"></i>
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showConfirm && selectedCase && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-lg"
              onClick={() => setShowConfirm(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.93, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.93, y: 30 }}
                transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
                className={`rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden
                           ${isDark ? 'bg-gradient-to-br from-slate-800 to-slate-900' : 'bg-gradient-to-br from-white to-slate-50'}`}
                onClick={(e) => e.stopPropagation()}
              >
                {/* HeroUI Header with Gradient Top Border */}
                <div className="h-1 bg-gradient-to-r from-red-500 via-red-600 to-red-500"></div>
                
                <div className={`p-6 text-center border-b ${
                  isDark ? 'border-slate-700/30' : 'border-slate-200/50'
                }`}>
                  <motion.div 
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.15, type: "spring", stiffness: 280, damping: 20 }}
                    className="w-16 h-16 rounded-xl bg-gradient-to-br from-red-500 via-red-600 to-red-700
                               flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-500/40
                               relative"
                  >
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-red-400/20 to-transparent"></div>
                    <i className="fas fa-archive text-2xl text-white relative"></i>
                  </motion.div>
                  <motion.h3 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className={`text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r 
                               ${isDark 
                                 ? 'from-slate-100 via-slate-200 to-slate-100' 
                                 : 'from-slate-900 via-slate-800 to-slate-900'}`}
                  >
                    Move to Terminated
                  </motion.h3>
                </div>

                {/* HeroUI Case Details Card */}
                <div className="p-6 space-y-4">
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className={`rounded-xl p-4 border-2 backdrop-blur-sm transition-all ${
                      isDark 
                        ? 'bg-slate-700/40 border-slate-600/50 hover:border-slate-500/70 hover:bg-slate-700/60' 
                        : 'bg-slate-100/40 border-slate-300/40 hover:border-slate-300/60 hover:bg-slate-100/60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0
                                    ${isDark ? 'bg-red-500/20' : 'bg-red-100'}`}>
                        <i className={`fas fa-file-lines text-sm ${
                          isDark ? 'text-red-400' : 'text-red-600'
                        }`}></i>
                      </div>
                      <div className="flex-1">
                        <p className={`font-mono font-bold text-sm mb-1 ${
                          isDark ? 'text-red-400' : 'text-red-600'
                        }`}>
                          {selectedCase.DOCKET_NO}
                        </p>
                        <p className={`text-xs leading-relaxed ${
                          isDark ? 'text-slate-400' : 'text-slate-600'
                        }`}>
                          {selectedCase.COMPLAINANT} <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>vs</span> {selectedCase.RESPONDENT}
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* HeroUI Info Alert */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className={`flex items-start gap-3 p-4 rounded-xl border backdrop-blur-sm transition-all
                      ${isDark 
                        ? 'bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/15' 
                        : 'bg-blue-50/60 border-blue-200/40 hover:bg-blue-50/80'}`}
                  >
                    <i className={`fas fa-info-circle text-sm mt-0.5 flex-shrink-0 ${
                      isDark ? 'text-blue-400' : 'text-blue-600'
                    }`}></i>
                    <p className={`text-xs leading-relaxed font-medium ${
                      isDark ? 'text-blue-300/90' : 'text-blue-900/75'
                    }`}>
                      This case will be stored in Terminated Cases where you can restore it or delete it permanently.
                    </p>
                  </motion.div>
                </div>

                {/* HeroUI Action Buttons */}
                <div className={`flex gap-3 p-6 pt-4 border-t ${
                  isDark ? 'border-slate-700/30' : 'border-slate-200/50'
                }`}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowConfirm(false)}
                    className={`flex-1 py-2.5 rounded-lg font-semibold text-sm border-2 transition-all ${
                      isDark
                        ? 'bg-transparent border-slate-600/50 text-slate-300 hover:bg-slate-700/30 hover:border-slate-500'
                        : 'bg-transparent border-slate-300/50 text-slate-700 hover:bg-slate-100/50 hover:border-slate-400'
                    }`}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDelete}
                    disabled={isLoading}
                    className="flex-1 py-2.5 rounded-lg font-semibold text-sm bg-gradient-to-r from-red-600 via-red-600 to-red-700
                             text-white hover:from-red-700 hover:via-red-700 hover:to-red-800 transition-all
                             flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed
                             shadow-lg shadow-red-500/30 hover:shadow-red-500/50"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Moving...</span>
                      </>
                    ) : (
                      <>
                        <i className="fas fa-archive text-sm"></i>
                        <span>Move</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Professional Image Modal */}
        <ImageModal
          isOpen={showFullscreenImage}
          onClose={() => setShowFullscreenImage(false)}
          imageUrl={
            imagePreview
              ? imagePreview.startsWith('data:')
                ? imagePreview
                : `http://localhost:5000${imagePreview.startsWith('/') ? imagePreview : '/' + imagePreview}`
              : ''
          }
          imageName={
            selectedCase?.DOCKET_NO ? `Index-Card-${selectedCase.DOCKET_NO}.jpg` : 'index-card.jpg'
          }
        />
      </motion.div>
    </div>
  );
};

export default Deletecase;
