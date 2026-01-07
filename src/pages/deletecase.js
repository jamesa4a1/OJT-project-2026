import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const Deletecase = () => {
  const [docketNo, setDocketNo] = useState("");
  const [caseData, setCaseData] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!docketNo.trim()) {
      setError("Please enter a docket number.");
      return;
    }
    setIsLoading(true);
    try {
      const response = await axios.get("http://localhost:5000/get-case", {
        params: { docket_no: docketNo }
      });
      if (response.data && response.data.length > 0) {
        setCaseData(response.data[0]);
        setError("");
      } else {
        setCaseData(null);
        setError("No case found with that docket number.");
      }
    } catch (err) {
      setError("Error searching for case.");
      setCaseData(null);
    }
    setIsLoading(false);
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await axios.delete("http://localhost:5000/delete-case", {
        data: { docket_no: docketNo }
      });
      alert("Case deleted successfully!");
      navigate("/dashboard");
    } catch (err) {
      setError("Error deleting case. Please try again.");
    }
    setIsLoading(false);
    setShowConfirm(false);
  };

  const inputClass = `w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white
                      focus:border-red-500 focus:ring-4 focus:ring-red-500/20
                      transition-all duration-300 outline-none text-slate-700`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50/20 to-slate-100 
                    py-8 px-4 relative overflow-hidden">
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-72 h-72 bg-red-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-slate-500/5 rounded-full blur-3xl"></div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 max-w-2xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-100 border border-red-200 mb-4">
            <i className="fas fa-trash-alt text-red-600"></i>
            <span className="text-red-700 font-medium text-sm">Delete Case</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-3">Delete Case</h1>
          <p className="text-slate-500">Permanently remove a case from the system</p>
        </div>

        {/* Back Button */}
        <motion.button whileHover={{ x: -5 }} whileTap={{ scale: 0.95 }} onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 px-4 py-2 mb-6 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all duration-300 shadow-sm cursor-pointer">
          <i className="fas fa-arrow-left"></i>
          <span className="font-medium">Back to Menu</span>
        </motion.button>

        {/* Search Form */}
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden mb-8">
          <div className="p-8">
            <form onSubmit={handleSearch} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <i className="fas fa-hashtag text-red-500 mr-2"></i>Docket Number
                </label>
                <input type="text" value={docketNo} onChange={(e) => setDocketNo(e.target.value)}
                       className={inputClass} placeholder="Enter docket number to delete" />
              </div>

              {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3">
                  <i className="fas fa-exclamation-circle"></i><span>{error}</span>
                </motion.div>
              )}

              <motion.button type="submit" disabled={isLoading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className={`w-full py-4 rounded-xl font-semibold text-lg shadow-lg transition-all duration-300 border-none cursor-pointer flex items-center justify-center gap-3
                  ${isLoading ? 'bg-slate-400' : 'bg-gradient-to-r from-slate-700 to-slate-800 text-white'}`}>
                {isLoading ? <><div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div><span>Searching...</span></> 
                           : <><i className="fas fa-search"></i><span>Search Case</span></>}
              </motion.button>
            </form>
          </div>
        </motion.div>

        {/* Case Preview */}
        {caseData && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-xl border border-red-200 overflow-hidden">
            <div className="p-6 border-b border-red-100 bg-red-50">
              <h3 className="font-bold text-red-800 flex items-center gap-2">
                <i className="fas fa-exclamation-triangle"></i>Case Found - Confirm Deletion
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Docket No", value: caseData.DOCKET_NO },
                  { label: "Complainant", value: caseData.COMPLAINANT },
                  { label: "Respondent", value: caseData.RESPONDENT },
                  { label: "Offense", value: caseData.OFFENSE },
                ].map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50">
                    <p className="text-xs text-slate-500 uppercase">{item.label}</p>
                    <p className="font-medium text-slate-800">{item.value || "N/A"}</p>
                  </div>
                ))}
              </div>
              
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowConfirm(true)}
                className="w-full py-4 rounded-xl font-semibold text-lg shadow-lg transition-all duration-300 border-none cursor-pointer flex items-center justify-center gap-3 bg-gradient-to-r from-red-500 to-red-600 text-white shadow-red-500/30">
                <i className="fas fa-trash-alt"></i><span>Delete This Case</span>
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Confirmation Modal */}
        <AnimatePresence>
          {showConfirm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowConfirm(false)}>
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center" onClick={(e) => e.stopPropagation()}>
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-exclamation-triangle text-red-600 text-2xl"></i>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Confirm Deletion</h3>
                <p className="text-slate-500 mb-6">Are you sure you want to delete case <strong>{docketNo}</strong>? This action cannot be undone.</p>
                <div className="flex gap-4">
                  <button onClick={() => setShowConfirm(false)} className="flex-1 py-3 rounded-xl font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors border-none cursor-pointer">Cancel</button>
                  <button onClick={handleDelete} className="flex-1 py-3 rounded-xl font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors border-none cursor-pointer">
                    {isLoading ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Deletecase;
