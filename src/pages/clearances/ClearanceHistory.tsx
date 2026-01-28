import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { ThemeContext } from '../../App';
import config from '../../config';

interface Clearance {
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
  created_at: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Issuer {
  issued_by_user_id: number;
  issued_by_name: string;
}

const FORMAT_LABELS: Record<string, string> = {
  A: 'Individual - No CR',
  B: 'Individual - Has CR',
  C: 'Family - No CR',
  D: 'Family - Has CR',
};

const ClearanceHistory: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const themeContext = useContext(ThemeContext);
  const isDark = themeContext?.isDark ?? false;

  const [clearances, setClearances] = useState<Clearance[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [issuers, setIssuers] = useState<Issuer[]>([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [formatFilter, setFormatFilter] = useState('');
  const [criminalRecordFilter, setCriminalRecordFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [issuedByFilter, setIssuedByFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedClearance, setSelectedClearance] = useState<Clearance | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    thisMonth: 0,
    noCriminalRecord: 0,
    hasCriminalRecord: 0,
  });

  const fetchClearances = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (searchQuery) params.append('search', searchQuery);
      if (formatFilter) params.append('format_type', formatFilter);
      if (criminalRecordFilter) params.append('has_criminal_record', criminalRecordFilter);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      if (issuedByFilter) params.append('issued_by', issuedByFilter);
      if (statusFilter) params.append('status', statusFilter);

      const response = await axios.get(`${config.api.baseURL}/api/clearances?${params.toString()}`);
      setClearances(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching clearances:', error);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, searchQuery, formatFilter, criminalRecordFilter, dateFrom, dateTo, issuedByFilter, statusFilter]);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${config.api.baseURL}/api/clearances/stats/overview`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchIssuers = async () => {
    try {
      const response = await axios.get(`${config.api.baseURL}/api/clearances/issuers`);
      setIssuers(response.data);
    } catch (error) {
      console.error('Error fetching issuers:', error);
    }
  };

  useEffect(() => {
    fetchClearances();
  }, [fetchClearances]);

  useEffect(() => {
    fetchStats();
    fetchIssuers();
  }, []);

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchClearances();
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setFormatFilter('');
    setCriminalRecordFilter('');
    setDateFrom('');
    setDateTo('');
    setIssuedByFilter('');
    setStatusFilter('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleDelete = async () => {
    if (!selectedClearance) return;
    
    setIsDeleting(true);
    try {
      await axios.delete(`${config.api.baseURL}/api/clearances/${selectedClearance.id}`, {
        data: {
          deleted_by_user_id: user?.id,
          deleted_by_name: user?.name,
        }
      });
      setShowDeleteModal(false);
      setSelectedClearance(null);
      fetchClearances();
      fetchStats();
    } catch (error) {
      console.error('Error deleting clearance:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      if (formatFilter) params.append('format_type', formatFilter);
      if (criminalRecordFilter) params.append('has_criminal_record', criminalRecordFilter);

      const response = await axios.get(`${config.api.baseURL}/api/clearances/export/excel?${params.toString()}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `clearances_export_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting to Excel:', error);
    }
  };

  const handleDownloadPDF = async (clearance: Clearance) => {
    navigate(`/clearances/generate?edit=${clearance.id}`);
  };

  const inputClasses = `w-full px-3 py-2 rounded-lg border outline-none transition-all text-sm ${
    isDark 
      ? 'bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500' 
      : 'bg-white border-slate-200 placeholder-slate-400 focus:border-blue-500'
  }`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-4"
      >
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
            <i className="fas fa-certificate mr-3 text-blue-500"></i>
            Issue Clearance
          </h1>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Manage and generate Certificate of Clearance documents
          </p>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/clearances/generate')}
          className="px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30 hover:shadow-xl transition-all"
        >
          <i className="fas fa-plus mr-2"></i>
          Generate New Clearance
        </motion.button>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <div className={`rounded-xl p-4 ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200 shadow-md'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
              <i className={`fas fa-certificate ${isDark ? 'text-blue-400' : 'text-blue-600'}`}></i>
            </div>
            <div>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{stats.total}</p>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Issued</p>
            </div>
          </div>
        </div>

        <div className={`rounded-xl p-4 ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200 shadow-md'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-violet-500/20' : 'bg-violet-100'}`}>
              <i className={`fas fa-calendar ${isDark ? 'text-violet-400' : 'text-violet-600'}`}></i>
            </div>
            <div>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{stats.thisMonth}</p>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>This Month</p>
            </div>
          </div>
        </div>

        <div className={`rounded-xl p-4 ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200 shadow-md'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
              <i className={`fas fa-check-circle ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}></i>
            </div>
            <div>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{stats.noCriminalRecord}</p>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>No Criminal Record</p>
            </div>
          </div>
        </div>

        <div className={`rounded-xl p-4 ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200 shadow-md'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-red-500/20' : 'bg-red-100'}`}>
              <i className={`fas fa-exclamation-triangle ${isDark ? 'text-red-400' : 'text-red-600'}`}></i>
            </div>
            <div>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{stats.hasCriminalRecord}</p>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>With Criminal Record</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`rounded-2xl p-4 ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200 shadow-lg'}`}
      >
        <div className="flex items-center gap-2 mb-4">
          <i className={`fas fa-filter ${isDark ? 'text-slate-400' : 'text-slate-500'}`}></i>
          <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>Search & Filters</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <div className="col-span-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className={inputClasses}
              placeholder="Search by name or O.R. number..."
            />
          </div>

          <select
            value={formatFilter}
            onChange={(e) => setFormatFilter(e.target.value)}
            className={inputClasses}
          >
            <option value="">All Formats</option>
            <option value="A">Format A - Individual No CR</option>
            <option value="B">Format B - Individual Has CR</option>
            <option value="C">Format C - Family No CR</option>
            <option value="D">Format D - Family Has CR</option>
          </select>

          <select
            value={criminalRecordFilter}
            onChange={(e) => setCriminalRecordFilter(e.target.value)}
            className={inputClasses}
          >
            <option value="">Criminal Record</option>
            <option value="false">No Criminal Record</option>
            <option value="true">Has Criminal Record</option>
          </select>

          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className={inputClasses}
            placeholder="From date"
          />

          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className={inputClasses}
            placeholder="To date"
          />

          <select
            value={issuedByFilter}
            onChange={(e) => setIssuedByFilter(e.target.value)}
            className={inputClasses}
          >
            <option value="">All Issuers</option>
            {issuers.map((issuer) => (
              <option key={issuer.issued_by_user_id} value={issuer.issued_by_user_id}>
                {issuer.issued_by_name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 mt-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSearch}
            className="px-4 py-2 rounded-lg font-semibold text-sm text-white bg-blue-500 hover:bg-blue-600 transition-colors"
          >
            <i className="fas fa-search mr-2"></i>
            Search
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleClearFilters}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
              isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <i className="fas fa-times mr-2"></i>
            Clear Filters
          </motion.button>

          <div className="flex-1"></div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExportExcel}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
              isDark ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-emerald-500 text-white hover:bg-emerald-600'
            }`}
          >
            <i className="fas fa-file-excel mr-2"></i>
            Export to Excel
          </motion.button>
        </div>
      </motion.div>

      {/* Results Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={`rounded-2xl overflow-hidden ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200 shadow-lg'}`}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={isDark ? 'bg-slate-700/50' : 'bg-slate-50'}>
                <th className={`text-left py-4 px-4 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  O.R. Number
                </th>
                <th className={`text-left py-4 px-4 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Applicant Name
                </th>
                <th className={`text-left py-4 px-4 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Age
                </th>
                <th className={`text-left py-4 px-4 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Format
                </th>
                <th className={`text-left py-4 px-4 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Criminal Record
                </th>
                <th className={`text-left py-4 px-4 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Purpose
                </th>
                <th className={`text-left py-4 px-4 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Issued By
                </th>
                <th className={`text-left py-4 px-4 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Date Issued
                </th>
                <th className={`text-left py-4 px-4 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Status
                </th>
                <th className={`text-left py-4 px-4 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className={`animate-pulse ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
                    <td className="py-4 px-4" colSpan={10}>
                      <div className={`h-10 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
                    </td>
                  </tr>
                ))
              ) : clearances.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center">
                    <div className={`flex flex-col items-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      <i className="fas fa-inbox text-4xl mb-4 opacity-30"></i>
                      <p className="font-semibold">No clearances found</p>
                      <p className="text-sm mt-1">Try adjusting your filters or generate a new clearance</p>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/clearances/generate')}
                        className="mt-4 px-4 py-2 rounded-lg text-white bg-blue-500 hover:bg-blue-600 transition-colors"
                      >
                        <i className="fas fa-plus mr-2"></i>
                        Generate First Clearance
                      </motion.button>
                    </div>
                  </td>
                </tr>
              ) : (
                clearances.map((clearance, index) => (
                  <motion.tr
                    key={clearance.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={`border-b transition-colors ${
                      isDark ? 'border-slate-700 hover:bg-slate-700/30' : 'border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3 px-4">
                      <span className={`font-mono text-sm font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                        {clearance.or_number}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                        {clearance.first_name} {clearance.middle_name ? `${clearance.middle_name.charAt(0)}.` : ''} {clearance.last_name}
                      </span>
                    </td>
                    <td className={`py-3 px-4 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      {clearance.age}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                        clearance.format_type === 'A' || clearance.format_type === 'C'
                          ? isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
                          : isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {FORMAT_LABELS[clearance.format_type]}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                        clearance.has_criminal_record
                          ? isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-700'
                          : isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {clearance.has_criminal_record ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className={`py-3 px-4 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      {clearance.purpose.length > 20 ? `${clearance.purpose.substring(0, 20)}...` : clearance.purpose}
                    </td>
                    <td className={`py-3 px-4 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      {clearance.issued_by_name}
                    </td>
                    <td className={`py-3 px-4 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      {new Date(clearance.date_issued).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                        clearance.status === 'Valid'
                          ? isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
                          : clearance.status === 'Expired'
                            ? isDark ? 'bg-slate-500/20 text-slate-300' : 'bg-slate-100 text-slate-700'
                            : isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-700'
                      }`}>
                        {clearance.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            setSelectedClearance(clearance);
                            setShowDetailModal(true);
                          }}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                            isDark ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                          }`}
                          title="View Details"
                        >
                          <i className="fas fa-eye text-sm"></i>
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDownloadPDF(clearance)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                            isDark ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                          }`}
                          title="Download PDF"
                        >
                          <i className="fas fa-download text-sm"></i>
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => navigate(`/clearances/generate?edit=${clearance.id}`)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                            isDark ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                          }`}
                          title="Edit"
                        >
                          <i className="fas fa-edit text-sm"></i>
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            setSelectedClearance(clearance);
                            setShowDeleteModal(true);
                          }}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                            isDark ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-red-50 text-red-600 hover:bg-red-100'
                          }`}
                          title="Delete"
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
        {pagination.totalPages > 1 && (
          <div className={`px-6 py-4 border-t flex items-center justify-between ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
            </p>

            <div className="flex items-center gap-2">
              <select
                value={pagination.limit}
                onChange={(e) => setPagination(prev => ({ ...prev, limit: parseInt(e.target.value), page: 1 }))}
                className={`px-3 py-2 rounded-lg text-sm ${
                  isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200 text-slate-700'
                } border`}
              >
                <option value="10">10 / page</option>
                <option value="25">25 / page</option>
                <option value="50">50 / page</option>
              </select>

              <div className="flex items-center gap-1">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <i className="fas fa-chevron-left text-sm"></i>
                </motion.button>

                <span className={`px-4 py-2 text-sm font-medium ${isDark ? 'text-white' : 'text-slate-700'}`}>
                  Page {pagination.page} of {pagination.totalPages}
                </span>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.totalPages}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <i className="fas fa-chevron-right text-sm"></i>
                </motion.button>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedClearance && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto ${isDark ? 'bg-slate-800' : 'bg-white'}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`px-6 py-4 border-b sticky top-0 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
                <div className="flex items-center justify-between">
                  <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    Clearance Details
                  </h3>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
                    }`}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className={`text-xs font-semibold uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>O.R. Number</p>
                    <p className={`font-mono font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{selectedClearance.or_number}</p>
                  </div>
                  <div>
                    <p className={`text-xs font-semibold uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Format Type</p>
                    <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>{FORMAT_LABELS[selectedClearance.format_type]}</p>
                  </div>
                  <div className="col-span-2">
                    <p className={`text-xs font-semibold uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Applicant Name</p>
                    <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                      {selectedClearance.first_name} {selectedClearance.middle_name} {selectedClearance.last_name}
                    </p>
                  </div>
                  <div>
                    <p className={`text-xs font-semibold uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Age</p>
                    <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>{selectedClearance.age} years old</p>
                  </div>
                  <div>
                    <p className={`text-xs font-semibold uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Civil Status</p>
                    <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>{selectedClearance.civil_status}</p>
                  </div>
                  <div className="col-span-2">
                    <p className={`text-xs font-semibold uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Address</p>
                    <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>{selectedClearance.address}</p>
                  </div>
                  <div>
                    <p className={`text-xs font-semibold uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Criminal Record</p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                      selectedClearance.has_criminal_record
                        ? isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-700'
                        : isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {selectedClearance.has_criminal_record ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div>
                    <p className={`text-xs font-semibold uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Purpose</p>
                    <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>{selectedClearance.purpose}</p>
                  </div>
                  <div>
                    <p className={`text-xs font-semibold uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Date Issued</p>
                    <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                      {new Date(selectedClearance.date_issued).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <div>
                    <p className={`text-xs font-semibold uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Valid Until</p>
                    <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                      {new Date(selectedClearance.validity_expiry).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <div>
                    <p className={`text-xs font-semibold uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Issued By</p>
                    <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>{selectedClearance.issued_by_name}</p>
                  </div>
                  <div>
                    <p className={`text-xs font-semibold uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Status</p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                      selectedClearance.status === 'Valid'
                        ? isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
                        : isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-700'
                    }`}>
                      {selectedClearance.status}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowDetailModal(false);
                      navigate(`/clearances/generate?edit=${selectedClearance.id}`);
                    }}
                    className="flex-1 py-3 px-4 rounded-xl font-semibold text-white bg-blue-500 hover:bg-blue-600 transition-colors"
                  >
                    <i className="fas fa-edit mr-2"></i>
                    Edit / Download PDF
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowDetailModal(false)}
                    className={`py-3 px-6 rounded-xl font-semibold transition-colors ${
                      isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Close
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && selectedClearance && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`rounded-2xl p-8 w-full max-w-sm text-center ${isDark ? 'bg-slate-800' : 'bg-white'}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                isDark ? 'bg-red-500/20' : 'bg-red-100'
              }`}>
                <i className={`fas fa-trash-alt text-2xl ${isDark ? 'text-red-400' : 'text-red-500'}`}></i>
              </div>

              <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                Delete Clearance?
              </h3>
              <p className={`mb-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Are you sure you want to delete clearance <strong className={isDark ? 'text-white' : 'text-slate-800'}>{selectedClearance.or_number}</strong>? 
                This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowDeleteModal(false)}
                  className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${
                    isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 py-3 rounded-xl font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {isDeleting ? (
                    <span className="flex items-center justify-center gap-2">
                      <i className="fas fa-spinner fa-spin"></i>
                      Deleting...
                    </span>
                  ) : (
                    <span>
                      <i className="fas fa-trash mr-2"></i>
                      Delete
                    </span>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClearanceHistory;
