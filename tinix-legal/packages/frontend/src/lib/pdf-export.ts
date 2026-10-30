import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import htmlToPdfmake from 'html-to-pdfmake';

// Initialize virtual file system for fonts
if ((pdfFonts as any)?.pdfMake?.vfs) {
  (pdfMake as any).vfs = (pdfFonts as any).pdfMake.vfs;
} else if ((pdfFonts as any)?.vfs) {
  (pdfMake as any).vfs = (pdfFonts as any).vfs;
}

// Configure default fonts to ensure Vietnamese support
(pdfMake as any).fonts = {
  Roboto: {
    normal: 'Roboto-Regular.ttf',
    bold: 'Roboto-Medium.ttf',
    italics: 'Roboto-Italic.ttf',
    bolditalics: 'Roboto-MediumItalic.ttf'
  }
};

export const exportToPDF = (contentHtml: string, title: string = 'Document') => {
  // Preprocess HTML so htmlToPdfmake recognizes page breaks and removes empty artifacts
  const processedHtml = contentHtml
    .replace(/<hr[^>]*class="[^"]*page-break[^"]*"[^>]*>/gi, '<div style="page-break-after: always;"></div>')
    .replace(/<hr[^>]*data-type="page-break"[^>]*>/gi, '<div style="page-break-after: always;"></div>');

  // Convert HTML from TipTap to pdfMake format
  const pdfMakeContent = htmlToPdfmake(processedHtml, {
    defaultStyles: {
      p: { margin: [0, 4, 0, 4] },
      h1: { margin: [0, 10, 0, 10], bold: true, fontSize: 16 },
      h2: { margin: [0, 8, 0, 8], bold: true, fontSize: 14 },
      h3: { margin: [0, 5, 0, 5], bold: true, fontSize: 12 },
      table: { margin: [0, 8, 0, 8] },
    }
  });


  const docDefinition = {
    content: pdfMakeContent,
    defaultStyle: {
      font: 'Roboto',
      fontSize: 14,
      lineHeight: 1.5,
    },
    pageMargins: [85, 56, 56, 56] as [number, number, number, number], // Trái 3cm (~85pt), Phải/Trên/Dưới 2cm (~56pt)
    info: {
      title: title,
      author: 'Tinix Legal AI',
    },
  };

  // Generate and download the PDF
  (pdfMake as any).createPdf(docDefinition as any).download(`${title.replace(/\s+/g, '_')}.pdf`);
};

