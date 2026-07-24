import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import {
  User, Camera, Trash2, KeyRound, Save, Loader2,
  AlertCircle, Eye, EyeOff, CheckCircle2, Phone, Edit, Lock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input }  from '@/components/ui/input';
import { Label }  from '@/components/ui/label';
import { Badge }  from '@/components/ui/badge';
import { accountAPI } from '@/api/services';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { toast } from 'sonner';

function Avatar({ user, onUpload, onRemove, uploading }) {
  const fileRef = useRef(null);
  const initials = user?.name?.split(' ').slice(0, 2).map(w => w[0]).join('') || '?';

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('الصورة يجب أن تكون أقل من 5 ميجا'); return; }
    onUpload(file);
    e.target.value = '';
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-5">
      <div className="relative shrink-0">
        <div className="w-24 h-24 rounded-2xl overflow-hidden bg-primary/10 flex items-center justify-center border-2 border-primary/20 shadow-md">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-black text-primary">{initials}</span>
          )}
        </div>
        {uploading && (
          <div className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 text-center sm:text-right">
        <p className="font-bold text-lg">{user?.name}</p>
        <p className="text-sm text-muted-foreground">{user?.role === 'teacher' ? 'معلم' : 'طالب'}</p>
        <div className="flex gap-2 justify-center sm:justify-start">
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => fileRef.current?.click()} disabled={uploading}>
            <Camera className="h-3.5 w-3.5" />
            {user?.avatar ? 'تغيير الصورة' : 'رفع صورة'}
          </Button>
          {user?.avatar && (
            <Button size="sm" variant="ghost" className="gap-1.5 text-destructive hover:text-destructive" onClick={onRemove} disabled={uploading}>
              <Trash2 className="h-3.5 w-3.5" />
              حذف
            </Button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
    </div>
  );
}

export default function AccountPage() {
  const { user: authUser, updateUser } = useAuth();
  const [profile,   setProfile]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);

  // Edit info
  const [editInfo,  setEditInfo]  = useState(false);
  const [name,      setName]      = useState('');
  const [phone,     setPhone]     = useState('');
  const [savingInfo,setSavingInfo]= useState(false);

  // Change code
  const [currentCode, setCurrentCode] = useState('');
  const [newCode,     setNewCode]     = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [savingCode,  setSavingCode]  = useState(false);

  // Admin pages password
  const [adminPassword,     setAdminPassword]     = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [savingAdminPassword, setSavingAdminPassword] = useState(false);
  const [loadingAdminPassword, setLoadingAdminPassword] = useState(true);

  const load = async () => {
    try {
      const d = await accountAPI.getMe();
      setProfile(d.user);
      setName(d.user.name);
      setPhone(d.user.phone || '');
    } catch {
      toast.error('فشل تحميل بيانات الحساب');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    accountAPI.getAdminPassword()
      .then(d => setAdminPassword(d.password || ''))
      .catch(() => {})
      .finally(() => setLoadingAdminPassword(false));
  }, []);

  const handleUpload = async (file) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const d = await accountAPI.uploadAvatar(fd);
      setProfile(p => ({ ...p, avatar: d.avatarUrl }));
      if (updateUser) updateUser({ avatar: d.avatarUrl });
      toast.success('تم رفع الصورة بنجاح');
    } catch { toast.error('فشل رفع الصورة'); }
    finally { setUploading(false); }
  };

  const handleRemoveAvatar = async () => {
    setUploading(true);
    try {
      await accountAPI.removeAvatar();
      setProfile(p => ({ ...p, avatar: null }));
      if (updateUser) updateUser({ avatar: null });
      toast.success('تم حذف الصورة');
    } catch { toast.error('فشل حذف الصورة'); }
    finally { setUploading(false); }
  };

  const handleSaveInfo = async () => {
    if (!name.trim() || name.trim().length < 2) { toast.error('الاسم يجب أن يكون حرفين على الأقل'); return; }
    setSavingInfo(true);
    try {
      const d = await accountAPI.updateInfo({ name: name.trim(), phone: phone.trim() || null });
      setProfile(p => ({ ...p, name: d.user.name, phone: d.user.phone }));
      if (updateUser) updateUser({ name: d.user.name });
      setEditInfo(false);
      toast.success('تم تحديث البيانات بنجاح');
    } catch (err) { toast.error(err?.response?.data?.message || 'فشل التحديث'); }
    finally { setSavingInfo(false); }
  };

  const handleChangeCode = async () => {
    if (!currentCode.trim() || !newCode.trim()) { toast.error('أدخل الكود الحالي والجديد'); return; }
    if (newCode.trim().length < 4) { toast.error('الكود الجديد يجب أن يكون 4 أحرف على الأقل'); return; }
    setSavingCode(true);
    try {
      const d = await accountAPI.changeCode({ currentCode: currentCode.trim(), newCode: newCode.trim() });
      toast.success(`تم تغيير الكود بنجاح — الكود الجديد: ${d.newCode}`);
      setCurrentCode(''); setNewCode('');
    } catch (err) { toast.error(err?.response?.data?.message || 'فشل تغيير الكود'); }
    finally { setSavingCode(false); }
  };

  const handleSaveAdminPassword = async () => {
    if (!adminPassword.trim()) { toast.error('أدخل كلمة المرور'); return; }
    setSavingAdminPassword(true);
    try {
      await accountAPI.updateAdminPassword(adminPassword.trim());
      setAdminPassword(adminPassword.trim());
      toast.success('تم حفظ كلمة مرور الصفحات الخاصة بنجاح');
    } catch (err) { toast.error(err?.response?.data?.message || 'فشل حفظ كلمة المرور'); }
    finally { setSavingAdminPassword(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  return (
    <>
      <Helmet><title>الحساب | {profile?.role === 'teacher' ? 'نظام المعلم' : 'منصة الطالب'}</title></Helmet>
      <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-5">

        {/* Profile Card */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <User className="h-5 w-5 text-primary" /> بيانات الحساب
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <Avatar user={profile} onUpload={handleUpload} onRemove={handleRemoveAvatar} uploading={uploading} />

            <div className="border-t pt-4">
              {!editInfo ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground w-24">الاسم</span>
                        <span className="font-bold">{profile?.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground w-24">كود الدخول</span>
                        <span className="font-mono font-bold bg-muted px-2 py-0.5 rounded text-sm">{profile?.codePlain}</span>
                      </div>
                      {profile?.phone && (
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground w-24">الهاتف</span>
                          <span className="font-mono text-sm">{profile.phone}</span>
                        </div>
                      )}
                    </div>
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setEditInfo(true)}>
                      <Edit className="h-3.5 w-3.5" /> تعديل
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>الاسم <span className="text-destructive">*</span></Label>
                    <Input value={name} onChange={e => setName(e.target.value)} autoFocus />
                  </div>
                  <div className="space-y-1.5">
                    <Label>رقم الهاتف</Label>
                    <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="01xxxxxxxxx" dir="ltr" />
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => { setEditInfo(false); setName(profile?.name || ''); setPhone(profile?.phone || ''); }} disabled={savingInfo}>
                      إلغاء
                    </Button>
                    <Button className="flex-1 gap-2" onClick={handleSaveInfo} disabled={savingInfo}>
                      {savingInfo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      حفظ التعديلات
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Change Code Card */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" /> تغيير كود الدخول
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              لتغيير كود الدخول أدخل الكود الحالي ثم الكود الجديد المطلوب (4 أحرف على الأقل).
            </p>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>الكود الحالي</Label>
                <div className="relative">
                  <Input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentCode}
                    onChange={e => setCurrentCode(e.target.value)}
                    placeholder="ادخل كودك الحالي"
                    dir="ltr"
                    className="pl-10 font-mono uppercase"
                  />
                  <button type="button" onClick={() => setShowCurrent(p => !p)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>الكود الجديد</Label>
                <div className="relative">
                  <Input
                    type={showNew ? 'text' : 'password'}
                    value={newCode}
                    onChange={e => setNewCode(e.target.value.toUpperCase())}
                    placeholder="اختر كوداً جديداً"
                    dir="ltr"
                    className="pl-10 font-mono uppercase"
                  />
                  <button type="button" onClick={() => setShowNew(p => !p)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {newCode.length > 0 && newCode.length < 4 && (
                  <p className="text-xs text-orange-500">الكود يجب أن يكون 4 أحرف على الأقل</p>
                )}
              </div>
              <Button
                className="w-full gap-2"
                onClick={handleChangeCode}
                disabled={savingCode || !currentCode.trim() || newCode.trim().length < 4}
              >
                {savingCode ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                {savingCode ? 'جاري التغيير...' : 'تغيير الكود'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Admin Pages Password Card */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" /> كلمة مرور الصفحات الخاصة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              كلمة المرور دي منفصلة تمامًا عن كود الدخول — بتُستخدم بس لفتح بعض الصفحات
              الحساسة في لوحة التحكم. تقدر تشوفها أو تغيّرها في أي وقت.
            </p>
            {loadingAdminPassword ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>كلمة المرور</Label>
                  <div className="relative">
                    <Input
                      type={showAdminPassword ? 'text' : 'password'}
                      value={adminPassword}
                      onChange={e => setAdminPassword(e.target.value)}
                      placeholder="اكتب كلمة مرور الصفحات الخاصة"
                      dir="ltr"
                      className="pl-10 font-mono"
                    />
                    <button type="button" onClick={() => setShowAdminPassword(p => !p)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showAdminPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button
                  className="w-full gap-2"
                  onClick={handleSaveAdminPassword}
                  disabled={savingAdminPassword || !adminPassword.trim()}
                >
                  {savingAdminPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {savingAdminPassword ? 'جاري الحفظ...' : 'حفظ كلمة المرور'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="border shadow-sm bg-muted/20">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">نوع الحساب</p>
                <p className="font-bold mt-0.5">{profile?.role === 'teacher' ? 'معلم' : 'طالب'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">حالة الحساب</p>
                <Badge variant={profile?.isActive ? 'default' : 'destructive'} className="mt-0.5">
                  {profile?.isActive ? <><CheckCircle2 className="h-3 w-3 ml-1" />نشط</> : 'معطل'}
                </Badge>
              </div>
              {profile?.academicYear && (
                <div className="col-span-2">
                  <p className="text-muted-foreground">السنة الدراسية</p>
                  <p className="font-bold mt-0.5">{profile.academicYearLabel || profile.academicYear}</p>
                </div>
              )}
              <div className="col-span-2">
                <p className="text-muted-foreground">تاريخ الانضمام</p>
                <p className="font-bold mt-0.5">
                  {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </>
  );
}