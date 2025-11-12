// =========================================
// LOGBOOK PDF GENERATION SERVICE
// Generate PDFs for approved weekly logbooks with signatures
// =========================================

import { supabase } from '@/supabase';
import type { LogbookEntry } from '@/types/logbook.types';
import { format, parseISO } from 'date-fns';

// =========================================
// PDF GENERATION
// =========================================

interface GeneratePdfOptions {
  userId: string;
  projectId: string;
  weekNumber: number;
  internName: string;
  mentorName: string;
  internSignatureUrl?: string;
  mentorSignatureUrl?: string;
}

/**
 * Generate PDF for approved weekly logbook
 * Returns public URL of the generated PDF stored in logbook-pdfs bucket
 */
export async function generateWeeklyLogbookPdf(
  options: GeneratePdfOptions
): Promise<string> {
  try {
    const { userId, projectId, weekNumber, internName, mentorName, internSignatureUrl, mentorSignatureUrl } = options;

    // Get approved entries for the week
    const { data: entries, error } = await supabase
      .from('logbook_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('project_id', projectId)
      .eq('category', `weekly_${weekNumber}_log_approved`)
      .order('entry_date', { ascending: true });

    if (error) throw error;
    if (!entries || entries.length === 0) {
      throw new Error('No approved entries found for this week');
    }

    // Generate HTML for PDF
    const htmlContent = generateLogbookHtml(entries as LogbookEntry[], {
      weekNumber,
      internName,
      mentorName,
      internSignatureUrl,
      mentorSignatureUrl,
    });

    // Convert HTML to PDF (using browser's print functionality or a library)
    // For now, we'll save the HTML content as a blob
    // In production, you should use a PDF generation library like jsPDF or pdfmake
    const blob = new Blob([htmlContent], { type: 'text/html' });

    // Upload to storage
    const fileName = `logbook_week${weekNumber}_${Date.now()}.html`; // Use .pdf after implementing proper PDF generation
    const filePath = `${userId}/week_${weekNumber}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('logbook-pdfs')
      .upload(filePath, blob, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('logbook-pdfs')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Generate PDF error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to generate PDF');
  }
}

/**
 * Generate HTML content for the logbook
 * This HTML can be printed or converted to PDF
 */
function generateLogbookHtml(
  entries: LogbookEntry[],
  metadata: {
    weekNumber: number;
    internName: string;
    mentorName: string;
    internSignatureUrl?: string;
    mentorSignatureUrl?: string;
  }
): string {
  const { weekNumber, internName, mentorName, internSignatureUrl, mentorSignatureUrl } = metadata;

  // Calculate date range
  const dates = entries.map(e => e.entry_date).sort();
  const startDate = dates[0] ? format(parseISO(dates[0]), 'dd MMMM yyyy') : '';
  const endDate = dates[dates.length - 1] ? format(parseISO(dates[dates.length - 1]), 'dd MMMM yyyy') : '';

  // Calculate total hours
  const totalMinutes = entries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Logbook Minggu ${weekNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: Arial, sans-serif;
      font-size: 12px;
      line-height: 1.5;
      padding: 20px;
      color: #000;
    }
    
    .header {
      text-align: center;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #000;
    }
    
    .header h1 {
      font-size: 18px;
      margin-bottom: 5px;
    }
    
    .header p {
      font-size: 12px;
      margin: 2px 0;
    }
    
    .info-section {
      margin-bottom: 20px;
    }
    
    .info-row {
      display: flex;
      margin-bottom: 5px;
    }
    
    .info-label {
      width: 120px;
      font-weight: bold;
    }
    
    .info-value {
      flex: 1;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    
    th, td {
      border: 1px solid #000;
      padding: 8px;
      text-align: left;
    }
    
    th {
      background-color: #f0f0f0;
      font-weight: bold;
    }
    
    .signatures {
      display: flex;
      justify-content: space-between;
      margin-top: 40px;
    }
    
    .signature-box {
      text-align: center;
      width: 45%;
    }
    
    .signature-box p {
      margin-bottom: 60px;
    }
    
    .signature-img {
      max-width: 150px;
      max-height: 60px;
      margin-bottom: 10px;
    }
    
    .signature-name {
      border-top: 1px solid #000;
      padding-top: 5px;
      display: inline-block;
      min-width: 200px;
    }
    
    @media print {
      body {
        padding: 0;
      }
      
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>LOGBOOK MAGANG</h1>
    <p>Minggu ${weekNumber}</p>
    <p>${startDate} - ${endDate}</p>
  </div>
  
  <div class="info-section">
    <div class="info-row">
      <div class="info-label">Nama Peserta:</div>
      <div class="info-value">${internName}</div>
    </div>
    <div class="info-row">
      <div class="info-label">Pembimbing:</div>
      <div class="info-value">${mentorName}</div>
    </div>
    <div class="info-row">
      <div class="info-label">Total Jam Kerja:</div>
      <div class="info-value">${totalHours} jam ${remainingMinutes} menit</div>
    </div>
  </div>
  
  <table>
    <thead>
      <tr>
        <th style="width: 10%;">No</th>
        <th style="width: 15%;">Tanggal</th>
        <th style="width: 15%;">Waktu</th>
        <th style="width: 50%;">Kegiatan</th>
        <th style="width: 10%;">Durasi</th>
      </tr>
    </thead>
    <tbody>
      ${entries.map((entry, index) => {
        const date = entry.entry_date ? format(parseISO(entry.entry_date), 'dd/MM/yyyy') : '-';
        const startTime = entry.start_time ? format(parseISO(entry.start_time), 'HH:mm') : '-';
        const endTime = entry.end_time ? format(parseISO(entry.end_time), 'HH:mm') : '-';
        const duration = entry.duration_minutes 
          ? `${Math.floor(entry.duration_minutes / 60)}:${String(entry.duration_minutes % 60).padStart(2, '0')}`
          : '-';
        
        return `
        <tr>
          <td>${index + 1}</td>
          <td>${date}</td>
          <td>${startTime} - ${endTime}</td>
          <td>${entry.content || '-'}</td>
          <td>${duration}</td>
        </tr>
        `;
      }).join('')}
    </tbody>
  </table>
  
  <div class="signatures">
    <div class="signature-box">
      <p>Peserta Magang,</p>
      ${internSignatureUrl ? `<img src="${internSignatureUrl}" alt="Tanda tangan peserta" class="signature-img" />` : '<div style="height: 60px;"></div>'}
      <div class="signature-name">${internName}</div>
    </div>
    
    <div class="signature-box">
      <p>Pembimbing,</p>
      ${mentorSignatureUrl ? `<img src="${mentorSignatureUrl}" alt="Tanda tangan pembimbing" class="signature-img" />` : '<div style="height: 60px;"></div>'}
      <div class="signature-name">${mentorName}</div>
    </div>
  </div>
  
  <div class="no-print" style="margin-top: 40px; text-align: center;">
    <button onclick="window.print()" style="padding: 10px 20px; font-size: 14px; cursor: pointer;">
      Print / Save as PDF
    </button>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Get list of generated PDFs for a user
 */
export async function getUserLogbookPdfs(
  userId: string
): Promise<Array<{ name: string; url: string; created_at: string }>> {
  try {
    const { data, error } = await supabase.storage
      .from('logbook-pdfs')
      .list(`${userId}`, {
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (error) throw error;

    return (data || []).map(file => {
      const { data: urlData } = supabase.storage
        .from('logbook-pdfs')
        .getPublicUrl(`${userId}/${file.name}`);
      
      return {
        name: file.name,
        url: urlData.publicUrl,
        created_at: file.created_at || '',
      };
    });
  } catch (error) {
    console.error('Get user logbook PDFs error:', error);
    return [];
  }
}

export default {
  generateWeeklyLogbookPdf,
  getUserLogbookPdfs,
};
