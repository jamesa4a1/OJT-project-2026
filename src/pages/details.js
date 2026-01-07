import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";

const Details = () => {
  const { docketNo } = useParams();
  const navigate = useNavigate();
  const [caseDetails, setCaseDetails] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCaseDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/get-case?docket_no=${docketNo}`);
        if (response.data.length > 0) {
          setCaseDetails(response.data[0]);
        } else {
          setError("No case found.");
        }
      } catch (err) {
        setError("Error fetching case details.");
      }
      setIsLoading(false);
    };
    fetchCaseDetails();
  }, [docketNo]);

  const fields = [
    { label: "Docket Number", key: "DOCKET_NO", icon: "fa-hashtag", color: "blue" },
    { label: "Date Filed", key: "DATE_FILED", icon: "fa-calendar", color: "emerald" },
    { label: "Complainant", key: "COMPLAINANT", icon: "fa-user", color: "violet" },
    { label: "Respondent", key: "RESPONDENT", icon: "fa-user-tag", color: "amber" },
    { label: "Offense", key: "OFFENSE", icon: "fa-exclamation-triangle", color: "red" },
    { label: "Date Resolved", key: "DATE_RESOLVED", icon: "fa-calendar-check", color: "teal" },
    { label: "Resolving Prosecutor", key: "RESOLVING_PROSECUTOR", icon: "fa-user-tie", color: "indigo" },
    { label: "Criminal Case Number", key: "CRIM_CASE_NO", icon: "fa-gavel", color: "slate" },
    { label: "Branch", key: "BRANCH", icon: "fa-building", color: "cyan" },
    { label: "Date Filed in Court", key: "DATEFILED_IN_COURT", icon: "fa-landmark", color: "purple" },
    { label: "Decision", key: "REMARKS_DECISION", icon: "fa-clipboard-check", color: "green" },
    { label: "Remarks", key: "REMARKS", icon: "fa-comment", color: "orange" },
    { label: "Penalty", key: "PENALTY", icon: "fa-balance-scale", color: "rose" },
  ];

  const colorClasses = {
    blue: "bg-blue-100 text-blue-600 border-blue-200",
    emerald: "bg-emerald-100 text-emerald-600 border-emerald-200",
    violet: "bg-violet-100 text-violet-600 border-violet-200",
    amber: "bg-amber-100 text-amber-600 border-amber-200",
    red: "bg-red-100 text-red-600 border-red-200",
    teal: "bg-teal-100 text-teal-600 border-teal-200",
    indigo: "bg-indigo-100 text-indigo-600 border-indigo-200",
    slate: "bg-slate-100 text-slate-600 border-slate-200",
    cyan: "bg-cyan-100 text-cyan-600 border-cyan-200",
    purple: "bg-purple-100 text-purple-600 border-purple-200",
    green: "bg-green-100 text-green-600 border-green-200",
    orange: "bg-orange-100 text-orange-600 border-orange-200",
    rose: "bg-rose-100 text-rose-600 border-rose-200",
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
          className="text-center">
          <div className="w-16 h-16 border-4 border-doj-navy/20 border-t-doj-navy rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading case details...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50/30 to-slate-100 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl border border-red-200 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-exclamation-triangle text-3xl text-red-500"></i>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Error</h2>
          <p className="text-red-600 mb-6">{error}</p>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate("/dashboard")}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-doj-navy to-doj-blue text-white font-semibold shadow-lg cursor-pointer border-none">
            Back to Menu
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 py-8 px-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-72 h-72 bg-doj-navy/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-doj-blue/5 rounded-full blur-3xl"></div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-doj-navy/10 border border-doj-navy/20 mb-4">
            <i className="fas fa-file-alt text-doj-navy"></i>
            <span className="text-doj-navy font-medium text-sm">Case Details</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-3">Case Information</h1>
          <p className="text-slate-500">Viewing details for case {docketNo}</p>
        </div>

        {/* Back Button */}
        <motion.button whileHover={{ x: -5 }} whileTap={{ scale: 0.95 }} onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 px-4 py-2 mb-6 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all duration-300 shadow-sm cursor-pointer">
          <i className="fas fa-arrow-left"></i><span className="font-medium">Back to Menu</span>
        </motion.button>

        {/* Case Card */}
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Card Header */}
          <div className="p-6 bg-gradient-to-r from-doj-navy to-doj-blue text-white">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
                <i className="fas fa-folder-open text-2xl"></i>
              </div>
              <div>
                <h2 className="text-2xl font-bold">{caseDetails.DOCKET_NO}</h2>
                <p className="text-white/70">{caseDetails.OFFENSE || "Case Details"}</p>
              </div>
            </div>
          </div>

          {/* Fields Grid */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fields.map((field, idx) => (
                <motion.div key={field.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:shadow-md transition-all duration-300">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${colorClasses[field.color]}`}>
                      <i className={`fas ${field.icon}`}></i>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{field.label}</p>
                      <p className="text-slate-800 font-medium break-words">{caseDetails[field.key] || <span className="text-slate-400 italic">Not provided</span>}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Index Cards Link */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
              className="mt-6 p-4 rounded-xl bg-gradient-to-r from-doj-navy/5 to-doj-blue/5 border border-doj-navy/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-doj-navy/10 flex items-center justify-center">
                    <i className="fas fa-link text-doj-navy"></i>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Index Card</p>
                    <p className="text-slate-600">{caseDetails.INDEX_CARDS ? "Document attached" : "No document attached"}</p>
                  </div>
                </div>
                {caseDetails.INDEX_CARDS && (
                  <motion.a whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    href={caseDetails.INDEX_CARDS} target="_blank" rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-doj-navy text-white font-medium flex items-center gap-2 hover:shadow-lg transition-all duration-300 no-underline">
                    <i className="fas fa-external-link-alt"></i>View File
                  </motion.a>
                )}
              </div>
            </motion.div>
          </div>

          {/* Actions */}
          <div className="p-6 bg-slate-50 border-t border-slate-200">
            <div className="flex flex-wrap gap-3 justify-center">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate("/editcase")}
                className="px-6 py-3 rounded-xl bg-amber-500 text-white font-semibold flex items-center gap-2 shadow-lg shadow-amber-500/30 cursor-pointer border-none">
                <i className="fas fa-edit"></i>Edit Case
              </motion.button>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate("/dashboard")}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-doj-navy to-doj-blue text-white font-semibold flex items-center gap-2 shadow-lg cursor-pointer border-none">
                <i className="fas fa-th-large"></i>Back to Menu
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Details;
