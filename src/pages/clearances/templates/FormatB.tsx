// Format B - Criminal Record Certification (With Case Details)
// This file contains the complete template for Format B including header, body, and footer
// Edit this file to customize Format B independently from other formats

import React from 'react';
import {
  FormData,
  ClearanceTemplateProps,
  getBaseStyle,
  formatDate,
  buildFullName,
} from './types';

// ============================================
// FORMAT B CONFIGURATION
// ============================================
// Customize these values to change Format B appearance
// Example: Change textColor to '#000080' for Navy blue
const FORMAT_B_CONFIG = {
  textColor: '#000000',            // Main text color (black for Format B)
  noRecordColor: '#008000',        // Green for "NO CRIMINAL RECORD"
  withRecordColor: '#DC2626',      // Red for "WITH CRIMINAL RECORD"
  bodyFontSize: '10pt',            // Body text font size
  caseFontSize: '9pt',             // Criminal case details font size
  fontFamily: "'Century Gothic', Arial, sans-serif",
};

// ============================================
// FORMAT B HEADER COMPONENT
// ============================================
const FormatBHeader: React.FC<{ dojSealSrc?: string; bagongPilipinasSrc?: string }> = ({ 
  dojSealSrc = '/images/logos/doj-seal.png',
  bagongPilipinasSrc = '/images/logos/bagong-pilipinas.png'
}) => {
  const headerTextColor = '#000000'; // Black for header
  
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

        <div style={{ flex: 1, textAlign: 'center', fontFamily: FORMAT_B_CONFIG.fontFamily, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <p style={{ color: headerTextColor, fontSize: '9pt', fontStyle: 'italic', marginBottom: '1pt', lineHeight: '1.1', fontWeight: 'normal', margin: '0' }}>Republic of the Philippines</p>
          <p style={{ color: headerTextColor, fontSize: '9pt', fontStyle: 'italic', marginBottom: '1pt', lineHeight: '1.1', fontWeight: 'normal', margin: '0' }}>Department of Justice</p>
          <p style={{ color: headerTextColor, fontSize: '11pt', fontWeight: 'bold', marginBottom: '1pt', lineHeight: '1.1', margin: '0' }}>OFFICE OF THE CITY PROSECUTOR</p>
          <p style={{ color: headerTextColor, fontSize: '9pt', marginBottom: '2pt', lineHeight: '1.1', fontWeight: 'normal', margin: '0' }}>City of Tagbilaran</p>
          <p style={{ color: headerTextColor, fontSize: '7pt', fontStyle: 'italic', marginBottom: '1pt', lineHeight: '1.1', fontWeight: 'normal', margin: '0' }}>Hall of Justice Building, Brgy. Cogon, Tagbilaran City</p>
          <p style={{ color: headerTextColor, fontSize: '7pt', fontStyle: 'italic', marginBottom: '1pt', lineHeight: '1.1', fontWeight: 'normal', margin: '0' }}>Tel. No. 411-3403/411-2306</p>
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
          color: '#000000', 
          fontSize: '20pt', 
          fontWeight: 'bold', 
          letterSpacing: '0.1em',
          fontFamily: FORMAT_B_CONFIG.fontFamily,
          margin: '0',
          padding: '0',
          textTransform: 'uppercase',
        }}>
          CERTIFICATION
        </h1>
      </div>

      {/* Salutation */}
      <p style={{ fontWeight: 'bold', marginBottom: '12pt', textAlign: 'left', fontSize: '10pt', textTransform: 'uppercase', color: FORMAT_B_CONFIG.textColor }}>
        TO WHOM IT MAY CONCERN:
      </p>
    </>
  );
};

// ============================================
// FORMAT B BODY COMPONENT
// ============================================
const FormatBBody: React.FC<{ data: FormData }> = ({ data }) => {
  const fullName = buildFullName(data);
  const issuedDateInfo = data.date_issued ? formatDate(data.date_issued) : null;

  // Filter valid criminal cases
  const validCases = data.criminal_cases || [];

  return (
    <div style={{ color: FORMAT_B_CONFIG.textColor }}>
      <p style={{ textIndent: '0.5in', textAlign: 'justify', marginBottom: '8pt', fontSize: FORMAT_B_CONFIG.bodyFontSize, lineHeight: 1.6 }}>
        THIS IS TO CERTIFY that per records of this office show that one{' '}
        <strong style={{ textTransform: 'uppercase' }}>{fullName || '[FULL NAME]'}</strong>,{' '}
        <strong>{data.age || '[AGE]'}</strong> years old, <strong>{data.civil_status || '[CIVIL STATUS]'}</strong>,{' '}
        <strong>{data.nationality || '[NATIONALITY]'}</strong>, residing at{' '}
        <strong>{data.address || '[ADDRESS]'}</strong>, has been charged of the following:
      </p>

      {/* Criminal Cases List */}
      <div style={{ marginLeft: '0.5in', marginBottom: '12pt', fontSize: FORMAT_B_CONFIG.caseFontSize }}>
        {validCases && validCases.length > 0 ? (
          validCases.map((crimCase, index) => (
            <div key={index} style={{ marginBottom: '12pt' }}>
              <p style={{ margin: '2pt 0', lineHeight: 1.3 }}>
                Crim. Case No. : <strong>{crimCase.case_number || 'N/A'}</strong>
              </p>
              <p style={{ margin: '2pt 0', lineHeight: 1.3 }}>
                Crime : <strong>{crimCase.crime || 'N/A'}</strong>
              </p>
              <p style={{ margin: '2pt 0', lineHeight: 1.3 }}>
                Date Info Filed : <strong>{crimCase.date_info_filed 
                  ? new Date(crimCase.date_info_filed).toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric' 
                    }) 
                  : 'N/A'}</strong>
              </p>
              <p style={{ margin: '2pt 0', lineHeight: 1.3 }}>
                Origin : <strong>{crimCase.origin || 'N/A'}</strong>
              </p>
              <p style={{ margin: '2pt 0', lineHeight: 1.3 }}>
                Status : <strong>{crimCase.status || 'N/A'}</strong>
              </p>
            </div>
          ))
        ) : (
          <div>
            <p style={{ margin: '2pt 0', lineHeight: 1.3 }}>Crim. Case No. : [CASE NUMBER]</p>
            <p style={{ margin: '2pt 0', lineHeight: 1.3 }}>Crime : [CRIME DESCRIPTION]</p>
            <p style={{ margin: '2pt 0', lineHeight: 1.3 }}>Date Info Filed : [DATE FILED]</p>
            <p style={{ margin: '2pt 0', lineHeight: 1.3 }}>Origin : [ORIGIN]</p>
            <p style={{ margin: '2pt 0', lineHeight: 1.3 }}>Status : [STATUS]</p>
          </div>
        )}
      </div>

      <div style={{ marginLeft: '0.5in', marginBottom: '12pt', marginTop: '12pt', fontSize: FORMAT_B_CONFIG.bodyFontSize, lineHeight: 1.5 }}>
        <p style={{ marginBottom: '4pt' }}>
          Issued upon request : <strong style={{ textDecoration: 'underline' }}>
            {data.issued_upon_request_by || fullName || '[REQUESTER NAME]'}
          </strong>
        </p>
        <p style={{ margin: 0 }}>
          Purpose : <strong style={{ textDecoration: 'underline' }}>
            {data.purpose === 'Other' ? data.custom_purpose : data.purpose || '[PURPOSE]'}
          </strong>
        </p>
      </div>

      <p style={{ textIndent: '0.5in', textAlign: 'justify', marginTop: '12pt', fontSize: FORMAT_B_CONFIG.bodyFontSize, lineHeight: 1.6 }}>
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
// FORMAT B FOOTER/SIGNATURE COMPONENT
// ============================================
const FormatBFooter: React.FC<{ data: FormData; generatedOR?: string | null }> = ({ data, generatedOR }) => {
  return (
    <>
      {/* Signature Section */}
      <div style={{ 
        marginTop: '18pt',
        textAlign: 'center',
        color: '#000000',
        fontFamily: FORMAT_B_CONFIG.fontFamily,
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
      <div style={{ marginTop: '48pt', color: '#000000', fontSize: '13pt', fontFamily: FORMAT_B_CONFIG.fontFamily }}>
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
// FORMAT B COMPLETE PREVIEW COMPONENT
// ============================================
/**
 * Format B Complete Preview Component
 * Criminal Record Certification (With Case Details)
 * Includes: Header, Body, and Footer
 */
export const FormatBPreview: React.FC<ClearanceTemplateProps & { generatedOR?: string | null; showFullTemplate?: boolean }> = ({ 
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
        <FormatBHeader />
        <FormatBBody data={data} />
        <FormatBFooter data={data} generatedOR={generatedOR} />
      </div>
    );
  }

  return <FormatBBody data={data} />;
};

// ============================================
// FORMAT B PRINT TEMPLATE HTML GENERATOR
// ============================================
export const getFormatBHtml = (formData: FormData, fullName: string, generatedOR?: string | null): string => {
  const issuedDate = formData.date_issued ? new Date(formData.date_issued) : null;
  const dayNum = issuedDate ? issuedDate.getDate() : '';
  const monthYear = issuedDate ? issuedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '';
  
  const getOrdinalSuffix = (day: number): string => {
    if (day % 10 === 1 && day !== 11) return 'st';
    if (day % 10 === 2 && day !== 12) return 'nd';
    if (day % 10 === 3 && day !== 13) return 'rd';
    return 'th';
  };

  const casesHtml = formData.criminal_cases && formData.criminal_cases.length > 0 
    ? formData.criminal_cases.filter(c => c.case_number || c.crime).map((crimCase) => `
        <div style="margin-bottom: 12pt;">
          <p style="margin: 2pt 0; line-height: 1.3; font-size: 12pt;">Crim. Case No. : <strong>${crimCase.case_number || 'N/A'}</strong></p>
          <p style="margin: 2pt 0; line-height: 1.3; font-size: 12pt;">Crime : <strong>${crimCase.crime || 'N/A'}</strong></p>
          <p style="margin: 2pt 0; line-height: 1.3; font-size: 12pt;">Date Info Filed : <strong>${crimCase.date_info_filed ? new Date(crimCase.date_info_filed).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}</strong></p>
          <p style="margin: 2pt 0; line-height: 1.3; font-size: 12pt;">Origin : <strong>${crimCase.origin || 'N/A'}</strong></p>
          <p style="margin: 2pt 0; line-height: 1.3; font-size: 12pt;">Status : <strong>${crimCase.status || 'N/A'}</strong></p>
        </div>
      `).join('')
    : `<div>
        <p style="margin: 2pt 0; line-height: 1.3; font-size: 12pt;">Crim. Case No. : [CASE NUMBER]</p>
        <p style="margin: 2pt 0; line-height: 1.3; font-size: 12pt;">Crime : [CRIME DESCRIPTION]</p>
        <p style="margin: 2pt 0; line-height: 1.3; font-size: 12pt;">Date Info Filed : [DATE FILED]</p>
        <p style="margin: 2pt 0; line-height: 1.3; font-size: 12pt;">Origin : [ORIGIN]</p>
        <p style="margin: 2pt 0; line-height: 1.3; font-size: 12pt;">Status : [STATUS]</p>
      </div>`;

  return `
    <div class="certification-body" style="color: ${FORMAT_B_CONFIG.textColor};">
      <p style="text-indent: 0.5in; text-align: justify; margin-bottom: 8pt; line-height: 1.6;">
        THIS IS TO CERTIFY that per records of this office show that one 
        <strong style="text-transform: uppercase;">${fullName}</strong>, 
        <strong>${formData?.age}</strong> years old, 
        <strong>${formData?.civil_status}</strong>, 
        <strong>${formData?.nationality}</strong>, 
        residing at <strong>${formData?.address}</strong>, has been charged of the following:
      </p>
      
      <div style="margin-left: 0.5in; margin-bottom: 12pt; font-size: 9pt;">
        ${casesHtml}
      </div>
      
      <div style="margin-left: 0.5in; margin-bottom: 12pt; margin-top: 12pt; line-height: 1.5;">
        <p style="margin-bottom: 4pt; font-size: 12pt;">Issued upon request : <strong style="text-decoration: underline;">${formData?.issued_upon_request_by || fullName}</strong></p>
        <p style="margin: 0; font-size: 12pt;">Purpose : <strong style="text-decoration: underline;">${formData?.purpose === 'Other' ? formData?.custom_purpose : formData?.purpose}</strong></p>
      </div>
      
      <p style="text-indent: 0.5in; text-align: justify; margin-top: 12pt; font-size: 12pt; line-height: 1.6;">
        WITNESS MY HAND this <strong style="text-decoration: underline;">${dayNum}${dayNum ? getOrdinalSuffix(Number(dayNum)) : '[DAY]'}</strong> 
        day of <strong style="text-decoration: underline;">${monthYear || '[MONTH, YEAR]'}</strong> 
        in the City of Tagbilaran, Bohol, Philippines.
      </p>
    </div>
  `;
};

// Export header, body, footer components for flexible use
export { FormatBHeader, FormatBBody, FormatBFooter };
