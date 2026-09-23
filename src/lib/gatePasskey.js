/**
 * lib/gatePasskey.js
 * "بصمة الصفحات المحمية" — مستقلة تمامًا عن lib/passkey.js (بصمة تسجيل
 * الدخول). نفس أسلوب الغلاف الهادئ حوالين @simplewebauthn/browser: أي فشل
 * هنا (المتصفح مش بيدعم، المستخدم لغى الطلب، إلخ) بيترجع كنتيجة هادئة
 * ({ ok:false, reason }) بدل ما يرمي استثناء — كلمة المرور العادية لازم
 * تفضل شغالة 100% مهما حصل هنا.
 */

import {
  browserSupportsWebAuthn,
  startRegistration,
  startAuthentication,
} from '@simplewebauthn/browser';
import { adminGatePasskeyAPI } from '@/api/services';

export function isGatePasskeySupported() {
  try {
    return browserSupportsWebAuthn();
  } catch {
    return false;
  }
}

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
 * تفعيل بصمة الصفحات المحمية على الجهاز الحالي — محتاج كلمة مرور الصفحات
 * المحمية الصحيحة (نفس اللي بيدخل بيها المدرس عادةً) كإثبات إنه هو اللي
 * بيسجّل، مش أي حد عنده جلسة مفتوحة بس.
 */
export async function registerGatePasskey(password) {
  if (!isGatePasskeySupported()) {
    return { ok: false, reason: 'unsupported', message: 'الجهاز أو المتصفح لا يدعم هذه الميزة' };
  }
  try {
    const { options } = await adminGatePasskeyAPI.registerOptions(password);
    const attestation  = await startRegistration({ optionsJSON: options });
    await adminGatePasskeyAPI.registerVerify(attestation);
    return { ok: true };
  } catch (err) {
    return toSoftFailure(err);
  }
}

/**
 * فتح صفحة محمية بالبصمة بدل كلمة المرور. يرجّع { ok: true, valid: boolean }
 * أو { ok: false, reason, message } عند أي فشل في عملية البصمة نفسها
 * (إلغاء، عدم دعم، إلخ) — منفصل عن valid:false اللي معناها البصمة اتحققت
 * لكن مش صحيحة/مش موجودة.
 */
export async function unlockWithGatePasskey() {
  if (!isGatePasskeySupported()) {
    return { ok: false, reason: 'unsupported', message: 'الجهاز أو المتصفح لا يدعم هذه الميزة' };
  }
  try {
    const { options } = await adminGatePasskeyAPI.unlockOptions();
    const assertion    = await startAuthentication({ optionsJSON: options });
    const { valid }    = await adminGatePasskeyAPI.unlockVerify(assertion);
    return { ok: true, valid: !!valid };
  } catch (err) {
    return toSoftFailure(err);
  }
}

/** إلغاء تفعيل بصمة الصفحات المحمية على الجهاز الحالي بس. */
export async function removeGatePasskey() {
  try {
    await adminGatePasskeyAPI.removeMine();
    return { ok: true };
  } catch (err) {
    return { ok: false, message: err?.response?.data?.message || 'تعذّر إلغاء التفعيل' };
  }
}

/** هل الجهاز الحالي عنده بصمة مفعّلة لفتح الصفحات المحمية؟ */
export async function getGatePasskeyStatus() {
  try {
    const { enabled } = await adminGatePasskeyAPI.status();
    return !!enabled;
  } catch {
    return false;
  }
}