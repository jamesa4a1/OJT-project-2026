/**
 * FORMAT E - Individual - No Derogatory Record
 * 
 * This format is used for individuals who have NO derogatory record.
 * States "NO DEROGATORY RECORD" instead of "NO CRIMINAL RECORD".
 * Used for specific purposes like employment verification.
 */

import React from 'react';
import { TemplateProps, PreviewTemplateProps } from './types';
import { getOrdinalSuffix } from './constants';

// ============================================
// PRINT TEMPLATE - Format E
// ============================================
export const getFormatEPrintTemplate = (props: TemplateProps): string => {
  const { formData, fullName } = props;
  
  return `
    <!-- Format E - No Derogatory Record -->
    <p class="body-text" style="margin-bottom: 4pt;">
      THIS IS TO CERTIFY that per records of this office show that one <strong>${fullName || '[FULL NAME]'}</strong>, <strong>${formData.age || '[AGE]'} years old</strong>, <strong>${formData.civil_status || '[STATUS]'}</strong>, <strong>${formData.nationality || 'Filipino'}</strong>, residing at <strong>${formData.address || '[ADDRESS]'}</strong> has <span style="color: #008000; font-weight: bold;">NO DEROGATORY RECORD</span> found in this office.
    </p>
    
    <br>
    
    <!-- Issued upon request section -->
    <div style="text-align: left; margin: 0 0 0 22pt; line-height: 1.0; font-size: 12pt;">
      <div>
        <span>Issued upon request: </span>
        <strong><u>${formData.issued_upon_request_by || fullName || '[REQUESTER]'}</u></strong>
      </div>
      <div>
        <span>Purpose: </span>
        <strong><u>${(formData.purpose === 'Other' ? formData.custom_purpose : formData.purpose)?.toUpperCase() || '[PURPOSE]'}</u></strong>
      </div>
    </div>
    
    <br>
    
    <!-- WITNESS MY HAND with indentation -->
    <p style="margin-top: 12pt; margin-bottom: 18pt; text-indent: 0.3in; line-height: 1.4; font-size: 12pt;">
      &nbsp;&nbsp;&nbsp;&nbsp;WITNESS MY HAND this <strong><u>${new Date(formData.date_issued).getDate()}${getOrdinalSuffix ? getOrdinalSuffix(new Date(formData.date_issued).getDate()) : ''}</u></strong> day of <strong><u>${new Date(formData.date_issued).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</u></strong> in the City of Tagbilaran, Bohol, Philippines.
    </p>
  `;
};

// ============================================
// PREVIEW COMPONENT - Format E
// ============================================
export const FormatEPreview: React.FC<PreviewTemplateProps> = ({ formData, fullName, textColor, generatedOR, getOrdinalSuffix }) => {
  return (
    <div>
      <p style={{ 
        marginBottom: '12pt',
        textIndent: '0.5in',
        lineHeight: '1.5',
        textAlign: 'justify',
        fontSize: '11pt'
      }}>
        THIS IS TO CERTIFY that per records of this office show that one <strong>{fullName || '[FULL NAME]'}</strong>, {formData.age || '[AGE]'} years old, {formData.civil_status}, {formData.nationality}, residing at <strong>{formData.address || '[ADDRESS]'}</strong> has <span style={{ color: '#008000', fontWeight: 'bold' }}>NO DEROGATORY RECORD</span> found in this office.
      </p>
      
      {/* Issued upon request */}
      <p style={{ 
        marginBottom: '6pt',
        textIndent: '0.3in',
        lineHeight: '1.4',
        textAlign: 'left',
        fontSize: '9pt'
      }}>
        Issued upon request: <strong style={{ textDecoration: 'underline' }}>{formData.issued_upon_request_by || `${formData.first_name} ${formData.last_name}` || '[REQUESTER]'}</strong>
      </p>
      {/* Purpose */}
      <p style={{ 
        marginBottom: '12pt',
        textIndent: '0.3in',
        lineHeight: '1.4',
        textAlign: 'left',
        fontSize: '9pt'
      }}>
        Purpose: <strong style={{ textDecoration: 'underline' }}>{(formData.purpose === 'Other' ? formData.custom_purpose : formData.purpose)?.toUpperCase() || '[PURPOSE]'}</strong>
      </p>
      
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
  getPrintTemplate: getFormatEPrintTemplate,
  Preview: FormatEPreview,
};
