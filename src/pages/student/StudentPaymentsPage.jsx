import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { CreditCard, CheckCircle, AlertCircle, Loader2, ArrowUpRight, Calendar, Receipt, Wallet, ArrowDownLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { studentAPI } from '@/api/services';

export default function StudentPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [summary,  setSummary]  = useState({});
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    studentAPI.payments()
      .then(d => { setPayments(d.payments||[]); setSummary(d.summary||{}); })
      .catch(() => {
        setPayments([{ _id:'1', month:'يونيو 2026', requiredAmount:1200, paidAmount:1200, installments:[{ _id:'i1', amount:600, paidAt:new Date(), note:null }, { _id:'i2', amount:600, paidAt:new Date(), note:null }] }]);
        setSummary({ totalRequired:1200, totalPaid:1200, totalRemaining:0, status:'مكتمل' });
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Helmet><title>مدفوعاتي | منصة الطالب</title></Helmet>
      
      <div className="min-h-screen bg-slate-50/50 dark:bg-zinc-950/50 p-4 sm:p-8 antialiased">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Header Section */}
          <div className="flex flex-col gap-2 border-b border-slate-200/60 dark:border-zinc-800/60 pb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl shadow-sm">
                <Wallet className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-zinc-50">السجل المالي للطلاب</h2>
                <p className="text-xs text-muted-foreground mt-0.5">تابع دفعاتك، الأقساط المسددة، والمتبقي عليك بكل سهولة</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <div className="relative flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary relative z-10" />
                <div className="absolute inset-0 h-10 w-10 bg-primary/10 rounded-full blur-md animate-pulse"></div>
              </div>
              <p className="text-sm font-medium text-muted-foreground tracking-wide">جاري تحميل البيانات المالية...</p>
            </div>
          ) : (
            <>
              {/* Summary Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Total Required */}
                <Card className="overflow-hidden border-none shadow-sm bg-gradient-to-br from-white to-slate-50 dark:from-zinc-900 dark:to-zinc-900/50 ring-1 ring-slate-200/50 dark:ring-zinc-800/50 transition-all duration-300 hover:shadow-md">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">المبلغ المطلوب</p>
                      <p className="text-3xl font-black text-slate-900 dark:text-zinc-50">
                        {summary.totalRequired||0} <span className="text-xs font-medium text-muted-foreground">ج.م</span>
                      </p>
                    </div>
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
                      <Receipt className="h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>

                {/* Total Paid */}
                <Card className="overflow-hidden border-none shadow-sm bg-gradient-to-br from-white to-slate-50 dark:from-zinc-900 dark:to-zinc-900/50 ring-1 ring-slate-200/50 dark:ring-zinc-800/50 transition-all duration-300 hover:shadow-md">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">إجمالي المدفوع</p>
                      <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                        {summary.totalPaid||0} <span className="text-xs font-medium text-muted-foreground">ج.م</span>
                      </p>
                    </div>
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
                      <ArrowUpRight className="h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>

                {/* Total Remaining */}
                <Card className="overflow-hidden border-none shadow-sm bg-gradient-to-br from-white to-slate-50 dark:from-zinc-900 dark:to-zinc-900/50 ring-1 ring-slate-200/50 dark:ring-zinc-800/50 transition-all duration-300 hover:shadow-md">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">المبلغ المتبقي</p>
                      <p className={`text-3xl font-black ${summary.totalRemaining>0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {summary.totalRemaining||0} <span className="text-xs font-medium text-muted-foreground">ج.م</span>
                      </p>
                    </div>
                    <div className={`p-3 rounded-xl ${summary.totalRemaining>0 ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400' : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'}`}>
                      <ArrowDownLeft className="h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Payments List Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">تفاصيل الدفعات الشهرية</h3>
                  <span className="text-xs bg-slate-100 dark:bg-zinc-800 px-2.5 py-1 rounded-full font-medium text-slate-600 dark:text-zinc-400">
                    {payments.length} {payments.length === 1 ? 'شهر' : 'شهور'}
                  </span>
                </div>

                {payments.length === 0 ? (
                  <div className="text-center py-20 bg-white dark:bg-zinc-900 border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl shadow-inner flex flex-col items-center justify-center p-6">
                    <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-full mb-4">
                      <CreditCard className="h-8 w-8 text-muted-foreground/60" />
                    </div>
                    <h4 className="text-base font-bold text-slate-800 dark:text-zinc-200">لا توجد سجلات مدفوعات</h4>
                    <p className="text-xs text-muted-foreground max-w-xs mt-1">حسابك المالي لا يحتوي على أي فواتير أو أقساط مسجلة حالياً.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-5">
                    {payments.map(p => {
                      const isFullyPaid = p.paidAmount >= p.requiredAmount;
                      return (
                        <div key={p._id} className="group relative bg-white dark:bg-zinc-900 border border-slate-200/70 dark:border-zinc-800/70 rounded-2xl shadow-sm transition-all duration-300 hover:shadow-md hover:border-slate-300 dark:hover:border-zinc-700 overflow-hidden">
                          
                          {/* Side Indicator Bar */}
                          <div className={`absolute top-0 right-0 bottom-0 w-1.5 ${isFullyPaid ? 'bg-emerald-500' : 'bg-rose-500'}`} />

                          <div className="p-5 sm:p-6 space-y-5">
                            {/* Card Top / Title Area */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl shrink-0 ${isFullyPaid ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-950/30 text-rose-500 dark:text-rose-400'}`}>
                                  {isFullyPaid ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                                </div>
                                <div>
                                  <span className="font-black text-lg text-slate-900 dark:text-zinc-50 tracking-tight">{p.month}</span>
                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                                    <Calendar className="h-3 w-3" />
                                    <span>فاتورة شهرية</span>
                                  </div>
                                </div>
                              </div>

                              {/* Amount Badge */}
                              <div className="flex items-baseline gap-1 bg-slate-50 dark:bg-zinc-800/40 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-zinc-800 self-start sm:self-center">
                                <span className={`text-base font-black ${isFullyPaid ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                  {p.paidAmount}
                                </span>
                                <span className="text-xs text-muted-foreground">/ {p.requiredAmount} ج.م</span>
                              </div>
                            </div>

                            {/* Installments Breakdown */}
                            {p.installments?.length > 0 && (
                              <div className="space-y-2.5">
                                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 px-1">الأقساط والعمليات المسجلة</div>
                                <div className="bg-slate-50/70 dark:bg-zinc-950/40 border border-slate-100 dark:border-zinc-900 rounded-xl divide-y divide-slate-100 dark:divide-zinc-900 overflow-hidden">
                                  {p.installments.map(inst => (
                                    <div key={inst._id} className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-zinc-900/50">
                                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400">
                                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                        <span>{new Date(inst.paidAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                      </div>
                                      <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400 tracking-tight">
                                        + {inst.amount} ج.م
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

        </div>
      </div>
    </>
  );
}