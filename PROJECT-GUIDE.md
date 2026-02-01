# 📘 الدليل الشامل للمشروع
## نظام التقييم المركزي لإدارة خدمة العملاء

---

## 📑 فهرس المحتويات

1. [نظرة عامة على المشروع](#نظرة-عامة)
2. [بنية قاعدة البيانات](#بنية-قاعدة-البيانات)
3. [هيكل المشروع](#هيكل-المشروع)
4. [الملفات الأساسية](#الملفات-الأساسية)
5. [سير العمل](#سير-العمل)
6. [الأمثلة العملية](#الأمثلة-العملية)
7. [نصائح التطوير](#نصائح-التطوير)

---

## 🎯 نظرة عامة

### الهدف
نظام شامل لإدارة التقييمات في الجهات الحكومية يدعم:
- إنشاء نماذج تقييم مرنة
- تقييم المراكز عبر زيارات ميدانية
- تقييم المديرين للموظفين
- التقييم الذاتي للموظفين
- تقارير وإحصائيات شاملة

### التقنيات
```
Frontend:  React 18 + Vite + Tailwind CSS + Recharts
Backend:   Supabase (PostgreSQL + Auth + RLS)
Deploy:    Netlify
Security:  Row Level Security + Audit Logs
```

---

## 🗄️ بنية قاعدة البيانات

### الجداول الرئيسية (11 جدول)

#### 1. roles - الأدوار
```sql
- id: UUID (PK)
- name: VARCHAR(50) - اسم الدور بالإنجليزية
- name_ar: VARCHAR(100) - اسم الدور بالعربية
- description: TEXT
```

**الأدوار المعرّفة:**
- admin: مدير النظام
- manager: مدير قسم
- employee: موظف
- reviewer: مراجع

#### 2. users - المستخدمون
```sql
- id: UUID (PK) → REFERENCES auth.users
- role_id: UUID → REFERENCES roles
- center_id: UUID → REFERENCES centers
- full_name: VARCHAR(200)
- email: VARCHAR(255) UNIQUE
- phone: VARCHAR(20)
- employee_number: VARCHAR(50) UNIQUE
- is_active: BOOLEAN
```

**العلاقات:**
- ينتمي لدور واحد
- قد ينتمي لمركز واحد
- مرتبط مع Supabase Auth

#### 3. centers - المراكز
```sql
- id: UUID (PK)
- code: VARCHAR(50) UNIQUE
- name: VARCHAR(200)
- name_ar: VARCHAR(200)
- location: TEXT
- manager_id: UUID → REFERENCES users
- is_active: BOOLEAN
```

#### 4. employees - الموظفون
```sql
- id: UUID (PK)
- user_id: UUID → REFERENCES users (UNIQUE)
- center_id: UUID → REFERENCES centers
- manager_id: UUID → REFERENCES users
- position: VARCHAR(100)
- position_ar: VARCHAR(100)
- department: VARCHAR(100)
- department_ar: VARCHAR(100)
- hire_date: DATE
- is_active: BOOLEAN
```

#### 5. forms - النماذج
```sql
- id: UUID (PK)
- code: VARCHAR(50) UNIQUE
- title: VARCHAR(200)
- title_ar: VARCHAR(200)
- description: TEXT
- form_type: VARCHAR(50)
  * 'center_visit' - زيارة ميدانية
  * 'manager_evaluation' - تقييم مدير
  * 'self_evaluation' - تقييم ذاتي
- target_role_id: UUID → REFERENCES roles
- max_score: DECIMAL(10,2)
- is_active: BOOLEAN
```

#### 6. questions - الأسئلة
```sql
- id: UUID (PK)
- form_id: UUID → REFERENCES forms
- question_number: INTEGER
- question_text: TEXT
- question_text_ar: TEXT
- question_type: VARCHAR(30)
  * 'yes_no' - نعم/لا
  * 'scale' - مقياس درجات
  * 'multiple_choice' - اختيار متعدد
  * 'text' - نص حر
- weight: DECIMAL(5,2) - الوزن النسبي
- max_points: DECIMAL(10,2)
- options: JSONB - للاختيارات المتعددة
- is_required: BOOLEAN
- order_index: INTEGER
```

#### 7. visits - الزيارات الميدانية
```sql
- id: UUID (PK)
- center_id: UUID → REFERENCES centers
- visit_number: INTEGER (1 or 2)
- visit_date: DATE
- visitor_id: UUID → REFERENCES users
- visit_month: INTEGER (1-12)
- visit_year: INTEGER
- status: VARCHAR(30)
  * 'scheduled' - مجدولة
  * 'in_progress' - جارية
  * 'completed' - مكتملة
  * 'cancelled' - ملغاة
- notes: TEXT
```

**قيود:**
- UNIQUE(center_id, visit_year, visit_month, visit_number)
- زيارتين فقط لكل مركز شهرياً

#### 8. evaluations - التقييمات
```sql
- id: UUID (PK)
- form_id: UUID → REFERENCES forms
- evaluator_id: UUID → REFERENCES users
- evaluated_user_id: UUID → REFERENCES users (nullable)
- evaluated_center_id: UUID → REFERENCES centers (nullable)
- visit_id: UUID → REFERENCES visits (nullable)
- evaluation_date: DATE
- total_score: DECIMAL(10,2) - محسوبة تلقائياً
- percentage: DECIMAL(5,2) - محسوبة تلقائياً
- status: VARCHAR(30)
  * 'draft' - مسودة
  * 'submitted' - مرسلة
  * 'approved' - موافق عليها
  * 'rejected' - مرفوضة
- notes: TEXT
- submitted_at: TIMESTAMP
```

#### 9. answers - الإجابات
```sql
- id: UUID (PK)
- evaluation_id: UUID → REFERENCES evaluations
- question_id: UUID → REFERENCES questions
- answer_value: TEXT
- score: DECIMAL(10,2)
- notes: TEXT
```

**قيود:**
- UNIQUE(evaluation_id, question_id)

#### 10. reports - التقارير (مؤقتة)
```sql
- id: UUID (PK)
- report_type: VARCHAR(50)
- report_period: VARCHAR(50)
- start_date: DATE
- end_date: DATE
- filters: JSONB
- data: JSONB
- generated_by: UUID → REFERENCES users
- generated_at: TIMESTAMP
```

#### 11. audit_logs - سجل التدقيق
```sql
- id: UUID (PK)
- user_id: UUID → REFERENCES users
- action: VARCHAR(100) - INSERT/UPDATE/DELETE
- table_name: VARCHAR(100)
- record_id: UUID
- old_values: JSONB
- new_values: JSONB
- ip_address: INET
- created_at: TIMESTAMP
```

### العروض (Views) للتقارير

#### v_center_rankings
```sql
SELECT 
  center_id,
  code,
  name_ar,
  total_evaluations,
  avg_percentage,
  last_evaluation_date,
  ranking
FROM centers + evaluations
ORDER BY avg_percentage DESC
```

#### v_manager_compliance
```sql
SELECT 
  manager_id,
  full_name,
  center_name,
  evaluations_count,
  submitted_count,
  compliance_status ('ملتزم' / 'غير ملتزم' / 'التزام جزئي')
FROM users + evaluations
```

#### v_employee_submission_status
```sql
SELECT 
  employee_id,
  full_name,
  center_name,
  manager_name,
  total_submissions,
  last_submission_date,
  submission_status ('تم الإدخال' / 'لم يتم الإدخال')
FROM employees + evaluations
```

### الدوال (Functions)

#### calculate_evaluation_score()
```sql
TRIGGER: بعد إضافة/تعديل إجابة
يحسب تلقائياً:
- total_score = SUM(answers.score)
- percentage = (total_score / max_score) * 100
```

#### get_user_role()
```sql
RETURNS: اسم دور المستخدم الحالي
```

#### is_admin() / is_manager()
```sql
RETURNS: BOOLEAN
للتحقق من صلاحيات المستخدم
```

---

## 📂 هيكل المشروع

```
gov-evaluation-system/
│
├── database-schema.sql          ← إنشاء قاعدة البيانات
├── rls-policies.sql             ← سياسات الأمان
├── README.md                    ← الدليل الرئيسي
├── DEPLOYMENT.md                ← دليل النشر
├── QUICKSTART.md                ← دليل البدء السريع
├── PROJECT-GUIDE.md             ← هذا الملف
│
├── package.json                 ← الحزم والإعدادات
├── vite.config.js               ← إعدادات Vite
├── tailwind.config.js           ← إعدادات Tailwind
├── postcss.config.js            ← إعدادات PostCSS
├── netlify.toml                 ← إعدادات Netlify
│
├── .env.example                 ← نموذج متغيرات البيئة
├── .gitignore                   ← ملفات متجاهلة
│
├── index.html                   ← ملف HTML الرئيسي
│
└── src/
    ├── main.jsx                 ← نقطة الدخول
    ├── App.jsx                  ← المكون الرئيسي + Routing
    ├── index.css                ← الأنماط الرئيسية
    │
    ├── contexts/
    │   └── AuthContext.jsx      ← إدارة المصادقة
    │
    ├── services/
    │   └── supabase.js          ← Supabase Client
    │
    ├── pages/
    │   ├── Login.jsx            ← صفحة تسجيل الدخول
    │   ├── AdminDashboard.jsx   ← لوحة تحكم المدير
    │   ├── ManagerDashboard.jsx ← لوحة تحكم المدير
    │   ├── EmployeeDashboard.jsx← لوحة تحكم الموظف
    │   ├── ReviewerDashboard.jsx← لوحة تحكم المراجع
    │   ├── EvaluationForm.jsx   ← صفحة التقييم
    │   ├── ReportsPage.jsx      ← صفحة التقارير
    │   └── admin/
    │       ├── FormsManagement.jsx      ← إدارة النماذج
    │       ├── CentersManagement.jsx    ← إدارة المراكز
    │       ├── UsersManagement.jsx      ← إدارة المستخدمين
    │       └── VisitsManagement.jsx     ← إدارة الزيارات
    │
    └── components/
        ├── common/
        │   ├── Navbar.jsx       ← شريط التنقل
        │   └── LoadingSpinner.jsx← مؤشر التحميل
        │
        ├── admin/               ← مكونات المدير
        ├── manager/             ← مكونات المدير
        ├── employee/            ← مكونات الموظف
        └── reports/             ← مكونات التقارير
```

---

## 📄 الملفات الأساسية

### 1. AuthContext.jsx - إدارة المصادقة

```javascript
// الوظائف الرئيسية:
- signIn(email, password)       // تسجيل الدخول
- signOut()                      // تسجيل الخروج
- signUp(email, password, data)  // إنشاء حساب
- resetPassword(email)           // إعادة تعيين كلمة المرور

// الحالة:
- user         // معلومات المستخدم من Supabase Auth
- profile      // معلومات المستخدم الكاملة + دور + مركز
- loading      // حالة التحميل
- isAdmin      // boolean
- isManager    // boolean
- isEmployee   // boolean
- isReviewer   // boolean
```

### 2. supabase.js - خدمة Supabase

```javascript
// الوظائف:
- getCurrentUser()      // الحصول على المستخدم الحالي
- getUserRole()         // الحصول على دور المستخدم
- isAdmin()             // التحقق من كونه مدير
- isManager()           // التحقق من كونه مدير قسم

// الاستخدام:
import { supabase, db } from '@/services/supabase'

// الحصول على بيانات
const { data, error } = await supabase
  .from('centers')
  .select('*')
  .eq('is_active', true)

// إضافة بيانات
const { data, error } = await supabase
  .from('centers')
  .insert({ name_ar: 'مركز جديد', ... })

// تحديث
const { data, error } = await supabase
  .from('centers')
  .update({ name_ar: 'اسم محدث' })
  .eq('id', centerId)
```

### 3. App.jsx - التوجيه

```javascript
// المسارات:
/login                   → Login page
/                        → Dashboard (حسب الدور)
/admin/forms             → FormsManagement (admin only)
/admin/centers           → CentersManagement (admin only)
/admin/users             → UsersManagement (admin only)
/admin/visits            → VisitsManagement (admin/reviewer)
/reports                 → ReportsPage (all except employee)
/evaluation/:formId      → EvaluationForm (all)

// ProtectedRoute - التحقق من الصلاحيات
<ProtectedRoute allowedRoles={['admin', 'reviewer']}>
  <Component />
</ProtectedRoute>
```

---

## 🔄 سير العمل

### سيناريو 1: إنشاء نموذج تقييم جديد

```
1. المدير ← إدارة النماذج
2. إنشاء نموذج جديد
   - العنوان
   - النوع (زيارة/مدير/ذاتي)
   - الحد الأقصى للدرجة
3. إضافة أسئلة:
   - نص السؤال
   - النوع
   - الوزن النسبي
   - الدرجة
4. حفظ ← يُنشأ في forms + questions
```

### سيناريو 2: تقييم موظف

```
1. المدير ← لوحة التحكم
2. يرى قائمة موظفيه (من employees حيث manager_id = current_user)
3. ينقر "تقييم" ← يختار النموذج
4. يُنشأ evaluation جديد:
   - evaluator_id = current_user
   - evaluated_user_id = employee
   - status = 'draft'
5. يجيب على الأسئلة ← تُحفظ في answers
6. Trigger يحسب total_score و percentage تلقائياً
7. ينقر "إرسال" ← status = 'submitted'
```

### سيناريو 3: زيارة ميدانية

```
1. المراجع ← الزيارات الميدانية
2. إنشاء زيارة:
   - المركز
   - التاريخ
   - رقم الزيارة (1 أو 2)
3. يُنشأ visit مع status = 'scheduled'
4. عند الزيارة ← يفتح النموذج
5. يُنشأ evaluation:
   - visit_id = current_visit
   - evaluated_center_id = center
6. يجيب على الأسئلة
7. يرسل ← visit.status = 'completed'
```

### سيناريو 4: إنشاء تقرير

```
1. المستخدم ← التقارير
2. يختار نوع التقرير:
   - ترتيب المراكز
   - التزام المديرين
   - حالة الموظفين
3. يختار الفترة (شهر/ربع سنوي/سنوي)
4. يُستعلم من Views أو Evaluations مباشرة
5. يُعرض النتائج في:
   - جداول
   - رسوم بيانية (Recharts)
6. يُصدّر:
   - PDF (jsPDF)
   - Excel (XLSX)
```

---

## 💡 الأمثلة العملية

### مثال 1: إضافة مركز جديد

```javascript
// في CentersManagement.jsx

const handleAddCenter = async (formData) => {
  try {
    const { data, error } = await supabase
      .from('centers')
      .insert({
        code: formData.code,
        name: formData.name,
        name_ar: formData.nameAr,
        location: formData.location,
        is_active: true
      })
      .select()
      .single()

    if (error) throw error
    
    // يُسجّل تلقائياً في audit_logs عبر Trigger
    alert('تم إضافة المركز بنجاح')
    loadCenters() // إعادة التحميل
  } catch (error) {
    console.error('Error:', error)
    alert('خطأ في إضافة المركز')
  }
}
```

### مثال 2: تحميل تقييمات الموظف

```javascript
// في EmployeeDashboard.jsx

const loadEvaluations = async () => {
  const { data, error } = await supabase
    .from('evaluations')
    .select(`
      *,
      form:forms(title_ar)
    `)
    .eq('evaluator_id', profile.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error(error)
    return
  }

  setEvaluations(data)
}
```

### مثال 3: حساب ترتيب المراكز

```javascript
// في ReportsPage.jsx

const loadCenterRankings = async (period) => {
  const { data, error } = await supabase
    .from('v_center_rankings')  // استخدام View جاهز
    .select('*')
    .order('ranking', { ascending: true })
    .limit(10)

  if (error) {
    console.error(error)
    return
  }

  setRankings(data)
}
```

### مثال 4: تصدير تقرير PDF

```javascript
// في ReportsPage.jsx

import jsPDF from 'jspdf'
import 'jspdf-autotable'

const exportPDF = (data) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  })

  // إضافة خط عربي (يجب تحميله أولاً)
  doc.setFont('Cairo')
  
  // العنوان
  doc.setFontSize(16)
  doc.text('تقرير ترتيب المراكز', 14, 15)
  
  // الجدول
  doc.autoTable({
    startY: 25,
    head: [['الترتيب', 'المركز', 'النسبة المئوية']],
    body: data.map(row => [
      row.ranking,
      row.name_ar,
      `${row.avg_percentage.toFixed(1)}%`
    ]),
    styles: { font: 'Cairo' }
  })
  
  doc.save('center-rankings.pdf')
}
```

---

## 🔧 نصائح التطوير

### 1. استخدام RLS بشكل صحيح

```javascript
// ❌ خطأ: محاولة الوصول لبيانات خارج الصلاحيات
const { data } = await supabase
  .from('users')
  .select('*')  // سيعيد فقط البيانات المسموح بها حسب RLS

// ✅ صحيح: التحقق من الصلاحيات أولاً
const isAdmin = await db.isAdmin()
if (!isAdmin) {
  alert('غير مصرح')
  return
}
```

### 2. التعامل مع الأخطاء

```javascript
// ✅ دائماً تحقق من الأخطاء
const { data, error } = await supabase
  .from('centers')
  .select('*')

if (error) {
  console.error('Supabase error:', error)
  // اعرض رسالة للمستخدم
  setErrorMessage('حدث خطأ في تحميل البيانات')
  return
}

// استخدم البيانات
setData(data)
```

### 3. تحسين الأداء

```javascript
// ❌ تحميل كل شيء
const { data } = await supabase
  .from('evaluations')
  .select('*')

// ✅ تحميل ما تحتاجه فقط
const { data } = await supabase
  .from('evaluations')
  .select('id, total_score, percentage, status')
  .eq('status', 'submitted')
  .order('created_at', { ascending: false })
  .limit(20)
```

### 4. استخدام Transactions

```javascript
// للعمليات المعقدة، استخدم Supabase RPC Functions
// أنشئ function في SQL:

CREATE OR REPLACE FUNCTION complete_evaluation(eval_id UUID)
RETURNS void AS $$
BEGIN
  -- تحديث التقييم
  UPDATE evaluations 
  SET status = 'submitted', submitted_at = NOW()
  WHERE id = eval_id;
  
  -- تحديث الزيارة إذا كانت موجودة
  UPDATE visits 
  SET status = 'completed'
  WHERE id = (SELECT visit_id FROM evaluations WHERE id = eval_id);
END;
$$ LANGUAGE plpgsql;

// ثم في React:
const { error } = await supabase
  .rpc('complete_evaluation', { eval_id: evaluationId })
```

### 5. Real-time Updates (اختياري)

```javascript
// الاستماع للتغييرات في الوقت الفعلي
const subscription = supabase
  .channel('evaluations-changes')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'evaluations'
  }, (payload) => {
    console.log('تقييم جديد:', payload.new)
    loadEvaluations() // إعادة التحميل
  })
  .subscribe()

// إلغاء الاشتراك عند unmount
return () => {
  subscription.unsubscribe()
}
```

---

## 🎓 موارد تعليمية

### Supabase
- [Docs](https://supabase.com/docs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [JavaScript Client](https://supabase.com/docs/reference/javascript)

### React
- [React Docs](https://react.dev)
- [React Router](https://reactrouter.com)
- [Hooks Reference](https://react.dev/reference/react)

### Tailwind CSS
- [Documentation](https://tailwindcss.com/docs)
- [Cheat Sheet](https://nerdcave.com/tailwind-cheat-sheet)

### Recharts
- [Examples](https://recharts.org/en-US/examples)

---

## 🚀 الخطوات التالية

بعد إكمال الإعداد الأساسي، يمكنك:

1. **إضافة المزيد من أنواع الأسئلة**
2. **تحسين واجهة المستخدم**
3. **إضافة إشعارات البريد الإلكتروني**
4. **تطوير تطبيق موبايل**
5. **إضافة لوحة تحكم تنفيذية**
6. **تكامل مع أنظمة أخرى**

---

**آخر تحديث: 2026-02-01**
**النسخة: 1.0**
