import React from "react";
import { Helmet } from "react-helmet";
import { MessageCircle, Phone, Youtube, Facebook, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const CONTACT_METHODS = [
  {
    id: "whatsapp",
    label: "واتساب",
    value: "01035148166",
    href: "https://wa.me/201035148166",
    icon: MessageCircle,
    accent: "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400",
  },
  {
    id: "phone",
    label: "اتصال هاتفي",
    value: "01221344631",
    href: "tel:+201221344631",
    icon: Phone,
    accent: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400",
  },
  {
    id: "youtube",
    label: "يوتيوب",
    value: "قناة الإبداع في الرياضيات",
    href: "https://youtube.com/channel/UCggCfYjV25vor3RPTmo1wZA?si=vNPtVsvdi0a0h704",
    icon: Youtube,
    accent: "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400",
    external: true,
  },
  {
    id: "facebook-page",
    label: "فيسبوك — الإبداع في الرياضيات",
    value: "صفحة المنصة الرسمية",
    href: "https://www.facebook.com/share/18wmAKMptj/",
    icon: Facebook,
    accent: "text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400",
    external: true,
  },
  {
    id: "facebook-teacher",
    label: "فيسبوك — أ/ مينا",
    value: "الحساب الشخصي",
    href: "https://www.facebook.com/share/1DE1zEN2tF/",
    icon: Facebook,
    accent: "text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400",
    external: true,
  },
];

export default function StudentContactPage() {
  return (
    <>
      <Helmet><title>تواصل مع المدرس - منصة الإبداع</title></Helmet>

      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-2">
            <MessageCircle className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">تواصل مع المدرس</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            اختر الوسيلة الأنسب ليك للتواصل معانا مباشرة
          </p>
        </div>

        {/* Contact Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {CONTACT_METHODS.map((c) => {
            const Icon = c.icon;
            return (
              <a
                key={c.id}
                href={c.href}
                target={c.external ? "_blank" : undefined}
                rel={c.external ? "noopener noreferrer" : undefined}
                className="group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl"
              >
                <Card className="border-border/60 hover:border-primary/40 hover:shadow-md active:scale-[0.98] transition-all duration-200 cursor-pointer h-full">
                  <CardContent className="p-4 sm:p-5 flex items-center gap-4">
                    <div className={`shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center ${c.accent}`}>
                      <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm sm:text-base truncate">{c.label}</p>
                      <p
                        className="text-muted-foreground text-xs sm:text-sm truncate"
                        dir={c.id === "whatsapp" || c.id === "phone" ? "ltr" : undefined}
                        style={c.id === "whatsapp" || c.id === "phone" ? { textAlign: "right" } : undefined}
                      >
                        {c.value}
                      </p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground/50 shrink-0 group-hover:text-primary transition-colors" />
                  </CardContent>
                </Card>
              </a>
            );
          })}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-muted-foreground/70 pt-2">
          احنا هنا لأي استفسار — تواصل معانا في أي وقت
        </p>
      </div>
    </>
  );
}