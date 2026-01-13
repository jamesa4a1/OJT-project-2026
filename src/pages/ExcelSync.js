import React, { useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import '../styles/button.css';

const ExcelSync = () => {
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
    'Index Cards'
  ];

  // Download Excel file with all current cases
  const handleDownload = async () => {
    try {
      setMessage('Generating Excel file...');
      setMessageType('info');

      const response = await axios.get('http://localhost:5000/api/excel/download', {
        responseType: 'blob'
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
      const normalizedExpected = expectedColumns.map(col => col.toLowerCase().trim());
      
      headers.forEach((header, index) => {
        const normalizedHeader = String(header).toLowerCase().trim();
        
        // Check if column exists in expected columns
        if (!normalizedExpected.includes(normalizedHeader)) {
          // Find closest match for better error message
          let suggestion = '';
          
          if (normalizedHeader.includes('filing') || normalizedHeader.includes('file')) {
            suggestion = ' Did you mean "Date Filed"?';
          } else if (normalizedHeader === 'respondents') {
            suggestion = ' Did you mean "Respondent"?';
          } else if (normalizedHeader === 'complainants') {
            suggestion = ' Did you mean "Complainant"?';
          } else if (normalizedHeader === 'offenses') {
            suggestion = ' Did you mean "Offense"?';
          }
          
          errors.push(`Column "${header}" is not a correct column name.${suggestion}`);
        }
      });

      // Check for required columns
      const requiredColumns = ['Docket No', 'Complainant', 'Respondent'];
      requiredColumns.forEach(required => {
        const found = headers.some(h => 
          String(h).toLowerCase().trim() === required.toLowerCase().trim()
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
          'Content-Type': 'multipart/form-data'
        }
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
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Excel Import/Export</h1>
        <p style={styles.subtitle}>Download or upload Excel files to sync with the database</p>

        {/* Status Message */}
        {message && (
          <div style={{
            ...styles.message,
            backgroundColor: messageType === 'success' ? '#d4edda' : 
                           messageType === 'error' ? '#f8d7da' : '#d1ecf1',
            color: messageType === 'success' ? '#155724' : 
                   messageType === 'error' ? '#721c24' : '#0c5460',
            borderColor: messageType === 'success' ? '#c3e6cb' : 
                        messageType === 'error' ? '#f5c6cb' : '#bee5eb'
          }}>
            {message}
          </div>
        )}

        {/* Column Errors */}
        {columnErrors.length > 0 && (
          <div style={styles.errorList}>
            <h4 style={styles.errorTitle}>
              <i className="fas fa-exclamation-triangle"></i> Column Errors Found:
            </h4>
            <ul style={styles.errorItems}>
              {columnErrors.map((error, index) => (
                <li key={index} style={styles.errorItem}>
                  <i className="fas fa-times-circle" style={{color: '#dc3545', marginRight: '8px'}}></i>
                  {error}
                </li>
              ))}
            </ul>
            <div style={styles.errorHelp}>
              <i className="fas fa-lightbulb" style={{marginRight: '8px'}}></i>
              <strong>Tip:</strong> Download the template using "Download Cases Excel" button to see the correct column names.
            </div>
          </div>
        )}

        {/* Download Section */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>📥 Download Excel (Pull from Database)</h2>
          <p style={styles.description}>
            Download an Excel file with all current cases from the database. 
            You can edit this file offline and upload it back to update the database.
          </p>
          <button onClick={handleDownload} style={styles.downloadButton}>
            Download Cases Excel
          </button>
        </div>

        {/* Upload Section */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>📤 Upload Excel (Push to Database)</h2>
          <p style={styles.description}>
            Upload an Excel file to add new cases or update existing ones. 
            Cases will be matched by ID or Docket Number.
          </p>
          
          {!selectedFile ? (
            <div style={styles.uploadContainer}>
              <label htmlFor="excelUpload" style={{
                ...styles.uploadButton,
                cursor: validatingColumns ? 'not-allowed' : 'pointer',
                opacity: validatingColumns ? 0.6 : 1
              }}>
                {validatingColumns ? (
                  <>
                    <i className="fas fa-spinner fa-spin" style={{marginRight: '8px'}}></i>
                    Validating...
                  </>
                ) : (
                  'Choose Excel File to Upload'
                )}
              </label>
              <input
                id="excelUpload"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                disabled={validatingColumns}
                style={styles.fileInput}
              />
            </div>
          ) : (
            <div style={styles.filePreviewContainer}>
              <div style={styles.filePreview}>
                <div style={styles.fileInfo}>
                  <i className="fas fa-file-excel" style={styles.fileIcon}></i>
                  <div>
                    <div style={styles.fileName}>{selectedFile.name}</div>
                    <div style={styles.fileSize}>
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </div>
                  </div>
                </div>
                <button 
                  onClick={handleCancelFile}
                  style={styles.cancelButton}
                  disabled={uploading}
                  title="Remove file"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <button 
                onClick={handleUpload}
                disabled={uploading}
                style={{
                  ...styles.confirmUploadButton,
                  opacity: uploading ? 0.6 : 1,
                  cursor: uploading ? 'not-allowed' : 'pointer'
                }}
              >
                {uploading ? (
                  <>
                    <i className="fas fa-spinner fa-spin" style={{marginRight: '8px'}}></i>
                    Uploading...
                  </>
                ) : (
                  <>
                    <i className="fas fa-cloud-upload-alt" style={{marginRight: '8px'}}></i>
                    Upload to Database
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div style={styles.instructions}>
          <h3 style={styles.instructionsTitle}>📋 Instructions:</h3>
          <ol style={styles.list}>
            <li><strong>Download:</strong> Click "Download Cases Excel" to get the latest data</li>
            <li><strong>Edit:</strong> Open the downloaded Excel file and make your changes</li>
            <li><strong>Upload:</strong> Click "Choose Excel File" and select your edited file</li>
            <li><strong style={{color: '#d63031'}}>⚠️ To ADD NEW cases:</strong> Leave the "ID" column EMPTY for new rows</li>
            <li><strong style={{color: '#0984e3'}}>To UPDATE existing cases:</strong> Keep the ID - it matches records in database</li>
          </ol>
        </div>

        {/* Column Reference */}
        <div style={styles.reference}>
          <h3 style={styles.referenceTitle}>📊 Excel Columns:</h3>
          <ul style={styles.columnList}>
            <li>ID, Docket No, Date Filed, Complainant, Respondent</li>
            <li>Address of Respondent, Offense, Date of Commission, Date Resolved, Resolving Prosecutor</li>
            <li>Criminal Case No, Branch, Date Filed in Court</li>
            <li>Remarks Decision, Penalty, Index Cards</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '900px',
    margin: '0 auto',
    fontFamily: 'Arial, sans-serif'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    padding: '30px'
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '10px',
    textAlign: 'center'
  },
  subtitle: {
    fontSize: '16px',
    color: '#666',
    textAlign: 'center',
    marginBottom: '30px'
  },
  message: {
    padding: '15px',
    borderRadius: '5px',
    marginBottom: '20px',
    border: '1px solid',
    textAlign: 'center',
    fontWeight: '500'
  },
  section: {
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px'
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#444',
    marginBottom: '10px'
  },
  description: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '15px',
    lineHeight: '1.5'
  },
  downloadButton: {
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    padding: '12px 30px',
    fontSize: '16px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'background-color 0.3s'
  },
  uploadContainer: {
    display: 'flex',
    justifyContent: 'center'
  },
  uploadButton: {
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    padding: '12px 30px',
    fontSize: '16px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'background-color 0.3s',
    display: 'inline-block'
  },
  fileInput: {
    display: 'none'
  },
  filePreviewContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    alignItems: 'center'
  },
  filePreview: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    border: '2px solid #007bff',
    borderRadius: '8px',
    padding: '15px 20px',
    width: '100%',
    maxWidth: '500px',
    boxShadow: '0 2px 8px rgba(0,123,255,0.1)'
  },
  fileInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    flex: 1
  },
  fileIcon: {
    fontSize: '32px',
    color: '#28a745'
  },
  fileName: {
    fontWeight: '600',
    color: '#333',
    fontSize: '15px',
    marginBottom: '4px'
  },
  fileSize: {
    fontSize: '13px',
    color: '#666'
  },
  cancelButton: {
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    cursor: 'pointer',
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s',
    flexShrink: 0
  },
  confirmUploadButton: {
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    padding: '12px 30px',
    fontSize: '16px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'background-color 0.3s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  instructions: {
    backgroundColor: '#fff3cd',
    border: '1px solid #ffc107',
    borderRadius: '8px',
    padding: '20px',
    marginTop: '20px'
  },
  instructionsTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: '10px'
  },
  list: {
    color: '#856404',
    lineHeight: '1.8',
    paddingLeft: '20px'
  },
  reference: {
    backgroundColor: '#e7f3ff',
    border: '1px solid #007bff',
    borderRadius: '8px',
    padding: '20px',
    marginTop: '20px'
  },
  referenceTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#004085',
    marginBottom: '10px'
  },
  columnList: {
    color: '#004085',
    lineHeight: '1.8',
    paddingLeft: '20px',
    listStyleType: 'circle'
  },
  errorList: {
    backgroundColor: '#fff3cd',
    border: '2px solid #ffc107',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px'
  },
  errorTitle: {
    color: '#856404',
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '15px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  errorItems: {
    listStyle: 'none',
    padding: 0,
    margin: '0 0 15px 0'
  },
  errorItem: {
    color: '#856404',
    padding: '8px 0',
    borderBottom: '1px solid #ffeeba',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center'
  },
  errorHelp: {
    backgroundColor: '#fff',
    padding: '12px',
    borderRadius: '6px',
    fontSize: '14px',
    color: '#856404',
    display: 'flex',
    alignItems: 'center'
  }
};

export default ExcelSync;
