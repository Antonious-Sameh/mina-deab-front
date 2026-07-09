import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Trophy, Loader2, AlertCircle, Star, TrendingUp, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { studentAPI } from '@/api/services';
import { toast } from 'sonner';

export default function StudentRankingsPage() {
  const [rank,    setRank]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    studentAPI.rank()
      .then(d => setRank(d))
      .catch(() => {
        setError('فشل تحميل بيانات الترتيب');
        toast.error('فشل تحميل بيانات الترتيب');
      })
      .finally(() => setLoading(false));
  }, []);

  const getRankStyle = (r) => {
    if (!r) return { color:'text-muted-foreground', bg:'bg-muted/30', border:'' };
    if (r===1) return { color:'text-yellow-600', bg:'bg-yellow-50', border:'border-yellow-300' };
    if (r===2) return { color:'text-slate-500',  bg:'bg-slate-50',  border:'border-slate-300'  };
    if (r===3) return { color:'text-orange-600', bg:'bg-orange-50', border:'border-orange-300' };
    return { color:'text-primary', bg:'bg-primary/5', border:'border-primary/30' };
  };

  const style = getRankStyle(rank?.rank);
  const pct   = rank?.percentage || 0;
  const noData = !rank?.outOf || rank?.outOf === 0;

  return (
    <>
      <Helmet><title>ترتيبي | منصة الطالب</title></Helmet>
      <div className="p-4 sm:p-6 max-w-xl mx-auto space-y-5">
        <div className="bg-card border rounded-2xl p-5 shadow-sm">
          <h2 className="text-2xl font-extrabold">ترتيبي</h2>
          <p className="text-muted-foreground text-sm mt-0.5">ترتيبك في الامتحانات الإلكترونية بين زملائك</p>
        </div>

        {loading && <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>}

        {error && (
          <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive">
            <AlertCircle className="h-5 w-5 shrink-0"/><p>{error}</p>
          </div>
        )}

        {!loading && !error && (noData || rank?.rank === null) ? (
          <div className="text-center py-20 bg-card border rounded-2xl border-dashed">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-30"/>
            <h3 className="text-lg font-bold">لا يوجد ترتيب بعد</h3>
            <p className="text-muted-foreground text-sm mt-1">حل الامتحانات الإلكترونية لتظهر في الترتيب</p>
          </div>
        ) : !loading && !error && (
          <>
            {/* Rank card */}
            <Card className={`border-2 shadow-md text-center ${style.border}`}>
              <CardContent className={`p-8 rounded-xl ${style.bg}`}>
                <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
                  rank.rank===1?'bg-yellow-100':rank.rank===2?'bg-slate-100':rank.rank===3?'bg-orange-100':'bg-primary/10'}`}>
                  <Trophy className={`h-10 w-10 ${style.color}`}/>
                </div>
                <p className={`text-8xl font-black leading-none mb-2 ${style.color}`}>#{rank.rank}</p>
                <p className="text-muted-foreground text-sm">من أصل <span className="font-bold text-foreground">{rank.outOf}</span> طالب</p>
                {rank.rank <= 3 && (
                  <div className={`inline-block mt-3 px-4 py-1.5 rounded-full text-sm font-bold ${
                    rank.rank===1?'bg-yellow-100 text-yellow-700':rank.rank===2?'bg-slate-100 text-slate-600':'bg-orange-100 text-orange-700'
                  }`}>
                    {rank.rank===1?'🥇 المركز الأول':rank.rank===2?'🥈 المركز الثاني':'🥉 المركز الثالث'}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="border-0 shadow-sm bg-gradient-to-br from-primary/10 to-primary/5">
                <CardContent className="p-4 text-center">
                  <Star className="h-5 w-5 text-primary mx-auto mb-1"/>
                  <p className="text-xl font-black text-primary">{rank.totalScore||0}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">درجاتك</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-gradient-to-br from-muted/60 to-muted/20">
                <CardContent className="p-4 text-center">
                  <TrendingUp className="h-5 w-5 text-muted-foreground mx-auto mb-1"/>
                  <p className="text-xl font-black">{rank.totalMax||0}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">من درجات</p>
                </CardContent>
              </Card>
              <Card className={`border-0 shadow-sm bg-gradient-to-br ${pct>=70?'from-green-100 to-green-50':'from-orange-100 to-orange-50'}`}>
                <CardContent className="p-4 text-center">
                  <Users className={`h-5 w-5 mx-auto mb-1 ${pct>=70?'text-green-600':'text-orange-500'}`}/>
                  <p className={`text-xl font-black ${pct>=70?'text-green-600':'text-orange-600'}`}>{pct}%</p>
                  <p className="text-xs text-muted-foreground mt-0.5">نسبتك</p>
                </CardContent>
              </Card>
            </div>

            {/* Progress */}
            <Card className="border shadow-sm">
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">نسبتك الكلية</span>
                  <span className={`font-bold ${pct>=70?'text-green-600':pct>=50?'text-yellow-600':'text-red-500'}`}>{pct}%</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div className={`h-3 rounded-full transition-all duration-700 ${pct>=85?'bg-green-500':pct>=70?'bg-blue-500':pct>=50?'bg-yellow-500':'bg-red-400'}`} style={{width:`${pct}%`}}/>
                </div>
                <p className="text-xs text-muted-foreground">{rank.totalScore} من {rank.totalMax} درجة في الامتحانات الإلكترونية</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </>
  );
}