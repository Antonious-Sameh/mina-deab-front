/**
 * deviceId.js
 * توليد وحفظ مُعرّف ثابت للجهاز/المتصفح، مستخدم لربط حساب الطالب بجهاز واحد.
 *
 * ملاحظة مهمة: مفيش API في المتصفح بيدي "هوية جهاز" حقيقية — أقرب حاجة عملية
 * ومستقرة هي UUID بنولّده مرة واحدة ونخزّنه في localStorage. طول ما المستخدم
 * مغيرش المتصفح أو عمل مسح لبيانات الموقع أو فورمات للجهاز، القيمة دي بتفضل
 * ثابتة. لو حصل أي من دول، هيتولد UUID جديد — وده بالظبط السلوك المطلوب
 * (جهاز/متصفح جديد لازم يحتاج Reset من المدرس).
 */

import { safeLocalStorage } from '@/lib/safe-storage';

const DEVICE_ID_KEY = 'khatwa_device_id';

function generateUUID() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback لمتصفحات قديمة جداً مش داعمة crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getDeviceId() {
  let id = safeLocalStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = generateUUID();
    safeLocalStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}