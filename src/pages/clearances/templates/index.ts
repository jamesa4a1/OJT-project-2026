/**
 * CLEARANCE TEMPLATES INDEX
 * 
 * This file exports all format templates and utilities for easy import.
 * 
 * FORMAT SUMMARY:
 * ===============
 * Format A - Individual - No Criminal Record
 * Format B - Individual - Has Criminal Record
 * Format C - Family/Requester - No Criminal Record
 * Format D - Family/Requester - Has Criminal Record
 * Format E - Individual - No Derogatory Record
 * Format F - Individual - Balsaff Application (With Case)
 */

// Types and Interfaces
export * from './types';

// Constants (FORMAT_TYPES, CIVIL_STATUS_OPTIONS, PURPOSE_OPTIONS, etc.)
export * from './constants';

// Individual Format Templates
export { default as FormatA, getFormatAPrintTemplate, FormatAPreview } from './FormatA';
export { default as FormatB, getFormatBPrintTemplate, FormatBPreview } from './FormatB';
export { default as FormatC, getFormatCPrintTemplate, FormatCPreview } from './FormatC';
export { default as FormatD, getFormatDPrintTemplate, FormatDPreview } from './FormatD';
export { default as FormatE, getFormatEPrintTemplate, FormatEPreview } from './FormatE';
export { default as FormatF, getFormatFPrintTemplate, FormatFPreview } from './FormatF';

// Import for combined usage
import { TemplateProps } from './types';
import { FORMAT_TYPES } from './constants';
import { getFormatAPrintTemplate } from './FormatA';
import { getFormatBPrintTemplate } from './FormatB';
import { getFormatCPrintTemplate } from './FormatC';
import { getFormatDPrintTemplate } from './FormatD';
import { getFormatEPrintTemplate } from './FormatE';
import { getFormatFPrintTemplate } from './FormatF';

/**
 * Get the appropriate print template based on format type
 * @param formatType - The format type (A, B, C, D, E, F)
 * @param props - Template properties
 * @returns HTML string for the print template
 */
export const getPrintTemplateByFormat = (formatType: string, props: TemplateProps): string => {
  const formatConfig = FORMAT_TYPES[formatType];
  
  if (!formatConfig) {
    console.warn(`Unknown format type: ${formatType}, defaulting to Format A`);
    return getFormatAPrintTemplate(props);
  }

  // Format E - No Derogatory Record
  if (formatConfig.isDerogatory) {
    return getFormatEPrintTemplate(props);
  }
  
  // Format F - Balsaff Application
  if (formatConfig.isBalsaff) {
    return getFormatFPrintTemplate(props);
  }
  
  // Formats with Criminal Record (B, D)
  if (formatConfig.hasCR) {
    if (formatConfig.isFamily) {
      return getFormatDPrintTemplate(props);
    }
    return getFormatBPrintTemplate(props);
  }
  
  // Formats without Criminal Record (A, C)
  if (formatConfig.isFamily) {
    return getFormatCPrintTemplate(props);
  }
  
  return getFormatAPrintTemplate(props);
};

// Re-export FormatAPreview through FormatFPreview for easy component access
import { FormatAPreview } from './FormatA';
import { FormatBPreview } from './FormatB';
import { FormatCPreview } from './FormatC';
import { FormatDPreview } from './FormatD';
import { FormatEPreview } from './FormatE';
import { FormatFPreview } from './FormatF';

/**
 * Map of format type to preview component
 */
export const FormatPreviewComponents = {
  A: FormatAPreview,
  B: FormatBPreview,
  C: FormatCPreview,
  D: FormatDPreview,
  E: FormatEPreview,
  F: FormatFPreview,
};
