import { AppOwnerGatewayConfig, RestaurantTenant, SubscriptionPayment, PlanDetails, RestaurantInfo, AppPlatformBranding } from '../types';
import { defaultAppOwnerGatewayConfig, defaultPackages, initialTenants, initialSubscriptionPayments, initialRestaurantInfo, initialPlatformBranding } from '../initialData';

const GATEWAY_CONFIG_KEY = 'smarthost_appowner_gateway_config';
const TENANTS_STORAGE_KEY = 'smarthost_tenants_registry';
const PAYMENTS_STORAGE_KEY = 'smarthost_payment_history_logs';
const PACKAGES_STORAGE_KEY = 'smarthost_plans_catalog';
const BRANDING_STORAGE_KEY = 'restaurant_cached_info';
const PLATFORM_BRANDING_STORAGE_KEY = 'smarthost_platform_branding_config';

export function getAppPlatformBranding(): AppPlatformBranding {
  try {
    const saved = localStorage.getItem(PLATFORM_BRANDING_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.appName === 'SmartHost QR Suite' || !parsed.appName) {
        parsed.appName = 'QR Seating Restaurant Manager';
      }
      return { ...initialPlatformBranding, ...parsed };
    }
  } catch (err) {
    console.error('Failed to load platform branding config:', err);
  }
  return initialPlatformBranding;
}

export function saveAppPlatformBranding(branding: AppPlatformBranding): void {
  try {
    localStorage.setItem(PLATFORM_BRANDING_STORAGE_KEY, JSON.stringify(branding));
    window.dispatchEvent(new CustomEvent('smarthost:platform_branding_updated', { detail: branding }));
  } catch (err) {
    console.error('Failed to save platform branding config:', err);
  }
}

export function getAppBrandingConfig(): RestaurantInfo {
  try {
    const saved = localStorage.getItem(BRANDING_STORAGE_KEY);
    if (saved) {
      return { ...initialRestaurantInfo, ...JSON.parse(saved) };
    }
  } catch (err) {
    console.error('Failed to load venue branding config:', err);
  }
  return initialRestaurantInfo;
}

export function saveAppBrandingConfig(branding: RestaurantInfo): void {
  try {
    localStorage.setItem(BRANDING_STORAGE_KEY, JSON.stringify(branding));
    window.dispatchEvent(new CustomEvent('smarthost:branding_updated', { detail: branding }));
  } catch (err) {
    console.error('Failed to save venue branding config:', err);
  }
}

// Aliases for clear semantic naming
export const getCustomerPortalBranding = getAppBrandingConfig;
export const saveCustomerPortalBranding = saveAppBrandingConfig;

export function getAppOwnerGatewayConfig(): AppOwnerGatewayConfig {
  try {
    const saved = localStorage.getItem(GATEWAY_CONFIG_KEY);
    if (saved) {
      return { ...defaultAppOwnerGatewayConfig, ...JSON.parse(saved) };
    }
  } catch (err) {
    console.error('Failed to load gateway config:', err);
  }
  return defaultAppOwnerGatewayConfig;
}

export function saveAppOwnerGatewayConfig(config: AppOwnerGatewayConfig): void {
  try {
    localStorage.setItem(GATEWAY_CONFIG_KEY, JSON.stringify(config));
    // Also dispatch a window event so all active components can update immediately
    window.dispatchEvent(new CustomEvent('smarthost:gateway_updated', { detail: config }));
  } catch (err) {
    console.error('Failed to save gateway config:', err);
  }
}

export function getRestaurantTenants(): RestaurantTenant[] {
  try {
    const saved = localStorage.getItem(TENANTS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load restaurant tenants:', err);
  }
  return initialTenants;
}

export function saveRestaurantTenants(tenants: RestaurantTenant[]): void {
  try {
    localStorage.setItem(TENANTS_STORAGE_KEY, JSON.stringify(tenants));
    window.dispatchEvent(new CustomEvent('smarthost:tenants_updated', { detail: tenants }));
  } catch (err) {
    console.error('Failed to save restaurant tenants:', err);
  }
}

export function getSubscriptionPayments(): SubscriptionPayment[] {
  try {
    const saved = localStorage.getItem(PAYMENTS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load subscription payments:', err);
  }
  return initialSubscriptionPayments;
}

export function saveSubscriptionPayments(payments: SubscriptionPayment[]): void {
  try {
    localStorage.setItem(PAYMENTS_STORAGE_KEY, JSON.stringify(payments));
    window.dispatchEvent(new CustomEvent('smarthost:payments_updated', { detail: payments }));
  } catch (err) {
    console.error('Failed to save subscription payments:', err);
  }
}

export function recordSubscriptionPayment(payment: SubscriptionPayment): void {
  try {
    const existing = getSubscriptionPayments();
    const updated = [payment, ...existing.filter(p => p.id !== payment.id)];
    saveSubscriptionPayments(updated);
  } catch (err) {
    console.error('Failed to record subscription payment:', err);
  }
}

export function getSaaSPackages(): PlanDetails[] {
  try {
    const saved = localStorage.getItem(PACKAGES_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load packages:', err);
  }
  return defaultPackages;
}

export function saveSaaSPackages(packages: PlanDetails[]): void {
  try {
    localStorage.setItem(PACKAGES_STORAGE_KEY, JSON.stringify(packages));
    window.dispatchEvent(new CustomEvent('smarthost:packages_updated', { detail: packages }));
  } catch (err) {
    console.error('Failed to save packages:', err);
  }
}
