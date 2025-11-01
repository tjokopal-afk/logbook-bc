// =========================================
// PDF GENERATOR UTILITY
// Generate timesheet PDF from weekly logbook data
// =========================================

import type { WeeklyLogbook } from '@/types/logbook.types';
import { formatDate } from './dateUtils';

/**
 * Generate timesheet HTML from template
 */
export function generateTimesheetHTML(logbook: WeeklyLogbook, userData?: {
  name?: string;
  department?: string;
  university?: string;
  nim?: string;
  mentorName?: string;
  mentorId?: string;
}): string {
  // Sort entries by date
  const sortedEntries = [...logbook.entries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Generate table rows
  const tableRows = sortedEntries
    .map((entry, index) => {
      const description = (entry.description || entry.activity || '-')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br/>');

      return `
        <tr>
          <td>${index + 1}</td>
          <td>${formatDate(entry.date)}</td>
          <td>${entry.start_time || '-'}</td>
          <td>${entry.end_time || '-'}</td>
          <td>${entry.duration || '-'}</td>
          <td class="description-cell">${description}</td>
          <td class="paraf-cell"></td>
        </tr>`;
    })
    .join('');

  // Get logo path (convert to base64 or use URL)
  const logoPath = '/asset/LogoBC.jpg';

  // Build HTML
  const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Timesheet PKL/TA - PT. Berau Coal Energy</title>
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
    table-layout: fixed;
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
  
  /* PDF Generation Optimization */
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
        <img src="${logoPath}" alt="BCE Logo" crossorigin="anonymous">
      </div>
      <div class="company-info">
        <div class="company-name">PT. BERAU COAL ENERGY</div>
        <div class="company-subtitle">Logbook Magang & Praktik Kerja</div>
      </div>
    </div>
    <div class="doc-meta">
      <div class="period">${logbook.startDate} - ${logbook.endDate}</div>
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
      <span class="info-value">${userData?.name || 'Admin'}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Departemen:</span>
      <span class="info-value">${userData?.department || '-'}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Universitas:</span>
      <span class="info-value">${userData?.university || '-'}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Minggu:</span>
      <span class="info-value">${logbook.name}</span>
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
        ${tableRows}
      </tbody>
    </table>
  </div>
  
  <!-- Signatures -->
  <div class="signature-section">
    <!-- Mentor Signature -->
    <div class="signature-box">
      <div class="signature-role">Disetujui oleh</div>
      <div class="signature-image"></div>
      <div class="signature-line">
        <div class="signature-name">${userData?.mentorName || '-'}</div>
        <div class="signature-id">${userData?.mentorId || '-'}</div>
      </div>
    </div>
    
    <!-- User Signature -->
    <div class="signature-box">
      <div class="signature-role">Dibuat oleh</div>
      <div class="signature-image"></div>
      <div class="signature-line">
        <div class="signature-name">${userData?.name || 'Admin'}</div>
        <div class="signature-id">${userData?.nim || '-'}</div>
      </div>
    </div>
  </div>
  
</div>
</body>
</html>`;

  return html;
}

/**
 * Download timesheet as HTML file
 */
export function downloadTimesheetHTML(logbook: WeeklyLogbook, userData?: any): void {
  const html = generateTimesheetHTML(logbook, userData);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeFileName = logbook.name.replace(/[^a-z0-9]/gi, '_');
  a.download = `Timesheet_${safeFileName}_${new Date().toISOString().split('T')[0]}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

/**
 * Download timesheet as PDF using html2pdf.js
 * Note: Requires html2pdf.js library to be loaded
 */
export async function downloadTimesheetPDF(logbook: WeeklyLogbook, userData?: any): Promise<void> {
  // Check if html2pdf is available
  if (typeof (window as any).html2pdf === 'undefined') {
    throw new Error('html2pdf library not loaded. Please add the script to index.html');
  }

  const html = generateTimesheetHTML(logbook, userData);

  // Create temporary container
  const tempContainer = document.createElement('div');
  tempContainer.id = 'pdf-temp-container';
  tempContainer.style.position = 'fixed';
  tempContainer.style.left = '-9999px';
  tempContainer.style.top = '0';
  tempContainer.style.width = '297mm';
  tempContainer.style.height = 'auto';
  tempContainer.style.zIndex = '-1000';
  tempContainer.style.overflow = 'visible';
  tempContainer.innerHTML = html;

  // Append to body for DOM rendering
  document.body.appendChild(tempContainer);

  // Get the document-container element
  const element = tempContainer.querySelector('.document-container');

  if (!element) {
    document.body.removeChild(tempContainer);
    throw new Error('Document container not found');
  }

  // Wait for fonts and images to load
  await new Promise(resolve => setTimeout(resolve, 1000));

  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  // PDF options - optimized for A4 landscape single page
  const opt = {
    margin: 0,
    filename: `Timesheet_${logbook.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
    image: {
      type: 'jpeg',
      quality: 0.98,
    },
    html2canvas: {
      scale: 1.5,
      useCORS: true,
      logging: false,
      letterRendering: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'landscape',
      compress: true,
    },
    pagebreak: {
      mode: 'avoid-all',
    },
  };

  try {
    await (window as any).html2pdf().set(opt).from(element).save();
  } finally {
    // Cleanup
    document.body.removeChild(tempContainer);
  }
}
