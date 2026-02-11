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
  hasCriminalRecord as checkCriminalRecord,
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
  fontFamily: "'Century Gothic', Arial, sans-serif",
};

// ============================================
// FORMAT C HEADER COMPONENT
// ============================================
const FormatCHeader: React.FC<{ dojSealSrc?: string; bagongPilipinasSrc?: string }> = ({ 
  dojSealSrc = '/images/logos/doj-seal.png',
  bagongPilipinasSrc = '/images/logos/bagong-pilipinas.png'
}) => {
  const textColor = FORMAT_C_CONFIG.textColor;
  
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
          <p style={{ color: textColor, fontSize: '12pt', fontStyle: 'normal', marginBottom: '1pt', lineHeight: '1.1', fontWeight: 'normal', margin: '0' }}>Republic of the Philippines</p>
          <p style={{ color: textColor, fontSize: '12pt', fontStyle: 'normal', marginBottom: '1pt', lineHeight: '1.1', fontWeight: 'normal', margin: '0' }}>Department of Justice</p>
          <p style={{ color: textColor, fontSize: '12pt', fontWeight: 'bold', marginBottom: '1pt', lineHeight: '1.1', margin: '0' }}>OFFICE OF THE CITY PROSECUTOR</p>
          <p style={{ color: textColor, fontSize: '9pt', marginBottom: '2pt', lineHeight: '1.1', fontWeight: 'normal', margin: '0' }}>City of Tagbilaran</p>
          <p style={{ color: textColor, fontSize: '9pt', fontStyle: 'italic', marginBottom: '1pt', lineHeight: '1.1', fontWeight: 'normal', margin: '0',  }}>Hall of Justice Building, Brgy. Cogon, Tagbilaran City</p>
          <p style={{ color: textColor, fontSize: '8pt', fontStyle: 'italic', marginBottom: '1pt', lineHeight: '1.1', fontWeight: 'normal', margin: '0' }}>Tel. No. 411-3403/411-2306</p>
          <p style={{ color: '#000080', fontSize: '8pt', fontStyle: 'italic', marginBottom: '0pt', lineHeight: '1.1', fontWeight: 'normal', margin: '0' }}>
            Email: <a href="mailto:ocptagbilaran@doj.gov.ph" style={{ color: '#000080', textDecoration: 'underline' }}>ocptagbilaran@doj.gov.ph</a>
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
          color: textColor, 
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
      <p style={{ fontWeight: 'bold', marginBottom: '12pt', textAlign: 'left', fontSize: '13pt', textTransform: 'uppercase', color: textColor }}>
        TO WHOM IT MAY CONCERN:
      </p>
    </>
  );
};

// ============================================
// FORMAT C BODY COMPONENT
// ============================================
const FormatCBody: React.FC<{ data: FormData }> = ({ data }) => {
  const fullName = buildFullName(data);
  const issuedDateInfo = data.date_issued ? formatDate(data.date_issued) : null;
  const validityInfo = data.validity_expiry ? formatDate(data.validity_expiry) : null;
  const hasCriminalRecord = checkCriminalRecord(data);

  // Build display name for signature
  const signatureName = [
    data.first_name?.toUpperCase(),
    data.middle_name ? `${data.middle_name.charAt(0).toUpperCase()}.` : '',
    data.last_name?.toUpperCase(),
  ].filter(Boolean).join(' ');

  return (
    <div style={{ color: FORMAT_C_CONFIG.textColor }}>
      {/* Main certification paragraph */}
      <p style={{ textIndent: '0.5in', textAlign: 'justify', marginBottom: '12pt', fontSize: '13pt', lineHeight: 1.6 }}>
        THIS IS TO CERTIFY that the records of this office show that one{' '}
        <strong style={{ textTransform: 'uppercase' }}>{fullName || '[FULL NAME]'}</strong>,{' '}
        <strong>{data.age || '[AGE]'}</strong> years old, <strong>{data.civil_status || '[CIVIL STATUS]'}</strong>,{' '}
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
          Issued upon request: <strong style={{ textDecoration: 'underline' }}>
            {data.issued_upon_request_by || `Mr. ${data.first_name} ${data.middle_name ? data.middle_name.charAt(0) + '.' : ''} ${data.last_name}`.trim() || '[REQUESTER NAME]'}
          </strong>
        </p>
        <p>
          Purpose: <strong style={{ textDecoration: 'underline' }}>
            {data.purpose === 'Other' ? data.custom_purpose?.toUpperCase() : data.purpose?.toUpperCase() || '[PURPOSE]'}
          </strong>
        </p>
      </div>
    

      {/* Signature and Thumbmark Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', margin: '24pt 0.5in' }}>
        {/* Left side - Signature */}
        <div style={{ textAlign: 'center', marginLeft: '0.5in', width: 'auto' }}>
          <div style={{ borderBottom: '1px solid #000080', paddingBottom: '4pt', marginBottom: '8pt', display: 'inline-block', minWidth: '2.0in', paddingLeft: '8pt', paddingRight: '8pt' }}>
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
          <div style={{ width: '1.2in', height: '1.2in', border: '2px solid #000080', backgroundColor: '#fff', marginBottom: '4pt' }}></div>
          <p style={{ fontSize: '9pt', color: '#000080', marginTop: '0', marginBottom: '0' }}>
            RIGHT THUMB MARK
          </p>
        </div>
      </div>

      {/* DOJ ID No. and Valid Until */}
      <div style={{ marginLeft: '0.3in', marginBottom: '12pt', fontSize: '13pt' }}>
        <p style={{ marginBottom: '4pt' }}>
          <span style={{ display: 'inline-block', width: '120px' }}>DOJ ID No.</span> : <strong style={{ textDecoration: 'underline' }}>
            {data.prc_id_number || '[DOJ ID NUMBER]'}
          </strong>
        </p>
        <p>
          <span style={{ display: 'inline-block', width: '120px' }}>Valid Until</span> : <strong style={{ textDecoration: 'underline' }}>
            {validityInfo ? validityInfo.fullDate : '[VALIDITY DATE]'}
          </strong>
        </p>
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
const FormatCFooter: React.FC<{ data: FormData; generatedOR?: string | null }> = ({ /* data, generatedOR - used in print template */ }) => {
  return (
    <>
      {/* Signature Section */}
      <div style={{ 
        marginTop: '18pt',
        textAlign: 'center',
        color: '#000080',
        fontFamily: FORMAT_C_CONFIG.fontFamily,
        marginRight: '-205pt',
      }}>
        <p style={{ fontWeight: 'bold', fontSize: '13pt', marginBottom: '48pt', textTransform: 'uppercase', color: '#000080' }}>
          FOR THE CITY PROSECUTOR:
        </p>
        
        <div>
          <p style={{ fontWeight: 'bold', fontSize: '13pt', marginBottom: '2pt', color: '#000080' }}>REGIE C. POCON</p>
          <p style={{ fontSize: '13pt', fontStyle: 'italic', fontWeight: 'normal', color: '#000080' }}>Administrative Officer V</p>
        </div>
      </div>
    </>
  );
};

// ============================================
// FORMAT C COMPLETE PREVIEW COMPONENT
// ============================================
export const FormatCPreview: React.FC<ClearanceTemplateProps & { generatedOR?: string | null; showFullTemplate?: boolean }> = ({ 
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
        <FormatCHeader />
        <FormatCBody data={data} />
        <FormatCFooter data={data} generatedOR={generatedOR} />
        
        {/* O.R No and Date */}
        <div style={{ marginLeft: '0.3in', marginBottom: '12pt', marginTop: '24pt', color: FORMAT_C_CONFIG.textColor, fontSize: '13pt' }}>
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
        <p style={{ fontSize: '10pt', fontStyle: 'italic', marginTop: '16pt', color: FORMAT_C_CONFIG.textColor }}>
          {data.validity_period === '1 Year' ? 'Note: Valid until 1 year from the date issued.' : 'Note: Valid until 6 months from the date issued.'}
        </p>
      </div>
    );
  }

  return <FormatCBody data={data} />;
};

// ============================================
// FORMAT C PRINT TEMPLATE HTML GENERATOR
// ============================================
export const getFormatCHtml = (formData: FormData, fullName: string, generatedOR?: string | null): string => {
  const hasCriminalRecord = formData.criminal_cases && formData.criminal_cases.some(c => c.case_number && c.crime);
  
  // Build display name for signature
  const signatureName = [
    formData.first_name?.toUpperCase(),
    formData.middle_name ? `${formData.middle_name.charAt(0).toUpperCase()}.` : '',
    formData.last_name?.toUpperCase(),
  ].filter(Boolean).join(' ');

  // Build requester name
  const requesterName = formData.issued_upon_request_by || 
    `Mr. ${formData.first_name} ${formData.middle_name ? formData.middle_name.charAt(0) + '.' : ''} ${formData.last_name}`.trim();

  // Format dates
  const issuedDate = formData.date_issued ? new Date(formData.date_issued) : new Date();
  const issuedDay = issuedDate.getDate();
  const issuedOrdinal = getOrdinalSuffix(issuedDay);
  const issuedMonthYear = issuedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const issuedFullDate = issuedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  
  const validityDate = formData.validity_expiry ? formatFullDate(formData.validity_expiry) : '[VALIDITY DATE]';

  const statusHtml = `<p style="text-align: center; font-weight: bold; font-size: 28pt; color: ${FORMAT_C_CONFIG.noRecordColor}; margin: 12pt 0 24pt 0;">"NO CRIMINAL RECORD"</p>`;

  return `<!DOCTYPE html>
<html>
<head>
  <title>Certificate - Format C</title>
  <style>
    @page { size: 8.5in 13in; margin: 0.4in 0.6in 0.2in 0.6in; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
    body { margin: 0; padding: 0; font-family: ${FORMAT_C_CONFIG.fontFamily}; font-size: 13pt; line-height: 1.0; color: ${FORMAT_C_CONFIG.textColor}; background: white; }
    .certificate-container { width: 100%; max-width: 7in; margin: 0 auto; padding: 0; }
    .header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 4pt; }
    .header img { width: 1.2in; height: 1.2in; object-fit: contain; }
    .header .left-logo { margin-right: 0.3in; }
    .header .right-logo { margin-left: 0.3in; }
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
        <p style="font-size: 13pt; font-style: normal; color: ${FORMAT_C_CONFIG.textColor}; line-height: 1.0;">Republic of the Philippines</p>
        <p style="font-size: 13pt; font-style: normal; color: ${FORMAT_C_CONFIG.textColor}; line-height: 1.0;">Department of Justice</p>
        <p style="font-size: 13pt; font-weight: bold; color: ${FORMAT_C_CONFIG.textColor}; line-height: 1.0;">OFFICE OF THE CITY PROSECUTOR</p>
        <p style="font-size: 13pt; color: ${FORMAT_C_CONFIG.textColor}; line-height: 1.0;">City of Tagbilaran</p>
        <p style="font-size: 10pt; font-style: italic; color: ${FORMAT_C_CONFIG.textColor}; line-height: 1.0;">Hall of Justice Building, Brgy. Cogon,</p>
        <p style="font-size: 10pt; font-style: italic; color: ${FORMAT_C_CONFIG.textColor}; line-height: 1.0;">Tagbilaran City</p>
        <p style="font-size: 10pt; font-style: italic; color: ${FORMAT_C_CONFIG.textColor}; line-height: 1.0;">Tel. No. 411-3403/411-2306</p>
        <p style="font-size: 10pt; font-style: italic; color: ${FORMAT_C_CONFIG.textColor}; line-height: 1.0;">Email: <a href="mailto:ocptagbilaran@doj.gov.ph" style="color: ${FORMAT_C_CONFIG.textColor};">ocptagbilaran@doj.gov.ph</a></p>
      </div>
      <img src="/images/logos/bagong-pilipinas.png" alt="Bagong Pilipinas" class="right-logo" />
    </div>
    
    <br/>
    
    <!-- TITLE -->
    <div style="text-align: center; margin: 4pt 0 8pt 0;">
      <h1 style="font-size: 20pt; font-weight: bold; letter-spacing: 0.03em; margin: 0; color: ${FORMAT_C_CONFIG.textColor};">CERTIFICATE OF CLEARANCE</h1>
    </div>
    
    <br/>
    
    <!-- SALUTATION -->
    <p style="font-size: 13pt; font-weight: bold; margin-bottom: 4pt; color: ${FORMAT_C_CONFIG.textColor};">TO WHOM IT MAY CONCERN:</p>
    
    <br/>
    
    <!-- BODY -->
    <div style="color: #000080;">
      <!-- Main certification paragraph -->
      <p style="text-indent: 0.5in; text-align: justify; margin-bottom: 10pt; font-size: 13pt; line-height: 1.6; margin-top: 0; color: #000080;">
        &thinsp;&thinsp;&nbsp;&thinsp;&thinsp;&thinsp;&nbsp;&nbsp;&nbsp;&thinsp;&thinsp; THIS IS TO CERTIFY that the records of this office show that one 
        <strong style="text-transform: uppercase;">${fullName}</strong>, 
        <strong>${formData?.age || '[AGE]'}</strong> years old, 
        <strong>${formData?.civil_status || '[CIVIL STATUS]'}</strong>, 
        <strong>${formData?.nationality || '[NATIONALITY]'}</strong>, 
        residing at <strong>${formData?.address || '[ADDRESS]'}</strong> has
      </p>
      

      <!-- Criminal Record Status -->
      ${statusHtml}

      <!-- Issued upon request and Purpose -->
      <div style="margin-left: 0.5in; margin-bottom: 12pt; color: #000080;">
        <p style="margin-bottom: 2pt; margin-top: 0; font-size: 13pt; color: #000080;">
          Issued upon request: <strong style="text-decoration: underline;">${requesterName}</strong>
        </p>
        <p style="margin-top: 0; font-size: 13pt; color: #000080;">
          Purpose: <strong style="text-decoration: underline;">${formData?.purpose === 'Other' ? formData?.custom_purpose?.toUpperCase() : formData?.purpose?.toUpperCase() || '[PURPOSE]'}</strong>
        </p>
      </div>

      <!-- Signature and Thumbmark Section -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin: 16pt 0.5in;">
        <!-- Left side - Signature -->
        <div style="text-align: center; margin-left: 1.8in;">
          <p style="font-weight: bold; margin-bottom: 8pt; text-transform: uppercase; border-bottom: 1px solid #000080; padding-bottom: 2pt; display: inline-block; font-size: 13pt; color: #000080;">
            ${signatureName || '[NAME]'}
          </p>
          <p style="font-size: 13pt; margin-top: 2pt; margin-bottom: 0; color: #000080;">
            Signature
          </p>
        </div>

        <!-- Right side - Thumbmark -->
        <div style="text-align: center;margin-right: 0.6in;">
          <div style="width: 1.3in; height: 1.0in; border: 3px solid #000080; background-color: #fff; margin-bottom: 2pt;"></div>
          <p style="font-size: 9pt; color: #000080; margin-top: 0; margin-bottom: 0;">
            RIGHT THUMBMARK
          </p>
        </div>
      </div>

      <!-- DOJ ID No. and Valid Until -->
      <div style="margin-left: 0.5in; margin-bottom: 12pt; color: #000080;">
        <p style="margin-bottom: 2pt; margin-top: 0; font-size: 13pt; color: #000080;">
          <span style="display: inline-block; width: 100px;">DOJ ID No.</span> : <strong style="text-decoration: underline;">${formData?.prc_id_number || '[DOJ ID NUMBER]'}</strong>
        </p>
        <p style="margin-top: 0; font-size: 13pt; color: #000080;">
          <span style="display: inline-block; width: 100px;">Valid Until</span> : <strong style="text-decoration: underline;">${validityDate}</strong>
        </p>
      </div>

      <!-- Witness Clause -->
      <p style="text-indent: 0.5in; text-align: justify; margin-top: 8pt; margin-bottom: 6pt; font-size: 13pt; line-height: 1.4; color: #000080;">
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&thinsp;&thinsp;WITNESS MY HAND this 
        <strong style="text-decoration: underline;">${issuedDay}${issuedOrdinal}</strong> 
        day of 
        <strong style="text-decoration: underline;">${issuedMonthYear}</strong> 
        in the City of Tagbilaran, Bohol, Philippines.
      </p>
    </div>
    
    <div style="height: 2px;"></div>
    
    <!-- SIGNATURE -->
    <div style="text-align: right; margin-top: 4pt; margin-right: 0.3in; display: flex; flex-direction: column; align-items: flex-end;">
      <p style="font-size: 13pt; font-weight: bold; margin-bottom: 8pt; text-transform: uppercase; color: #000080;">FOR THE CITY PROSECUTOR:</p>
      <div style="height: 20pt;"></div>
      <p style="font-size: 13pt; font-weight: bold; margin-bottom: 0; margin-right: 25pt; color: #000080;">REGIE C. POCON</p>
      <p style="font-size: 13pt; font-style: normal; margin-top: 0pt; margin-right: 5pt; color: #000080;">Administrative  Officer V</p>
    </div>
    <!-- FOOTER -->
    <div style="margin-left: -0.1; margin-top: 0; font-size: 13pt">
      <p style="margin-bottom: 0pt; color: #000080; line-height: 1.0;">
        O.R No : <strong style="text-decoration: underline;">${formData.or_number || formData.prc_id_number || generatedOR || '[OR NUMBER]'}</strong>
      </p>
      <p style="color: #000080; line-height: 1.0; margin-top: 0;">
        Date : <strong style="text-decoration: underline;">${issuedFullDate}</strong>
      </p>
    </div>

    <!-- Note -->
    <p style="font-size: 10pt; font-style: italic; margin-top: 2pt; margin-bottom: -3; color: #000080;">
      ${formData.validity_period === '1 Year' ? 'Note: Valid until 1 year from the date issued.' : 'Note: Valid until 6 months from the date issued.'}
    </p>
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
