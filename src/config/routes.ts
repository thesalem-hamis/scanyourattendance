/**
 * Single source of truth for every URL in the app.
 * Never type a path string in a component, import it from here.
 */
export const ROUTES = {
  home: '/',
  login: '/login',
  register: '/register',
  passPattern: '/pass/:token',
  pass: (token: string) => `/pass/${encodeURIComponent(token)}`,
  usher: '/usher',
  unauthorized: '/unauthorized',
  admin: {
    root: '/admin',
    dashboard: '/admin/dashboard',
    members: '/admin/members',
    membersImport: '/admin/members/import',
    attendance: '/admin/attendance',
    followUp: '/admin/follow-up',
    settings: '/admin/settings',
  },
} as const;