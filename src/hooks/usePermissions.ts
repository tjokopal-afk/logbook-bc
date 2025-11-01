// =========================================
// PERMISSIONS HOOK
// =========================================

import { useAuth } from '@/context/AuthContext';
import { PERMISSIONS, hasRoleLevel, ROLES, type Role } from '@/utils/roleConfig';

export const usePermissions = () => {
  const { profile, role } = useAuth();

  // Get all permissions for current user's role
  const permissions = role ? PERMISSIONS[role] : null;

  // Check if user has a specific permission
  const can = (permission: string): boolean => {
    if (!role || !permissions) return false;
    // Superuser has all permissions
    if (role === ROLES.SUPERUSER) return true;
    // Check if permission exists in role's permissions
    return (permissions as any)[permission] === true;
  };

  // Check if user has role level equal or higher than specified role
  const hasRole = (requiredRole: Role): boolean => {
    if (!role) return false;
    return hasRoleLevel(role, requiredRole);
  };

  // Check if user is intern
  const isIntern = role === ROLES.INTERN;

  // Check if user is mentor
  const isMentor = role === ROLES.MENTOR;

  // Check if user is admin
  const isAdmin = role === ROLES.ADMIN;

  // Check if user is superuser
  const isSuperuser = role === ROLES.SUPERUSER;

  // Check if user is admin or superuser
  const isAdminOrAbove = role === ROLES.ADMIN || role === ROLES.SUPERUSER;

  // Check if user is mentor or above
  const isMentorOrAbove = 
    role === ROLES.MENTOR || 
    role === ROLES.ADMIN || 
    role === ROLES.SUPERUSER;

  return {
    permissions,
    role,
    profile,
    can,
    hasRole,
    isIntern,
    isMentor,
    isAdmin,
    isSuperuser,
    isAdminOrAbove,
    isMentorOrAbove
  };
};
