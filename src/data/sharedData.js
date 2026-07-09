// Shared dummy data used by both teacher and student pages
// When backend is ready, replace these with API calls

export const ACADEMIC_YEARS = [
  { value: 'first-prep',  label: 'الصف الأول الإعدادي',  icon: '١' },
  { value: 'second-prep', label: 'الصف الثاني الإعدادي', icon: '٢' },
  { value: 'third-prep',  label: 'الصف الثالث الإعدادي', icon: '٣' },
  { value: 'first-sec',   label: 'الصف الأول الثانوي',   icon: '٤' },
  { value: 'second-sec',  label: 'الصف الثاني الثانوي',  icon: '٥' },
];

export const ALL_STUDENTS = [
  { id: 1,  name: 'محمد أحمد علي',   code: 'ST001', year: 'first-prep'  },
  { id: 2,  name: 'خالد عمر فتحي',   code: 'ST002', year: 'first-prep'  },
  { id: 3,  name: 'سارة محمود',       code: 'ST003', year: 'first-prep'  },
  { id: 4,  name: 'ريم إبراهيم',      code: 'ST004', year: 'first-prep'  },
  { id: 5,  name: 'يوسف كمال',        code: 'ST005', year: 'second-prep' },
  { id: 6,  name: 'دينا حسن',         code: 'ST006', year: 'second-prep' },
  { id: 7,  name: 'عمر طارق',         code: 'ST007', year: 'second-prep' },
  { id: 8,  name: 'توني جورج',        code: 'ST008', year: 'third-prep'  },
  { id: 9,  name: 'مريم سعيد',        code: 'ST009', year: 'third-prep'  },
  { id: 10, name: 'علي محمود',        code: 'ST010', year: 'third-prep'  },
  { id: 11, name: 'كريم وليد',        code: 'ST011', year: 'first-sec'   },
  { id: 12, name: 'شيماء رضا',        code: 'ST012', year: 'first-sec'   },
  { id: 13, name: 'ندى أشرف',         code: 'ST013', year: 'second-sec'  },
  { id: 14, name: 'زياد منصور',       code: 'ST014', year: 'second-sec'  },
];

// Simulates the currently logged-in student (replace with auth context later)
export const CURRENT_STUDENT = {
  id: 8, name: 'توني جورج', code: 'ST008', year: 'third-prep',
};

export const INITIAL_GENERAL_NOTES = [
  { id: 1, text: 'امتحان يوم الخميس القادم — حضور إلزامي',            year: 'third-prep',  date: '2026-06-15', time: '10:30' },
  { id: 2, text: 'إحضار كتاب المدرسة في الحصة القادمة',               year: 'third-prep',  date: '2026-06-14', time: '09:00' },
  { id: 3, text: 'لا يوجد درس يوم الجمعة هذا الأسبوع',                year: 'first-prep',  date: '2026-06-13', time: '14:00' },
  { id: 4, text: 'مراجعة الوحدة الثالثة كاملة قبل الامتحان',          year: 'second-prep', date: '2026-06-12', time: '11:00' },
  { id: 5, text: 'موعد الحصة تغيّر ليوم السبت الساعة 6 مساءً',        year: 'first-sec',   date: '2026-06-11', time: '20:00' },
  { id: 6, text: 'مراجعة نهاية الترم ستكون يوم الأحد الساعة 5 عصراً', year: 'third-prep',  date: '2026-06-10', time: '08:00' },
];

export const INITIAL_PRIVATE_NOTES = [
  { id: 1, studentId: 8,  text: 'أحسنت في الامتحان الأخير، استمر على هذا المستوى', date: '2026-06-15', time: '11:00' },
  { id: 2, studentId: 2,  text: 'مطلوب الاهتمام بالواجب، لم يتم التسليم مرتين',   date: '2026-06-14', time: '09:30' },
  { id: 3, studentId: 5,  text: 'برجاء الالتزام بالمواعيد، تأخر في آخر حصتين',    date: '2026-06-13', time: '15:00' },
  { id: 4, studentId: 9,  text: 'مستواك ممتاز، جاهز للامتحان النهائي',            date: '2026-06-12', time: '10:00' },
  { id: 5, studentId: 8,  text: 'تأكد من حل تمارين الصفحة 45 قبل الحصة القادمة', date: '2026-06-10', time: '16:00' },
];

export const CONTENT_DB = {
  'first-prep': {
    videos: [
      { id:'v1', title:'مقدمة في اللغة العربية — الفصل الأول', duration:'28:45', date:'2026-06-01', order:1, published:true,
        watched:14, total:18, locked:false,
        viewers:['محمد أحمد','خالد عمر','سارة محمود','ريم إبراهيم','نور الدين','رنا محمد','هبة الله','أحمد سامي','يوسف وائل','سما طارق','إسراء حسن','مصطفى علي','نادين سعيد','كريم فتحي'] },
      { id:'v2', title:'الأفعال وأنواعها — درس ٢', duration:'35:20', date:'2026-06-05', order:2, published:true,
        watched:11, total:18, locked:false,
        viewers:['محمد أحمد','خالد عمر','ريم إبراهيم','نور الدين','رنا محمد','هبة الله','أحمد سامي','يوسف وائل','سما طارق','نادين سعيد','كريم فتحي'] },
      { id:'v3', title:'الضمائر والمضمرات — درس ٣', duration:'42:10', date:'2026-06-10', order:3, published:true,
        watched:7, total:18, locked:false,
        viewers:['محمد أحمد','خالد عمر','سارة محمود','ريم إبراهيم','نور الدين','رنا محمد','هبة الله'] },
      { id:'v4', title:'مراجعة شاملة نصف الترم', duration:'55:00', date:'2026-06-15', order:4, published:false,
        watched:3, total:18, locked:false,
        viewers:['محمد أحمد','خالد عمر','سارة محمود'] },
    ],
    files:[
      { id:'f1', title:'ملزمة الوحدة الأولى كاملة', type:'pdf', size:'2.4 MB', date:'2026-06-01' },
      { id:'f2', title:'أسئلة مراجعة الفصل الأول',  type:'pdf', size:'1.1 MB', date:'2026-06-08' },
      { id:'f3', title:'نماذج امتحانات سابقة',        type:'pdf', size:'3.7 MB', date:'2026-06-12' },
    ],
  },
  'second-prep': {
    videos: [
      { id:'v5', title:'مقدمة الفصل الدراسي — الرياضيات', duration:'32:00', date:'2026-06-01', order:1, published:true,
        watched:9, total:12, locked:false,
        viewers:['يوسف كمال','دينا حسن','عمر طارق','منة الله','كريم سامي','سلمى محمود','طارق نبيل','إيمان وليد','نبيل فهمي'] },
      { id:'v6', title:'المعادلات الخطية — درس ٢', duration:'40:15', date:'2026-06-07', order:2, published:true,
        watched:6, total:12, locked:false,
        viewers:['يوسف كمال','دينا حسن','عمر طارق','منة الله','كريم سامي','سلمى محمود'] },
      { id:'v7', title:'المثلثات — درس ٣', duration:'38:50', date:'2026-06-14', order:3, published:false,
        watched:2, total:12, locked:false, viewers:['يوسف كمال','دينا حسن'] },
    ],
    files:[
      { id:'f4', title:'ملزمة الرياضيات الوحدة الأولى', type:'pdf', size:'3.1 MB', date:'2026-06-01' },
      { id:'f5', title:'حلول التمارين الفصل الأول',     type:'pdf', size:'1.8 MB', date:'2026-06-10' },
    ],
  },
  'third-prep': {
    videos: [
      { id:'v8',  title:'مراجعة نهائية — الفصل الأول', duration:'60:00', date:'2026-06-01', order:1, published:true,
        watched:22, total:25, locked:false, viewers:Array.from({length:22},(_,i)=>`طالب ${i+1}`) },
      { id:'v9',  title:'أسئلة مهمة على الامتحان',      duration:'48:30', date:'2026-06-08', order:2, published:true,
        watched:18, total:25, locked:false, viewers:Array.from({length:18},(_,i)=>`طالب ${i+1}`) },
      { id:'v10', title:'نصائح ليلة الامتحان',           duration:'15:00', date:'2026-06-14', order:3, published:true,
        watched:10, total:25, locked:false, viewers:Array.from({length:10},(_,i)=>`طالب ${i+1}`) },
    ],
    files:[
      { id:'f6', title:'ملف مراجعة شامل',           type:'pdf', size:'5.2 MB', date:'2026-06-01' },
      { id:'f7', title:'أسئلة السنوات السابقة',      type:'pdf', size:'4.8 MB', date:'2026-06-05' },
      { id:'f8', title:'توقعات امتحان نهاية الترم', type:'pdf', size:'2.2 MB', date:'2026-06-12' },
    ],
  },
  'first-sec': {
    videos: [
      { id:'v11', title:'مقدمة المرحلة الثانوية',      duration:'25:00', date:'2026-06-01', order:1, published:true,
        watched:8, total:10, locked:false,
        viewers:['كريم وليد','شيماء رضا','إسلام حمدي','منار سيد','طارق أحمد','سارة علي','حسام فوزي','نهى محمد'] },
      { id:'v12', title:'الوحدة الأولى — درس تفصيلي', duration:'50:20', date:'2026-06-08', order:2, published:true,
        watched:5, total:10, locked:false,
        viewers:['كريم وليد','شيماء رضا','إسلام حمدي','منار سيد','طارق أحمد'] },
    ],
    files:[{ id:'f9', title:'ملزمة الوحدة الأولى ثانوي', type:'pdf', size:'3.5 MB', date:'2026-06-01' }],
  },
  'second-sec': {
    videos: [
      { id:'v13', title:'مراجعة الثانوية العامة — الجزء الأول', duration:'70:00', date:'2026-06-01', order:1, published:true,
        watched:7, total:8, locked:false,
        viewers:['ندى أشرف','زياد منصور','سلمى كمال','أحمد وليد','رانيا نصر','حنان فتحي','مصطفى سيد'] },
      { id:'v14', title:'مراجعة الجزء الثاني',                  duration:'65:30', date:'2026-06-07', order:2, published:true,
        watched:5, total:8, locked:false,
        viewers:['ندى أشرف','زياد منصور','سلمى كمال','أحمد وليد','رانيا نصر'] },
      { id:'v15', title:'أسئلة متوقعة للامتحان النهائي',        duration:'80:00', date:'2026-06-14', order:3, published:false,
        watched:2, total:8, locked:false, viewers:['ندى أشرف','زياد منصور'] },
    ],
    files:[
      { id:'f10', title:'ملزمة المراجعة النهائية', type:'pdf', size:'6.1 MB', date:'2026-06-01' },
      { id:'f11', title:'نماذج امتحانات الثانوية', type:'pdf', size:'4.2 MB', date:'2026-06-05' },
    ],
  },
};