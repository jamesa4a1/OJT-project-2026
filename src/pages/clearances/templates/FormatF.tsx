// Format F - Certification (Criminal Record with Case Details & Habitual Delinquent Clause)
// This file contains the complete template for Format F including header, body, and footer
// Edit this file to customize Format F independently from other formats

import React from 'react';
import {
  FormData,
  ClearanceTemplateProps,
  getBaseStyle,
  formatDate,
  buildFullName,
  hasCriminalRecord as checkCriminalRecord,
} from './types';

// ============================================
// FORMAT F CONFIGURATION
// ============================================
const FORMAT_F_CONFIG = {
  textColor: '#000080',
  bodyFontSize: '13pt',
  headerFontSize: '9pt',
  fontFamily: "'Century Gothic'",
};

// ============================================
// TEXT COLOR HELPER FUNCTION
// ============================================
const getTextColorValue = (colorType: 'navy' | 'black'): string => {
  return colorType === 'black' ? '#000000' : '#000080';
};

// ============================================
// FORMAT F HEADER COMPONENT
// ============================================
const FormatFHeader: React.FC<{ dojSealSrc?: string; bagongPilipinasSrc?: string; textColor?: 'navy' | 'black' }> = ({
  dojSealSrc = '/images/logos/doj-seal.png',
  bagongPilipinasSrc = '/images/logos/bagong-pilipinas.png',
  textColor = 'navy'
}) => {
  const colorValue = getTextColorValue(textColor);

  return (
    <>
      {/* Header with Official Logos */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '4pt' }}>
        <div style={{ flexShrink: 0, width: '1.0in' }}>
          <img
            src={dojSealSrc}
            alt="DOJ Seal"
            style={{ width: '1.0in', height: '1.0in', objectFit: 'contain' }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        </div>

        <div style={{ flex: 1, textAlign: 'center', fontFamily: FORMAT_F_CONFIG.fontFamily, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '0 8pt' }}>
          <p style={{ color: colorValue, fontSize: '11pt', fontStyle: 'italic', lineHeight: '1.3', margin: '0' }}>Republic of the Philippines</p>
          <p style={{ color: colorValue, fontSize: '11pt', fontStyle: 'italic', lineHeight: '1.3', margin: '0' }}>Department of Justice</p>
          <p style={{ color: colorValue, fontSize: '11pt', fontWeight: 'bold', lineHeight: '1.3', margin: '0' }}>OFFICE OF THE CITY PROSECUTOR</p>
          <p style={{ color: colorValue, fontSize: '11pt', fontStyle: 'italic', lineHeight: '1.3', margin: '0' }}>City of Tagbilaran</p>
          <p style={{ color: colorValue, fontSize: '8pt', fontStyle: 'italic', lineHeight: '1.3', margin: '0' }}>Hall of Justice Building, Brgy. Cogon, Tagbilaran City</p>
          <p style={{ color: colorValue, fontSize: '8pt', fontStyle: 'italic', lineHeight: '1.3', margin: '0' }}>Tel. No. 411-3403/411-2306</p>
          <p style={{ color: colorValue, fontSize: '8pt', fontStyle: 'italic', lineHeight: '1.3', margin: '0' }}>
            Email: <a href="mailto:ocptagbilaran@doj.gov.ph" style={{ color: '#0000FF', textDecoration: 'underline' }}>ocptagbilaran@doj.gov.ph</a>
          </p>
        </div>

        <div style={{ flexShrink: 0, width: '1.0in', textAlign: 'right' }}>
          <img
            src={bagongPilipinasSrc}
            alt="Bagong Pilipinas"
            style={{ width: '1.0in', height: '1.0in', objectFit: 'contain' }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
      </div>

      {/* CERTIFICATION Title */}
      <div style={{ textAlign: 'center', margin: '8pt 0 12pt 0' }}>
        <h1 style={{
          color: colorValue,
          fontSize: '18pt',
          fontWeight: 'bold',
          letterSpacing: '0.15em',
          fontFamily: FORMAT_F_CONFIG.fontFamily,
          margin: '0',
          padding: '0',
          textTransform: 'uppercase',
        }}>
          C E R T I F I C A T I O N
        </h1>
      </div>

      {/* Salutation */}
      <p style={{ fontWeight: 'bold', marginBottom: '8pt', textAlign: 'left', fontSize: FORMAT_F_CONFIG.bodyFontSize, textTransform: 'uppercase', color: colorValue }}>
        TO WHOM IT MAY CONCERN:
      </p>
    </>
  );
};

// ============================================
// FORMAT F BODY COMPONENT
// ============================================
const FormatFBody: React.FC<{ data: FormData; textColor?: 'navy' | 'black' }> = ({ data, textColor = 'navy' }) => {
  const colorValue = getTextColorValue(textColor);
  const fullName = buildFullName(data);
  const issuedDateInfo = data.date_issued ? formatDate(data.date_issued) : null;
  const hasCriminalRecord = checkCriminalRecord(data);

  return (
    <div style={{ color: colorValue, fontFamily: FORMAT_F_CONFIG.fontFamily }}>
      {/* Main certification text */}
      <p style={{ textIndent: '0.5in', textAlign: 'justify', marginBottom: '10pt', fontSize: FORMAT_F_CONFIG.bodyFontSize, lineHeight: '1.5' }}>
        THIS IS TO CERTIFY that the records of this office show that one{' '}
        <strong style={{ textTransform: 'uppercase' }}>{fullName || '[FULL NAME]'}</strong>,{' '}
        <strong>{data.age || '[AGE]'}</strong> years old, <strong>{data.civil_status || 'Single'}</strong>,{' '}
        <strong>{data.nationality || 'Filipino'}</strong>, residing at{' '}
        <strong>{data.address || '[ADDRESS]'}</strong> has been charged of the following:
      </p>

      {/* Criminal Case Details - Always Display in Preview Format */}
      <div style={{ margin: '10pt 0 10pt 0.5in', fontSize: FORMAT_F_CONFIG.bodyFontSize, lineHeight: '1.4' }}>
        {data.criminal_cases && data.criminal_cases.length > 0 ? (
          data.criminal_cases.map((crimCase, index) => (
            <div key={index} style={{ marginBottom: index < data.criminal_cases!.length - 1 ? '12pt' : '0' }}>
              <div style={{ display: 'flex', marginBottom: '2pt' }}>
                <span style={{ width: '1.6in', display: 'inline-block', whiteSpace: 'nowrap' }}>{crimCase?.case_number_type || 'Criminal Case No.'}</span>
                <span>: <strong>{crimCase?.case_number || ''}</strong></span>
              </div>
              <div style={{ display: 'flex', marginBottom: '2pt' }}>
                <span style={{ width: '1.6in', display: 'inline-block' }}>{crimCase?.date_type || 'Date Info Filed'}</span>
                <span>: {crimCase?.date_info_filed ? new Date(crimCase.date_info_filed).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''}</span>
              </div>
              <div style={{ display: 'flex', marginBottom: '2pt' }}>
                <span style={{ width: '1.6in', display: 'inline-block' }}>Crime</span>
                <span>: {crimCase?.crime || ''}</span>
              </div>
              <div style={{ display: 'flex', marginBottom: '2pt' }}>
                <span style={{ width: '1.6in', display: 'inline-block' }}>Status</span>
                <span>: {crimCase?.status || ''}</span>
              </div>
            </div>
          ))
        ) : (
          <div>
            <div style={{ display: 'flex', marginBottom: '2pt' }}>
              <span style={{ width: '1.6in', display: 'inline-block', whiteSpace: 'nowrap' }}>Criminal Case No.</span>
              <span>: <strong>&nbsp;</strong></span>
            </div>
            <div style={{ display: 'flex', marginBottom: '2pt' }}>
              <span style={{ width: '1.6in', display: 'inline-block' }}>Date Info Filed</span>
              <span>: &nbsp;</span>
            </div>
            <div style={{ display: 'flex', marginBottom: '2pt' }}>
              <span style={{ width: '1.6in', display: 'inline-block' }}>Crime</span>
              <span>: &nbsp;</span>
            </div>
            <div style={{ display: 'flex', marginBottom: '2pt' }}>
              <span style={{ width: '1.6in', display: 'inline-block' }}>Status</span>
              <span>: &nbsp;</span>
            </div>
          </div>
        )}
      </div>

      {/* Purpose paragraph */}
      <p style={{ textIndent: '0.1in', textAlign: 'justify', marginBottom: '10pt', fontSize: FORMAT_F_CONFIG.bodyFontSize, lineHeight: '1.5' }}>
        {'\u202F\u202F\u202F\u202F\u202F\u202F\u00A0\u00A0'}This CERTIFICATION is issued for the <strong>purpose of bail bond application</strong>.
      </p>

      {/* Habitual delinquent clause - display when criminal cases section is present */}
      {(data.criminal_cases && data.criminal_cases.length > 0) && (
        <p style={{ textIndent: '0.5in', textAlign: 'justify', marginBottom: '10pt', fontSize: FORMAT_F_CONFIG.bodyFontSize, lineHeight: '1.5' }}>
          This certifies that the above-mentioned accused is neither a habitual delinquent nor a recidivist as per records found in this office.
        </p>
      )}

      {/* WITNESS clause */}
      <p style={{ textIndent: '0.5in', textAlign: 'justify', marginTop: '12pt', fontSize: FORMAT_F_CONFIG.bodyFontSize, lineHeight: '1.5' }}>
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
// FORMAT F FOOTER/SIGNATURE COMPONENT
// ============================================
const FormatFFooter: React.FC<{ data: FormData; generatedOR?: string | null; textColor?: 'navy' | 'black' }> = ({ data, generatedOR, textColor = 'navy' }) => {
  const colorValue = getTextColorValue(textColor);
  const issuedDate = data.date_issued ? new Date(data.date_issued) : new Date();
  const fullDate = issuedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const getValidityMessage = () => {
    if (data.validity_period === '1 Year') {
      return 'Note: Valid until 1 year from the date issued.';
    } else if (data.validity_period === '6 Months') {
      return 'Note: Valid until 6 months from the date issued.';
    } else if (data.validity_period) {
      return `Note: Valid until ${data.validity_period} from the date issued.`;
    }
    return 'Note: Valid until 6 months from the date issued.';
  };

  return (
    <>
      {/* Signature Section - Right Aligned */}
      <div style={{
        textAlign: 'right',
        marginTop: '18pt',
        marginRight: '0.3in',
        color: colorValue,
        fontFamily: FORMAT_F_CONFIG.fontFamily,
      }}>
        <p style={{ fontWeight: 'bold', fontSize: FORMAT_F_CONFIG.bodyFontSize, marginBottom: '48pt', textTransform: 'uppercase', color: colorValue }}>
          FOR THE CITY PROSECUTOR:
        </p>

        <div style={{ textAlign: 'right' }}>
          <p style={{ fontWeight: 'bold', fontSize: FORMAT_F_CONFIG.bodyFontSize, marginBottom: '2pt', color: colorValue, marginRight: '0.3in' }}>REGIE C. POCON</p>
          <p style={{ fontSize: '10pt', fontStyle: 'normal', fontWeight: 'normal', color: colorValue, margin: '0', marginRight: '0.15in' }}>Administrative Officer V</p>
        </div>
      </div>

      {/* Footer - OR Number and Date */}
      <div style={{ marginTop: '48pt', color: colorValue, fontSize: FORMAT_F_CONFIG.bodyFontSize, fontFamily: FORMAT_F_CONFIG.fontFamily }}>
        <p style={{ marginBottom: '3pt', color: colorValue }}>
          O.R No: <strong style={{ textDecoration: 'underline', color: colorValue }}>{data.prc_id_number || generatedOR || '________'}</strong>
        </p>
        <p style={{ marginBottom: '16pt', color: colorValue }}>
          Date: <strong style={{ textDecoration: 'underline', color: colorValue }}>{fullDate}</strong>
        </p>
        <p style={{ fontStyle: 'italic', fontSize: '10pt', color: colorValue }}>
          {getValidityMessage()}
        </p>
      </div>
    </>
  );
};

// ============================================
// FORMAT F COMPLETE PREVIEW COMPONENT
// ============================================
export const FormatFPreview: React.FC<ClearanceTemplateProps & { generatedOR?: string | null; showFullTemplate?: boolean; textColor?: 'navy' | 'black' }> = ({
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
        <FormatFHeader textColor={textColor} />
        <FormatFBody data={data} textColor={textColor} />
        <FormatFFooter data={data} generatedOR={generatedOR} textColor={textColor} />
      </div>
    );
  }

  return <FormatFBody data={data} textColor={textColor} />;
};

// ============================================
// FORMAT F PRINT TEMPLATE HTML GENERATOR
// ============================================
export const getFormatFHtml = (formData: FormData, fullName: string, generatedOR?: string | null, textColor: 'navy' | 'black' = 'navy'): string => {
  const colorValue = getTextColorValue(textColor);
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

  // Build criminal case details HTML - Always Display
  const getCaseDetailsHtml = () => {
    let caseHtml = '<div style="margin: 10pt 0 10pt 0.5in; font-size: 13pt; line-height: 1.4;">';

    if (formData.criminal_cases && formData.criminal_cases.length > 0) {
      formData.criminal_cases.forEach((crimCase, index) => {
        caseHtml += `
          <div${index < formData.criminal_cases!.length - 1 ? ' style="margin-bottom: 12pt;"' : ''}>
            <div style="display: flex; margin-bottom: 2pt;">
              <span style="width: 1.6in; display: inline-block; white-space: nowrap;">${crimCase?.case_number_type || 'Criminal Case No.'}</span>
              <span>: <strong>${crimCase?.case_number || ''}</strong></span>
            </div>
            <div style="display: flex; margin-bottom: 2pt;">
              <span style="width: 1.6in; display: inline-block;">${crimCase?.date_type || 'Date Info Filed'}</span>
              <span>: ${crimCase?.date_info_filed ? new Date(crimCase.date_info_filed).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''}</span>
            </div>
            <div style="display: flex; margin-bottom: 2pt;">
              <span style="width: 1.6in; display: inline-block;">Crime</span>
              <span>: ${crimCase?.crime || ''}</span>
            </div>
            <div style="display: flex; margin-bottom: 2pt;">
              <span style="width: 1.6in; display: inline-block;">Status</span>
              <span>: ${crimCase?.status || ''}</span>
            </div>
          </div>
        `;
      });
    } else {
      // Show empty fields when no criminal cases
      caseHtml += `
        <div>
          <div style="display: flex; margin-bottom: 2pt;">
            <span style="width: 1.6in; display: inline-block; white-space: nowrap;">Criminal Case No.</span>
            <span>: <strong>&nbsp;</strong></span>
          </div>
          <div style="display: flex; margin-bottom: 2pt;">
            <span style="width: 1.6in; display: inline-block;">Date Info Filed</span>
            <span>: &nbsp;</span>
          </div>
          <div style="display: flex; margin-bottom: 2pt;">
            <span style="width: 1.6in; display: inline-block;">Crime</span>
            <span>: &nbsp;</span>
          </div>
          <div style="display: flex; margin-bottom: 2pt;">
            <span style="width: 1.6in; display: inline-block;">Status</span>
            <span>: &nbsp;</span>
          </div>
        </div>
      `;
    }

    caseHtml += '</div>';
    return caseHtml;
  };

  // Purpose text
  const purpose = formData.purpose === 'Other' ? (formData.custom_purpose || '[PURPOSE]') : (formData.purpose || '[PURPOSE]');

  // Habitual delinquent clause (display when criminal cases section is present)
  const getHabitualClauseHtml = () => {
    const hasCases = formData.criminal_cases && formData.criminal_cases.length > 0;
    if (!hasCases) return '';
    return `
      <p style="text-indent: 0.5in; text-align: justify; margin-bottom: 10pt; font-size: 13pt; line-height: 1.5; margin-left: 5;">
         This certifies that the above-mentioned accused is neither a habitual delinquent nor a recidivist as per records found in this office.
      </p>
    `;
  };

  return `<!DOCTYPE html>
<html>
<head>
  <title>Certificate - Format F</title>
  <style>
    @page { size: 8.5in 11in; margin: 0.2in 0.8in 0.4in 0.8in; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
    body { margin: 0; padding: 0; font-family: ${FORMAT_F_CONFIG.fontFamily}; font-size: 12pt; line-height: 1.2; color: ${colorValue}; background: white; }
    .certificate-container { width: 100%; max-width: 100%; margin: 0 auto; padding: 0.1in 0.3in; background: white; }
    .header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 0pt; }
    .header img { width: 1.0in; height: 1.0in; object-fit: contain; }
    .header .left-logo { width: 1.2in; height: 1.3in; margin-left: 0.15in; }
    .header .right-logo { width: 1.2in; height: 1.5in; margin-right: 0.10in; }
    .header-text { flex: 1; text-align: center; padding: 0 6pt; }
    .header-text p { margin: 0; line-height: 1.3; }
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
        <p style="font-size: 13pt; font-style: italic; color: ${colorValue}; line-height: 1.0;">Republic of the Philippines</p>
        <p style="font-size: 13pt; font-style: italic; color: ${colorValue}; line-height: 1.0;">Department of Justice</p>
        <p style="font-size: 13pt; font-weight: bold; color: ${colorValue}; line-height: 1.0;">OFFICE OF THE CITY PROSECUTOR</p>
        <p style="font-size: 13pt; font-style: italic; color: ${colorValue}; line-height: 1.0;">City of Tagbilaran</p>
        <p style="font-size: 10pt; font-style: italic; color: ${colorValue}; line-height: 1.0;">Hall of Justice Building, Brgy. Cogon, Tagbilaran City</p>
        <p style="font-size: 10pt; font-style: italic; color: ${colorValue}; line-height: 1.0;">Tel. No. 411-3403/411-2306</p>
        <p style="font-size: 10pt; font-style: italic;">Email: <a href="mailto:ocptagbilaran@doj.gov.ph" style="color: #0000FF; text-decoration: underline;">ocptagbilaran@doj.gov.ph</a></p>
      </div>
      <img src="/images/logos/bagong-pilipinas.png" alt="Bagong Pilipinas" class="right-logo" />
    </div>

    <div style="height: 4pt;"></div>

    <!-- TITLE -->
    <div style="text-align: center; margin: 4pt 0 8pt 0;">
      <h1 style="font-size: 22pt; font-weight: bold; letter-spacing: -0.2pt; margin: 0; color: ${colorValue}; text-transform: uppercase;">C E R T I F I C A T I O N</h1>
    </div>

    <div style="height: 2pt;"></div>

    <!-- SALUTATION -->
    <p style="font-size: 13pt; font-weight: bold; margin-bottom: 8pt; color: ${colorValue}; text-transform: uppercase;">TO WHOM IT MAY CONCERN:</p>

    <div style="height: 4pt;"></div>

    <!-- BODY -->
    <div style="color: ${colorValue};">
      <p style="text-indent: 0.5in; text-align: justify; margin-bottom: 10pt; font-size: 13pt; line-height: 1.5; margin-left: 10;">
        THIS IS TO CERTIFY that the records of this office show that one
        <strong style="text-transform: uppercase;">${fullName}</strong>,
        <strong>${formData?.age || '[AGE]'}</strong> years old,
        <strong>${formData?.civil_status || 'Single'}</strong>,
        <strong>${formData?.nationality || 'Filipino'}</strong>,
        residing at <strong>${formData?.address || '[ADDRESS]'}</strong> has been charged of the following:
      </p>

      ${getCaseDetailsHtml()}

      <p style="text-indent: 0.5in; text-align: justify; margin-bottom: whitespace: text-nowrap; 10pt; text-indent: -0.5in; font-size: 13pt; line-height: 1.5;">
         &nbsp; &nbsp; &nbsp; &nbsp;  &nbsp; &thinsp; &thinsp; &thinsp; &thinsp; This CERTIFICATION is issued for the <strong>purpose of bail bond application</strong>.
      </p>

      ${getHabitualClauseHtml()}

      <p style="text-indent: 0.5in; text-align: justify; margin-top: 12pt; font-size: 13pt; line-height: 1.5; margin-left: 5;">
        WITNESS MY HAND this <strong style="text-decoration: underline;">${dayNum}${getOrdinalSuffix(dayNum)}</strong>
        day of <strong style="text-decoration: underline;">${monthYear}</strong>
        in the City of Tagbilaran, Bohol, Philippines.
      </p>
    </div>

    <div style="height: 5pt;"></div>

    <!-- SIGNATURE -->
    <div style="text-align: right; margin-top: 14pt; margin-right: 0.3in;">
      <p style="font-size: 13pt; font-weight: bold; margin-bottom: 20pt; text-transform: uppercase; color: ${colorValue};">FOR THE CITY PROSECUTOR:</p>
      <p style="font-size: 13pt; font-weight: bold; margin-bottom: 2pt; margin-top: 35pt; margin-right: 0.4in; color: ${colorValue};">REGIE C. POCON</p>
      <p style="font-size: 13pt; font-style: normal; margin-top: 0pt; margin-right: 0.15in; color: ${colorValue};">Administrative Officer V</p>
    </div>

    <div style="height: 15pt;"></div>

    <!-- FOOTER -->
    <div style="margin-top: -10pt; font-size: 13pt; color: ${colorValue};">
      <p style="margin: 0 0 3pt 0; line-height: 1.0; color: ${colorValue};">O.R No: <strong><u>${formData.prc_id_number || generatedOR || '________'}</u></strong></p>
      <p style="margin: 0 0 3pt 0; line-height: 1.0; color: ${colorValue};">Date: <strong><u>${fullDate}</u></strong></p>
      <div style="height: 20pt;"></div>
      <p style="font-style: italic; font-size: 11pt; color: ${colorValue};">${
        formData.validity_period === '1 Year' 
          ? 'Note: Valid until 1 year from the date issued.' 
          : formData.validity_period === '6 Months'
          ? 'Note: Valid until 6 months from the date issued.'
          : formData.validity_period
          ? `Note: Valid until ${formData.validity_period} from the date issued.`
          : 'Note: Valid until 6 months from the date issued.'
      }</p>
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
export { FormatFHeader, FormatFBody, FormatFFooter };
