// =========================================
// ROLE CONFIGURATION & PERMISSIONS
// =========================================

export const ROLES = {
  INTERN: 'intern',           // Peserta magang
  MENTOR: 'mentor',           // Pembimbing (bisa review & rate)
  SUPERUSER: 'superuser',     // Super admin (full access)
  ADMIN: 'admin'              // Admin biasa
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

// Hierarki permission (dari rendah ke tinggi)
// intern < mentor < admin < superuser

export const PERMISSIONS = {
  // INTERN - Hanya akses data sendiri
  [ROLES.INTERN]: {
    // Logbook
    canCreateLogbook: true,
    canViewOwnLogbook: true,
    canEditOwnLogbook: true,     // hanya jika belum di-review
    canDeleteOwnLogbook: false,  // tidak bisa hapus
    canViewOthersLogbook: false,
    
    // Projects
    canViewAssignedProjects: true,
    canCreateProjects: false,
    canManageProjects: false,
    
    // Tasks
    canViewAssignedTasks: true,
    canUpdateTaskProgress: true,  // update project_weight
    canCreateTasks: false,
    
    // Reviews
    canViewReviews: true,         // hanya review untuk entry sendiri
    canCreateReviews: false,
    
    // Users
    canViewOthersProfile: false,
    canManageUsers: false,
  },
  
  // MENTOR - Akses project yang dia ikuti
  [ROLES.MENTOR]: {
    // Logbook
    canCreateLogbook: true,
    canViewOwnLogbook: true,
    canEditOwnLogbook: true,
    canViewOthersLogbook: true,   // hanya intern dalam project nya
    
    // Projects
    canViewAssignedProjects: true,
    canViewProjectDetails: true,  // lihat semua entry dalam project
    canCreateProjects: false,     // tergantung role_in_project
    canManageProjects: false,
    
    // Tasks
    canViewAllTasks: true,        // dalam project nya
    canCreateTasks: true,         // untuk project nya
    canAssignTasks: true,
    canUpdateTasks: true,
    
    // Reviews
    canViewReviews: true,
    canCreateReviews: true,       // rate logbook intern
    canEditOwnReviews: true,
    canDeleteReviews: false,
    
    // Users
    canViewProjectMembers: true,
    canManageUsers: false,
  },
  
  // ADMIN - Kelola users & projects
  [ROLES.ADMIN]: {
    // Logbook
    canCreateLogbook: true,
    canViewAllLogbook: true,
    canEditAnyLogbook: false,     // hanya superuser
    
    // Projects
    canViewAllProjects: true,
    canCreateProjects: true,
    canManageProjects: true,      // edit, delete
    canAssignParticipants: true,
    
    // Tasks
    canViewAllTasks: true,
    canCreateTasks: true,
    canManageTasks: true,
    
    // Reviews
    canViewAllReviews: true,
    canCreateReviews: true,
    canManageReviews: false,
    
    // Users
    canViewAllUsers: true,
    canCreateUsers: true,
    canEditUsers: true,
    canDeleteUsers: false,        // hanya superuser
    
    // Documents
    canUploadDocuments: true,
    canManageDocuments: true,
  },
  
  // SUPERUSER - God mode
  [ROLES.SUPERUSER]: {
    // Full access to everything
    canDoEverything: true,
    canViewAuditLog: true,
    canDeleteAnyData: true,
    canManageRoles: true,
  }
} as const;

export type Permission = typeof PERMISSIONS[Role];

// Menu configuration per role
export const ROLE_MENUS = {
  // INTERN MENU - Updated per UI/UX recommendations
  [ROLES.INTERN]: [
    {
      section: 'Utama',
      items: [
        { path: '/intern/dashboard', label: 'Dashboard', icon: 'Home' },
        { path: '/intern/laporan', label: 'Logbook', icon: 'FileText' },
      ]
    },
    {
      section: 'Proyek & Aktivitas',
      items: [
        { path: '/intern/status-dan-review', label: 'Status dan Review', icon: 'FileCheck' },
        { path: '/intern/project-saya', label: 'Proyek Saya', icon: 'Briefcase' },
      ]
    },
    {
      section: 'Performa',
      items: [
        { path: '/intern/timeline', label: 'Timeline', icon: 'Calendar' },
      ]
    }
  ],

  // MENTOR MENU
  [ROLES.MENTOR]: [
    {
      section: 'Utama',
      items: [
        { path: '/mentor/dashboard', label: 'Dashboard', icon: 'Home' },
      ]
    },
    {
      section: 'Pembimbingan',
      items: [
        { path: '/mentor/review-logbook', label: 'Review Logbook', icon: 'FileCheck', badge: 'pending' },
        { path: '/mentor/progress-intern', label: 'Penilaian', icon: 'TrendingUp' },
        { path: '/mentor/intern-saya', label: 'Intern Saya', icon: 'Users' },
      ]
    },
    {
      section: 'Manajemen Proyek',
      items: [
        { path: '/mentor/projects', label: 'Kelola Proyek', icon: 'Briefcase' },
      ]
    }
  ],

  // ADMIN MENU
  [ROLES.ADMIN]: [
    {
      section: 'Utama',
      items: [
        { path: '/admin/dashboard', label: 'Dashboard', icon: 'Home' },
      ]
    },
    {
      section: 'Manajemen User',
      items: [
        { path: '/admin/kelola-user', label: 'Kelola User', icon: 'Users' },
        { path: '/admin/data-intern', label: 'Data Intern', icon: 'GraduationCap' },
      ]
    },
    {
      section: 'Manajemen Grup & Proyek',
      items: [
        { path: '/admin/kelola-project', label: 'Kelola Proyek', icon: 'Settings' },
        { path: '/admin/divisi-user', label: 'Kelola Departement', icon: 'Building2' },
        { path: '/admin/manajemen-batch', label: 'Kelola Batch', icon: 'Combine' },
      ]
    },
    {
      section: 'Monitoring',
      items: [
        { path: '/admin/monitoring', label: 'Monitoring', icon: 'Eye' },
      ]
    }
  ],

  // SUPERUSER MENU - Enhanced God Mode
  [ROLES.SUPERUSER]: [
    {
      section: 'Utama',
      items: [
        { path: '/super/dashboard', label: 'Super Dashboard', icon: 'LayoutDashboard' },
      ]
    },
    {
      section: 'Monitoring',
      items: [
        { path: '/super/all-users', label: 'Semua User', icon: 'Users' },
        { path: '/super/projects', label: 'Semua Proyek', icon: 'Briefcase' },
        { path: '/super/all-logbooks', label: 'Semua Logbook', icon: 'BookOpen' },
        { path: '/super/all-reviews', label: 'Semua Review', icon: 'Star' },
      ]
    }
  ],
} as const;

// Helper function to check if user has permission
export const hasPermission = (role: Role, permission: keyof Permission): boolean => {
  const rolePermissions = PERMISSIONS[role];
  
  // Superuser has all permissions
  if (role === ROLES.SUPERUSER) {
    return true;
  }
  
  return rolePermissions[permission] === true;
};

// Helper function to get role hierarchy level
export const getRoleLevel = (role: Role): number => {
  const levels = {
    [ROLES.INTERN]: 1,
    [ROLES.MENTOR]: 2,
    [ROLES.ADMIN]: 3,
    [ROLES.SUPERUSER]: 4,
  };
  return levels[role] || 0;
};

// Check if role1 has higher or equal level than role2
export const hasRoleLevel = (role1: Role, role2: Role): boolean => {
  return getRoleLevel(role1) >= getRoleLevel(role2);
};

// Get default redirect path based on role
export const getDefaultPath = (role: Role): string => {
  const paths = {
    [ROLES.INTERN]: '/intern/dashboard',
    [ROLES.MENTOR]: '/mentor/dashboard',
    [ROLES.ADMIN]: '/admin/dashboard',
    [ROLES.SUPERUSER]: '/super/dashboard',
  };
  return paths[role] || '/';
};
