import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const Findcase = () => {
  const [searchQuery, setSearchQuery] = useState({
    DOCKET_NO: "",
    RESPONDENT: "",
    RESOLVING_PROSECUTOR: "",
    REMARKS: "",
    start_date: "", 
    end_date: ""
  });
  
  const [caseData, setCaseData] = useState([]);
  const [error, setError] = useState("");
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setSearchQuery({ ...searchQuery, [e.target.name]: e.target.value });
  };

  const convertToYMD = (input) => {
    if (!input || input.includes('-')) return input; 
    const [day, month, year] = input.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const formattedStartDate = convertToYMD(searchQuery.start_date);
    const formattedEndDate = convertToYMD(searchQuery.end_date);

    if (!searchQuery.DOCKET_NO && !searchQuery.RESPONDENT && !searchQuery.RESOLVING_PROSECUTOR &&
        !searchQuery.REMARKS && !formattedStartDate && !formattedEndDate) {
      setError("Please enter at least one search criteria.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.get("http://localhost:5000/get-case", {
        params: {
          docket_no: searchQuery.DOCKET_NO,
          respondent: searchQuery.RESPONDENT,
          resolving_prosecutor: searchQuery.RESOLVING_PROSECUTOR,
          remarks: searchQuery.REMARKS,
          start_date: formattedStartDate,
          end_date: formattedEndDate,
        }        
      });

      if (Array.isArray(response.data) && response.data.length > 0) {
        setCaseData(response.data);
        setError("");
      } else {
        setCaseData([]);
        setError("No matching case found.");
      }
    } catch (err) {
      setError("An error occurred while fetching cases.");
      setCaseData([]);
    }

    setSearchPerformed(true);
    setIsLoading(false);
  };

  const inputClass = `w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white
                      focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20
                      transition-all duration-300 outline-none text-slate-700`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 
                    py-8 px-4 relative overflow-hidden">
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-violet-500/5 rounded-full blur-3xl"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full 
                          bg-blue-100 border border-blue-200 mb-4">
            <i className="fas fa-search text-blue-600"></i>
            <span className="text-blue-700 font-medium text-sm">Case Search</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-3">Find Case</h1>
          <p className="text-slate-500">Search for cases using multiple criteria</p>
        </div>

        {/* Back Button */}
        <motion.button
          whileHover={{ x: -5 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 px-4 py-2 mb-6 rounded-xl
                     bg-white border border-slate-200 text-slate-600
                     hover:bg-slate-50 transition-all duration-300 shadow-sm cursor-pointer"
        >
          <i className="fas fa-arrow-left"></i>
          <span className="font-medium">Back to Menu</span>
        </motion.button>

        {/* Search Form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden mb-8"
        >
          <div className="p-8">
            <form onSubmit={handleSearch} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    <i className="fas fa-hashtag text-blue-500 mr-2"></i>Docket Number
                  </label>
                  <input type="text" name="DOCKET_NO" value={searchQuery.DOCKET_NO}
                         onChange={handleChange} className={inputClass} placeholder="Enter docket number" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    <i className="fas fa-user-tag text-red-500 mr-2"></i>Respondent
                  </label>
                  <input type="text" name="RESPONDENT" value={searchQuery.RESPONDENT}
                         onChange={handleChange} className={inputClass} placeholder="Enter respondent name" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    <i className="fas fa-user-tie text-violet-500 mr-2"></i>Resolving Prosecutor
                  </label>
                  <input type="text" name="RESOLVING_PROSECUTOR" value={searchQuery.RESOLVING_PROSECUTOR}
                         onChange={handleChange} className={inputClass} placeholder="Enter prosecutor name" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    <i className="fas fa-comment text-amber-500 mr-2"></i>Remarks
                  </label>
                  <input type="text" name="REMARKS" value={searchQuery.REMARKS}
                         onChange={handleChange} className={inputClass} placeholder="Enter remarks" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    <i className="fas fa-calendar text-emerald-500 mr-2"></i>Start Date
                  </label>
                  <input type="date" name="start_date" value={searchQuery.start_date}
                         onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    <i className="fas fa-calendar-check text-emerald-500 mr-2"></i>End Date
                  </label>
                  <input type="date" name="end_date" value={searchQuery.end_date}
                         onChange={handleChange} className={inputClass} />
                </div>
              </div>

              {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3">
                  <i className="fas fa-exclamation-circle"></i>
                  <span>{error}</span>
                </motion.div>
              )}

              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full py-4 rounded-xl font-semibold text-lg shadow-lg transition-all duration-300 
                           border-none cursor-pointer flex items-center justify-center gap-3
                           ${isLoading ? 'bg-slate-400' : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-blue-500/30'}`}
              >
                {isLoading ? (
                  <><div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div><span>Searching...</span></>
                ) : (
                  <><i className="fas fa-search"></i><span>Search Cases</span></>
                )}
              </motion.button>
            </form>
          </div>
        </motion.div>

        {/* Results */}
        {searchPerformed && caseData.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <i className="fas fa-check-circle text-emerald-500"></i>
                Found {caseData.length} case(s)
              </h3>
            </div>
            <div className="divide-y divide-slate-100">
              {caseData.map((c, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="p-6 hover:bg-blue-50/50 transition-colors cursor-pointer"
                            onClick={() => setSelectedCase(c)}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-mono font-bold text-slate-800">{c.DOCKET_NO}</p>
                      <p className="text-sm text-slate-500">{c.COMPLAINANT} vs {c.RESPONDENT}</p>
                    </div>
                    <button className="px-4 py-2 rounded-xl bg-blue-100 text-blue-700 font-medium text-sm
                                       hover:bg-blue-200 transition-colors border-none cursor-pointer">
                      <i className="fas fa-eye mr-2"></i>View
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Detail Modal */}
        <AnimatePresence>
          {selectedCase && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                        onClick={() => setSelectedCase(null)}>
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                          className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                          onClick={(e) => e.stopPropagation()}>
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-slate-800">Case Details</h2>
                    <button onClick={() => setSelectedCase(null)} className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 cursor-pointer border-none">
                      <i className="fas fa-times text-slate-600"></i>
                    </button>
                  </div>
                  <div className="space-y-3">
                    {Object.entries(selectedCase).map(([key, value]) => (
                      <div key={key} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <i className="fas fa-file text-blue-600 text-sm"></i>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-medium uppercase">{key.replace(/_/g, ' ')}</p>
                          <p className="text-slate-800 font-medium">{value || "N/A"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Findcase;
