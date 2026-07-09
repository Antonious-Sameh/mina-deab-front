import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Star, Plus, Minus, Loader2, Trophy } from 'lucide-react'; // ضفنا Trophy
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { studentAPI } from '@/api/services';

export default function StudentPointsPage() {
  const [balance,      setBalance]      = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [pointRank,    setPointRank]    = useState(null); // { rank, outOf }

  useEffect(() => {
    studentAPI.points()
      .then(d => { 
        setBalance(d.balance || 0); 
        setTransactions(d.transactions || []); 
        // قراءة الترتيب لو الباك إيند باعتها
        if (d.rank !== undefined) {
          setPointRank({ rank: d.rank, outOf: d.outOf });
        }
      })
      .catch(() => {
        // الـ Fallback القديم بتاعك لو السيرفر وقع
        setBalance(150);
        setTransactions([
          { _id:'1', type:'add',    amount:100, reason:'تميّز في الواجب',       createdAt: new Date().toISOString() },
          { _id:'2', type:'add',    amount:50,  reason:'حضور منتظم',            createdAt: new Date().toISOString() },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Helmet><title>نقاطي | منصة الطالب</title></Helmet>
      <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
        <h2 className="text-2xl font-extrabold">نقاطي</h2>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* كارت الرصيد والترتيب المطور */}
            <Card className="border-2 border-primary/20 text-center">
              <CardContent className="p-8">
                <Star className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                
                {pointRank?.rank ? (
                  <>
                    <p className="text-sm font-semibold text-muted-foreground mb-1">ترتيبك</p>
                    <p className="text-5xl font-black text-primary">#{pointRank.rank}</p>
                    <p className="text-muted-foreground text-sm mt-1">من {pointRank.outOf} طالب</p>
                    
                    <div className="border-t mt-4 pt-4">
                      <p className="text-xs text-muted-foreground">عدد نقاطك</p>
                      <p className="text-3xl font-black text-primary mt-0.5">{balance}</p>
                      <p className="text-xs text-muted-foreground">نقطة</p>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-6xl font-black text-primary">{balance}</p>
                    <p className="text-muted-foreground mt-2">نقطة إجمالية</p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* سجل المعاملات (موجود وسليم بنسبة 100%) */}
            {transactions.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-bold text-lg">سجل المعاملات</h3>
                {transactions.map(t => (
                  <Card key={t._id} className="border shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${t.type === 'add' ? 'bg-green-100' : 'bg-red-100'}`}>
                        {t.type === 'add' ? <Plus className="h-5 w-5 text-green-600" /> : <Minus className="h-5 w-5 text-red-600" />}
                      </div>
                      
                      <div className="flex-1">
                        <p className="font-medium text-sm">{t.reason || 'بدون سبب مذكر'}</p>
                        <p className="text-xs text-muted-foreground">{new Date(t.createdAt).toLocaleDateString('ar-EG')}</p>
                      </div>
                      
                      <span className={`font-black text-lg ${t.type === 'add' ? 'text-green-600' : 'text-red-600'}`}>
                        {t.type === 'add' ? '+' : '-'}{t.amount}
                      </span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}