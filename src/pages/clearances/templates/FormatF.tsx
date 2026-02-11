// Format F - Complete Certification (Full Details with Photo)
// This file contains the complete template for Format F including header, body, and footer
// Edit this file to customize Format F independently from other formats

import React from 'react';
import {
  FormData,
  ClearanceTemplateProps,
  TEXT_COLOR,
  getBaseStyle,
  formatDate,
  formatDateString,
  formatFullDate,
  buildFullName,
  hasCriminalRecord as checkCriminalRecord,
} from './types';

// ============================================
// FORMAT F CONFIGURATION
// ============================================
// Customize these values to change Format F appearance
const FORMAT_F_CONFIG = {
  textColor: TEXT_COLOR,           // Main text color (dark blue)
  noRecordColor: '#008000',        // Green for "NO CRIMINAL RECORD"
  withRecordColor: '#DC2626',      // Red for "WITH CRIMINAL RECORD"
  noRecordFontSize: '20pt',        // Font size for no criminal record status
  withRecordFontSize: '16pt',      // Font size for with criminal record status
  bodyFontSize: '10pt',            // Body text font size
  detailsFontSize: '9pt',          // Personal details font size
  fontFamily: "'Century Gothic', Arial, sans-serif",
  photoBoxWidth: '1in',            // Photo box width
  photoBoxHeight: '1in',           // Photo box height
  thumbmarkBoxWidth: '0.8in',      // Thumbmark box width
  thumbmarkBoxHeight: '1in',       // Thumbmark box height
};

// ============================================
// FORMAT F HEADER COMPONENT
// ============================================
const FormatFHeader: React.FC<{ dojSealSrc?: string; bagongPilipinasSrc?: string }> = ({ 
  dojSealSrc = '/images/logos/doj-seal.png',
  bagongPilipinasSrc = '/images/logos/bagong-pilipinas.png'
}) => {
  const textColor = FORMAT_F_CONFIG.textColor;
  
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

        <div style={{ flex: 1, textAlign: 'center', fontFamily: FORMAT_F_CONFIG.fontFamily, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', margin: '0 0.2in' }}>
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
          color: textColor, 
          fontSize: '20pt', 
          fontWeight: 'bold', 
          letterSpacing: '0.1em',
          fontFamily: FORMAT_F_CONFIG.fontFamily,
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
// FORMAT F BODY COMPONENT
// ============================================
const FormatFBody: React.FC<{ data: FormData }> = ({ data }) => {
  const fullName = buildFullName(data);
  const issuedDateInfo = data.date_issued ? formatDate(data.date_issued) : null;
  const hasCriminalRecord = checkCriminalRecord(data);

  const renderCriminalRecordStatus = () => (
    <div style={{ marginBottom: '12pt' }}>
      <p style={{ textAlign: 'center', fontWeight: 'bold', fontSize: FORMAT_F_CONFIG.withRecordFontSize, color: FORMAT_F_CONFIG.withRecordColor, margin: '16pt 0' }}>
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
    <div style={{ color: FORMAT_F_CONFIG.textColor }}>
      {/* Photo and Thumbmark Section at top right */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12pt', gap: '16px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: FORMAT_F_CONFIG.photoBoxWidth, 
            height: FORMAT_F_CONFIG.photoBoxHeight, 
            border: '1px solid #ccc', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            backgroundColor: '#f5f5f5',
            fontSize: '8pt',
            color: '#666'
          }}>
            {data.photo ? <img src={data.photo} alt="Photo" style={{ maxWidth: '100%', maxHeight: '100%' }} /> : '2x2 PHOTO'}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: FORMAT_F_CONFIG.thumbmarkBoxWidth, 
            height: FORMAT_F_CONFIG.thumbmarkBoxHeight, 
            border: '1px solid #ccc', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            backgroundColor: '#f5f5f5',
            fontSize: '7pt',
            color: '#666'
          }}>
            RIGHT THUMBMARK
          </div>
        </div>
      </div>

      <p style={{ textIndent: '0.3in', textAlign: 'justify', marginBottom: '8pt', fontSize: FORMAT_F_CONFIG.bodyFontSize }}>
        THIS IS TO CERTIFY that based on the records on file in this Office:
      </p>

      {/* Complete Personal Information */}
      <div style={{ marginLeft: '0.3in', marginBottom: '12pt', fontSize: FORMAT_F_CONFIG.detailsFontSize }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '2pt 0', width: '35%' }}>Name:</td>
              <td style={{ padding: '2pt 0', fontWeight: 'bold', textTransform: 'uppercase' }}>{fullName || '[FULL NAME]'}</td>
            </tr>
            <tr>
              <td style={{ padding: '2pt 0' }}>Sex:</td>
              <td style={{ padding: '2pt 0', fontWeight: 'bold' }}>{data.sex || '[SEX]'}</td>
            </tr>
            <tr>
              <td style={{ padding: '2pt 0' }}>Age:</td>
              <td style={{ padding: '2pt 0', fontWeight: 'bold' }}>{data.age || '[AGE]'} years old</td>
            </tr>
            <tr>
              <td style={{ padding: '2pt 0' }}>Civil Status:</td>
              <td style={{ padding: '2pt 0', fontWeight: 'bold' }}>{data.civil_status || '[CIVIL STATUS]'}</td>
            </tr>
            <tr>
              <td style={{ padding: '2pt 0' }}>Date of Birth:</td>
              <td style={{ padding: '2pt 0', fontWeight: 'bold' }}>{data.birth_date ? formatDate(data.birth_date).fullDate : '[BIRTH DATE]'}</td>
            </tr>
            <tr>
              <td style={{ padding: '2pt 0' }}>Place of Birth:</td>
              <td style={{ padding: '2pt 0', fontWeight: 'bold' }}>{data.birth_place || '[BIRTH PLACE]'}</td>
            </tr>
            <tr>
              <td style={{ padding: '2pt 0' }}>Nationality:</td>
              <td style={{ padding: '2pt 0', fontWeight: 'bold' }}>{data.nationality || '[NATIONALITY]'}</td>
            </tr>
            <tr>
              <td style={{ padding: '2pt 0' }}>Height:</td>
              <td style={{ padding: '2pt 0', fontWeight: 'bold' }}>{data.height || '[HEIGHT]'}</td>
            </tr>
            <tr>
              <td style={{ padding: '2pt 0' }}>Weight:</td>
              <td style={{ padding: '2pt 0', fontWeight: 'bold' }}>{data.weight || '[WEIGHT]'}</td>
            </tr>
            <tr>
              <td style={{ padding: '2pt 0' }}>Blood Type:</td>
              <td style={{ padding: '2pt 0', fontWeight: 'bold' }}>{data.blood_type || '[BLOOD TYPE]'}</td>
            </tr>
            <tr>
              <td style={{ padding: '2pt 0' }}>Distinguishing Marks:</td>
              <td style={{ padding: '2pt 0', fontWeight: 'bold' }}>{data.distinguishing_marks || 'NONE'}</td>
            </tr>
            <tr>
              <td style={{ padding: '2pt 0' }}>Present Address:</td>
              <td style={{ padding: '2pt 0', fontWeight: 'bold' }}>{data.address || '[ADDRESS]'}</td>
            </tr>
            <tr>
              <td style={{ padding: '2pt 0' }}>ID Presented:</td>
              <td style={{ padding: '2pt 0', fontWeight: 'bold' }}>{data.id_presented || '[ID TYPE]'}</td>
            </tr>
            <tr>
              <td style={{ padding: '2pt 0' }}>ID Number:</td>
              <td style={{ padding: '2pt 0', fontWeight: 'bold' }}>{data.id_number || '[ID NUMBER]'}</td>
            </tr>
            <tr>
              <td style={{ padding: '2pt 0' }}>CTC No.:</td>
              <td style={{ padding: '2pt 0', fontWeight: 'bold' }}>{data.ctc_number || '[CTC NUMBER]'}</td>
            </tr>
            <tr>
              <td style={{ padding: '2pt 0' }}>Issued at:</td>
              <td style={{ padding: '2pt 0', fontWeight: 'bold' }}>{data.ctc_issued_at || '[PLACE ISSUED]'}</td>
            </tr>
            <tr>
              <td style={{ padding: '2pt 0' }}>Issued on:</td>
              <td style={{ padding: '2pt 0', fontWeight: 'bold' }}>{data.ctc_issued_on ? formatDate(data.ctc_issued_on).fullDate : '[DATE ISSUED]'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p style={{ textIndent: '0.3in', textAlign: 'justify', marginBottom: '8pt' }}>
        has
      </p>

      <p style={{ textAlign: 'center', fontWeight: 'bold', fontSize: FORMAT_F_CONFIG.noRecordFontSize, color: FORMAT_F_CONFIG.noRecordColor, margin: '16pt 0' }}>
        &quot;NO CRIMINAL RECORD&quot;
      </p>

      <p style={{ textIndent: '0.3in', textAlign: 'justify', marginBottom: '8pt', fontSize: FORMAT_F_CONFIG.detailsFontSize }}>
        This certification is issued for <strong>{data.purpose === 'Other' ? data.custom_purpose : data.purpose || '[PURPOSE]'}</strong> purposes 
        and shall be valid for six (6) months from date of issue.
      </p>

      <div style={{ marginLeft: '0.3in', marginBottom: '8pt' }}>
        <p style={{ marginBottom: '4pt' }}>
          Issued upon request: <strong style={{ textDecoration: 'underline' }}>
            {data.issued_upon_request_by || fullName || '[REQUESTER NAME]'}
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
// FORMAT F FOOTER/SIGNATURE COMPONENT
// ============================================
const FormatFFooter: React.FC<{ data: FormData; generatedOR?: string | null }> = ({ data, generatedOR }) => {
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
        color: '#000000',
        fontFamily: FORMAT_F_CONFIG.fontFamily,
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
      <div style={{ marginTop: '48pt', color: '#000000', fontSize: '13pt', fontFamily: FORMAT_F_CONFIG.fontFamily }}>
        <p style={{ marginBottom: '3pt', color: '#000000' }}>
          O.R No: <strong style={{ textDecoration: 'underline', color: '#000000', fontWeight: 'bold' }}>{data.prc_id_number || generatedOR || '________'}</strong>
        </p>
        <p style={{ marginBottom: '12pt', color: '#000000' }}>
          Date: <strong style={{ textDecoration: 'underline', color: '#000000', fontWeight: 'bold'}}>{new Date(data.date_issued).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>
        </p>
        <p style={{ fontStyle: 'italic', fontSize: '12pt', color: '#000000' }}>
          {getValidityMessage()}
        </p>
      </div>
    </>
  );
};

// ============================================
// FORMAT F COMPLETE PREVIEW COMPONENT
// ============================================
export const FormatFPreview: React.FC<ClearanceTemplateProps & { generatedOR?: string | null; showFullTemplate?: boolean }> = ({ 
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
        <FormatFHeader />
        <FormatFBody data={data} />
        <FormatFFooter data={data} generatedOR={generatedOR} />
      </div>
    );
  }

  return <FormatFBody data={data} />;
};

// ============================================
// FORMAT F PRINT TEMPLATE HTML GENERATOR
// ============================================
export const getFormatFHtml = (formData: FormData, fullName: string, generatedOR?: string | null): string => {
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

  const getStatusHtml = () => {
    return `<p style="text-align: center; font-weight: bold; font-size: ${FORMAT_F_CONFIG.noRecordFontSize}; color: ${FORMAT_F_CONFIG.noRecordColor}; margin: 16pt 0;">"NO CRIMINAL RECORD"</p>`;
  };

  return `<!DOCTYPE html>
<html>
<head>
  <title>Certificate - Format F</title>
  <style>
    @page { size: 9.5in 12in; margin: 0.75in 0.75in 0.5in 0.75in; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
    body { margin: 0; padding: 0; font-family: ${FORMAT_F_CONFIG.fontFamily}; font-size: 12pt; line-height: 1.0; color: ${FORMAT_F_CONFIG.textColor}; background: white; }
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
        <p style="font-size: 12pt; font-style: italic; color: ${FORMAT_F_CONFIG.textColor};">Republic of the Philippines</p>
        <p style="font-size: 12pt; font-style: italic; color: ${FORMAT_F_CONFIG.textColor};">Department of Justice</p>
        <p style="font-size: 12pt; font-weight: bold; color: ${FORMAT_F_CONFIG.textColor};">OFFICE OF THE CITY PROSECUTOR</p>
        <p style="font-size: 12pt; color: ${FORMAT_F_CONFIG.textColor};">City of Tagbilaran</p>
        <p style="font-size: 9pt; font-style: italic; color: ${FORMAT_F_CONFIG.textColor};">Hall of Justice Building, Brgy. Cogon, Tagbilaran City</p>
        <p style="font-size: 9pt; font-style: italic; color: ${FORMAT_F_CONFIG.textColor};">Tel. No. 411-3403/411-2306</p>
        <p style="font-size: 9pt; font-style: italic;">Email: <a href="mailto:ocptagbilaran@doj.gov.ph" style="color: #0000FF;">ocptagbilaran@doj.gov.ph</a></p>
      </div>
      <img src="/images/logos/bagong-pilipinas.png" alt="Bagong Pilipinas" class="right-logo" />
    </div>
    
    <br/>
    
    <!-- TITLE -->
    <div style="text-align: center; margin: 4pt 0 8pt 0;">
      <h1 style="font-size: 20pt; font-weight: bold; letter-spacing: 0.03em; margin: 0; color: ${FORMAT_F_CONFIG.textColor};">C E R T I F I C A T I O N</h1>
    </div>
    
    <br/>
    
    <!-- SALUTATION -->
    <p style="font-size: 12pt; font-weight: bold; margin-bottom: 4pt; color: ${FORMAT_F_CONFIG.textColor};">TO WHOM IT MAY CONCERN:</p>
    
    <br/>
    
    <!-- BODY -->
    <div style="color: ${FORMAT_F_CONFIG.textColor};">
      <!-- Photo and Thumbmark Section -->
      <div style="display: flex; justify-content: flex-end; margin-bottom: 12pt; gap: 16px;">
        <div style="text-align: center;">
          <div style="width: ${FORMAT_F_CONFIG.photoBoxWidth}; height: ${FORMAT_F_CONFIG.photoBoxHeight}; border: 1px solid #ccc; display: flex; align-items: center; justify-content: center; background-color: #f5f5f5; font-size: 8pt; color: #666;">
            ${formData.photo ? `<img src="${formData.photo}" alt="Photo" style="max-width: 100%; max-height: 100%;" />` : '2x2 PHOTO'}
          </div>
        </div>
        <div style="text-align: center;">
          <div style="width: ${FORMAT_F_CONFIG.thumbmarkBoxWidth}; height: ${FORMAT_F_CONFIG.thumbmarkBoxHeight}; border: 1px solid #ccc; display: flex; align-items: center; justify-content: center; background-color: #f5f5f5; font-size: 7pt; color: #666;">
            RIGHT THUMBMARK
          </div>
        </div>
      </div>
      
      <p style="text-indent: 0.3in; text-align: justify; margin-bottom: 8pt;">
        THIS IS TO CERTIFY that based on the records on file in this Office:
      </p>
      
      <div style="margin-left: 0.3in; margin-bottom: 12pt; font-size: 9pt;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 2pt 0; width: 35%;">Name:</td><td style="padding: 2pt 0; font-weight: bold; text-transform: uppercase;">${fullName}</td></tr>
          <tr><td style="padding: 2pt 0;">Sex:</td><td style="padding: 2pt 0; font-weight: bold;">${formData?.sex || '[SEX]'}</td></tr>
          <tr><td style="padding: 2pt 0;">Age:</td><td style="padding: 2pt 0; font-weight: bold;">${formData?.age} years old</td></tr>
          <tr><td style="padding: 2pt 0;">Civil Status:</td><td style="padding: 2pt 0; font-weight: bold;">${formData?.civil_status}</td></tr>
          <tr><td style="padding: 2pt 0;">Date of Birth:</td><td style="padding: 2pt 0; font-weight: bold;">${formData?.birth_date ? formatFullDate(formData.birth_date) : '[BIRTH DATE]'}</td></tr>
          <tr><td style="padding: 2pt 0;">Place of Birth:</td><td style="padding: 2pt 0; font-weight: bold;">${formData?.birth_place || '[BIRTH PLACE]'}</td></tr>
          <tr><td style="padding: 2pt 0;">Nationality:</td><td style="padding: 2pt 0; font-weight: bold;">${formData?.nationality}</td></tr>
          <tr><td style="padding: 2pt 0;">Height:</td><td style="padding: 2pt 0; font-weight: bold;">${formData?.height || '[HEIGHT]'}</td></tr>
          <tr><td style="padding: 2pt 0;">Weight:</td><td style="padding: 2pt 0; font-weight: bold;">${formData?.weight || '[WEIGHT]'}</td></tr>
          <tr><td style="padding: 2pt 0;">Blood Type:</td><td style="padding: 2pt 0; font-weight: bold;">${formData?.blood_type || '[BLOOD TYPE]'}</td></tr>
          <tr><td style="padding: 2pt 0;">Distinguishing Marks:</td><td style="padding: 2pt 0; font-weight: bold;">${formData?.distinguishing_marks || 'NONE'}</td></tr>
          <tr><td style="padding: 2pt 0;">Present Address:</td><td style="padding: 2pt 0; font-weight: bold;">${formData?.address}</td></tr>
          <tr><td style="padding: 2pt 0;">ID Presented:</td><td style="padding: 2pt 0; font-weight: bold;">${formData?.id_presented || '[ID TYPE]'}</td></tr>
          <tr><td style="padding: 2pt 0;">ID Number:</td><td style="padding: 2pt 0; font-weight: bold;">${formData?.id_number || '[ID NUMBER]'}</td></tr>
          <tr><td style="padding: 2pt 0;">CTC No.:</td><td style="padding: 2pt 0; font-weight: bold;">${formData?.ctc_number || '[CTC NUMBER]'}</td></tr>
          <tr><td style="padding: 2pt 0;">Issued at:</td><td style="padding: 2pt 0; font-weight: bold;">${formData?.ctc_issued_at || '[PLACE ISSUED]'}</td></tr>
          <tr><td style="padding: 2pt 0;">Issued on:</td><td style="padding: 2pt 0; font-weight: bold;">${formData?.ctc_issued_on ? formatFullDate(formData.ctc_issued_on) : '[DATE ISSUED]'}</td></tr>
        </table>
      </div>
      
      <p style="text-indent: 0.3in; text-align: justify; margin-bottom: 8pt;">has</p>
      
      ${getStatusHtml()}
      
      <p style="text-indent: 0.3in; text-align: justify; margin-bottom: 8pt; font-size: 9pt;">
        This certification is issued for <strong>${formData?.purpose === 'Other' ? formData?.custom_purpose : formData?.purpose}</strong> purposes 
        and shall be valid for six (6) months from date of issue.
      </p>
      
      <div style="margin-left: 0.3in; margin-bottom: 8pt;">
        <p>Issued upon request: <strong style="text-decoration: underline;">${formData?.issued_upon_request_by || fullName}</strong></p>
      </div>
      
      <p style="text-indent: 0.3in; text-align: justify; margin-top: 12pt;">
        WITNESS MY HAND this <strong style="text-decoration: underline;">${dayNum}${getOrdinalSuffix(dayNum)}</strong> 
        day of <strong style="text-decoration: underline;">${monthYear}</strong> 
        in the City of Tagbilaran, Bohol, Philippines.
      </p>
    </div>
    
    <br/>
    
    <!-- SIGNATURE -->
    <div style="text-align: right; margin-top: 14pt; margin-right: 0.3in; display: flex; flex-direction: column; align-items: flex-end;">
      <p style="font-size: 12pt; font-weight: bold; margin-bottom: 32pt; text-transform: uppercase; color: #000000;">FOR THE CITY PROSECUTOR:</p>
      <p style="font-size: 12pt; font-weight: bold; margin-bottom: 0; margin-right: 25pt; color: #000000;">REGIE C. POCON</p>
      <p style="font-size: 12pt; font-style: italic; margin-top: 0pt; margin-right: 5pt; color: #000000;">Administrative Officer V</p>
    </div>
    
    <br/>
    
    <!-- FOOTER -->
    <div style="margin-top: 18pt; font-size: 12pt; color: #000000;">
      <p style="margin: 0 0 2pt 0; color: #000000;">O.R No: <strong><u>${formData.prc_id_number || generatedOR || '________'}</u></strong></p>
      <p style="margin: 0 0 2pt 0; color: #000000;">Date: <strong><u>${fullDate}</u></strong></p>
      <br/>
      <p style="font-style: italic; font-size: 12pt; margin-top: 8pt; color: #000000;">${formData.validity_period === '1 Year' ? 'Note: Valid until 1 year from the date issued.' : 'Note: Valid until 6 months from the date issued.'}</p>
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
