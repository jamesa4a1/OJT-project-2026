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
  formatDateString,
  buildFullName,
  hasCriminalRecord as checkCriminalRecord,
} from './types';

// ============================================
// FORMAT A CONFIGURATION
// ============================================
// Customize these values to change Format A appearance
const FORMAT_A_CONFIG = {
  textColor: TEXT_COLOR,           // Main text color (dark blue)
  noRecordColor: '#008000',        // Green for "NO CRIMINAL RECORD"
  withRecordColor: '#DC2626',      // Red for "WITH CRIMINAL RECORD"
  noRecordFontSize: '20pt',        // Font size for no criminal record status
  withRecordFontSize: '16pt',      // Font size for with criminal record status
  bodyFontSize: '10pt',            // Body text font size
  fontFamily: "'Century Gothic', Arial, sans-serif",
};

// ============================================
// FORMAT A HEADER COMPONENT
// ============================================
const FormatAHeader: React.FC<{ dojSealSrc?: string; bagongPilipinasSrc?: string }> = ({ 
  dojSealSrc = '/images/logos/doj-seal.png',
  bagongPilipinasSrc = '/images/logos/bagong-pilipinas.png'
}) => {
  const textColor = FORMAT_A_CONFIG.textColor;
  
  return (
    <>
      {/* Header with Official Logos */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ flexShrink: 0, width: '0.8in' }}>
          <img 
            src={dojSealSrc} 
            alt="DOJ Seal" 
            style={{ width: '0.8in', height: '0.8in', objectFit: 'contain' }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        </div>

        <div style={{ flex: 1, textAlign: 'center', fontFamily: FORMAT_A_CONFIG.fontFamily, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <p style={{ color: textColor, fontSize: '9pt', fontStyle: 'italic', marginBottom: '1pt', lineHeight: '1.1', fontWeight: 'normal', margin: '0' }}>Republic of the Philippines</p>
          <p style={{ color: textColor, fontSize: '9pt', fontStyle: 'italic', marginBottom: '1pt', lineHeight: '1.1', fontWeight: 'normal', margin: '0' }}>Department of Justice</p>
          <p style={{ color: textColor, fontSize: '11pt', fontWeight: 'bold', marginBottom: '1pt', lineHeight: '1.1', margin: '0' }}>OFFICE OF THE CITY PROSECUTOR</p>
          <p style={{ color: textColor, fontSize: '9pt', marginBottom: '2pt', lineHeight: '1.1', fontWeight: 'normal', margin: '0' }}>City of Tagbilaran</p>
          <p style={{ color: textColor, fontSize: '7pt', fontStyle: 'italic', marginBottom: '1pt', lineHeight: '1.1', fontWeight: 'normal', margin: '0' }}>Hall of Justice Building, Brgy. Cogon, Tagbilaran City</p>
          <p style={{ color: textColor, fontSize: '7pt', fontStyle: 'italic', marginBottom: '1pt', lineHeight: '1.1', fontWeight: 'normal', margin: '0' }}>Tel. No. 411-3403/411-2306</p>
          <p style={{ color: '#000000', fontSize: '10pt', fontStyle: 'italic', marginBottom: '0pt', lineHeight: '1.1', fontWeight: 'normal', margin: '0' }}>
            Email: <a href="mailto:ocptagbilaran@doj.gov.ph" style={{ color: '#0000FF', textDecoration: 'underline' }}>ocptagbilaran@doj.gov.ph</a>
          </p>
        </div>

        <div style={{ flexShrink: 0, width: '0.8in', textAlign: 'center' }}>
          <img 
            src={bagongPilipinasSrc} 
            alt="Bagong Pilipinas" 
            style={{ width: '0.8in', height: '0.8in', objectFit: 'contain' }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
      </div>

      {/* CERTIFICATION Title */}
      <div style={{ textAlign: 'center', margin: '24pt 0 24pt 0' }}>
        <h1 style={{ 
          color: textColor, 
          fontSize: '20pt', 
          fontWeight: 'bold', 
          letterSpacing: '0.1em',
          fontFamily: FORMAT_A_CONFIG.fontFamily,
          margin: '0',
          padding: '0',
          textTransform: 'uppercase',
        }}>
          CERTIFICATION
        </h1>
      </div>

      {/* Salutation */}
      <p style={{ fontWeight: 'bold', marginBottom: '12pt', textAlign: 'left', fontSize: '10pt', textTransform: 'uppercase', color: textColor }}>
        TO WHOM IT MAY CONCERN:
      </p>
    </>
  );
};

// ============================================
// FORMAT A BODY COMPONENT
// ============================================
const FormatABody: React.FC<{ data: FormData }> = ({ data }) => {
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
    <div style={{ color: FORMAT_A_CONFIG.textColor }}>
      <p style={{ textIndent: '0.3in', textAlign: 'justify', marginBottom: '8pt', fontSize: FORMAT_A_CONFIG.bodyFontSize }}>
        THIS IS TO CERTIFY that the record on file in this Office show(s) that{' '}
        <strong style={{ textTransform: 'uppercase' }}>{fullName || '[FULL NAME]'}</strong>,{' '}
        <strong>{data.age || '[AGE]'}</strong> years old, <strong>{data.civil_status || '[CIVIL STATUS]'}</strong>,{' '}
        <strong>{data.nationality || '[NATIONALITY]'}</strong>, presently residing at{' '}
        <strong>{data.address || '[ADDRESS]'}</strong>, has
      </p>

      {hasCriminalRecord ? renderCriminalRecordStatus() : (
        <p style={{ textAlign: 'center', fontWeight: 'bold', fontSize: FORMAT_A_CONFIG.noRecordFontSize, color: FORMAT_A_CONFIG.noRecordColor, margin: '16pt 0' }}>
          &quot;NO CRIMINAL RECORD&quot;
        </p>
      )}

      <div style={{ marginLeft: '0.3in', marginBottom: '8pt', lineHeight: '1.15' }}>
        <p style={{ marginBottom: '4pt' }}>
          Issued upon request: <strong style={{ textDecoration: 'underline' }}>
            {data.issued_upon_request_by || fullName || '[REQUESTER NAME]'}
          </strong>
        </p>
        <p>
          Purpose: <strong style={{ textDecoration: 'underline' }}>
            {data.purpose === 'Other' ? data.custom_purpose : data.purpose || '[PURPOSE]'}
          </strong>
        </p>
      </div>

      <p style={{ textIndent: '0.3in', textAlign: 'justify', marginTop: '12pt' }}>
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
const FormatAFooter: React.FC<{ data: FormData; generatedOR?: string | null }> = ({ data, generatedOR }) => {
  return (
    <>
      {/* Signature Section */}
      <div style={{ 
        marginTop: '18pt',
        textAlign: 'center',
        color: '#000080',
        fontFamily: FORMAT_A_CONFIG.fontFamily,
        marginRight: '-205pt',
        
      }}>
        <p style={{ fontWeight: 'bold', fontSize: '10pt', marginBottom: '48pt', textTransform: 'uppercase', color: '#000080' }}>
          FOR THE CITY PROSECUTOR:
        </p>
        
        <div>
          <p style={{ fontWeight: 'bold', fontSize: '10pt', marginBottom: '2pt', color: '#000080' }}>REGIE C. POCON</p>
          <p style={{ fontSize: '9pt', fontStyle: 'italic', fontWeight: 'normal', color: '#000080', }}>Administrative Officer V</p>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: '48pt', color: '#000080', fontSize: '13pt', fontFamily: FORMAT_A_CONFIG.fontFamily }}>
        <p style={{ marginBottom: '3pt', color: '#000080' }}>
          O.R No: <strong style={{ textDecoration: 'underline', color: '#000080', fontWeight: 'bold' }}>{data.prc_id_number || generatedOR || '________'}</strong>
        </p>
        <p style={{ marginBottom: '12pt', color: '#000080' }}>
          Date: <strong style={{ textDecoration: 'underline', color: '#000080', fontWeight: 'bold'}}>{new Date(data.date_issued).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>
        </p>
        <p style={{ fontStyle: 'italic', fontSize: '12pt', color: '#000080' }}>
          Note: Valid until 6 months from the date issued.
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
export const FormatAPreview: React.FC<ClearanceTemplateProps & { generatedOR?: string | null; showFullTemplate?: boolean }> = ({ 
  data, 
  generatedOR,
  showFullTemplate = false 
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
        <FormatAHeader />
        <FormatABody data={data} />
        <FormatAFooter data={data} generatedOR={generatedOR} />
      </div>
    );
  }

  // Default: render only the body (for use in ClearanceGenerate.tsx preview)
  return <FormatABody data={data} />;
};

// ============================================
// FORMAT A PRINT TEMPLATE HTML GENERATOR
// ============================================
/**
 * Format A Print Template HTML Generator
 * Standard Certification (No Criminal Record - Basic)
 * Returns complete HTML with header, body, and footer for printing
 */
export const getFormatAHtml = (formData: FormData, fullName: string, generatedOR?: string | null): string => {
  const hasCriminalRecord = formData.criminal_cases && formData.criminal_cases.some(c => c.case_number && c.crime);

  const getStatusHtml = () => {
    if (hasCriminalRecord) {
      const criminalCasesHtml = formData.criminal_cases
        ?.filter(c => c.case_number || c.crime)
        .map(crimCase => `
          <div style="margin-bottom: 10px; padding-left: 20px; border-left: 2px solid ${FORMAT_A_CONFIG.withRecordColor}; margin-left: 0.3in;">
            <p style="margin: 2pt 0;"><strong>Crim. Case No.:</strong> ${crimCase.case_number || 'N/A'}</p>
            <p style="margin: 2pt 0;"><strong>Crime:</strong> ${crimCase.crime || 'N/A'}</p>
            <p style="margin: 2pt 0;"><strong>Date Info Filed:</strong> ${crimCase.date_info_filed ? new Date(crimCase.date_info_filed).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}</p>
            <p style="margin: 2pt 0;"><strong>Origin:</strong> ${crimCase.origin || 'N/A'}</p>
            <p style="margin: 2pt 0;"><strong>Status:</strong> ${crimCase.status || 'N/A'}</p>
          </div>
        `).join('') || '';
      
      return `
        <p style="text-align: center; font-weight: bold; font-size: ${FORMAT_A_CONFIG.withRecordFontSize}; color: ${FORMAT_A_CONFIG.withRecordColor}; margin: 16pt 0;">"WITH CRIMINAL RECORD"</p>
        ${criminalCasesHtml}
      `;
    } else {
      return `<br/><br/><p style="text-align: center; font-weight: bold; font-size: ${FORMAT_A_CONFIG.noRecordFontSize}; color: ${FORMAT_A_CONFIG.noRecordColor}; margin: 16pt 0;">"NO CRIMINAL RECORD"</p><br/><br/>`;
    }
  };

  return `
    <div class="certification-body" style="color: ${FORMAT_A_CONFIG.textColor};">
      <p style="text-indent: 0.3in; text-align: justify; margin-bottom: 8pt;">
        THIS IS TO CERTIFY that the record on file in this Office show(s) that 
        <strong style="text-transform: uppercase;">${fullName}</strong>, 
        <strong>${formData?.age}</strong> years old, 
        <strong>${formData?.civil_status}</strong>, 
        <strong>${formData?.nationality}</strong>, 
        presently residing at <strong>${formData?.address}</strong>, has
      </p>
      
      ${getStatusHtml()}
      
      <div style="margin-left: 0.3in; margin-bottom: 8pt; line-height: 1.15;">
        <p style="margin-bottom: 4pt;">Issued upon request: <strong style="text-decoration: underline;">${formData?.issued_upon_request_by || fullName}</strong></p>
        <p>Purpose: <strong style="text-decoration: underline;">${formData?.purpose === 'Other' ? formData?.custom_purpose : formData?.purpose}</strong></p>
      </div>
      <br/><br/>
      
      <p style="text-indent: 0.3in; text-align: justify; margin-top: 12pt;">
        WITNESS MY HAND this <strong style="text-decoration: underline;">${formData?.date_issued ? formatDateString(formData.date_issued).split(' day of ')[0] : '[DAY]'}</strong> 
        day of <strong style="text-decoration: underline;">${formData?.date_issued ? new Date(formData.date_issued).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '[MONTH, YEAR]'}</strong> 
        in the City of Tagbilaran, Bohol, Philippines.
      </p>
    </div>
  `;
};

// ============================================
// FORMAT A COMPLETE PRINT TEMPLATE
// ============================================
/**
 * Get complete Format A print template including header, body, footer
 * Use this for standalone printing
 */
export const getFormatACompletePrintHtml = (formData: FormData, fullName: string, generatedOR?: string | null): string => {
  const bodyHtml = getFormatAHtml(formData, fullName, generatedOR);
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Certificate - Format A</title>
        <style>
          @page {
            size: 9.5in 12in;
            margin: 0.75in 0.75in 0.5in 0.75in;
          }
          
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          body {
            margin: 0;
            padding: 0;
            font-family: ${FORMAT_A_CONFIG.fontFamily};
            font-size: 12pt;
            line-height: 1.0;
            color: ${FORMAT_A_CONFIG.textColor};
            background: white;
          }
          
          .certificate-container {
            width: 100%;
            max-width: 7in;
            margin: 0 auto;
            padding: 0;
          }
          
          .header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            margin-bottom: 4pt;
          }
          
          .header img {
            width: 0.8in;
            height: 0.8in;
            object-fit: contain;
          }
          
          .header-text {
            flex: 1;
            text-align: center;
            padding: 0 8px;
          }
          
          .header-text p {
            margin: 0;
            line-height: 1.0;
          }
          
          .title { text-align: center; margin: 4pt 0 8pt 0; }
          .title h1 { font-size: 16pt; font-weight: bold; letter-spacing: 0.15em; margin: 0; color: ${FORMAT_A_CONFIG.textColor}; }
          
          .salutation { font-size: 12pt; font-weight: bold; margin-bottom: 4pt; }
          
          .no-record { text-align: center; margin: 8pt 0; }
          .no-record p { font-size: 25pt; font-weight: bold; color: ${FORMAT_A_CONFIG.noRecordColor} !important; margin: 0; }
          
          .with-record { text-align: center; margin: 8pt 0; }
          .with-record p { font-size: 20pt; font-weight: bold; color: ${FORMAT_A_CONFIG.withRecordColor} !important; margin: 0; }
          
          .signature { text-align: right; margin-top: 14pt; margin-right: 0.3in; display: flex; flex-direction: column; align-items: flex-end; }
          .signature .for-prosecutor { font-size: 12pt; font-weight: bold; margin-bottom: 32pt; text-transform: uppercase; color: #000080; }
          .signature .name { font-size: 12pt; font-weight: bold; margin-bottom: 0; margin-right: 25pt; color: #000080; }
          .signature .position { font-size: 12pt; font-style: italic; margin-top: 0pt; margin-right: 5pt; color: #000080; }
          
          .footer { margin-top: 18pt; font-size: 12pt; color: #000080; }
          .footer p { margin: 0 0 2pt 0; color: #000080; }
          .footer .note { font-style: italic; font-size: 12pt; margin-top: 8pt; color: #000080; }
          
          @media print {
            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          }
        </style>
      </head>
      <body>
        <div class="certificate-container">
          <div class="header">
            <img src="/images/logos/doj-seal.png" alt="DOJ Seal" />
            <div class="header-text">
              <p style="font-size: 12pt; font-style: italic;">Republic of the Philippines</p>
              <p style="font-size: 12pt; font-style: italic;">Department of Justice</p>
              <p style="font-size: 12pt; font-weight: bold;">OFFICE OF THE CITY PROSECUTOR</p>
              <p style="font-size: 12pt;">City of Tagbilaran</p>
              <p style="font-size: 9pt; font-style: italic;">Hall of Justice Building, Brgy. Cogon, Tagbilaran City</p>
              <p style="font-size: 9pt; font-style: italic;">Tel. No. 411-3403/411-2306</p>
              <p style="font-size: 9pt; font-style: italic;">Email: <a href="mailto:ocptagbilaran@doj.gov.ph" style="color: #0000FF;">ocptagbilaran@doj.gov.ph</a></p>
            </div>
            <img src="/images/logos/bagong-pilipinas.png" alt="Bagong Pilipinas" />
          </div>
          
          <br>
          
          <div class="title">
            <h1 style="font-size: 20pt;">C E R T I F I C A T I O N</h1>
          </div>
          
          <br>
          
          <p class="salutation">TO WHOM IT MAY CONCERN:</p>
          
          <br>
          
          ${bodyHtml}
          
          <br>
          
          <div class="signature">
            <p class="for-prosecutor">FOR THE CITY PROSECUTOR:</p>
            <p class="name">REGIE C. POCON</p>
            <p class="position">Administrative Officer V</p>
          </div>
          
          <br>
          
          <div class="footer">
            <p>O.R No: <strong><u>${formData.prc_id_number || generatedOR || '________'}</u></strong></p>
            <p>Date: <strong><u>${new Date(formData.date_issued).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</u></strong></p>
            <br>
            <p class="note">Note: Valid until 6 months from the date issued.</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

// Export header, body, footer components for flexible use
export { FormatAHeader, FormatABody, FormatAFooter };
