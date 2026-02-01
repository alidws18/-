# ⚡ دليل البدء السريع - 10 دقائق

هذا دليل مختصر للبدء الفوري. للتفاصيل الكاملة، راجع `README.md` و `DEPLOYMENT.md`.

---

## 🎯 الخطوات السريعة

### 1️⃣ إعداد Supabase (3 دقائق)

```bash
1. اذهب إلى supabase.com وأنشئ حساب
2. أنشئ مشروع جديد
3. من Settings > API، انسخ:
   - Project URL
   - anon public key
4. من SQL Editor، شغّل ملفات SQL بالترتيب:
   - database-schema.sql
   - rls-policies.sql
```

### 2️⃣ إنشاء مستخدم مدير (1 دقيقة)

```sql
-- في Supabase Authentication > Users، أنشئ مستخدم
-- ثم في SQL Editor:

INSERT INTO users (id, role_id, full_name, email, is_active)
SELECT 
  'user-uuid-here',  -- UUID من auth.users
  (SELECT id FROM roles WHERE name = 'admin'),
  'مدير النظام',
  'admin@gov.sa',
  true;
```

### 3️⃣ تشغيل المشروع محلياً (3 دقائق)

```bash
# تثبيت الحزم
npm install

# إعداد البيئة
cp .env.example .env
# عدّل .env وأضف بيانات Supabase

# تشغيل
npm run dev

# افتح http://localhost:3000
```

### 4️⃣ النشر على Netlify (3 دقائق)

```bash
# رفع إلى GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main

# في Netlify:
1. New site from Git
2. اختر repository
3. Build: npm run build
4. Publish: dist
5. أضف Environment Variables
6. Deploy!
```

---

## 📝 معلومات تسجيل الدخول الأولى

```
البريد: admin@gov.sa (أو ما أنشأته)
كلمة المرور: [التي أنشأتها في Supabase]
```

---

## ✅ قائمة التحقق

- [ ] Supabase project created
- [ ] Database schema applied
- [ ] RLS policies applied  
- [ ] Admin user created
- [ ] .env configured
- [ ] npm install done
- [ ] Works locally
- [ ] Pushed to GitHub
- [ ] Deployed to Netlify
- [ ] Can login

---

## 🚨 حل المشاكل السريع

**لا يعمل محلياً؟**
- تحقق من .env
- تحقق من npm install
- راجع console للأخطاء

**لا يمكن تسجيل الدخول؟**
- تحقق من إنشاء المستخدم
- تأكد من Auto Confirm في Supabase
- راجع RLS policies

**فشل البناء على Netlify؟**
- تحقق من Environment Variables
- راجع build logs
- تأكد من صحة الكود

---

## 📚 المزيد من المساعدة

- **دليل كامل:** `README.md`
- **دليل النشر:** `DEPLOYMENT.md`
- **الدعم:** support@gov.sa

---

**⏱️ الوقت الإجمالي: ~10 دقائق**

🎉 **ابدأ الآن!**
