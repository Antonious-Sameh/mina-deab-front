/**
 * lib/passkey.js
 * غلاف حوالين @simplewebauthn/browser — الهدف إن أي فشل هنا (المتصفح مش
 * بيدعم، المستخدم لغى طلب البصمة، الجهاز مالوش بصمة/Face ID مفعّل، إلخ)
 * يترجع كنتيجة هادئة ({ ok:false, reason }) بدل ما يرمي استثناء يكسر
 * تجربة الدخول العادي. الدخول بالكود العادي لازم يفضل شغال 100% مهما حصل هنا.
 */

import {
  browserSupportsWebAuthn,
  startRegistration,
  startAuthentication,
} from '@simplewebauthn/browser';
import { passkeyAPI } from '@/api/services';

/** هل المتصفح/الجهاز الحالي بيدعم WebAuthn أصلاً؟ (مطلوب استدعاؤها قبل إظهار أي زرار بصمة) */
export function isPasskeySupported() {
  try {
    return browserSupportsWebAuthn();
  } catch {
    return false;
  }
}

// أسماء الأخطاء اللي بتبقى "المستخدم لغى الطلب أو مفيش بصمة متاحة" —
// مش أخطاء حقيقية، مجرد إن المستخدم غيّر رأيه أو مفيش hardware مناسب.
const BENIGN_ERROR_NAMES = new Set(['NotAllowedError', 'AbortError']);

function toSoftFailure(err) {
  const name = err?.name || '';
  if (BENIGN_ERROR_NAMES.has(name)) {
    return { ok: false, reason: 'cancelled', message: 'تم إلغاء العملية' };
  }
  if (name === 'InvalidStateError') {
    return { ok: false, reason: 'already-registered', message: 'البصمة مفعّلة بالفعل على هذا الجهاز' };
  }
  return {
    ok: false,
    reason: 'error',
    message: err?.response?.data?.message || 'تعذّر إتمام العملية، حاول مرة أخرى',
  };
}

/**
 * تفعيل الدخول بالبصمة على الجهاز الحالي.
 * يرجّع { ok: true } عند النجاح، أو { ok: false, reason, message } عند أي فشل —
 * أبداً مبيرميش استثناء للخارج.
 */
export async function registerPasskey() {
  if (!isPasskeySupported()) {
    return { ok: false, reason: 'unsupported', message: 'الجهاز أو المتصفح لا يدعم هذه الميزة' };
  }
  try {
    const { options } = await passkeyAPI.registerOptions();
    const attestation  = await startRegistration({ optionsJSON: options });
    await passkeyAPI.registerVerify(attestation);
    return { ok: true };
  } catch (err) {
    return toSoftFailure(err);
  }
}

/**
 * الدخول بالبصمة (بديل الكود العادي). يرجّع { ok: true, data } حيث data
 * بنفس شكل authAPI.login() بالظبط ({ accessToken, user }) — أو
 * { ok: false, reason, message } عند أي فشل.
 */
export async function loginWithPasskey() {
  if (!isPasskeySupported()) {
    return { ok: false, reason: 'unsupported', message: 'الجهاز أو المتصفح لا يدعم هذه الميزة' };
  }
  try {
    const { options } = await passkeyAPI.loginOptions();
    const assertion    = await startAuthentication({ optionsJSON: options });
    const data          = await passkeyAPI.loginVerify(assertion);
    return { ok: true, data };
  } catch (err) {
    return toSoftFailure(err);
  }
}

/** إلغاء تفعيل البصمة على الجهاز الحالي بس. */
export async function removePasskey() {
  try {
    await passkeyAPI.removeMine();
    return { ok: true };
  } catch (err) {
    return { ok: false, message: err?.response?.data?.message || 'تعذّر إلغاء التفعيل' };
  }
}

/** هل الجهاز الحالي عنده بصمة مفعّلة على الحساب الداخل بيه؟ */
export async function getPasskeyStatus() {
  try {
    const { enabled } = await passkeyAPI.status();
    return !!enabled;
  } catch {
    return false;
  }
}