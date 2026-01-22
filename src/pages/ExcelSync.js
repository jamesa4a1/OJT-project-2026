import React, { useState, useContext } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { ThemeContext } from '../App';
import { motion } from 'framer-motion';

const ExcelSync = () => {
  const { isDark } = useContext(ThemeContext) || { isDark: false };
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  const [selectedFile, setSelectedFile] = useState(null);
  const [columnErrors, setColumnErrors] = useState([]);
  const [validatingColumns, setValidatingColumns] = useState(false);

  // Expected column names
  const expectedColumns = [
    'ID',
    'Docket No',
    'Date Filed',
    'Complainant',
    'Respondent',
    'Address of Respondent',
    'Offense',
    'Date of Commission',
    'Date Resolved',
    'Resolving Prosecutor',
    'Criminal Case No',
    'Branch',
    'Date Filed in Court',
    'Remarks Decision',
    'Penalty',
    'Index Cards',
  ];

  // Download Excel file with all current cases
  const handleDownload = async () => {
    try {
      setMessage('Generating Excel file...');
      setMessageType('info');

      const response = await axios.get('http://localhost:5000/api/excel/download', {
        responseType: 'blob',
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'cases.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();

      setMessage('Excel file downloaded successfully!');
      setMessageType('success');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error downloading Excel:', error);
      setMessage('Error downloading Excel file: ' + (error.response?.data?.error || error.message));
      setMessageType('error');
    }
  };

  // Upload Excel file to update database
  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file type
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setMessage('Please upload a valid Excel file (.xlsx or .xls)');
      setMessageType('error');
      setColumnErrors([]);
      event.target.value = '';
      return;
    }

    setValidatingColumns(true);
    setMessage('Validating column names...');
    setMessageType('info');
    setColumnErrors([]);

    try {
      // Read Excel file
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Get column headers (first row)
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      const headers = jsonData[0] || [];

      // Validate columns
      const errors = [];
      const normalizedExpected = expectedColumns.map((col) => col.toLowerCase().trim());

      // Function to find the closest matching column name
      const findClosestMatch = (wrongName) => {
        const normalized = wrongName.toLowerCase().trim();

        // Calculate Levenshtein distance to find closest match
        const calculateDistance = (a, b) => {
          const matrix = [];
          for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
          }
          for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
          }
          for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
              if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
              } else {
                matrix[i][j] = Math.min(
                  matrix[i - 1][j - 1] + 1,
                  matrix[i][j - 1] + 1,
                  matrix[i - 1][j] + 1
                );
              }
            }
          }
          return matrix[b.length][a.length];
        };

        let closest = null;
        let minDistance = Infinity;

        expectedColumns.forEach((col) => {
          const distance = calculateDistance(normalized, col.toLowerCase());
          if (distance < minDistance) {
            minDistance = distance;
            closest = col;
          }
        });

        // Only suggest if it's reasonably close (distance <= 3)
        return minDistance <= 3 ? closest : null;
      };

      headers.forEach((header, index) => {
        const normalizedHeader = String(header).toLowerCase().trim();

        // Check if column exists in expected columns
        if (!normalizedExpected.includes(normalizedHeader)) {
          const closestMatch = findClosestMatch(normalizedHeader);

          if (closestMatch) {
            errors.push(`Column "${header}" is wrong name, use "${closestMatch}" instead.`);
          } else {
            errors.push(`Column "${header}" is not a valid column name.`);
          }
        }
      });

      // Check for required columns
      const requiredColumns = ['Docket No', 'Complainant', 'Respondent'];
      requiredColumns.forEach((required) => {
        const found = headers.some(
          (h) => String(h).toLowerCase().trim() === required.toLowerCase().trim()
        );
        if (!found) {
          errors.push(`Required column "${required}" is missing.`);
        }
      });

      if (errors.length > 0) {
        setColumnErrors(errors);
        setMessage('❌ Column validation failed! Please fix the errors below.');
        setMessageType('error');
        setSelectedFile(null);
        event.target.value = '';
      } else {
        setSelectedFile(file);
        setMessage('✅ Column validation passed! Ready to upload.');
        setMessageType('success');
      }
    } catch (error) {
      setMessage('Error reading Excel file: ' + error.message);
      setMessageType('error');
      setSelectedFile(null);
      event.target.value = '';
    } finally {
      setValidatingColumns(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setMessage('Uploading and processing Excel file...');
    setMessageType('info');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await axios.post('http://localhost:5000/api/excel/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setMessage(response.data.message);
      setMessageType('success');

      if (response.data.warnings && response.data.warnings.length > 0) {
        const warningMessage = '\n\nWarnings:\n' + response.data.warnings.join('\n');
        setMessage(response.data.message + warningMessage);
      }

      if (response.data.errors && response.data.errors.length > 0) {
        console.warn('Import errors:', response.data.errors);
      }

      // Clear selection
      setSelectedFile(null);

      setTimeout(() => setMessage(''), 5000);
    } catch (error) {
      console.error('Error uploading Excel:', error);
      setMessage('Error uploading Excel file: ' + (error.response?.data?.error || error.message));
      setMessageType('error');
    } finally {
      setUploading(false);
    }
  };

  const handleCancelFile = () => {
    setSelectedFile(null);
    setMessage('');
    setColumnErrors([]);
    // Reset file input
    const fileInput = document.getElementById('excelUpload');
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div
            className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}
          >
            <i
              className={`fas fa-file-excel text-3xl ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}
            ></i>
          </div>
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
            Excel Sync
          </h1>
          <p className={`text-base ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Import and export cases using Excel files
          </p>
        </motion.div>

        {/* Status Message */}
        {message && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`mb-6 p-4 rounded-xl text-center font-medium ${
              messageType === 'success'
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                : messageType === 'error'
                  ? 'bg-red-100 text-red-700 border border-red-200'
                  : 'bg-blue-100 text-blue-700 border border-blue-200'
            }`}
          >
            {message}
          </motion.div>
        )}

        {/* Column Errors */}
        {columnErrors.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 p-5 rounded-xl bg-amber-50 border border-amber-200"
          >
            <h4 className="text-amber-700 font-bold mb-3 flex items-center gap-2">
              <i className="fas fa-exclamation-triangle"></i>
              Column Errors Found
            </h4>
            <ul className="space-y-2">
              {columnErrors.map((error, index) => (
                <li key={index} className="text-amber-700 text-sm flex items-center gap-2">
                  <i className="fas fa-times-circle text-red-500"></i>
                  {error}
                </li>
              ))}
            </ul>
            <div className="mt-4 p-3 bg-white rounded-lg text-sm text-amber-700 flex items-center gap-2">
              <i className="fas fa-lightbulb text-amber-500"></i>
              <span>
                <strong>Tip:</strong> Download the template to see correct column names.
              </span>
            </div>
          </motion.div>
        )}

        {/* Main Cards Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Download Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} shadow-sm`}
          >
            <div
              className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}
            >
              <i
                className={`fas fa-download text-xl ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}
              ></i>
            </div>
            <h2 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
              Download Cases
            </h2>
            <p className={`text-sm mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Export all cases from the database as an Excel file for editing offline.
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDownload}
              className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <i className="fas fa-file-download"></i>
              Download Excel
            </motion.button>
          </motion.div>

          {/* Upload Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} shadow-sm`}
          >
            <div
              className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}
            >
              <i
                className={`fas fa-upload text-xl ${isDark ? 'text-blue-400' : 'text-blue-600'}`}
              ></i>
            </div>
            <h2 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
              Upload Cases
            </h2>
            <p className={`text-sm mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Import cases from an Excel file to add or update records in the database.
            </p>

            {!selectedFile ? (
              <label
                htmlFor="excelUpload"
                className={`w-full py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer ${validatingColumns ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {validatingColumns ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Validating...
                  </>
                ) : (
                  <>
                    <i className="fas fa-file-upload"></i>
                    Choose File
                  </>
                )}
              </label>
            ) : (
              <div className="space-y-3">
                <div
                  className={`flex items-center justify-between p-3 rounded-xl border ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-200'}`}
                >
                  <div className="flex items-center gap-3">
                    <i className="fas fa-file-excel text-2xl text-emerald-500"></i>
                    <div>
                      <p
                        className={`font-medium text-sm ${isDark ? 'text-white' : 'text-slate-700'}`}
                      >
                        {selectedFile.name}
                      </p>
                      <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleCancelFile}
                    disabled={uploading}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-red-500 hover:bg-red-600 text-white text-sm transition-colors"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleUpload}
                  disabled={uploading}
                  className={`w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 ${uploading ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  {uploading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-cloud-upload-alt"></i>
                      Upload to Database
                    </>
                  )}
                </motion.button>
              </div>
            )}
            <input
              id="excelUpload"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              disabled={validatingColumns}
              className="hidden"
            />
          </motion.div>
        </div>

        {/* Quick Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} shadow-sm`}
        >
          <h3
            className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}
          >
            <i className={`fas fa-info-circle ${isDark ? 'text-blue-400' : 'text-blue-500'}`}></i>
            Quick Tips
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
              <div className="flex items-start gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}
                >
                  <i className="fas fa-plus text-sm"></i>
                </div>
                <div>
                  <p
                    className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-700'}`}
                  >
                    Add New Cases
                  </p>
                  <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Leave the "ID" column empty for new rows
                  </p>
                </div>
              </div>
            </div>
            <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
              <div className="flex items-start gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}
                >
                  <i className="fas fa-sync text-sm"></i>
                </div>
                <div>
                  <p
                    className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-700'}`}
                  >
                    Update Existing
                  </p>
                  <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Keep the ID to match existing records
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Required Columns */}
          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
            <h4 className={`font-bold text-sm mb-3 ${isDark ? 'text-white' : 'text-slate-800'}`}>
              Required Columns
            </h4>
            <div className="flex flex-wrap gap-2">
              {expectedColumns.map((col, idx) => (
                <span
                  key={idx}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}
                >
                  {col}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ExcelSync;
