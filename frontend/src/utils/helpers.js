/**
 * Format number to Indonesian Rupiah currency.
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date to Indonesian locale string.
 */
export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Format datetime with time.
 */
export function formatDateTime(dateStr) {
  return new Date(dateStr).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Map role to display label.
 */
export const ROLE_LABELS = {
  admin: 'Admin',
  seller: 'Seller',
  buyer: 'Buyer',
  driver: 'Driver',
};

import { HiOutlineShieldCheck, HiOutlineBuildingStorefront, HiOutlineShoppingBag, HiOutlineTruck } from 'react-icons/hi2';

/**
 * Map role to color config for badges/icons.
 */
export const ROLE_CONFIG = {
  admin: { color: 'purple', IconComponent: HiOutlineShieldCheck, icon: '🛡️', label: 'Admin', bgClass: 'bg-purple-50 text-purple-700' },
  seller: { color: 'amber', IconComponent: HiOutlineBuildingStorefront, icon: '🏪', label: 'Seller', bgClass: 'bg-amber-50 text-amber-700' },
  buyer: { color: 'emerald', IconComponent: HiOutlineShoppingBag, icon: '🛒', label: 'Buyer', bgClass: 'bg-emerald-50 text-emerald-700' },
  driver: { color: 'sky', IconComponent: HiOutlineTruck, icon: '🚚', label: 'Driver', bgClass: 'bg-sky-50 text-sky-700' },
};

/**
 * Resolves absolute URL for product image.
 */
export function getImageUrl(url) {
  if (!url) return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }
  // It's a relative path, prefix it with backend host
  const backendBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
  const host = backendBaseUrl.replace('/api', '') || 'http://localhost:5000';
  return `${host}${url}`;
}
