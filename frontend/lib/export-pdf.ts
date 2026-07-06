import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ExportData {
  title: string;
  subtitle?: string;
  columns: string[];
  data: any[][];
  fileName?: string;
  logo?: string;
}

export interface ExportSection {
  title: string;
  columns: string[];
  data: any[][];
}

export function exportToPDF({ title, subtitle, columns, data, fileName = 'export', logo }: ExportData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Add gradient header background
  doc.setFillColor(88, 28, 135);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  // Add decorative gradient effect
  doc.setFillColor(168, 85, 247);
  doc.rect(0, 35, pageWidth, 5, 'F');
  
  // Add JCI logo placeholder (text-based)
  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('JCI', 14, 20);
  
  // Add title
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text(title, 45, 20);
  
  // Add subtitle if provided
  if (subtitle) {
    doc.setFontSize(11);
    doc.setTextColor(200, 200, 200);
    doc.text(subtitle, 14, 32);
  }
  
  // Add generation info
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}`, 14, 55);
  
  // Add table with enhanced styling
  autoTable(doc, {
    head: [columns],
    body: data,
    startY: 65,
    theme: 'grid',
    headStyles: {
      fillColor: [139, 92, 246], // Purple
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold',
      halign: 'left',
      valign: 'middle',
      cellPadding: 8,
    },
    bodyStyles: {
      fillColor: [255, 255, 255],
      textColor: [60, 60, 60],
      fontSize: 9,
      halign: 'left',
      valign: 'middle',
      cellPadding: 6,
      lineColor: [230, 230, 230],
      lineWidth: 0.1,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
    },
    margin: { top: 10, right: 15, bottom: 20, left: 15 },
    styles: {
      overflow: 'linebreak',
      cellWidth: 'wrap',
    },
    didDrawPage: (data) => {
      // Add footer with page number
      const pageCount = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Page ${data.pageNumber} / ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
      
      // Add footer line
      doc.setDrawColor(230, 230, 230);
      doc.line(15, doc.internal.pageSize.getHeight() - 15, pageWidth - 15, doc.internal.pageSize.getHeight() - 15);
      
      // Add JCI footer text
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('JCI Ledger - Système de Gestion Financière', 15, doc.internal.pageSize.getHeight() - 10);
    },
  });
  
  // Save the PDF
  doc.save(`${fileName}_${new Date().toISOString().split('T')[0]}.pdf`);
}

export function exportToExcel(data: any[], fileName: string) {
  const XLSX = require('xlsx');
  
  // Create worksheet with styling
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Set column widths
  const wscols = [
    { wch: 20 }, // Section
    { wch: 30 }, // Metric
    { wch: 15 }, // Value
  ];
  worksheet['!cols'] = wscols;
  
  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Rapport JCI');
  
  // Save file
  XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
}

export function exportReportBundle({
  title,
  subtitle,
  sections,
  fileName = 'report',
}: {
  title: string;
  subtitle?: string;
  sections: ExportSection[];
  fileName?: string;
}) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 34, 'F');
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 34, pageWidth, 4, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text(title, 14, 18);

  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(226, 232, 240);
    doc.text(subtitle, 14, 27);
  }

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(9);
  doc.text(`Généré le ${new Date().toLocaleString('fr-FR')}`, 14, 46);

  let currentY = 54;
  sections.forEach((section, index) => {
    if (index > 0) {
      currentY += 8;
    }

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.text(section.title, 14, currentY);
    currentY += 4;

    autoTable(doc, {
      head: [section.columns],
      body: section.data,
      startY: currentY + 4,
      theme: 'grid',
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      bodyStyles: {
        textColor: [30, 41, 59],
        fillColor: [255, 255, 255],
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: 14, right: 14 },
      styles: {
        fontSize: 8.5,
        cellPadding: 4,
        overflow: 'linebreak',
      },
    });

    currentY = (doc as any).lastAutoTable.finalY || currentY + 20;

    if (index < sections.length - 1 && currentY > 250) {
      doc.addPage();
      currentY = 20;
    }
  });

  doc.save(`${fileName}_${new Date().toISOString().split('T')[0]}.pdf`);
}
