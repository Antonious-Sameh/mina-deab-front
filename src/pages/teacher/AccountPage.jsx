import React from 'react';
import { Helmet } from 'react-helmet';
import { User, BookOpen, LogOut } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge }  from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AccountPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <>
      <Helmet><title>حسابي | نظام المعلم</title></Helmet>
      <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
        <h2 className="text-2xl font-extrabold">حسابي</h2>

        <Card className="border shadow-sm">
          <CardContent className="p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <User className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-2xl font-extrabold">{user?.name}</h3>
            <p className="text-muted-foreground mt-1 flex items-center justify-center gap-2">
              <BookOpen className="h-4 w-4" /> المعلم الرئيسي
            </p>
            {user?.codePlain && <Badge variant="outline" className="mt-2 font-mono">{user.codePlain}</Badge>}
          </CardContent>
        </Card>

        <Button variant="destructive" className="w-full gap-2 h-12 text-base" onClick={handleLogout}>
          <LogOut className="h-5 w-5" /> تسجيل الخروج
        </Button>
      </div>
    </>
  );
}
