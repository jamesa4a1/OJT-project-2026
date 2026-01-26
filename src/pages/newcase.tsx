import React, { useState, FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useValidation } from '../hooks/useValidation';
import { CaseCreateSchema } from '../schemas/cases';
import Alert from '../components/ui/Alert';

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
  REMARKS_DECISION: string;
  PENALTY: string;
}

const Newcase: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [indexCardImage, setIndexCardImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showFullImage, setShowFullImage] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const { validate, errors: validationErrors } = useValidation(CaseCreateSchema);

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
    CRIM_CASE_NO: 'N/A',
    BRANCH: '',
    DATEFILED_IN_COURT: 'N/A',
    REMARKS_DECISION: '',
    PENALTY: '',
  });

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ): void => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name.toUpperCase()]: value } as CaseFormData);
    setError('');
    setSuccess('');
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
    setError('');
    setSuccess('');

    try {
      // Validate with Zod
      const validatedData = await validate(formData);
      if (!validatedData.success) {
        setIsLoading(false);
        return;
      }

      const formDataToSend = new FormData();
      Object.keys(validatedData.data as any).forEach((key) => {
        formDataToSend.append(key, (validatedData.data as any)[key]);
      });
      if (indexCardImage) {
        formDataToSend.append('indexCardImage', indexCardImage);
      }

      const response = await axios.post('http://localhost:5000/add-case', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      console.log(response.data);
      setSuccess('Case added successfully!');

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
        CRIM_CASE_NO: 'N/A',
        BRANCH: '',
        DATEFILED_IN_COURT: 'N/A',
        REMARKS_DECISION: '',
        PENALTY: '',
      });
      removeImage();

      // Navigate after short delay
      setTimeout(() => {
        navigate('/caselist');
      }, 1500);
    } catch (error: any) {
      console.error('Error adding case:', error);
      const errorMessage = error.response?.data?.message || 'Failed to add case. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass: string = `w-full px-4 py-2.5 rounded-xl border-2 bg-white/80 backdrop-blur-sm
                        border-slate-200/60 hover:border-slate-300 hover:bg-white
                        focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white
                        transition-all duration-300 outline-none text-slate-700 font-medium
                        placeholder:text-slate-400 shadow-sm hover:shadow-md`;

  const labelClass: string = `block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-2`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 p-6"
    >
      <div className="max-w-5xl mx-auto">
        {/* Enhanced Header with Gradient Badge */}
        <div className="text-center mb-4">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-2.5
                       bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 shadow-lg shadow-blue-500/20"
          >
            <i className="fas fa-folder-plus text-xl text-white"></i>
          </motion.div>
          <h1 className="text-3xl md:text-4xl font-black bg-clip-text text-transparent 
                         bg-gradient-to-r from-slate-800 via-blue-900 to-slate-800 mb-2">
            Add New Case
          </h1>
          <p className="text-sm font-medium text-slate-500 max-w-2xl mx-auto">
            Fill in the details below to register a new case in the system
          </p>
        </div>

        {/* Enhanced Back Button */}
        <motion.button
          whileHover={{ x: -5, scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/admin-dashboard')}
          className="flex items-center gap-3 px-5 py-2.5 mb-6 rounded-2xl border-2
                     bg-white/80 backdrop-blur-sm border-slate-200/60 text-slate-700
                     hover:bg-gradient-to-r hover:from-blue-500 hover:to-blue-600 hover:border-blue-500
                     hover:text-white transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer font-bold"
        >
          <i className="fas fa-arrow-left text-lg"></i>
          <span>Back to Menu</span>
        </motion.button>

        {/* Enhanced Form Card with Gradient Top Border */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="relative rounded-3xl shadow-2xl border-2 border-slate-200/40 overflow-hidden 
                     backdrop-blur-sm bg-gradient-to-br from-white via-white to-slate-50/30"
        >
          {/* Gradient Top Accent */}
          <div className="h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600"></div>
          
          {/* Decorative Background Elements */}
          <div className="absolute top-20 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-full blur-3xl -mr-48"></div>
          <div className="absolute bottom-20 left-0 w-96 h-96 bg-gradient-to-tr from-emerald-500/5 to-teal-500/5 rounded-full blur-3xl -ml-48"></div>
          
          <div className="relative p-8">
            {/* Success Alert */}
            {success && <Alert type="success" message={success} className="mb-6" />}

            {/* Error Alert */}
            {error && <Alert type="error" message={error} className="mb-6" />}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Section: Basic Information - Enhanced */}
              <div className="space-y-4">
                <div className="flex items-center gap-4 pb-3 border-b-2 border-gradient-to-r from-blue-500/30 via-blue-500/20 to-transparent">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg
                                  bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 shadow-blue-500/30">
                    <i className="fas fa-file-alt text-white"></i>
                  </div>
                  <h3 className="text-xl font-black text-slate-800 m-0">Basic Information</h3>
                </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    <i className="fas fa-hashtag text-blue-500 mr-2"></i>
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
                    <i className="fas fa-calendar text-blue-500 mr-2"></i>
                    Date Filed
                  </label>
                  <input
                    type="date"
                    name="DATE_FILED"
                    value={formData.DATE_FILED}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
            {/* Section: Parties Involved - Enhanced */}
            <div className="space-y-4">
              <div className="flex items-center gap-4 pb-3 border-b-2 border-violet-200">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg
                                bg-gradient-to-br from-purple-500 via-purple-600 to-pink-600 shadow-purple-500/30">
                  <i className="fas fa-users text-white"></i>
                </div>
                <h3 className="text-xl font-black text-slate-800 m-0">Parties Involved</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    <i className="fas fa-user text-emerald-500 mr-2"></i>
                    Complainant
                  </label>
                  <input
                    type="text"
                    name="COMPLAINANT"
                    value={formData.COMPLAINANT}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Enter complainant name"
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    <i className="fas fa-user-tag text-red-500 mr-2"></i>
                    Respondent *
                  </label>
                  <input
                    type="text"
                    name="RESPONDENT"
                    value={formData.RESPONDENT}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Enter respondent name"
                    required
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>
                  <i className="fas fa-map-marker-alt text-red-500 mr-2"></i>
                  Address of Respondent
                </label>
                <input
                  type="text"
                  name="ADDRESS_OF_RESPONDENT"
                  value={formData.ADDRESS_OF_RESPONDENT}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Enter respondent's address"
                />
              </div>
            </div>
            {/* Section: Case Details - Enhanced */}
            <div className="space-y-4">
              <div className="flex items-center gap-4 pb-3 border-b-2 border-amber-200">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg
                                bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 shadow-amber-500/30">
                  <i className="fas fa-gavel text-white"></i>
                </div>
                <h3 className="text-xl font-black text-slate-800 m-0">Case Details</h3>
              </div>

              <div>
                <label className={labelClass}>
                  <i className="fas fa-exclamation-triangle text-amber-500 mr-2"></i>
                  Offense
                </label>
                <input
                  type="text"
                  name="OFFENSE"
                  value={formData.OFFENSE}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Describe the offense"
                />
              </div>

              <div>
                <label className={labelClass}>
                  <i className="fas fa-calendar-day text-orange-500 mr-2"></i>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    <i className="fas fa-calendar-check text-emerald-500 mr-2"></i>
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
                    <i className="fas fa-user-tie text-blue-500 mr-2"></i>
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
            {/* Section: Court Information - Enhanced */}
            <div className="space-y-4">
              <div className="flex items-center gap-4 pb-3 border-b-2 border-slate-300">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg
                                bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800 shadow-slate-500/30">
                  <i className="fas fa-landmark text-white"></i>
                </div>
                <h3 className="text-xl font-black text-slate-800 m-0">Court Information</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Criminal Case No.</label>
                  <input
                    type="text"
                    name="CRIM_CASE_NO"
                    value={formData.CRIM_CASE_NO}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Case number"
                  />
                </div>
                <div>
                  <label className={labelClass}>Branch</label>
                  <input
                    type="text"
                    name="BRANCH"
                    value={formData.BRANCH}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Court branch"
                  />
                </div>
                <div>
                  <label className={labelClass}>Date Filed in Court</label>
                  <input
                    type="date"
                    name="DATEFILED_IN_COURT"
                    value={formData.DATEFILED_IN_COURT}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
            {/* Section: Resolution - Enhanced */}
            <div className="space-y-4">
              <div className="flex items-center gap-4 pb-3 border-b-2 border-emerald-200">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg
                                bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 shadow-emerald-500/30">
                  <i className="fas fa-clipboard-check text-white"></i>
                </div>
                <h3 className="text-xl font-black text-slate-800 m-0">Resolution & Remarks</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Remarks Decision</label>
                  <select
                    name="REMARKS_DECISION"
                    value={formData.REMARKS_DECISION || 'Pending'}
                    onChange={handleChange}
                    className={`${inputClass} cursor-pointer font-bold`}
                    required
                  >
                    <option value="Pending">Pending</option>
                    <option value="Dismissed">Dismissed</option>
                    <option value="Convicted">Convicted</option>
                  </select>
                </div>
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
              </div>

              <div>
                <label className={labelClass}>
                  <i className="fas fa-image text-blue-500 mr-2"></i>
                  Index Card Image
                </label>
                <div className="space-y-3">
                  {!imagePreview ? (
                    <label
                      className="flex flex-col items-center justify-center w-full h-32 
                                                             border-2 border-dashed border-slate-300 rounded-xl 
                                                             hover:border-blue-500 hover:bg-blue-50/50 
                                                             transition-all duration-300 cursor-pointer group"
                    >
                      <div className="flex flex-col items-center justify-center">
                        <i
                          className="fas fa-cloud-upload-alt text-3xl text-slate-400 
                                                                group-hover:text-blue-500 mb-2 transition-colors"
                        ></i>
                        <p className="text-sm text-slate-500 group-hover:text-blue-600 font-medium">
                          Click to upload index card image
                        </p>
                        <p className="text-xs text-slate-400 mt-1">PNG, JPG, JPEG (Max 5MB)</p>
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
                        className="w-full h-48 object-cover rounded-xl border-2 border-slate-200 cursor-pointer hover:opacity-90 transition-opacity"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 px-3 py-2 
                                                                 bg-red-500 hover:bg-red-600 text-white 
                                                                 rounded-lg shadow-lg transition-colors cursor-pointer z-10"
                      >
                        <i className="fas fa-times mr-1"></i> Remove
                      </button>
                      <div className="absolute bottom-2 left-2 px-3 py-1.5 bg-black/60 text-white text-xs rounded-lg">
                        <i className="fas fa-search-plus mr-1"></i> Click to view full size
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Submit Button */}
            <div className="pt-6 border-t border-slate-200">
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full py-4 rounded-xl font-semibold text-lg
                                               shadow-lg transition-all duration-300 border-none cursor-pointer
                                               flex items-center justify-center gap-3
                                               ${
                                                 isLoading
                                                   ? 'bg-slate-400 cursor-not-allowed'
                                                   : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-emerald-500/30 hover:shadow-emerald-500/50'
                                               }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
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
            className="absolute top-4 right-4 w-12 h-12 bg-white/10 hover:bg-white/20 
                                         text-white rounded-full flex items-center justify-center 
                                         transition-all duration-300 cursor-pointer border-2 border-white/30 z-10"
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
