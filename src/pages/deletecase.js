import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import useAutoRefresh from '../hooks/useAutoRefresh';
import { ThemeContext } from '../App';
import ImageModal from '../components/ImageModal';
import { API_BASE } from '../config/api';
import { useSocket, CASE_EVENTS } from '../hooks/useSocket';

const MarqueeText = ({ children, className = '' }) => {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const [overflowPx, setOverflowPx] = useState(0);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const measure = () => {
      if (containerRef.current && textRef.current) {
        const diff = textRef.current.scrollWidth - containerRef.current.clientWidth;
        setOverflowPx(diff > 2 ? diff : 0);
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [children]);

  const canScroll = overflowPx > 0;
  const duration = Math.max(1.2, overflowPx / 50);

  return (
    <div
      ref={containerRef}
      className={`overflow-hidden ${className}`}
      onMouseEnter={() => canScroll && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span
        ref={textRef}
        className="inline-block whitespace-nowrap"
        style={canScroll ? {
          transform: hovered ? `translateX(-${overflowPx}px)` : 'translateX(0)',
          transition: hovered
            ? `transform ${duration}s linear`
            : 'transform 0.4s ease-out',
        } : {}}
      >
        {children}
      </span>
    </div>
  );
};

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
  const [isEditFiledInCourt, setIsEditFiledInCourt] = useState(false);
  const [isEditMRFiled, setIsEditMRFiled] = useState(false);
  const [editRespondents, setEditRespondents] = useState(['']);
  const [editComplainants, setEditComplainants] = useState(['']);
  const [editAddresses, setEditAddresses] = useState(['']);
  const [editRecommendations, setEditRecommendations] = useState(['Pending']);
  const [editCrimCaseNos, setEditCrimCaseNos] = useState(['']);
  const [editBranches, setEditBranches] = useState(['']);
  const [editDatesFiledInCourt, setEditDatesFiledInCourt] = useState(['']);
  const [editFinalOffenses, setEditFinalOffenses] = useState(['']);
  const [editMRFiledBy, setEditMRFiledBy] = useState(['']);
  const [editMRFiledByType, setEditMRFiledByType] = useState(['Respondents']);
  const [mrNameDropdownOpen, setMrNameDropdownOpen] = useState(null);
  const [editMRDateFiling, setEditMRDateFiling] = useState(['']);
  const [editMRDateResolved, setEditMRDateResolved] = useState(['']);
  const [editMRFinding, setEditMRFinding] = useState(['']);
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
      sorted.sort((a, b) => {
        const dateA = a.DATE_FILED || '0000-00-00';
        const dateB = b.DATE_FILED || '0000-00-00';
        return dateA.localeCompare(dateB);
      });
    } else if (sortOption === 'date-desc') {
      sorted.sort((a, b) => {
        const dateA = a.DATE_FILED || '0000-00-00';
        const dateB = b.DATE_FILED || '0000-00-00';
        return dateB.localeCompare(dateA);
      });
    }

    setFilteredCases(sorted);
  }, [searchTerm, cases, sortOption, statusFilter]);

  // Real-time updates: auto-refresh when cases change on any PC
  useSocket(CASE_EVENTS, fetchAllCases);

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
    const isFiledInCourt = (caseItem.REMARKS_DECISION || '').toLowerCase() === 'filed in court' || (caseItem.STATUS || '').toLowerCase() === 'filed in court';
    setEditedCase({
      ...caseItem,
      REMARKS_DECISION: isFiledInCourt ? 'Filed in Court' : (caseItem.REMARKS_DECISION || 'Pending'),
    });
    const parsed = parseRespondents(caseItem.RESPONDENT);
    setEditRespondents(parsed.length > 0 ? parsed : ['']);
    const parsedComplainants = parseRespondents(caseItem.COMPLAINANT);
    setEditComplainants(parsedComplainants.length > 0 ? parsedComplainants : ['']);
    const parsedAddresses = parseRespondents(caseItem.ADDRESS_OF_RESPONDENT);
    setEditAddresses(parsedAddresses.length > 0 ? parsedAddresses : ['']);

    // Initialize per-respondent recommendations
    const numRespondents = Math.max(1, parsed.length > 0 ? parsed.length : 1);
    const baseRec = isFiledInCourt ? 'Filed in Court' : (caseItem.REMARKS_DECISION || 'Pending');
    const normalizeRec = (val) => {
      const v = (val || '').toLowerCase().trim();
      const map = { 'pending': 'Pending', 'dismissed': 'Dismissed', 'convicted': 'Convicted', 'for resolution': 'For Resolution', 'filed in court': 'Filed in Court' };
      return map[v] || val || 'Pending';
    };
    let recsArray;
    try {
      const arr = JSON.parse(caseItem.REMARKS_DECISION);
      if (Array.isArray(arr)) {
        recsArray = Array.from({ length: numRespondents }, (_, i) => normalizeRec(arr[i]));
      } else {
        recsArray = Array(numRespondents).fill(normalizeRec(baseRec));
      }
    } catch {
      recsArray = Array(numRespondents).fill(normalizeRec(baseRec));
    }
    setEditRecommendations(recsArray);

    // Initialize per-respondent court info
    const parseJsonOrFill = (raw, len, fallback) => {
      try { const a = JSON.parse(raw); if (Array.isArray(a)) return Array.from({ length: len }, (_, i) => a[i] || fallback); } catch {}
      return Array(len).fill(raw || fallback);
    };
    setEditCrimCaseNos(parseJsonOrFill(caseItem.CRIM_CASE_NO, numRespondents, ''));
    setEditBranches(parseJsonOrFill(caseItem.BRANCH, numRespondents, ''));
    setEditDatesFiledInCourt(parseJsonOrFill(caseItem.DATEFILED_IN_COURT, numRespondents, '').map(d => d?.split('T')[0] || ''));
    setEditFinalOffenses(parseJsonOrFill(caseItem.FINAL_OFFENSE, numRespondents, ''));

    setSelectedImage(null);
    setImageLoadError(false);
    
    // Check if current decision is custom (not one of the predefined options)
    const currentDecision = caseItem.REMARKS_DECISION || 'Pending';
    const predefinedOptions = ['Pending', 'Dismissed', 'Convicted', 'For Resolution', 'Filed in Court'];
    setIsCustomDecision(!predefinedOptions.some(opt => opt.toLowerCase() === currentDecision.toLowerCase()));
    setIsEditFiledInCourt(recsArray.some(r => (r || '').toLowerCase() === 'filed in court') || (caseItem.STATUS || '').toLowerCase() === 'filed in court');
    
    // Parse MR Filed arrays
    const parseMRArray = (raw, fallback) => {
      if (!raw) return [fallback];
      try { const a = JSON.parse(raw); if (Array.isArray(a)) return a.length > 0 ? a : [fallback]; } catch {}
      return [raw || fallback];
    };
    const mrFiledByArr = parseMRArray(caseItem.MR_FILED_BY, '');
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
    setEditMRDateFiling(parseMRArray(caseItem.DATE_MR_FILING, '').map(d => d?.split('T')[0] || ''));
    setEditMRDateResolved(parseMRArray(caseItem.DATE_MR_RESOLVED, '').map(d => d?.split('T')[0] || ''));
    setEditMRFinding(parseMRArray(caseItem.MR_FINDING, ''));

    // Auto-expand MR Filed section if any MR data exists
    const hasMRData = caseItem.MR_FILED_BY || caseItem.DATE_MR_FILING || caseItem.DATE_MR_RESOLVED || caseItem.MR_FINDING;
    setIsEditMRFiled(!!hasMRData);
    
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
    setIsEditFiledInCourt(false);
    setIsEditMRFiled(false);
    setEditRespondents(['']);
    setEditComplainants(['']);
    setEditAddresses(['']);
    setEditRecommendations(['Pending']);
    setEditCrimCaseNos(['']);
    setEditBranches(['']);
    setEditDatesFiledInCourt(['']);
    setEditFinalOffenses(['']);
    setEditMRFiledBy(['']);
    setEditMRFiledByType(['Respondents']);
    setEditMRDateFiling(['']);
    setEditMRDateResolved(['']);
    setEditMRFinding(['']);
  };

  const handleFieldChange = (field, value) => {
    // Debug logging for MR fields
    if (field.startsWith('MR_') || field.startsWith('DATE_MR')) {
      console.log(`📝 MR Field Change - ${field}:`, value);
    }
    if (field === 'REMARKS_DECISION') {
      if (value === 'Other (Custom)') {
        setIsCustomDecision(true);
        setIsEditFiledInCourt(false);
        setEditedCase((prev) => ({ ...prev, REMARKS_DECISION: '' }));
        return;
      }
      if (value === 'Filed in Court') {
        setIsEditFiledInCourt(true);
        setIsCustomDecision(false);
      } else {
        setIsEditFiledInCourt(false);
        const isOther = !['Pending', 'Dismissed', 'Convicted', 'For Resolution'].some(opt => opt.toLowerCase() === value.toLowerCase());
        setIsCustomDecision(isOther);
      }
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
        const serializedComplainants = JSON.stringify(editComplainants.filter(c => c.trim() !== '').map(c => c.trim()));
        const serializedAddresses = JSON.stringify(editAddresses.map(a => a.trim()));
        Object.keys(editedCase).forEach((key) => {
          if (key !== 'id' && key !== 'INDEX_CARDS' && key !== 'RESPONDENT' && key !== 'COMPLAINANT' && key !== 'ADDRESS_OF_RESPONDENT' && key !== 'REMARKS_DECISION' && key !== 'CRIM_CASE_NO' && key !== 'BRANCH' && key !== 'DATEFILED_IN_COURT' && key !== 'FINAL_OFFENSE' && key !== 'MR_FILED_BY' && key !== 'DATE_MR_FILING' && key !== 'DATE_MR_RESOLVED' && key !== 'MR_FINDING' && editedCase[key] !== undefined) {
            formData.append(key, editedCase[key] || '');
          }
        });
        formData.append('RESPONDENT', serializedRespondents);
        formData.append('COMPLAINANT', serializedComplainants);
        formData.append('ADDRESS_OF_RESPONDENT', serializedAddresses);
        formData.append('REMARKS_DECISION', JSON.stringify(editRecommendations.map(r => r || 'Pending')));
        formData.append('CRIM_CASE_NO', JSON.stringify(editCrimCaseNos));
        formData.append('BRANCH', JSON.stringify(editBranches));
        formData.append('DATEFILED_IN_COURT', JSON.stringify(editDatesFiledInCourt));
        formData.append('FINAL_OFFENSE', JSON.stringify(editFinalOffenses));
        formData.append('MR_FILED_BY', JSON.stringify(editMRFiledBy.map((name, i) => {
          const type = editMRFiledByType[i] || '';
          if (!type && !name) return '';
          if (type === 'Complainants') return name ? `Complainant: ${name}` : '';
          if (type === 'Respondents') return name ? `Respondent: ${name}` : '';
          return name;
        })));
        formData.append('DATE_MR_FILING', JSON.stringify(editMRDateFiling));
        formData.append('DATE_MR_RESOLVED', JSON.stringify(editMRDateResolved));
        formData.append('MR_FINDING', JSON.stringify(editMRFinding));

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
            COMPLAINANT: JSON.stringify(editComplainants.filter(c => c.trim() !== '').map(c => c.trim())),
            RESPONDENT: JSON.stringify(editRespondents.filter(r => r.trim() !== '').map(r => r.trim())),
            ADDRESS_OF_RESPONDENT: JSON.stringify(editAddresses.map(a => a.trim())),
            OFFENSE: editedCase.OFFENSE,
            DATE_OF_COMMISSION: editedCase.DATE_OF_COMMISSION,
            DATE_RESOLVED: editedCase.DATE_RESOLVED,
            RESOLVING_PROSECUTOR: editedCase.RESOLVING_PROSECUTOR,
            REMARKS_DECISION: JSON.stringify(editRecommendations.map(r => r || 'Pending')),
            STATUS: editedCase.STATUS,
            PENALTY: editedCase.PENALTY,
            DECISION_DATE: editedCase.DECISION_DATE,
            CRIM_CASE_NO: JSON.stringify(editCrimCaseNos),
            BRANCH: JSON.stringify(editBranches),
            DATEFILED_IN_COURT: JSON.stringify(editDatesFiledInCourt),
            FINAL_OFFENSE: JSON.stringify(editFinalOffenses),
            MR_FILED_BY: JSON.stringify(editMRFiledBy.map((name, i) => {
              const type = editMRFiledByType[i] || '';
              if (!type && !name) return '';
              if (type === 'Complainants') return name ? `Complainant: ${name}` : '';
              if (type === 'Respondents') return name ? `Respondent: ${name}` : '';
              return name;
            })),
            DATE_MR_FILING: JSON.stringify(editMRDateFiling),
            DATE_MR_RESOLVED: JSON.stringify(editMRDateResolved),
            MR_FINDING: JSON.stringify(editMRFinding),
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
      className={`min-h-screen py-2 px-2 relative overflow-hidden ${
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
        className="relative z-10 w-full max-w-full mx-auto px-1 lg:px-2"
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
                    <th className="px-2 py-3 text-left font-semibold text-xs w-[9%]">Docket No</th>
                    <th className="px-2 py-3 text-left font-semibold text-xs w-[7%]">Date Filed</th>
                    <th className="px-2 py-3 text-left font-semibold text-xs w-[10%]">Complainant</th>
                    <th className="px-2 py-3 text-left font-semibold text-xs w-[10%]">Respondent</th>
                    <th className="px-2 py-3 text-left font-semibold text-xs w-[9%]">Address</th>
                    <th className="px-2 py-3 text-left font-semibold text-xs w-[12%]">Status</th>
                    <th className="px-2 py-3 text-left font-semibold text-xs w-[9%]">Offense</th>
                    <th className="px-2 py-3 text-center font-semibold text-xs w-[13%]">Final Offense</th>
                    <th className="px-2 py-3 text-center font-semibold text-xs w-[7%]">Decision Date</th>
                    <th className="px-2 py-3 text-center font-semibold text-xs w-[18%]">Actions</th>
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
                        <MarqueeText className={`font-mono font-semibold text-xs ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                          {caseItem.DOCKET_NO || 'N/A'}
                        </MarqueeText>
                      </td>
                      <td className={`px-2 py-3 text-xs whitespace-nowrap ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                        {formatDate(caseItem.DATE_FILED)}
                      </td>
                      <td className={`px-2 py-3 text-xs font-medium overflow-hidden ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                        {(() => {
                          const cList = parseRespondents(caseItem.COMPLAINANT);
                          if (cList.length === 0) return <span>N/A</span>;
                          return (
                            <div className="flex flex-col gap-0.5">
                              {cList.map((name, i) => (
                                <MarqueeText key={i} className="block">{i + 1}. {name}</MarqueeText>
                              ))}
                            </div>
                          );
                        })()}
                      </td>
                      <td className={`px-2 py-3 text-xs overflow-hidden ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        {(() => {
                          const rList = parseRespondents(caseItem.RESPONDENT);
                          if (rList.length === 0) return <span>N/A</span>;
                          return (
                            <div className="flex flex-col gap-0.5">
                              {rList.map((name, i) => (
                                <MarqueeText key={i} className="block">{i + 1}. {name}</MarqueeText>
                              ))}
                            </div>
                          );
                        })()}
                      </td>
                      <td className={`px-2 py-3 text-xs overflow-hidden ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {(() => {
                          const rList = parseRespondents(caseItem.RESPONDENT);
                          const aList = parseRespondents(caseItem.ADDRESS_OF_RESPONDENT);
                          if (rList.length === 0) return <span>—</span>;
                          return (
                            <div className="flex flex-col gap-0.5">
                              {rList.map((_, i) => (
                                <MarqueeText key={i} className="block italic">
                                  {i + 1}. {aList[i] || '—'}
                                </MarqueeText>
                              ))}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-0 py-3 text-left overflow-hidden">
                        {(() => {
                          const rawDecision = caseItem.REMARKS_DECISION || 'Pending';
                          let decisions;
                          try {
                            const arr = JSON.parse(rawDecision);
                            decisions = Array.isArray(arr) ? arr : [rawDecision];
                          } catch { decisions = [rawDecision]; }
                          const rList = parseRespondents(caseItem.RESPONDENT);
                          const count = Math.max(decisions.length, rList.length || 1);
                          const getStatusBadge = (val) => {
                            const d = (val || 'Pending').toLowerCase();
                            if (d === 'pending') return <span className={`px-2 py-1 rounded-md text-xs font-semibold inline-block whitespace-nowrap ${isDark ? 'bg-yellow-900/30 text-yellow-300' : 'bg-yellow-100 text-yellow-700'}`}>Pending</span>;
                            if (d === 'dismissed') return <span className={`px-2 py-1 rounded-md text-xs font-semibold inline-block whitespace-nowrap ${isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>Dismissed</span>;
                            if (d === 'convicted') return <span className={`px-2 py-1 rounded-md text-xs font-semibold inline-block whitespace-nowrap ${isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700'}`}>Convicted</span>;
                            if (d === 'filed in court') return <span className={`px-2 py-1 rounded-md text-xs font-semibold inline-block whitespace-nowrap ${isDark ? 'bg-emerald-900/30 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}>Filed in Court</span>;
                            return <div className={`px-2 py-1 rounded-md text-xs font-semibold max-w-full overflow-hidden ${isDark ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-700'}`}><MarqueeText>{val || 'Pending'}</MarqueeText></div>;
                          };
                          return (
                            <div className="flex flex-col gap-1 items-start">
                              {Array.from({ length: count }).map((_, i) => (
                                <span key={i} className="inline-flex items-center gap-1 max-w-full overflow-hidden"><span className="min-w-[1.25rem] text-right shrink-0">{i + 1}.</span> {getStatusBadge(decisions[i])}</span>
                              ))}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-2 py-3 overflow-hidden">
                        <div className={`px-2 py-1 rounded-md text-xs overflow-hidden ${
                          isDark
                            ? 'bg-slate-700 text-slate-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          <MarqueeText>{caseItem.OFFENSE || 'N/A'}</MarqueeText>
                        </div>
                      </td>
                      <td className="px-2 py-3 text-center">
                        {(() => {
                          let allOffenses = [];
                          try {
                            const arr = JSON.parse(caseItem.FINAL_OFFENSE);
                            allOffenses = Array.isArray(arr) ? arr : (caseItem.FINAL_OFFENSE && caseItem.FINAL_OFFENSE.trim() ? [caseItem.FINAL_OFFENSE] : []);
                          } catch {
                            allOffenses = caseItem.FINAL_OFFENSE && caseItem.FINAL_OFFENSE.trim() ? [caseItem.FINAL_OFFENSE] : [];
                          }
                          let allDecisions = [];
                          try {
                            const arr = JSON.parse(caseItem.REMARKS_DECISION);
                            allDecisions = Array.isArray(arr) ? arr : [caseItem.REMARKS_DECISION || 'Pending'];
                          } catch {
                            allDecisions = [caseItem.REMARKS_DECISION || 'Pending'];
                          }
                          // Only show offenses for respondents whose decision is "Filed in Court"
                          // Keep the original index so the number matches the respondent number
                          const offensesWithIndex = allOffenses
                            .map((o, i) => ({ offense: o, origIndex: i }))
                            .filter(({ offense, origIndex }) =>
                              offense && offense.trim() && (allDecisions[origIndex] || '').toLowerCase() === 'filed in court'
                            );
                          
                          if (!offensesWithIndex.length) return null;
                          
                          return (
                            <div className={offensesWithIndex.length === 1 ? '' : 'flex flex-col gap-0.5'}>
                              {offensesWithIndex.map(({ offense, origIndex }) => (
                                <span key={origIndex} className={`px-2 py-1 rounded-md text-xs font-semibold inline-block break-words ${isDark ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-700'}`} title={offense}>
                                  {origIndex + 1}. {offense}
                                </span>
                              ))}
                            </div>
                          );
                        })()}
                      </td>
                      <td className={`px-2 py-3 text-center text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                        {formatDate(caseItem.DECISION_DATE)}
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex items-center justify-center gap-2 flex-nowrap">
                          {/* View Button */}
                          <motion.button
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleViewClick(caseItem)}
                            className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 
                                     transition-all duration-1 shadow-lg shadow-blue-500/40 hover:shadow-xl hover:shadow-blue-500/60
                                     flex items-center justify-center cursor-pointer border-none text-base font-semibold"
                            title="View Details"
                          >
                            <i className="fas fa-eye"></i>
                          </motion.button>

                          {/* Edit Button */}
                          <motion.button
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleEditClick(caseItem)}
                            className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 
                                     transition-all duration-1 shadow-lg shadow-green-500/40 hover:shadow-xl hover:shadow-green-500/60
                                     flex items-center justify-center cursor-pointer border-none text-base font-semibold"
                            title="Edit Case"
                          >
                            <i className="fas fa-edit"></i>
                          </motion.button>

                          {/* Print Button with Format Dropdown */}
                          <div className="print-dropdown-container">
                            <motion.button
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.95 }}
                              type="button"
                              onClick={(e) => {
                                const r = e.currentTarget.getBoundingClientRect();
                                setPrintDropdownPos({ top: r.bottom + 6, left: r.right - 208 });
                                setPrintDropdownCase(printDropdownCase === caseItem.id ? null : caseItem.id);
                              }}
                              className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 
                                       transition-all duration-2 shadow-lg shadow-purple-500/40 hover:shadow-xl hover:shadow-purple-500/60
                                       flex items-center justify-center cursor-pointer border-none text-base font-semibold"
                              title="Print Case"
                            >
                              <i className="fas fa-print"></i>
                            </motion.button>
                          </div>

                          {/* Delete Button - Only for Admin */}
                          {user?.role === 'Admin' && (
                            <motion.button
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleDeleteClick(caseItem)}
                              className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 
                                       transition-all duration-2 shadow-lg shadow-red-500/40 hover:shadow-xl hover:shadow-red-500/60
                                       flex items-center justify-center cursor-pointer border-none text-base font-semibold"
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
              className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 pb-4 bg-black/50 backdrop-blur-sm ml-64"
              onClick={() => setShowViewModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, x: -30 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95, x: -30 }}
                className={`rounded-3xl shadow-2xl max-w-6xl w-full max-h-[calc(100vh-5rem)] flex flex-col overflow-hidden ${
                  isDark ? 'bg-slate-800' : 'bg-white'
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className={`px-5 py-3 border-b flex-shrink-0 ${isDark ? 'bg-blue-600 border-blue-700' : 'bg-gradient-to-r from-blue-500 to-blue-600 border-slate-200'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <h3 className="text-base font-bold text-white flex items-center gap-2 shrink-0">
                        <i className="fas fa-file-alt"></i>
                        Case Details
                      </h3>
                      <span className={`text-xs font-semibold truncate ${isDark ? 'text-blue-100' : 'text-blue-50'}`}>— {selectedCase.DOCKET_NO}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowViewModal(false)}
                      className="w-7 h-7 rounded-full bg-white/20 text-white hover:bg-white/30 
                               transition-colors flex items-center justify-center cursor-pointer border-none shrink-0 ml-2"
                    >
                      <i className="fas fa-times text-xs"></i>
                    </button>
                  </div>
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
                      { label: 'Complainant', values: parseRespondents(selectedCase.COMPLAINANT), icon: 'fa-user', placeholder: 'No complainants' },
                      { type: 'respondentAddress', colSpan: 3 },
                      { label: 'Offense', value: selectedCase.OFFENSE, icon: 'fa-gavel', noTruncate: true },
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
                      { label: 'Branch', value: selectedCase.BRANCH, icon: 'fa-building', blankIfEmpty: true },
                      ...((selectedCase.STATUS || '').toLowerCase() === 'filed in court' ? [
                        {
                          label: 'Criminal Case No',
                          value: selectedCase.CRIM_CASE_NO,
                          icon: 'fa-file-contract',
                        },
                        {
                          label: 'Date Filed in Court',
                          value: formatDate(selectedCase.DATEFILED_IN_COURT),
                          icon: 'fa-landmark',
                        },
                      ] : []),
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
                    ].map((item, idx) => {
                      if (item.type === 'respondentAddress') {
                        const respondentList = parseRespondents(selectedCase.RESPONDENT);
                        const addressList = parseRespondents(selectedCase.ADDRESS_OF_RESPONDENT);
                        let recommendations = [];
                        try {
                          const arr = JSON.parse(selectedCase.REMARKS_DECISION);
                          recommendations = Array.isArray(arr) ? arr : [selectedCase.REMARKS_DECISION || 'Pending'];
                        } catch {
                          recommendations = [selectedCase.REMARKS_DECISION || 'Pending'];
                        }
                        let finalOffenses = [];
                        try {
                          const arr = JSON.parse(selectedCase.FINAL_OFFENSE);
                          finalOffenses = Array.isArray(arr) ? arr.filter(o => o && o.trim()) : (selectedCase.FINAL_OFFENSE && selectedCase.FINAL_OFFENSE.trim() ? [selectedCase.FINAL_OFFENSE] : []);
                        } catch {
                          finalOffenses = selectedCase.FINAL_OFFENSE && selectedCase.FINAL_OFFENSE.trim() ? [selectedCase.FINAL_OFFENSE] : [];
                        }
                        let crimCaseNos = [];
                        try {
                          const arr = JSON.parse(selectedCase.CRIM_CASE_NO);
                          crimCaseNos = Array.isArray(arr) ? arr.filter(o => o && o.trim()) : (selectedCase.CRIM_CASE_NO && selectedCase.CRIM_CASE_NO.trim() ? [selectedCase.CRIM_CASE_NO] : []);
                        } catch {
                          crimCaseNos = selectedCase.CRIM_CASE_NO && selectedCase.CRIM_CASE_NO.trim() ? [selectedCase.CRIM_CASE_NO] : [];
                        }
                        let datesFiledInCourt = [];
                        try {
                          const arr = JSON.parse(selectedCase.DATEFILED_IN_COURT);
                          datesFiledInCourt = Array.isArray(arr) ? arr.filter(o => o && o.trim()) : (selectedCase.DATEFILED_IN_COURT && selectedCase.DATEFILED_IN_COURT.trim() ? [selectedCase.DATEFILED_IN_COURT] : []);
                        } catch {
                          datesFiledInCourt = selectedCase.DATEFILED_IN_COURT && selectedCase.DATEFILED_IN_COURT.trim() ? [selectedCase.DATEFILED_IN_COURT] : [];
                        }
                        let branches = [];
                        try {
                          const arr = JSON.parse(selectedCase.BRANCH);
                          branches = Array.isArray(arr) ? arr.filter(o => o && o.trim()) : (selectedCase.BRANCH && selectedCase.BRANCH.trim() ? [selectedCase.BRANCH] : []);
                        } catch {
                          branches = selectedCase.BRANCH && selectedCase.BRANCH.trim() ? [selectedCase.BRANCH] : [];
                        }
                        
                        const getRecommendationBadge = (val) => {
                          const d = (val || 'Pending').toLowerCase();
                          if (d === 'pending') return <span className={`px-2 py-1 rounded-md text-xs font-semibold ${isDark ? 'bg-yellow-900/30 text-yellow-300' : 'bg-yellow-100 text-yellow-700'}`}>Pending</span>;
                          if (d === 'dismissed') return <span className={`px-2 py-1 rounded-md text-xs font-semibold ${isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>Dismissed</span>;
                          if (d === 'convicted') return <span className={`px-2 py-1 rounded-md text-xs font-semibold ${isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700'}`}>Convicted</span>;
                          if (d === 'filed in court') return <span className={`px-2 py-1 rounded-md text-xs font-semibold ${isDark ? 'bg-emerald-900/30 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}>Filed in Court</span>;
                          return <span className={`px-2 py-1 rounded-md text-xs font-semibold ${isDark ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-700'}`}>{val || 'Pending'}</span>;
                        };
                        
                        return (
                          <div
                            key={idx}
                            className={`col-span-3 p-4 rounded-xl transition-all border shadow-sm ${
                              isDark
                                ? 'bg-slate-700 border-slate-600'
                                : 'bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200'
                            }`}
                          >
                            <div className="flex gap-3 mb-3">
                              <p className={`flex-1 text-xs uppercase font-semibold flex items-center gap-1.5 whitespace-nowrap ${
                                isDark ? 'text-slate-300' : 'text-slate-600'
                              }`}>
                                <i className="fas fa-user-tie text-blue-500 text-xs"></i>
                                Respondent
                              </p>
                              <p className={`flex-1 text-xs uppercase font-semibold flex items-center gap-1.5 whitespace-nowrap ${
                                isDark ? 'text-slate-300' : 'text-slate-600'
                              }`}>
                                <i className="fas fa-map-marker-alt text-blue-500 text-xs"></i>
                                Address of Respondent
                              </p>
                              <p className={`flex-1 text-xs uppercase font-semibold flex items-center gap-1.5 whitespace-nowrap ${
                                isDark ? 'text-slate-300' : 'text-slate-600'
                              }`}>
                                <i className="fas fa-clipboard-check text-blue-500 text-xs"></i>
                                Recommendation
                              </p>
                              <p className={`flex-1 text-xs uppercase font-semibold flex items-center gap-1.5 whitespace-nowrap ${
                                isDark ? 'text-slate-300' : 'text-slate-600'
                              }`}>
                                <i className="fas fa-gavel text-blue-500 text-xs"></i>
                                Final Offense
                              </p>
                              <p className={`flex-1 text-xs uppercase font-semibold flex items-center gap-1.5 whitespace-nowrap ${
                                isDark ? 'text-slate-300' : 'text-slate-600'
                              }`}>
                                <i className="fas fa-file-contract text-blue-500 text-xs"></i>
                                Criminal Case No
                              </p>
                              <p className={`flex-1 text-xs uppercase font-semibold flex items-center gap-1.5 whitespace-nowrap ${
                                isDark ? 'text-slate-300' : 'text-slate-600'
                              }`}>
                                <i className="fas fa-calendar-check text-blue-500 text-xs"></i>
                                Date Filed in Court
                              </p>
                              <p className={`flex-1 text-xs uppercase font-semibold flex items-center gap-1.5 whitespace-nowrap ${
                                isDark ? 'text-slate-300' : 'text-slate-600'
                              }`}>
                                <i className="fas fa-building text-blue-500 text-xs"></i>
                                Branch
                              </p>
                            </div>
                            {respondentList.length === 0 ? (
                              <p className={`text-sm font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>N/A</p>
                            ) : (
                              respondentList.map((name, i) => (
                                <div key={i} className={`flex gap-3 items-center ${i > 0 ? `mt-2 pt-2 border-t ${isDark ? 'border-slate-600' : 'border-slate-200'}` : ''}`}>
                                  <div className="flex-1 flex items-center gap-1.5">
                                    <span className="min-w-[0.75rem]">
                                      {respondentList.length > 1 && (
                                        <span className="text-blue-500 font-bold text-xs">{i + 1}.</span>
                                      )}
                                    </span>
                                    <span className={`text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{name}</span>
                                  </div>
                                  <div className="flex-1 flex items-center gap-1.5">
                                    <span className="min-w-[-0.78rem]"></span>
                                    <span className={`text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                                      {addressList[i] || <span className={`font-normal italic ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No address</span>}
                                    </span>
                                  </div>
                                  <div className="flex-1 flex items-center gap-1.5">
                                    <span className="min-w-[1.75rem]"></span>
                                    {getRecommendationBadge(recommendations[i])}
                                  </div>
                                  <div className="flex-1 flex items-center gap-1.5">
                                    <span className="min-w-[2.75rem]"></span>
                                    {(recommendations[i] || '').toLowerCase() === 'filed in court' && finalOffenses[i] ? (
                                      <span className={`px-2 py-1 rounded-md text-xs font-semibold inline-block ${
                                        isDark ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-700'
                                      }`}>
                                        {finalOffenses[i]}
                                      </span>
                                    ) : null}
                                  </div>
                                  <div className="flex-1 flex items-center gap-1.5">
                                    <span className="min-w-[1.75rem]"></span>
                                    {(recommendations[i] || '').toLowerCase() === 'filed in court' && crimCaseNos[i] ? (
                                      <span className={`text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                                        {crimCaseNos[i]}
                                      </span>
                                    ) : null}
                                  </div>
                                  <div className="flex-1 flex items-center gap-1.5">
                                    <span className="min-w-[2.10rem]"></span>
                                    {(recommendations[i] || '').toLowerCase() === 'filed in court' && datesFiledInCourt[i] ? (
                                      <span className={`text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                                        {datesFiledInCourt[i]}
                                      </span>
                                    ) : null}
                                  </div>
                                  <div className="flex-1 flex items-center gap-1.5">
                                    <span className="min-w-[3.25rem]"></span>
                                    {(recommendations[i] || '').toLowerCase() === 'filed in court' && branches[i] ? (
                                      <span className={`text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                                        {branches[i]}
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        );
                      }
                      return (
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
                                ? (item.placeholder || 'N/A')
                                : item.values.map((v, i) => (
                                    <span key={i} className={`block ${i > 0 ? 'mt-1 pt-1 border-t border-slate-200/40' : ''}`}>
                                      {item.values.length > 1 ? <span className="text-blue-500 mr-1 font-bold">{i + 1}.</span> : null}{v}
                                    </span>
                                  ))
                              : (() => {
                                let displayValue = item.value;
                                try {
                                  const parsed = JSON.parse(item.value);
                                  if (Array.isArray(parsed)) {
                                    const filtered = parsed.filter(v => v && String(v).trim());
                                    displayValue = filtered.length > 0 ? filtered[0] : '';
                                  }
                                } catch {}
                                return displayValue && !item.noTruncate && displayValue.length > 25 
                                  ? `${displayValue.substring(0, 25)}...` 
                                  : (displayValue || (item.blankIfEmpty ? '' : 'N/A'));
                              })()
                            }
                          </p>
                        </div>
                      );
                    })}
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

                  {/* MR Filed Section */}
                  {(selectedCase.MR_FILED_BY || selectedCase.DATE_MR_FILING || selectedCase.DATE_MR_RESOLVED || selectedCase.MR_FINDING) && (() => {
                    const parseMR = (raw) => {
                      if (!raw) return [];
                      try { const a = JSON.parse(raw); if (Array.isArray(a)) return a; } catch {}
                      return [raw];
                    };
                    const mrFiledByList = parseMR(selectedCase.MR_FILED_BY);
                    const mrDateFilingList = parseMR(selectedCase.DATE_MR_FILING);
                    const mrDateResolvedList = parseMR(selectedCase.DATE_MR_RESOLVED);
                    const mrFindingList = parseMR(selectedCase.MR_FINDING);
                    const mrCount = Math.max(mrFiledByList.length, mrDateFilingList.length, mrDateResolvedList.length, mrFindingList.length, 1);

                    return (
                      <div className={`mt-4 p-4 rounded-xl border shadow-sm ${
                        isDark
                          ? 'bg-amber-900/20 border-amber-700/50'
                          : 'bg-amber-50 border-amber-200'
                      }`}>
                        <p className={`text-xs uppercase font-semibold flex items-center gap-1.5 mb-3 ${
                          isDark ? 'text-amber-300' : 'text-amber-700'
                        }`}>
                          <i className="fas fa-folder-open text-amber-500 text-xs"></i>
                          MR Filed Information
                        </p>
                        {Array.from({ length: mrCount }).map((_, mi) => (
                          <div key={mi} className={mi > 0 ? `mt-3 pt-3 border-t ${isDark ? 'border-amber-700/40' : 'border-amber-200'}` : ''}>
                            {mrCount > 1 && (
                              <p className={`text-xs font-bold mb-2 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>MR Entry {mi + 1}</p>
                            )}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              {[
                                { label: 'MR Filed By', value: mrFiledByList[mi], icon: 'fa-user' },
                                { label: 'Date of MR Filing', value: formatDate(mrDateFilingList[mi]), icon: 'fa-calendar' },
                                { label: 'Date MR Resolved', value: formatDate(mrDateResolvedList[mi]), icon: 'fa-calendar-check' },
                                { label: 'Finding', value: mrFindingList[mi], icon: 'fa-search' },
                              ].map((item, idx) => (
                                <div
                                  key={idx}
                                  className={`p-3 rounded-xl border shadow-sm ${
                                    isDark
                                      ? 'bg-slate-700/80 border-amber-700/40'
                                      : 'bg-white border-amber-200'
                                  }`}
                                >
                                  <p className={`text-xs uppercase font-semibold flex items-center gap-1.5 mb-1.5 ${
                                    isDark ? 'text-amber-300' : 'text-amber-600'
                                  }`}>
                                    <i className={`fas ${item.icon} text-amber-500 text-xs`}></i>
                                    {item.label}
                                  </p>
                                  <p className={`font-semibold text-sm ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                                    {item.value || 'N/A'}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

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
              className="fixed inset-0 z-50 flex items-start justify-end pr-6 pt-14 pb-6 bg-black/50 backdrop-blur-sm"
              onClick={closeEditModal}
            >
              <motion.div
                initial={{ opacity: 0, x: 60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 60 }}
                className={`rounded-3xl shadow-2xl max-w-6xl w-full flex flex-col max-h-[calc(100vh-3rem)] overflow-hidden ${
                  isDark ? 'bg-slate-800' : 'bg-white'
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className={`px-6 py-3 ${isDark ? 'bg-gradient-to-r from-green-700 to-green-600' : 'bg-gradient-to-r from-green-600 to-green-500'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <i className="fas fa-edit text-white/80 text-xs"></i>
                      <h3 className="text-sm font-bold text-white tracking-wide">Edit Case</h3>
                      <span className="text-green-200 text-xs font-medium opacity-70">|</span>
                      <span className="text-green-100 text-xs font-semibold tracking-widest uppercase">{editedCase.DOCKET_NO}</span>
                    </div>
                    <button
                      type="button"
                      onClick={closeEditModal}
                      className="w-7 h-7 rounded-full bg-white/20 text-white hover:bg-white/30 
                               transition-colors flex items-center justify-center cursor-pointer border-none text-xs"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                </div>

                {/* Modal Content */}
                <div className={`px-8 py-6 flex-1 overflow-y-auto scroll-smooth ${isDark ? 'bg-slate-800' : 'bg-white'} [&::-webkit-scrollbar]:w-4 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:rounded-full ${isDark ? '[&::-webkit-scrollbar-track]:bg-slate-700 [&::-webkit-scrollbar-thumb]:bg-green-600 hover:[&::-webkit-scrollbar-thumb]:bg-green-500' : '[&::-webkit-scrollbar-track]:bg-slate-200 [&::-webkit-scrollbar-thumb]:bg-green-500 hover:[&::-webkit-scrollbar-thumb]:bg-green-600'}`}>
                  <div className="grid grid-cols-12 gap-x-4 gap-y-3">

                    {/* ── ROW 1: Date Filed | Offense | Date of Commission ── */}
                    <div className="col-span-3">
                      <label className={`block text-[11px] font-bold uppercase tracking-widest mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        <i className="fas fa-calendar text-green-500 mr-1.5"></i>Date Filed
                      </label>
                      <input
                        type="date"
                        value={editedCase.DATE_FILED?.split('T')[0] || ''}
                        onChange={(e) => handleFieldChange('DATE_FILED', e.target.value)}
                        className={`w-full px-4 py-2.5 rounded-xl border-2 text-sm font-medium placeholder:font-normal focus:outline-none focus:ring-2 transition-all ${isDark ? 'border-slate-600 bg-slate-700/80 text-slate-100 placeholder:text-slate-500 focus:border-green-400 focus:ring-green-400/20' : 'border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:border-green-500 focus:ring-green-500/15'}`}
                      />
                    </div>

                    <div className="col-span-6">
                      <label className={`block text-[11px] font-bold uppercase tracking-widest mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        <i className="fas fa-exclamation-triangle text-green-500 mr-1.5"></i>Offense
                      </label>
                      <input
                        type="text"
                        value={editedCase.OFFENSE || ''}
                        onChange={(e) => handleFieldChange('OFFENSE', e.target.value)}
                        className={`w-full px-4 py-2.5 rounded-xl border-2 text-sm font-medium placeholder:font-normal focus:outline-none focus:ring-2 transition-all ${isDark ? 'border-slate-600 bg-slate-700/80 text-slate-100 placeholder:text-slate-500 focus:border-green-400 focus:ring-green-400/20' : 'border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:border-green-500 focus:ring-green-500/15'}`}
                      />
                    </div>

                    <div className="col-span-3">
                      <label className={`block text-[11px] font-bold uppercase tracking-widest mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        <i className="fas fa-calendar-day text-green-500 mr-1.5"></i>Date of Commission
                      </label>
                      <input
                        type="date"
                        value={editedCase.DATE_OF_COMMISSION?.split('T')[0] || ''}
                        onChange={(e) => handleFieldChange('DATE_OF_COMMISSION', e.target.value)}
                        className={`w-full px-4 py-2.5 rounded-xl border-2 text-sm font-medium placeholder:font-normal focus:outline-none focus:ring-2 transition-all ${isDark ? 'border-slate-600 bg-slate-700/80 text-slate-100 placeholder:text-slate-500 focus:border-green-400 focus:ring-green-400/20' : 'border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:border-green-500 focus:ring-green-500/15'}`}
                      />
                    </div>

                    <div className={`col-span-12 border-t ${isDark ? 'border-slate-700' : 'border-slate-100'}`}></div>
                    {/* ── ROW 2: Complainant | Respondent + Address ── */}
                    <div className="col-span-4">
                      <label className={`block text-[11px] font-bold uppercase tracking-widest mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        <i className="fas fa-user text-green-500 mr-1.5"></i>Complainant
                      </label>
                      {editComplainants.map((c, index) => (
                        <div key={index} className={`flex gap-2 ${index > 0 ? 'mt-1.5' : ''}`}>
                          <input
                            type="text"
                            value={c}
                            onChange={(e) => {
                              const updated = [...editComplainants];
                              updated[index] = e.target.value;
                              setEditComplainants(updated);
                            }}
                            placeholder={index === 0 ? 'Enter complainant name' : `Complainant ${index + 1}`}
                            className={`w-full px-4 py-2.5 rounded-xl border-2 text-sm font-medium placeholder:font-normal focus:outline-none focus:ring-2 transition-all ${isDark ? 'border-slate-600 bg-slate-700/80 text-slate-100 placeholder:text-slate-500 focus:border-green-400 focus:ring-green-400/20' : 'border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:border-green-500 focus:ring-green-500/15'}`}
                          />
                          {editComplainants.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setEditComplainants(editComplainants.filter((_, i) => i !== index))}
                              className={`w-9 flex-shrink-0 rounded-lg border-2 flex items-center justify-center transition-colors cursor-pointer ${isDark ? 'bg-red-900/30 border-red-700 text-red-400 hover:bg-red-900/50' : 'bg-red-50 border-red-200 text-red-500 hover:bg-red-100'}`}
                              title="Remove complainant"
                            >
                              <i className="fas fa-minus text-xs"></i>
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setEditComplainants([...editComplainants, ''])}
                        className={`mt-1.5 flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-lg transition-colors border-none cursor-pointer ${isDark ? 'bg-green-900/30 text-green-400 hover:bg-green-900/50' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                      >
                        <i className="fas fa-plus text-xs"></i>Add Complainant
                      </button>
                    </div>

                    <div className="col-span-8">
                      <div className="flex gap-3 mb-1.5">
                        <label className={`flex-1 text-[11px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          <i className="fas fa-user-shield text-green-500 mr-1.5"></i>Respondent
                        </label>
                        <label className={`flex-1 text-[11px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          <i className="fas fa-map-marker-alt text-green-500 mr-1.5"></i>Address of Respondent
                        </label>
                        <label className={`w-36 flex-shrink-0 text-[11px] font-bold uppercase tracking-widest pl-0.4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          <i className="fas fa-clipboard-check text-green-500 mr-1.5"></i>Recommendation
                        </label>
                      </div>
                      {editRespondents.map((r, index) => (
                        <div key={index}>
                          <div className={`flex gap-2 ${index > 0 ? 'mt-1.5' : ''}`}>
                            <input
                              type="text"
                              value={r}
                              onChange={(e) => {
                                const updated = [...editRespondents];
                                updated[index] = e.target.value;
                                setEditRespondents(updated);
                              }}
                              placeholder={index === 0 ? 'Enter respondent name' : `Respondent ${index + 1}`}
                              className={`flex-1 px-4 py-2.5 rounded-xl border-2 text-sm font-medium placeholder:font-normal focus:outline-none focus:ring-2 transition-all ${isDark ? 'border-slate-600 bg-slate-700/80 text-slate-100 placeholder:text-slate-500 focus:border-green-400 focus:ring-green-400/20' : 'border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:border-green-500 focus:ring-green-500/15'}`}
                            />
                            <input
                              type="text"
                              value={editAddresses[index] || ''}
                              onChange={(e) => {
                                const updated = [...editAddresses];
                                updated[index] = e.target.value;
                                setEditAddresses(updated);
                              }}
                              placeholder={index === 0 ? 'Enter address' : `Address ${index + 1}`}
                              className={`flex-1 px-4 py-2.5 rounded-xl border-2 text-sm font-medium placeholder:font-normal focus:outline-none focus:ring-2 transition-all ${isDark ? 'border-slate-600 bg-slate-700/80 text-slate-100 placeholder:text-slate-500 focus:border-green-400 focus:ring-green-400/20' : 'border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:border-green-500 focus:ring-green-500/15'}`}
                            />
                            <select
                              value={editRecommendations[index] || 'Pending'}
                              onChange={(e) => {
                                const updated = [...editRecommendations];
                                updated[index] = e.target.value;
                                setEditRecommendations(updated);
                                setIsEditFiledInCourt(updated.some(rec => (rec || '').toLowerCase() === 'filed in court'));
                                if (e.target.value.toLowerCase() !== 'filed in court') {
                                  const updatedOffenses = [...editFinalOffenses];
                                  updatedOffenses[index] = '';
                                  setEditFinalOffenses(updatedOffenses);
                                }
                              }}
                              className={`w-36 flex-shrink-0 px-2 py-2.5 rounded-xl border-2 text-sm font-medium focus:outline-none focus:ring-2 transition-all ${
                                (editRecommendations[index] || '').toLowerCase() === 'filed in court'
                                  ? (isDark ? 'border-emerald-500 bg-emerald-900/30 text-emerald-300 focus:ring-emerald-400/20' : 'border-emerald-500 bg-emerald-50 text-emerald-700 focus:ring-emerald-500/15')
                                  : (isDark ? 'border-slate-600 bg-slate-700/80 text-slate-100 focus:border-green-400 focus:ring-green-400/20' : 'border-slate-300 bg-white text-slate-800 focus:border-green-500 focus:ring-green-500/15')
                              }`}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Dismissed">Dismissed</option>
                              <option value="Convicted">Convicted</option>
                              <option value="For Resolution">For Resolution</option>
                              <option value="Filed in Court">Filed in Court</option>
                            </select>
                            {editRespondents.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditRespondents(editRespondents.filter((_, i) => i !== index));
                                  setEditAddresses(editAddresses.filter((_, i) => i !== index));
                                  setEditCrimCaseNos(editCrimCaseNos.filter((_, i) => i !== index));
                                  setEditBranches(editBranches.filter((_, i) => i !== index));
                                  setEditDatesFiledInCourt(editDatesFiledInCourt.filter((_, i) => i !== index));
                                  setEditFinalOffenses(editFinalOffenses.filter((_, i) => i !== index));
                                  const updatedRecs = editRecommendations.filter((_, i) => i !== index);
                                  setEditRecommendations(updatedRecs);
                                  setIsEditFiledInCourt(updatedRecs.some(rec => (rec || '').toLowerCase() === 'filed in court'));
                                }}
                                className={`w-9 flex-shrink-0 rounded-lg border-2 flex items-center justify-center transition-colors cursor-pointer ${isDark ? 'bg-red-900/30 border-red-700 text-red-400 hover:bg-red-900/50' : 'bg-red-50 border-red-200 text-red-500 hover:bg-red-100'}`}
                                title="Remove respondent"
                              >
                                <i className="fas fa-minus text-xs"></i>
                              </button>
                            )}
                          </div>
                          {/* Court Info — shown per respondent when Filed in Court */}
                          {(editRecommendations[index] || '').toLowerCase() === 'filed in court' && (
                            <div className={`mt-2 p-4 rounded-2xl border-2 ${isDark ? 'border-emerald-700/50 bg-emerald-900/15' : 'border-emerald-200 bg-emerald-50/40'}`}>
                              <div className="flex items-center gap-2 mb-3">
                                <i className="fas fa-landmark text-emerald-500 text-xs"></i>
                                <span className={`text-[11px] font-bold uppercase tracking-widest ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>Court Information</span>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className={`block text-[11px] font-bold uppercase tracking-widest mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    <i className="fas fa-file-contract text-emerald-500 mr-1.5"></i>Criminal Case No
                                  </label>
                                  <input type="text" value={editCrimCaseNos[index] || ''} onChange={(e) => { const u = [...editCrimCaseNos]; u[index] = e.target.value; setEditCrimCaseNos(u); }} placeholder="Enter criminal case no" className={`w-full px-4 py-2.5 rounded-xl border-2 text-sm font-medium placeholder:font-normal focus:outline-none focus:ring-2 transition-all ${isDark ? 'border-emerald-700/60 bg-slate-700/80 text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:ring-emerald-400/20' : 'border-emerald-200 bg-white text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-emerald-500/15'}`} />
                                </div>
                                <div>
                                  <label className={`block text-[11px] font-bold uppercase tracking-widest mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    <i className="fas fa-building text-emerald-500 mr-1.5"></i>Branch
                                  </label>
                                  <input type="text" value={editBranches[index] || ''} onChange={(e) => { const u = [...editBranches]; u[index] = e.target.value; setEditBranches(u); }} placeholder="Enter branch" className={`w-full px-4 py-2.5 rounded-xl border-2 text-sm font-medium placeholder:font-normal focus:outline-none focus:ring-2 transition-all ${isDark ? 'border-emerald-700/60 bg-slate-700/80 text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:ring-emerald-400/20' : 'border-emerald-200 bg-white text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-emerald-500/15'}`} />
                                </div>
                                <div>
                                  <label className={`block text-[11px] font-bold uppercase tracking-widest mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    <i className="fas fa-calendar-check text-emerald-500 mr-1.5"></i>Date Filed in Court
                                  </label>
                                  <input type="date" value={editDatesFiledInCourt[index] || ''} onChange={(e) => { const u = [...editDatesFiledInCourt]; u[index] = e.target.value; setEditDatesFiledInCourt(u); }} className={`w-full px-4 py-2.5 rounded-xl border-2 text-sm font-medium placeholder:font-normal focus:outline-none focus:ring-2 transition-all ${isDark ? 'border-emerald-700/60 bg-slate-700/80 text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:ring-emerald-400/20' : 'border-emerald-200 bg-white text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-emerald-500/15'}`} />
                                </div>
                                <div>
                                  <label className={`block text-[11px] font-bold uppercase tracking-widest mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    <i className="fas fa-gavel text-emerald-500 mr-1.5"></i>Final Offense
                                  </label>
                                  <input type="text" value={editFinalOffenses[index] || ''} onChange={(e) => { const u = [...editFinalOffenses]; u[index] = e.target.value; setEditFinalOffenses(u); }} placeholder="Enter final offense" className={`w-full px-4 py-2.5 rounded-xl border-2 text-sm font-medium placeholder:font-normal focus:outline-none focus:ring-2 transition-all ${isDark ? 'border-emerald-700/60 bg-slate-700/80 text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:ring-emerald-400/20' : 'border-emerald-200 bg-white text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-emerald-500/15'}`} />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setEditRespondents([...editRespondents, '']);
                          setEditAddresses([...editAddresses, '']);
                          setEditRecommendations([...editRecommendations, 'Pending']);
                          setEditCrimCaseNos([...editCrimCaseNos, '']);
                          setEditBranches([...editBranches, '']);
                          setEditDatesFiledInCourt([...editDatesFiledInCourt, '']);
                          setEditFinalOffenses([...editFinalOffenses, '']);
                        }}
                        className={`mt-2.5 flex items-center justify-center gap-2 text-sm font-bold px-5 py-2.5 rounded-xl transition-all duration-300 border-2 cursor-pointer shadow-md hover:shadow-lg transform hover:scale-105 ${
                          isDark
                            ? 'bg-gradient-to-r from-green-600 to-green-700 text-white border-green-500 hover:from-green-700 hover:to-green-800'
                            : 'bg-gradient-to-r from-green-500 to-green-600 text-white border-green-400 hover:from-green-600 hover:to-green-700'
                        }`}
                      >
                        <i className="fas fa-plus text-sm font-bold"></i>Add Respondent
                      </button>
                    </div>

                    <div className={`col-span-12 border-t ${isDark ? 'border-slate-700' : 'border-slate-100'}`}></div>
                    {/* ── ROW 3: Date Resolved | Resolving Prosecutor | Decision Date ── */}
                    <div className="col-span-4">
                      <label className={`block text-[11px] font-bold uppercase tracking-widest mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        <i className="fas fa-calendar-check text-green-500 mr-1.5"></i>Date Resolved
                      </label>
                      <input
                        type="date"
                        value={editedCase.DATE_RESOLVED?.split('T')[0] || ''}
                        onChange={(e) => handleFieldChange('DATE_RESOLVED', e.target.value)}
                        className={`w-full px-4 py-2.5 rounded-xl border-2 text-sm font-medium placeholder:font-normal focus:outline-none focus:ring-2 transition-all ${isDark ? 'border-slate-600 bg-slate-700/80 text-slate-100 placeholder:text-slate-500 focus:border-green-400 focus:ring-green-400/20' : 'border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:border-green-500 focus:ring-green-500/15'}`}
                      />
                    </div>

                    <div className="col-span-4">
                      <label className={`block text-[11px] font-bold uppercase tracking-widest mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        <i className="fas fa-user-tie text-green-500 mr-1.5"></i>Resolving Prosecutor
                      </label>
                      <input
                        type="text"
                        value={editedCase.RESOLVING_PROSECUTOR || ''}
                        onChange={(e) => handleFieldChange('RESOLVING_PROSECUTOR', e.target.value)}
                        className={`w-full px-4 py-2.5 rounded-xl border-2 text-sm font-medium placeholder:font-normal focus:outline-none focus:ring-2 transition-all ${isDark ? 'border-slate-600 bg-slate-700/80 text-slate-100 placeholder:text-slate-500 focus:border-green-400 focus:ring-green-400/20' : 'border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:border-green-500 focus:ring-green-500/15'}`}
                      />
                    </div>

                    <div className="col-span-4">
                      <label className={`block text-[11px] font-bold uppercase tracking-widest mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        <i className="fas fa-calendar-check text-green-500 mr-1.5"></i>Decision Date
                      </label>
                      <input
                        type="date"
                        value={editedCase.DECISION_DATE?.split('T')[0] || ''}
                        onChange={(e) => handleFieldChange('DECISION_DATE', e.target.value)}
                        className={`w-full px-4 py-2.5 rounded-xl border-2 text-sm font-medium placeholder:font-normal focus:outline-none focus:ring-2 transition-all ${isDark ? 'border-slate-600 bg-slate-700/80 text-slate-100 placeholder:text-slate-500 focus:border-green-400 focus:ring-green-400/20' : 'border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:border-green-500 focus:ring-green-500/15'}`}
                      />
                    </div>

                    {/* Court info is now rendered per-respondent inside the loop above */}

                    {/* ── MR Filed Toggle ── */}
                    <div className={`col-span-12 border-t ${isDark ? 'border-slate-700' : 'border-slate-100'}`}></div>
                    <div className="col-span-12 flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => setIsEditMRFiled(v => !v)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border-2 transition-all duration-200 cursor-pointer ${
                          isEditMRFiled
                            ? (isDark ? 'bg-amber-600 text-white border-amber-600 hover:bg-amber-700' : 'bg-amber-500 text-white border-amber-500 hover:bg-amber-600')
                            : (isDark ? 'bg-slate-700 text-amber-400 border-amber-600/50 hover:border-amber-500' : 'bg-white text-amber-600 border-amber-400 hover:bg-amber-50')
                        }`}
                      >
                        <i className={`fas ${isEditMRFiled ? 'fa-chevron-up' : 'fa-chevron-down'} text-xs`}></i>
                        MR Filed
                      </button>
                      <span className={`text-[11px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        <i className="fas fa-folder-open text-amber-500 mr-1.5"></i>Motion for Reconsideration
                      </span>
                    </div>

                    {/* ── CONDITIONAL: MR Filed Fields ── */}
                    {isEditMRFiled && (
                      <div className={`col-span-12 p-4 rounded-2xl border-2 ${isDark ? 'border-amber-700/50 bg-amber-900/10' : 'border-amber-200 bg-amber-50/40'}`}>
                        <div className="flex items-center gap-2 mb-3">
                          <i className="fas fa-folder-open text-amber-500"></i>
                          <span className={`text-[11px] font-bold uppercase tracking-widest ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>MR Filed Information</span>
                        </div>
                        <div className="flex gap-3 mb-2">
                          <div className="flex-[2] flex flex-col">
                            <label className={`text-[11px] font-bold uppercase tracking-widest mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              <i className="fas fa-user text-amber-500 mr-1.5"></i>MR Filed By
                            </label>
                          </div>
                          <div className="flex-1 flex flex-col">
                            <label className={`text-[11px] font-bold uppercase tracking-widest mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              <i className="fas fa-calendar-alt text-amber-500 mr-1.5"></i>Date of MR Filing
                            </label>
                          </div>
                          <div className="flex-1 flex flex-col">
                            <label className={`text-[11px] font-bold uppercase tracking-widest mb-1.5  pl-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              <i className="fas fa-calendar-check text-amber-500 mr-1.5"></i>Date MR Resolved
                            </label>
                          </div>
                          <div className="flex-1 flex flex-col">
                            <label className={`text-[11px] font-bold uppercase tracking-widest mb-1.5 pl-12 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              <i className="fas fa-search text-amber-500 mr-1.5"></i>Finding
                            </label>
                          </div>
                          <span className="w-9 flex-shrink-0"></span>
                        </div>
                        {editMRFiledBy.map((_, mrIndex) => (
                          <div key={mrIndex} className={`flex gap-3 ${mrIndex > 0 ? 'mt-2' : ''}`}>
                            <div className="flex-[2] flex gap-2">
                              <select
                                value={editMRFiledByType[mrIndex] || 'Respondents'}
                                onChange={(e) => { const u = [...editMRFiledByType]; u[mrIndex] = e.target.value; setEditMRFiledByType(u); }}
                                className={`px-3 py-2.5 rounded-xl border-2 text-sm font-medium focus:outline-none focus:ring-2 transition-all whitespace-nowrap min-w-max ${isDark ? 'border-amber-700/60 bg-slate-700/80 text-slate-100 focus:border-amber-400 focus:ring-amber-400/20' : 'border-amber-200 bg-white text-slate-800 focus:border-amber-500 focus:ring-amber-500/15'}`}
                              >
                                <option value="Respondents">Respondents</option>
                                <option value="Complainants">Complainants</option>
                              </select>
                              <div className="relative flex-1">
                                <input
                                  type="text"
                                  value={editMRFiledBy[mrIndex] || ''}
                                  onChange={(e) => { const u = [...editMRFiledBy]; u[mrIndex] = e.target.value; setEditMRFiledBy(u); }}
                                  onFocus={() => setMrNameDropdownOpen(mrIndex)}
                                  placeholder={(editMRFiledByType[mrIndex] || 'Respondents') === 'Complainants' ? 'Enter complainant name' : 'Enter respondent name'}
                                  className={`w-full pl-3 pr-8 py-2.5 rounded-xl border-2 text-sm font-medium focus:outline-none focus:ring-2 transition-all ${isDark ? 'border-amber-700/60 bg-slate-700/80 text-slate-100 placeholder:text-slate-500 focus:border-amber-400 focus:ring-amber-400/20' : 'border-amber-200 bg-white text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500/15'}`}
                                />
                                <button
                                  type="button"
                                  onMouseDown={(e) => { e.preventDefault(); setMrNameDropdownOpen(mrNameDropdownOpen === mrIndex ? null : mrIndex); }}
                                  className={`absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 rounded text-xs transition-colors cursor-pointer border-none ${isDark ? 'text-amber-400 hover:text-amber-300' : 'text-amber-500 hover:text-amber-700'}`}
                                  tabIndex={-1}
                                >
                                  <i className={`fas fa-chevron-down text-[10px] transition-transform ${mrNameDropdownOpen === mrIndex ? 'rotate-180' : ''}`}></i>
                                </button>
                                {mrNameDropdownOpen === mrIndex && (() => {
                                  const type = editMRFiledByType[mrIndex] || 'Respondents';
                                  const names = (type === 'Complainants' ? editComplainants : editRespondents).filter(n => n && n.trim());
                                  if (!names.length) return null;
                                  return (
                                    <div
                                      className={`absolute z-50 top-full left-0 right-0 mt-1 rounded-xl border-2 shadow-lg overflow-hidden ${
                                        isDark ? 'border-amber-700/60 bg-slate-800' : 'border-amber-200 bg-white'
                                      }`}
                                      onMouseDown={(e) => e.preventDefault()}
                                    >
                                      {names.map((name, ni) => (
                                        <button
                                          key={ni}
                                          type="button"
                                          onClick={() => {
                                            const u = [...editMRFiledBy];
                                            u[mrIndex] = name;
                                            setEditMRFiledBy(u);
                                            setMrNameDropdownOpen(null);
                                          }}
                                          className={`w-full text-left px-3 py-2 text-sm font-medium transition-colors cursor-pointer border-none ${
                                            isDark
                                              ? 'text-slate-100 hover:bg-amber-900/40'
                                              : 'text-slate-800 hover:bg-amber-50'
                                          } ${ni > 0 ? (isDark ? 'border-t border-slate-700' : 'border-t border-amber-100') : ''}`}
                                        >
                                          {name}
                                        </button>
                                      ))}
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                            <input
                              type="date"
                              value={editMRDateFiling[mrIndex] || ''}
                              onChange={(e) => { const u = [...editMRDateFiling]; u[mrIndex] = e.target.value; setEditMRDateFiling(u); }}
                              className={`flex-1 px-4 py-2.5 rounded-xl border-2 text-sm font-medium focus:outline-none focus:ring-2 transition-all whitespace-nowrap ${isDark ? 'border-amber-700/60 bg-slate-700/80 text-slate-100 focus:border-amber-400 focus:ring-amber-400/20' : 'border-amber-200 bg-white text-slate-800 focus:border-amber-500 focus:ring-amber-500/15'}`}
                            />
                            <input
                              type="date"
                              value={editMRDateResolved[mrIndex] || ''}
                              onChange={(e) => { const u = [...editMRDateResolved]; u[mrIndex] = e.target.value; setEditMRDateResolved(u); }}
                              className={`flex-1 px-4 py-2.5 rounded-xl border-2 text-sm font-medium focus:outline-none focus:ring-2 transition-all whitespace-nowrap ${isDark ? 'border-amber-700/60 bg-slate-700/80 text-slate-100 focus:border-amber-400 focus:ring-amber-400/20' : 'border-amber-200 bg-white text-slate-800 focus:border-amber-500 focus:ring-amber-500/15'}`}
                            />
                            <select
                              value={editMRFinding[mrIndex] || ''}
                              onChange={(e) => { const u = [...editMRFinding]; u[mrIndex] = e.target.value; setEditMRFinding(u); }}
                              className={`flex-1 px-4 py-2.5 rounded-xl border-2 text-sm font-medium focus:outline-none focus:ring-2 transition-all ${isDark ? 'border-amber-700/60 bg-slate-700/80 text-slate-100 focus:border-amber-400 focus:ring-amber-400/20' : 'border-amber-200 bg-white text-slate-800 focus:border-amber-500 focus:ring-amber-500/15'}`}
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
                                className={`w-9 flex-shrink-0 rounded-lg border-2 flex items-center justify-center transition-colors cursor-pointer ${isDark ? 'bg-red-900/30 border-red-700 text-red-400 hover:bg-red-900/50' : 'bg-red-50 border-red-200 text-red-500 hover:bg-red-100'}`}
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
                          className={`mt-3 flex items-center justify-center gap-2 text-sm font-bold px-5 py-2.5 rounded-xl transition-all duration-300 border-2 cursor-pointer shadow-md hover:shadow-lg transform hover:scale-105 ${
                            isDark
                              ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white border-amber-500 hover:from-amber-700 hover:to-amber-800'
                              : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-400 hover:from-amber-600 hover:to-amber-700'
                          }`}
                        >
                          <i className="fas fa-plus text-sm font-bold"></i>Add MR
                        </button>
                      </div>
                    )}

                    {/* ── ROW 4: Penalty | Index Card Image ── */}
                    <div className={`col-span-12 border-t ${isDark ? 'border-slate-700' : 'border-slate-100'}`}></div>
                    <div className="col-span-3">
                      <label className={`block text-[11px] font-bold uppercase tracking-widest mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        <i className="fas fa-balance-scale text-green-500 mr-1.5"></i>Penalty
                      </label>
                      <input
                        type="text"
                        value={editedCase.PENALTY || ''}
                        onChange={(e) => handleFieldChange('PENALTY', e.target.value)}
                        className={`w-full px-4 py-2.5 rounded-xl border-2 text-sm font-medium placeholder:font-normal focus:outline-none focus:ring-2 transition-all ${isDark ? 'border-slate-600 bg-slate-700/80 text-slate-100 placeholder:text-slate-500 focus:border-green-400 focus:ring-green-400/20' : 'border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:border-green-500 focus:ring-green-500/15'}`}
                      />
                    </div>

                    <div className="col-span-9">
                      <label className={`block text-[11px] font-bold uppercase tracking-widest mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        <i className="fas fa-id-card text-green-500 mr-1.5"></i>Index Card Image
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className={`flex-1 px-4 py-2.5 rounded-xl border-2 text-sm font-medium placeholder:font-normal focus:outline-none focus:ring-2 transition-all ${isDark ? 'border-slate-600 bg-slate-700/80 text-slate-100 placeholder:text-slate-500 focus:border-green-400 focus:ring-green-400/20' : 'border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:border-green-500 focus:ring-green-500/15'}`}
                        />
                        {imagePreview && isValidImagePath(imagePreview) && !imageLoadError ? (
                          <motion.img
                            src={getImageUrl(imagePreview)}
                            alt="Index Card"
                            className={`h-9 w-auto rounded-lg border-2 object-contain cursor-pointer shadow ${isDark ? 'border-slate-600' : 'border-slate-200'}`}
                            onClick={() => setShowFullscreenImage(true)}
                            whileHover={{ scale: 1.05 }}
                            title="Click to view fullscreen"
                            onError={() => setImageLoadError(true)}
                          />
                        ) : imagePreview && (!isValidImagePath(imagePreview) || imageLoadError) ? (
                          <span className={`text-xs px-2 py-1 rounded-lg border ${isDark ? 'bg-slate-600 border-slate-500 text-slate-400' : 'bg-slate-100 border-slate-300 text-slate-500'}`}>
                            <i className="fas fa-image mr-1"></i>No preview
                          </span>
                        ) : null}
                      </div>
                    </div>

                  </div>
                </div>

                {/* Modal Footer */}
                <div className={`px-8 py-4 border-t flex gap-3 ${
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
