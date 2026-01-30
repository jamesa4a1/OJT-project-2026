// Unified Clearance Template - Supports all 6 formats (A-F)
// 
// File Structure:
// - types.ts: Shared types, interfaces, constants, and utilities
// - FormatA.tsx: Standard Basic Certification
// - FormatB.tsx: Criminal Record Certification (With Case Details)
// - FormatC.tsx: Detailed Certification (With Photo & Thumbmark)
// - FormatD.tsx: Criminal Record Certification (With Case Details Table)
// - FormatE.tsx: Overseas/Immigration Certification
// - FormatF.tsx: Complete Certification (Full Details with Photo)
// - ClearanceTemplate.tsx: Unified component that delegates to individual formats

// Main components (use these for most cases)
export { 
  ClearancePreview,
  getPrintTemplate,
} from './ClearanceTemplate';

// Types and interfaces
export type { 
  CriminalCase, 
  FormData, 
  ClearanceTemplateProps 
} from './types';

// Constants
export {
  FORMAT_OPTIONS,
  FORMAT_FIELDS,
  CIVIL_STATUS_OPTIONS,
  SEX_OPTIONS,
  BLOOD_TYPE_OPTIONS,
  PURPOSE_OPTIONS,
  TEXT_COLOR,
} from './types';

// Utility functions
export {
  getOrdinalSuffix,
  formatDate,
  formatDateString,
  formatFullDate,
  buildFullName,
  hasCriminalRecord,
  getBaseStyle,
} from './types';

// Individual format components (use for direct format rendering)
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
} from './ClearanceTemplate';
