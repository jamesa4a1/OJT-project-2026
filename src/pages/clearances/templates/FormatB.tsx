/**
 * FORMAT B - Individual - Has Criminal Record
 * 
 * This format is used for individuals who HAVE criminal records.
 * Lists all criminal cases with case numbers, crimes, dates, etc.
 */

import React from 'react';
import { TemplateProps, PreviewTemplateProps } from './types';
import { getOrdinalSuffix } from './constants';

// ============================================
// PRINT TEMPLATE - Format B
// ============================================
export const getFormatBPrintTemplate = (props: TemplateProps): string => {
  const { formData, fullName } = props;
  
  return `
    <!-- Format B - Criminal Record with Multiple Cases -->
    <p class="body-text" style="margin-bottom: 8pt; line-height: 1.4; font-size: 12pt; text-align: justify; text-indent: 0.5in;">
      THIS IS TO CERTIFY that per records of this office show that one <strong>${fullName || '[FULL NAME]'}${formData.alias ? ` y ${formData.alias.toUpperCase()}` : ''}, ${formData.age || '[AGE]'} years old, ${formData.civil_status || '[STATUS]'}, ${formData.nationality || 'Filipino'}</strong>, residing at <strong>${formData.address || '[ADDRESS]'}</strong> has been charged of the following:
    </p>
    
    ${formData.criminal_cases.map((c, idx) => `
      <div style="margin: 5pt 0 12pt 0.75in; line-height: 1.2; font-size: 12pt;">
        <p style="margin: 0 0 2pt 0;">
          <span style="display: inline-block; width: 90pt; font-weight: normal;"> Crim. Case No.</span>
          <span style="margin-right: 8px;">:</span>
          <strong>${c.case_number || '[CASE NUMBER]]]'}</strong>
        </p>
        <p style="margin: 0 0 2pt 0;">
          <span style="display: inline-block; width: 90pt; margin-right: font-weight: normal;">Crime</span>
          <span style="margin-right: 8px;">:</span>
          <strong>${c.crime || '[CRIME]'}</strong>
        </p>
        <p style="margin: 0 0 2pt 0;">
          <span style="display: inline-block; width: 90pt; font-weight: normal;">Date Info Filed</span>
          <span style="margin-right: 8px;">:</span>
          <span>${c.date_info_filed ? new Date(c.date_info_filed).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '[DATE]'}</span>
        </p>
        <p style="margin: 0 0 2pt 0;">
          <span style="display: inline-block; width: 90pt; font-weight: normal;">Origin</span>
          <span style="margin-right: 8px;">:</span>
          <span>${c.origin || 'Tagbilaran City'}</span>
        </p>
        <p style="margin: 0 0 2pt 0;">
          <span style="display: inline-block; width: 90pt; font-weight: normal;">Status</span>
          <span style="margin-right: 8px;">:</span>
          <span>${c.status || '[STATUS]'}</span>
        </p>
      </div>
    `).join('')}
    
    <!-- Issued upon request section -->
    <div style="margin: 16pt 0 0 1.2in; line-height: 1.2; font-size: 12pt;">
      <p style="margin: 0 0 2pt 0;">
        <span>Issued upon request: </span>
        <strong><u>${fullName || '[FULL NAME]'}</u></strong>
      </p>
      <p style="margin: 0 0 12pt 0;">
        <span>Purpose: </span>
        <strong><u>${formData.purpose === 'Other' ? (formData.custom_purpose?.toUpperCase() || '[PURPOSE]') : (formData.purpose?.toUpperCase() || '[PURPOSE]')}</u></strong>
      </p>
    </div>
    
    <br>
    
    <!-- WITNESS MY HAND with indentation -->
    <p style="margin-top: 12pt; margin-bottom: 18pt; text-indent: 0.3in; line-height: 1.4; font-size: 12pt;">
      &nbsp;&nbsp;&nbsp;&nbsp;WITNESS MY HAND this <strong><u>${new Date(formData.date_issued).getDate()}${getOrdinalSuffix ? getOrdinalSuffix(new Date(formData.date_issued).getDate()) : ''}</u></strong> day of <strong><u>${new Date(formData.date_issued).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</u></strong> in the City of Tagbilaran, Bohol, Philippines.
    </p>
  `;
};

// ============================================
// PREVIEW COMPONENT - Format B
// ============================================
export const FormatBPreview: React.FC<PreviewTemplateProps> = ({ formData, fullName, textColor, generatedOR, getOrdinalSuffix }) => {
  return (
    <div>
      <p style={{ 
        marginBottom: '8pt',
        textIndent: '0.5in',
        lineHeight: '1.4',
        textAlign: 'justify',
        fontSize: '12pt'
      }}>
        THIS IS TO CERTIFY that per records of this office show that one <strong>{fullName || '[FULL NAME]'}{formData.alias && ` y ${formData.alias.toUpperCase()}`}, {formData.age || '[AGE]'} years old, {formData.civil_status}, {formData.nationality}</strong>, residing at <strong>{formData.address || '[ADDRESS]'}</strong> has been charged of the following:
      </p>
      
      {/* Multiple Criminal Cases */}
      {formData.criminal_cases.map((c, idx) => (
        <div key={idx} style={{ margin: '8pt 0 12pt 0.75in', fontSize: '12pt', lineHeight: '1.2' }}>
          <p style={{ marginBottom: '2pt', margin: '0 0 2pt 0' }}>
            <span style={{ display: 'inline-block', width: '90pt', fontWeight: 'normal' }}>Crim. Case No.</span>
            <span style={{ marginRight: '8px' }}>:</span>
            <strong>{c.case_number || '[CASE NUMBER]'}</strong>
          </p>
          <p style={{ marginBottom: '2pt', margin: '0 0 2pt 0' }}>
            <span style={{ display: 'inline-block', width: '90pt', fontWeight: 'normal' }}>Crime</span>
            <span style={{ marginRight: '8px' }}>:</span>
            <strong>{c.crime || '[CRIME]'}</strong>
          </p>
          <p style={{ marginBottom: '2pt', margin: '0 0 2pt 0' }}>
            <span style={{ display: 'inline-block', width: '90pt', fontWeight: 'normal' }}>Date Info Filed</span>
            <span style={{ marginRight: '8px' }}>:</span>
            <span>{c.date_info_filed ? new Date(c.date_info_filed).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '[DATE]'}</span>
          </p>
          <p style={{ marginBottom: '2pt', margin: '0 0 2pt 0' }}>
            <span style={{ display: 'inline-block', width: '90pt', fontWeight: 'normal' }}>Origin</span>
            <span style={{ marginRight: '8px' }}>:</span>
            <span>{c.origin || 'Tagbilaran City'}</span>
          </p>
          <p style={{ marginBottom: '2pt', margin: '0 0 2pt 0' }}>
            <span style={{ display: 'inline-block', width: '90pt', fontWeight: 'normal' }}>Status</span>
            <span style={{ marginRight: '8px' }}>:</span>
            <span>{c.status || '[STATUS]'}</span>
          </p>
        </div>
      ))}

      {/* Issued upon request section */}
      <div style={{ margin: '16pt 0 0 1.2in', fontSize: '12pt', lineHeight: '1.2' }}>
        <p style={{ margin: '0 0 2pt 0' }}>
          <span>Issued upon request: </span>
          <strong style={{ textDecoration: 'underline' }}>
            {fullName || '[FULL NAME]'}
          </strong>
        </p>
        <p style={{ margin: '0 0 12pt 0' }}>
          <span>Purpose: </span>
          <strong style={{ textDecoration: 'underline' }}>
            {formData.purpose === 'Other' ? formData.custom_purpose?.toUpperCase() : formData.purpose?.toUpperCase() || '[PURPOSE]'}
          </strong>
        </p>
      </div>
      
      {/* WITNESS MY HAND with indentation */}
      <p style={{ 
        marginTop: '12pt',
        marginBottom: '18pt',
        textIndent: '0.3in',
        lineHeight: '1.4',
        fontSize: '9pt'
      }}>
        &nbsp;&nbsp;&nbsp;&nbsp;WITNESS MY HAND this <strong style={{ textDecoration: 'underline' }}>{new Date(formData.date_issued).getDate()}{getOrdinalSuffix ? getOrdinalSuffix(new Date(formData.date_issued).getDate()) : ''}</strong> day of <strong style={{ textDecoration: 'underline' }}>{new Date(formData.date_issued).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</strong> in the City of Tagbilaran, Bohol, Philippines.
      </p>
    </div>
  );
};

export default {
  getPrintTemplate: getFormatBPrintTemplate,
  Preview: FormatBPreview,
};
