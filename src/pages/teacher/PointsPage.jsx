import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Helmet } from 'react-helmet';
import {
  Star, Plus, Minus, Loader2, Search, X, Save, Trophy,
  ChevronUp, ChevronDown, Users
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input }  from '@/components/ui/input';
import { Label }  from '@/components/ui/label';
import { Badge }  from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { pointsAPI, groupsAPI, studentsAPI } from '@/api/services';
import { toast } from 'sonner';

const ALL_GROUPS = '__all__';

const ACADEMIC_YEARS = [
  { value:'first-prep',  label:'الصف الأول الإعدادي'  },
  { value:'second-prep', label:'الصف الثاني الإعدادي' },
  { value:'third-prep',  label:'الصف الثالث الإعدادي' },
  { value:'first-sec',   label:'الصف الأول الثانوي'   },
  { value:'second-sec',  label:'الصف الثاني الثانوي'  },
  { value:'third-sec',   label:'الصف الثالث الثانوي'  },
];

// Arabic-aware normalize for search
const norm = (s = '') =>
  s.toLowerCase()
    .replace(/[أإآا]/g, 'ا')
    .replace(/[ةه]/g,   'ه')
    .replace(/[يى]/g,   'ي')
    .trim();

// ── Inline action popover per student ────────────────────────────────────────
function ActionPopover({ student, onDone }) {
  const [type,   setType]   = useState('add');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const n = Number(amount);
    if (!n || n < 1) { toast.error('أدخل عدد النقاط'); return; }
    setSaving(true);
    try {
      await pointsAPI.add({ studentId: student._id, type, amount: n, reason: reason.trim() || undefined });
      toast.success(`${type === 'add' ? '+ ' + n : '- ' + n} نقطة — ${student.name}`);
      onDone(student._id, type === 'add' ? n : -n);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'فشلت العملية');
    } finally { setSaving(false); }
  };

  return (
    <div className="absolute left-0 top-full mt-1 z-30 bg-card border rounded-xl shadow-xl p-3 w-56" onClick={e => e.stopPropagation()}>
      {/* Type toggle */}
      <div className="grid grid-cols-2 gap-1.5 mb-3">
        <button onClick={() => setType('add')}
          className={`rounded-lg py-1.5 text-xs font-bold border-2 transition-all ${type === 'add' ? 'border-green-500 bg-green-50 text-green-700' : 'border-border text-muted-foreground'}`}>
          + إضافة
        </button>
        <button onClick={() => setType('remove')}
          className={`rounded-lg py-1.5 text-xs font-bold border-2 transition-all ${type === 'remove' ? 'border-red-500 bg-red-50 text-red-700' : 'border-border text-muted-foreground'}`}>
          − خصم
        </button>
      </div>
      <Input
        type="number" min="1" value={amount}
        onChange={e => setAmount(e.target.value)}
        placeholder="عدد النقاط *"
        className="h-8 text-sm mb-2 text-center font-bold"
        autoFocus
        onKeyDown={e => e.key === 'Enter' && handleSave()}
      />
      <Input
        value={reason} onChange={e => setReason(e.target.value)}
        placeholder="السبب (اختياري)"
        className="h-8 text-xs mb-2"
        onKeyDown={e => e.key === 'Enter' && handleSave()}
      />
      <Button
        className={`w-full h-8 text-xs gap-1 ${type === 'remove' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
        onClick={handleSave} disabled={saving || !amount}
      >
        {saving ? <Loader2 className="h-3 w-3 animate-spin"/> : type === 'add' ? <Plus className="h-3 w-3"/> : <Minus className="h-3 w-3"/>}
        {saving ? 'جاري...' : type === 'add' ? 'إضافة' : 'خصم'}
      </Button>
    </div>
  );
}

// ── Leaderboard Row (memoized) ──────────────────────────────────────────────
// Extracted from the inline .map() so React.memo can stop unrelated rows from
// re-rendering every time the teacher opens/closes one student's action popover.
const PointsLeaderboardRow = memo(function PointsLeaderboardRow({ s, idx, sid, isActive, onToggleActive, onDone }) {
  const bal   = s.balance;
  const isTop = idx < 3 && bal > 0;

  return (
    <tr className={`hover:bg-muted/20 transition-colors ${
      idx===0&&bal>0 ? 'bg-yellow-50/40' :
      idx===1&&bal>0 ? 'bg-slate-50/30'  :
      idx===2&&bal>0 ? 'bg-orange-50/30'  : ''
    }`}>
      {/* Rank */}
      <td className="px-4 py-3 text-center">
        {isTop
          ? <span className="text-base">{idx===0?'🥇':idx===1?'🥈':'🥉'}</span>
          : <span className="text-xs text-muted-foreground font-bold">{idx+1}</span>}
      </td>

      {/* Name */}
      <td className="px-4 py-3 font-bold">{s.name}</td>

      {/* Code */}
      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{s.codePlain}</td>

      {/* Balance */}
      <td className="px-4 py-3 text-center">
        <span className={`text-lg font-black ${bal > 0 ? 'text-primary' : bal < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
          {bal > 0 ? '+' : ''}{bal}
        </span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center justify-center gap-1.5 relative">
          <button
            onClick={e => { e.stopPropagation(); onToggleActive(sid); }}
            className="flex items-center gap-1 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg px-3 py-1.5 text-xs font-bold transition-colors"
          >
            <Plus className="h-3.5 w-3.5"/>
            <Minus className="h-3.5 w-3.5"/>
            إدارة
          </button>

          {/* Popover */}
          {isActive && (
            <ActionPopover
              student={s}
              onDone={onDone}
            />
          )}
        </div>
      </td>
    </tr>
  );
});

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function PointsPage() {
  const [year,     setYear]     = useState('');
  const [groups,        setGroups]        = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [group,    setGroup]    = useState('');
  const [students, setStudents] = useState([]); // raw student list (of selected group)
  const [balances, setBalances] = useState({}); // studentId -> balance
  const [loading,  setLoading]  = useState(false);
  const [search,   setSearch]   = useState('');
  const [active,   setActive]   = useState(null); // studentId with open popover

  // Load groups when year changes
  useEffect(() => {
    if (!year) { setGroups([]); return; }
    setLoadingGroups(true);
    groupsAPI.getAll({ year, active: true })
      .then(d => setGroups(d.groups || []))
      .catch(() => toast.error('فشل تحميل المجموعات'))
      .finally(() => setLoadingGroups(false));
  }, [year]);

  // Load students of the selected group (or all groups) + their balances
  const load = useCallback(async () => {
    if (!group) return;
    setLoading(true);
    try {
      let list;
      if (group === ALL_GROUPS) {
        // كل المجموعات التابعة للمرحلة الدراسية — بنلف على كل الصفحات عشان
        // نتجاوز حد الـ backend الأقصى للصفحة الواحدة (100). الصفحة الأولى
        // بتحدد لنا العدد الكلي، وباقي الصفحات مستقلة عن بعضها فبتتجاب
        // بالتوازي بدل التتابع — نفس البيانات وبنفس الترتيب، بس أسرع بكتير.
        const first = await studentsAPI.getAll({ year, limit: 100, page: 1 });
        list = first.data || [];
        const totalPages = first.pagination?.pages || 1;

        if (totalPages > 1) {
          const rest = await Promise.all(
            Array.from({ length: totalPages - 1 }, (_, i) =>
              studentsAPI.getAll({ year, limit: 100, page: i + 2 })
            )
          );
          rest.forEach(r => { list = list.concat(r.data || []); });
        }
      } else {
        // طلاب المجموعة المختارة فقط (نفس فكرة صفحة الحضور)
        const gData = await groupsAPI.getStudents(group);
        list = gData.students || [];
      }

      // Get balances from points leaderboard
      const pData = await pointsAPI.getLeaderboard({ year, limit: 500 });
      const bMap  = {};
      (pData.leaderboard || []).forEach(r => {
        const id = r._id?._id?.toString() || r._id?.toString();
        if (id) bMap[id] = r.balance || 0;
      });

      setStudents(list);
      setBalances(bMap);
    } catch { toast.error('فشل تحميل البيانات'); }
    finally { setLoading(false); }
  }, [group, year]);

  useEffect(() => { load(); }, [load]);

  const handleYearChange = (val) => {
    setYear(val);
    setGroup('');
    setStudents([]);
    setBalances({});
    setSearch('');
  };

  const handleGroupChange = (val) => {
    setGroup(val);
    setSearch('');
  };

  // Close popover on outside click
  useEffect(() => {
    const handler = () => setActive(null);
    if (active) document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [active]);

  // Update balance after action — no reload needed
  const handlePointDone = useCallback((studentId, delta) => {
    setBalances(prev => ({ ...prev, [studentId]: (prev[studentId] || 0) + delta }));
    setActive(null);
  }, []);

  const onToggleActive = useCallback((sid) => {
    setActive(prev => (prev === sid ? null : sid));
  }, []);

  // Filter by search
  const filtered = useMemo(() => {
    const q = norm(search);
    const withBalance = students.map(s => ({
      ...s,
      balance: balances[s._id?.toString()] ?? 0,
    }));
    // Sort: highest balance first
    withBalance.sort((a, b) => b.balance - a.balance);
    if (!q) return withBalance;
    return withBalance.filter(s =>
      norm(s.name).includes(q) || (s.codePlain || '').includes(search.trim())
    );
  }, [students, balances, search]);

  const totalPoints  = Object.values(balances).reduce((s, b) => s + (b > 0 ? b : 0), 0);
  const withPoints   = filtered.filter(s => s.balance > 0).length;

  return (
    <>
      <Helmet><title>النقاط | نظام المعلم</title></Helmet>
      <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5">

        {/* Header */}
        <div className="bg-card border rounded-2xl p-5 shadow-sm flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-extrabold">النقاط</h2>
            <p className="text-muted-foreground text-sm mt-0.5">
              {group && !loading
                ? `${filtered.length} طالب — ${withPoints} لديهم نقاط — إجمالي: ${totalPoints} نقطة`
                : 'اختر المرحلة الدراسية ثم المجموعة'}
            </p>
          </div>
          {group && !loading && totalPoints > 0 && (
            <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2">
              <Trophy className="h-5 w-5 text-yellow-500"/>
              <span className="text-sm font-bold text-yellow-700">{totalPoints} نقطة إجمالي</span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Select value={year} onValueChange={handleYearChange}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="اختر المرحلة الدراسية..."/>
            </SelectTrigger>
            <SelectContent>
              {ACADEMIC_YEARS.map(y => <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={group} onValueChange={handleGroupChange} disabled={!year || loadingGroups}>
            <SelectTrigger className="h-11 disabled:opacity-50">
              <SelectValue placeholder={loadingGroups ? 'جاري التحميل...' : 'اختر المجموعة...'}/>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_GROUPS}>كل المجموعات</SelectItem>
              {groups.map(g => <SelectItem key={g._id} value={g._id}>{g.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {group && students.length > 0 && (
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"/>
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ابحث بالاسم أو الكود..."
              className="h-11 pr-9 pl-8"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4"/>
              </button>
            )}
          </div>
        )}

        {/* Empty states */}
        {!year && (
          <div className="text-center py-16 bg-card border rounded-2xl border-dashed">
            <Star className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30"/>
            <p className="text-muted-foreground font-medium">اختر المرحلة الدراسية لإدارة نقاط الطلاب</p>
          </div>
        )}

        {year && !group && !loadingGroups && (
          <div className="text-center py-16 bg-card border rounded-2xl border-dashed">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30"/>
            <p className="text-muted-foreground font-medium">اختر المجموعة لعرض طلابها</p>
          </div>
        )}

        {loading && <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>}

        {/* Students table */}
        {!loading && filtered.length > 0 && (
          <Card className="border shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-muted/30 border-b flex items-center gap-2">
              <ChevronDown className="h-4 w-4 text-muted-foreground"/>
              <span className="text-sm font-semibold text-muted-foreground">مرتب من الأعلى نقاطاً إلى الأقل</span>
              <Badge variant="secondary" className="mr-auto">{filtered.length} طالب</Badge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="bg-muted/20 text-muted-foreground text-xs">
                  <tr>
                    <th className="px-4 py-3 w-10">#</th>
                    <th className="px-4 py-3">الطالب</th>
                    <th className="px-4 py-3">الكود</th>
                    <th className="px-4 py-3 text-center">النقاط الحالية</th>
                    <th className="px-4 py-3 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((s, idx) => {
                    const sid = s._id?.toString();
                    return (
                      <PointsLeaderboardRow
                        key={sid}
                        s={s}
                        idx={idx}
                        sid={sid}
                        isActive={active === sid}
                        onToggleActive={onToggleActive}
                        onDone={handlePointDone}
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {!loading && group && students.length > 0 && filtered.length === 0 && (
          <div className="text-center py-10 bg-card border rounded-2xl border-dashed">
            <Search className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-30"/>
            <p className="text-muted-foreground text-sm">لا توجد نتائج للبحث عن "{search}"</p>
          </div>
        )}

        {!loading && group && students.length === 0 && (
          <div className="text-center py-14 bg-card border rounded-2xl border-dashed">
            <Star className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-30"/>
            <p className="text-muted-foreground">{group === ALL_GROUPS ? 'لا يوجد طلاب في هذه المرحلة' : 'لا يوجد طلاب في هذه المجموعة'}</p>
          </div>
        )}
      </div>
    </>
  );
}