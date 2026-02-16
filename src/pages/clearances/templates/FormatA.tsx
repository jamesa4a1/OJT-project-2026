// Format A - Standard Basic Certification
// This file contains the complete template for Format A including header, body, and footer
// Edit this file to customize Format A independently from other formats

import React from 'react';
import {
  FormData,
  ClearanceTemplateProps,
  TEXT_COLOR,
  getBaseStyle,
  formatDate,
  buildFullName,
  hasCriminalRecord as checkCriminalRecord,
} from './types';

// ============================================
// FORMAT A CONFIGURATION
// ============================================
// Customize these values to change Format A appearance
const FORMAT_A_CONFIG = {
  textColor: '#000080',            // Main text color (navy blue)
  noRecordColor: '#008000',        // Green for "NO CRIMINAL RECORD" - FIXED, not affected by color selection
  withRecordColor: '#DC2626',      // Red for "WITH CRIMINAL RECORD"
  noRecordFontSize: '30pt',        // Font size for no criminal record status
  withRecordFontSize: '16pt',      // Font size for with criminal record status
  bodyFontSize: '12pt',            // Body text font size
  fontFamily: "Century Gothic",
};

// Helper to get the actual color value from the color type
const getTextColorValue = (colorType: 'navy' | 'black'): string => {
  return colorType === 'black' ? '#000000' : '#000080';
};

// ============================================
// FORMAT A HEADER COMPONENT
// ============================================
const FormatAHeader: React.FC<{ dojSealSrc?: string; bagongPilipinasSrc?: string; textColor?: 'navy' | 'black' }> = ({ 
  dojSealSrc = '/images/logos/doj-seal.png',
  bagongPilipinasSrc = '/images/logos/bagong-pilipinas.png',
  textColor = 'navy'
}) => {
  const colorValue = getTextColorValue(textColor);
  
  return (
    <>
      {/* Header with Official Logos */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ flexShrink: 0, width: '1.1in', marginRight: '0.25in' }}>
          <img 
            src={dojSealSrc} 
            alt="DOJ Seal" 
            style={{ width: '1.1in', height: '1.1in', objectFit: 'contain' }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        </div>

        <div style={{ flex: 1, textAlign: 'center', fontFamily: FORMAT_A_CONFIG.fontFamily, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', margin: '0 0.15in' }}>
          <p style={{ color: colorValue, fontSize: '11pt', fontStyle: 'normal', marginBottom: '1pt', lineHeight: '1.0', fontWeight: 'normal', margin: '0' }}>Republic of the Philippines</p>
          <p style={{ color: colorValue, fontSize: '11pt', fontStyle: 'normal', marginBottom: '1pt', lineHeight: '1.0', fontWeight: 'normal', margin: '0' }}>Department of Justice</p>
          <p style={{ color: colorValue, fontSize: '11pt', fontWeight: 'bold', marginBottom: '1pt', lineHeight: '1.0', margin: '0' }}>OFFICE OF THE CITY PROSECUTOR</p>
          <p style={{ color: colorValue, fontSize: '11pt', marginBottom: '2pt', lineHeight: '1.0', fontWeight: 'normal', margin: '0' }}>City of Tagbilaran</p>
          <p style={{ color: colorValue, fontSize: '7pt', fontStyle: 'italic', marginBottom: '1pt', lineHeight: '1.0', fontWeight: 'normal', margin: '0' }}>Hall of Justice Building, Brgy. Cogon, Tagbilaran City</p>
          <p style={{ color: colorValue, fontSize: '7pt', fontStyle: 'italic', marginBottom: '1pt', lineHeight: '1.0', fontWeight: 'normal', margin: '0' }}>Tel. No. 411-3403/411-2306</p>
          <p style={{ color: colorValue, fontSize: '8pt', fontStyle: 'italic', marginBottom: '0pt', lineHeight: '1.0', fontWeight: 'normal', margin: '0' }}>
            Email: <a href="mailto:ocptagbilaran@doj.gov.ph" style={{ color: '#0000FF', textDecoration: 'underline' }}>ocptagbilaran@doj.gov.ph</a>
          </p>
        </div>

        <div style={{ flexShrink: 0, width: '1.1in', textAlign: 'center', marginLeft: '0.25in' }}>
          <img 
            src={bagongPilipinasSrc} 
            alt="Bagong Pilipinas" 
            style={{ width: '1.1in', height: '1.1in', objectFit: 'contain' }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
      </div>

      {/* CERTIFICATION Title */}
      <div style={{ textAlign: 'center', margin: '16pt 0 16pt 0' }}>
        <h1 style={{ 
          color: colorValue, 
          fontSize: '20pt', 
          fontWeight: 'bold', 
          letterSpacing: '0.08em',
          fontFamily: FORMAT_A_CONFIG.fontFamily,
          margin: '0',
          padding: '0',
          textTransform: 'uppercase',
        }}>
          CERTIFICATION
        </h1>
      </div>

      {/* Salutation */}
      <p style={{ fontWeight: 'bold', marginBottom: '8pt', textAlign: 'left', fontSize: '10pt', textTransform: 'uppercase', color: colorValue }}>
        TO WHOM IT MAY CONCERN:
      </p>
    </>
  );
};

// ============================================
// FORMAT A BODY COMPONENT
// ============================================
const FormatABody: React.FC<{ data: FormData; textColor?: 'navy' | 'black' }> = ({ data, textColor = 'navy' }) => {
  const colorValue = getTextColorValue(textColor);
  const fullName = buildFullName(data);
  const issuedDateInfo = data.date_issued ? formatDate(data.date_issued) : null;
  const hasCriminalRecord = checkCriminalRecord(data);

  const renderCriminalRecordStatus = () => (
    <div style={{ marginBottom: '12pt' }}>
      <p style={{ textAlign: 'center', fontWeight: 'bold', fontSize: FORMAT_A_CONFIG.withRecordFontSize, color: FORMAT_A_CONFIG.withRecordColor, margin: '16pt 0' }}>
        &quot;WITH CRIMINAL RECORD&quot;
      </p>
      
      <div style={{ marginLeft: '0.3in', marginTop: '8pt' }}>
        {data.criminal_cases?.filter(c => c.case_number || c.crime).map((crimCase, index) => {
          const filtered = data.criminal_cases?.filter(c => c.case_number || c.crime) || [];
          return (
            <div key={index} style={{ marginBottom: '8pt', paddingBottom: '8pt', borderBottom: index < filtered.length - 1 ? '1px dashed #ccc' : 'none' }}>
              <p style={{ margin: '2pt 0' }}><strong>Crim. Case No.:</strong> {crimCase.case_number || 'N/A'}</p>
              <p style={{ margin: '2pt 0' }}><strong>Crime:</strong> {crimCase.crime || 'N/A'}</p>
              <p style={{ margin: '2pt 0' }}><strong>Date Info Filed:</strong> {crimCase.date_info_filed ? new Date(crimCase.date_info_filed).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}</p>
              <p style={{ margin: '2pt 0' }}><strong>Origin:</strong> {crimCase.origin || 'N/A'}</p>
              <p style={{ margin: '2pt 0' }}><strong>Status:</strong> {crimCase.status || 'N/A'}</p>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div style={{ color: colorValue }}>
      <p style={{ textIndent: '0.3in', textAlign: 'justify', marginBottom: '8pt', fontSize: FORMAT_A_CONFIG.bodyFontSize, lineHeight: '1.15' }}>
        THIS IS TO CERTIFY that the records of office show that one {' '}
        <strong style={{ textTransform: 'uppercase' }}>{fullName || '[FULL NAME]'}</strong>,{' '}
        <strong>{data.age || '[AGE]'} years old</strong>, <strong>{data.civil_status || '[CIVIL STATUS]'}</strong>,{' '}
        <strong>{data.nationality || '[NATIONALITY]'}</strong>, residing at{' '}
        <strong>{data.address || '[ADDRESS]'}</strong> has
      </p>

      <p style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '24pt', color: FORMAT_A_CONFIG.noRecordColor, margin: '12pt 0' }}>
        &quot;NO CRIMINAL RECORD&quot;
      </p>

      <div style={{ marginLeft: '0.3in', marginBottom: '6pt', lineHeight: '1.1' }}>
        <p style={{ marginBottom: '3pt', fontSize: '13pt' }}>
          Issued upon request: <strong style={{ textDecoration: 'underline' }}>
            {data.issued_upon_request_by || fullName || '[REQUESTER NAME]'}
          </strong>
        </p>
        <p style={{ fontSize: '13pt' }}>
          Purpose: <strong style={{ textDecoration: 'underline' }}>
            {data.purpose === 'Other' ? data.custom_purpose : data.purpose || '[PURPOSE]'}
          </strong>
        </p>
      </div>

      <p style={{ textIndent: '0.3in', textAlign: 'justify', marginTop: '8pt', fontSize: '13pt' }}>
        WITNESS MY HAND this{' '}
        <strong style={{ textDecoration: 'underline' }}>
          {issuedDateInfo ? `${issuedDateInfo.day}${issuedDateInfo.suffix}` : '[DAY]'}
        </strong>{' '}
        day of{' '}
        <strong style={{ textDecoration: 'underline' }}>
          {issuedDateInfo ? issuedDateInfo.monthYear : '[MONTH, YEAR]'}
        </strong>{' '}
        in the City of Tagbilaran, Bohol, Philippines.
      </p>
    </div>
  );
};

// ============================================
// FORMAT A FOOTER/SIGNATURE COMPONENT
// ============================================
const FormatAFooter: React.FC<{ data: FormData; generatedOR?: string | null; textColor?: 'navy' | 'black' }> = ({ data, generatedOR, textColor = 'navy' }) => {
  const colorValue = getTextColorValue(textColor);
  // Calculate validity message based on validity_period
  const getValidityMessage = () => {
    if (data.validity_period === '1 Year') {
      return 'Note: Valid until 1 year from the date issued.';
    }
    return 'Note: Valid until 6 months from the date issued.';
  };

  return (
    <>
      {/* Signature Section */}
      <div style={{ 
        marginTop: '13pt',
        textAlign: 'right',
        color: colorValue,
        fontFamily: FORMAT_A_CONFIG.fontFamily,
        paddingRight: '0.5in'
      }}>
        <p style={{ fontWeight: 'bold', fontSize: '13pt', marginBottom: '32pt', textTransform: 'uppercase', color: colorValue }}>
          FOR THE CITY PROSECUTOR:
        </p>
        
        <div>
          <p style={{ fontWeight: 'bold', fontSize: '13pt', marginBottom: '2pt', color: colorValue }}>REGIE C. POCON</p>
          <p style={{ fontSize: '13pt', fontStyle: 'italic', fontWeight: 'normal', color: colorValue }}>Administrative Officer V</p>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: '20pt', color: colorValue, fontSize: '13pt', fontFamily: FORMAT_A_CONFIG.fontFamily }}>
        <p style={{ marginBottom: '2pt', color: colorValue }}>
          O.R No: <strong style={{ textDecoration: 'underline', color: colorValue, fontWeight: 'bold' }}>{data.prc_id_number || generatedOR || '________'}</strong>
        </p>
        <p style={{ marginBottom: '8pt', color: colorValue }}>
          Date: <strong style={{ textDecoration: 'underline', color: colorValue, fontWeight: 'bold'}}>{new Date(data.date_issued).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>
        </p>
        <p style={{ fontStyle: 'italic', fontSize: '10pt', color: colorValue, marginTop: '8pt' }}>
          {getValidityMessage()}
        </p>
      </div>
    </>
  );
};

// ============================================
// FORMAT A COMPLETE PREVIEW COMPONENT
// ============================================
/**
 * Format A Complete Preview Component
 * Standard Certification (No Criminal Record - Basic)
 * Includes: Header, Body, and Footer
 * 
 * Fields used:
 * - first_name, middle_name, last_name, suffix
 * - age, civil_status, nationality, address
 * - purpose, date_issued, validity_expiry
 * - issued_upon_request_by
 * - criminal_cases (for status check)
 * - prc_id_number (O.R No)
 */
export const FormatAPreview: React.FC<ClearanceTemplateProps & { generatedOR?: string | null; showFullTemplate?: boolean; textColor?: 'navy' | 'black' }> = ({ 
  data, 
  generatedOR,
  showFullTemplate = false,
  textColor = 'navy'
}) => {
  const baseStyle = getBaseStyle();

  // If showFullTemplate is true, render the complete certificate
  if (showFullTemplate) {
    return (
      <div 
        style={{ 
          ...baseStyle,
          width: '6.0in',
          padding: '0.25in 0.2in 0.25in 0.2in',
          margin: '0 auto',
          boxSizing: 'border-box',
          background: 'white'
        }}
      >
        <FormatAHeader textColor={textColor} />
        <FormatABody data={data} textColor={textColor} />
        <FormatAFooter data={data} generatedOR={generatedOR} textColor={textColor} />
      </div>
    );
  }

  // Default: render only the body (for use in ClearanceGenerate.tsx preview)
  return <FormatABody data={data} textColor={textColor} />;

};

// ============================================
// FORMAT A PRINT TEMPLATE HTML GENERATOR
// ============================================
/**
 * Format A Print Template HTML Generator
 * Standard Certification (No Criminal Record - Basic)
 * Returns complete HTML document ready for printing
 */
export const getFormatAHtml = (formData: FormData, fullName: string, generatedOR?: string | null, textColor: 'navy' | 'black' = 'navy'): string => {
  const colorValue = getTextColorValue(textColor);
  const hasCriminalRecord = formData.criminal_cases && formData.criminal_cases.some(c => c.case_number && c.crime);
  const issuedDate = formData.date_issued ? new Date(formData.date_issued) : new Date();
  const dayNum = issuedDate.getDate();
  const getOrdinalSuffix = (day: number): string => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };
  const monthYear = issuedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const fullDate = issuedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  // Build criminal record status HTML - Always show NO CRIMINAL RECORD for FormatA
  const getStatusHtml = () => {
    return `<br/><p style="text-align: center; font-weight: bold; font-size: 27pt; color: ${FORMAT_A_CONFIG.noRecordColor}; margin: 12pt 0;">&quot;NO CRIMINAL RECORD&quot;</p><br/>`;
  };

  return `<!DOCTYPE html>
<html>
<head>
  <title>Certificate - Format A</title>
  <style>
    @page { size: 8.5in 11in; margin: 0.3in 1.1in 0.2in 1.1in; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
    body { margin: 0; padding: 0; font-family: ${FORMAT_A_CONFIG.fontFamily}; font-size: 13pt; line-height: 1.1; color: ${colorValue}; background: white; }
    .certificate-container { width: 100%; max-width: 7.3in; margin: 0 auto; padding: 0; }
    .header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 8pt; }
    .header img { width: 1.1in; height: 1.1in; object-fit: contain; }
    .header .left-logo { margin-right: 0.25in; }
    .header .right-logo { width: 1.2in; height: 1.2in; margin-left: 0.25in; }
    .header-text { flex: 1; text-align: center; padding: 0 0.15in; }
    .header-text p { margin: 0; line-height: 1.0; }
    @media print { body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }
  </style>
</head>
<body>
  <div class="certificate-container">
    <!-- HEADER -->
    <div class="header">
      <img src="/images/logos/doj-seal.png" alt="DOJ Seal" class="left-logo" />
      <div class="header-text">
        <p style="font-size: 11pt; font-style: normal; color: ${colorValue}; line-height: 1.2; ">Republic of the Philippines</p>
        <p style="font-size: 11pt; font-style: normal; color: ${colorValue}; line-height: 1.2; ">Department of Justice</p>
        <p style="font-size: 11pt; font-weight: bold; color: ${colorValue}; line-height: 1.2; ">OFFICE OF THE CITY PROSECUTOR</p>
        <p style="font-size: 11pt; color: ${colorValue}; line-height: 1.2; ">City of Tagbilaran</p>
        <p style="font-size: 8pt; font-style: italic; color: ${colorValue}; line-height: 1.2; ">Hall of Justice Building, Brgy. Cogon, Tagbilaran City</p>
        <p style="font-size: 8pt; font-style: italic; color: ${colorValue}; line-height: 1.2; ">Tel. No. 411-3403/411-2306</p>
        <p style="font-size: 8pt; font-style: italic; color: ${colorValue}; line-height: 1.2; ">Email: <a href="mailto:ocptagbilaran@doj.gov.ph" style="color: #0000FF;">ocptagbilaran@doj.gov.ph</a></p>
      </div>
      <img src="/images/logos/bagong-pilipinas.png" alt="Bagong Pilipinas" class="right-logo" />
    </div>
    
    <br/>
    
    <!-- TITLE -->
    <div style="text-align: center; margin: 8pt 0 12pt 0;">
      <h1 style="font-size: 20pt; font-weight: bold; letter-spacing: 0.05em; margin: 0; color: ${colorValue};">C E R T I F I C A T I O N</h1>
    </div>
    
    <br/>
    
    <!-- SALUTATION -->
    <p style="font-size: 13pt; line-height: 1.0; font-weight: bold; margin-bottom: 8pt; color: ${colorValue};">TO WHOM IT MAY CONCERN:</p>
    
    <br/>
    
    <!-- BODY -->
    <div style="color: ${colorValue};">
      <p style="text-indent: 0.3in; text-align: justify; margin-bottom: 6pt; line-height: 1.3; font-size: 13pt;">
        &nbsp;&nbsp;&nbsp;THIS IS TO CERTIFY that the records of this office show that one 
        <strong style="text-transform: uppercase;">${fullName}</strong>, 
        <strong>${formData?.age} years old</strong>, 
        <strong>${formData?.civil_status}</strong>, 
        <strong>${formData?.nationality}</strong>, 
        residing at <strong>${formData?.address}</strong> has
      </p>
      
      ${getStatusHtml()}
      
      <div style="margin-left: 0.6in; margin-bottom: 6pt; line-height: 1.1;">
        <p style="margin-bottom: 3pt; font-size: 13pt; line-height: 1.0;">Issued upon request: <strong style="text-decoration: underline;">${formData?.issued_upon_request_by || fullName}</strong></p>
        <p style="line-height: 1.0; font-size: 13pt;">Purpose: <strong style="text-decoration: underline;">${formData?.purpose === 'Other' ? formData?.custom_purpose : formData?.purpose}</strong></p>
      </div>
      
      <br/>
      
      <p style="text-indent: 0.3in; text-align: justify; margin-top: 8pt; line-height: 1.2; font-size: 13pt;">
        &nbsp &nbsp &nbsp &nbsp &nbsp &nbsp &nbsp  WITNESS MY HAND this <strong style="text-decoration: underline;">${dayNum}${getOrdinalSuffix(dayNum)}</strong> 
        day of <strong style="text-decoration: underline;">${monthYear}</strong> 
        in the City of Tagbilaran, Bohol, Philippines.
      </p>
    </div>
    
    <br/>
    
    <!-- SIGNATURE -->
    <div style="text-align: right; margin-top: 10pt; margin-right: 0.4in; display: flex; flex-direction: column; align-items: flex-end;">
      <p style="font-size: 13pt; font-weight: bold; margin-bottom: 28pt; text-transform: uppercase; color: ${colorValue};">FOR THE CITY PROSECUTOR:</p>
      <p style="font-size: 13pt; font-weight: bold; margin-bottom: 0; margin-right: 28pt; color: ${colorValue};">REGIE C. POCON</p>
      <p style="font-size: 13pt; font-style: normal; margin-top: 0pt; margin-right: 9pt; color: ${colorValue};">Administrative Officer V</p>
    </div>
    
    <br/>
    
    <!-- FOOTER -->
    <div style="margin-top: 10pt; font-size: 13pt; color: ${colorValue};">
      <p style="margin: 0 0 2pt 0; color: ${colorValue};">O.R No: <strong><u>${formData.prc_id_number || generatedOR || '________'}</u></strong></p>
      <p style="margin: 0 0 6pt 0; color: ${colorValue};">Date: <strong><u>${fullDate}</u></strong></p>
      <br/>
      <p style="font-style: italic; font-size: 10pt; margin-top: 6pt; color: ${colorValue};">${formData.validity_period === '1 Year' ? 'Note: Valid until 1 year from the date issued.' : 'Note: Valid until 6 months from the date issued.'}</p>
    </div>
  </div>
  
  <script>
    window.onload = function() {
      document.title = '';
      setTimeout(() => { window.print(); }, 200);
      window.onafterprint = function() { window.close(); };
    };
  </script>
</body>
</html>`;
};

// Export header, body, footer components for flexible use
export { FormatAHeader, FormatABody, FormatAFooter };
