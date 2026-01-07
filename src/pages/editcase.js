import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import { motion } from 'framer-motion';

const Editcase = () => {
  const [searchQuery, setSearchQuery] = useState({ DOCKET_NO: "", RESPONDENT: "" });
  const [caseData, setCaseData] = useState(null);
  const [error, setError] = useState("");
  const [selectedFields, setSelectedFields] = useState({});
  const [editedValues, setEditedValues] = useState({});
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setSearchQuery({ ...searchQuery, [e.target.name]: e.target.value });
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.DOCKET_NO && !searchQuery.RESPONDENT) {
      setError("Please enter at least one search criteria.");
      return;
    }
    setIsLoading(true);
    try {
      const response = await axios.get("http://localhost:5000/get-case", {
        params: { docket_no: searchQuery.DOCKET_NO, respondent: searchQuery.RESPONDENT },
      });
      setCaseData(response.data);
      setError("");
    } catch (err) {
      setError("No matching case found or an error occurred.");
      setCaseData(null);
    }
    setSearchPerformed(true);
    setIsLoading(false);
  };

  const fields = [
    { name: "DOCKET_NO", label: "Docket Number", icon: "fa-hashtag" },
    { name: "DATE_FILED", label: "Date Filed", icon: "fa-calendar", type: "date" },
    { name: "COMPLAINANT", label: "Complainant", icon: "fa-user" },
    { name: "RESPONDENT", label: "Respondent", icon: "fa-user-tag" },
    { name: "OFFENSE", label: "Offense", icon: "fa-exclamation-triangle" },
    { name: "DATE_RESOLVED", label: "Date Resolved", icon: "fa-calendar-check", type: "date" },
    { name: "RESOLVING_PROSECUTOR", label: "Resolving Prosecutor", icon: "fa-user-tie" },
    { name: "CRIM_CASE_NO", label: "Criminal Case Number", icon: "fa-gavel" },
    { name: "BRANCH", label: "Branch", icon: "fa-building" },
    { name: "DATEFILED_IN_COURT", label: "Date Filed in Court", icon: "fa-landmark", type: "date" },
    { name: "REMARKS_DECISION", label: "Decision", icon: "fa-clipboard-check" },
    { name: "REMARKS", label: "Remarks", icon: "fa-comment" },
    { name: "PENALTY", label: "Penalty", icon: "fa-balance-scale" },
    { name: "INDEX_CARDS", label: "Index Card URL", icon: "fa-link" },
  ];

  const handleCheckboxChange = (caseIndex, field) => {
    setSelectedFields(prevState => ({
      ...prevState,
      [caseIndex]: { ...prevState[caseIndex], [field]: !prevState[caseIndex]?.[field] }
    }));
  };

  const handleInputChange = (caseIndex, field, value) => {
    setEditedValues(prevState => ({
      ...prevState,
      [caseIndex]: { ...prevState[caseIndex], [field]: value }
    }));
  };

  const handleSave = async (index) => {
    if (!editedValues[index] || Object.keys(editedValues[index]).length === 0) {
      alert("Please select at least one field and enter a value to update.");
      return;
    }
    setIsLoading(true);
    const caseToUpdate = caseData[index];
    try {
      await axios.post("http://localhost:5000/update-case", {
        id: caseToUpdate.id,
        updated_fields: editedValues[index],
      });
      alert("Case updated successfully!");
      navigate(`/details/${caseToUpdate.DOCKET_NO}`);
    } catch (error) {
      console.error("Error updating case:", error);
      alert("Failed to update case.");
    }
    setIsLoading(false);
  };

  const inputClass = `w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white
                      focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20
                      transition-all duration-300 outline-none text-slate-700`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/20 to-slate-100 py-8 px-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl"></div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 border border-amber-200 mb-4">
            <i className="fas fa-edit text-amber-600"></i>
            <span className="text-amber-700 font-medium text-sm">Edit Case</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-3">Edit Case Details</h1>
          <p className="text-slate-500">Search for a case and modify its information</p>
        </div>

        {/* Back Button */}
        <motion.button whileHover={{ x: -5 }} whileTap={{ scale: 0.95 }} onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 px-4 py-2 mb-6 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all duration-300 shadow-sm cursor-pointer">
          <i className="fas fa-arrow-left"></i><span className="font-medium">Back to Menu</span>
        </motion.button>

        {/* Search Form */}
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden mb-8">
          <div className="p-8">
            <form onSubmit={handleSearch} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    <i className="fas fa-hashtag text-amber-500 mr-2"></i>Docket Number
                  </label>
                  <input type="text" name="DOCKET_NO" value={searchQuery.DOCKET_NO} onChange={handleChange}
                         className={inputClass} placeholder="Enter docket number" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    <i className="fas fa-user-tag text-amber-500 mr-2"></i>Respondent
                  </label>
                  <input type="text" name="RESPONDENT" value={searchQuery.RESPONDENT} onChange={handleChange}
                         className={inputClass} placeholder="Enter respondent name" />
                </div>
              </div>

              {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3">
                  <i className="fas fa-exclamation-circle"></i><span>{error}</span>
                </motion.div>
              )}

              <motion.button type="submit" disabled={isLoading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className={`w-full py-4 rounded-xl font-semibold text-lg shadow-lg transition-all duration-300 border-none cursor-pointer flex items-center justify-center gap-3
                  ${isLoading ? 'bg-slate-400' : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-amber-500/30'}`}>
                {isLoading ? <><div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div><span>Searching...</span></>
                           : <><i className="fas fa-search"></i><span>Search Case</span></>}
              </motion.button>
            </form>
          </div>
        </motion.div>

        {/* Results */}
        {searchPerformed && caseData && caseData.length > 0 && caseData.map((singleCase, index) => (
          <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-xl border border-amber-200 overflow-hidden mb-6">
            <div className="p-6 border-b border-amber-100 bg-amber-50">
              <h3 className="font-bold text-amber-800 flex items-center gap-2">
                <i className="fas fa-file-alt"></i>Case: {singleCase.DOCKET_NO}
              </h3>
              <p className="text-sm text-amber-600 mt-1">Select fields to edit and enter new values</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fields.map((field) => (
                  <div key={field.name} className={`p-4 rounded-xl border-2 transition-all duration-300 ${selectedFields[index]?.[field.name] ? 'border-amber-400 bg-amber-50' : 'border-slate-200 bg-slate-50'}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <input type="checkbox" id={`${index}-${field.name}`} checked={!!selectedFields[index]?.[field.name]}
                        onChange={() => handleCheckboxChange(index, field.name)}
                        className="w-5 h-5 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer" />
                      <label htmlFor={`${index}-${field.name}`} className="text-sm font-semibold text-slate-700 flex items-center gap-2 cursor-pointer">
                        <i className={`fas ${field.icon} text-amber-500`}></i>{field.label}
                      </label>
                    </div>
                    <p className="text-xs text-slate-500 mb-2">Current: {singleCase[field.name] || "N/A"}</p>
                    {selectedFields[index]?.[field.name] && (
                      <motion.input initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                        type={field.type || "text"}
                        className="w-full px-3 py-2 rounded-lg border-2 border-amber-300 bg-white focus:border-amber-500 outline-none text-slate-700"
                        placeholder={`Enter new ${field.label.toLowerCase()}`}
                        onChange={(e) => handleInputChange(index, field.name, e.target.value)} />
                    )}
                  </div>
                ))}
              </div>

              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleSave(index)}
                disabled={isLoading}
                className="w-full mt-6 py-4 rounded-xl font-semibold text-lg shadow-lg transition-all duration-300 border-none cursor-pointer flex items-center justify-center gap-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-amber-500/30 hover:shadow-xl">
                {isLoading ? <><div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div><span>Saving...</span></>
                           : <><i className="fas fa-save"></i><span>Save Changes</span></>}
              </motion.button>
            </div>
          </motion.div>
        ))}

        {searchPerformed && (!caseData || caseData.length === 0) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-white rounded-3xl shadow-xl border border-slate-200 p-12 text-center">
            <i className="fas fa-folder-open text-4xl text-slate-300 mb-4"></i>
            <p className="text-slate-500">No cases found matching your search criteria.</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default Editcase;
