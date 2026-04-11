import React, { useState, useContext, ChangeEvent, useEffect, useRef } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { ThemeContext } from '../App';
import { motion } from 'framer-motion';
import { Button, Alert, Card } from '../components/ui';
import config from '../config';

interface ThemeContextType {
  isDark: boolean;
}

type MessageType = 'success' | 'error' | 'info' | '';
type UploadPhase = 'idle' | 'uploading' | 'success' | 'error';

interface ExcelSyncProps {
  isDark?: boolean;
}

interface ExcelUploadResponse {
  success?: boolean;
  message?: string;
  mode?: 'replace' | 'merge' | string;
  totalRows?: number;
  rowsInserted?: number;
  added?: number;
  updated?: number;
  skippedRows?: number;
  warnings?: string[];
}

/**
 * ExcelSync Component
 * Handles downloading and uploading Excel files for case management
 */
const ExcelSync: React.FC<ExcelSyncProps> = () => {
  const themeContext = useContext(ThemeContext) as ThemeContextType | null;
  const isDark = themeContext?.isDark ?? false;

  // State management
  const [uploading, setUploading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<MessageType>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [columnErrors, setColumnErrors] = useState<string[]>([]);
  const [validatingColumns, setValidatingColumns] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>('idle');

  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearProgressTimers = (): void => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    if (progressResetTimeoutRef.current) {
      clearTimeout(progressResetTimeoutRef.current);
      progressResetTimeoutRef.current = null;
    }
  };

  const startProgressSimulation = (): void => {
    clearProgressTimers();
    setUploadProgress(8);

    progressIntervalRef.current = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 92) {
          return prev;
        }
        const next = prev + Math.random() * 8 + 2;
        return Math.min(next, 92);
      });
    }, 220);
  };

  useEffect(() => {
    return () => {
      clearProgressTimers();
    };
  }, []);

  const buildImportSuccessMessage = (data: ExcelUploadResponse): string => {
    const totalRows = Number(data.totalRows ?? 0);
    const skippedRows = Number(data.skippedRows ?? 0);
    const validRows = Math.max(totalRows - skippedRows, 0);
    const inserted = Number(data.rowsInserted ?? data.added ?? 0);
    const updated = Number(data.updated ?? 0);
    const isReplaceMode = String(data.mode || '').toLowerCase() === 'replace';

    if (isReplaceMode) {
      return `Import completed successfully. Current website data was replaced with ${validRows || inserted || updated} case row(s) from the Excel file.`;
    }

    if (validRows > 0) {
      return `Import completed successfully. ${validRows} valid rows uploaded (excluding rows without docket).`;
    }

    if (inserted === 0 && updated === 0) {
      return 'Import completed successfully. No new changes found.';
    }

    return `Import completed successfully. ${inserted} inserted, ${updated} updated.`;
  };

  const getProcessedRowsFromResponse = (data: ExcelUploadResponse): number => {
    const totalRows = Number(data.totalRows ?? 0);
    const skippedRows = Number(data.skippedRows ?? 0);
    const validRows = Math.max(totalRows - skippedRows, 0);
    if (validRows > 0) {
      return validRows;
    }

    const inserted = Number(data.rowsInserted ?? data.added ?? 0);
    const updated = Number(data.updated ?? 0);
    const structuredTotal = inserted + updated;
    if (structuredTotal > 0) {
      return structuredTotal;
    }

    const messageText = String(data.message || '');
    const validRowsMatch = messageText.match(/(\d+)\s*valid\s*rows?/i);
    const fromRowsMatch = messageText.match(/from\s+(\d+)\s+rows?\s*\((\d+)\s+skipped\)/i);
    const insertedMatch = messageText.match(/(\d+)\s*(?:rows?\s*)?inserted/i);
    const updatedMatch = messageText.match(/(\d+)\s*updated/i);
    const parsedValidRows = Number(validRowsMatch?.[1] || 0);
    if (parsedValidRows > 0) {
      return parsedValidRows;
    }

    const parsedFromRows = Number(fromRowsMatch?.[1] || 0);
    const parsedSkippedRows = Number(fromRowsMatch?.[2] || 0);
    const parsedFromValidRows = Math.max(parsedFromRows - parsedSkippedRows, 0);
    if (parsedFromValidRows > 0) {
      return parsedFromValidRows;
    }

    const parsedInserted = Number(insertedMatch?.[1] || 0);
    const parsedUpdated = Number(updatedMatch?.[1] || 0);

    return parsedInserted + parsedUpdated;
  };

  // Expected column names constant
  const expectedColumns: string[] = [
    'Docket No',
    'Date Filed',
    'Complainant',
    'Respondent',
    'Address of Respondent',
    'Offense',
    'Date of Commission',
    'Date Resolved',
    'Resolving Prosecutor',
    'MR DATE FILED(mm/dd/yyyy)',
    'MR DATE RESOLVED (mm/dd/yyyy)',
    'MR STATUS',
    'Criminal Case No',
    'Branch',
    'Date Filed in Court',
    'Final Offense',
    'Remarks Decision',
    'Penalty',
    'Decision Date',
    'Index Cards',
  ];

  /**
   * Calculate Levenshtein distance between two strings
   * Used for fuzzy matching column names
   */
  const calculateDistance = (a: string, b: string): number => {
    const matrix: number[][] = [];

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

  /**
   * Find closest matching column name using Levenshtein distance
   */
  const findClosestMatch = (wrongName: string): string | null => {
    const normalized = wrongName.toLowerCase().trim();

    let closest: string | null = null;
    let minDistance = Infinity;

    expectedColumns.forEach((col) => {
      const distance = calculateDistance(normalized, col.toLowerCase());

      if (distance < minDistance) {
        minDistance = distance;
        closest = col;
      }
    });

    return minDistance <= 3 ? closest : null;
  };

  /**
   * Download Excel file with all current cases
   */
  const handleDownload = async (): Promise<void> => {
    try {
      setMessage('Generating Excel file...');
      setMessageType('info');

      const response = await axios.get(`${config.api.baseURL}/api/excel/download`, {
        responseType: 'blob',
        timeout: config.api.timeout,
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'cases.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setMessage('Excel file downloaded successfully!');
      setMessageType('success');
    } catch (error) {
      console.error('Error downloading Excel:', error);
      const errorMessage =
        error instanceof axios.AxiosError
          ? error.response?.data?.error || error.message
          : 'Unknown error occurred';

      setMessage(`Error downloading Excel file: ${errorMessage}`);
      setMessageType('error');
    }
  };

  /**
   * Validate and handle file selection
   */
  const handleFileSelect = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

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
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      const headers = (jsonData[0] as string[]) || [];

      const errors: string[] = [];
      const normalizedExpected = expectedColumns.map((col) => col.toLowerCase().trim());

      // Validate each header
      headers.forEach((header: string) => {
        const normalizedHeader = String(header).toLowerCase().trim();

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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      setMessage(`Error reading Excel file: ${errorMessage}`);
      setMessageType('error');
      setSelectedFile(null);
      event.target.value = '';
    } finally {
      setValidatingColumns(false);
    }
  };

  /**
   * Upload and process Excel file
   */
  const handleUpload = async (): Promise<void> => {
    if (!selectedFile) {
      return;
    }

    setUploading(true);
    setUploadPhase('uploading');
    startProgressSimulation();
    setMessage('Uploading and processing Excel file...');
    setMessageType('info');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await axios.post<ExcelUploadResponse>(`${config.api.baseURL}/api/excel/upload?replace=true`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 0,
        onUploadProgress: (progressEvent) => {
          if (!progressEvent.total) {
            return;
          }
          const networkProgress = Math.round((progressEvent.loaded / progressEvent.total) * 75);
          setUploadProgress((prev) => Math.max(prev, Math.min(networkProgress + 10, 92)));
        },
      });

      clearProgressTimers();
      setUploadProgress(100);
      setUploadPhase('success');

      const processedRows = getProcessedRowsFromResponse(response.data || {});
      if (processedRows > 0) {
        localStorage.setItem('excelLastImportTotalRows', String(processedRows));
        localStorage.setItem('excelLastImportUpdatedAt', new Date().toISOString());
      }

      setMessage(buildImportSuccessMessage(response.data || {}));
      setMessageType('success');

      setSelectedFile(null);
      progressResetTimeoutRef.current = setTimeout(() => {
        setUploadPhase('idle');
        setUploadProgress(0);
      }, 2200);
    } catch (error) {
      clearProgressTimers();
      setUploadPhase('error');
      setUploadProgress(0);
      console.error('Error uploading Excel:', error);
      const errorMessage =
        error instanceof axios.AxiosError
          ? error.response?.data?.error || error.message
          : 'Unknown error occurred';

      setMessage(`Error uploading Excel file: ${errorMessage}`);
      setMessageType('error');
    } finally {
      setUploading(false);
    }
  };

  /**
   * Cancel file selection
   */
  const handleCancelFile = (): void => {
    setSelectedFile(null);
    setMessage('');
    setColumnErrors([]);

    const fileInput = document.getElementById('excelUpload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
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
            className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${
              isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'
            }`}
          >
            <i
              className={`fas fa-file-excel text-3xl ${
                isDark ? 'text-emerald-400' : 'text-emerald-600'
              }`}
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
          <Alert
            type={messageType as 'success' | 'error' | 'info' | 'warning'}
            message={message}
            onClose={() => setMessage('')}
          />
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
          </motion.div>
        )}

        {/* Main Cards Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Download Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card isDark={isDark}>
              <div
                className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${
                  isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'
                }`}
              >
                <i
                  className={`fas fa-download text-xl ${
                    isDark ? 'text-emerald-400' : 'text-emerald-600'
                  }`}
                ></i>
              </div>
              <h2 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                Download Cases
              </h2>
              <p className={`text-sm mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Export all cases from the database as an Excel file for editing offline.
              </p>
              <Button
                variant="success"
                size="lg"
                onClick={handleDownload}
                className="w-full"
                icon={<i className="fas fa-file-download"></i>}
              >
                Download Excel
              </Button>
            </Card>
          </motion.div>

          {/* Upload Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card isDark={isDark}>
              <div
                className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${
                  isDark ? 'bg-blue-500/20' : 'bg-blue-100'
                }`}
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
                  className={`w-full py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                    validatingColumns ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
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
                    className={`flex items-center justify-between p-3 rounded-xl border ${
                      isDark ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <i className="fas fa-file-excel text-2xl text-emerald-500"></i>
                      <div>
                        <p
                          className={`font-medium text-sm ${
                            isDark ? 'text-white' : 'text-slate-700'
                          }`}
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
                      aria-label="Remove file"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                  <Button
                    variant="success"
                    size="lg"
                    onClick={handleUpload}
                    disabled={uploading}
                    isLoading={uploading}
                    className="w-full"
                    icon={<i className="fas fa-cloud-upload-alt"></i>}
                  >
                    Upload to Database
                  </Button>

                  {uploadPhase !== 'idle' && (
                    <div className="space-y-1">
                      <p className={`text-sm font-semibold ${uploadPhase === 'success' ? 'text-green-600' : isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        {uploadPhase === 'success' ? 'Upload complete!' : 'Loading...'}
                      </p>
                      <div className={`h-3 rounded-full overflow-hidden ${isDark ? 'bg-slate-600' : 'bg-slate-200'}`}>
                        <motion.div
                          className={`h-full rounded-full ${uploadPhase === 'success' ? 'bg-green-500' : 'bg-green-500'}`}
                          animate={{ width: `${uploadProgress}%` }}
                          transition={{ duration: uploadPhase === 'success' ? 0.25 : 0.35, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  )}
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
            </Card>
          </motion.div>
        </div>

        {/* Quick Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card isDark={isDark}>
            <h3
              className={`text-lg font-bold mb-4 flex items-center gap-2 ${
                isDark ? 'text-white' : 'text-slate-800'
              }`}
            >
              <i className={`fas fa-info-circle ${isDark ? 'text-blue-400' : 'text-blue-500'}`}></i>
              Quick Tips
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isDark
                        ? 'bg-sky-500/20 text-sky-400'
                        : 'bg-sky-100 text-sky-600'
                    }`}
                  >
                    <i className="fas fa-download text-sm"></i>
                  </div>
                  <div>
                    <p
                      className={`font-semibold text-sm ${
                        isDark ? 'text-white' : 'text-slate-700'
                      }`}
                    >
                      Download Reports
                    </p>
                    <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Export case data to Excel for reporting, analysis, or record-keeping
                    </p>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-600'
                    }`}
                  >
                    <i className="fas fa-tasks text-sm"></i>
                  </div>
                  <div>
                    <p
                      className={`font-semibold text-sm ${
                        isDark ? 'text-white' : 'text-slate-700'
                      }`}
                    >
                      Manage Case Status
                    </p>
                    <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Mark cases as Pending, Dismissed, or Convicted to track case progress
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
              <h4 className={`font-bold text-sm mb-3 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                Required Columns
              </h4>
              <div className="flex flex-wrap gap-2">
                {expectedColumns.map((col, idx) => (
                  <span
                    key={idx}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                      isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {col}
                  </span>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default ExcelSync;
