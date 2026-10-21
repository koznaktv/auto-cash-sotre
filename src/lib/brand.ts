export const BRAND_LOGO_URL = '/brand_logo.png?v=2.0.0';

/**
 * Ensures brand new luxury 3D squircle logo is always returned,
 * preventing stale or cached legacy circular logos from ever displaying.
 */
export function getBrandLogo(logo?: string | null): string {
  if (!logo || logo === '/logo.png' || logo.includes('logo.png') || logo === '/logo_backup.png') {
    return BRAND_LOGO_URL;
  }
  return logo;
}
