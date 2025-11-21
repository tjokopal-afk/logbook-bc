# ====================================
# LOGBOOK APP - FORCE REFRESH SCRIPT
# ====================================
# Script untuk memastikan perubahan dashboard terlihat
# dengan membersihkan semua cache dan restart server

Write-Host "🔄 LOGBOOK APP - FORCE REFRESH" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Kill all Node processes
Write-Host "⚡ Step 1: Stopping all Node.js processes..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 1
Write-Host "✅ Node processes stopped" -ForegroundColor Green
Write-Host ""

# Step 2: Clear Vite cache
Write-Host "🧹 Step 2: Clearing Vite cache..." -ForegroundColor Yellow
if (Test-Path "node_modules/.vite") {
    Remove-Item -Recurse -Force "node_modules/.vite"
    Write-Host "✅ Vite cache cleared" -ForegroundColor Green
} else {
    Write-Host "ℹ️  No Vite cache found" -ForegroundColor Gray
}
Write-Host ""

# Step 3: Clear dist folder
Write-Host "🗑️  Step 3: Clearing dist folder..." -ForegroundColor Yellow
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
    Write-Host "✅ Dist folder cleared" -ForegroundColor Green
} else {
    Write-Host "ℹ️  No dist folder found" -ForegroundColor Gray
}
Write-Host ""

# Step 4: Show changes summary
Write-Host "📋 CHANGES IMPLEMENTED:" -ForegroundColor Magenta
Write-Host "================================" -ForegroundColor Magenta
Write-Host ""
Write-Host "✅ INTERN DASHBOARD:" -ForegroundColor White
Write-Host "   - Removed 'Compiled' card" -ForegroundColor Gray
Write-Host "   - 5 cards total (was 6)" -ForegroundColor Gray
Write-Host "   - 'Submitted' → 'Under Review'" -ForegroundColor Gray
Write-Host ""
Write-Host "✅ MENTOR DASHBOARD:" -ForegroundColor White
Write-Host "   - Added 'Approved' card" -ForegroundColor Gray
Write-Host "   - 3 cards total (was 2)" -ForegroundColor Gray
Write-Host "   - 'Logbook Pending' → 'Pending Review'" -ForegroundColor Gray
Write-Host ""
Write-Host "✅ LOGBOOK WEEKLY:" -ForegroundColor White
Write-Host "   - Fixed status badge (approved/rejected)" -ForegroundColor Gray
Write-Host "   - Status sync with actual data" -ForegroundColor Gray
Write-Host ""
Write-Host "================================" -ForegroundColor Magenta
Write-Host ""

# Step 5: Start dev server
Write-Host "🚀 Step 5: Starting development server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Cyan
Write-Host ""

# Run npm dev
npm run dev

# Note: Server will continue running until Ctrl+C
