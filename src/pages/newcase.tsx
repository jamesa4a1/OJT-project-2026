import React, { useState, FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useToast } from '../components/ui/ToastContainer';
import config from '../config';

interface CaseFormData {
  DOCKET_NO: string;
  DATE_FILED: string;
  COMPLAINANT: string;
  RESPONDENT: string;
  ADDRESS_OF_RESPONDENT: string;
  OFFENSE: string;
  DATE_OF_COMMISSION: string;
  DATE_RESOLVED: string;
  RESOLVING_PROSECUTOR: string;
  CRIM_CASE_NO: string;
  BRANCH: string;
  DATEFILED_IN_COURT: string;
  FINAL_OFFENSE: string;
  REMARKS_DECISION: string;
  PENALTY: string;
  DECISION_DATE: string;
  STATUS: string;
}

const Newcase: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [indexCardImage, setIndexCardImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showFullImage, setShowFullImage] = useState<boolean>(false);
  const [complainants, setComplainants] = useState<string[]>(['']);
  const [respondents, setRespondents] = useState<{ name: string; address: string }[]>([
    { name: '', address: '' },
  ]);
  const [recommendations, setRecommendations] = useState<string[]>(['Pending']);
  const [crimCaseNos, setCrimCaseNos] = useState<string[]>(['']);
  const [branches, setBranches] = useState<string[]>(['']);
  const [datesFiledInCourt, setDatesFiledInCourt] = useState<string[]>(['']);
  const [finalOffenses, setFinalOffenses] = useState<string[]>(['']);
  const [formData, setFormData] = useState<CaseFormData>({
    DOCKET_NO: '',
    DATE_FILED: '',
    COMPLAINANT: '',
    RESPONDENT: '',
    ADDRESS_OF_RESPONDENT: '',
    OFFENSE: '',
    DATE_OF_COMMISSION: '',
    DATE_RESOLVED: '',
    RESOLVING_PROSECUTOR: '',
    CRIM_CASE_NO: '',
    BRANCH: '',
    DATEFILED_IN_COURT: '',
    FINAL_OFFENSE: '',
    REMARKS_DECISION: '',
    PENALTY: '',
    DECISION_DATE: '',
    STATUS: '',
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;

    setFormData({ ...formData, [name.toUpperCase()]: value } as CaseFormData);
  };

  const addComplainant = (): void => setComplainants([...complainants, '']);
  const removeComplainant = (index: number): void => {
    if (complainants.length === 1) return;
    setComplainants(complainants.filter((_, i) => i !== index));
  };
  const updateComplainant = (index: number, value: string): void => {
    const updated = [...complainants];
    updated[index] = value;
    setComplainants(updated);
  };

  const addRespondent = (): void => {
    setRespondents([...respondents, { name: '', address: '' }]);
    setRecommendations([...recommendations, 'Pending']);
    setCrimCaseNos([...crimCaseNos, '']);
    setBranches([...branches, '']);
    setDatesFiledInCourt([...datesFiledInCourt, '']);
    setFinalOffenses([...finalOffenses, '']);
  };
  const removeRespondent = (index: number): void => {
    if (respondents.length === 1) return;
    setRespondents(respondents.filter((_, i) => i !== index));
    setRecommendations(recommendations.filter((_, i) => i !== index));
    setCrimCaseNos(crimCaseNos.filter((_, i) => i !== index));
    setBranches(branches.filter((_, i) => i !== index));
    setDatesFiledInCourt(datesFiledInCourt.filter((_, i) => i !== index));
    setFinalOffenses(finalOffenses.filter((_, i) => i !== index));
  };
  const updateRespondent = (index: number, value: string): void => {
    const updated = [...respondents];
    updated[index] = { ...updated[index], name: value };
    setRespondents(updated);
  };
  const updateRespondentAddress = (index: number, value: string): void => {
    const updated = [...respondents];
    updated[index] = { ...updated[index], address: value };
    setRespondents(updated);
  };

  const updateRecommendation = (index: number, value: string): void => {
    const updated = [...recommendations];
    updated[index] = value;
    setRecommendations(updated);
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      setIndexCardImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (): void => {
    setIndexCardImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const activeRespondentIndexes = respondents
        .map((r, index) => ({ index, name: r.name.trim() }))
        .filter((r) => r.name !== '')
        .map((r) => r.index);

      const perRespondentRecommendations = activeRespondentIndexes.map(
        (i) => recommendations[i] || 'Pending'
      );

      const perRespondentCrimCaseNos = activeRespondentIndexes.map((i) =>
        (crimCaseNos[i] || '').trim()
      );
      const perRespondentBranches = activeRespondentIndexes.map((i) => (branches[i] || '').trim());
      const perRespondentDatesFiledInCourt = activeRespondentIndexes.map((i) =>
        (datesFiledInCourt[i] || '').trim()
      );
      const perRespondentFinalOffenses = activeRespondentIndexes.map((i) =>
        (finalOffenses[i] || '').trim()
      );

      const hasFiledInCourt = perRespondentRecommendations.some(
        (rec) => (rec || '').toLowerCase() === 'filed in court'
      );
      const hasArchived = perRespondentRecommendations.some(
        (rec) => (rec || '').toLowerCase() === 'archived'
      );

      // Send data with UPPER_CASE field names that match server schema
      const serverData = {
        DOCKET_NO: formData.DOCKET_NO,
        DATE_FILED: formData.DATE_FILED,
        COMPLAINANT: JSON.stringify(
          complainants.filter((c) => c.trim() !== '').map((c) => c.trim())
        ),
        RESPONDENT: JSON.stringify(
          respondents.filter((r) => r.name.trim() !== '').map((r) => r.name.trim())
        ),
        ADDRESS_OF_RESPONDENT: JSON.stringify(
          respondents.filter((r) => r.name.trim() !== '').map((r) => r.address.trim())
        ),
        OFFENSE: formData.OFFENSE,
        RESOLVING_PROSECUTOR: formData.RESOLVING_PROSECUTOR,
        // Optional fields
        DATE_OF_COMMISSION: formData.DATE_OF_COMMISSION || null,
        DATE_RESOLVED: formData.DATE_RESOLVED || null,
        CRIM_CASE_NO: JSON.stringify(perRespondentCrimCaseNos),
        BRANCH: JSON.stringify(perRespondentBranches),
        DATEFILED_IN_COURT: JSON.stringify(perRespondentDatesFiledInCourt),
        FINAL_OFFENSE: JSON.stringify(perRespondentFinalOffenses),
        REMARKS_DECISION: JSON.stringify(perRespondentRecommendations),
        PENALTY: formData.PENALTY || null,
        DECISION_DATE: formData.DECISION_DATE || null,
        STATUS: hasFiledInCourt
          ? 'Filed in Court'
          : hasArchived
            ? 'Archived'
            : formData.STATUS || null,
      };

      const formDataToSend = new FormData();
      Object.keys(serverData).forEach((key) => {
        const value = serverData[key as keyof typeof serverData];
        if (value !== undefined && value !== null && value !== '') {
          formDataToSend.append(key, value);
        }
      });
      if (indexCardImage) {
        formDataToSend.append('indexCardImage', indexCardImage);
      }

      const response = await axios.post(`${config.api.baseURL}/add-case`, formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      console.log(response.data);

      // Show success toast
      showToast({
        type: 'success',
        message: 'Case added successfully!',
        duration: 4000,
      });

      // Keep Manage Cases and dashboards in sync with manual case adds.
      const responseTotalRaw = Number(response?.data?.data?.totalCases || 0);
      const responseTotal =
        Number.isFinite(responseTotalRaw) && responseTotalRaw > 0 ? responseTotalRaw : 0;
      const importedTotalRaw = Number(localStorage.getItem('excelLastImportTotalRows') || 0);
      const importedTotal =
        Number.isFinite(importedTotalRaw) && importedTotalRaw > 0 ? importedTotalRaw : 0;

      let nextDisplayedTotal = 0;
      if (importedTotal > 0 && importedTotal >= responseTotal) {
        // Keep imported/display baseline monotonic when API count is lower due to dedupe/model differences.
        nextDisplayedTotal = importedTotal + 1;
      } else if (responseTotal > 0) {
        nextDisplayedTotal = responseTotal;
      } else if (importedTotal > 0) {
        nextDisplayedTotal = importedTotal + 1;
      }

      if (nextDisplayedTotal > 0) {
        localStorage.setItem('excelLastImportTotalRows', String(nextDisplayedTotal));
        localStorage.setItem('excelLastImportUpdatedAt', new Date().toISOString());
      }

      // Reset form
      setFormData({
        DOCKET_NO: '',
        DATE_FILED: '',
        COMPLAINANT: '',
        RESPONDENT: '',
        ADDRESS_OF_RESPONDENT: '',
        OFFENSE: '',
        DATE_OF_COMMISSION: '',
        DATE_RESOLVED: '',
        RESOLVING_PROSECUTOR: '',
        CRIM_CASE_NO: '',
        BRANCH: '',
        DATEFILED_IN_COURT: '',
        FINAL_OFFENSE: '',
        REMARKS_DECISION: '',
        PENALTY: '',
        DECISION_DATE: '',
        STATUS: '',
      });
      setComplainants(['']);
      setRespondents([{ name: '', address: '' }]);
      setRecommendations(['Pending']);
      setCrimCaseNos(['']);
      setBranches(['']);
      setDatesFiledInCourt(['']);
      setFinalOffenses(['']);
      removeImage();
    } catch (error: unknown) {
      console.error('Error adding case:', error);
      const axiosError = error as {
        response?: {
          status?: number;
          data?: {
            message?: string;
          };
        };
        message?: string;
      };

      // Determine detailed error message based on error type
      let errorMessage = 'Failed to add case. Please try again.';

      if (axiosError.response?.status === 409) {
        // Conflict - likely duplicate case
        errorMessage =
          axiosError.response?.data?.message ||
          'This case already exists. Please try a different docket number.';
      } else if (axiosError.response?.status === 400) {
        // Bad request - validation error from server
        errorMessage =
          axiosError.response?.data?.message ||
          'Invalid case information. Please check your inputs and try again.';
      } else if (axiosError.response?.status === 401) {
        // Unauthorized
        errorMessage = 'Your session has expired. Please login again.';
      } else if (axiosError.response?.status === 403) {
        // Forbidden
        errorMessage = 'You do not have permission to add cases.';
      } else if (axiosError.response?.status === 500) {
        // Server error
        errorMessage = 'Server error. Please try again or contact support.';
      } else if (axiosError.response?.data?.message) {
        // Use backend message if available
        errorMessage = axiosError.response.data.message;
      } else if (axiosError.message === 'Network Error') {
        // Network error
        errorMessage = 'Network error. Please check your connection and try again.';
      }

      // Show error toast
      showToast({
        type: 'error',
        message: errorMessage,
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass: string = `w-full px-3 py-2 rounded-lg border-2 bg-white/90 backdrop-blur-sm
                        border-slate-200/60 hover:border-slate-300 hover:bg-white
                        focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:bg-white
                        transition-all duration-200 outline-none text-slate-700 font-medium text-sm
                        placeholder:text-slate-400 shadow-sm hover:shadow-md`;

  const labelClass: string = `block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 p-3"
    >
      <div className="max-w-7xl mx-auto">
        {/* Compact Header */}
        <div className="text-center mb-3">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, type: 'spring' }}
            className="inline-flex items-center justify-center w-10 h-10 rounded-lg mb-2
                       bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 shadow-lg shadow-blue-500/20"
          >
            <i className="fas fa-folder-plus text-lg text-white"></i>
          </motion.div>
          <h1
            className="text-2xl md:text-3xl font-black bg-clip-text text-transparent 
                         bg-gradient-to-r from-slate-800 via-blue-900 to-slate-800 mb-1"
          >
            Add New Case
          </h1>
          <p className="text-xs font-medium text-slate-500 max-w-2xl mx-auto">
            Fill in the details to register a new case in the system
          </p>
        </div>

        {/* Compact Back Button */}
        <motion.button
          whileHover={{ x: -3, scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/admin-dashboard')}
          className="flex items-center gap-2 px-4 py-2 mb-4 rounded-lg border-2
                     bg-white/80 backdrop-blur-sm border-slate-200/60 text-slate-700
                     hover:bg-gradient-to-r hover:from-blue-500 hover:to-blue-600 hover:border-blue-500
                     hover:text-white transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer font-semibold text-sm"
        >
          <i className="fas fa-arrow-left text-sm"></i>
          <span>Back to Menu</span>
        </motion.button>

        {/* Optimized Form Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="relative rounded-2xl shadow-xl border-2 border-slate-200/40 overflow-hidden 
                     backdrop-blur-sm bg-gradient-to-br from-white via-white to-slate-50/30"
        >
          {/* Compact Top Accent */}
          <div className="h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600"></div>

          <div className="relative p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Section: Basic Information - Optimized */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 pb-2 border-b border-slate-200">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shadow-md
                                  bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600"
                  >
                    <i className="fas fa-file-alt text-white text-sm"></i>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 m-0">Basic Information</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  <div className="col-span-2">
                    <label className={labelClass}>
                      <i className="fas fa-hashtag text-blue-500"></i>
                      Docket/IS Case Number *
                    </label>
                    <input
                      type="text"
                      name="DOCKET_NO"
                      value={formData.DOCKET_NO}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="Enter docket number"
                      required
                    />
                  </div>
                  <div>
                    <label className={labelClass}>
                      <i className="fas fa-calendar text-blue-500"></i>
                      Date Filed
                    </label>
                    <input
                      type="date"
                      name="DATE_FILED"
                      value={formData.DATE_FILED}
                      onChange={handleChange}
                      className={inputClass}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelClass}>
                      <i className="fas fa-calendar-day text-orange-500"></i>
                      Date of Commission
                    </label>
                    <input
                      type="date"
                      name="DATE_OF_COMMISSION"
                      value={formData.DATE_OF_COMMISSION}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
              {/* Section: Parties Involved - Optimized */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 pb-2 border-b border-slate-200">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-md bg-gradient-to-br from-purple-500 via-purple-600 to-pink-600">
                    <i className="fas fa-users text-white text-sm"></i>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 m-0">Parties Involved</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className={labelClass}>
                      <i className="fas fa-user text-emerald-500"></i>
                      Complainant
                    </label>
                    {complainants.map((c, index) => (
                      <div key={index} className={`flex gap-2 ${index > 0 ? 'mt-2' : ''}`}>
                        <input
                          type="text"
                          value={c}
                          onChange={(e) => updateComplainant(index, e.target.value)}
                          className={inputClass}
                          placeholder={
                            index === 0 ? 'Enter complainant name' : `Complainant ${index + 1}`
                          }
                          required={index === 0}
                        />
                        {complainants.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeComplainant(index)}
                            className="w-9 h-9 flex-shrink-0 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 border-none cursor-pointer flex items-center justify-center transition-colors"
                            title="Remove complainant"
                          >
                            <i className="fas fa-minus text-xs"></i>
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addComplainant}
                      className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-white bg-green-500 hover:bg-green-600 px-3 py-1.5 rounded-lg transition-colors border-none cursor-pointer shadow-md"
                    >
                      <i className="fas fa-plus text-xs"></i>
                      Add Complainant
                    </button>
                  </div>
                  <div className="md:col-span-2">
                    <div className="flex gap-2 mb-1">
                      <div className="flex-1">
                        <label className={labelClass}>
                          <i className="fas fa-user-tag text-red-500"></i>
                          Respondent *
                        </label>
                      </div>
                      <div className="flex-1">
                        <label className={labelClass}>
                          <i className="fas fa-map-marker-alt text-red-500"></i>
                          Address of Respondent
                        </label>
                      </div>
                      <div className="w-9 flex-shrink-0"></div>
                    </div>
                    {respondents.map((r, index) => (
                      <div key={index} className={`flex gap-2 ${index > 0 ? 'mt-2' : ''}`}>
                        <input
                          type="text"
                          value={r.name}
                          onChange={(e) => updateRespondent(index, e.target.value)}
                          className={`${inputClass} flex-1`}
                          placeholder={
                            index === 0 ? 'Enter respondent name' : `Respondent ${index + 1}`
                          }
                          required={index === 0}
                        />
                        <input
                          type="text"
                          value={r.address}
                          onChange={(e) => updateRespondentAddress(index, e.target.value)}
                          className={`${inputClass} flex-1`}
                          placeholder="Enter respondent's address"
                        />
                        {respondents.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => removeRespondent(index)}
                            className="w-9 h-9 flex-shrink-0 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 border-none cursor-pointer flex items-center justify-center transition-colors"
                            title="Remove respondent"
                          >
                            <i className="fas fa-minus text-xs"></i>
                          </button>
                        ) : (
                          <div className="w-9 flex-shrink-0"></div>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addRespondent}
                      className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-white bg-green-500 hover:bg-green-600 px-3 py-1.5 rounded-lg transition-colors border-none cursor-pointer shadow-md"
                    >
                      <i className="fas fa-plus text-xs"></i>
                      Add Respondent
                    </button>
                  </div>
                </div>
              </div>
              {/* Section: Case Details - Optimized */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 pb-2 border-b border-slate-200">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-md bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600">
                    <i className="fas fa-gavel text-white text-sm"></i>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 m-0">Case Details</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="col-span-full md:col-span-1 lg:col-span-2">
                    <label className={labelClass}>
                      <i className="fas fa-exclamation-triangle text-amber-500"></i>
                      Offense
                    </label>
                    <input
                      type="text"
                      name="OFFENSE"
                      value={formData.OFFENSE}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="Describe the offense"
                      required
                    />
                  </div>
                  <div>
                    <label className={labelClass}>
                      <i className="fas fa-calendar-check text-emerald-500"></i>
                      Date Resolved
                    </label>
                    <input
                      type="date"
                      name="DATE_RESOLVED"
                      value={formData.DATE_RESOLVED}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>
                      <i className="fas fa-user-tie text-blue-500"></i>
                      Resolving Prosecutor *
                    </label>
                    <input
                      type="text"
                      name="RESOLVING_PROSECUTOR"
                      value={formData.RESOLVING_PROSECUTOR}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="Prosecutor name"
                      required
                    />
                  </div>
                </div>
              </div>
              {/* Section: Resolution & Image Upload - Optimized */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 pb-2 border-b border-slate-200">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-md bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600">
                    <i className="fas fa-clipboard-check text-white text-sm"></i>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 m-0">
                    Resolution & Image Upload
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                      <i className="fas fa-clipboard-check text-emerald-500"></i>Recommendation
                    </label>
                    <div className="space-y-2">
                      {respondents.map((r, index) => (
                        <div
                          key={`rec-${index}`}
                          className="rounded-xl border border-slate-200 p-2.5 bg-white/80"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
                            <p
                              className="m-0 text-xs font-semibold text-slate-700 truncate"
                              title={r.name || `Respondent ${index + 1}`}
                            >
                              {index + 1}. {r.name || `Respondent ${index + 1}`}
                            </p>
                            <div className="md:col-span-2">
                              <select
                                value={recommendations[index] || 'Pending'}
                                onChange={(e) => updateRecommendation(index, e.target.value)}
                                className={`${inputClass} cursor-pointer font-semibold`}
                              >
                                <option value="Pending">Pending</option>
                                <option value="Dismissed">Dismissed</option>
                                <option value="Provisional dismissal">Provisional dismissal</option>
                                <option value="Convicted">Convicted</option>
                                <option value="For Resolution">For Resolution</option>
                                <option value="Archived">Archived</option>
                                <option value="Filed in Court">Filed in Court</option>
                              </select>
                            </div>
                          </div>

                          <div className="mt-2 p-3 rounded-xl border-2 border-blue-200 bg-blue-50/50">
                            <div className="flex items-center gap-2 mb-2">
                              <i className="fas fa-landmark text-blue-500"></i>
                              <span className="text-xs font-semibold text-blue-700">
                                Court Information
                              </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              <div>
                                <label className={labelClass}>Criminal Case No.</label>
                                <input
                                  type="text"
                                  value={crimCaseNos[index] || ''}
                                  onChange={(e) => {
                                    const updated = [...crimCaseNos];
                                    updated[index] = e.target.value;
                                    setCrimCaseNos(updated);
                                  }}
                                  className={inputClass}
                                  placeholder="Case number"
                                />
                              </div>
                              <div>
                                <label className={labelClass}>Branch</label>
                                <input
                                  type="text"
                                  value={branches[index] || ''}
                                  onChange={(e) => {
                                    const updated = [...branches];
                                    updated[index] = e.target.value;
                                    setBranches(updated);
                                  }}
                                  className={inputClass}
                                  placeholder="Court branch"
                                />
                              </div>
                              <div>
                                <label className={labelClass}>Date Filed in Court</label>
                                <input
                                  type="date"
                                  value={datesFiledInCourt[index] || ''}
                                  onChange={(e) => {
                                    const updated = [...datesFiledInCourt];
                                    updated[index] = e.target.value;
                                    setDatesFiledInCourt(updated);
                                  }}
                                  className={inputClass}
                                />
                              </div>
                              <div>
                                <label className={labelClass}>Final Offense</label>
                                <input
                                  type="text"
                                  value={finalOffenses[index] || ''}
                                  onChange={(e) => {
                                    const updated = [...finalOffenses];
                                    updated[index] = e.target.value;
                                    setFinalOffenses(updated);
                                  }}
                                  className={inputClass}
                                  placeholder="Final offense"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className={labelClass}>Penalty</label>
                      <input
                        type="text"
                        name="PENALTY"
                        value={formData.PENALTY}
                        onChange={handleChange}
                        className={inputClass}
                        placeholder="Penalty imposed"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Decision Date</label>
                      <input
                        type="date"
                        name="DECISION_DATE"
                        value={formData.DECISION_DATE}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="col-span-full">
                    <label className={labelClass}>
                      <i className="fas fa-image text-blue-500"></i>
                      Index Card Image
                    </label>
                    <div className="space-y-2">
                      {!imagePreview ? (
                        <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-slate-300 rounded-lg hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-200 cursor-pointer group">
                          <div className="flex items-center justify-center gap-2">
                            <i className="fas fa-cloud-upload-alt text-lg text-slate-400 group-hover:text-blue-500 transition-colors"></i>
                            <p className="text-xs text-slate-500 group-hover:text-blue-600 font-medium">
                              Click to upload image
                            </p>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/png,image/jpeg,image/jpg"
                            onChange={handleImageChange}
                          />
                        </label>
                      ) : (
                        <div className="relative">
                          <img
                            src={imagePreview}
                            alt="Index Card Preview"
                            onClick={() => setShowFullImage(true)}
                            className="w-full h-20 object-cover rounded-lg border-2 border-slate-200 cursor-pointer hover:opacity-90 transition-opacity"
                          />
                          <button
                            type="button"
                            onClick={removeImage}
                            className="absolute top-1 right-1 px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded shadow-md transition-colors cursor-pointer"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              {/* Compact Submit Button */}
              <div className="pt-4 border-t border-slate-200">
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className={`w-full py-3 rounded-lg font-semibold text-base shadow-lg transition-all duration-200 border-none cursor-pointer flex items-center justify-center gap-2 ${
                    isLoading
                      ? 'bg-slate-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-emerald-500/30 hover:shadow-emerald-500/50'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <i className="fas fa-plus-circle"></i>
                      <span>Submit New Case</span>
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </div>
        </motion.div>

        {/* Fullscreen Image Modal */}
        {showFullImage && imagePreview && (
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
              className="absolute top-4 right-4 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer border-2 border-white/30 z-10"
            >
              <i className="fas fa-times text-2xl"></i>
            </button>
            <motion.img
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              src={imagePreview}
              alt="Full Size Preview"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default Newcase;
