import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { ThemeContext } from '../../App';
import config from '../../config';

// Custom Tooltip Component for Notes
const NotesTooltip: React.FC<{ 
  children: React.ReactNode; 
  content: string; 
  isDark: boolean 
}> = ({ children, content, isDark }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (content && content !== '-') {
      const rect = e.currentTarget.getBoundingClientRect();
      setPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 8
      });
      setIsVisible(true);
    }
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  return (
    <>
      <div 
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative cursor-help"
      >
        {children}
      </div>
      
      {isVisible && (
        <div
          className={`fixed z-50 px-3 py-2 text-sm rounded-lg shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full max-w-xs ${
            isDark 
              ? 'bg-slate-800 text-slate-200 border border-slate-600' 
              : 'bg-gray-900 text-white'
          }`}
          style={{ 
            left: `${position.x}px`, 
            top: `${position.y}px`,
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div className="break-words whitespace-pre-wrap">
            {content}
          </div>
          {/* Tooltip Arrow */}
          <div 
            className={`absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 ${
              isDark ? 'bg-slate-800 border-r border-b border-slate-600' : 'bg-gray-900'
            }`}
            style={{ 
              clipPath: 'polygon(0 0, 100% 100%, 0 100%)',
              transform: 'translateX(-50%) rotate(45deg)'
            }}
          />
        </div>
      )}
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-100%) scale(0.95); }
          to { opacity: 1; transform: translateX(-50%) translateY(-100%) scale(1); }
        }
      `}</style>
    </>
  );
};

interface ArchivedClearance {
  id: number;
  or_number: string;
  format_type: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  age: number;
  civil_status: string;
  address: string;
  has_criminal_record: boolean;
  purpose: string;
  date_issued: string;
  validity_expiry: string;
  issued_by_name: string;
  status: string;
  notes: string;
  created_at: string;
  deleted_at: string;
  deleted_by_name: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const FORMAT_LABELS: { [key: string]: string } = {
  'A': 'Individual - No CR',
  'B': 'Individual - Has CR', 
  'C': 'Family - No CR',
  'D': 'Family - Has CR',
  'E': 'Local Employment',
  'F': 'Bail Bond Application'
};

const ArchivedClearances: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const themeContext = useContext(ThemeContext);
  const isDark = themeContext?.isDark ?? false;
  
  const [archivedClearances, setArchivedClearances] = useState<ArchivedClearance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [formatFilter, setFormatFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedClearance, setSelectedClearance] = useState<ArchivedClearance | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [actionType, setActionType] = useState<'delete' | 'restore' | ''>('');


  const fetchArchivedClearances = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: searchQuery,
      });

      if (formatFilter) params.append('format_type', formatFilter);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);

      const response = await axios.get(`${config.api.baseURL}/api/clearances/archived?${params}`);
      const { clearances, pagination: paginationData } = response.data;
      
      setArchivedClearances(clearances);
      setPagination(paginationData);
    } catch (error) {
      console.error('Error fetching archived clearances:', error);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, searchQuery, formatFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchArchivedClearances();
  }, [fetchArchivedClearances]);

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setFormatFilter('');
    setDateFrom('');
    setDateTo('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePermanentlyDelete = async () => {
    if (!selectedClearance) return;
    
    setIsDeleting(true);
    try {
      await axios.delete(`${config.api.baseURL}/api/clearances/${selectedClearance.id}/permanent`, {
        data: {
          deleted_by_user_id: user?.id,
          deleted_by_name: user?.name,
        }
      });
      setShowDeleteModal(false);
      setSelectedClearance(null);
      setActionType('delete');
      setSuccessMessage(`Clearance ${selectedClearance.or_number} deleted successfully!`);
      
      // Auto-dismiss success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      
      fetchArchivedClearances();
    } catch (error) {
      console.error('Error permanently deleting clearance:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRestore = async () => {
    if (!selectedClearance) return;
    
    setIsRestoring(true);
    try {
      await axios.patch(`${config.api.baseURL}/api/clearances/${selectedClearance.id}/restore`, {
        restored_by_user_id: user?.id,
        restored_by_name: user?.name,
      });
      setShowRestoreModal(false);
      setSelectedClearance(null);
      setActionType('restore');
      setSuccessMessage(`Clearance ${selectedClearance.or_number} restored successfully!`);
      
      // Auto-dismiss success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      
      fetchArchivedClearances();
    } catch (error) {
      console.error('Error restoring clearance:', error);
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-3xl font-bold ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Archived Clearances
              </h1>
              <p className={`mt-2 ${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`}>
                View and permanently delete archived clearance records
              </p>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/clearances')}
              className="px-4 py-2 rounded-lg font-semibold text-sm bg-gray-500 text-white hover:bg-gray-600 transition-colors"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Back to Clearances
            </motion.button>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl p-6 mb-8 ${
            isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
          } shadow-lg`}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <input
              type="text"
              placeholder="Search by name or O.R. number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />

            <select
              value={formatFilter}
              onChange={(e) => setFormatFilter(e.target.value)}
              className={`px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="">All Formats</option>
              <option value="A">Individual - No CR</option>
              <option value="B">Individual - Has CR</option>
              <option value="C">Family - No CR</option>
              <option value="D">Family - Has CR</option>
              <option value="E">Local Employment</option>
              <option value="F">Bail Bond Application</option>
            </select>

            <input
              type="date"
              placeholder="Date From"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className={`px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />

            <input
              type="date"
              placeholder="Date To"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className={`px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSearch}
              className="px-6 py-2 rounded-lg font-semibold text-sm text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:shadow-lg transition-all"
            >
              <i className="fas fa-search mr-2"></i>
              Search
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleClearFilters}
              className="px-4 py-2 rounded-lg font-semibold text-sm bg-gray-500 text-white hover:bg-gray-600 transition-colors"
            >
              <i className="fas fa-times mr-2"></i>
              Clear Filters
            </motion.button>
          </div>
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl overflow-hidden ${
            isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
          } shadow-lg`}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`${
                isDark ? 'bg-gray-700/50' : 'bg-gray-50'
              }`}>
                <tr>
                  <th className={`text-left py-3 px-2 text-sm font-bold uppercase tracking-wide w-[12%] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    O.R. Number
                  </th>
                  <th className={`text-left py-3 px-2 text-sm font-bold uppercase tracking-wide w-[18%] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Applicant Name
                  </th>
                  <th className={`text-left py-3 px-2 text-sm font-bold uppercase tracking-wide w-[6%] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Age
                  </th>
                  <th className={`text-left py-3 px-2 text-sm font-bold uppercase tracking-wide w-[13%] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Format
                  </th>
                  <th className={`text-left py-3 px-2 text-sm font-bold uppercase tracking-wide w-[15%] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Notes
                  </th>
                  <th className={`text-left py-3 px-2 text-sm font-bold uppercase tracking-wide w-[10%] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Deleted By
                  </th>
                  <th className={`text-left py-3 px-2 text-sm font-bold uppercase tracking-wide w-[8%] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Deleted Date
                  </th>
                  <th className={`text-center py-3 px-2 text-sm font-bold uppercase tracking-wide w-[8%] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>Loading archived clearances...</p>
                      </div>
                    </td>
                  </tr>
                ) : archivedClearances.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <i className={`fas fa-archive text-4xl ${isDark ? 'text-gray-600' : 'text-gray-400'}`}></i>
                        <p className={`text-lg font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          No archived clearances found
                        </p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          Deleted clearances will appear here
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  archivedClearances.map((clearance) => (
                    <motion.tr
                      key={clearance.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`border-t transition-colors ${
                        isDark 
                          ? 'border-gray-700 hover:bg-gray-700/50' 
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <td className={`py-3 px-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        <span className="font-mono text-blue-600 dark:text-blue-400">
                          {clearance.or_number}
                        </span>
                      </td>
                      <td className={`py-3 px-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        <span className="font-semibold">
                          {clearance.first_name} {clearance.middle_name ? clearance.middle_name + ' ' : ''}{clearance.last_name}
                        </span>
                      </td>
                      <td className={`py-3 px-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        {clearance.age}
                      </td>
                      <td className="py-3 px-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                          clearance.format_type === 'A' || clearance.format_type === 'C'
                            ? isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
                            : isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {FORMAT_LABELS[clearance.format_type]}
                        </span>
                      </td>
                      <td className={`py-3 px-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        <NotesTooltip content={clearance.notes || ''} isDark={isDark}>
                          <div className="truncate max-w-[150px]">
                            {clearance.notes || '-'}
                          </div>
                        </NotesTooltip>
                      </td>
                      <td className={`py-3 px-2 text-sm truncate ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        {clearance.deleted_by_name}
                      </td>
                      <td className={`py-3 px-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        {new Date(clearance.deleted_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                              setSelectedClearance(clearance);
                              setShowRestoreModal(true);
                            }}
                            className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/20 transition-colors"
                            title="Restore"
                          >
                            <i className="fas fa-undo text-sm"></i>
                          </motion.button>
                          
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                              setSelectedClearance(clearance);
                              setShowDeleteModal(true);
                            }}
                            className="p-2 rounded-lg text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                            title="Permanently Delete"
                          >
                            <i className="fas fa-trash text-sm"></i>
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!isLoading && archivedClearances.length > 0 && (
            <div className={`px-6 py-4 border-t flex items-center justify-between ${
              isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
            }`}>
              <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} archived clearances
              </div>
              
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    pagination.page === 1
                      ? isDark ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  <i className="fas fa-chevron-left mr-1"></i>
                  Previous
                </motion.button>

                <span className={`px-3 py-1 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Page {pagination.page} of {pagination.totalPages}
                </span>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                  disabled={pagination.page >= pagination.totalPages}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    pagination.page >= pagination.totalPages
                      ? isDark ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  Next
                  <i className="fas fa-chevron-right ml-1"></i>
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Restore Modal */}
        <AnimatePresence>
          {showRestoreModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowRestoreModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className={`max-w-md w-full rounded-xl p-6 ${
                  isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                } shadow-2xl`}
              >
                <div className="text-center">
                  <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4 ${
                    isDark ? 'bg-emerald-900/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'
                  }`}>
                    <i className="fas fa-undo text-lg"></i>
                  </div>
                  
                  <h3 className={`text-lg font-semibold mb-2 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    Restore Clearance
                  </h3>
                  
                  <p className={`text-sm mb-6 ${
                    isDark ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Are you sure you want to restore this clearance? This will move it back to the active clearances list.
                    <br /><br />
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      O.R. #{selectedClearance?.or_number}
                    </span>
                  </p>

                  <div className="flex gap-3 justify-center">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowRestoreModal(false)}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                        isDark 
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Cancel
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleRestore}
                      disabled={isRestoring}
                      className="px-4 py-2 rounded-lg font-medium text-sm text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isRestoring ? (
                        <>
                          <i className="fas fa-spinner fa-spin mr-2"></i>
                          Restoring...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-undo mr-2"></i>
                          Restore
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Permanent Delete Modal */}
        <AnimatePresence>
          {showDeleteModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowDeleteModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className={`max-w-md w-full rounded-xl p-6 ${
                  isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                } shadow-2xl`}
              >
                <div className="text-center">
                  <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4 ${
                    isDark ? 'bg-red-900/20 text-red-400' : 'bg-red-100 text-red-600'
                  }`}>
                    <i className="fas fa-trash text-lg"></i>
                  </div>
                  
                  <h3 className={`text-lg font-semibold mb-2 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    Permanently Delete Clearance
                  </h3>
                  
                  <p className={`text-sm mb-6 ${
                    isDark ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Are you sure you want to permanently delete this clearance? This action cannot be undone and the record will be removed from the database.
                    <br /><br />
                    <span className="font-semibold text-red-600 dark:text-red-400">
                      O.R. #{selectedClearance?.or_number}
                    </span>
                  </p>

                  <div className="flex gap-3 justify-center">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowDeleteModal(false)}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                        isDark 
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Cancel
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handlePermanentlyDelete}
                      disabled={isDeleting}
                      className="px-4 py-2 rounded-lg font-medium text-sm text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isDeleting ? (
                        <>
                          <i className="fas fa-spinner fa-spin mr-2"></i>
                          Deleting...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-trash mr-2"></i>
                          Permanently Delete
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Toast Notification */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -50, scale: 0.9 }}
              className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[9999]"
            >
              <div className={`rounded-2xl shadow-2xl p-4 flex items-center gap-3 backdrop-blur-sm border-2 min-w-[320px] max-w-[90vw] mx-4 ${
                actionType === 'restore'
                  ? isDark ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-300' : 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-300 text-emerald-800'
                  : isDark ? 'bg-gradient-to-r from-red-500/20 to-rose-500/20 border-red-500/30 text-red-300' : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-300 text-red-800'
              }`}>
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  actionType === 'restore'
                    ? isDark ? 'bg-emerald-500/30 text-emerald-400' : 'bg-emerald-200 text-emerald-600'
                    : isDark ? 'bg-red-500/30 text-red-400' : 'bg-red-200 text-red-600'
                }`}>
                  <i className={`fas ${actionType === 'restore' ? 'fa-check-circle' : 'fa-trash-alt'} text-xl`}></i>
                </div>
                <div className="flex-1">
                  <p className={`font-bold text-base mb-1 ${
                    actionType === 'restore'
                      ? isDark ? 'text-emerald-300' : 'text-emerald-800'
                      : isDark ? 'text-red-300' : 'text-red-800'
                  }`}>
                    {actionType === 'restore' ? 'Restored Successfully!' : 'Deleted Successfully!'}
                  </p>
                  <p className={`text-sm ${
                    actionType === 'restore'
                      ? isDark ? 'text-emerald-200/80' : 'text-emerald-700/80'
                      : isDark ? 'text-red-200/80' : 'text-red-700/80'
                  }`}>
                    {successMessage}
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSuccessMessage('')}
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    actionType === 'restore'
                      ? isDark ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400' : 'bg-emerald-200 hover:bg-emerald-300 text-emerald-600'
                      : isDark ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400' : 'bg-red-200 hover:bg-red-300 text-red-600'
                  }`}
                >
                  <i className="fas fa-times text-sm"></i>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ArchivedClearances;