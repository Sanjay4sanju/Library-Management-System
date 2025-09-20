export const USER_TYPES = {
  STUDENT: 'student',
  LIBRARIAN: 'librarian',
  ADMIN: 'admin',
};

export const BOOK_GENRES = {
  FICTION: 'fiction',
  NON_FICTION: 'non-fiction',
  SCIENCE: 'science',
  TECHNOLOGY: 'technology',
  HISTORY: 'history',
  BIOGRAPHY: 'biography',
  FANTASY: 'fantasy',
  MYSTERY: 'mystery',
  ROMANCE: 'romance',
  THRILLER: 'thriller',
};

export const RESERVATION_STATUS = {
  PENDING: 'pending',
  FULFILLED: 'fulfilled',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
};

export const NOTIFICATION_TYPES = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  SUCCESS: 'success',
};

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login/',
    REGISTER: '/auth/register/',
    PROFILE: '/auth/profile/',
    CHANGE_PASSWORD: '/auth/change-password/',
  },
  BOOKS: '/books/',
  BORROW_RECORDS: '/borrow-records/',
  RESERVATIONS: '/reservations/',
  FINES: '/fines/',
  NOTIFICATIONS: '/notifications/',
  REPORTS: {
    DASHBOARD_STATS: '/reports/dashboard-stats/',
    POPULAR_BOOKS: '/reports/popular-books/',
    READING_HISTORY: '/reports/reading-history/',
    BORROWING_TRENDS: '/reports/borrowing-trends/',
    USER_ACTIVITY: '/reports/user-activity/',
    PERSONAL_STATS: '/reports/personal-stats/',
  },
};

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  BOOKS: '/books',
  PROFILE: '/profile',
  DASHBOARD: '/dashboard',
  TRANSACTIONS: '/transactions',
  REPORTS: '/reports',
};

export const VALIDATION = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL_CHAR: true,
  },
  ISBN: {
    LENGTH_10: 10,
    LENGTH_13: 13,
  },
};

export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  API: 'yyyy-MM-dd',
  DATETIME: 'MMM dd, yyyy HH:mm',
};