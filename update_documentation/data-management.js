import { supabase } from './config.js';
import { showToast, formatDate, convertToCSV, downloadFile, setupSidebar } from './utils.js';

// State
let currentUser = null;
let weeklyLogbooks = [];
let selectedWeek = null;

// DOM Elements
const weeklyLogbooksContainer = document.getElementById('weeklyLogbooksContainer');
const detailCard = document.getElementById('detailCard');
const detailWeekName = document.getElementById('detailWeekName');
const detailTableBody = document.getElementById('detailTableBody');
const closeDetailBtn = document.getElementById('closeDetailBtn');
const userNameSpan = document.getElementById('userName');
const logoutBtn = document.getElementById('logoutBtn');

// Initialize
async function init() {
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = 'auth.html';
        return;
    }
    
    currentUser = session.user;
    await loadUserProfile();
    await loadWeeklyLogbooks();
    
    setupSidebar();
    setupEventListeners();
}

// Load user profile
async function loadUserProfile() {
    const { data } = await supabase.auth.getUser();
    if (data.user?.user_metadata?.name) {
        userNameSpan.textContent = data.user.user_metadata.name;
    } else {
        userNameSpan.textContent = currentUser.email;
    }
}

// Setup event listeners
function setupEventListeners() {
    closeDetailBtn.addEventListener('click', () => {
        detailCard.classList.add('hidden');
        selectedWeek = null;
    });
    
    logoutBtn.addEventListener('click', handleLogout);
}

// Load weekly logbooks
async function loadWeeklyLogbooks() {
    weeklyLogbooksContainer.innerHTML = '<div class="loading-state"><p>Memuat data...</p></div>';
    
    try {
        const { data, error } = await supabase
            .from('logbook_entries')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('date', { ascending: true });
        
        if (error) throw error;
        
        // Group by weekly_logbook_name
        const weekMap = new Map();
        
        (data || []).forEach(entry => {
            try {
                const notesData = entry.notes ? JSON.parse(entry.notes) : {};
                const weekName = notesData.weekly_logbook_name;
                
                if (weekName) {
                    if (!weekMap.has(weekName)) {
                        weekMap.set(weekName, []);
                    }
                    weekMap.get(weekName).push(entry);
                }
            } catch (e) {
                // Skip invalid entries
            }
        });
        
        // Convert to array
        weeklyLogbooks = [];
        weekMap.forEach((entries, weekName) => {
            const dates = entries.map(e => new Date(e.date));
            const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
            const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
            
            weeklyLogbooks.push({
                name: weekName,
                startDate: formatDate(minDate.toISOString()),
                endDate: formatDate(maxDate.toISOString()),
                entriesCount: entries.length,
                entries: entries
            });
        });
        
        // Sort by most recent
        weeklyLogbooks.reverse();
        
        renderWeeklyLogbooks();
    } catch (error) {
        console.error('Error loading weekly logbooks:', error);
        showToast('Gagal memuat data', 'error');
        weeklyLogbooksContainer.innerHTML = '<div class="loading-state"><p>Gagal memuat data</p></div>';
    }
}

// Render weekly logbooks
function renderWeeklyLogbooks() {
    if (weeklyLogbooks.length === 0) {
        weeklyLogbooksContainer.innerHTML = '<div class="loading-state"><p>Belum ada data</p></div>';
        return;
    }
    
    weeklyLogbooksContainer.innerHTML = weeklyLogbooks.map(week => `
        <div class="logbook-item ${selectedWeek === week.name ? 'selected' : ''}">
            <div class="logbook-item-header">
                <p class="logbook-item-title">${escapeHtml(week.name)}</p>
                <p class="logbook-item-meta">${week.startDate} - ${week.endDate} (${week.entriesCount} entries)</p>
            </div>
            <div class="logbook-item-actions">
                <button class="btn btn-outline" onclick="window.viewDetail('${escapeHtml(week.name)}')">
                    <i data-lucide="eye" style="width: 14px; height: 14px; margin-right: 4px;"></i>
                    Detail
                </button>
                <button class="btn btn-primary" onclick="window.downloadWeekAsPDF('${escapeHtml(week.name)}')">
                    <i data-lucide="file-text" style="width: 14px; height: 14px; margin-right: 4px;"></i>
                    PDF
                </button>
                <button class="btn btn-outline" onclick="window.downloadWeek('${escapeHtml(week.name)}')">
                    <i data-lucide="download" style="width: 14px; height: 14px; margin-right: 4px;"></i>
                    HTML
                </button>
                <button class="btn btn-success" onclick="window.submitWeek('${escapeHtml(week.name)}')">
                    <i data-lucide="send" style="width: 14px; height: 14px; margin-right: 4px;"></i>
                    Submit
                </button>
                <button class="btn btn-danger" onclick="window.deleteWeek('${escapeHtml(week.name)}')">
                    <i data-lucide="trash-2" style="width: 14px; height: 14px; margin-right: 4px;"></i>
                    Hapus
                </button>
            </div>
        </div>
    `).join('');
    
    // Re-initialize Lucide icons for dynamically added buttons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// View detail
window.viewDetail = function(weekName) {
    const week = weeklyLogbooks.find(w => w.name === weekName);
    if (!week) return;
    
    selectedWeek = weekName;
    detailWeekName.textContent = weekName;
    
    detailTableBody.innerHTML = week.entries.map(entry => {
        let startTime = '-', endTime = '-', duration = '-', description = '-';
        
        try {
            const notesData = entry.notes ? JSON.parse(entry.notes) : {};
            startTime = notesData.start_time || '-';
            endTime = notesData.end_time || '-';
            duration = notesData.duration || '-';
            description = notesData.description || '-';
        } catch (e) {
            description = entry.notes || '-';
        }
        
        return `
            <tr>
                <td>${formatDate(entry.date)}</td>
                <td>${startTime}</td>
                <td>${endTime}</td>
                <td>${duration}</td>
                <td>${entry.activity}</td>
                <td style="font-size: 0.875rem;">${description}</td>
            </tr>
        `;
    }).join('');
    
    detailCard.classList.remove('hidden');
    renderWeeklyLogbooks();
};

// Generate timesheet HTML
async function generateTimesheetHTML(weekName) {
    const week = weeklyLogbooks.find(w => w.name === weekName);
    if (!week) return;
    
    try {
        // Get user profile data
        const { data: userData } = await supabase.auth.getUser();
        const metadata = userData.user?.user_metadata || {};
        
        // Load template
        const response = await fetch('timesheet_template.html');
        let templateHTML = await response.text();
        
        // Calculate period range
        const dates = week.entries.map(e => new Date(e.date));
        const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
        const periode = `${formatDate(minDate.toISOString())} - ${formatDate(maxDate.toISOString())}`;
        
        // Replace metadata tags
        templateHTML = templateHTML.replace(/\{\{nama\}\}/g, metadata.name || currentUser.email);
        templateHTML = templateHTML.replace(/\{\{departemen\}\}/g, metadata.department || '-');
        templateHTML = templateHTML.replace(/\{\{universitas\}\}/g, metadata.university || '-');
        templateHTML = templateHTML.replace(/\{\{minggu\}\}/g, weekName);
        templateHTML = templateHTML.replace(/\{\{periode\}\}/g, periode);
        templateHTML = templateHTML.replace(/\{\{disetujui_oleh\}\}/g, metadata.mentor_name || '-');
        templateHTML = templateHTML.replace(/\{\{id_disetujui\}\}/g, metadata.mentor_id || '-');
        templateHTML = templateHTML.replace(/\{\{dibuat_oleh\}\}/g, metadata.name || currentUser.email);
        templateHTML = templateHTML.replace(/\{\{id_dibuat\}\}/g, metadata.nim || '-');
        
        // Replace signature images dari URL
        const userSignatureHTML = metadata.signature_url 
            ? `<img src="${metadata.signature_url}" alt="User Signature" crossorigin="anonymous" style="display: block;" />`
            : '';
        templateHTML = templateHTML.replace(/\{\{user_signature\}\}/g, userSignatureHTML);
        
        // Mentor signature (kosong untuk sementara - bisa ditambahkan nanti)
        const mentorSignatureHTML = '';
        templateHTML = templateHTML.replace(/\{\{mentor_signature\}\}/g, mentorSignatureHTML);
        
        // Sort entries by date
        const sortedEntries = week.entries.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Generate dynamic table rows - only for entries that exist
        let tableRows = '';
        sortedEntries.forEach((entry, index) => {
            let notesData = {};
            try {
                notesData = entry.notes ? JSON.parse(entry.notes) : {};
            } catch (e) {
                notesData = { description: entry.notes };
            }
            
            // Format description to preserve line breaks and bullet points
            const description = (notesData.description || entry.activity || '-')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
            
            tableRows += `
        <tr>
          <td>${index + 1}</td>
          <td>${formatDate(entry.date)}</td>
          <td>${notesData.start_time || '-'}</td>
          <td>${notesData.end_time || '-'}</td>
          <td>${notesData.duration || '-'}</td>
          <td class="description-cell">${description}</td>
          <td class="paraf-cell"></td>
        </tr>`;
        });
        
        // Find and replace the tbody content in template
        const tbodyStart = templateHTML.indexOf('<tbody>');
        const tbodyEnd = templateHTML.indexOf('</tbody>');
        
        if (tbodyStart !== -1 && tbodyEnd !== -1) {
            const beforeTbody = templateHTML.substring(0, tbodyStart + 7); // +7 for "<tbody>"
            const afterTbody = templateHTML.substring(tbodyEnd);
            templateHTML = beforeTbody + tableRows + afterTbody;
        }
        
        return templateHTML;
    } catch (error) {
        console.error('Error generating timesheet:', error);
        throw error;
    }
}

// Download week as HTML file
window.downloadWeek = async function(weekName) {
    try {
        showToast('Menghasilkan timesheet HTML...', 'info');
        
        const templateHTML = await generateTimesheetHTML(weekName);
        
        // Download as HTML file
        const blob = new Blob([templateHTML], { type: 'text/html;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const safeFileName = weekName.replace(/[^a-z0-9]/gi, '_');
        a.download = `Timesheet_${safeFileName}_${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showToast('Timesheet HTML berhasil diunduh!', 'success');
    } catch (error) {
        console.error('Error downloading HTML:', error);
        showToast('Gagal menghasilkan timesheet', 'error');
    }
};

// Download week as PDF (No-Iframe Method - Clean & Reliable)
window.downloadWeekAsPDF = async function(weekName) {
    try {
        // Check if html2pdf is available
        if (typeof html2pdf === 'undefined') {
            showToast('Library PDF belum dimuat. Refresh halaman.', 'error');
            return;
        }
        
        showToast('Menyiapkan dokumen...', 'info');
        
        const templateHTML = await generateTimesheetHTML(weekName);
        
        // Create temporary container di main DOM (not iframe!)
        const tempContainer = document.createElement('div');
        tempContainer.id = 'pdf-temp-container';
        tempContainer.style.position = 'fixed';
        tempContainer.style.left = '-9999px';
        tempContainer.style.top = '0';
        tempContainer.style.width = '297mm';
        tempContainer.style.height = 'auto';
        tempContainer.style.zIndex = '-1000';
        tempContainer.style.overflow = 'visible';
        tempContainer.innerHTML = templateHTML;
        
        // Append to body untuk DOM rendering
        document.body.appendChild(tempContainer);
        
        // Get the document-container element
        const element = tempContainer.querySelector('.document-container');
        
        if (!element) {
            throw new Error('Document container tidak ditemukan');
        }
        
        // Wait for fonts and images to load
        showToast('Memuat font dan gambar...', 'info');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (document.fonts && document.fonts.ready) {
            await document.fonts.ready;
        }
        
        showToast('Mengonversi ke PDF...', 'info');
        
        // PDF options - optimized untuk A4 landscape single page
        const opt = {
            margin: 0,
            filename: `Timesheet_${weekName.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
            image: { 
                type: 'jpeg', 
                quality: 0.98 
            },
            html2canvas: { 
                scale: 1.5,  // Reduced scale untuk fit 1 page
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
        
        try {
            await html2pdf().set(opt).from(element).save();
            showToast('PDF berhasil diunduh!', 'success');
        } catch (pdfError) {
            console.error('PDF error:', pdfError);
            showToast('Gagal membuat PDF. Coba download HTML.', 'error');
        } finally {
            // Cleanup
            document.body.removeChild(tempContainer);
        }
    } catch (error) {
        console.error('Error generating PDF:', error);
        showToast('Gagal menghasilkan PDF', 'error');
    }
};

// Submit week
window.submitWeek = function(weekName) {
    showToast(`Submit "${weekName}" akan segera tersedia`, 'info');
};

// Delete week
window.deleteWeek = async function(weekName) {
    const week = weeklyLogbooks.find(w => w.name === weekName);
    if (!week) return;
    
    const entryCount = week.entries.length;
    
    if (!confirm(`⚠️ Hapus "${weekName}"?\n\n${entryCount} aktivitas akan dihapus permanen.\nTindakan ini tidak dapat dibatalkan!\n\nLanjutkan?`)) {
        return;
    }
    
    try {
        const idsToDelete = week.entries.map(e => e.id);
        
        const { error } = await supabase
            .from('logbook_entries')
            .delete()
            .in('id', idsToDelete);
        
        if (error) throw error;
        
        showToast(`Data "${weekName}" berhasil dihapus!`, 'success');
        
        if (selectedWeek === weekName) {
            detailCard.classList.add('hidden');
            selectedWeek = null;
        }
        
        await loadWeeklyLogbooks();
    } catch (error) {
        console.error('Error deleting week:', error);
        showToast('Gagal menghapus data', 'error');
    }
};

// Handle logout
async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (!error) {
        window.location.href = 'auth.html';
    }
}

// Start app
init();
