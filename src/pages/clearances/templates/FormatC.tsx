// Format C - Standard Certification with Signature and Thumbmark
// This file contains the complete template for Format C including header, body, and footer
// Edit this file to customize Format C independently from other formats

import React from 'react';
import {
  FormData,
  ClearanceTemplateProps,
  TEXT_COLOR,
  getBaseStyle,
  formatDate,
  formatFullDate,
  buildFullName,
  getOrdinalSuffix,
} from './types';

// ============================================
// FORMAT C CONFIGURATION
// ============================================
// Customize these values to change Format C appearance
const FORMAT_C_CONFIG = {
  textColor: '#000080',            // Main text color (navy blue)
  noRecordColor: '#008000',        // Green for "NO CRIMINAL RECORD"
  withRecordColor: '#DC2626',      // Red for "WITH CRIMINAL RECORD"
  noRecordFontSize: '28pt',        // Font size for status
  bodyFontSize: '10pt',            // Body text font size
  fontFamily: 'Century Gothic',
};

// Helper to get the actual color value from the color type
const getTextColorValue = (colorType: 'navy' | 'black'): string => {
  return colorType === 'black' ? '#000000' : '#000080';
};

// ============================================
// FORMAT C HEADER COMPONENT
// ============================================
const FormatCHeader: React.FC<{ dojSealSrc?: string; bagongPilipinasSrc?: string; textColor?: 'navy' | 'black' }> = ({ 
  dojSealSrc = '/images/logos/doj-seal.png',
  bagongPilipinasSrc = '/images/logos/bagong-pilipinas.png',
  textColor = 'navy'
}) => {
  const colorValue = getTextColorValue(textColor);
  
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

        <div style={{ flex: 1, textAlign: 'center', fontFamily: FORMAT_C_CONFIG.fontFamily, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', margin: '0 0.2in' }}>
          <p style={{ color: colorValue, fontSize: '12pt', fontStyle: 'normal', marginBottom: '1pt', lineHeight: '1.1', fontWeight: 'normal', margin: '0' }}>Republic of the Philippines</p>
          <p style={{ color: colorValue, fontSize: '12pt', fontStyle: 'normal', marginBottom: '1pt', lineHeight: '1.1', fontWeight: 'normal', margin: '0' }}>Department of Justice</p>
          <p style={{ color: colorValue, fontSize: '12pt', fontWeight: 'bold', marginBottom: '1pt', lineHeight: '1.1', margin: '0' }}>OFFICE OF THE CITY PROSECUTOR</p>
          <p style={{ color: colorValue, fontSize: '9pt', marginBottom: '2pt', lineHeight: '1.1', fontWeight: 'normal', margin: '0' }}>City of Tagbilaran</p>
          <p style={{ color: colorValue, fontSize: '9pt', fontStyle: 'italic', marginBottom: '1pt', lineHeight: '1.1', fontWeight: 'normal', margin: '0',  }}>Hall of Justice Building, Brgy. Cogon, Tagbilaran City</p>
          <p style={{ color: colorValue, fontSize: '8pt', fontStyle: 'italic', marginBottom: '1pt', lineHeight: '1.1', fontWeight: 'normal', margin: '0' }}>Tel. No. 411-3403</p>
          <p style={{ color: colorValue, fontSize: '8pt', fontStyle: 'italic', marginBottom: '0pt', lineHeight: '1.1', fontWeight: 'normal', margin: '0' }}>
            Email: <a href="mailto:ocptagbilaran@doj.gov.ph" style={{ color: '#0000FF', textDecoration: 'underline' }}>ocptagbilaran@doj.gov.ph</a>
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

      {/* CERTIFICATE OF CLEARANCE Title */}
      <div style={{ textAlign: 'center', margin: '24pt 0 24pt 0' }}>
        <h1 style={{ 
          color: colorValue, 
          fontSize: '20pt', 
          fontWeight: 'bold', 
          letterSpacing: '0.1em',
          fontFamily: FORMAT_C_CONFIG.fontFamily,
          margin: '0',
          padding: '0',
          textTransform: 'uppercase',
        }}>
          CERTIFICATE OF CLEARANCE
        </h1>
      </div>

      {/* Salutation */}
      <p style={{ fontWeight: 'bold', marginBottom: '12pt', textAlign: 'left', fontSize: '13pt', textTransform: 'uppercase', color: colorValue }}>
        TO WHOM IT MAY CONCERN:
      </p>
    </>
  );
};

// ============================================
// FORMAT C BODY COMPONENT
// ============================================
const FormatCBody: React.FC<{ data: FormData; textColor?: 'navy' | 'black' }> = ({ data, textColor = 'navy' }) => {
  const colorValue = getTextColorValue(textColor);
  const fullName = buildFullName(data);
  const issuedDateInfo = data.date_issued ? formatDate(data.date_issued) : null;
  const validityInfo = data.validity_expiry ? formatDate(data.validity_expiry) : null;
  const idLabel = data.id_presented?.trim() || 'DOJ ID No';
  const rawValidityLabel = data.id_number?.trim();
  const validityLabel = rawValidityLabel === 'No entry' ? '' : (rawValidityLabel || 'Valid Until');

  // Build display name for signature - Use issued_upon_request_by field
  const signatureName = data.issued_upon_request_by?.toUpperCase() || `Mr. ${data.first_name} ${data.last_name}${data.middle_name?.trim() ? ` y ${data.middle_name.trim().toUpperCase()}` : ''}`.trim().toUpperCase() || '[NAME]';

  return (
    <div style={{ color: colorValue }}>
      {/* Main certification paragraph */}
      <p style={{ textIndent: '0.5in', textAlign: 'justify', marginBottom: '12pt', fontSize: '13pt', lineHeight: 1.6 }}>
        THIS IS TO CERTIFY that the records of this office show that one{' '}
        <strong>{fullName || '[FULL NAME]'}</strong>,{' '}
        {String(data.age || '').trim().toLowerCase() === 'of legal age'
          ? <><strong>of legal age</strong>,{' '}</>
          : <><strong>{data.age || '[AGE]'} years old,</strong>{' '}</>}
        {data.civil_status === 'Blank' ? null : <><strong>{data.civil_status || '[CIVIL STATUS]'}</strong>,{' '}</>}
        <strong>{data.nationality || '[NATIONALITY]'}</strong>, residing at{' '}
        <strong>{data.address || '[ADDRESS]'}</strong> has
      </p>

      {/* Criminal Record Status - Always show NO CRIMINAL RECORD */}
      <p style={{ textAlign: 'center', fontWeight: 'bold', fontSize: FORMAT_C_CONFIG.noRecordFontSize, color: FORMAT_C_CONFIG.noRecordColor, margin: '20pt 0' }}>
        &quot;NO CRIMINAL RECORD&quot;
      </p>

      {/* Issued upon request and Purpose */}
      <div style={{ marginLeft: '0.5in', marginBottom: '16pt',fontSize: '13pt', }}>
        <p style={{ marginBottom: '4pt' }}>
          Issued upon the request of: <strong style={{ textDecoration: 'underline' }}>
            {data.issued_upon_request_by || `Mr. ${data.first_name} ${data.last_name}${data.middle_name?.trim() ? (data.middle_name.trim().toLowerCase() === 'of legal age' ? ` of legal age` : ` y ${data.middle_name.trim().toUpperCase()}`) : ''}`.trim() || '[REQUESTER NAME]'}
          </strong>
        </p>
        <p>
          Purpose: <strong style={{ textDecoration: 'underline' }}>
            {data.purpose === 'Other' ? data.custom_purpose : data.purpose || '[PURPOSE]'}
          </strong>
        </p>
      </div>
    

      {/* Signature and Thumbmark Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', margin: '24pt 0.5in' }}>
        {/* Left side - Signature */}
        <div style={{ textAlign: 'center', marginLeft: '0.5in', width: 'auto' }}>
          <div style={{ borderBottom: `1px solid ${colorValue}`, paddingBottom: '4pt', marginBottom: '8pt', marginTop: '24pt', display: 'inline-block', minWidth: '2.0in', paddingLeft: '8pt', paddingRight: '8pt' }}>
            <p style={{ fontWeight: 'bold', margin: '0', textTransform: 'uppercase', fontSize: '13pt', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {signatureName || '[NAME]'}
            </p>
          </div>
          <p style={{ fontSize: '13pt', marginTop: '4pt', marginBottom: '4pt' }}>
            Signature
          </p>
        </div>

        {/* Right side - Thumbmark */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '1.2in', height: '1.2in', border: `2px solid ${colorValue}`, backgroundColor: '#fff', marginBottom: '4pt' }}></div>
          <p style={{ fontSize: '9pt', color: colorValue, marginTop: '0', marginBottom: '0' }}>
            RIGHT THUMB MARK
          </p>
        </div>
      </div>

      {/* DOJ ID No. and Valid Until */}
      <div style={{ marginLeft: '0.3in', marginBottom: '12pt', fontSize: '13pt' }}>
        <p style={{ marginBottom: '4pt' }}>
          <span style={{ display: 'inline-block', width: '140px', whiteSpace: 'nowrap' }}>{idLabel}</span> : <strong style={{ textDecoration: 'underline' }}>
            {data.prc_id_number || '[ID NUMBER]'}
          </strong>
        </p>
        {validityLabel && (
          <p>
            <span style={{ display: 'inline-block', width: '140px', whiteSpace: 'nowrap' }}>{validityLabel}</span> : <strong style={{ textDecoration: 'underline' }}>
              {validityInfo ? validityInfo.fullDate : '[VALIDITY DATE]'}
            </strong>
          </p>
        )}
      </div>

      {/* Witness Clause */}
      <p style={{ textIndent: '0.5in', textAlign: 'justify', marginTop: '16pt', marginBottom: '24pt', fontSize: '13pt'}}>
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
// FORMAT C FOOTER/SIGNATURE COMPONENT
// ============================================
const FormatCFooter: React.FC<{ data: FormData; generatedOR?: string | null; textColor?: 'navy' | 'black' }> = ({ textColor = 'navy' }) => {
  const colorValue = getTextColorValue(textColor);
  return (
    <>
      {/* Signature Section */}
      <div style={{ 
        marginTop: '18pt',
        textAlign: 'center',
        color: colorValue,
        fontFamily: FORMAT_C_CONFIG.fontFamily,
        marginRight: '-205pt',
      }}>
        <p style={{ fontWeight: 'bold', fontSize: '13pt', marginBottom: '48pt', textTransform: 'uppercase', color: colorValue }}>
          FOR THE CITY PROSECUTOR:
        </p>
        
        <div>
          <p style={{ fontWeight: 'bold', fontSize: '13pt', marginBottom: '2pt', color: colorValue }}>REGIE C. POCON</p>
          <p style={{ fontSize: '13pt', fontStyle: 'italic', fontWeight: 'normal', color: colorValue }}>Administrative Officer V</p>
        </div>
      </div>
    </>
  );
};

// ============================================
// FORMAT C COMPLETE PREVIEW COMPONENT
// ============================================
export const FormatCPreview: React.FC<ClearanceTemplateProps & { generatedOR?: string | null; showFullTemplate?: boolean; textColor?: 'navy' | 'black' }> = ({ 
  data, 
  generatedOR,
  showFullTemplate = false,
  textColor = 'navy'
}) => {
  const baseStyle = getBaseStyle();
  const colorValue = getTextColorValue(textColor);

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
        <FormatCHeader textColor={textColor} />
        <FormatCBody data={data} textColor={textColor} />
        <FormatCFooter data={data} generatedOR={generatedOR} textColor={textColor} />
        
        {/* O.R No and Date */}
        <div style={{ marginLeft: '0.3in', marginBottom: '12pt', marginTop: '24pt', color: colorValue, fontSize: '13pt' }}>
          <p style={{ marginBottom: '4pt' }}>
            O.R No : <strong style={{ textDecoration: 'underline' }}>
              {data.or_number || '[OR NUMBER]'}
            </strong>
          </p>
          <p>
            Date : <strong style={{ textDecoration: 'underline' }}>
              {data.date_issued ? new Date(data.date_issued).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '[DATE]'}
            </strong>
          </p>
        </div>

        {/* Note */}
        <p style={{ fontSize: '10pt', fontStyle: 'italic', marginTop: '16pt', color: colorValue }}>
          {data.validity_period === '1 Year' ? 'Note: Valid until 1 year from the date issued.' : 'Note: Valid until 6 months from the date issued.'}
        </p>
      </div>
    );
  }

  return <FormatCBody data={data} textColor={textColor} />;
};

// ============================================
// FORMAT C PRINT TEMPLATE HTML GENERATOR
// ============================================
export const getFormatCHtml = (formData: FormData, fullName: string, generatedOR?: string | null, textColor: 'navy' | 'black' = 'navy'): string => {
  const colorValue = getTextColorValue(textColor);
  const idLabel = formData.id_presented?.trim() || 'DOJ ID No';
  const rawValidityLabel = formData.id_number?.trim();
  const validityLabel = rawValidityLabel === 'No entry' ? '' : (rawValidityLabel || 'Valid Until');
  
  // Build display name for signature - Use issued_upon_request_by field
  const middleName = formData.middle_name?.trim();
  const isMiddleNameOfLegalAge = middleName?.toLowerCase() === 'of legal age';
  const defaultSignatureName = [
    formData.first_name?.toUpperCase(),
    formData.last_name?.toUpperCase(),
    isMiddleNameOfLegalAge ? 'of legal age' : (middleName ? `y ${middleName.toUpperCase()}` : ''),
  ].filter(Boolean).join(' ');
  const signatureName = formData.issued_upon_request_by?.toUpperCase() || defaultSignatureName || '[NAME]';

  // Build requester name for print; skip middle name when it is "of legal age"
  const requesterName = formData.issued_upon_request_by || 
    `Mr. ${formData.first_name} ${formData.last_name}${formData.middle_name?.trim() && formData.middle_name.trim().toLowerCase() !== 'of legal age' ? ` y ${formData.middle_name.trim().toUpperCase()}` : ''}`.trim();

  // Format dates
  const issuedDate = formData.date_issued ? new Date(formData.date_issued) : new Date();
  const issuedDay = issuedDate.getDate();
  const issuedOrdinal = getOrdinalSuffix(issuedDay);
  const issuedMonthYear = issuedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const issuedFullDate = issuedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  
  const validityDate = formData.validity_expiry ? formatFullDate(formData.validity_expiry) : '[VALIDITY DATE]';

  return `<!DOCTYPE html>
<html>
<head>
  <title>Certificate - Format C</title>
  <style>
    @page { size: 8.5in 11in; margin: 0.2in 0.8in 0.2in 0.8in; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
    body { margin: 0; padding: 0; font-family: ${FORMAT_C_CONFIG.fontFamily}; font-size: 11pt; line-height: 1.2; color: ${colorValue}; background: white; }
    .certificate-container { width: 100%; max-width: 100%; margin: 0 auto; padding: 0.05in 0.3in; background: white; }
    .header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 2pt; }
    .header img { width: 0.9in; height: 0.9in; object-fit: contain; }
    .header .left-logo { width: 1.2in; height: 1.3in; margin-left: 0.25in; }
    .header .right-logo { width: 1.3in; height: 1.4in; margin-right: 0.10in; }
    .header-text { flex: 1; text-align: center; padding: 0 6pt; }
    .header-text p { margin: 0; line-height: 1.2; }
    @media print {
      body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background: white !important; }
      .certificate-container { background: white !important; }
    }
  </style>
</head>
<body>
  <div class="certificate-container">
    <!-- HEADER -->
    <div class="header">
      <img src="/images/logos/doj-seal.png" alt="DOJ Seal" class="left-logo" />
      <div class="header-text">
        <p style="font-size: 13pt; font-style: normal; color: ${colorValue};">Republic of the Philippines</p>
        <p style="font-size: 13pt; font-style: normal; color: ${colorValue};">Department of Justice</p>
        <p style="font-size: 13pt; font-weight: bold; color: ${colorValue};">OFFICE OF THE CITY PROSECUTOR</p>
        <p style="font-size: 13pt; font-style: normal; color: ${colorValue};">City of Tagbilaran</p>
        <p style="font-size: 10pt; font-style: italic; color: ${colorValue}; white-space: nowrap;">Hall of Justice Building, Brgy. Cogon, Tagbilaran City</p>
        <p style="font-size: 10pt; font-style: italic; color: ${colorValue};">Tel. No. 411-3403</p>
        <p style="font-size: 10pt; font-style: italic;">Email: <a href="mailto:ocptagbilaran@doj.gov.ph" style="color: #0000FF; text-decoration: underline;">ocptagbilaran@doj.gov.ph</a></p>
      </div>
      <img src="/images/logos/bagong-pilipinas.png" alt="Bagong Pilipinas" class="right-logo" />
    </div>
    
    <div style="height: 2pt;"></div>
    
    <!-- TITLE -->
    <div style="text-align: center; margin: 16pt 0 16pt 0;">
      <h1 style="font-size: 20pt; font-weight: bold; letter-spacing: 0.08em; margin: 0; color: ${colorValue};">CERTIFICATE OF CLEARANCE</h1>
    </div>
    
    <br/>
    
    <!-- SALUTATION -->
    <p style="font-size: 13pt; font-weight: bold; margin-bottom: 8pt; color: ${colorValue};">TO WHOM IT MAY CONCERN:</p>
    
    <br/>
    
    <!-- BODY -->
    <div style="color: ${colorValue};">
      <!-- Main certification paragraph -->
      <p style="text-indent: 0.3in; text-align: justify; margin-bottom: 6pt; font-size: 13pt; line-height: 1.3; margin-top: 0; color: ${colorValue};">
        &nbsp;&nbsp;&nbsp;THIS IS TO CERTIFY that the records of this office show that one 
        <strong>${fullName}</strong>, 
        ${String(formData?.age || '').trim().toLowerCase() === 'of legal age' ? '<strong>of legal age</strong>, ' : `<strong>${formData?.age || '[AGE]'} years old,</strong> `}
        ${formData?.civil_status === 'Blank' ? '' : `<strong>${formData?.civil_status || '[CIVIL STATUS]'}</strong>, `}
        <strong>${formData?.nationality || '[NATIONALITY]'}</strong>, 
        residing at <strong>${formData?.address || '[ADDRESS]'}</strong> has
      </p>
      

      <!-- Criminal Record Status -->
      <p style="text-align: center; font-weight: bold; font-size: 27pt; color: ${FORMAT_C_CONFIG.noRecordColor}; margin: 12pt 0;">"NO CRIMINAL RECORD"</p>

      <!-- Issued upon request and Purpose -->
      <div style="margin-left: 0.6in; margin-bottom: 6pt; line-height: 1.1; color: ${colorValue};">
        <p style="margin-bottom: 3pt; margin-top: 0; font-size: 13pt; line-height: 1.0; color: ${colorValue};">
          Issued upon the request of: <strong style="text-decoration: underline;">${requesterName}</strong>
        </p>
        <p style="margin-top: 0; font-size: 13pt; line-height: 1.0; color: ${colorValue};">
          Purpose: <strong style="text-decoration: underline;">${formData?.purpose === 'Other' ? formData?.custom_purpose : formData?.purpose || '[PURPOSE]'}</strong>
        </p>
      </div>

      <!-- Signature and Thumbmark Section -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin: 16pt 0.5in;">
        <!-- Left side - Signature -->
        <div style="text-align: center; margin-left: 0.5in; width: auto;">
          <div style="border-bottom: 1px solid ${colorValue}; padding-bottom: 4pt; margin-bottom: 8pt; margin-top: 24pt; display: inline-block; min-width: 2.0in; padding-left: 8pt; padding-right: 8pt;">
            <p style="font-weight: bold; margin: 0; text-transform: uppercase; font-size: 13pt; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: ${colorValue};">
            ${signatureName}
            </p>
          </div>
          <p style="font-size: 13pt; margin-top: 4pt; margin-bottom: 4pt; color: ${colorValue};">
            Signature
          </p>
        </div>

        <!-- Right side - Thumbmark -->
        <div style="text-align: center;">
          <div style="width: 1.2in; height: 1.2in; border: 2px solid ${colorValue}; background-color: #fff; margin-bottom: 4pt;"></div>
          <p style="font-size: 9pt; color: ${colorValue}; margin-top: 0; margin-bottom: 0;">
            RIGHT THUMB MARK
          </p>
        </div>
      </div>

      <!-- DOJ ID No. and Valid Until -->
      <div style="margin-left: 0.3in; margin-bottom: 12pt; color: ${colorValue};">
        <p style="margin-bottom: 2pt; margin-top: 0; font-size: 13pt; color: ${colorValue};">
          <span style="display: inline-block; width: 140px; white-space: nowrap;">${idLabel}</span> : <strong style="text-decoration: underline;">${formData?.prc_id_number || '[DOJ ID NUMBER]'}</strong>
        </p>
        ${validityLabel ? `<p style="margin-top: 0; font-size: 13pt; color: ${colorValue};">
          <span style="display: inline-block; width: 140px; white-space: nowrap;">${validityLabel}</span> : <strong style="text-decoration: underline;">${validityDate}</strong>
        </p>` : ''}
      </div>

      <!-- Witness Clause -->
      <p style="text-indent: 0.3in; text-align: justify; margin-top: 8pt; margin-bottom: 6pt; font-size: 13pt; line-height: 1.2; color: ${colorValue};">
        &nbsp;&nbsp;&nbsp;WITNESS MY HAND this 
        <strong style="text-decoration: underline;">${issuedDay}${issuedOrdinal}</strong> 
        day of 
        <strong style="text-decoration: underline;">${issuedMonthYear}</strong> 
        in the City of Tagbilaran, Bohol, Philippines.
      </p>
    </div>
    
    <!-- SIGNATURE -->
    <div style="text-align: right; margin-top: 4pt; margin-right: 0.4in; display: flex; flex-direction: column; align-items: flex-end;">
      <p style="font-size: 13pt; font-weight: bold; margin-bottom: 18pt; text-transform: uppercase; color: ${colorValue};">FOR THE CITY PROSECUTOR:</p>
      <p style="font-size: 13pt; font-weight: bold; margin-bottom: 0; margin-right: 28pt; color: ${colorValue};">REGIE C. POCON</p>
      <p style="font-size: 13pt; font-style: normal; margin-top: 0pt; margin-right: 9pt; color: ${colorValue};">Administrative Officer V</p>
    </div>
    <!-- FOOTER -->
    <div style="margin-top: 2pt; font-size: 13pt; color: ${colorValue};">
      <p style="margin: 0 0 2pt 0; color: ${colorValue};">O.R No: <strong><u>${formData.or_number || formData.prc_id_number || generatedOR || '[OR NUMBER]'}</u></strong></p>
      <p style="margin: 0 0 6pt 0; color: ${colorValue};">Date: <strong><u>${issuedFullDate}</u></strong></p>
      <p style="font-style: italic; font-size: 10pt; margin-top: 6pt; color: ${colorValue};">
        ${formData.validity_period === '1 Year' ? 'Note: Valid until 1 year from the date issued.' : 'Note: Valid until 6 months from the date issued.'}
      </p>
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
export { FormatCHeader, FormatCBody, FormatCFooter };
