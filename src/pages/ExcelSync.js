import React, { useState } from 'react';
import axios from 'axios';
import '../styles/button.css';

const ExcelSync = () => {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

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
  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file type
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setMessage('Please upload a valid Excel file (.xlsx or .xls)');
      setMessageType('error');
      return;
    }

    setUploading(true);
    setMessage('Uploading and processing Excel file...');
    setMessageType('info');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:5000/api/excel/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setMessage(response.data.message);
      setMessageType('success');
      
      if (response.data.errors && response.data.errors.length > 0) {
        console.warn('Import errors:', response.data.errors);
      }
      
      // Clear file input
      event.target.value = '';
      
      setTimeout(() => setMessage(''), 5000);
    } catch (error) {
      console.error('Error uploading Excel:', error);
      setMessage('Error uploading Excel file: ' + (error.response?.data?.error || error.message));
      setMessageType('error');
      event.target.value = '';
    } finally {
      setUploading(false);
    }
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
          <div style={styles.uploadContainer}>
            <label htmlFor="excelUpload" style={styles.uploadButton}>
              {uploading ? 'Uploading...' : 'Choose Excel File to Upload'}
            </label>
            <input
              id="excelUpload"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleUpload}
              disabled={uploading}
              style={styles.fileInput}
            />
          </div>
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
            <li>Offense, Date Resolved, Resolving Prosecutor</li>
            <li>Criminal Case No, Branch, Date Filed in Court</li>
            <li>Remarks, Remarks Decision, Penalty, Index Cards</li>
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
  }
};

export default ExcelSync;
