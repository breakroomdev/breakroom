/**
 * Breakroom's permission system. Roles are per-workspace rows in the
 * database (see schema.roles) carrying a JSON array of permission
 * keys, so new roles can be created without code changes. The four
 * defaults below are seeded for every new workspace and cover the
 * common cases from the spec; "isSystem" roles (owner) can't be
 * edited or deleted from the admin UI.
 *
 * IMPORTANT: permission checks must always be re-verified server-side
 * (see requirePermission in lib/auth/authorize.ts). Anything computed
 * here for the UI is a convenience, not a security boundary.
 */

export const PERMISSIONS = [
  "workspace.manage", // rename, logo, description, theme, auth settings
  "members.manage", // invite/remove members, change roles, disable accounts
  "roles.manage", // create/edit custom roles
  "posts.create",
  "posts.moderate", // pin/delete/edit any post, manage reports
  "comments.moderate",
  "polls.create",
  "polls.moderate",
  "schedule.view",
  "schedule.manage", // create/edit/delete shifts, positions, locations
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const ROLE_PRESETS: Record<string, { name: string; permissions: Permission[]; isSystem: boolean }> = {
  owner: {
    name: "Owner",
    permissions: [...PERMISSIONS],
    isSystem: true,
  },
  admin: {
    name: "Admin",
    permissions: [
      "workspace.manage",
      "members.manage",
      "roles.manage",
      "posts.create",
      "posts.moderate",
      "comments.moderate",
      "polls.create",
      "polls.moderate",
      "schedule.view",
      "schedule.manage",
    ],
    isSystem: false,
  },
  manager: {
    name: "Manager",
    permissions: ["posts.create", "polls.create", "schedule.view", "schedule.manage"],
    isSystem: false,
  },
  employee: {
    name: "Employee",
    permissions: ["posts.create", "polls.create", "schedule.view"],
    isSystem: false,
  },
};

export function roleHasPermission(rolePermissions: string[], permission: Permission): boolean {
  return rolePermissions.includes(permission);
}
