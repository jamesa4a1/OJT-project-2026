/**
 * FORMAT D - Family/Requester - Has Criminal Record
 * 
 * This format is used for family members or third-party requesters
 * when the subject HAS criminal records.
 * Similar to Format B but may be requested by someone other than the subject.
 */

import React from 'react';
import { TemplateProps, PreviewTemplateProps } from './types';
import { getOrdinalSuffix } from './constants';

// ============================================
// PRINT TEMPLATE - Format D
// ============================================
export const getFormatDPrintTemplate = (props: TemplateProps): string => {
  const { formData, fullName } = props;
  
  // Format D uses similar template to Format B (Has Criminal Record)
  return `
    <!-- Format D - Family/Requester - Has Criminal Record -->
    <p class="body-text" style="margin-bottom: 4pt; line-height: 1.35; font-size: 11pt;">
      THIS IS TO CERTIFY that per records of this office show that one <strong>${fullName || '[FULL NAME]'}${formData.alias ? ` y ${formData.alias.toUpperCase()}` : ''}</strong>, ${formData.age || '[AGE]'} years old, ${formData.civil_status || '[STATUS]'}, ${formData.nationality || 'Filipino'}, residing at ${formData.address || '[ADDRESS]'}, Philippines has been charged of the following:
    </p>
    
    ${formData.criminal_cases.map((c, idx) => `
      <p style="margin: 2pt 0; line-height: 1.2; font-size: 10pt;">
        <span style="display: inline-block; width: 100pt;">Crim. Case No.</span>
        <span style="margin-right: 4px;">:</span>
        <strong>${c.case_number || '[CASE NUMBER]'}</strong>
      </p>
      <p style="margin: 2pt 0; line-height: 1.2; font-size: 10pt;">
        <span style="display: inline-block; width: 100pt;">Crime</span>
        <span style="margin-right: 4px;">:</span>
        <strong>${c.crime || '[CRIME]'}</strong>
      </p>
      <p style="margin: 2pt 0; line-height: 1.2; font-size: 10pt;">
        <span style="display: inline-block; width: 100pt;">Date Info Filed</span>
        <span style="margin-right: 4px;">:</span>
        <span>${c.date_info_filed ? new Date(c.date_info_filed).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '[DATE]'}</span>
      </p>
      <p style="margin: 2pt 0; line-height: 1.2; font-size: 10pt;">
        <span style="display: inline-block; width: 100pt;">Origin</span>
        <span style="margin-right: 4px;">:</span>
        <span>${c.origin || 'Tagbilaran City'}</span>
      </p>
      <p style="margin: 2pt 0; line-height: 1.2; font-size: 10pt;">
        <span style="display: inline-block; width: 100pt;">Status</span>
        <span style="margin-right: 4px;">:</span>
        <span>${c.status || '[STATUS]'}</span>
      </p>
      ${idx < formData.criminal_cases.length - 1 ? '<br style="margin: 0; padding: 0; height: 3pt;">' : ''}
    `).join('')}
    
    <br>
    
    <!-- Issued upon request section (shows requester name for family requests) -->
    <p style="margin: 0; line-height: 1.0; font-size: 10pt; text-indent: 0.3in;">
      <span>Issued upon request: </span>
      <strong><u>${formData.issued_upon_request_by || '[REQUESTER NAME]'}</u></strong>
    </p>
    <p style="margin: 0; line-height: 1.0; font-size: 10pt; margin-left: 110pt;">
      <span>Purpose: </span>
      <strong><u>${formData.purpose === 'Other' ? (formData.custom_purpose?.toUpperCase() || '[PURPOSE]') : (formData.purpose?.toUpperCase() || '[PURPOSE]')}</u></strong>
    </p>
    
    <br>
    
    <!-- WITNESS MY HAND with indentation -->
    <p style="margin-top: 12pt; margin-bottom: 18pt; text-indent: 0.3in; line-height: 1.4; font-size: 12pt;">
      &nbsp;&nbsp;&nbsp;&nbsp;WITNESS MY HAND this <strong><u>${new Date(formData.date_issued).getDate()}${getOrdinalSuffix ? getOrdinalSuffix(new Date(formData.date_issued).getDate()) : ''}</u></strong> day of <strong><u>${new Date(formData.date_issued).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</u></strong> in the City of Tagbilaran, Bohol, Philippines.
    </p>
  `;
};

// ============================================
// PREVIEW COMPONENT - Format D
// ============================================
export const FormatDPreview: React.FC<PreviewTemplateProps> = ({ formData, fullName, textColor, generatedOR, getOrdinalSuffix }) => {
  return (
    <div>
      <p style={{ 
        marginBottom: '8pt',
        textIndent: '0.3in',
        lineHeight: '1.35',
        textAlign: 'justify',
        fontSize: '10pt'
      }}>
        THIS IS TO CERTIFY that per records of this office show that one <strong>{fullName || '[FULL NAME]'}{formData.alias && ` y ${formData.alias.toUpperCase()}`}</strong>, {formData.age || '[AGE]'} years old, {formData.civil_status}, {formData.nationality}, residing at {formData.address || '[ADDRESS]'}, Philippines has been charged of the following:
      </p>
      
      {/* Multiple Criminal Cases */}
      {formData.criminal_cases.map((c, idx) => (
        <div key={idx} style={{ marginBottom: '10pt', marginLeft: '0.3in', fontSize: '9pt', lineHeight: '1.3' }}>
          <p style={{ marginBottom: '1pt' }}>
            <span style={{ display: 'inline-block', width: '90px' }}>Crim. Case No.</span>
            <span style={{ marginRight: '4px' }}>:</span>
            <strong>{c.case_number || '[CASE NUMBER]'}</strong>
          </p>
          <p style={{ marginBottom: '1pt' }}>
            <span style={{ display: 'inline-block', width: '90px' }}>Crime</span>
            <span style={{ marginRight: '4px' }}>:</span>
            <strong>{c.crime || '[CRIME]'}</strong>
          </p>
          <p style={{ marginBottom: '1pt' }}>
            <span style={{ display: 'inline-block', width: '90px' }}>Date Info Filed</span>
            <span style={{ marginRight: '4px' }}>:</span>
            <span>{c.date_info_filed ? new Date(c.date_info_filed).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '[DATE]'}</span>
          </p>
          <p style={{ marginBottom: '1pt' }}>
            <span style={{ display: 'inline-block', width: '90px' }}>Origin</span>
            <span style={{ marginRight: '4px' }}>:</span>
            <span>{c.origin || 'Tagbilaran City'}</span>
          </p>
          <p style={{ marginBottom: '1pt' }}>
            <span style={{ display: 'inline-block', width: '90px' }}>Status</span>
            <span style={{ marginRight: '4px' }}>:</span>
            <span>{c.status || '[STATUS]'}</span>
          </p>
        </div>
      ))}

      {/* Issued upon request section - shows requester name */}
      <div style={{ marginTop: '10pt', marginLeft: '0.3in', fontSize: '9pt', lineHeight: '1.4' }}>
        <p style={{ marginBottom: '2pt' }}>
          <span>Issued upon request:</span>
          <span style={{ marginLeft: '8px', textDecoration: 'underline' }}>
            <strong>{formData.issued_upon_request_by || '[REQUESTER NAME]'}</strong>
          </span>
        </p>
        <p style={{ marginBottom: '2pt' }}>
          <span style={{ marginLeft: '45px' }}>Purpose:</span>
          <span style={{ marginLeft: '8px', textDecoration: 'underline' }}>
            <strong>{formData.purpose === 'Other' ? formData.custom_purpose?.toUpperCase() : formData.purpose?.toUpperCase() || '[PURPOSE]'}</strong>
          </span>
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
  getPrintTemplate: getFormatDPrintTemplate,
  Preview: FormatDPreview,
};
