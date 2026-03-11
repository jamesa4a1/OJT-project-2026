import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import useAutoRefresh from '../hooks/useAutoRefresh';
import { ThemeContext } from '../App';
import ImageModal from '../components/ImageModal';
import { API_BASE } from '../config/api';

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
  const [isCustomDecision, setIsCustomDecision] = useState(false);
  const [showStatusField, setShowStatusField] = useState(false);
  const [isEditFiledInCourt, setIsEditFiledInCourt] = useState(false);
  const [editRespondents, setEditRespondents] = useState(['']);
  const [imagePreview, setImagePreview] = useState(null);
  const [showFullscreenImage, setShowFullscreenImage] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [printDropdownCase, setPrintDropdownCase] = useState(null);
  const [printDropdownPos, setPrintDropdownPos] = useState({ top: 0, left: 0 });
  const navigate = useNavigate();

  // Helper function to construct proper image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath || imagePath === 'N/A' || imagePath.trim() === '') {
      return null;
    }
    // If it's a data URL (newly selected file), return as is
    if (imagePath.startsWith('data:')) {
      return imagePath;
    }
    // If it's already a proper uploads path
    if (imagePath.startsWith('/uploads/')) {
      return `${API_BASE}${imagePath}`;
    }
    // If it starts with uploads (without leading slash)
    if (imagePath.startsWith('uploads/')) {
      return `${API_BASE}/${imagePath}`;
    }
    // Old format paths like "INDEX CARDS\filename.pdf" - these files don't exist
    // Try to construct a URL anyway, but it will likely fail
    return `${API_BASE}/${imagePath.replace(/\\/g, '/')}`;
  };

  // Check if the path looks like a valid image path (new format)
  const parseRespondents = (value) => {
    if (!value || value === 'N/A') return [];
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch { /* JSON parse failed, treat as plain string */ }
    return [value];
  };

  const isValidImagePath = (imagePath) => {
    if (!imagePath || imagePath === 'N/A') return false;
    // New format paths start with /uploads/ or uploads/
    if (imagePath.startsWith('/uploads/') || imagePath.startsWith('uploads/')) return true;
    // Data URLs are valid
    if (imagePath.startsWith('data:')) return true;
    // Old format paths with backslashes are likely invalid
    if (imagePath.includes('\\') || imagePath.includes('INDEX CARDS')) return false;
    return true;
  };

  const fetchAllCases = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await axios.get(`${API_BASE}/cases`);
      setCases(response.data);
    } catch (err) {
      console.error('Error fetching cases:', err);
      if (err.response) {
        // Server responded with error
        if (err.response.status === 503) {
          setError('âŒ Database connection failed. Please ensure MySQL/XAMPP is running and the database is accessible.');
        } else {
          setError(err.response.data?.message || 'Error fetching cases from server.');
        }
      } else if (err.request) {
        // Request was made but no response
        setError(`âŒ Cannot connect to server. Please ensure the server is running on ${API_BASE}`);
      } else {
        // Something else happened
        setError('Error fetching cases: ' + err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch all cases on component mount
  useEffect(() => {
    fetchAllCases();
  }, []);

  // Auto-refresh every 5 seconds for real-time updates across PCs
  useAutoRefresh(fetchAllCases, 5000);

  // Filter cases when search term changes
  useEffect(() => {
    let filtered = cases;

    // Apply status filter
    if (statusFilter === 'pending') {
      filtered = filtered.filter((c) => {
        const status = (c.REMARKS_DECISION || 'pending').toLowerCase();
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
          parseRespondents(c.RESPONDENT).some(r => r.toLowerCase().includes(searchTerm.toLowerCase())) ||
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

  const handleDeleteClick = (caseItem) => {
    setSelectedCase(caseItem);
    setShowConfirm(true);
  };

  const handleViewClick = (caseItem) => {
    setSelectedCase(caseItem);
    setImageLoadError(false);
    setShowViewModal(true);
  };

  const handleEditClick = (caseItem) => {
    setSelectedCase(caseItem);
    setEditedCase(caseItem);
    const parsed = parseRespondents(caseItem.RESPONDENT);
    setEditRespondents(parsed.length > 0 ? parsed : ['']);
    setSelectedImage(null);
    setImageLoadError(false);
    
    // Check if current decision is custom (not one of the predefined options)
    const currentDecision = caseItem.REMARKS_DECISION || 'Pending';
    const predefinedOptions = ['Pending', 'Dismissed', 'Convicted', 'For Resolution'];
    setIsCustomDecision(!predefinedOptions.includes(currentDecision));
    // Initialise new status state
    const newStatusValues = ['Pending', 'Dismissed', 'Convicted', 'For Resolution', 'Filed in Court', 'Other (Custom)'];
    const hasNewStatus = caseItem.STATUS && newStatusValues.includes(caseItem.STATUS);
    setShowStatusField(!!hasNewStatus);
    setIsEditFiledInCourt(caseItem.STATUS === 'Filed in Court');
    
    // Set imagePreview with proper path handling
    const imagePath = caseItem.INDEX_CARDS;
    console.log('INDEX_CARDS from database:', imagePath);
    if (imagePath && imagePath !== 'N/A' && imagePath.trim() !== '' && isValidImagePath(imagePath)) {
      setImagePreview(imagePath);
    } else {
      setImagePreview(null);
    }
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setIsCustomDecision(false);
    setShowStatusField(false);
    setIsEditFiledInCourt(false);
    setEditRespondents(['']);
  };

  const handleFieldChange = (field, value) => {
    if (field === 'REMARKS_DECISION') {
      if (value === 'Other (Custom)') {
        setIsCustomDecision(true);
        setEditedCase((prev) => ({ ...prev, REMARKS_DECISION: '' }));
        return;
      }
      const isOther = !['Pending', 'Dismissed', 'Convicted', 'For Resolution'].includes(value);
      setIsCustomDecision(isOther);
    } else if (field === 'STATUS') {
      setIsEditFiledInCourt(value === 'Filed in Court');
    }
    setEditedCase((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setImageLoadError(false); // Reset error when new image is selected
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
    console.log('ðŸ“ Updating case with data:', editedCase);
    try {
      let response;

      // If there's an image to upload, use the image upload endpoint
      if (selectedImage) {
        console.log('ðŸ“· Uploading with image');
        const formData = new FormData();
        formData.append('id', editedCase.id);
        formData.append('indexCardImage', selectedImage);

        // Append all other fields
        const serializedRespondents = JSON.stringify(editRespondents.filter(r => r.trim() !== '').map(r => r.trim()));
        Object.keys(editedCase).forEach((key) => {
          if (key !== 'id' && key !== 'INDEX_CARDS' && key !== 'RESPONDENT' && editedCase[key] !== undefined) {
            formData.append(key, editedCase[key] || '');
          }
        });
        formData.append('RESPONDENT', serializedRespondents);

        response = await axios.post(`${API_BASE}/update-case-with-image`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        // No image, use regular update
        console.log('ðŸ“„ Updating without image');
        const updateData = {
          id: editedCase.id,
          updated_fields: {
            DATE_FILED: editedCase.DATE_FILED,
            COMPLAINANT: editedCase.COMPLAINANT,
            RESPONDENT: JSON.stringify(editRespondents.filter(r => r.trim() !== '').map(r => r.trim())),
            ADDRESS_OF_RESPONDENT: editedCase.ADDRESS_OF_RESPONDENT,
            OFFENSE: editedCase.OFFENSE,
            DATE_OF_COMMISSION: editedCase.DATE_OF_COMMISSION,
            DATE_RESOLVED: editedCase.DATE_RESOLVED,
            RESOLVING_PROSECUTOR: editedCase.RESOLVING_PROSECUTOR,
            REMARKS_DECISION: editedCase.REMARKS_DECISION,
            STATUS: editedCase.STATUS,
            PENALTY: editedCase.PENALTY,
            DECISION_DATE: editedCase.DECISION_DATE,
            CRIM_CASE_NO: editedCase.CRIM_CASE_NO,
            BRANCH: editedCase.BRANCH,
            DATEFILED_IN_COURT: editedCase.DATEFILED_IN_COURT,
            FINAL_OFFENSE: editedCase.FINAL_OFFENSE,
          },
        };
        console.log('ðŸ“¤ Sending update data:', updateData);
        response = await axios.post(`${API_BASE}/update-case`, updateData);
      }

      if (response.status === 200) {
        closeEditModal();
        setSelectedCase(null);
        setEditedCase({});
        setSelectedImage(null);
        setImagePreview(null);
        setError('');
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000); // Hide after 3 seconds
        fetchAllCases(); // Refresh to get updated data
      }
    } catch (err) {
      console.error('Update error:', err);
      if (err.response) {
        // Server responded with error
        if (err.response.status === 503) {
          setError('âŒ Database connection failed. Please ensure MySQL/XAMPP is running and the database is accessible.');
        } else if (err.response.status === 400) {
          let errorMsg = 'Invalid data provided';
          
          if (err.response.data?.errors) {
            if (Array.isArray(err.response.data.errors)) {
              errorMsg = err.response.data.errors.map(e => `${e.field}: ${e.message}`).join(', ');
            } else if (typeof err.response.data.errors === 'string') {
              errorMsg = err.response.data.errors;
            } else if (typeof err.response.data.errors === 'object') {
              errorMsg = Object.entries(err.response.data.errors)
                .map(([field, message]) => `${field}: ${message}`)
                .join(', ');
            }
          } else if (err.response.data?.message) {
            errorMsg = err.response.data.message;
          } else if (err.response.data?.error) {
            errorMsg = err.response.data.error;
          }
          
          setError('âŒ Validation error: ' + errorMsg);
        } else {
          setError('âŒ ' + (err.response.data?.message || 'Error updating case. Please try again.'));
        }
      } else if (err.request) {
        setError(`âŒ Cannot connect to server. Please ensure the server is running on ${API_BASE}`);
      } else {
        setError('âŒ Error updating case: ' + err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCase) return;
    setIsLoading(true);
    setError('');
    try {
      await axios.delete(`${API_BASE}/delete-case`, {
        data: { docket_no: selectedCase.DOCKET_NO },
      });
      
      // Refresh the entire cases list from server after successful deletion
      await fetchAllCases();
      
      setShowConfirm(false);
      setSelectedCase(null);
      
      // Show success message
      setError(''); // Clear any previous errors
      
    } catch (err) {
      console.error('Delete error:', err);
      
      if (err.response && err.response.status === 404) {
        // Case not found - probably already deleted
        setError('Case not found. It may have already been deleted. Refreshing list...');
        // Refresh the list anyway to show current state
        await fetchAllCases();
      } else if (err.response && err.response.data && err.response.data.message) {
        // Server returned a specific error message
        setError(`Error: ${err.response.data.message}`);
      } else {
        // Generic error
        setError('Error deleting case. Please try again.');
      }
    }
    setIsLoading(false);
  };

  // Close print dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (printDropdownCase !== null && !e.target.closest('.print-dropdown-container')) {
        setPrintDropdownCase(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [printDropdownCase]);

  const PRINT_FORMAT_OPTIONS = [
    { value: 'A', label: 'Format A', description: 'No Criminal Record -A' },
    { value: 'B', label: 'Format B', description: 'Criminal Record - B' },
    { value: 'C', label: 'Format C', description: 'No Criminal Record - C' },
    { value: 'D', label: 'Format D', description: 'Criminal Record - D' },
    { value: 'E', label: 'Format E', description: 'Bail Bond - E' },
    { value: 'F', label: 'Format F', description: 'Bail Bond - F' },
  ];

  const handleCasePrint = (caseItem, format) => {
    setPrintDropdownCase(null);
    navigate('/clearances/generate', {
      state: { fromCase: caseItem, format },
    });
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
            <div className="overflow-hidden">
              <table className="w-full table-fixed">
                <thead>
                  <tr className={`bg-gradient-to-r ${isDark ? 'from-slate-700 to-slate-800' : 'from-slate-700 to-slate-800'} text-white`}>
                    <th className="px-2 py-3 text-left font-semibold text-xs w-[10%]">Docket No</th>
                    <th className="px-2 py-3 text-left font-semibold text-xs w-[8%]">Date Filed</th>
                    <th className="px-2 py-3 text-left font-semibold text-xs w-[11%]">Complainant</th>
                    <th className="px-2 py-3 text-left font-semibold text-xs w-[11%]">Respondent</th>
                    <th className="px-2 py-3 text-left font-semibold text-xs w-[11%]">Offense</th>
                    <th className="px-2 py-3 text-center font-semibold text-xs w-[9%]">Status</th>
                    <th className="px-2 py-3 text-center font-semibold text-xs w-[9%]">New Status</th>
                    <th className="px-2 py-3 text-center font-semibold text-xs w-[9%]">Final Offense</th>
                    <th className="px-2 py-3 text-center font-semibold text-xs w-[9%]">Decision Date</th>
                    <th className="px-2 py-3 text-center font-semibold text-xs w-[13%]">Actions</th>
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
                      <td className="px-2 py-3">
                        <span className={`font-mono font-semibold text-xs truncate block ${isDark ? 'text-slate-200' : 'text-slate-800'}`} title={caseItem.DOCKET_NO || 'N/A'}>
                          {caseItem.DOCKET_NO || 'N/A'}
                        </span>
                      </td>
                      <td className={`px-2 py-3 text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                        {formatDate(caseItem.DATE_FILED)}
                      </td>
                      <td className={`px-2 py-3 text-xs font-medium truncate ${isDark ? 'text-slate-200' : 'text-slate-700'}`} title={caseItem.COMPLAINANT || 'N/A'}>
                        {caseItem.COMPLAINANT || 'N/A'}
                      </td>
                      <td className={`px-2 py-3 text-xs truncate ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        {(() => {
                          const rList = parseRespondents(caseItem.RESPONDENT);
                          const first = rList[0] || 'N/A';
                          return (
                            <>
                              <span className="truncate block" title={rList.join(', ')}>
                                {first.length > 16 ? first.substring(0, 16) + 'â€¦' : first}
                              </span>
                              {rList.length > 1 && (
                                <span className={`text-xs font-semibold px-1 rounded ${isDark ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-600'}`}>
                                  +{rList.length - 1}
                                </span>
                              )}
                            </>
                          );
                        })()}
                      </td>
                      <td className="px-2 py-3">
                        <span className={`px-2 py-1 rounded-md text-xs truncate block max-w-full ${
                          isDark
                            ? 'bg-slate-700 text-slate-200'
                            : 'bg-slate-100 text-slate-700'
                        }`} title={caseItem.OFFENSE || 'N/A'}>
                          {caseItem.OFFENSE || 'N/A'}
                        </span>
                      </td>
                      <td className="px-2 py-3 text-center">
                        {(() => {
                          const decision = (caseItem.REMARKS_DECISION || 'pending').toLowerCase();
                          if (decision === 'pending')
                            return (
                              <span className={`px-2 py-1 rounded-md text-xs font-semibold inline-block ${
                                isDark ? 'bg-yellow-900/30 text-yellow-300' : 'bg-yellow-100 text-yellow-700'
                              }`}>Pending</span>
                            );
                          if (decision === 'dismissed')
                            return (
                              <span className={`px-2 py-1 rounded-md text-xs font-semibold inline-block ${
                                isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700'
                              }`}>Dismissed</span>
                            );
                          if (decision === 'convicted')
                            return (
                              <span className={`px-2 py-1 rounded-md text-xs font-semibold inline-block ${
                                isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700'
                              }`}>Convicted</span>
                            );
                          return (
                            <span className={`px-2 py-1 rounded-md text-xs font-semibold inline-block truncate max-w-full ${
                              isDark ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-700'
                            }`} title={caseItem.REMARKS_DECISION || 'Pending'}>
                              {caseItem.REMARKS_DECISION || 'Pending'}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-2 py-3 text-center">
                        {caseItem.STATUS ? (
                          <span className={`px-2 py-1 rounded-md text-xs font-semibold inline-block ${
                            isDark ? 'bg-emerald-900/30 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {caseItem.STATUS}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-2 py-3 text-center">
                        {caseItem.FINAL_OFFENSE ? (
                          <span className={`px-2 py-1 rounded-md text-xs font-semibold inline-block truncate max-w-full ${
                            isDark ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-700'
                          }`} title={caseItem.FINAL_OFFENSE}>
                            {caseItem.FINAL_OFFENSE}
                          </span>
                        ) : null}
                      </td>
                      <td className={`px-2 py-3 text-center text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                        {formatDate(caseItem.DECISION_DATE)}
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex items-center justify-center gap-1">
                          {/* View Button */}
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleViewClick(caseItem)}
                            className="w-8 h-8 rounded-lg bg-blue-500 text-white hover:bg-blue-600 
                                     transition-all duration-300 shadow-md shadow-blue-500/30
                                     flex items-center justify-center cursor-pointer border-none text-sm"
                            title="View Details"
                          >
                            <i className="fas fa-eye"></i>
                          </motion.button>

                          {/* Edit Button */}
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleEditClick(caseItem)}
                            className="w-8 h-8 rounded-lg bg-green-500 text-white hover:bg-green-600 
                                     transition-all duration-300 shadow-md shadow-green-500/30
                                     flex items-center justify-center cursor-pointer border-none text-sm"
                            title="Edit Case"
                          >
                            <i className="fas fa-edit"></i>
                          </motion.button>

                          {/* Print Button with Format Dropdown */}
                          <div className="print-dropdown-container">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              type="button"
                              onClick={(e) => {
                                const r = e.currentTarget.getBoundingClientRect();
                                setPrintDropdownPos({ top: r.bottom + 6, left: r.right - 208 });
                                setPrintDropdownCase(printDropdownCase === caseItem.id ? null : caseItem.id);
                              }}
                              className="w-8 h-8 rounded-lg bg-purple-500 text-white hover:bg-purple-600 
                                       transition-all duration-300 shadow-md shadow-purple-500/30
                                       flex items-center justify-center cursor-pointer border-none text-sm"
                              title="Print Case"
                            >
                              <i className="fas fa-print"></i>
                            </motion.button>
                          </div>

                          {/* Delete Button - Only for Admin */}
                          {user?.role === 'Admin' && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleDeleteClick(caseItem)}
                              className="w-8 h-8 rounded-lg bg-red-500 text-white hover:bg-red-600 
                                       transition-all duration-300 shadow-md shadow-red-500/30
                                       flex items-center justify-center cursor-pointer border-none text-sm"
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
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm ml-32"
              onClick={() => setShowViewModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, x: -30 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95, x: -30 }}
                className={`rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden ${
                  isDark ? 'bg-slate-800' : 'bg-white'
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className={`p-5 border-b flex-shrink-0 ${isDark ? 'bg-blue-600 border-blue-700' : 'bg-gradient-to-r from-blue-500 to-blue-600 border-slate-200'}`}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <i className="fas fa-file-alt"></i>
                      Case Details
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowViewModal(false)}
                      className="w-8 h-8 rounded-full bg-white/20 text-white hover:bg-white/30 
                               transition-colors flex items-center justify-center cursor-pointer border-none"
                    >
                      <i className="fas fa-times text-sm"></i>
                    </button>
                  </div>
                  <p className={`mt-2 text-sm font-semibold ${isDark ? 'text-blue-100' : 'text-blue-50'}`}>Docket No: {selectedCase.DOCKET_NO}</p>
                </div>

                {/* Modal Content - Scrollable */}
                <div className={`flex-1 overflow-y-auto p-5 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { label: 'Docket Number', value: selectedCase.DOCKET_NO, icon: 'fa-hashtag' },
                      {
                        label: 'Date Filed',
                        value: formatDate(selectedCase.DATE_FILED),
                        icon: 'fa-calendar',
                      },
                      { label: 'Complainant', value: selectedCase.COMPLAINANT, icon: 'fa-user' },
                      { label: 'Respondent', values: parseRespondents(selectedCase.RESPONDENT), icon: 'fa-user-tie' },
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
                      ...(selectedCase.STATUS === 'Filed in Court' ? [
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
                        {
                          label: 'Final Offense',
                          value: selectedCase.FINAL_OFFENSE,
                          icon: 'fa-gavel',
                        },
                      ] : []),
                      {
                        label: 'Recommendation',
                        value: selectedCase.REMARKS_DECISION || 'Pending',
                        icon: 'fa-clipboard-check',
                      },
                      ...(selectedCase.STATUS ? [{
                        label: 'New Status',
                        value: selectedCase.STATUS,
                        icon: 'fa-tasks',
                      }] : []),
                      {
                        label: 'Decision Date',
                        value: selectedCase.DECISION_DATE ? formatDate(selectedCase.DECISION_DATE) : '',
                        icon: 'fa-calendar-day',
                        blankIfEmpty: true,
                      },
                      {
                        label: 'Penalty',
                        value: selectedCase.PENALTY,
                        icon: 'fa-exclamation-triangle',
                      },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl transition-all border shadow-sm hover:shadow-md ${
                          isDark
                            ? 'bg-slate-700 hover:bg-slate-600 border-slate-600'
                            : 'bg-gradient-to-br from-slate-50 to-slate-100 hover:from-blue-50 hover:to-slate-100 border-slate-200'
                        }`}
                      >
                        <p className={`text-xs uppercase font-semibold flex items-center gap-1.5 mb-2 ${
                          isDark ? 'text-slate-300' : 'text-slate-600'
                        }`}>
                          <i className={`fas ${item.icon} text-blue-500 text-xs`}></i>
                          {item.label}
                        </p>
                        <p className={`font-semibold text-sm leading-snug break-words ${isDark ? 'text-slate-100' : 'text-slate-800'}`} title={item.values ? item.values.join(', ') : (item.value || (item.blankIfEmpty ? '' : 'N/A'))}>
                          {item.values
                            ? item.values.length === 0
                              ? 'N/A'
                              : item.values.map((v, i) => (
                                  <span key={i} className={`block ${i > 0 ? 'mt-1 pt-1 border-t border-slate-200/40' : ''}`}>
                                    {item.values.length > 1 ? <span className="text-blue-500 mr-1 font-bold">{i + 1}.</span> : null}{v}
                                  </span>
                                ))
                            : (item.value && item.value.length > 25 ? `${item.value.substring(0, 25)}...` : (item.value || (item.blankIfEmpty ? '' : 'N/A')))
                          }
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Remarks Section - Full Width */}
                  {selectedCase.REMARKS && selectedCase.REMARKS !== 'N/A' && (
                    <div className={`mt-4 p-4 rounded-xl border shadow-sm ${
                      isDark
                        ? 'bg-slate-700 border-slate-600'
                        : 'bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200'
                    }`}>
                      <p className={`text-xs uppercase font-semibold flex items-center gap-1.5 mb-2 ${
                        isDark ? 'text-slate-300' : 'text-slate-600'
                      }`}>
                        <i className="fas fa-comment text-blue-500 text-xs"></i>
                        Remarks
                      </p>
                      <p className={`font-medium text-sm ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                        {selectedCase.REMARKS}
                      </p>
                    </div>
                  )}

                  {/* Index Cards */}
                  {selectedCase.INDEX_CARDS && selectedCase.INDEX_CARDS !== 'N/A' && (
                    <div className={`mt-4 p-4 rounded-xl border shadow-sm ${
                      isDark
                        ? 'bg-slate-700 border-slate-600'
                        : 'bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200'
                    }`}>
                      <p className={`text-xs uppercase font-semibold flex items-center gap-1.5 mb-3 ${
                        isDark ? 'text-slate-300' : 'text-slate-600'
                      }`}>
                        <i className="fas fa-id-card text-blue-500 text-xs"></i>
                        Index Card Image
                      </p>
                      
                      {/* Check if path is valid format */}
                      {isValidImagePath(selectedCase.INDEX_CARDS) && !imageLoadError ? (
                        <>
                          <p className={`text-xs mb-2 flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            <i className="fas fa-expand-arrows-alt text-amber-500"></i>
                            Click image to view fullscreen
                          </p>
                          <img
                            src={getImageUrl(selectedCase.INDEX_CARDS)}
                            alt="Index Card"
                            className={`max-w-full h-auto rounded-xl border-2 max-h-64 object-contain cursor-pointer shadow-lg hover:scale-105 transition-transform ${
                              isDark ? 'border-slate-600' : 'border-slate-300'
                            }`}
                            onClick={() => setShowFullscreenImage(true)}
                            onError={() => {
                              console.error('Image failed to load:', selectedCase.INDEX_CARDS);
                              setImageLoadError(true);
                            }}
                          />
                          <a
                            href={getImageUrl(selectedCase.INDEX_CARDS)}
                            download
                            className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all shadow-md"
                          >
                            <i className="fas fa-download"></i>
                            Download
                          </a>
                        </>
                      ) : (
                        <div className={`p-4 rounded-xl border-2 border-dashed text-center ${
                          isDark ? 'bg-slate-600 border-slate-500' : 'bg-slate-200 border-slate-400'
                        }`}>
                          <i className={`fas fa-image text-4xl mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}></i>
                          <p className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            Image not available
                          </p>
                          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            File path: {selectedCase.INDEX_CARDS}
                          </p>
                          <p className={`text-xs mt-2 ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                            <i className="fas fa-info-circle mr-1"></i>
                            Upload a new image using the Edit function
                          </p>
                        </div>
                      )}
                    </div>
                  )}
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
              onClick={closeEditModal}
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
                      type="button"
                      onClick={closeEditModal}
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

                    <div className="md:col-span-2">
                      <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        <i className="fas fa-user-shield text-green-500 mr-2"></i>Respondent
                      </label>
                      {editRespondents.map((r, index) => (
                        <div key={index} className={`flex gap-2 ${index > 0 ? 'mt-2' : ''}`}>
                          <input
                            type="text"
                            value={r}
                            onChange={(e) => {
                              const updated = [...editRespondents];
                              updated[index] = e.target.value;
                              setEditRespondents(updated);
                            }}
                            placeholder={index === 0 ? 'Enter respondent name' : `Respondent ${index + 1}`}
                            className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
                              isDark
                                ? 'border-slate-600 bg-slate-700 text-slate-100 focus:border-green-500 focus:ring-2 focus:ring-green-500/20'
                                : 'border-slate-200 bg-white text-slate-900 focus:border-green-500 focus:ring-2 focus:ring-green-200'
                            }`}
                          />
                          {editRespondents.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setEditRespondents(editRespondents.filter((_, i) => i !== index))}
                              className={`w-12 flex-shrink-0 rounded-xl border-2 flex items-center justify-center transition-colors cursor-pointer ${
                                isDark
                                  ? 'bg-red-900/30 border-red-700 text-red-400 hover:bg-red-900/50'
                                  : 'bg-red-50 border-red-200 text-red-500 hover:bg-red-100'
                              }`}
                              title="Remove respondent"
                            >
                              <i className="fas fa-minus text-xs"></i>
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setEditRespondents([...editRespondents, ''])}
                        className={`mt-2 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors border-none cursor-pointer ${
                          isDark
                            ? 'bg-green-900/30 text-green-400 hover:bg-green-900/50'
                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}
                      >
                        <i className="fas fa-plus text-xs"></i>
                        Add Respondent
                      </button>
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
                      <div className="flex items-center justify-between mb-2">
                        <label className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          <i className="fas fa-clipboard-check text-green-500 mr-2"></i>Recommendation
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowStatusField(v => !v)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all duration-200 cursor-pointer ${
                            showStatusField
                              ? 'bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600'
                              : 'bg-white text-emerald-600 border-emerald-400 hover:bg-emerald-50'
                          }`}
                        >
                          <i className={`fas ${showStatusField ? 'fa-minus' : 'fa-plus'} text-xs`}></i>
                          Status
                        </button>
                      </div>
                      {isCustomDecision ? (
                        <input
                          type="text"
                          value={editedCase.REMARKS_DECISION || ''}
                          onChange={(e) => handleFieldChange('REMARKS_DECISION', e.target.value)}
                          placeholder="Enter custom recommendation..."
                          className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
                            isDark
                              ? 'border-slate-600 bg-slate-700 text-slate-100 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 placeholder:text-slate-400'
                              : 'border-slate-200 bg-white text-slate-900 focus:border-green-500 focus:ring-2 focus:ring-green-200 placeholder:text-slate-500'
                          }`}
                        />
                      ) : (
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
                          <option value="For Resolution">For Resolution</option>
                          <option value="Other (Custom)">Other (Custom)</option>
                        </select>
                      )}
                      {showStatusField && (
                        <div className="mt-2">
                          <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                            <i className="fas fa-tasks text-emerald-500 mr-1"></i>New Status
                          </label>
                          <select
                            value={editedCase.STATUS || ''}
                            onChange={(e) => handleFieldChange('STATUS', e.target.value)}
                            className={`w-full px-4 py-3 rounded-xl border-2 border-emerald-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all font-semibold ${
                              isDark ? 'bg-slate-700 text-slate-100' : 'bg-white text-slate-900'
                            }`}
                          >
                            <option value="">-- Select Status --</option>
                            <option value="Pending">Pending</option>
                            <option value="Dismissed">Dismissed</option>
                            <option value="Convicted">Convicted</option>
                            <option value="For Resolution">For Resolution</option>
                            <option value="Filed in Court">Filed in Court</option>
                            <option value="Other (Custom)">Other (Custom)</option>
                          </select>
                        </div>
                      )}
                    </div>

                    {isEditFiledInCourt && (
                      <div className={`md:col-span-2 p-4 rounded-xl border-2 ${
                        isDark ? 'border-emerald-700 bg-emerald-900/20' : 'border-emerald-200 bg-emerald-50/50'
                      }`}>
                        <div className="flex items-center gap-2 mb-3">
                          <i className="fas fa-landmark text-emerald-500"></i>
                          <span className={`text-sm font-semibold ${
                            isDark ? 'text-emerald-300' : 'text-emerald-700'
                          }`}>Court Information</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className={`block text-sm font-semibold mb-2 ${
                              isDark ? 'text-slate-300' : 'text-slate-700'
                            }`}>
                              <i className="fas fa-file-contract text-emerald-500 mr-2"></i>Criminal Case No
                            </label>
                            <input
                              type="text"
                              value={editedCase.CRIM_CASE_NO || ''}
                              onChange={(e) => handleFieldChange('CRIM_CASE_NO', e.target.value)}
                              className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
                                isDark
                                  ? 'border-emerald-700 bg-slate-700 text-slate-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                                  : 'border-emerald-200 bg-white text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200'
                              }`}
                              placeholder="Case number"
                            />
                          </div>
                          <div>
                            <label className={`block text-sm font-semibold mb-2 ${
                              isDark ? 'text-slate-300' : 'text-slate-700'
                            }`}>
                              <i className="fas fa-building text-emerald-500 mr-2"></i>Branch
                            </label>
                            <input
                              type="text"
                              value={editedCase.BRANCH || ''}
                              onChange={(e) => handleFieldChange('BRANCH', e.target.value)}
                              className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
                                isDark
                                  ? 'border-emerald-700 bg-slate-700 text-slate-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                                  : 'border-emerald-200 bg-white text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200'
                              }`}
                              placeholder="Court branch"
                            />
                          </div>
                          <div>
                            <label className={`block text-sm font-semibold mb-2 ${
                              isDark ? 'text-slate-300' : 'text-slate-700'
                            }`}>
                              <i className="fas fa-landmark text-emerald-500 mr-2"></i>Date Filed in Court
                            </label>
                            <input
                              type="date"
                              value={editedCase.DATEFILED_IN_COURT?.split('T')[0] || ''}
                              onChange={(e) => handleFieldChange('DATEFILED_IN_COURT', e.target.value)}
                              className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
                                isDark
                                  ? 'border-emerald-700 bg-slate-700 text-slate-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                                  : 'border-emerald-200 bg-white text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200'
                              }`}
                            />
                          </div>
                          <div>
                            <label className={`block text-sm font-semibold mb-2 ${
                              isDark ? 'text-slate-300' : 'text-slate-700'
                            }`}>
                              <i className="fas fa-gavel text-emerald-500 mr-2"></i>Final Offense
                            </label>
                            <input
                              type="text"
                              value={editedCase.FINAL_OFFENSE || ''}
                              onChange={(e) => handleFieldChange('FINAL_OFFENSE', e.target.value)}
                              className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
                                isDark
                                  ? 'border-emerald-700 bg-slate-700 text-slate-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                                  : 'border-emerald-200 bg-white text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200'
                              }`}
                              placeholder="Final offense"
                            />
                          </div>
                        </div>
                      </div>
                    )}

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
                        <i className="fas fa-calendar-check text-green-500 mr-2"></i>Decision Date
                      </label>
                      <input
                        type="date"
                        value={editedCase.DECISION_DATE?.split('T')[0] || ''}
                        onChange={(e) => handleFieldChange('DECISION_DATE', e.target.value)}
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
                      {imagePreview && isValidImagePath(imagePreview) && !imageLoadError ? (
                        <div className="mt-3">
                          <p className={`text-xs mb-2 flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            <i className="fas fa-expand-arrows-alt text-amber-500"></i>
                            Click image to view fullscreen
                          </p>
                          <motion.img
                            src={getImageUrl(imagePreview)}
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
                            onError={() => {
                              console.error('Image failed to load:', imagePreview);
                              setImageLoadError(true);
                            }}
                            style={{ display: 'block' }}
                          />
                        </div>
                      ) : imagePreview && (!isValidImagePath(imagePreview) || imageLoadError) ? (
                        <div className={`mt-3 p-4 rounded-lg border-2 border-dashed text-center ${
                          isDark ? 'bg-slate-600 border-slate-500' : 'bg-slate-100 border-slate-300'
                        }`}>
                          <i className={`fas fa-image text-3xl mb-2 ${isDark ? 'text-slate-400' : 'text-slate-400'}`}></i>
                          <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                            Current image not available
                          </p>
                          <p className={`text-xs mt-1 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                            <i className="fas fa-upload mr-1"></i>
                            Choose a new file above to upload
                          </p>
                        </div>
                      ) : null}
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
                    type="button"
                    onClick={closeEditModal}
                    className={`flex-1 py-3 rounded-xl font-semibold border-none cursor-pointer transition-colors ${
                      isDark
                        ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
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
                          {selectedCase.COMPLAINANT} <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>vs</span> {parseRespondents(selectedCase.RESPONDENT)[0] || 'N/A'}{parseRespondents(selectedCase.RESPONDENT).length > 1 ? ` +${parseRespondents(selectedCase.RESPONDENT).length - 1} more` : ''}
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
                    type="button"
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
                    type="button"
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
            imagePreview && isValidImagePath(imagePreview)
              ? getImageUrl(imagePreview)
              : selectedCase?.INDEX_CARDS && isValidImagePath(selectedCase.INDEX_CARDS)
                ? getImageUrl(selectedCase.INDEX_CARDS)
                : ''
          }
          imageName={
            selectedCase?.DOCKET_NO ? `Index-Card-${selectedCase.DOCKET_NO}.jpg` : 'index-card.jpg'
          }
        />

      {/* Success Message Popup */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            transition={{ duration: 0.4, type: "spring", stiffness: 200, damping: 20 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[9999] 
                       px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 
                       bg-gradient-to-r from-green-500 to-emerald-600 text-white
                       border-2 border-green-400/30 backdrop-blur-sm
                       min-w-[320px] max-w-[90vw] mx-4"
          >
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <i className="fas fa-check-circle text-xl"></i>
              </div>
            </div>
            <div className="flex-1">
              <p className="font-bold text-lg mb-1">Success!</p>
              <p className="text-sm opacity-90">Case updated successfully!</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowSuccess(false)}
              className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 
                         flex items-center justify-center transition-colors"
            >
              <i className="fas fa-times text-sm"></i>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Print Format Dropdown â€” rendered fixed to escape all overflow-hidden containers */}
      <AnimatePresence>
        {printDropdownCase !== null && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={{ position: 'fixed', top: printDropdownPos.top, left: printDropdownPos.left, zIndex: 9999 }}
            className={`print-dropdown-container w-52 rounded-xl shadow-xl border overflow-hidden ${
              isDark ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-200'
            }`}
          >
            <div className={`px-3 py-2 text-xs font-semibold uppercase tracking-wide border-b ${
              isDark ? 'text-slate-400 bg-slate-700/50 border-slate-600' : 'text-slate-500 bg-slate-50 border-slate-200'
            }`}>
              <i className="fas fa-print mr-1.5"></i>Select Format
            </div>
            {PRINT_FORMAT_OPTIONS.map((fmt) => {
              const activeCase = filteredCases.find(c => c.id === printDropdownCase);
              return (
                <button
                  key={fmt.value}
                  type="button"
                  onClick={() => activeCase && handleCasePrint(activeCase, fmt.value)}
                  className={`w-full text-left px-3 py-2 text-xs transition-colors cursor-pointer border-none flex items-center gap-2 ${
                    isDark
                      ? 'text-slate-200 hover:bg-slate-700 bg-transparent'
                      : 'text-slate-700 hover:bg-purple-50 bg-transparent'
                  }`}
                >
                  <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0 ${
                    isDark ? 'bg-purple-900/40 text-purple-300' : 'bg-purple-100 text-purple-600'
                  }`}>{fmt.value}</span>
                  <span className="truncate">{fmt.description}</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
    </div>
  );
};

export default Deletecase;
