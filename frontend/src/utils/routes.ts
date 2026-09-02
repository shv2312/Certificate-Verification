/**
 * Application route constants.
 *
 * Centralizing route paths prevents typos and makes refactoring easy.
 * As new pages are added by the team, add their routes here.
 */

export const ROUTES = {
  HOME:        '/',
  COMPANY:     '/company',
  VERIFY_EMAIL:'/verify-email',
  PAYMENT:     '/payment',
  CANDIDATE:   '/candidate',
  CONFIRM:     '/confirm',
  VERIFICATION:'/verification',
  RESULT:      '/result',
  HELP:        '/help',
  STATUS:      '/status',
} as const;

export type AppRoute = typeof ROUTES[keyof typeof ROUTES];
