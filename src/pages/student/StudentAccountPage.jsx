import React from 'react';
import { Helmet } from 'react-helmet';
import { User, Phone, GraduationCap, Users, LogOut } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge }  from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const YEAR_LABELS = {
  'first-prep':'الصف الأول الإعدادي','second-prep':'الصف الثاني الإعدادي',
  'third-prep':'الصف الثالث الإعدادي','first-sec':'الصف الأول الثانوي','second-sec':'الصف الثاني الثانوي',
};

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl">
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-semibold">{value}</p>
      </div>
    </div>
  );
}

export default function StudentAccountPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <>
      <Helmet><title>حسابي | منصة الطالب</title></Helmet>
      <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
        <h2 className="text-2xl font-extrabold">حسابي</h2>
        <Card className="border shadow-sm">
          <CardContent className="p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <User className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-2xl font-extrabold">{user?.name}</h3>
            <p className="text-muted-foreground mt-1">{YEAR_LABELS[user?.academicYear] || ''}</p>
            {user?.codePlain && <Badge variant="outline" className="mt-2 font-mono">{user.codePlain}</Badge>}
          </CardContent>
        </Card>

        <div className="space-y-3">
          <InfoRow icon={GraduationCap} label="المرحلة الدراسية" value={YEAR_LABELS[user?.academicYear]} />
          <InfoRow icon={Users}         label="المجموعة"         value={user?.group?.name} />
          <InfoRow icon={Phone}         label="رقم الهاتف"       value={user?.phone} />
          <InfoRow icon={Phone}         label="هاتف ولي الأمر"   value={user?.parentPhone} />
        </div>

        <Button variant="destructive" className="w-full gap-2" onClick={handleLogout}>
          <LogOut className="h-4 w-4" /> تسجيل الخروج
        </Button>
      </div>
    </>
  );
}
