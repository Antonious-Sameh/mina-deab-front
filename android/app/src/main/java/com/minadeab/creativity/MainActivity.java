package com.minadeab.creativity;

import android.os.Bundle;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    // ── حماية شاشة التطبيق: منع Screenshots وScreen Recording ────────────────
    // FLAG_SECURE علم على مستوى نظام أندرويد نفسه، بيتطبّق على "نافذة"
    // التطبيق بالكامل (الـ Window Surface) بغض النظر عن نوع المحتوى المعروض
    // جواها — فيديو YouTube (iframe) أو فيديو مباشر (<video>) أو أي حاجة
    // تانية، كله بيتغطى بنفس الحماية. ده مش تعديل في نظام الفيديو نفسه ولا
    // في أي كود ويب — مجرد إعداد على مستوى الـ Activity النيتف بتاعة أندرويد.
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        getWindow().setFlags(
            WindowManager.LayoutParams.FLAG_SECURE,
            WindowManager.LayoutParams.FLAG_SECURE
        );
        super.onCreate(savedInstanceState);
    }
}
