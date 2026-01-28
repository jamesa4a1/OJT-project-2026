declare module 'html2pdf.js' {
  interface Html2PdfOptions {
    margin?: number | number[];
    filename?: string;
    image?: {
      type?: 'jpeg' | 'png' | 'webp';
      quality?: number;
    };
    html2canvas?: {
      scale?: number;
      useCORS?: boolean;
      logging?: boolean;
      backgroundColor?: string;
    };
    jsPDF?: {
      unit?: 'mm' | 'cm' | 'in' | 'px';
      format?: string;
      orientation?: 'portrait' | 'landscape';
      compress?: boolean;
    };
    pagebreak?: {
      mode?: string[];
      before?: string;
      after?: string;
      avoid?: string;
      pageSelector?: string;
    };
  }

  interface Html2Pdf {
    set: (options: Html2PdfOptions) => Html2Pdf;
    from: (element: HTMLElement | string) => Html2Pdf;
    save: (filename?: string) => void;
    output: (type: 'datauristring' | 'datauri' | 'dataurlstring') => string;
    outputPdf: (type?: 'blob' | 'arraybuffer' | 'datauristring') => any;
    then: (callback: (pdf: any) => void) => Html2Pdf;
  }

  function html2pdf(): Html2Pdf;

  export default html2pdf;
}
