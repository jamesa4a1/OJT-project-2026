// Format D - Criminal Record Certification (With Case Details Table)
// This file contains the complete template for Format D including header, body, and footer
// Edit this file to customize Format D independently from other formats

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
// FORMAT D CONFIGURATION
// ============================================
// Customize these values to change Format D appearance
const FORMAT_D_CONFIG = {
  textColor: TEXT_COLOR,           // Main text color (dark blue)
  noRecordColor: '#008000',        // Green for "NO CRIMINAL RECORD"
  withRecordColor: '#DC2626',      // Red for "WITH CRIMINAL RECORD"
  noRecordFontSize: '20pt',        // Font size for no criminal record status
  withRecordFontSize: '16pt',      // Font size for with criminal record status
  bodyFontSize: '10pt',            // Body text font size
  tableFontSize: '9pt',            // Table font size
  fontFamily: "'Century Gothic', Arial, sans-serif",
};

// ============================================
// FORMAT D HEADER COMPONENT
// ============================================
const FormatDHeader: React.FC<{ dojSealSrc?: string; bagongPilipinasSrc?: string }> = ({ 
  dojSealSrc = '/images/logos/doj-seal.png',
  bagongPilipinasSrc = '/images/logos/bagong-pilipinas.png'
}) => {
  const textColor = FORMAT_D_CONFIG.textColor;
  
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

        <div style={{ flex: 1, textAlign: 'center', fontFamily: FORMAT_D_CONFIG.fontFamily, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
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
          fontFamily: FORMAT_D_CONFIG.fontFamily,
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
// FORMAT D BODY COMPONENT
// ============================================
const FormatDBody: React.FC<{ data: FormData }> = ({ data }) => {
  const fullName = buildFullName(data);
  const issuedDateInfo = data.date_issued ? formatDate(data.date_issued) : null;
  const hasCriminalRecord = checkCriminalRecord(data);
  const expiryDateStr = data.validity_expiry ? formatDateString(data.validity_expiry) : '';

  return (
    <div style={{ color: FORMAT_D_CONFIG.textColor }}>
      <p style={{ textIndent: '0.3in', textAlign: 'justify', marginBottom: '8pt', fontSize: FORMAT_D_CONFIG.bodyFontSize }}>
        THIS IS TO CERTIFY that the record on file in this Office show(s) that{' '}
        <strong style={{ textTransform: 'uppercase' }}>{fullName || '[FULL NAME]'}</strong>,{' '}
        <strong>{data.age || '[AGE]'}</strong> years old, <strong>{data.civil_status || '[CIVIL STATUS]'}</strong>,{' '}
        <strong>{data.nationality || '[NATIONALITY]'}</strong>, presently residing at{' '}
        <strong>{data.address || '[ADDRESS]'}</strong>, has
      </p>

      {hasCriminalRecord ? (
        <div style={{ marginBottom: '12pt' }}>
          <p style={{ textAlign: 'center', fontWeight: 'bold', fontSize: FORMAT_D_CONFIG.withRecordFontSize, color: FORMAT_D_CONFIG.withRecordColor, margin: '16pt 0' }}>
            &quot;WITH CRIMINAL RECORD&quot;
          </p>
          
          {/* Criminal Cases Table */}
          <div style={{ margin: '12pt 0.3in' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: FORMAT_D_CONFIG.tableFontSize, border: '1px solid #333' }}>
              <thead>
                <tr style={{ backgroundColor: '#f0f0f0' }}>
                  <th style={{ border: '1px solid #333', padding: '4pt', textAlign: 'left' }}>Crim. Case No.</th>
                  <th style={{ border: '1px solid #333', padding: '4pt', textAlign: 'left' }}>Crime</th>
                  <th style={{ border: '1px solid #333', padding: '4pt', textAlign: 'left' }}>Date Info Filed</th>
                  <th style={{ border: '1px solid #333', padding: '4pt', textAlign: 'left' }}>Origin</th>
                  <th style={{ border: '1px solid #333', padding: '4pt', textAlign: 'left' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.criminal_cases?.filter(c => c.case_number || c.crime).map((crimCase, index) => (
                  <tr key={index}>
                    <td style={{ border: '1px solid #333', padding: '4pt' }}>{crimCase.case_number || 'N/A'}</td>
                    <td style={{ border: '1px solid #333', padding: '4pt' }}>{crimCase.crime || 'N/A'}</td>
                    <td style={{ border: '1px solid #333', padding: '4pt' }}>{crimCase.date_info_filed ? new Date(crimCase.date_info_filed).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}</td>
                    <td style={{ border: '1px solid #333', padding: '4pt' }}>{crimCase.origin || 'N/A'}</td>
                    <td style={{ border: '1px solid #333', padding: '4pt' }}>{crimCase.status || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p style={{ textAlign: 'center', fontWeight: 'bold', fontSize: FORMAT_D_CONFIG.noRecordFontSize, color: FORMAT_D_CONFIG.noRecordColor, margin: '16pt 0' }}>
          &quot;NO CRIMINAL RECORD&quot;
        </p>
      )}

      <div style={{ marginLeft: '0.3in', marginBottom: '8pt' }}>
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

      <p style={{ marginTop: '12pt', fontSize: FORMAT_D_CONFIG.bodyFontSize }}>
        This clearance is valid until {expiryDateStr || '[EXPIRY DATE]'}.
      </p>
    </div>
  );
};

// ============================================
// FORMAT D FOOTER/SIGNATURE COMPONENT
// ============================================
const FormatDFooter: React.FC<{ data: FormData; generatedOR?: string | null }> = ({ data, generatedOR }) => {
  return (
    <>
      {/* Signature Section */}
      <div style={{ 
        marginTop: '18pt',
        textAlign: 'center',
        color: '#000000',
        fontFamily: FORMAT_D_CONFIG.fontFamily,
        marginRight: '-205pt',
      }}>
        <p style={{ fontWeight: 'bold', fontSize: '10pt', marginBottom: '48pt', textTransform: 'uppercase', color: '#000000' }}>
          FOR THE CITY PROSECUTOR:
        </p>
        
        <div>
          <p style={{ fontWeight: 'bold', fontSize: '10pt', marginBottom: '2pt', color: '#000000' }}>REGIE C. POCON</p>
          <p style={{ fontSize: '9pt', fontStyle: 'italic', fontWeight: 'normal', color: '#000000' }}>Administrative Officer V</p>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: '48pt', color: '#000000', fontSize: '13pt', fontFamily: FORMAT_D_CONFIG.fontFamily }}>
        <p style={{ marginBottom: '3pt', color: '#000000' }}>
          O.R No: <strong style={{ textDecoration: 'underline', color: '#000000', fontWeight: 'bold' }}>{data.prc_id_number || generatedOR || '________'}</strong>
        </p>
        <p style={{ marginBottom: '12pt', color: '#000000' }}>
          Date: <strong style={{ textDecoration: 'underline', color: '#000000', fontWeight: 'bold'}}>{new Date(data.date_issued).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>
        </p>
        <p style={{ fontStyle: 'italic', fontSize: '12pt', color: '#000000' }}>
          Note: Valid until 6 months from the date issued.
        </p>
      </div>
    </>
  );
};

// ============================================
// FORMAT D COMPLETE PREVIEW COMPONENT
// ============================================
export const FormatDPreview: React.FC<ClearanceTemplateProps & { generatedOR?: string | null; showFullTemplate?: boolean }> = ({ 
  data, 
  generatedOR,
  showFullTemplate = false 
}) => {
  const baseStyle = getBaseStyle();

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
        <FormatDHeader />
        <FormatDBody data={data} />
        <FormatDFooter data={data} generatedOR={generatedOR} />
      </div>
    );
  }

  return <FormatDBody data={data} />;
};

// ============================================
// FORMAT D PRINT TEMPLATE HTML GENERATOR
// ============================================
export const getFormatDHtml = (formData: FormData, fullName: string, generatedOR?: string | null): string => {
  const hasCriminalRecord = formData.criminal_cases && formData.criminal_cases.some(c => c.case_number && c.crime);
  const expiryDate = formData?.validity_expiry ? formatDateString(formData.validity_expiry) : '';

  const getStatusHtml = () => {
    if (hasCriminalRecord && formData.criminal_cases) {
      const tableRows = formData.criminal_cases
        .filter(c => c.case_number || c.crime)
        .map(crimCase => `
          <tr>
            <td style="border: 1px solid #333; padding: 4pt;">${crimCase.case_number || 'N/A'}</td>
            <td style="border: 1px solid #333; padding: 4pt;">${crimCase.crime || 'N/A'}</td>
            <td style="border: 1px solid #333; padding: 4pt;">${crimCase.date_info_filed ? new Date(crimCase.date_info_filed).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}</td>
            <td style="border: 1px solid #333; padding: 4pt;">${crimCase.origin || 'N/A'}</td>
            <td style="border: 1px solid #333; padding: 4pt;">${crimCase.status || 'N/A'}</td>
          </tr>
        `).join('');
      
      return `
        <p style="text-align: center; font-weight: bold; font-size: ${FORMAT_D_CONFIG.withRecordFontSize}; color: ${FORMAT_D_CONFIG.withRecordColor}; margin: 16pt 0;">"WITH CRIMINAL RECORD"</p>
        <div style="margin: 12pt 0.3in;">
          <table style="width: 100%; border-collapse: collapse; font-size: ${FORMAT_D_CONFIG.tableFontSize}; border: 1px solid #333;">
            <thead>
              <tr style="background-color: #f0f0f0;">
                <th style="border: 1px solid #333; padding: 4pt; text-align: left;">Crim. Case No.</th>
                <th style="border: 1px solid #333; padding: 4pt; text-align: left;">Crime</th>
                <th style="border: 1px solid #333; padding: 4pt; text-align: left;">Date Info Filed</th>
                <th style="border: 1px solid #333; padding: 4pt; text-align: left;">Origin</th>
                <th style="border: 1px solid #333; padding: 4pt; text-align: left;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </div>
      `;
    } else {
      return `<p style="text-align: center; font-weight: bold; font-size: ${FORMAT_D_CONFIG.noRecordFontSize}; color: ${FORMAT_D_CONFIG.noRecordColor}; margin: 16pt 0;">"NO CRIMINAL RECORD"</p>`;
    }
  };

  return `
    <div class="certification-body" style="color: ${FORMAT_D_CONFIG.textColor};">
      <p style="text-indent: 0.3in; text-align: justify; margin-bottom: 8pt;">
        THIS IS TO CERTIFY that the record on file in this Office show(s) that 
        <strong style="text-transform: uppercase;">${fullName}</strong>, 
        <strong>${formData?.age}</strong> years old, 
        <strong>${formData?.civil_status}</strong>, 
        <strong>${formData?.nationality}</strong>, 
        presently residing at <strong>${formData?.address}</strong>, has
      </p>
      
      ${getStatusHtml()}
      
      <div style="margin-left: 0.3in; margin-bottom: 8pt;">
        <p style="margin-bottom: 4pt;">Issued upon request: <strong style="text-decoration: underline;">${formData?.issued_upon_request_by || fullName}</strong></p>
        <p>Purpose: <strong style="text-decoration: underline;">${formData?.purpose === 'Other' ? formData?.custom_purpose : formData?.purpose}</strong></p>
      </div>
      
      <p style="text-indent: 0.3in; text-align: justify; margin-top: 12pt;">
        WITNESS MY HAND this <strong style="text-decoration: underline;">${formData?.date_issued ? formatDateString(formData.date_issued).split(' day of ')[0] : '[DAY]'}</strong> 
        day of <strong style="text-decoration: underline;">${formData?.date_issued ? new Date(formData.date_issued).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '[MONTH, YEAR]'}</strong> 
        in the City of Tagbilaran, Bohol, Philippines.
      </p>
      
      <p style="margin-top: 12pt; font-size: 10pt;">This clearance is valid until ${expiryDate}.</p>
    </div>
  `;
};

// Export header, body, footer components for flexible use
export { FormatDHeader, FormatDBody, FormatDFooter };
