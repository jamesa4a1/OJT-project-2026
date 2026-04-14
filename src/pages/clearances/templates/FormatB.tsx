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
  textColor: '#000080',            // Main text color (navy blue for Format B)
  noRecordColor: '#008000',        // Green for "NO CRIMINAL RECORD"
  withRecordColor: '#DC2626',      // Red for "WITH CRIMINAL RECORD"
  bodyFontSize: '13pt',            // Body text font size
  caseFontSize: '9pt',             // Criminal case details font size
  fontFamily: "'Century Gothic', Arial, sans-serif",
};

// Helper to get the actual color value from the color type
const getTextColorValue = (colorType: 'navy' | 'black'): string => {
  return colorType === 'black' ? '#000000' : '#000080';
};

// ============================================
// FORMAT B HEADER COMPONENT
// ============================================
const FormatBHeader: React.FC<{ dojSealSrc?: string; bagongPilipinasSrc?: string; textColor?: 'navy' | 'black' }> = ({ 
  dojSealSrc = '/images/logos/doj-seal.png',
  bagongPilipinasSrc = '/images/logos/bagong-pilipinas.png',
  textColor = 'navy'
}) => {
  const headerTextColor = getTextColorValue(textColor);
  
  return (
    <>
      {/* Header with Official Logos */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ flexShrink: 0, width: '1.2in', marginRight: '0.3in' }}>
          <img 
            src={dojSealSrc} 
            alt="DOJ Seal" 
            style={{ width: '1.2in', height: '1.2in', objectFit: 'contain' }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        </div>

        <div style={{ flex: 1, textAlign: 'center', fontFamily: FORMAT_B_CONFIG.fontFamily, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', margin: '0 0.2in' }}>
          <p style={{ color: headerTextColor, fontSize: '9pt', fontStyle: 'italic', marginBottom: '1pt', lineHeight: '1.1', fontWeight: 'normal', margin: '0' }}>Republic of the Philippines</p>
          <p style={{ color: headerTextColor, fontSize: '9pt', fontStyle: 'italic', marginBottom: '1pt', lineHeight: '1.1', fontWeight: 'normal', margin: '0' }}>Department of Justice</p>
          <p style={{ color: headerTextColor, fontSize: '11pt', fontWeight: 'bold', marginBottom: '1pt', lineHeight: '1.1', margin: '0' }}>OFFICE OF THE CITY PROSECUTOR</p>
          <p style={{ color: headerTextColor, fontSize: '9pt', marginBottom: '2pt', lineHeight: '1.1', fontWeight: 'normal', margin: '0' }}>City of Tagbilaran</p>
          <p style={{ color: headerTextColor, fontSize: '7pt', fontStyle: 'italic', marginBottom: '1pt', lineHeight: '1.1', fontWeight: 'normal', margin: '0' }}>Hall of Justice Building, Brgy. Cogon, Tagbilaran City</p>
          <p style={{ color: headerTextColor, fontSize: '7pt', fontStyle: 'italic', marginBottom: '1pt', lineHeight: '1.1', fontWeight: 'normal', margin: '0' }}>Tel. No. 411-3403/411-2306</p>
          <p style={{ color: headerTextColor, fontSize: '10pt', fontStyle: 'italic', marginBottom: '0pt', lineHeight: '1.1', fontWeight: 'normal', margin: '0' }}>
            Email: <a href="mailto:ocptagbilaran@doj.gov.ph" style={{ color: headerTextColor, textDecoration: 'underline' }}>ocptagbilaran@doj.gov.ph</a>
          </p>
        </div>

        <div style={{ flexShrink: 0, width: '1.2in', textAlign: 'center', marginLeft: '0.3in' }}>
          <img 
            src={bagongPilipinasSrc} 
            alt="Bagong Pilipinas" 
            style={{ width: '1.2in', height: '1.2in', objectFit: 'contain' }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
      </div>

      {/* CERTIFICATION Title */}
      <div style={{ textAlign: 'center', margin: '24pt 0 24pt 0' }}>
        <h1 style={{ 
          color: headerTextColor, 
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
      <p style={{ fontWeight: 'bold', marginBottom: '12pt', textAlign: 'left', fontSize: '13pt', textTransform: 'uppercase', color: headerTextColor }}>
        TO WHOM IT MAY CONCERN:
      </p>
    </>
  );
};

// ============================================
// FORMAT B BODY COMPONENT
// ============================================
const FormatBBody: React.FC<{ data: FormData; textColor?: 'navy' | 'black' }> = ({ data, textColor = 'navy' }) => {
  const colorValue = getTextColorValue(textColor);
  const fullName = buildFullName(data);
  const issuedDateInfo = data.date_issued ? formatDate(data.date_issued) : null;
  const validCases = data.criminal_cases || [];

  return (
    <div style={{ color: colorValue }}>
      <p style={{ textIndent: '0.5in', textAlign: 'justify', marginBottom: '8pt', fontSize: FORMAT_B_CONFIG.bodyFontSize, lineHeight: 1.6 }}>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;THIS IS TO CERTIFY that the records of this office show that one <strong style={{ textTransform: 'uppercase' }}>{fullName || '[FULL NAME]'}</strong>, <strong>{data.age || '[AGE]'} years old</strong>, <strong>{data.civil_status || '[CIVIL STATUS]'}</strong>, <strong>{data.nationality || '[NATIONALITY]'}</strong>, residing at <strong>{data.address || '[ADDRESS]'}</strong>, has been charged of the following:
      </p>

      <div style={{ marginLeft: '0.5in', marginBottom: '12pt', fontSize: '13pt'}}>
        {validCases && validCases.length > 0 ? (
          validCases.map((crimCase, index) => (
            <div key={index} style={{ marginBottom: '12pt' }}>
              <p style={{ margin: '2pt 0', lineHeight: 1.3 }}><span style={{ display: 'inline-block', width: '150px', whiteSpace: 'nowrap' }}>{crimCase.case_number_type || 'Crim. Case No.'}</span> : <strong>{crimCase.case_number || 'N/A'}</strong></p>
              <p style={{ margin: '2pt 0', lineHeight: 1.3 }}><span style={{ display: 'inline-block', width: '150px' }}>Crime</span> : {crimCase.crime || 'N/A'}</p>
              <p style={{ margin: '2pt 0', lineHeight: 1.3 }}><span style={{ display: 'inline-block', width: '150px', whiteSpace: 'nowrap' }}>{crimCase.date_type || 'Date Info Filed'}</span> : {crimCase.date_info_filed ? new Date(crimCase.date_info_filed).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}</p>
              <p style={{ margin: '2pt 0', lineHeight: 1.3 }}><span style={{ display: 'inline-block', width: '150px' }}>Origin</span> : {crimCase.origin || 'Tagbilaran City'}</p>
              <p style={{ margin: '2pt 0', lineHeight: 1.3 }}><span style={{ display: 'inline-block', width: '150px' }}>Status</span> : {crimCase.status || 'N/A'}</p>
            </div>
          ))
        ) : (
          <div>
            <p style={{ margin: '2pt 0', lineHeight: 1.3 }}><span style={{ display: 'inline-block', width: '150px' }}>Crim. Case No.</span> : N/A</p>
            <p style={{ margin: '2pt 0', lineHeight: 1.3 }}><span style={{ display: 'inline-block', width: '150px' }}>Crime</span> : N/A</p>
            <p style={{ margin: '2pt 0', lineHeight: 1.3 }}><span style={{ display: 'inline-block', width: '150px' }}>Date Info Filed</span> : N/A</p>
            <p style={{ margin: '2pt 0', lineHeight: 1.3 }}><span style={{ display: 'inline-block', width: '150px' }}>Origin</span> : Tagbilaran City</p>
            <p style={{ margin: '2pt 0', lineHeight: 1.3 }}><span style={{ display: 'inline-block', width: '150px' }}>Status</span> : N/A</p>
          </div>
        )}
      </div>

      <div style={{ marginLeft: '0.9in', marginBottom: '12pt', marginTop: '12pt', fontSize: FORMAT_B_CONFIG.bodyFontSize, lineHeight: 1.5 }}>
        <p style={{ marginBottom: '4pt' }}>Issued upon request : <strong style={{ textDecoration: 'underline' }}>{data.issued_upon_request_by || fullName || '[REQUESTER NAME]'}</strong></p>
        <p style={{ margin: 0 }}>Purpose : <strong style={{ textDecoration: 'underline' }}>{data.purpose === 'Other' ? data.custom_purpose : data.purpose || '[PURPOSE]'}</strong></p>
      </div>

      <p style={{ textIndent: '0.5in', textAlign: 'justify', marginTop: '12pt', fontSize: FORMAT_B_CONFIG.bodyFontSize, lineHeight: 1.6 }}>
        WITNESS MY HAND this <strong style={{ textDecoration: 'underline' }}>{issuedDateInfo ? `${issuedDateInfo.day}${issuedDateInfo.suffix}` : '[DAY]'}</strong> day of <strong style={{ textDecoration: 'underline' }}>{issuedDateInfo ? issuedDateInfo.monthYear : '[MONTH, YEAR]'}</strong> in the City of Tagbilaran, Bohol, Philippines.
      </p>
    </div>
  );
};

// ============================================
// FORMAT B FOOTER/SIGNATURE COMPONENT
// ============================================
const FormatBFooter: React.FC<{ data: FormData; generatedOR?: string | null; textColor?: 'navy' | 'black' }> = ({ data, generatedOR, textColor = 'navy' }) => {
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
        marginTop: '18pt',
        textAlign: 'center',
        color: colorValue,
        fontFamily: FORMAT_B_CONFIG.fontFamily,
        marginRight: '-205pt',
      }}>
        <p style={{ fontWeight: 'bold', fontSize: '13pt', marginBottom: '48pt', textTransform: 'uppercase', color: colorValue }}>
          FOR THE CITY PROSECUTOR:
        </p>
        
        <div>
          <p style={{ fontWeight: 'bold', fontSize: '13pt', marginBottom: '2pt', color: colorValue }}>REGIE C. POCON</p>
          <p style={{ fontSize: '13pt', fontStyle: 'normal', fontWeight: 'normal', color: colorValue }}>Administrative Officer V</p>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: '48pt', color: colorValue, fontSize: '13pt', fontFamily: FORMAT_B_CONFIG.fontFamily }}>
        <p style={{ marginBottom: '3pt', color: colorValue }}>
          O.R No: <strong style={{ textDecoration: 'underline', color: colorValue, fontWeight: 'bold' }}>{data.prc_id_number || generatedOR || '________'}</strong>
        </p>
        <p style={{ marginBottom: '12pt', color: colorValue }}>
          Date: <strong style={{ textDecoration: 'underline', color: colorValue, fontWeight: 'bold'}}>{new Date(data.date_issued).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>
        </p>
        <p style={{ fontStyle: 'italic', fontSize: '10pt', color: colorValue }}>
          {getValidityMessage()}
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
export const FormatBPreview: React.FC<ClearanceTemplateProps & { generatedOR?: string | null; showFullTemplate?: boolean; textColor?: 'navy' | 'black' }> = ({ 
  data, 
  generatedOR,
  showFullTemplate = false,
  textColor = 'navy'
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
        <FormatBHeader textColor={textColor} />
        <FormatBBody data={data} textColor={textColor} />
        <FormatBFooter data={data} generatedOR={generatedOR} textColor={textColor} />
      </div>
    );
  }

  return <FormatBBody data={data} textColor={textColor} />;
};

// ============================================
// FORMAT B PRINT TEMPLATE HTML GENERATOR
// ============================================
export const getFormatBHtml = (formData: FormData, fullName: string, generatedOR?: string | null, textColor: 'navy' | 'black' = 'navy'): string => {
  const colorValue = getTextColorValue(textColor);
  const issuedDate = formData.date_issued ? new Date(formData.date_issued) : new Date();
  const dayNum = issuedDate.getDate();
  const monthYear = issuedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const fullDate = issuedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  
  const getOrdinalSuffix = (day: number): string => {
    if (day % 10 === 1 && day !== 11) return 'st';
    if (day % 10 === 2 && day !== 12) return 'nd';
    if (day % 10 === 3 && day !== 13) return 'rd';
    return 'th';
  };

  // Build criminal cases HTML - Always show structure
  const validCases = formData.criminal_cases?.filter(c => c.case_number || c.crime) || [];
  
  const casesHtml = validCases.length > 0
    ? validCases.map((crimCase) => `
        <div style="margin-bottom: 12pt; margin-left: 0.2in;">
          <p style="margin: 2pt 0; line-height: 1.3; font-size: 13pt;">
            <span style="display: inline-block; width: 150px; white-space: nowrap;">${crimCase.case_number_type || 'Crim. Case No.'}</span> : <strong>${crimCase.case_number || 'N/A'}</strong>
          </p>
          <p style="margin: 2pt 0; line-height: 1.3; font-size: 13pt;">
            <span style="display: inline-block; width: 150px;">Crime</span> : ${crimCase.crime || 'N/A'}
          </p>
          <p style="margin: 2pt 0; line-height: 1.3; font-size: 13pt;">
            <span style="display: inline-block; width: 150px; white-space: nowrap;">${crimCase.date_type || 'Date Info Filed'}</span> : ${crimCase.date_info_filed ? new Date(crimCase.date_info_filed).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}
          </p>
          <p style="margin: 2pt 0; line-height: 1.3; font-size: 13pt;">
            <span style="display: inline-block; width: 150px;">Origin</span> : ${crimCase.origin || 'Tagbilaran City'}
          </p>
          <p style="margin: 2pt 0; line-height: 1.3; font-size: 13pt;">
            <span style="display: inline-block; width: 150px;">Status</span> : ${crimCase.status || 'N/A'}
          </p>
        </div>
      `).join('')
    : `<div style="margin-bottom: 12pt; margin-left: 0.2in;">
        <p style="margin: 2pt 0; line-height: 1.3; font-size: 13pt;">
          <span style="display: inline-block; width: 150px;">Crim. Case No.</span> : <strong>N/A</strong>
        </p>
        <p style="margin: 2pt 0; line-height: 1.3; font-size: 13pt;">
          <span style="display: inline-block; width: 150px;">Crime</span> : N/A
        </p>
        <p style="margin: 2pt 0; line-height: 1.3; font-size: 13pt;">
          <span style="display: inline-block; width: 150px;">Date Info Filed</span> : N/A
        </p>
        <p style="margin: 2pt 0; line-height: 1.3; font-size: 13pt;">
          <span style="display: inline-block; width: 150px;">Origin</span> : Tagbilaran City
        </p>
        <p style="margin: 2pt 0; line-height: 1.3; font-size: 13pt;">
          <span style="display: inline-block; width: 150px;">Status</span> : N/A
        </p>
      </div>`;

  return `<!DOCTYPE html>
<html>
<head>
  <title>Certificate - Format B</title>
  <style>
    @page { size: 9.5in 12in; margin: 0.75in 0.75in 0.5in 0.75in; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
    body { margin: 0; padding: 0; font-family: ${FORMAT_B_CONFIG.fontFamily}; font-size: 13pt; line-height: 1.0; color: ${colorValue}; background: white; }
    .certificate-container { width: 100%; max-width: 7in; margin: 0 auto; padding: 0; }
    .header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 4pt; }
    .header img { width: 1.2in; height: 1.2in; object-fit: contain; }
  .header .left-logo { margin-right: 0.25in; }
    .header .right-logo { width: 1.3in; height: 1.4in; margin-left: 0.25in; }
    .header-text { flex: 1; text-align: center; padding: 0 0.2in; }
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
        <p style="font-size: 13pt; font-style: normal; color: ${colorValue}; line-height: 1.0;">Republic of the Philippines</p>
        <p style="font-size: 13pt; font-style: normal; color: ${colorValue}; line-height: 1.0;">Department of Justice</p>
        <p style="font-size: 13pt; font-weight: bold; color: ${colorValue}; line-height: 1.0;">OFFICE OF THE CITY PROSECUTOR</p>
        <p style="font-size: 13pt; color: ${colorValue}; line-height: 1.0;">City of Tagbilaran</p>
        <p style="font-size: 11pt; font-style: italic; color: ${colorValue}; line-height: 1.0; white-space: nowrap;">Hall of Justice Building, Brgy. Cogon, Tagbilaran City</p>
        <p style="font-size: 11pt; font-style: italic; color: ${colorValue}; line-height: 1.0;">Tel. No. 411-3403/411-2306</p>
        <p style="font-size: 11pt; font-style: italic; color: ${colorValue}; line-height: 1.0;">Email: <a href="mailto:ocptagbilaran@doj.gov.ph" style="color: ${colorValue}; text-decoration: underline;">ocptagbilaran@doj.gov.ph</a></p>
      </div>
      <img src="/images/logos/bagong-pilipinas.png" alt="Bagong Pilipinas" class="right-logo" />
    </div>
    
    <br/>
    
    <!-- TITLE -->
    <div style="text-align: center; margin: 4pt 0 8pt 0;">
      <h1 style="font-size: 23pt; font-weight: bold; letter-spacing: 0.03em; margin: 0; color: ${colorValue};">C E R T I F I C A T I O N</h1>
    </div>
    
    <br/>
    
    <!-- SALUTATION -->
    <p style="font-size: 12pt; font-weight: bold; margin-bottom: 4pt; color: ${colorValue};">TO WHOM IT MAY CONCERN:</p>
    
    <br/>
    
    <!-- BODY -->
    <div style="color: ${colorValue};">
      <p style="text-indent: 0.5in; margin-left: 0.7in; justify; margin-bottom: 8pt; line-height: 1.6;">
        THIS IS TO CERTIFY that the records of this office show that one 
        <strong style="text-transform: uppercase;">${fullName}</strong>, 
        <strong>${formData?.age}</strong> years old, 
        <strong>${formData?.civil_status}</strong>, 
        <strong>${formData?.nationality}</strong>, 
        residing at <strong>${formData?.address}</strong>, has been charged of the following:
      </p>

      <div style="height: 5px;"></div>
      
      <div style="margin-left: 0.5in; margin-bottom: 30pt; font-size: 13pt;">
        ${casesHtml}
      </div}

      <div style="height: -3px;"></div>

      
      <div style="margin-left: 1.2in; margin-bottom: 12pt; margin-top: 8pt; line-height: 1.0;">
        <p style="margin-bottom: 4pt; font-size: 13pt;">Issued upon request : <strong style="text-decoration: underline;">${formData?.issued_upon_request_by || fullName}</strong></p>
        <p style="margin: 0; font-size: 13pt;">Purpose : <strong style="text-decoration: underline;">${formData?.purpose === 'Other' ? formData?.custom_purpose : formData?.purpose}</strong></p>
      </div>
      
      <p style="text-indent: 0.5in; text-align: margin-left: 1.9in; justify; margin-top: 12pt; font-size: 13pt; line-height: 1.6;">
        &nbsp &nbsp &thinsp;&hairsp;WITNESS MY HAND this <strong style="text-decoration: underline;">${dayNum}${getOrdinalSuffix(dayNum)}</strong> 
        day of <strong style="text-decoration: underline;">${monthYear}</strong> 
        in the City of Tagbilaran, Bohol, Philippines.
      </p>
    </div>
    
    <br/>
    
    <!-- SIGNATURE -->
    <div style="text-align: right; margin-top: 14pt; margin-right: 0.8in; display: flex; flex-direction: column; align-items: flex-end;">
      <p style="font-size: 13pt; font-weight: bold; margin-bottom: 32pt; text-transform: uppercase; color: ${colorValue};">FOR THE CITY PROSECUTOR:</p>
      <p style="font-size: 13pt; font-weight: bold; margin-bottom: 0; margin-right: 25pt; color: ${colorValue};">REGIE C. POCON</p>
      <p style="font-size: 13pt; font-style: normal; margin-top: 0pt; margin-right: 5pt; color: ${colorValue};">Administrative Officer V</p>
    </div>
    
    <br/>
    
    <!-- FOOTER -->
    <div style="margin-top: 18pt; font-size: 13pt; color: ${colorValue};">
      <p style="margin: 0 0 2pt 0; color: ${colorValue};">O.R No: <strong><u>${formData.prc_id_number || generatedOR || '________'}</u></strong></p>
      <p style="margin: 0 0 2pt 0; color: ${colorValue};">Date: <strong><u>${fullDate}</u></strong></p>
      <br/>
      <p style="font-style: italic; font-size: 10pt; margin-top: 8pt; color: ${colorValue};">${formData.validity_period === '1 Year' ? 'Note: Valid until 1 year from the date issued.' : 'Note: Valid until 6 months from the date issued.'}</p>
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
export { FormatBHeader, FormatBBody, FormatBFooter };
