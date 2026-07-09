import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { Timer, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function ExamInterfacePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    setLoading(true);
    setTimeout(() => {
      toast.success('تم تسليم الامتحان بنجاح!');
      navigate('/student/exams');
    }, 1500);
  };

  return (
    <>
      <Helmet><title>واجهة الامتحان - منصة الطالب</title></Helmet>
      <div className="min-h-screen bg-muted/30 pb-20">
        <header className="sticky top-0 bg-card border-b z-10 px-6 py-4 flex items-center justify-between shadow-sm">
          <div>
            <h1 className="font-bold text-lg">امتحان الوحدة الثانية</h1>
            <p className="text-sm text-muted-foreground">يتكون من 3 أسئلة</p>
          </div>
          <div className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-lg font-bold tabular-nums">
            <Timer className="h-5 w-5" />
            29:59
          </div>
        </header>

        <main className="max-w-3xl mx-auto p-6 space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-bold text-lg">1. ما هو عاصمة جمهورية مصر العربية؟</h3>
              <RadioGroup>
                <div className="flex items-center space-x-2 space-x-reverse border p-3 rounded-lg hover:bg-muted cursor-pointer">
                  <RadioGroupItem value="alex" id="r1" />
                  <Label htmlFor="r1" className="cursor-pointer flex-1">الإسكندرية</Label>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse border p-3 rounded-lg hover:bg-muted cursor-pointer">
                  <RadioGroupItem value="cairo" id="r2" />
                  <Label htmlFor="r2" className="cursor-pointer flex-1">القاهرة</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-bold text-lg">2. النيل هو أطول نهر في العالم.</h3>
              <RadioGroup>
                <div className="flex items-center space-x-2 space-x-reverse border p-3 rounded-lg hover:bg-muted cursor-pointer">
                  <RadioGroupItem value="true" id="r3" />
                  <Label htmlFor="r3" className="cursor-pointer flex-1">صح</Label>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse border p-3 rounded-lg hover:bg-muted cursor-pointer">
                  <RadioGroupItem value="false" id="r4" />
                  <Label htmlFor="r4" className="cursor-pointer flex-1">خطأ</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          <div className="flex justify-end pt-4">
            <Button size="lg" onClick={handleSubmit} disabled={loading} className="gap-2 w-full md:w-auto">
              <Send className="h-5 w-5" /> {loading ? 'جاري التسليم...' : 'تسليم الامتحان'}
            </Button>
          </div>
        </main>
      </div>
    </>
  );
}