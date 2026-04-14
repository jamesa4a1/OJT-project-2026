// Format E - Bail Bond / No Prior Conviction Certification
// This file contains the complete template for Format E including header, body, and footer
// Matches the paragraph-style certification format

import React from 'react';
import {
  FormData,
  ClearanceTemplateProps,
  TEXT_COLOR,
  getBaseStyle,
  formatDate,
  formatFullDate,
  buildFullName,
} from './types';

// ============================================
// FORMAT E CONFIGURATION
// ============================================
const FORMAT_E_CONFIG = {
  textColor: TEXT_COLOR,           // Main text color (dark blue)
  bodyFontSize: '12pt',            // Body text font size
  fontFamily: "'Century Gothic'",
};

// Helper to get the actual color value from the color type
const getTextColorValue = (colorType: 'navy' | 'black'): string => {
  return colorType === 'black' ? '#000000' : '#000080';
};

// Build the full name in "FIRST_NAME LAST_NAME y MIDDLE_NAME" format
const buildFormatEName = (data: FormData): string => {
  const first = data.first_name?.toUpperCase() || '';
  const last = data.last_name?.toUpperCase() || '';
  const middle = data.middle_name?.toUpperCase() || '';
  const suffix = data.suffix ? ` ${data.suffix.toUpperCase()}` : '';
  
  if (middle) {
    return `${first} ${last}${suffix} y ${middle}`;
  }
  return `${first} ${last}${suffix}`;
};

// ============================================
// FORMAT E HEADER COMPONENT
// ============================================
const FormatEHeader: React.FC<{ dojSealSrc?: string; bagongPilipinasSrc?: string; textColor?: 'navy' | 'black' }> = ({ 
  dojSealSrc = '/images/logos/doj-seal.png',
  bagongPilipinasSrc = '/images/logos/bagong-pilipinas.png',
  textColor = 'navy'
}) => {
  const colorValue = getTextColorValue(textColor);
  
  return (
    <>
      {/* Header with Official Logos */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ flexShrink: 0, width: '1.2in', marginRight: '0.3in' }}>
          <img 
            src={dojSealSrc} 
            alt="DOJ Seal" 
            style={{ width: '1.2in', height: '1.2in', objectFit: 'contain' }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        </div>

        <div style={{ flex: 1, textAlign: 'center', fontFamily: FORMAT_E_CONFIG.fontFamily, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', margin: '0 0.2in' }}>
          <p style={{ color: colorValue, fontSize: '9pt', fontStyle: 'italic', lineHeight: '1.2', fontWeight: 'normal', margin: '0' }}>Republic of the Philippines</p>
          <p style={{ color: colorValue, fontSize: '9pt', fontStyle: 'italic', lineHeight: '1.2', fontWeight: 'normal', margin: '0' }}>Department of Justice</p>
          <p style={{ color: colorValue, fontSize: '11pt', fontWeight: 'bold', lineHeight: '1.2', margin: '0' }}>OFFICE OF THE CITY PROSECUTOR</p>
          <p style={{ color: colorValue, fontSize: '9pt', lineHeight: '1.2', fontWeight: 'normal', margin: '0' }}>City of Tagbilaran</p>
          <p style={{ color: colorValue, fontSize: '7pt', fontStyle: 'italic', lineHeight: '1.2', fontWeight: 'normal', margin: '0' }}>Hall of Justice Building, Brgy. Cogon, Tagbilaran City</p>
          <p style={{ color: colorValue, fontSize: '7pt', fontStyle: 'italic', lineHeight: '1.2', fontWeight: 'normal', margin: '0' }}>Tel. No. 411-3403/411-2306</p>
          <p style={{ color: colorValue, fontSize: '8pt', fontStyle: 'italic', lineHeight: '1.2', fontWeight: 'normal', margin: '0' }}>
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

      {/* CERTIFICATION Title */}
      <div style={{ textAlign: 'center', margin: '24pt 0 20pt 0' }}>
        <h1 style={{ 
          color: colorValue, 
          fontSize: '18pt', 
          fontWeight: 'bold', 
          letterSpacing: '0.15em',
          fontFamily: FORMAT_E_CONFIG.fontFamily,
          margin: '0',
          padding: '0',
        }}>
          C E R T I F I C A T I O N
        </h1>
      </div>

      {/* Salutation */}
      <p style={{ fontWeight: 'bold', marginBottom: '16pt', textAlign: 'left', fontSize: '11pt', textTransform: 'uppercase', color: colorValue }}>
        TO WHOM IT MAY CONCERN:
      </p>
    </>
  );
};

// ============================================
// FORMAT E BODY COMPONENT
// ============================================
const FormatEBody: React.FC<{ data: FormData; textColor?: 'navy' | 'black' }> = ({ data, textColor = 'navy' }) => {
  const fullName = buildFormatEName(data);
  const issuedDateInfo = data.date_issued ? formatDate(data.date_issued) : null;
  const purpose = data.purpose === 'Other' ? (data.custom_purpose || '[PURPOSE]') : (data.purpose || '[PURPOSE]');
  const colorValue = getTextColorValue(textColor);

  return (
    <div style={{ color: colorValue, fontSize: FORMAT_E_CONFIG.bodyFontSize, lineHeight: '1.6' }}>
      {/* First paragraph - certification of no prior conviction */}
      <p style={{ textIndent: '0.5in', textAlign: 'justify', marginBottom: '12pt' }}>
        THIS IS TO CERTIFY that the records of this office show that one{' '}
        <strong>{fullName || '[FULL NAME]'},{' '}
        {data.age || '[AGE]'} years old, {data.civil_status || '[CIVIL STATUS]'},{' '}
        {data.nationality || '[NATIONALITY]'}</strong>, residing at{' '}
        <strong>{data.address || '[ADDRESS]'}{' '}</strong>
        has no prior conviction of any crime whatsoever.
      </p>

      {/* Second paragraph - not a habitual delinquent */}
      <p style={{ textIndent: '0.5in', textAlign: 'justify', marginBottom: '12pt' }}>
        This certifies further that the above-mentioned accused is neither a habitual delinquent nor a recidivist as per records found in this office.
      </p>

      {/* Third paragraph - purpose */}
      <p style={{ textIndent: '0.5in', textAlign: 'justify', marginBottom: '12pt' }}>
        This CERTIFICATION is issued for the <strong>purpose of bail bond application.</strong>
      </p>

      {/* WITNESS MY HAND */}
      <p style={{ textIndent: '0.5in', textAlign: 'justify', marginTop: '16pt' }}>
        WITNESS MY HAND this{' '}
        <strong>
          {issuedDateInfo ? `${issuedDateInfo.day}` : '[DAY]'}<sup>{issuedDateInfo ? issuedDateInfo.suffix : ''}</sup>
        </strong>{' '}
        day of{' '}
        <strong>
          {issuedDateInfo ? issuedDateInfo.monthYear : '[MONTH, YEAR]'}
        </strong>{' '}
        in the City of Tagbilaran, Bohol, Philippines.
      </p>
    </div>
  );
};

// ============================================
// FORMAT E FOOTER/SIGNATURE COMPONENT
// ============================================
const FormatEFooter: React.FC<{ data: FormData; generatedOR?: string | null; textColor?: 'navy' | 'black' }> = ({ data, generatedOR, textColor = 'navy' }) => {
  const colorValue = getTextColorValue(textColor);
  
  const getValidityMessage = () => {
    if (data.validity_period) {
      return `Note: Valid until ${data.validity_period.toLowerCase()} from the date issued.`;
    }
    return 'Note: Valid until 6 months from the date issued.';
  };

  const fullDate = data.date_issued 
    ? new Date(data.date_issued).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : '[DATE]';

  return (
    <>
      {/* Signature Section - Right aligned */}
      <div style={{ 
        marginTop: '28pt',
        textAlign: 'right',
        color: colorValue,
        fontFamily: FORMAT_E_CONFIG.fontFamily,
        paddingRight: '0.3in',
      }}>
        <p style={{ fontWeight: 'bold', fontSize: '11pt', marginBottom: '48pt', textTransform: 'uppercase', color: colorValue }}>
          FOR THE CITY PROSECUTOR:
        </p>
        
        <div style={{ textAlign: 'center', marginLeft: 'auto', width: '3in' }}>
          <p style={{ fontWeight: 'bold', fontSize: '11pt', marginBottom: '2pt', marginRight: '-67pt', color: colorValue }}>REGIE C. POCON</p>
          <p style={{ fontSize: '9pt', fontStyle: 'normal', fontWeight: 'normal', marginRight: '-69pt', color: colorValue, margin: '0' }}>      Administrative Officer V</p>
        </div>
      </div>

      {/* Footer - O.R No, Date, Note */}
      <div style={{ marginTop: '48pt', color: colorValue, fontSize: '11pt', fontFamily: FORMAT_E_CONFIG.fontFamily }}>
        <p style={{ marginBottom: '2pt', color: colorValue }}>
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
// FORMAT E COMPLETE PREVIEW COMPONENT
// ============================================
export const FormatEPreview: React.FC<ClearanceTemplateProps & { generatedOR?: string | null; showFullTemplate?: boolean; textColor?: 'navy' | 'black' }> = ({ 
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
        <FormatEHeader textColor={textColor} />
        <FormatEBody data={data} textColor={textColor} />
        <FormatEFooter data={data} generatedOR={generatedOR} textColor={textColor} />
      </div>
    );
  }

  return <FormatEBody data={data} textColor={textColor} />;
};

// ============================================
// FORMAT E PRINT TEMPLATE HTML GENERATOR
// ============================================
export const getFormatEHtml = (formData: FormData, fullName: string, generatedOR?: string | null, textColor: 'navy' | 'black' = 'navy'): string => {
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

  // Build name in "FIRST LAST y MIDDLE" format
  const first = formData.first_name?.toUpperCase() || '';
  const last = formData.last_name?.toUpperCase() || '';
  const middle = formData.middle_name?.toUpperCase() || '';
  const suffix = formData.suffix ? ` ${formData.suffix.toUpperCase()}` : '';
  const formatEName = middle ? `${first} ${last}${suffix} y ${middle}` : `${first} ${last}${suffix}`;

  const purpose = formData.purpose === 'Other' ? (formData.custom_purpose || '[PURPOSE]') : (formData.purpose || '[PURPOSE]');
  const validityNote = formData.validity_period 
    ? `Note: Valid until ${formData.validity_period.toLowerCase()} from the date issued.`
    : 'Note: Valid until 6 months from the date issued.';

  return `<!DOCTYPE html>
<html>
<head>
  <title>Certificate - Format E</title>
  <style>
    @page { size: 8.5in 13in; margin: 0.8in 0.9in 0.6in 0.9in; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
    body { margin: 0; padding: 0; font-family: ${FORMAT_E_CONFIG.fontFamily}; font-size: 12pt; line-height: 1.5; color: ${colorValue}; background: white; }
    .certificate-container { width: 100%; max-width: 7in; margin: 0 auto; padding: 0; }
    .header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 8pt; }
    .header img { width: 1.1in; height: 1.1in; object-fit: contain; }
    .header .left-logo { width: 1.2in; height: 1.3in; margin-left: 0.25in; }
    .header .right-logo { width: 1.3in; height: 1.4in; margin-right: 0.10in; }
    .header-text { flex: 1; text-align: center; padding: 0 0.1in; }
    .header-text p { margin: 0; line-height: 1.2; }
    sup { font-size: 0.7em; }
    @media print { body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }
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
        <p style="font-size: 13pt; color: ${colorValue};">City of Tagbilaran</p>
        <p style="font-size: 10pt; font-style: italic; color: ${colorValue};">Hall of Justice Building, Brgy. Cogon, Tagbilaran City</p>
        <p style="font-size: 10pt; font-style: italic; color: ${colorValue};">Tel. No. 411-3403/411-2306</p>
        <p style="font-size: 10pt; font-style: italic; color: ${colorValue};">Email: <a href="mailto:ocptagbilaran@doj.gov.ph" style="color: #0000FF; text-decoration: underline;">ocptagbilaran@doj.gov.ph</a></p>
      </div>
      <img src="/images/logos/bagong-pilipinas.png" alt="Bagong Pilipinas" class="right-logo" />
    </div>

    <div style="height: 3px;"></div>
    
    <!-- TITLE -->
    <div style="text-align: center; margin: 20pt 0 16pt 0;">
      <h1 style="font-size: 24pt; font-weight: bold;  letter-spacing: 0.04em; margin: 0; color: ${colorValue};">C E R T I F I C A T I O N</h1>
    </div>
    
<div style="height: 3px;"></div>

    <!-- SALUTATION -->
    <p style="font-size: 14pt; font-weight: bold; margin-bottom: 12pt; margin-top: 16pt; color: ${colorValue};">TO WHOM IT MAY CONCERN:</p>
    
<div style="height: 2px;"></div>

    <!-- BODY -->
    <div style="color: ${colorValue}; font-size: 14pt; line-height: 1.6;">
      
      <!-- First paragraph -->
      <p style="text-indent: 0.5in; text-align: justify; line-height: 1.2; margin-bottom: 10pt; margin-top: 16pt;">
        &nbsp;&nbsp;&nbsp;&thinsp;&thinsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&thinsp;&thinsp;&thinsp;THIS IS TO CERTIFY that the records of this office show that one <strong>${formatEName || '[FULL NAME]'}</strong>, ${formData.age || '[AGE]'} years old, ${formData.civil_status || '[CIVIL STATUS]'}, ${formData.nationality || '[NATIONALITY]'}, residing at ${formData.address || '[ADDRESS]'} has no prior conviction of any crime whatsoever.
      </p>
      
      <!-- Second paragraph -->
      <p style="text-indent: 0.5in; text-align: justify; line-height: 1.2; margin-bottom: 10pt;">
        &nbsp;&nbsp;&nbsp;&nbsp;&thinsp;&thinsp;&thinsp;&thinsp;This certifies further that the above-mentioned accused is neither a habitual delinquent nor a recidivist as per records found in this office.
      </p>
      
      <!-- Third paragraph - purpose -->
      <p style="text-indent: 0.5in; text-align: justify; line-height: 1.2; margin-bottom: 10pt;">
        &nbsp;&nbsp;&thinsp;&thinsp;&thinsp;&thinsp;&thinsp;&nbsp;&thinsp;&thinsp;This CERTIFICATION is issued for the <strong>purpose of bail bond application</strong>.
      </p>
      
      <!-- WITNESS MY HAND -->
      <p style="text-indent: 0.5in; text-align: justify; line-height: 1.2; margin-top: 16pt;">
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&thinsp;&thinsp;&thinsp;&thinsp;&thinsp;&thinsp;&thinsp;WITNESS MY HAND this <strong>${dayNum}<sup>${getOrdinalSuffix(dayNum)}</sup></strong> day of <strong>${monthYear}</strong> in the City of Tagbilaran, Bohol, Philippines.
      </p>
    </div>
    
    <!-- SIGNATURE -->
    <div style="text-align: right; margin-top: 32pt; margin-right: 0.3in;">
      <p style="font-size: 14pt; font-weight: bold; margin-bottom: 48pt; text-transform: uppercase; color: ${colorValue};">FOR THE CITY PROSECUTOR:</p>
      <div style="text-align: center; margin-left: auto; width: 3in;">
        <p style="font-size: 14pt; font-weight: bold; margin-bottom: 2pt; margin-right: -50pt; color: ${colorValue};">REGIE C. POCON</p>
        <p style="font-size: 14pt; font-style: normal; margin-top: 0; margin-right: -45pt; color: ${colorValue};">Administrative Officer V</p>
      </div>
    </div>
    
    <!-- FOOTER -->
    <div style="margin-top: 48pt; font-size: 14pt; color: ${colorValue};">
      <p style="margin: 0 0 2pt 0; line-height: 1.0; color: ${colorValue};">O.R No: <strong><u>${formData.prc_id_number || generatedOR || '________'}</u></strong></p>
      <p style="margin: 0 0 16pt 0; line-height: 1.0; color: ${colorValue};">Date: <strong><u>${fullDate}</u></strong></p>
      <p style="font-style: italic; font-size: 11pt; margin-top: 36pt; color: ${colorValue};">${validityNote}</p>
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
export { FormatEHeader, FormatEBody, FormatEFooter };
