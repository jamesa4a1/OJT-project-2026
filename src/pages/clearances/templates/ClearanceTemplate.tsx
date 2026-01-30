// Unified Clearance Template - Main Component
// This file imports from individual format files and provides unified components

import React from 'react';

// Re-export types from types.ts (using export type for isolatedModules)
export type {
  FormData,
  CriminalCase,
  ClearanceTemplateProps,
} from './types';

// Re-export constants and utilities from types.ts
export {
  FORMAT_OPTIONS,
  FORMAT_FIELDS,
  CIVIL_STATUS_OPTIONS,
  SEX_OPTIONS,
  BLOOD_TYPE_OPTIONS,
  PURPOSE_OPTIONS,
  getOrdinalSuffix,
  formatDate,
  formatDateString,
  formatFullDate,
  buildFullName,
  hasCriminalRecord,
  TEXT_COLOR,
  getBaseStyle,
} from './types';

// Import individual format preview components
import { FormatAPreview, getFormatAHtml } from './FormatA';
import { FormatBPreview, getFormatBHtml } from './FormatB';
import { FormatCPreview, getFormatCHtml } from './FormatC';
import { FormatDPreview, getFormatDHtml } from './FormatD';
import { FormatEPreview, getFormatEHtml } from './FormatE';
import { FormatFPreview, getFormatFHtml } from './FormatF';

// Import types for this file
import type { FormData, ClearanceTemplateProps } from './types';
import { buildFullName } from './types';

/**
 * Unified Clearance Preview Component
 * 
 * This component automatically renders the correct format based on the 
 * format_type field in the form data.
 * 
 * Supported formats:
 * - A: Standard Basic Certification
 * - B: Criminal Record Certification (With Case Details)
 * - C: Detailed Certification (With Photo & Thumbmark)
 * - D: Criminal Record Certification (With Case Details Table)
 * - E: Overseas/Immigration Certification
 * - F: Complete Certification (Full Details with Photo)
 */
export const ClearancePreview: React.FC<ClearanceTemplateProps & { 
  showFullTemplate?: boolean; 
  generatedOR?: string | null; 
}> = ({ data, isDark, showFullTemplate = false, generatedOR }) => {
  const formatType = data.format_type || 'A';

  switch (formatType) {
    case 'A':
      return <FormatAPreview data={data} isDark={isDark} showFullTemplate={showFullTemplate} generatedOR={generatedOR} />;
    case 'B':
      return <FormatBPreview data={data} isDark={isDark} showFullTemplate={showFullTemplate} generatedOR={generatedOR} />;
    case 'C':
      return <FormatCPreview data={data} isDark={isDark} showFullTemplate={showFullTemplate} generatedOR={generatedOR} />;
    case 'D':
      return <FormatDPreview data={data} isDark={isDark} showFullTemplate={showFullTemplate} generatedOR={generatedOR} />;
    case 'E':
      return <FormatEPreview data={data} isDark={isDark} showFullTemplate={showFullTemplate} generatedOR={generatedOR} />;
    case 'F':
      return <FormatFPreview data={data} isDark={isDark} showFullTemplate={showFullTemplate} generatedOR={generatedOR} />;
    default:
      return <FormatAPreview data={data} isDark={isDark} showFullTemplate={showFullTemplate} generatedOR={generatedOR} />;
  }
};

/**
 * Print Template HTML Generator
 * 
 * Generates the HTML for printing based on the format type.
 * This is used for generating PDF documents.
 */
export const getPrintTemplate = (data: {
  formData: FormData;
  fullName: string;
  generatedOR: string | null;
}): string => {
  const { formData, fullName } = data;
  const formatType = formData.format_type || 'A';
  const resolvedFullName = fullName || buildFullName(formData);

  switch (formatType) {
    case 'A':
      return getFormatAHtml(formData, resolvedFullName);
    case 'B':
      return getFormatBHtml(formData, resolvedFullName);
    case 'C':
      return getFormatCHtml(formData, resolvedFullName);
    case 'D':
      return getFormatDHtml(formData, resolvedFullName);
    case 'E':
      return getFormatEHtml(formData, resolvedFullName);
    case 'F':
      return getFormatFHtml(formData, resolvedFullName);
    default:
      return getFormatAHtml(formData, resolvedFullName);
  }
};

// Export individual format components for direct use if needed
export {
  FormatAPreview,
  FormatBPreview,
  FormatCPreview,
  FormatDPreview,
  FormatEPreview,
  FormatFPreview,
  getFormatAHtml,
  getFormatBHtml,
  getFormatCHtml,
  getFormatDHtml,
  getFormatEHtml,
  getFormatFHtml,
};

export default ClearancePreview;
