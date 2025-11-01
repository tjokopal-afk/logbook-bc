// =========================================
// PDF EXPORT UTILITY
// Generate PDF from logbook data using html2pdf
// =========================================

import html2pdf from 'html2pdf.js';

interface LogbookEntry {
  date: string;
  startTime: string;
  endTime: string;
  duration: string;
  activity: string;
  description: string;
}

interface WeeklyReport {
  weekNumber: number;
  period: string;
  entries: LogbookEntry[];
  internName: string;
  internNIM: string;
  university: string;
  department: string;
  mentorName?: string;
  mentorNIP?: string;
  mentorSignature?: string;
  internSignature?: string;
  status?: 'draft' | 'submitted' | 'approved';
}

// Generate timesheet HTML from template
export function generateTimesheetHTML(report: WeeklyReport): string {
  const template = `
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Timesheet PKL/TA - Week ${report.weekNumber}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Libre+Franklin:wght@400;500;600;700;800&display=swap');
  
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  body {
    font-family: 'Libre Franklin', 'Franklin Gothic Medium', Arial, sans-serif;
    margin: 0;
    padding: 0;
    font-size: 10px;
    color: #1D1D1B;
    background: #E5E5E5;
    line-height: 1.4;
  }
  
  .document-container {
    width: 297mm;
    height: 210mm;
    max-height: 210mm;
    margin: 0 auto;
    background: white;
    padding: 12mm 15mm 10mm 15mm;
    box-sizing: border-box;
    border: 1px solid #1D1D1B;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    position: relative;
    overflow: hidden;
  }
  
  /* Header Section */
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    padding-bottom: 12px;
    border-bottom: 3px solid #1D1D1B;
  }
  
  .logo-section {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  
  .logo {
    width: 50px;
    height: 50px;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }
  
  .logo img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .company-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  
  .company-name {
    font-size: 15px;
    font-weight: 800;
    color: #1D1D1B;
    letter-spacing: -0.3px;
  }
  
  .company-subtitle {
    font-size: 9px;
    color: #6B6B6B;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .doc-meta {
    text-align: right;
    font-size: 9px;
    color: #6B6B6B;
  }
  
  .doc-meta .period {
    font-size: 10px;
    font-weight: 700;
    color: #80BA27;
    margin-bottom: 3px;
  }
  
  /* Title Section */
  .title-section {
    text-align: center;
    margin-bottom: 14px;
  }
  
  .main-title {
    font-size: 18px;
    font-weight: 800;
    color: #1D1D1B;
    margin-bottom: 5px;
    letter-spacing: -0.5px;
  }
  
  .subtitle {
    font-size: 12px;
    font-weight: 600;
    color: #80BA27;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  
  /* Info Grid */
  .info-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px 16px;
    margin-bottom: 14px;
    padding: 12px 16px;
    background: #F8F8F8;
    border-radius: 6px;
    border: 1px solid #E0E0E0;
  }
  
  .info-item {
    display: flex;
    align-items: baseline;
    gap: 8px;
  }
  
  .info-label {
    font-weight: 700;
    color: #1D1D1B;
    min-width: 85px;
    font-size: 10px;
  }
  
  .info-value {
    color: #4A4A4A;
    font-weight: 500;
    font-size: 10px;
  }
  
  /* Table */
  .table-container {
    margin-bottom: 16px;
    border-radius: 0;
    overflow: hidden;
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9.5px;
  }
  
  thead {
    background: #80BA27;
    color: white;
  }
  
  th {
    padding: 8px 6px;
    text-align: center;
    font-weight: 700;
    font-size: 9.5px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-right: 1px solid rgba(255, 255, 255, 0.3);
  }
  
  th:last-child {
    border-right: none;
  }
  
  tbody tr {
    border-bottom: 1px solid #E0E0E0;
  }
  
  tbody tr:nth-child(even) {
    background-color: #FAFAFA;
  }
  
  td {
    padding: 6px 6px;
    vertical-align: top;
    border-right: 1px solid #E0E0E0;
    color: #4A4A4A;
  }
  
  td:last-child {
    border-right: none;
  }
  
  td:first-child {
    text-align: center;
    font-weight: 700;
    color: #80BA27;
  }
  
  td:nth-child(2),
  td:nth-child(3),
  td:nth-child(4),
  td:nth-child(5) {
    text-align: center;
    white-space: nowrap;
  }
  
  .description-cell {
    line-height: 1.4;
    max-width: 400px;
    white-space: pre-wrap;
    word-break: break-word;
    font-size: 9px;
  }
  
  .paraf-cell {
    text-align: center;
    min-width: 60px;
  }
  
  /* Footer Signatures */
  .signature-section {
    display: flex;
    justify-content: space-between;
    margin-top: 16px;
    gap: 24px;
  }
  
  .signature-box {
    flex: 1;
    text-align: center;
    padding: 12px;
    background: #F8F8F8;
    border-radius: 6px;
    border: 1px solid #E0E0E0;
  }
  
  .signature-role {
    font-size: 10px;
    font-weight: 700;
    color: #6B6B6B;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .signature-image {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 6px;
  }
  
  .signature-image img {
    max-width: 180px;
    max-height: 60px;
    height: auto;
    width: auto;
    object-fit: contain;
  }
  
  .signature-line {
    width: 180px;
    margin: 0 auto 6px;
    border-top: 2px solid #1D1D1B;
    padding-top: 6px;
  }
  
  .signature-name {
    font-weight: 700;
    color: #1D1D1B;
    font-size: 10px;
    margin-bottom: 3px;
  }
  
  .signature-id {
    font-size: 9px;
    color: #6B6B6B;
    font-family: 'Courier New', monospace;
  }
  
  /* Print Optimization */
  @media print {
    body {
      padding: 0;
      background: white;
    }
    
    .document-container {
      box-shadow: none;
      border: 1px solid #1D1D1B;
      margin: 0;
    }
  }
  
  @page {
    size: A4 landscape;
    margin: 0;
  }
  
  .no-break {
    page-break-inside: avoid;
  }
  
  @media print, screen {
    * {
      -webkit-print-color-adjust: exact !important;
      color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
  }
</style>
</head>
<body>
<div class="document-container">
  
  <!-- Header -->
  <div class="header">
    <div class="logo-section">
      <div class="logo">
        <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTsSIlHBMogf_pXsKfY8_ORMhKBZdqLc9azmA&s" alt="Company Logo" crossorigin="anonymous">
      </div>
      <div class="company-info">
        <div class="company-name">PT. BERAU COAL ENERGY</div>
        <div class="company-subtitle">Logbook Magang & Praktik Kerja</div>
      </div>
    </div>
    <div class="doc-meta">
      <div class="period">${report.period}</div>
      <div>Dokumen Resmi</div>
    </div>
  </div>
  
  <!-- Title -->
  <div class="title-section">
    <h1 class="main-title">Timesheet PKL/TA</h1>
    <p class="subtitle">Laporan Aktivitas Mingguan</p>
  </div>
  
  <!-- Info Section -->
  <div class="info-grid">
    <div class="info-item">
      <span class="info-label">Nama:</span>
      <span class="info-value">${report.internName}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Departemen:</span>
      <span class="info-value">${report.department}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Universitas:</span>
      <span class="info-value">${report.university}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Minggu:</span>
      <span class="info-value">Week ${report.weekNumber}</span>
    </div>
  </div>
  
  <!-- Table -->
  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th style="width: 5%;">No</th>
          <th style="width: 11%;">Tanggal</th>
          <th style="width: 9%;">Jam Mulai</th>
          <th style="width: 9%;">Jam Berakhir</th>
          <th style="width: 8%;">Durasi</th>
          <th style="width: 48%;">Deskripsi Pekerjaan</th>
          <th style="width: 10%;">Paraf</th>
        </tr>
      </thead>
      <tbody>
        ${report.entries.map((entry, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${entry.date}</td>
          <td>${entry.startTime}</td>
          <td>${entry.endTime}</td>
          <td>${entry.duration}</td>
          <td class="description-cell">${entry.description}</td>
          <td class="paraf-cell"></td>
        </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  
  <!-- Signatures -->
  <div class="signature-section no-break">
    <!-- Mentor Signature -->
    <div class="signature-box">
      <div class="signature-role">Disetujui oleh</div>
      <div class="signature-image">
        ${report.mentorSignature && report.status === 'approved' ? `<img src="${report.mentorSignature}" alt="Mentor Signature" crossorigin="anonymous">` : ''}
      </div>
      <div class="signature-line">
        <div class="signature-name">${report.mentorName || '-'}</div>
        <div class="signature-id">${report.mentorNIP || '-'}</div>
      </div>
    </div>
    
    <!-- User Signature -->
    <div class="signature-box">
      <div class="signature-role">Dibuat oleh</div>
      <div class="signature-image">
        ${report.internSignature ? `<img src="${report.internSignature}" alt="Intern Signature" crossorigin="anonymous">` : ''}
      </div>
      <div class="signature-line">
        <div class="signature-name">${report.internName}</div>
        <div class="signature-id">${report.internNIM}</div>
      </div>
    </div>
  </div>
  
</div>
</body>
</html>
  `;

  return template;
}

// Export to PDF
export async function exportWeeklyReportToPDF(report: WeeklyReport): Promise<void> {
  try {
    // Generate HTML
    const htmlContent = generateTimesheetHTML(report);

    // Create temporary container
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'fixed';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '0';
    tempContainer.style.width = '297mm';
    tempContainer.style.height = 'auto';
    tempContainer.style.zIndex = '-1000';
    tempContainer.innerHTML = htmlContent;

    // Append to body
    document.body.appendChild(tempContainer);

    // Get the document container
    const element = tempContainer.querySelector('.document-container');

    if (!element) {
      throw new Error('Document container not found');
    }

    // Wait for fonts and images to load
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    // PDF options
    const opt = {
      margin: 0,
      filename: `Timesheet_Week${report.weekNumber}_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { 
        type: 'jpeg', 
        quality: 0.98 
      },
      html2canvas: { 
        scale: 1.5,
        useCORS: true,
        logging: false,
        letterRendering: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'landscape',
        compress: true
      },
      pagebreak: { 
        mode: 'avoid-all'
      }
    };

    // Generate PDF
    await html2pdf().set(opt).from(element).save();

    // Cleanup
    document.body.removeChild(tempContainer);
  } catch (error) {
    console.error('Error exporting PDF:', error);
    throw error;
  }
}

// Export to HTML (for preview or mentor view)
export function exportWeeklyReportToHTML(report: WeeklyReport): string {
  return generateTimesheetHTML(report);
}
