// Format D - Certificate of Clearance (With Case Details)
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
  textColor: '#000080',           // Main text color (navy blue)
  bodyFontSize: '13pt',            // Body text font size
  headerFontSize: '9pt',           // Header font size
  fontFamily: "'Century Gothic'",
};

// Helper to get the actual color value from the color type
const getTextColorValue = (colorType: 'navy' | 'black'): string => {
  return colorType === 'black' ? '#000000' : '#000080';
};

// ============================================
// FORMAT D HEADER COMPONENT
// ============================================
const FormatDHeader: React.FC<{ dojSealSrc?: string; bagongPilipinasSrc?: string; textColor?: 'navy' | 'black' }> = ({ 
  dojSealSrc = '/images/logos/doj-seal.png',
  bagongPilipinasSrc = '/images/logos/bagong-pilipinas.png',
  textColor = 'navy'
}) => {
  const colorValue = getTextColorValue(textColor);
  
  return (
    <>
      {/* Header with Official Logos */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8pt' }}>
        <div style={{ flexShrink: 0, width: '0.9in' }}>
          <img 
            src={dojSealSrc} 
            alt="DOJ Seal" 
            style={{ width: '0.9in', height: '0.9in', objectFit: 'contain' }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        </div>

        <div style={{ flex: 1, textAlign: 'center', fontFamily: FORMAT_D_CONFIG.fontFamily, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '0 8pt' }}>
          <p style={{ color: colorValue, fontSize: '13pt', fontStyle: 'italic', lineHeight: '1.3', margin: '0' }}>Republic of the Philippines</p>
          <p style={{ color: colorValue, fontSize: '13pt', fontStyle: 'italic', lineHeight: '1.3', margin: '0' }}>Department of Justice</p>
          <p style={{ color: colorValue, fontSize: '13pt', fontWeight: 'bold', lineHeight: '1.3', margin: '0' }}>OFFICE OF THE CITY PROSECUTOR</p>
          <p style={{ color: colorValue, fontSize: '13pt', fontStyle: 'italic', lineHeight: '1.3', margin: '0' }}>City of Tagbilaran</p>
          <p style={{ color: colorValue, fontSize: '10pt', fontStyle: 'italic', lineHeight: '1.3', margin: '0' }}>Hall of Justice Building, Brgy. Cogon, Tagbilaran City</p>
          <p style={{ color: colorValue, fontSize: '10pt', fontStyle: 'italic', lineHeight: '1.3', margin: '0' }}>Tel. No. 411-3403</p>
          <p style={{ color: colorValue, fontSize: '10pt', fontStyle: 'italic', lineHeight: '1.3', margin: '0' }}>
            Email: <a href="mailto:ocptagbilaran@doj.gov.ph" style={{ color: '#0000FF', textDecoration: 'underline' }}>ocptagbilaran@doj.gov.ph</a>
          </p>
        </div>

        <div style={{ flexShrink: 0, width: '0.9in', textAlign: 'right' }}>
          <img 
            src={bagongPilipinasSrc} 
            alt="Bagong Pilipinas" 
            style={{ width: '0.9in', height: '0.9in', objectFit: 'contain' }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
      </div>

      {/* CERTIFICATE OF CLEARANCE Title */}
      <div style={{ textAlign: 'center', margin: '16pt 0 16pt 0' }}>
        <h1 style={{ 
          color: colorValue, 
          fontSize: '21pt', 
          fontWeight: 'bold', 
          fontFamily: FORMAT_D_CONFIG.fontFamily,
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
// FORMAT D BODY COMPONENT
// ============================================
const FormatDBody: React.FC<{ data: FormData; textColor?: 'navy' | 'black' }> = ({ data, textColor = 'navy' }) => {
  const colorValue = getTextColorValue(textColor);
  const fullName = buildFullName(data);
  const issuedDateInfo = data.date_issued ? formatDate(data.date_issued) : null;
  const validityDateInfo = data.validity_expiry ? formatDate(data.validity_expiry) : null;
  const idLabel = data.id_presented?.trim() || 'National ID';
  const rawValidityLabel = data.id_number?.trim();
  const validityLabel = rawValidityLabel?.toLowerCase() === 'no entry' ? '' : rawValidityLabel || 'Valid Until';
  const hasCriminalRecord = checkCriminalRecord(data);

  // Get the first criminal case for display (if any)
  const firstCase = data.criminal_cases && data.criminal_cases.length > 0 ? data.criminal_cases[0] : null;

  return (
    <div style={{ color: colorValue, fontFamily: FORMAT_D_CONFIG.fontFamily }}>
      {/* Main certification text */}
      <p style={{ textIndent: '0.5in', textAlign: 'justify', marginBottom: '12pt', fontSize: FORMAT_D_CONFIG.bodyFontSize, lineHeight: '1.4' }}>
        {'\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0'}THIS IS TO CERTIFY that the records of this office show that one{' '}
        <strong>{fullName || '[FULL NAME]'}</strong>,{' '}
        {String(data.age || '').trim().toLowerCase() === 'of legal age'
          ? <><strong>of legal age</strong>,{' '}</>
          : <><strong>{data.age || '[AGE]'} years old,</strong>{' '}</>}
        {data.civil_status === 'Blank' ? null : <><strong>{data.civil_status || '[CIVIL STATUS]'}</strong>,{' '}</>}
        <strong>{data.nationality || 'Filipino'}</strong>, residing at{' '}
        <strong>{data.address || '[ADDRESS]'}</strong>,{' '}
        {hasCriminalRecord ? 'has been charged of:' : 'has no pending or resolved criminal case on file.'}
      </p>

      {/* Case Details - Show all cases */}
      <div style={{
        margin: '12pt 0 12pt 0.5in',
        fontSize: FORMAT_D_CONFIG.bodyFontSize,
        lineHeight: '1.0',
      }}>
        {(data.criminal_cases || []).map((crimCase, index) => (
          <div key={index}>
            <div style={{ display: 'flex', marginBottom: '2pt' }}>
              <span style={{ width: '1.6in', display: 'inline-block', whiteSpace: 'nowrap' }}>{crimCase?.case_number_type || 'Criminal Case No.'}</span>
              <span style={{ marginLeft: '8pt' }}>: <strong>{crimCase?.case_number || ''}</strong></span>
            </div>
            <div style={{ display: 'flex', marginBottom: '2pt' }}>
              <span style={{ width: '1.6in', display: 'inline-block' }}>Crime</span>
              <span style={{ marginLeft: '8pt' }}>: {crimCase?.crime || ''}</span>
            </div>
            <div style={{ display: 'flex', marginBottom: '2pt' }}>
              <span style={{ width: '1.6in', display: 'inline-block' }}>{crimCase?.date_type || 'Date Info Filed'}</span>
              <span style={{ marginLeft: '8pt' }}>: {crimCase?.date_info_filed ? new Date(crimCase.date_info_filed).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''}</span>
            </div>
            <div style={{ display: 'flex', marginBottom: '2pt' }}>
              <span style={{ width: '1.6in', display: 'inline-block' }}>Origin</span>
              <span style={{ marginLeft: '8pt' }}>: {crimCase?.origin || ''}</span>
            </div>
            <div style={{ display: 'flex', marginBottom: '2pt' }}>
              <span style={{ width: '1.6in', display: 'inline-block' }}>Status</span>
              <span style={{ marginLeft: '8pt' }}>: {crimCase?.status || ''}</span>
            </div>
            {index < (data.criminal_cases?.length || 0) - 1 && (
              <div style={{ marginBottom: '24pt' }}></div>
            )}
          </div>
        ))}
      </div>

      {/* Issued Upon Request and Purpose */}
      <div style={{ margin: '12pt 0 12pt 0.5in', fontSize: FORMAT_D_CONFIG.bodyFontSize, lineHeight: '1.0', color: colorValue }}>
        <p style={{ margin: '0 0 4pt 0', color: colorValue }}>
          {'\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0'}Issued upon the request of: <span style={{ color: colorValue, textDecoration: 'underline', fontWeight: 'bold', textTransform: 'none' }}>
            {data.issued_upon_request_by || ''}
          </span>
        </p>
        <p style={{ margin: '0', color: colorValue }}>
          {'\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0'}Purpose: <strong style={{ textDecoration: 'underline', color: colorValue }}>
            {data.purpose === 'Other' ? data.custom_purpose : data.purpose || 'FOR PROBATION'}
          </strong>
        </p>
      </div>
      <div style={{ height: '27px' }}></div>

      {/* Applicant Signature Section with Thumbmark Box */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', margin: '20pt 0 12pt 0', lineHeight: '1.0', padding: '0 0.3in', color: colorValue }}>        {/* Left side - Signature */}
        <div style={{ flex: 1 }}>
          <p style={{ margin: '0', fontSize: '13pt', color: colorValue, lineHeight: '1.0', textAlign: 'center' }}>
            <span style={{ margin: '8pt 0 12pt -0.5in', fontWeight: 'bold', borderBottom: `1pt solid ${colorValue}`, paddingBottom: '1pt' }}>{data.issued_upon_request_by?.toUpperCase() || fullName || 'APPLICANT NAME'}</span>
          </p>
          <p style={{ margin: '8pt 0 12pt -0.5in', fontSize: '13pt', fontWeight: 'bold', fontStyle: 'normal', color: colorValue, lineHeight: '1.0', textAlign: 'center' }}>Signature</p>
          
          <div style={{ height: '35pt' }}></div>
          
          <p style={{ margin: '0 0 3pt 0', fontSize: '13pt', color: colorValue, lineHeight: '1.0' }}>
            {'     '}{idLabel} : <span style={{ textDecoration: 'underline', color: colorValue, fontWeight: 'bold' }}>{data.ctc_number || data.id_number || '3853-0259-7193-4286'}</span>
          </p>
          {validityLabel && (
            <p style={{ margin: '0', fontSize: '13pt', color: colorValue, lineHeight: '1.0' }}>
              {'     '}{validityLabel} : <span style={{ textDecoration: 'underline', color: colorValue, fontWeight: 'bold' }}>
                {validityDateInfo ? `${validityDateInfo.monthYear.split(' ')[0]} ${validityDateInfo.day}, ${validityDateInfo.monthYear.split(' ')[1]}` : 'May 12, 2023'}
              </span>
            </p>
          )}
        </div>

        

        {/* Right side - Thumbmark Box */}
        <div>
          <div style={{ 
            border: `2pt solid ${colorValue}`, 
            width: '1.2in', 
            height: '1.1in', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            marginTop: '-30pt',
            marginLeft: '-0.2in',
          }}>
          </div>
          <p style={{ fontSize: '9pt', textAlign: 'left', color: colorValue, margin: '2pt 0 0 -0.2in'}}>RIGHT THUMBMARK</p>
        </div>
      </div>

      <div style={{ height: '27px' }}></div>

      {/* Witness clause */}
      <p style={{ textIndent: '0.5in', textAlign: 'justify', marginTop: '16pt', fontSize: FORMAT_D_CONFIG.bodyFontSize, lineHeight: '1.4', color: colorValue }}>
        {'            '}WITNESS MY HAND this{' '}
        <strong style={{ textDecoration: 'underline', color: colorValue }}>
          {issuedDateInfo ? `${issuedDateInfo.day}${issuedDateInfo.suffix}` : '[DAY]'}
        </strong>{' '}
        day of{' '}
        <strong style={{ textDecoration: 'underline', color: colorValue }}>
          {issuedDateInfo ? issuedDateInfo.monthYear : '[MONTH, YEAR]'}
        </strong>{' '}
        in the City of Tagbilaran, Bohol, Philippines.
      </p>
    </div>
  );
};

// ============================================
// FORMAT D FOOTER/SIGNATURE COMPONENT
// ============================================
const FormatDFooter: React.FC<{ data: FormData; generatedOR?: string | null; textColor?: 'navy' | 'black' }> = ({ data, generatedOR, textColor = 'navy' }) => {
  const colorValue = getTextColorValue(textColor);
  const issuedDate = data.date_issued ? new Date(data.date_issued) : new Date();
  const fullDate = issuedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  // Calculate validity message based on validity_period
  const getValidityMessage = () => {
    if (data.validity_period === '1 Year') {
      return 'Note: Valid until 1 year from the date issued.';
    }
    return 'Note: Valid until 6 months from the date issued.';
  };

  return (
    <>
      {/* Signature Section - Right Aligned */}
      <div style={{ 
        marginTop: '24pt',
        textAlign: 'right',
        color: colorValue,
        fontFamily: FORMAT_D_CONFIG.fontFamily,
        paddingRight: '0.5in',
      }}>
        <p style={{ fontWeight: 'bold', fontSize: '13pt', marginBottom: '36pt', textTransform: 'uppercase', color: colorValue }}>
          {' '}FOR THE CITY PROSECUTOR:
        </p>
        
        <div style={{ textAlign: 'center', display: 'inline-block' }}>
          <p style={{ fontWeight: 'bold', fontSize: '13pt', marginBottom: '2pt', color: colorValue }}>REGIE C. POCON</p>
          <p style={{ fontSize: '13pt', fontStyle: 'normal', fontWeight: 'normal', color: colorValue, margin: '0' }}>Administrative Officer V</p>
        </div>
      </div>

      {/* Footer - O.R. and Date on Left */}
      <div style={{ marginTop: '32pt', color: colorValue, fontSize: '13pt', fontFamily: FORMAT_D_CONFIG.fontFamily }}>
        {!data.no_entry_or_no && (
          <>
            <p style={{ marginBottom: '2pt', color: colorValue }}>
              O.R No: <strong style={{ textDecoration: 'underline', color: colorValue }}>{data.prc_id_number || generatedOR || '7960144'}</strong>
            </p>
            <p style={{ marginBottom: '16pt', color: colorValue }}>
              Date: <strong style={{ textDecoration: 'underline', color: colorValue }}>{fullDate}</strong>
            </p>
          </>
        )}
        <p style={{ fontStyle: 'italic', fontSize: '9pt', color: colorValue }}>
          {getValidityMessage()}
        </p>
      </div>
    </>
  );
};

// ============================================
// FORMAT D COMPLETE PREVIEW COMPONENT
// ============================================
export const FormatDPreview: React.FC<ClearanceTemplateProps & { generatedOR?: string | null; showFullTemplate?: boolean; textColor?: 'navy' | 'black' }> = ({ 
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
          width: '6.5in',
          padding: '0.4in 0.5in',
          margin: '0 auto',
          boxSizing: 'border-box',
          background: 'white'
        }}
      >
        <FormatDHeader textColor={textColor} />
        <FormatDBody data={data} textColor={textColor} />
        <FormatDFooter data={data} generatedOR={generatedOR} textColor={textColor} />
      </div>
    );
  }

  return <FormatDBody data={data} textColor={textColor} />;
};

// ============================================
// FORMAT D PRINT TEMPLATE HTML GENERATOR
// ============================================
export const getFormatDHtml = (formData: FormData, fullName: string, generatedOR?: string | null, textColor: 'navy' | 'black' = 'navy'): string => {
  const colorValue = getTextColorValue(textColor);
  const idLabel = formData.id_presented?.trim() || 'National ID';
  const rawValidityLabel = formData.id_number?.trim();
  const validityLabel = rawValidityLabel?.toLowerCase() === 'no entry' ? '' : rawValidityLabel || 'Valid Until';
  const hasCriminalRecord = formData.criminal_cases && formData.criminal_cases.some(c => c.case_number && c.crime);
  const firstCase = formData.criminal_cases && formData.criminal_cases.length > 0 ? formData.criminal_cases[0] : null;
  
  // Debug logging to verify criminal case data
  console.log('Format D Print - Criminal Cases Data:', formData.criminal_cases);
  if (formData.criminal_cases && formData.criminal_cases.length > 0) {
    formData.criminal_cases.forEach((crimCase, index) => {
      console.log(`Case ${index + 1}:`, {
        case_number_type: crimCase.case_number_type,
        date_type: crimCase.date_type,
        case_number: crimCase.case_number,
        crime: crimCase.crime
      });
    });
  }
  
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
  const dateIssuedDisplay = issuedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const validityDate = formData.validity_expiry ? new Date(formData.validity_expiry) : new Date();
  const validityDisplay = validityDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  // Case details HTML - show all cases
  const getCaseDetailsHtml = () => {
    if (!formData.criminal_cases || formData.criminal_cases.length === 0) {
      return '';
    }
    
    let caseHtml = '<div style="margin: 6pt 0 6pt 0.5in; font-size: 13pt; line-height: 1.0;">';
    
    formData.criminal_cases.forEach((crimCase, index) => {
      caseHtml += `
        <div>
          <div style="display: flex; margin-bottom: 1pt;">
            <span style="width: 1.8in; display: inline-block; white-space: nowrap;">${crimCase?.case_number_type || 'Criminal Case No.'}</span>
            <span style="margin-left: 11.8pt;">: <strong>${crimCase?.case_number || ''}</strong></span>
          </div>
          <div style="display: flex; margin-bottom: 1pt;">
            <span style="width: 1.8in; display: inline-block;">Crime</span>
            <span style="margin-left: 12pt;">: ${crimCase?.crime || ''}</span>
          </div>
          <div style="display: flex; margin-bottom: 1pt;">
            <span style="width: 1.8in; display: inline-block;">${crimCase?.date_type || 'Date Info Filed'}</span>
            <span style="margin-left: 12pt;">: ${crimCase?.date_info_filed ? new Date(crimCase.date_info_filed).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''}</span>
          </div>
          <div style="display: flex; margin-bottom: 1pt;">
            <span style="width: 1.8in; display: inline-block;">Origin</span>
            <span style="margin-left: 12pt;">: ${crimCase?.origin || ''}</span>
          </div>
          <div style="display: flex; margin-bottom: 1pt;">
            <span style="width: 1.8in; display: inline-block;">Status</span>
            <span style="margin-left: 12pt;">: ${crimCase?.status || ''}</span>
          </div>
          ${index < formData.criminal_cases!.length - 1 ? '<div style="margin-bottom: 12pt;"></div>' : ''}
        </div>
      `;
    });
    
    caseHtml += '</div>';
    return caseHtml;
  };

  return `<!DOCTYPE html>
<html>
<head>
  <title>Certificate of Clearance - Format D</title>
  <style>
    @page { size: 8.5in 11in; margin: 0.3in 0.8in 0.2in 0.8in; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
    body { margin: 0; padding: 0; font-family: ${FORMAT_D_CONFIG.fontFamily}; font-size: 11pt; line-height: 1.2; color: ${colorValue}; background: white; }
    .certificate-container { width: 100%; max-width: 100%; margin: 0 auto; padding: 0.2in 0.3in; background: white; }
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
    
     <div style="height: 10pt;"></div>
    <!-- TITLE -->
    <div style="text-align: center; margin: 4pt 0 6pt 0;">
      <h1 style="font-size: 20pt; font-weight: bold; margin: 0; color: ${colorValue}; text-transform: uppercase;">CERTIFICATE OF CLEARANCE</h1>
    </div>
    
     <div style="height: 1pt;"></div>
    <!-- SALUTATION -->
    <p style="font-size: 13pt; font-weight: bold; margin-bottom: 6pt; color: ${colorValue}; text-transform: uppercase;">TO WHOM IT MAY CONCERN:</p>
    
    <!-- BODY -->
    <div style="color: ${colorValue};">
      <p style="text-indent: 0.5in; text-align: justify; margin-bottom: 6pt; font-size: 13pt; line-height: 1.3;">
        &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; THIS IS TO CERTIFY that the records of this office show that one 
        <strong>${fullName}</strong>, 
        ${String(formData?.age || '').trim().toLowerCase() === 'of legal age' ? '<strong>of legal age</strong>, ' : `<strong>${formData?.age || '[AGE]'} years old,</strong> `}
        ${formData?.civil_status === 'Blank' ? '' : `<strong>${formData?.civil_status || '[CIVIL STATUS]'}</strong>, `}
        <strong>${formData?.nationality || 'Filipino'}</strong>, 
        residing at <strong>${formData?.address || '[ADDRESS]'}</strong> 
        ${hasCriminalRecord ? 'has been charged of:' : 'has no pending or resolved criminal case on file.'}
      </p>
      
    
      
      ${getCaseDetailsHtml()}
      
      <div style="height: 6pt;"></div>
      
      <!-- Issued Upon Request and Purpose -->
      <div style="margin: 8pt 0 8pt 0.5in; font-size: 13pt; line-height: 1.0; color: ${colorValue};">
        <p style="margin: 0 0 2pt 0; color: ${colorValue};">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Issued upon the request of: <span style="color: ${colorValue}; text-decoration: underline; font-weight: bold; text-transform: none;">${formData?.issued_upon_request_by || ''}</span></p>
        <p style="margin: 0; color: ${colorValue};">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Purpose: <strong style="text-decoration: underline; color: ${colorValue};">${formData?.purpose === 'Other' ? formData?.custom_purpose : formData?.purpose || 'FOR PROBATION'}</strong></p>
      </div>

      <div style="height: 12pt;"></div>
      
      <!-- Applicant Signature Section with Thumbmark Box -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin: 16pt 0 8pt 0; padding: 0 0.2in; color: ${colorValue};">
        <!-- Left side - Signature -->
        <div style="flex: 1; color: ${colorValue}; margin-left: -2.5in;">
          <p style="margin: 0; font-size: 13pt; color: ${colorValue}; text-align: center; line-height: 1.0;"><span style="font-weight: bold; border-bottom: 1pt solid ${colorValue}; padding-bottom: 2pt;">${formData.issued_upon_request_by || fullName || 'APPLICANT NAME'}</span></p>
          <p style="margin: 8pt 0 10pt 0.1in; font-size: 13pt; font-style: normal; font-weight: bold; color: ${colorValue}; text-align: center; line-height: 1.0;">Signature</p>
          
          <div style="height: 30pt;"></div>
          
          <p style="margin: 0 0 2pt 0; font-size: 13pt; color: ${colorValue}; line-height: 1.0;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${idLabel} : <span style="text-decoration: underline; color: ${colorValue}; font-weight: bold;">${formData?.ctc_number || formData?.id_number || '3853-0259-7193-4286'}</span></p>
          ${validityLabel ? `<p style="margin: 0; font-size: 13pt; color: ${colorValue}; line-height: 1.0;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${validityLabel} : <span style="text-decoration: underline; color: ${colorValue}; font-weight: bold;">${validityDisplay}</span></p>` : ''}
        </div>

        <!-- Right side - Thumbmark Box -->
        <div>
          <div style="border: 2.5pt solid ${colorValue}; width: 1.2in; height: 1in; display: flex; align-items: center; justify-content: center; margin-left: -2in; margin-top: -10pt;">
          </div>
          <p style="font-size: 9pt; text-align: left; color: ${colorValue}; margin: 4pt 0 0 -2in; ">RIGHT THUMBMARK</p>
        </div>
      </div>

      <div style="height: 8pt;"></div>
      
      <!-- Witness clause -->
      <p style="text-indent: 0.5in; text-align: justify; margin-top: 8pt; font-size: 13pt; line-height: 1.3; color: ${colorValue};">
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;WITNESS MY HAND this <strong style="text-decoration: underline; color: ${colorValue};">${dayNum}${getOrdinalSuffix(dayNum)}</strong> 
        day of <strong style="text-decoration: underline; color: ${colorValue};">${monthYear}</strong> 
        in the City of Tagbilaran, Bohol, Philippines.
      </p>
    </div>
    
    <!-- SIGNATURE Section - Right Aligned -->
    <div style="text-align: right; margin-top: 6pt; padding-right: 0.5in; color: ${colorValue};">
      <p style="font-size: 13pt; font-weight: bold; margin-bottom: 16pt; text-transform: uppercase; color: ${colorValue};">&nbsp;FOR THE CITY PROSECUTOR:</p>
      <div style="text-align: center; display: inline-block;">
        <p style="font-size: 13pt; font-weight: bold; margin-bottom: 2pt; color: ${colorValue};">REGIE C. POCON</p>
        <p style="font-size: 13pt; font-style: normal; margin: 0; color: ${colorValue};">Administrative Officer V</p>
      </div>
    </div>
    
    <!-- FOOTER - O.R. and Date on Left -->
    <div style="margin-top: 3pt; font-size: 13pt; color: ${colorValue};">
      ${!formData.no_entry_or_no ? `
        <p style="margin: 0 0 2pt 0; color: ${colorValue}; line-height: 1.0;">O.R No: <strong style="text-decoration: underline; color: ${colorValue};">${formData.prc_id_number || generatedOR || '7960144'}</strong></p>
        <p style="margin: 0 0 2pt 0; color: ${colorValue}; line-height: 1.0;">Date: <strong style="text-decoration: underline; color: ${colorValue};">${fullDate}</strong></p>
      ` : ''}
      <p style="font-style: italic; font-size: 9pt; color: ${colorValue}; margin-top: 10pt;">${formData.validity_period === '1 Year' ? 'Note: Valid until 1 year from the date issued.' : 'Note: Valid until 6 months from the date issued.'}</p>
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
export { FormatDHeader, FormatDBody, FormatDFooter };
