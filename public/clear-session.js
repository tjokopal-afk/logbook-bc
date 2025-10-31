// =========================================
// FORCE CLEAR ALL SESSIONS
// Run this in browser console if stuck
// =========================================

(function() {
  console.log('🧹 Force clearing all sessions...');
  
  // Clear all storage
  try {
    localStorage.clear();
    console.log('✅ localStorage cleared');
  } catch (e) {
    console.error('❌ localStorage clear failed:', e);
  }
  
  try {
    sessionStorage.clear();
    console.log('✅ sessionStorage cleared');
  } catch (e) {
    console.error('❌ sessionStorage clear failed:', e);
  }
  
  // Clear all cookies
  try {
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    console.log('✅ Cookies cleared');
  } catch (e) {
    console.error('❌ Cookie clear failed:', e);
  }
  
  // Clear IndexedDB
  try {
    indexedDB.databases().then(databases => {
      databases.forEach(db => {
        indexedDB.deleteDatabase(db.name);
      });
      console.log('✅ IndexedDB cleared');
    });
  } catch (e) {
    console.error('❌ IndexedDB clear failed:', e);
  }
  
  console.log('✅ All sessions cleared!');
  console.log('🔄 Reloading page...');
  
  // Force reload
  setTimeout(() => {
    window.location.href = '/';
  }, 500);
})();
