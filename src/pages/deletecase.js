import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Deletecase = () => {
  const { user } = useAuth();
  const [cases, setCases] = useState([]);
  const [filteredCases, setFilteredCases] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("default"); // 'default', 'complainant-asc', 'date-asc', 'date-desc'
  const [error, setError] = useState("");
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
    
    // Apply search filter
    if (searchTerm.trim() !== "") {
      filtered = filtered.filter(c => 
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
  }, [searchTerm, cases, sortOption]);

  const fetchAllCases = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("http://localhost:5000/cases");
      setCases(response.data);
      setFilteredCases(response.data);
      setError("");
    } catch (err) {
      setError("Error fetching cases.");
    }
    setIsLoading(false);
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
    setEditedCase(prev => ({ ...prev, [field]: value }));
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
    try {
      let response;
      
      // If there's an image to upload, use the image upload endpoint
      if (selectedImage) {
        const formData = new FormData();
        formData.append('id', editedCase.id);
        formData.append('indexCardImage', selectedImage);
        
        // Append all other fields
        Object.keys(editedCase).forEach(key => {
          if (key !== 'id' && key !== 'INDEX_CARDS' && editedCase[key] !== undefined) {
            formData.append(key, editedCase[key] || '');
          }
        });
        
        response = await axios.post('http://localhost:5000/update-case-with-image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        // No image, use regular update
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
            DATEFILED_IN_COURT: editedCase.DATEFILED_IN_COURT
          }
        };
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
      setError('Error updating case. Please try again.');
    }
    setIsLoading(false);
  };

  const handleDelete = async () => {
    if (!selectedCase) return;
    setIsLoading(true);
    try {
      await axios.delete("http://localhost:5000/delete-case", {
        data: { docket_no: selectedCase.DOCKET_NO }
      });
      // Remove from local state
      setCases(prev => prev.filter(c => c.id !== selectedCase.id));
      setShowConfirm(false);
      setSelectedCase(null);
    } catch (err) {
      setError("Error deleting case. Please try again.");
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50/20 to-slate-100 
                    py-8 px-4 relative overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-72 h-72 bg-red-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-slate-500/5 rounded-full blur-3xl"></div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-3">
            Manage Cases
          </h1>
          <p className="text-slate-500">{user?.role === 'Admin' ? 'View, modify, and delete cases from the system' : 'View and Modify Cases from System'}</p>
        </div>

        {/* Back Button & Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 items-center justify-between">
          <motion.button whileHover={{ x: -5 }} whileTap={{ scale: 0.95 }} onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all duration-300 shadow-sm cursor-pointer">
            <i className="fas fa-arrow-left"></i>
            <span className="font-medium">Back to Menu</span>
          </motion.button>

          {/* Search Bar */}
          <div className="relative w-full md:w-96">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input 
              type="text" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by docket, name, or offense..."
              className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200 bg-white
                        focus:border-red-500 focus:ring-4 focus:ring-red-500/20
                        transition-all duration-300 outline-none text-slate-700"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="relative w-full md:w-64">
            <i className="fas fa-sort-amount-down absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200 bg-white
                        focus:border-red-500 focus:ring-4 focus:ring-red-500/20
                        transition-all duration-300 outline-none text-slate-700 cursor-pointer"
            >
              <option value="default">Default Order</option>
              <option value="complainant-asc">Complainant (A-Z)</option>
              <option value="date-asc">Date Filed (Oldest First)</option>
              <option value="date-desc">Date Filed (Newest First)</option>
            </select>
          </div>

          {/* Refresh Button */}
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={fetchAllCases}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700 text-white hover:bg-slate-800 transition-all duration-300 shadow-sm cursor-pointer">
            <i className={`fas fa-sync-alt ${isLoading ? 'animate-spin' : ''}`}></i>
            <span className="font-medium">Refresh</span>
          </motion.button>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3 mb-6">
            <i className="fas fa-exclamation-circle"></i><span>{error}</span>
          </motion.div>
        )}

        {/* Cases Count */}
        <div className="mb-4 text-slate-600">
          <span className="font-semibold">{filteredCases.length}</span> case{filteredCases.length !== 1 ? 's' : ''} found
        </div>

        {/* Cases Table */}
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          
          {isLoading && cases.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 border-4 border-slate-200 border-t-red-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-500">Loading cases...</p>
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="p-12 text-center">
              <i className="fas fa-folder-open text-6xl text-slate-300 mb-4"></i>
              <p className="text-slate-500">No cases found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-700 to-slate-800 text-white">
                    <th className="px-4 py-4 text-left font-semibold">Docket No</th>
                    <th className="px-4 py-4 text-left font-semibold">Date Filed</th>
                    <th className="px-4 py-4 text-left font-semibold">Complainant</th>
                    <th className="px-4 py-4 text-left font-semibold">Respondent</th>
                    <th className="px-4 py-4 text-left font-semibold">Offense</th>
                    <th className="px-4 py-4 text-left font-semibold">Branch</th>
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
                      className={`border-b border-slate-100 hover:bg-red-50/50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                    >
                      <td className="px-4 py-4">
                        <span className="font-mono font-semibold text-slate-800">{caseItem.DOCKET_NO || 'N/A'}</span>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{formatDate(caseItem.DATE_FILED)}</td>
                      <td className="px-4 py-4 text-slate-700 font-medium">{caseItem.COMPLAINANT || 'N/A'}</td>
                      <td className="px-4 py-4 text-slate-700">{caseItem.RESPONDENT || 'N/A'}</td>
                      <td className="px-4 py-4">
                        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-sm">
                          {caseItem.OFFENSE || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{caseItem.BRANCH || 'N/A'}</td>
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
                className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden" 
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-blue-500 to-blue-600">
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
                  <p className="text-blue-100 mt-1">Docket No: {selectedCase.DOCKET_NO}</p>
                </div>

                {/* Modal Content */}
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { label: "Docket Number", value: selectedCase.DOCKET_NO, icon: "fa-hashtag" },
                      { label: "Date Filed", value: formatDate(selectedCase.DATE_FILED), icon: "fa-calendar" },
                      { label: "Complainant", value: selectedCase.COMPLAINANT, icon: "fa-user" },
                      { label: "Respondent", value: selectedCase.RESPONDENT, icon: "fa-user-tie" },
                      { label: "Offense", value: selectedCase.OFFENSE, icon: "fa-gavel" },
                      { label: "Date Resolved", value: formatDate(selectedCase.DATE_RESOLVED), icon: "fa-calendar-check" },
                      { label: "Resolving Prosecutor", value: selectedCase.RESOLVING_PROSECUTOR, icon: "fa-user-shield" },
                      { label: "Criminal Case No", value: selectedCase.CRIM_CASE_NO, icon: "fa-file-contract" },
                      { label: "Branch", value: selectedCase.BRANCH, icon: "fa-building" },
                      { label: "Date Filed in Court", value: formatDate(selectedCase.DATEFILED_IN_COURT), icon: "fa-landmark" },
                      { label: "Remarks", value: selectedCase.REMARKS, icon: "fa-comment" },
                      { label: "Remarks Decision", value: selectedCase.REMARKS_DECISION, icon: "fa-balance-scale" },
                      { label: "Penalty", value: selectedCase.PENALTY, icon: "fa-exclamation-triangle" },
                    ].map((item, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                        <p className="text-xs text-slate-500 uppercase flex items-center gap-2 mb-1">
                          <i className={`fas ${item.icon} text-blue-500`}></i>
                          {item.label}
                        </p>
                        <p className="font-medium text-slate-800">{item.value || "N/A"}</p>
                      </div>
                    ))}
                  </div>

                  {/* Index Cards */}
                  {selectedCase.INDEX_CARDS && selectedCase.INDEX_CARDS !== 'N/A' && (
                    <div className="mt-4 p-4 rounded-xl bg-slate-50">
                      <p className="text-xs text-slate-500 uppercase flex items-center gap-2 mb-2">
                        <i className="fas fa-id-card text-blue-500"></i>
                        Index Cards
                      </p>
                      <p className="font-medium text-slate-800 break-all text-sm">{selectedCase.INDEX_CARDS}</p>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="p-6 border-t border-slate-200 bg-slate-50 flex gap-4">
                  <button 
                    onClick={() => setShowViewModal(false)}
                    className="flex-1 py-3 rounded-xl font-semibold bg-slate-200 text-slate-700 
                             hover:bg-slate-300 transition-colors border-none cursor-pointer"
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
                className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden" 
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-green-500 to-green-600">
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
                  <p className="text-green-100 mt-1">Docket No: {editedCase.DOCKET_NO}</p>
                </div>

                {/* Modal Content */}
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        <i className="fas fa-calendar text-green-500 mr-2"></i>Date Filed
                      </label>
                      <input
                        type="date"
                        value={editedCase.DATE_FILED?.split('T')[0] || ''}
                        onChange={(e) => handleFieldChange('DATE_FILED', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        <i className="fas fa-user text-green-500 mr-2"></i>Complainant
                      </label>
                      <input
                        type="text"
                        value={editedCase.COMPLAINANT || ''}
                        onChange={(e) => handleFieldChange('COMPLAINANT', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        <i className="fas fa-user-shield text-green-500 mr-2"></i>Respondent
                      </label>
                      <input
                        type="text"
                        value={editedCase.RESPONDENT || ''}
                        onChange={(e) => handleFieldChange('RESPONDENT', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        <i className="fas fa-map-marker-alt text-green-500 mr-2"></i>Address of Respondent
                      </label>
                      <input
                        type="text"
                        value={editedCase.ADDRESS_OF_RESPONDENT || ''}
                        onChange={(e) => handleFieldChange('ADDRESS_OF_RESPONDENT', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        <i className="fas fa-exclamation-triangle text-green-500 mr-2"></i>Offense
                      </label>
                      <input
                        type="text"
                        value={editedCase.OFFENSE || ''}
                        onChange={(e) => handleFieldChange('OFFENSE', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        <i className="fas fa-calendar-day text-green-500 mr-2"></i>Date of Commission
                      </label>
                      <input
                        type="date"
                        value={editedCase.DATE_OF_COMMISSION?.split('T')[0] || ''}
                        onChange={(e) => handleFieldChange('DATE_OF_COMMISSION', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        <i className="fas fa-calendar-check text-green-500 mr-2"></i>Date Resolved
                      </label>
                      <input
                        type="date"
                        value={editedCase.DATE_RESOLVED?.split('T')[0] || ''}
                        onChange={(e) => handleFieldChange('DATE_RESOLVED', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        <i className="fas fa-user-tie text-green-500 mr-2"></i>Resolving Prosecutor
                      </label>
                      <input
                        type="text"
                        value={editedCase.RESOLVING_PROSECUTOR || ''}
                        onChange={(e) => handleFieldChange('RESOLVING_PROSECUTOR', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        <i className="fas fa-clipboard-check text-green-500 mr-2"></i>Decision
                      </label>
                      <select
                        value={editedCase.REMARKS_DECISION || ''}
                        onChange={(e) => handleFieldChange('REMARKS_DECISION', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                      >
                        <option value="">Select decision</option>
                        <option value="pending">Pending</option>
                        <option value="terminated">Terminated</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        <i className="fas fa-balance-scale text-green-500 mr-2"></i>Penalty
                      </label>
                      <input
                        type="text"
                        value={editedCase.PENALTY || ''}
                        onChange={(e) => handleFieldChange('PENALTY', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        <i className="fas fa-file-contract text-green-500 mr-2"></i>Criminal Case No
                      </label>
                      <input
                        type="text"
                        value={editedCase.CRIM_CASE_NO || ''}
                        onChange={(e) => handleFieldChange('CRIM_CASE_NO', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        <i className="fas fa-building text-green-500 mr-2"></i>Branch
                      </label>
                      <input
                        type="text"
                        value={editedCase.BRANCH || ''}
                        onChange={(e) => handleFieldChange('BRANCH', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        <i className="fas fa-landmark text-green-500 mr-2"></i>Date Filed in Court
                      </label>
                      <input
                        type="date"
                        value={editedCase.DATEFILED_IN_COURT?.split('T')[0] || ''}
                        onChange={(e) => handleFieldChange('DATEFILED_IN_COURT', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        <i className="fas fa-id-card text-green-500 mr-2"></i>Index Card Image
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                      />
                      {imagePreview && (
                        <div className="mt-3">
                          <p className="text-xs text-slate-500 mb-2">Click image to view fullscreen</p>
                          <img 
                            src={imagePreview.startsWith('data:') ? imagePreview : `http://localhost:5000${imagePreview.startsWith('/') ? imagePreview : '/' + imagePreview}`}
                            alt="Index Card Preview" 
                            className="max-w-full h-auto rounded-xl border-2 border-slate-200 max-h-64 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => setShowFullscreenImage(true)}
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
                <div className="p-6 border-t border-slate-200 bg-slate-50 flex gap-4">
                  <button 
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 py-3 rounded-xl font-semibold bg-slate-200 text-slate-700 
                             hover:bg-slate-300 transition-colors border-none cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleUpdate}
                    disabled={isLoading}
                    className="flex-1 py-3 rounded-xl font-semibold bg-green-500 text-white 
                             hover:bg-green-600 transition-colors border-none cursor-pointer
                             flex items-center justify-center gap-2 disabled:opacity-50"
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
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowConfirm(false)}
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center" 
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
                  <i className="fas fa-exclamation-triangle text-red-600 text-3xl"></i>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">Delete Case?</h3>
                <p className="text-slate-500 mb-2">You are about to delete:</p>
                <div className="bg-red-50 rounded-xl p-4 mb-6 text-left">
                  <p className="font-mono font-bold text-red-800 text-lg">{selectedCase.DOCKET_NO}</p>
                  <p className="text-slate-600 text-sm mt-1">
                    {selectedCase.COMPLAINANT} vs {selectedCase.RESPONDENT}
                  </p>
                </div>
                <p className="text-red-600 text-sm mb-6 flex items-center justify-center gap-2">
                  <i className="fas fa-info-circle"></i>
                  This action cannot be undone. The case will be removed from the database and Excel file.
                </p>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setShowConfirm(false)} 
                    className="flex-1 py-3 rounded-xl font-semibold bg-slate-100 text-slate-700 
                             hover:bg-slate-200 transition-colors border-none cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleDelete} 
                    disabled={isLoading}
                    className="flex-1 py-3 rounded-xl font-semibold bg-red-600 text-white 
                             hover:bg-red-700 transition-colors border-none cursor-pointer
                             flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-trash-alt"></i>
                        Delete
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fullscreen Image Modal - Outside all other modals */}
        {showFullscreenImage && imagePreview && (
          <div
            className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center"
            style={{ padding: '3rem' }}
            onClick={() => setShowFullscreenImage(false)}
          >
            {/* Close Button - X in top right */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowFullscreenImage(false);
              }}
              className="absolute top-6 right-6 w-12 h-12 text-white hover:text-gray-300 
                         transition-all duration-200 flex items-center justify-center cursor-pointer border-none bg-transparent z-[10001]"
              style={{ fontSize: '2rem' }}
            >
              ✕
            </button>
            
            {/* Image Container with white background */}
            <div 
              className="relative w-full h-full flex items-center justify-center bg-white rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '90vw', maxHeight: '90vh' }}
            >
              <img
                src={imagePreview.startsWith('data:') ? imagePreview : `http://localhost:5000${imagePreview.startsWith('/') ? imagePreview : '/' + imagePreview}`}
                alt="Index Card Fullscreen"
                className="w-auto h-auto"
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '100%',
                  objectFit: 'contain',
                  display: 'block'
                }}
              />
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Deletecase;

