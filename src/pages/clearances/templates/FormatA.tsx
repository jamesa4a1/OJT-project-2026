/**
 * FORMAT A - Individual - No Criminal Record
 * 
 * This format is used for individuals who have NO criminal record.
 * The certificate states "NO CRIMINAL RECORD" in green text.
 */

import React from 'react';
import { TemplateProps, PreviewTemplateProps } from './types';
import { getOrdinalSuffix } from './constants';

// ============================================
// PRINT TEMPLATE - Format A
// ============================================
export const getFormatAPrintTemplate = (props: TemplateProps): string => {
  const { formData, fullName, generatedOR } = props;
  
  return `
    <!-- Format A - No Criminal Record -->
    <p class="body-text" style="margin-bottom: 4pt; margin-left: 2pt; line-height: 1.15;">
      THIS IS TO CERTIFY that the records of this office show that one <strong>${fullName || '[FULL NAME]'}${formData.alias ? ` y ${formData.alias.toUpperCase()}` : ''}</strong>, <strong>${formData.age || '[AGE]'} years old</strong>, <strong>${formData.civil_status || '[STATUS]'}</strong>, <strong>${formData.nationality || 'Filipino'}</strong>, residing at <strong>${formData.address || '[ADDRESS]'}</strong> has
    </p>
    
    <!-- NO CRIMINAL RECORD -->
    <div class="no-record" style="margin: 24pt 0;">
      <p style="margin: 12pt 0;"></p>
      <p style="text-align: center; color: #008000; font-weight: bold; font-size: 25pt; margin: 0;">"NO CRIMINAL RECORD"</p>
      <p style="margin: 12pt 0;"></p>
    </div>
    
    <br>
    
    <!-- Issued upon request section for no criminal record -->
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
// PREVIEW COMPONENT - Format A
// ============================================
export const FormatAPreview: React.FC<PreviewTemplateProps> = ({ formData, fullName, textColor, generatedOR, getOrdinalSuffix }) => {
  return (
    <div>
      {/* Main paragraph - 10-11pt, justified, 0.5" indent */}
      <p style={{ 
        marginBottom: '12pt',
        textIndent: '0.3in',
        lineHeight: '1.4',
        textAlign: 'justify',
        fontSize: '9pt'
      }}>
        THIS IS TO CERTIFY that the records of this office show that one <strong>{fullName || '[FULL NAME]'}, {formData.age || '[AGE]'} years old, {formData.civil_status}, {formData.nationality},</strong> residing at <strong>{formData.address || '[ADDRESS]'}</strong> has
      </p>
      
      {/* "NO CRIMINAL RECORD" - 14-16pt, bold, green, centered */}
      <div style={{ textAlign: 'center', margin: '24pt 0 24pt 0' }}>
        <p style={{ marginBottom: '12pt' }}></p>
        <p className="green-text" style={{ 
          color: '#008000', 
          fontWeight: 'bold', 
          fontSize: '25pt',
          margin: '0',
          fontFamily: '"Century Gothic", Arial, sans-serif'
        }}>
          "NO CRIMINAL RECORD"
        </p>
        <p style={{ marginTop: '12pt' }}></p>
      </div>

      {/* Issued upon request - 10-11pt, left aligned */}
      <p style={{ 
        marginBottom: '6pt',
        textIndent: '0.3in',
        lineHeight: '1.4',
        textAlign: 'left',
        fontSize: '9pt'
      }}>
        Issued upon request: <strong style={{ textDecoration: 'underline' }}>{formData.issued_upon_request_by || `${formData.first_name} ${formData.last_name}` || '[REQUESTER]'}</strong>
      </p>
      {/* Purpose - 10-11pt, bold */}
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
  getPrintTemplate: getFormatAPrintTemplate,
  Preview: FormatAPreview,
};
