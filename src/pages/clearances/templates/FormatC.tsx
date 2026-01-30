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
  textColor: TEXT_COLOR,           // Main text color (dark blue)
  noRecordColor: '#008000',        // Green for "NO CRIMINAL RECORD"
  withRecordColor: '#DC2626',      // Red for "WITH CRIMINAL RECORD"
  noRecordFontSize: '25pt',        // Font size for status
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
        <div style={{ flexShrink: 0, width: '0.8in' }}>
          <img 
            src={dojSealSrc} 
            alt="DOJ Seal" 
            style={{ width: '0.8in', height: '0.8in', objectFit: 'contain' }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        </div>

        <div style={{ flex: 1, textAlign: 'center', fontFamily: FORMAT_C_CONFIG.fontFamily, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <p style={{ color: textColor, fontSize: '12pt', fontStyle: 'normal', marginBottom: '1pt', lineHeight: '1.1', fontWeight: 'normal', margin: '0' }}>Republic of the Philippines</p>
          <p style={{ color: textColor, fontSize: '12pt', fontStyle: 'normal', marginBottom: '1pt', lineHeight: '1.1', fontWeight: 'normal', margin: '0' }}>Department of Justice</p>
          <p style={{ color: textColor, fontSize: '12pt', fontWeight: 'bold', marginBottom: '1pt', lineHeight: '1.1', margin: '0' }}>OFFICE OF THE CITY PROSECUTOR</p>
          <p style={{ color: textColor, fontSize: '9pt', marginBottom: '2pt', lineHeight: '1.1', fontWeight: 'normal', margin: '0' }}>City of Tagbilaran</p>
          <p style={{ color: textColor, fontSize: '9pt', fontStyle: 'italic', marginBottom: '1pt', lineHeight: '1.1', fontWeight: 'normal', margin: '0' }}>Hall of Justice Building, Brgy. Cogon, Tagbilaran City</p>
          <p style={{ color: textColor, fontSize: '8pt', fontStyle: 'italic', marginBottom: '1pt', lineHeight: '1.1', fontWeight: 'normal', margin: '0' }}>Tel. No. 411-3403/411-2306</p>
          <p style={{ color: '#000000', fontSize: '8pt', fontStyle: 'italic', marginBottom: '0pt', lineHeight: '1.1', fontWeight: 'normal', margin: '0' }}>
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
      <p style={{ fontWeight: 'bold', marginBottom: '12pt', textAlign: 'left', fontSize: '12pt', textTransform: 'uppercase', color: textColor }}>
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
      <p style={{ textIndent: '0.5in', textAlign: 'justify', marginBottom: '12pt', fontSize: FORMAT_C_CONFIG.bodyFontSize, lineHeight: 1.6 }}>
        THIS IS TO CERTIFY that the records of this office show that one{' '}
        <strong style={{ textTransform: 'uppercase' }}>{fullName || '[FULL NAME]'}</strong>,{' '}
        <strong>{data.age || '[AGE]'}</strong> years old, <strong>{data.civil_status || '[CIVIL STATUS]'}</strong>,{' '}
        <strong>{data.nationality || '[NATIONALITY]'}</strong>, residing at{' '}
        <strong>{data.address || '[ADDRESS]'}</strong> has
      </p>

      {/* Criminal Record Status */}
      {hasCriminalRecord ? (
        <p style={{ textAlign: 'center', fontWeight: 'bold', fontSize: FORMAT_C_CONFIG.noRecordFontSize, color: FORMAT_C_CONFIG.withRecordColor, margin: '20pt 0' }}>
          &quot;WITH CRIMINAL RECORD&quot;
        </p>
      ) : (
        <p style={{ textAlign: 'center', fontWeight: 'bold', fontSize: FORMAT_C_CONFIG.noRecordFontSize, color: FORMAT_C_CONFIG.noRecordColor, margin: '20pt 0' }}>
          &quot;NO CRIMINAL RECORD&quot;
        </p>
      )}

      {/* Issued upon request and Purpose */}
      <div style={{ marginLeft: '0.5in', marginBottom: '16pt' }}>
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
            <p style={{ fontWeight: 'bold', margin: '0', textTransform: 'uppercase', fontSize: '12pt', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {signatureName || '[NAME]'}
            </p>
          </div>
          <p style={{ fontSize: '12pt', marginTop: '4pt', marginBottom: '4pt' }}>
            Signature
          </p>
        </div>

        {/* Right side - Thumbmark */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '1.2in', height: '1.2in', border: '2px solid #000080', backgroundColor: '#fff', marginBottom: '4pt' }}></div>
          <p style={{ fontSize: '8pt', color: '#000080', marginTop: '0', marginBottom: '0' }}>
            RIGHT THUMB MARK
          </p>
        </div>
      </div>

      {/* DOJ ID No. and Valid Until */}
      <div style={{ marginLeft: '0.3in', marginBottom: '12pt' }}>
        <p style={{ marginBottom: '4pt' }}>
          DOJ ID No. : <strong style={{ textDecoration: 'underline' }}>
            {data.prc_id_number || '[DOJ ID NUMBER]'}
          </strong>
        </p>
        <p>
          Valid Until : <strong style={{ textDecoration: 'underline' }}>
            {validityInfo ? validityInfo.fullDate : '[VALIDITY DATE]'}
          </strong>
        </p>
      </div>

      {/* Witness Clause */}
      <p style={{ textIndent: '0.5in', textAlign: 'justify', marginTop: '16pt', marginBottom: '24pt' }}>
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
const FormatCFooter: React.FC<{ data: FormData; generatedOR?: string | null }> = ({ data, generatedOR }) => {
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
        <p style={{ fontWeight: 'bold', fontSize: '10pt', marginBottom: '48pt', textTransform: 'uppercase', color: '#000080' }}>
          FOR THE CITY PROSECUTOR:
        </p>
        
        <div>
          <p style={{ fontWeight: 'bold', fontSize: '10pt', marginBottom: '2pt', color: '#000080' }}>REGIE C. POCON</p>
          <p style={{ fontSize: '9pt', fontStyle: 'italic', fontWeight: 'normal', color: '#000080' }}>Administrative Officer V</p>
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
        <div style={{ marginLeft: '0.3in', marginBottom: '12pt', marginTop: '24pt' }}>
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
        <p style={{ fontSize: '9pt', fontStyle: 'italic', marginTop: '16pt' }}>
          Note: Valid until 6 months from the date issued.
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
  const issuedDate = formData.date_issued ? new Date(formData.date_issued) : null;
  const issuedDay = issuedDate ? issuedDate.getDate() : 0;
  const issuedOrdinal = getOrdinalSuffix(issuedDay);
  const issuedMonthYear = issuedDate ? issuedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '';
  const issuedFullDate = issuedDate ? issuedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '';
  
  const validityDate = formData.validity_expiry ? formatFullDate(formData.validity_expiry) : '[VALIDITY DATE]';

  const statusHtml = hasCriminalRecord
    ? `<p style="text-align: center; font-weight: bold; font-size: ${FORMAT_C_CONFIG.noRecordFontSize}; color: ${FORMAT_C_CONFIG.withRecordColor}; margin: 12pt 0 24pt 0;">"WITH CRIMINAL RECORD"</p>`
    : `<p style="text-align: center; font-weight: bold; font-size: ${FORMAT_C_CONFIG.noRecordFontSize}; color: ${FORMAT_C_CONFIG.noRecordColor}; margin: 12pt 0 24pt 0;">"NO CRIMINAL RECORD"</p>`;

  return `
    <div class="certification-body" style="color: #000080;">
      <!-- Note -->
      <p style="font-size: 9pt; font-style: italic; margin-bottom: 8pt; margin-top: 0; color: #000080;">
        Note: Valid until 6 months from the date issued.
      </p>

      <!-- Main certification paragraph -->
      <p style="text-indent: 0.5in; text-align: justify; margin-bottom: 10pt; font-size: 12pt; line-height: 1.6; margin-top: 0; color: #000080;">
        THIS IS TO CERTIFY that the records of this office show that one 
        <strong style="text-transform: uppercase;">${fullName}</strong>, 
        <strong>${formData?.age || '[AGE]'}</strong> years old, 
        <strong>${formData?.civil_status || '[CIVIL STATUS]'}</strong>, 
        <strong>${formData?.nationality || '[NATIONALITY]'}</strong>, 
        residing at <strong>${formData?.address || '[ADDRESS]'}</strong> has
      </p>

      <!-- Criminal Record Status -->
      ${statusHtml}

      <!-- Issued upon request and Purpose -->
      <div style="margin-left: 1.0in; margin-bottom: 12pt; color: #000080;">
        <p style="margin-bottom: 2pt; margin-top: 0; font-size: 12pt; color: #000080;">
          Issued upon request: <strong style="text-decoration: underline;">${requesterName}</strong>
        </p>
        <p style="margin-top: 0; font-size: 12pt; color: #000080;">
          Purpose: <strong style="text-decoration: underline;">${formData?.purpose === 'Other' ? formData?.custom_purpose?.toUpperCase() : formData?.purpose?.toUpperCase() || '[PURPOSE]'}</strong>
        </p>
      </div>

      <!-- Signature and Thumbmark Section -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin: 16pt 0.5in;">
        <!-- Left side - Signature -->
        <div style="text-align: center; margin-left: 1.5in; width: 2.5in;">
          <p style="font-weight: bold; margin-bottom: 8pt; text-transform: uppercase; border-bottom: 1px solid #000080; padding-bottom: 2pt; min-height: 0.4in; display: flex; align-items: flex-end; justify-content: center; font-size: 12pt; color: #000080;">
            ${signatureName || '[NAME]'}
          </p>
          <p style="font-size: 12pt; margin-top: 2pt; margin-bottom: 0; color: #000080;">
            Signature
          </p>
        </div>

        <!-- Right side - Thumbmark -->
        <div style="text-align: center;">
          <div style="width: 1.0in; height: 1.0in; border: 2px solid #000080; background-color: #fff; margin-bottom: 2pt;"></div>
          <p style="font-size: 8pt; color: #000080; margin-top: 0; margin-bottom: 0;">
            RIGHT THUMBMARK
          </p>
        </div>
      </div>

      <!-- DOJ ID No. and Valid Until -->
      <div style="margin-left: 0.9in; margin-bottom: 12pt; color: #000080;">
        <p style="margin-bottom: 2pt; margin-top: 0; font-size: 12pt; color: #000080;">
          DOJ ID No. : <strong style="text-decoration: underline;">${formData?.prc_id_number || '[DOJ ID NUMBER]'}</strong>
        </p>
        <p style="margin-top: 0; font-size: 12pt; color: #000080;">
          Valid Until : <strong style="text-decoration: underline;">${validityDate}</strong>
        </p>
      </div>

      <!-- Witness Clause -->
      <p style="text-indent: 0.5in; text-align: justify; margin-top: 12pt; margin-bottom: 12pt; font-size: 12pt; line-height: 1.4; color: #000080;">
        WITNESS MY HAND this 
        <strong style="text-decoration: underline;">${issuedDay}${issuedOrdinal}</strong> 
        day of 
        <strong style="text-decoration: underline;">${issuedMonthYear}</strong> 
        in the City of Tagbilaran, Bohol, Philippines.
      </p>
    </div>
  `;
};

// Export header, body, footer components for flexible use
export { FormatCHeader, FormatCBody, FormatCFooter };
