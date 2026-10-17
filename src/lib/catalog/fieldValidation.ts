// Checkout input validation against a product's field schema. Shared by server and client.
import type { CheckoutField, QtyRule } from './types';

const MAX_VALUE_LENGTH = 100;
// Same blocked set as the legacy game account validator, plus control characters
const FORBIDDEN = /[\u0000-\u001f\u007f'";<>{}\\]/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^\+?[\d\s\-()]{5,20}$/;

export interface FieldValidationResult {
  ok: boolean;
  message?: string;
  /** Validated values keyed by provider param name. */
  params: Record<string, string>;
  /** Human-readable summary, stored as the order's target account. */
  summary: string;
}

export function validateOrderFields(input: Record<string, unknown> | undefined, schema: CheckoutField[]): FieldValidationResult {
  const params: Record<string, string> = {};
  const parts: string[] = [];
  const values = input && typeof input === 'object' ? input : {};

  for (const field of schema) {
    const raw = values[field.key];
    const value = typeof raw === 'string' ? raw.trim() : typeof raw === 'number' ? String(raw) : '';

    if (!value) {
      if (field.required) return { ok: false, message: `«${field.label}» نى كىرگۈزۈڭ`, params, summary: '' };
      continue;
    }
    const maxLength = Math.min(field.maxLength || MAX_VALUE_LENGTH, MAX_VALUE_LENGTH);
    if (value.length > maxLength) return { ok: false, message: `«${field.label}» بەك ئۇزۇن`, params, summary: '' };
    if (field.minLength && value.length < field.minLength) {
      return { ok: false, message: `«${field.label}» بەك قىسقا`, params, summary: '' };
    }
    if (FORBIDDEN.test(value)) {
      return { ok: false, message: `«${field.label}» دا چەكلەنگەن بەلگە بار`, params, summary: '' };
    }
    if (field.type === 'number' && !/^\d+$/.test(value)) {
      return { ok: false, message: `«${field.label}» پەقەت رەقەم بولۇشى كېرەك`, params, summary: '' };
    }
    if (field.type === 'email' && !EMAIL.test(value)) {
      return { ok: false, message: `«${field.label}» ئېلخەت فورماتى خاتا`, params, summary: '' };
    }
    if (field.type === 'tel' && !PHONE.test(value)) {
      return { ok: false, message: `«${field.label}» تېلېفون نومۇرى خاتا`, params, summary: '' };
    }
    if (field.type === 'select' && field.options && !field.options.includes(value)) {
      return { ok: false, message: `«${field.label}» تاللانمىسى خاتا`, params, summary: '' };
    }
    if (field.pattern) {
      let pattern: RegExp | null = null;
      try {
        pattern = new RegExp(`^(?:${field.pattern})$`);
      } catch {
        pattern = null; // a broken provider pattern shouldn't block checkout
      }
      if (pattern && !pattern.test(value)) {
        return { ok: false, message: `«${field.label}» فورماتى خاتا`, params, summary: '' };
      }
    }
    params[field.key] = value;
    parts.push(`${field.label}: ${value}`);
  }

  return { ok: true, params, summary: parts.join(' | ').slice(0, 300) };
}

export function validateQty(rawQty: unknown, rule: QtyRule | undefined): { ok: boolean; qty: number; message?: string } {
  if (!rule || rule.kind === 'fixed') return { ok: true, qty: 1 };
  const qty = Number(rawQty);
  if (!Number.isFinite(qty) || qty <= 0) return { ok: false, qty: 0, message: 'سانى خاتا' };
  // Listed quantities may be decimals (e.g. 23.07 balance units); ranges are whole units
  if (rule.kind === 'list') {
    const match = rule.values.find((v) => Math.abs(v - qty) < 1e-9);
    return match === undefined ? { ok: false, qty, message: 'بۇ سان تاللانمىلار ئىچىدە يوق' } : { ok: true, qty: match };
  }
  if (!Number.isInteger(qty)) return { ok: false, qty, message: 'سانى پۈتۈن سان بولۇشى كېرەك' };
  if (rule.kind === 'range') {
    if (qty < rule.min || qty > rule.max) return { ok: false, qty, message: `سان ${rule.min} بىلەن ${rule.max} ئارىسىدا بولۇشى كېرەك` };
    if ((qty - rule.min) % rule.step !== 0) return { ok: false, qty, message: `سان ${rule.step} نىڭ ھەسسىسى بولۇشى كېرەك` };
  }
  return { ok: true, qty };
}

export function minQty(rule: QtyRule | undefined): number {
  if (!rule || rule.kind === 'fixed') return 1;
  return rule.kind === 'list' ? rule.values[0] : rule.min;
}
