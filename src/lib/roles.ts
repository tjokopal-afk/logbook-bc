export type Role = 'intern' | 'mentor' | 'superuser' | 'admin';

export const ROLE_HIERARCHY: Record<Role, number> = {
  intern: 0,
  mentor: 1,
  superuser: 2,
  admin: 3,
};

export function canViewRole(viewer: Role, target: Role) {
  return ROLE_HIERARCHY[viewer] >= ROLE_HIERARCHY[target];
}

export default { ROLE_HIERARCHY, canViewRole };
