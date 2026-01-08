import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const Caselist = () => {
  const [cases, setCases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState(null);
  const navigate = useNavigate();
  const [sortOption, setSortOption] = useState("RESPONDENT");
  const [sortDirection, setSortDirection] = useState("asc");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFullImage, setShowFullImage] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    axios.get("http://localhost:5000/cases")
      .then(response => {
        // Filter only terminated/resolved/dismissed cases
        const terminatedCases = response.data.filter(c => {
          const status = (c.STATUS || c.REMARKS || '').toLowerCase();
          return status.includes('terminated') || 
                 status.includes('resolved') || 
                 status.includes('dismissed') || 
                 status.includes('closed') ||
                 status.includes('archived') ||
                 (c.DATE_RESOLVED && c.DATE_RESOLVED !== '' && c.DATE_RESOLVED !== 'N/A');
        });
        setCases(terminatedCases);
        setIsLoading(false);
      })
      .catch(error => {
        console.error("There was an error fetching the cases!", error);
        setIsLoading(false);
      });
  }, []);

  const handleSort = (option, direction) => {
    setSortOption(option);
    setSortDirection(direction);
    const sortedCases = [...cases].sort((a, b) => {
      if (a[option] < b[option]) return direction === "asc" ? -1 : 1;
      if (a[option] > b[option]) return direction === "asc" ? 1 : -1;
      return 0;
    });
    setCases(sortedCases);
  };

  // Filter only by Docket No or IS Case Number
  const filteredCases = cases.filter(c => 
    c.DOCKET_NO?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.IS_CASE_NO?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.CRIM_CASE_NO?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 
                    py-8 px-4 relative overflow-hidden">
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-72 h-72 bg-violet-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full 
                          bg-red-100 border border-red-200 mb-4">
            <i className="fas fa-archive text-red-600"></i>
            <span className="text-red-700 font-medium text-sm">Case Archive</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-3">
            Terminated Cases
          </h1>
          <p className="text-slate-500">Browse all resolved, dismissed, and closed cases</p>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 items-center justify-between">
          <motion.button
            whileHover={{ x: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/admin-dashboard")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl
                       bg-white border border-slate-200 text-slate-600
                       hover:bg-slate-50 transition-all duration-300 shadow-sm cursor-pointer"
          >
            <i className="fas fa-arrow-left"></i>
            <span className="font-medium">Back to Dashboard</span>
          </motion.button>

          <div className="flex flex-wrap gap-4 items-center">
            {/* Search by Docket/IS Case Number */}
            <div className="relative">
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
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
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 font-medium">Loading terminated cases...</p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-2xl p-4 shadow-lg border border-slate-200 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                  <i className="fas fa-folder-minus text-red-600 text-xl"></i>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{cases.length}</p>
                  <p className="text-sm text-slate-500">Terminated Cases</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-lg border border-slate-200 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <i className="fas fa-filter text-emerald-600 text-xl"></i>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{filteredCases.length}</p>
                  <p className="text-sm text-slate-500">Search Results</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-lg border border-slate-200 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                  <i className="fas fa-check-circle text-amber-600 text-xl"></i>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Status Filter</p>
                  <p className="text-sm text-slate-500">Terminated Only</p>
                </div>
              </div>
            </div>

            {/* Table */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-red-700 to-red-800 text-white">
                    <tr>
                      <th className="px-6 py-4 text-left font-semibold text-sm uppercase tracking-wider">
                        <i className="fas fa-hashtag mr-2"></i>Docket/IS No.
                      </th>
                      <th className="px-6 py-4 text-left font-semibold text-sm uppercase tracking-wider">
                        <i className="fas fa-user mr-2"></i>Complainant
                      </th>
                      <th className="px-6 py-4 text-left font-semibold text-sm uppercase tracking-wider">
                        <i className="fas fa-user-tag mr-2"></i>Respondent
                      </th>
                      <th className="px-6 py-4 text-left font-semibold text-sm uppercase tracking-wider">
                        <i className="fas fa-calendar-check mr-2"></i>Date Resolved
                      </th>
                      <th className="px-6 py-4 text-center font-semibold text-sm uppercase tracking-wider">
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
                        className="border-b border-slate-100 hover:bg-red-50/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <span className="font-mono font-medium text-slate-800">{caseItem.DOCKET_NO || caseItem.IS_CASE_NO}</span>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{caseItem.COMPLAINANT}</td>
                        <td className="px-6 py-4 text-slate-600">{caseItem.RESPONDENT}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-medium">
                            <i className="fas fa-check-circle text-xs"></i>
                            {caseItem.DATE_RESOLVED || 'Terminated'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedCase(caseItem)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl
                                       bg-gradient-to-r from-red-500 to-red-600 text-white
                                       font-medium text-sm shadow-lg shadow-red-500/30
                                       hover:shadow-xl transition-all duration-300 border-none cursor-pointer"
                          >
                            <i className="fas fa-eye"></i>
                            <span>Details</span>
                          </motion.button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {filteredCases.length === 0 && (
                <div className="text-center py-12">
                  <i className="fas fa-archive text-4xl text-slate-300 mb-4"></i>
                  <p className="text-slate-500 font-medium">No terminated cases found</p>
                  <p className="text-slate-400 text-sm">Try a different Docket or IS Case Number</p>
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
                      { label: "Docket Number", value: selectedCase.DOCKET_NO, icon: "fa-hashtag" },
                      { label: "Date Filed", value: selectedCase.DATE_FILED, icon: "fa-calendar" },
                      { label: "Complainant", value: selectedCase.COMPLAINANT, icon: "fa-user" },
                      { label: "Respondent", value: selectedCase.RESPONDENT, icon: "fa-user-tag" },
                      { label: "Offense", value: selectedCase.OFFENSE, icon: "fa-exclamation-triangle" },
                      { label: "Date Resolved", value: selectedCase.DATE_RESOLVED, icon: "fa-calendar-check" },
                      { label: "Resolving Prosecutor", value: selectedCase.RESOLVING_PROSECUTOR, icon: "fa-user-tie" },
                      { label: "Criminal Case No.", value: selectedCase.CRIM_CASE_NO, icon: "fa-gavel" },
                      { label: "Branch", value: selectedCase.BRANCH, icon: "fa-building" },
                      { label: "Date Filed in Court", value: selectedCase.DATEFILED_IN_COURT, icon: "fa-landmark" },
                      { label: "Remarks", value: selectedCase.REMARKS, icon: "fa-comment" },
                      { label: "Penalty", value: selectedCase.PENALTY, icon: "fa-balance-scale" },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <i className={`fas ${item.icon} text-blue-600 text-sm`}></i>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-medium uppercase">{item.label}</p>
                          <p className="text-slate-800 font-medium">{item.value || "N/A"}</p>
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
                            onError={(e) => { e.target.style.display = 'none'; }}
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
      </motion.div>
    </div>
  );
};

export default Caselist;
