import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { ThemeContext } from '../App';
import { API_BASE } from '../config/api';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import * as XLSX from 'xlsx';
import html2pdf from 'html2pdf.js';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

const GenerateReport = () => {
  const { user } = useAuth();
  const { isDark } = useContext(ThemeContext) || { isDark: false };
  const reportRef = useRef(null);

  // State
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('disposition');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterOffense, setFilterOffense] = useState('');
  const [filterRecommendation, setFilterRecommendation] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterProsecutor, setFilterProsecutor] = useState('');
  const [agingCategory, setAgingCategory] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [exporting, setExporting] = useState(false);

  // Fetch cases
  useEffect(() => {
    const fetchCases = async () => {
      try {
        const res = await fetch(`${API_BASE}/cases`);
        if (res.ok) {
          const data = await res.json();
          setCases(data.filter(c => !c.is_deleted));
        }
      } catch (err) {
        console.error('Failed to fetch cases:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCases();
  }, []);

  // Unique values for filters
  const uniqueOffenses = [...new Set(cases.map(c => c.OFFENSE).filter(Boolean))].sort();
  const uniqueRecommendations = [...new Set(cases.map(c => c.REMARKS_DECISION).filter(Boolean))].sort();
  const uniqueStatuses = [...new Set(cases.map(c => c.STATUS).filter(Boolean))].sort();
  const uniqueProsecutors = [...new Set(cases.map(c => c.RESOLVING_PROSECUTOR).filter(Boolean))].sort();

  // Filter logic
  const getFilteredCases = useCallback(() => {
    return cases.filter(c => {
      if (dateFrom && new Date(c.DATE_FILED) < new Date(dateFrom)) return false;
      if (dateTo && new Date(c.DATE_FILED) > new Date(dateTo)) return false;
      if (filterOffense && c.OFFENSE !== filterOffense) return false;
      if (filterRecommendation && c.REMARKS_DECISION !== filterRecommendation) return false;
      if (filterStatus && c.STATUS !== filterStatus) return false;
      if (filterProsecutor && c.RESOLVING_PROSECUTOR !== filterProsecutor) return false;
      return true;
    });
  }, [cases, dateFrom, dateTo, filterOffense, filterRecommendation, filterStatus, filterProsecutor]);

  const filteredCases = getFilteredCases();

  // Aging helpers
  const getDaysOld = (dateFiled) => {
    if (!dateFiled) return 0;
    const filed = new Date(dateFiled);
    const now = new Date();
    return Math.floor((now - filed) / (1000 * 60 * 60 * 24));
  };

  const getAgingBucket = (days) => {
    if (days <= 30) return '0-30 days';
    if (days <= 60) return '31-60 days';
    if (days <= 90) return '61-90 days';
    return '90+ days';
  };

  // ── DISPOSITION REPORT DATA ──
  const dispositionData = (() => {
    const groups = {};
    filteredCases.forEach(c => {
      const key = c.REMARKS_DECISION || 'Pending';
      groups[key] = (groups[key] || 0) + 1;
    });
    const sorted = Object.entries(groups).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    // Show top 6, group rest as "Others"
    if (sorted.length > 6) {
      const top6 = sorted.slice(0, 6);
      const others = sorted.slice(6).reduce((sum, item) => sum + item.value, 0);
      if (others > 0) top6.push({ name: 'Others', value: others });
      return top6;
    }
    return sorted;
  })();

  const statusDistribution = (() => {
    const groups = {};
    filteredCases.forEach(c => {
      const key = c.STATUS || 'No Status';
      groups[key] = (groups[key] || 0) + 1;
    });
    return Object.entries(groups).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  })();

  const offenseDistribution = (() => {
    const groups = {};
    filteredCases.forEach(c => {
      const key = c.OFFENSE || 'Unknown';
      groups[key] = (groups[key] || 0) + 1;
    });
    return Object.entries(groups).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);
  })();

  const avgResolutionDays = (() => {
    const resolved = filteredCases.filter(c => c.DATE_FILED && c.DATE_RESOLVED);
    if (resolved.length === 0) return 0;
    const total = resolved.reduce((sum, c) => {
      return sum + Math.floor((new Date(c.DATE_RESOLVED) - new Date(c.DATE_FILED)) / (1000 * 60 * 60 * 24));
    }, 0);
    return Math.round(total / resolved.length);
  })();

  // ── AGING REPORT DATA ──
  const agingCases = (() => {
    const pending = filteredCases.filter(c => {
      const dec = (c.REMARKS_DECISION || '').toLowerCase();
      return dec === '' || dec === 'pending';
    });
    return pending.map(c => ({
      ...c,
      days: getDaysOld(c.DATE_FILED),
      bucket: getAgingBucket(getDaysOld(c.DATE_FILED))
    })).sort((a, b) => b.days - a.days);
  })();

  const agingFiltered = agingCategory
    ? agingCases.filter(c => c.bucket === agingCategory)
    : agingCases;

  const agingBucketData = (() => {
    const buckets = { '0-30 days': 0, '31-60 days': 0, '61-90 days': 0, '90+ days': 0 };
    agingCases.forEach(c => { buckets[c.bucket] = (buckets[c.bucket] || 0) + 1; });
    return Object.entries(buckets).map(([name, value]) => ({ name, value }));
  })();

  // ── MONTHLY PERFORMANCE DATA ──
  const monthlyData = (() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const monthCases = cases.filter(c => {
      if (!c.DATE_FILED) return false;
      const d = new Date(c.DATE_FILED);
      return d.getFullYear() === year && (d.getMonth() + 1) === month;
    });

    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevMonthCases = cases.filter(c => {
      if (!c.DATE_FILED) return false;
      const d = new Date(c.DATE_FILED);
      return d.getFullYear() === prevYear && (d.getMonth() + 1) === prevMonth;
    });
    const newCases = monthCases.length;
    const resolved = monthCases.filter(c => c.DATE_RESOLVED).length;
    const pending = monthCases.filter(c => !c.DATE_RESOLVED && ((c.REMARKS_DECISION || '').toLowerCase() === 'pending' || !c.REMARKS_DECISION)).length;
    const convicted = monthCases.filter(c => (c.REMARKS_DECISION || '').toLowerCase() === 'convicted').length;
    const dismissed = monthCases.filter(c => (c.REMARKS_DECISION || '').toLowerCase() === 'dismissed').length;
    const filedInCourt = monthCases.filter(c => c.STATUS === 'Filed in Court').length;
    const prevNew = prevMonthCases.length;
    const changePercent = prevNew > 0 ? Math.round(((newCases - prevNew) / prevNew) * 100) : 0;

    return { newCases, resolved, pending, convicted, dismissed, filedInCourt, prevNew, changePercent, monthCases };
  })();

  // Monthly trend (last 6 months)
  const trendData = (() => {
    const data = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const yr = d.getFullYear();
      const mo = d.getMonth() + 1;
      const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      const mCases = cases.filter(c => {
        if (!c.DATE_FILED) return false;
        const cd = new Date(c.DATE_FILED);
        return cd.getFullYear() === yr && (cd.getMonth() + 1) === mo;
      });
      data.push({
        month: label,
        filed: mCases.length,
        resolved: mCases.filter(c => c.DATE_RESOLVED).length,
        pending: mCases.filter(c => !c.DATE_RESOLVED).length,
      });
    }
    return data;
  })();

  // ── EXPORT FUNCTIONS ──
  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setExporting(true);
    try {
      const element = reportRef.current;
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `OCP_Report_${activeTab}_${new Date().toISOString().slice(0, 10)}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
      };
      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = () => {
    setExporting(true);
    try {
      let data;
      if (activeTab === 'disposition') {
        data = filteredCases.map(c => ({
          'Docket No': c.DOCKET_NO,
          'Date Filed': c.DATE_FILED,
          'Complainant': c.COMPLAINANT,
          'Respondent': c.RESPONDENT,
          'Offense': c.OFFENSE,
          'Recommendation': c.REMARKS_DECISION || 'Pending',
          'New Status': c.STATUS || '',
          'Final Offense': c.FINAL_OFFENSE || '',
          'Resolving Prosecutor': c.RESOLVING_PROSECUTOR || '',
          'Date Resolved': c.DATE_RESOLVED || '',
          'Decision Date': c.DECISION_DATE || '',
          'Penalty': c.PENALTY || '',
        }));
      } else if (activeTab === 'aging') {
        data = agingFiltered.map(c => ({
          'Docket No': c.DOCKET_NO,
          'Date Filed': c.DATE_FILED,
          'Complainant': c.COMPLAINANT,
          'Respondent': c.RESPONDENT,
          'Offense': c.OFFENSE,
          'Days Pending': c.days,
          'Age Bucket': c.bucket,
          'Recommendation': c.REMARKS_DECISION || 'Pending',
        }));
      } else {
        data = monthlyData.monthCases.map(c => ({
          'Docket No': c.DOCKET_NO,
          'Date Filed': c.DATE_FILED,
          'Complainant': c.COMPLAINANT,
          'Respondent': c.RESPONDENT,
          'Offense': c.OFFENSE,
          'Recommendation': c.REMARKS_DECISION || 'Pending',
          'New Status': c.STATUS || '',
          'Date Resolved': c.DATE_RESOLVED || '',
        }));
      }
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Report');
      XLSX.writeFile(wb, `OCP_Report_${activeTab}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      console.error('Excel export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setFilterOffense('');
    setFilterRecommendation('');
    setFilterStatus('');
    setFilterProsecutor('');
    setAgingCategory('');
  };

  const formatDate = (d) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Stats
  const totalConvicted = filteredCases.filter(c => (c.REMARKS_DECISION || '').toLowerCase() === 'convicted').length;
  const totalDismissed = filteredCases.filter(c => (c.REMARKS_DECISION || '').toLowerCase() === 'dismissed').length;
  const totalPending = filteredCases.filter(c => {
    const dec = (c.REMARKS_DECISION || '').toLowerCase();
    return dec === '' || dec === 'pending';
  }).length;
  const totalFiledInCourt = filteredCases.filter(c => c.STATUS === 'Filed in Court').length;
  const convictionRate = filteredCases.length > 0 ? ((totalConvicted / filteredCases.length) * 100).toFixed(1) : '0.0';

  // Card component
  const StatCard = ({ icon, label, value, color, sub }) => (
    <div className={`rounded-2xl p-5 transition-all ${isDark ? 'bg-slate-800/60 border border-slate-700/50' : 'bg-white border border-slate-100 shadow-md'}`}>
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${color}-100`}>
          <i className={`fas ${icon} text-${color}-600`}></i>
        </div>
        <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</span>
      </div>
      <p className={`text-3xl font-bold m-0 ${isDark ? 'text-white' : 'text-slate-900'}`}>{value}</p>
      {sub && <p className={`text-xs mt-1 m-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{sub}</p>}
    </div>
  );

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>Loading report data...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'disposition', icon: 'fa-chart-pie', label: 'Case Disposition' },
    { id: 'aging', icon: 'fa-hourglass-half', label: 'Case Aging' },
    { id: 'monthly', icon: 'fa-calendar-check', label: 'Monthly Performance' },
  ];

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-gradient-to-br from-slate-50 to-slate-100'}`}>
      {/* Print-only styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 no-print">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                  <i className={`fas fa-file-pdf text-lg ${isDark ? 'text-blue-400' : 'text-blue-600'}`}></i>
                </div>
                <h1 className={`text-2xl md:text-3xl font-bold m-0 ${isDark ? 'text-white' : 'text-slate-800'}`}>Generate Report</h1>
              </div>
              <p className={`text-sm m-0 ml-13 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Professional reporting & analytics for case management
              </p>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleExportPDF}
                disabled={exporting}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border-none cursor-pointer bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all disabled:opacity-50"
              >
                <i className="fas fa-file-pdf"></i> PDF
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleExportExcel}
                disabled={exporting}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border-none cursor-pointer bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
              >
                <i className="fas fa-file-excel"></i> Excel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border-none cursor-pointer bg-slate-600 text-white hover:bg-slate-700 shadow-lg shadow-slate-500/20 transition-all"
              >
                <i className="fas fa-print"></i> Print
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className={`rounded-2xl p-1.5 mb-6 no-print flex gap-1 ${isDark ? 'bg-slate-800/80' : 'bg-white shadow-md border border-slate-100'}`}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold border-none cursor-pointer transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                  : isDark
                    ? 'text-slate-400 hover:text-white hover:bg-slate-700'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <i className={`fas ${tab.icon}`}></i>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className={`rounded-2xl p-5 mb-6 no-print ${isDark ? 'bg-slate-800/60 border border-slate-700/50' : 'bg-white shadow-md border border-slate-100'}`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <i className={`fas fa-filter ${isDark ? 'text-blue-400' : 'text-blue-600'}`}></i>
              <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-700'}`}>Filters</span>
            </div>
            <button onClick={clearFilters} className={`text-xs font-semibold px-3 py-1.5 rounded-lg border-none cursor-pointer transition-all ${isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              <i className="fas fa-times mr-1"></i>Clear All
            </button>
          </div>

          {activeTab === 'monthly' ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className={`text-xs font-semibold block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Month</label>
                <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-xl border-2 text-sm transition-all ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200'} focus:border-blue-500 focus:ring-2 focus:ring-blue-200`} />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div>
                <label className={`text-xs font-semibold block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Date From</label>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-xl border-2 text-sm transition-all ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200'} focus:border-blue-500 focus:ring-2 focus:ring-blue-200`} />
              </div>
              <div>
                <label className={`text-xs font-semibold block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Date To</label>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-xl border-2 text-sm transition-all ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200'} focus:border-blue-500 focus:ring-2 focus:ring-blue-200`} />
              </div>
              <div>
                <label className={`text-xs font-semibold block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Offense</label>
                <select value={filterOffense} onChange={e => setFilterOffense(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-xl border-2 text-sm transition-all cursor-pointer ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200'} focus:border-blue-500 focus:ring-2 focus:ring-blue-200`}>
                  <option value="">All Offenses</option>
                  {uniqueOffenses.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className={`text-xs font-semibold block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Recommendation</label>
                <select value={filterRecommendation} onChange={e => setFilterRecommendation(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-xl border-2 text-sm transition-all cursor-pointer ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200'} focus:border-blue-500 focus:ring-2 focus:ring-blue-200`}>
                  <option value="">All Recommendations</option>
                  {uniqueRecommendations.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className={`text-xs font-semibold block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Status</label>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-xl border-2 text-sm transition-all cursor-pointer ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200'} focus:border-blue-500 focus:ring-2 focus:ring-blue-200`}>
                  <option value="">All Statuses</option>
                  {uniqueStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {activeTab === 'aging' ? (
                <div>
                  <label className={`text-xs font-semibold block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Age Category</label>
                  <select value={agingCategory} onChange={e => setAgingCategory(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-xl border-2 text-sm transition-all cursor-pointer ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200'} focus:border-blue-500 focus:ring-2 focus:ring-blue-200`}>
                    <option value="">All Ages</option>
                    <option value="0-30 days">0-30 days</option>
                    <option value="31-60 days">31-60 days</option>
                    <option value="61-90 days">61-90 days</option>
                    <option value="90+ days">90+ days</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className={`text-xs font-semibold block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Prosecutor</label>
                  <select value={filterProsecutor} onChange={e => setFilterProsecutor(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-xl border-2 text-sm transition-all cursor-pointer ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200'} focus:border-blue-500 focus:ring-2 focus:ring-blue-200`}>
                    <option value="">All Prosecutors</option>
                    {uniqueProsecutors.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Report Content */}
        <div ref={reportRef} className="print-area space-y-6">
          {/* Report Header (visible in print/PDF) */}
          <div className="hidden print:block text-center mb-6">
            <h2 className="text-xl font-bold">OCP Docketing System — {tabs.find(t => t.id === activeTab)?.label}</h2>
            <p className="text-sm text-slate-500">
              Generated by: {user?.name || 'Admin'} | Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} |
              Total Records: {activeTab === 'aging' ? agingFiltered.length : activeTab === 'monthly' ? monthlyData.monthCases.length : filteredCases.length}
            </p>
          </div>

          {/* Timestamp bar */}
          <div className={`rounded-xl px-4 py-2.5 flex items-center justify-between ${isDark ? 'bg-slate-800/40 border border-slate-700/40' : 'bg-blue-50/80 border border-blue-100'}`}>
            <div className="flex items-center gap-2">
              <i className={`fas fa-clock text-xs ${isDark ? 'text-blue-400' : 'text-blue-500'}`}></i>
              <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Report generated: {new Date().toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                <i className="fas fa-user mr-1"></i>{user?.name || 'Admin'}
              </span>
              <span className={`text-xs font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                {activeTab === 'aging' ? agingFiltered.length : activeTab === 'monthly' ? monthlyData.monthCases.length : filteredCases.length} records
              </span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* ═══════════════════════ DISPOSITION REPORT ═══════════════════════ */}
            {activeTab === 'disposition' && (
              <motion.div key="disposition" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <StatCard icon="fa-folder-open" label="Total Cases" value={filteredCases.length} color="blue" />
                  <StatCard icon="fa-hourglass-half" label="Pending" value={totalPending} color="yellow" sub={`${filteredCases.length > 0 ? ((totalPending / filteredCases.length) * 100).toFixed(1) : 0}%`} />
                  <StatCard icon="fa-gavel" label="Convicted" value={totalConvicted} color="green" sub={`${convictionRate}%`} />
                  <StatCard icon="fa-ban" label="Dismissed" value={totalDismissed} color="red" sub={`${filteredCases.length > 0 ? ((totalDismissed / filteredCases.length) * 100).toFixed(1) : 0}%`} />
                  <StatCard icon="fa-landmark" label="Filed in Court" value={totalFiledInCourt} color="purple" />
                  <StatCard icon="fa-clock" label="Avg. Resolution" value={`${avgResolutionDays}d`} color="orange" sub="days average" />
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recommendation Distribution Pie */}
                  <div className={`rounded-2xl p-6 ${isDark ? 'bg-slate-800/60 border border-slate-700/50' : 'bg-white shadow-md border border-slate-100'}`}>
                    <h3 className={`text-sm font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                      <i className="fas fa-chart-pie text-blue-500 mr-2"></i>Recommendation Distribution
                    </h3>
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie 
                          data={dispositionData} 
                          cx="50%" 
                          cy="50%" 
                          innerRadius={55} 
                          outerRadius={90} 
                          paddingAngle={2} 
                          dataKey="value"
                          labelLine={false}
                        >
                          {dispositionData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip 
                          formatter={(value, name) => [value, name]}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', fontSize: '12px' }} 
                        />
                        <Legend 
                          layout="vertical" 
                          align="right" 
                          verticalAlign="middle"
                          iconType="circle"
                          iconSize={10}
                          wrapperStyle={{ fontSize: '11px', paddingLeft: '10px' }}
                          formatter={(value) => {
                            const item = dispositionData.find(d => d.name === value);
                            const percent = item ? ((item.value / filteredCases.length) * 100).toFixed(0) : 0;
                            return `${value.length > 12 ? value.slice(0, 12) + '...' : value} (${percent}%)`;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Top Offenses Bar */}
                  <div className={`rounded-2xl p-6 ${isDark ? 'bg-slate-800/60 border border-slate-700/50' : 'bg-white shadow-md border border-slate-100'}`}>
                    <h3 className={`text-sm font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                      <i className="fas fa-chart-bar text-emerald-500 mr-2"></i>Top Offenses
                    </h3>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={offenseDistribution.map(d => ({ ...d, shortName: d.name.length > 18 ? d.name.slice(0, 18) + '...' : d.name }))} layout="vertical" margin={{ left: 10, right: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} horizontal={false} />
                        <XAxis type="number" tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }} />
                        <YAxis 
                          type="category" 
                          dataKey="shortName" 
                          tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10, whiteSpace: 'nowrap' }} 
                          width={100}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip 
                          formatter={(value, _name, entry) => [value, entry.payload.name]}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', fontSize: '12px' }} 
                        />
                        <Bar dataKey="value" fill="#3B82F6" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Status Distribution */}
                {statusDistribution.length > 1 && (
                  <div className={`rounded-2xl p-6 ${isDark ? 'bg-slate-800/60 border border-slate-700/50' : 'bg-white shadow-md border border-slate-100'}`}>
                    <h3 className={`text-sm font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                      <i className="fas fa-tasks text-purple-500 mr-2"></i>New Status Distribution
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={statusDistribution}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
                        <XAxis dataKey="name" tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }} />
                        <YAxis tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                        <Bar dataKey="value" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Cases Table */}
                <div className={`rounded-2xl overflow-hidden ${isDark ? 'bg-slate-800/60 border border-slate-700/50' : 'bg-white shadow-md border border-slate-100'}`}>
                  <div className={`px-6 py-4 border-b ${isDark ? 'border-slate-700/50' : 'border-slate-100'}`}>
                    <h3 className={`text-sm font-bold m-0 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                      <i className="fas fa-table text-blue-500 mr-2"></i>Case Records ({filteredCases.length})
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className={isDark ? 'bg-slate-700/50' : 'bg-slate-50'}>
                          {['Docket No', 'Date Filed', 'Complainant', 'Respondent', 'Offense', 'Recommendation', 'Status', 'Decision Date'].map(h => (
                            <th key={h} className={`px-4 py-3 text-left text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCases.slice(0, 50).map((c, i) => (
                          <tr key={c.id || i} className={`border-b transition-colors ${isDark ? 'border-slate-700/30 hover:bg-slate-700/20' : 'border-slate-100 hover:bg-slate-50'}`}>
                            <td className={`px-4 py-3 text-xs font-mono font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{c.DOCKET_NO || 'N/A'}</td>
                            <td className={`px-4 py-3 text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{formatDate(c.DATE_FILED)}</td>
                            <td className={`px-4 py-3 text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{c.COMPLAINANT || 'N/A'}</td>
                            <td className={`px-4 py-3 text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{c.RESPONDENT || 'N/A'}</td>
                            <td className={`px-4 py-3 text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{c.OFFENSE || 'N/A'}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-md text-xs font-semibold ${
                                (c.REMARKS_DECISION || '').toLowerCase() === 'convicted' ? 'bg-green-100 text-green-700' :
                                (c.REMARKS_DECISION || '').toLowerCase() === 'dismissed' ? 'bg-blue-100 text-blue-700' :
                                (c.REMARKS_DECISION || '').toLowerCase() === 'pending' || !c.REMARKS_DECISION ? 'bg-yellow-100 text-yellow-700' :
                                'bg-slate-100 text-slate-700'
                              }`}>{c.REMARKS_DECISION || 'Pending'}</span>
                            </td>
                            <td className="px-4 py-3">
                              {c.STATUS ? (
                                <span className="px-2 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-700">{c.STATUS}</span>
                              ) : <span className={`text-xs ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>—</span>}
                            </td>
                            <td className={`px-4 py-3 text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{formatDate(c.DECISION_DATE)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredCases.length > 50 && (
                      <div className={`px-6 py-3 text-center text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        Showing 50 of {filteredCases.length} records. Export to view all.
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ═══════════════════════ AGING REPORT ═══════════════════════ */}
            {activeTab === 'aging' && (
              <motion.div key="aging" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                {/* Aging Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {agingBucketData.map((b, i) => (
                    <div key={b.name}
                      onClick={() => setAgingCategory(agingCategory === b.name ? '' : b.name)}
                      className={`rounded-2xl p-5 cursor-pointer transition-all ${
                        agingCategory === b.name
                          ? 'ring-2 ring-blue-500 shadow-lg shadow-blue-500/20'
                          : ''
                      } ${isDark ? 'bg-slate-800/60 border border-slate-700/50 hover:border-slate-600' : 'bg-white border border-slate-100 shadow-md hover:shadow-lg'}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: COLORS[i] }}></div>
                        <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{b.name}</span>
                      </div>
                      <p className={`text-3xl font-bold m-0 ${isDark ? 'text-white' : 'text-slate-900'}`}>{b.value}</p>
                      <p className={`text-xs mt-1 m-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        {agingCases.length > 0 ? ((b.value / agingCases.length) * 100).toFixed(1) : 0}% of pending
                      </p>
                    </div>
                  ))}
                </div>

                {/* Aging Chart */}
                <div className={`rounded-2xl p-6 ${isDark ? 'bg-slate-800/60 border border-slate-700/50' : 'bg-white shadow-md border border-slate-100'}`}>
                  <h3 className={`text-sm font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    <i className="fas fa-hourglass-half text-orange-500 mr-2"></i>Case Aging Distribution
                  </h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={agingBucketData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
                      <XAxis dataKey="name" tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 12 }} />
                      <YAxis tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 12 }} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {agingBucketData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Aging Table */}
                <div className={`rounded-2xl overflow-hidden ${isDark ? 'bg-slate-800/60 border border-slate-700/50' : 'bg-white shadow-md border border-slate-100'}`}>
                  <div className={`px-6 py-4 border-b flex items-center justify-between ${isDark ? 'border-slate-700/50' : 'border-slate-100'}`}>
                    <h3 className={`text-sm font-bold m-0 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                      <i className="fas fa-exclamation-triangle text-orange-500 mr-2"></i>
                      Pending Cases by Age ({agingFiltered.length})
                      {agingCategory && <span className="ml-2 text-xs font-normal text-blue-500">— filtered: {agingCategory}</span>}
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className={isDark ? 'bg-slate-700/50' : 'bg-slate-50'}>
                          {['Docket No', 'Date Filed', 'Complainant', 'Respondent', 'Offense', 'Days Pending', 'Age Category'].map(h => (
                            <th key={h} className={`px-4 py-3 text-left text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {agingFiltered.slice(0, 50).map((c, i) => (
                          <tr key={c.id || i} className={`border-b transition-colors ${isDark ? 'border-slate-700/30 hover:bg-slate-700/20' : 'border-slate-100 hover:bg-slate-50'}`}>
                            <td className={`px-4 py-3 text-xs font-mono font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{c.DOCKET_NO || 'N/A'}</td>
                            <td className={`px-4 py-3 text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{formatDate(c.DATE_FILED)}</td>
                            <td className={`px-4 py-3 text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{c.COMPLAINANT || 'N/A'}</td>
                            <td className={`px-4 py-3 text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{c.RESPONDENT || 'N/A'}</td>
                            <td className={`px-4 py-3 text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{c.OFFENSE || 'N/A'}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                                c.days > 90 ? 'bg-red-100 text-red-700' :
                                c.days > 60 ? 'bg-orange-100 text-orange-700' :
                                c.days > 30 ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                              }`}>{c.days} days</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-md text-xs font-semibold ${
                                c.bucket === '90+ days' ? 'bg-red-100 text-red-700' :
                                c.bucket === '61-90 days' ? 'bg-orange-100 text-orange-700' :
                                c.bucket === '31-60 days' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                              }`}>{c.bucket}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {agingFiltered.length === 0 && (
                      <div className={`px-6 py-12 text-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        <i className="fas fa-check-circle text-3xl mb-3 block text-green-400"></i>
                        <p className="font-semibold">No pending cases found</p>
                        <p className="text-xs">All cases are resolved within the selected criteria</p>
                      </div>
                    )}
                    {agingFiltered.length > 50 && (
                      <div className={`px-6 py-3 text-center text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        Showing 50 of {agingFiltered.length} records. Export to view all.
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ═══════════════════════ MONTHLY PERFORMANCE ═══════════════════════ */}
            {activeTab === 'monthly' && (
              <motion.div key="monthly" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                {/* Monthly Stats */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <StatCard icon="fa-plus-circle" label="New Cases" value={monthlyData.newCases} color="blue"
                    sub={monthlyData.changePercent > 0 ? `↑ ${monthlyData.changePercent}% vs last month` : monthlyData.changePercent < 0 ? `↓ ${Math.abs(monthlyData.changePercent)}% vs last month` : 'Same as last month'} />
                  <StatCard icon="fa-check-circle" label="Resolved" value={monthlyData.resolved} color="green" />
                  <StatCard icon="fa-hourglass-half" label="Pending" value={monthlyData.pending} color="yellow" />
                  <StatCard icon="fa-gavel" label="Convicted" value={monthlyData.convicted} color="emerald" />
                  <StatCard icon="fa-ban" label="Dismissed" value={monthlyData.dismissed} color="red" />
                  <StatCard icon="fa-landmark" label="Filed in Court" value={monthlyData.filedInCourt} color="purple" />
                </div>

                {/* Trend Chart */}
                <div className={`rounded-2xl p-6 ${isDark ? 'bg-slate-800/60 border border-slate-700/50' : 'bg-white shadow-md border border-slate-100'}`}>
                  <h3 className={`text-sm font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    <i className="fas fa-chart-line text-blue-500 mr-2"></i>6-Month Case Trend
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
                      <XAxis dataKey="month" tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 12 }} />
                      <YAxis tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 12 }} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                      <Legend />
                      <Line type="monotone" dataKey="filed" name="Cases Filed" stroke="#3B82F6" strokeWidth={3} dot={{ r: 5 }} />
                      <Line type="monotone" dataKey="resolved" name="Resolved" stroke="#10B981" strokeWidth={3} dot={{ r: 5 }} />
                      <Line type="monotone" dataKey="pending" name="Pending" stroke="#F59E0B" strokeWidth={3} dot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Recommendation breakdown for the month */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className={`rounded-2xl p-6 ${isDark ? 'bg-slate-800/60 border border-slate-700/50' : 'bg-white shadow-md border border-slate-100'}`}>
                    <h3 className={`text-sm font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                      <i className="fas fa-chart-pie text-purple-500 mr-2"></i>Monthly Recommendation Breakdown
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={(() => {
                            const groups = {};
                            monthlyData.monthCases.forEach(c => {
                              const key = c.REMARKS_DECISION || 'Pending';
                              groups[key] = (groups[key] || 0) + 1;
                            });
                            return Object.entries(groups).map(([name, value]) => ({ name, value }));
                          })()}
                          cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value"
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {dispositionData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Offense breakdown for the month */}
                  <div className={`rounded-2xl p-6 ${isDark ? 'bg-slate-800/60 border border-slate-700/50' : 'bg-white shadow-md border border-slate-100'}`}>
                    <h3 className={`text-sm font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                      <i className="fas fa-chart-bar text-emerald-500 mr-2"></i>Monthly Offense Types
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={(() => {
                        const groups = {};
                        monthlyData.monthCases.forEach(c => {
                          const key = c.OFFENSE || 'Unknown';
                          groups[key] = (groups[key] || 0) + 1;
                        });
                        return Object.entries(groups).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
                      })()} layout="vertical" margin={{ left: 80 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
                        <XAxis type="number" tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }} />
                        <YAxis type="category" dataKey="name" tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }} width={75} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                        <Bar dataKey="value" fill="#10B981" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Monthly Cases Table */}
                <div className={`rounded-2xl overflow-hidden ${isDark ? 'bg-slate-800/60 border border-slate-700/50' : 'bg-white shadow-md border border-slate-100'}`}>
                  <div className={`px-6 py-4 border-b ${isDark ? 'border-slate-700/50' : 'border-slate-100'}`}>
                    <h3 className={`text-sm font-bold m-0 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                      <i className="fas fa-calendar text-blue-500 mr-2"></i>Cases Filed This Month ({monthlyData.monthCases.length})
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className={isDark ? 'bg-slate-700/50' : 'bg-slate-50'}>
                          {['Docket No', 'Date Filed', 'Complainant', 'Respondent', 'Offense', 'Recommendation', 'Status', 'Resolved'].map(h => (
                            <th key={h} className={`px-4 py-3 text-left text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {monthlyData.monthCases.slice(0, 50).map((c, i) => (
                          <tr key={c.id || i} className={`border-b transition-colors ${isDark ? 'border-slate-700/30 hover:bg-slate-700/20' : 'border-slate-100 hover:bg-slate-50'}`}>
                            <td className={`px-4 py-3 text-xs font-mono font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{c.DOCKET_NO || 'N/A'}</td>
                            <td className={`px-4 py-3 text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{formatDate(c.DATE_FILED)}</td>
                            <td className={`px-4 py-3 text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{c.COMPLAINANT || 'N/A'}</td>
                            <td className={`px-4 py-3 text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{c.RESPONDENT || 'N/A'}</td>
                            <td className={`px-4 py-3 text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{c.OFFENSE || 'N/A'}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-md text-xs font-semibold ${
                                (c.REMARKS_DECISION || '').toLowerCase() === 'convicted' ? 'bg-green-100 text-green-700' :
                                (c.REMARKS_DECISION || '').toLowerCase() === 'dismissed' ? 'bg-blue-100 text-blue-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>{c.REMARKS_DECISION || 'Pending'}</span>
                            </td>
                            <td className="px-4 py-3">
                              {c.STATUS ? (
                                <span className="px-2 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-700">{c.STATUS}</span>
                              ) : <span className={`text-xs ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>—</span>}
                            </td>
                            <td className={`px-4 py-3 text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{formatDate(c.DATE_RESOLVED)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {monthlyData.monthCases.length === 0 && (
                      <div className={`px-6 py-12 text-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        <i className="fas fa-folder-open text-3xl mb-3 block"></i>
                        <p className="font-semibold">No cases found for this month</p>
                        <p className="text-xs">Try selecting a different month</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default GenerateReport;
