-- ========================================
-- سياسات الأمان (Row Level Security - RLS)
-- Database Security Policies
-- ========================================

-- تفعيل RLS على كل الجداول
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ========================================
-- Helper Functions
-- ========================================

-- الحصول على دور المستخدم الحالي
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
    SELECT r.name
    FROM users u
    INNER JOIN roles r ON u.role_id = r.id
    WHERE u.id = auth.uid()
    LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER;

-- التحقق من كون المستخدم مديراً
CREATE OR REPLACE FUNCTION is_manager()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1
        FROM users u
        INNER JOIN roles r ON u.role_id = r.id
        WHERE u.id = auth.uid() AND r.name = 'manager'
    );
$$ LANGUAGE SQL SECURITY DEFINER;

-- التحقق من كون المستخدم مديراً نظام
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1
        FROM users u
        INNER JOIN roles r ON u.role_id = r.id
        WHERE u.id = auth.uid() AND r.name = 'admin'
    );
$$ LANGUAGE SQL SECURITY DEFINER;

-- ========================================
-- ROLES Policies
-- ========================================

-- الجميع يمكنهم قراءة الأدوار
CREATE POLICY "Allow read access to all authenticated users"
ON roles FOR SELECT
TO authenticated
USING (true);

-- فقط المديرون يمكنهم التعديل
CREATE POLICY "Allow admins to manage roles"
ON roles FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- ========================================
-- USERS Policies
-- ========================================

-- المستخدم يمكنه قراءة بياناته
CREATE POLICY "Users can view their own data"
ON users FOR SELECT
TO authenticated
USING (id = auth.uid());

-- المديرون يمكنهم رؤية موظفيهم
CREATE POLICY "Managers can view their employees"
ON users FOR SELECT
TO authenticated
USING (
    is_manager() AND
    center_id IN (
        SELECT center_id FROM users WHERE id = auth.uid()
    )
);

-- مديرو النظام يمكنهم رؤية الجميع
CREATE POLICY "Admins can view all users"
ON users FOR SELECT
TO authenticated
USING (is_admin());

-- مديرو النظام فقط يمكنهم الإضافة والتعديل
CREATE POLICY "Admins can manage users"
ON users FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- ========================================
-- CENTERS Policies
-- ========================================

-- الجميع يمكنهم قراءة المراكز النشطة
CREATE POLICY "Allow read access to active centers"
ON centers FOR SELECT
TO authenticated
USING (is_active = true OR is_admin());

-- مديرو النظام فقط يمكنهم التعديل
CREATE POLICY "Admins can manage centers"
ON centers FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- ========================================
-- EMPLOYEES Policies
-- ========================================

-- الموظف يمكنه قراءة بياناته
CREATE POLICY "Employees can view their own data"
ON employees FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- المديرون يمكنهم رؤية موظفيهم
CREATE POLICY "Managers can view their employees"
ON employees FOR SELECT
TO authenticated
USING (
    manager_id = auth.uid() OR
    is_admin()
);

-- مديرو النظام يمكنهم الإدارة
CREATE POLICY "Admins can manage employees"
ON employees FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- ========================================
-- FORMS Policies
-- ========================================

-- الجميع يمكنهم قراءة النماذج النشطة
CREATE POLICY "Allow read access to active forms"
ON forms FOR SELECT
TO authenticated
USING (is_active = true OR is_admin());

-- مديرو النظام فقط يمكنهم إدارة النماذج
CREATE POLICY "Admins can manage forms"
ON forms FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- ========================================
-- QUESTIONS Policies
-- ========================================

-- الجميع يمكنهم قراءة الأسئلة للنماذج النشطة
CREATE POLICY "Allow read access to questions"
ON questions FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM forms
        WHERE forms.id = questions.form_id
        AND (forms.is_active = true OR is_admin())
    )
);

-- مديرو النظام فقط يمكنهم إدارة الأسئلة
CREATE POLICY "Admins can manage questions"
ON questions FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- ========================================
-- VISITS Policies
-- ========================================

-- المستخدمون يمكنهم رؤية زياراتهم
CREATE POLICY "Users can view their visits"
ON visits FOR SELECT
TO authenticated
USING (
    visitor_id = auth.uid() OR
    is_admin()
);

-- المديرون يمكنهم رؤية زيارات مراكزهم
CREATE POLICY "Managers can view center visits"
ON visits FOR SELECT
TO authenticated
USING (
    center_id IN (
        SELECT center_id FROM users WHERE id = auth.uid()
    ) OR is_admin()
);

-- مديرو النظام والمراجعون يمكنهم إضافة زيارات
CREATE POLICY "Admins and reviewers can manage visits"
ON visits FOR ALL
TO authenticated
USING (
    is_admin() OR
    get_user_role() = 'reviewer'
)
WITH CHECK (
    is_admin() OR
    get_user_role() = 'reviewer'
);

-- ========================================
-- EVALUATIONS Policies
-- ========================================

-- المستخدم يمكنه رؤية تقييماته (كمُقيِّم أو مُقيَّم)
CREATE POLICY "Users can view their evaluations"
ON evaluations FOR SELECT
TO authenticated
USING (
    evaluator_id = auth.uid() OR
    evaluated_user_id = auth.uid() OR
    is_admin()
);

-- المديرون يمكنهم رؤية تقييمات موظفيهم
CREATE POLICY "Managers can view employee evaluations"
ON evaluations FOR SELECT
TO authenticated
USING (
    evaluator_id = auth.uid() OR
    evaluated_user_id IN (
        SELECT user_id FROM employees WHERE manager_id = auth.uid()
    ) OR
    is_admin()
);

-- المستخدمون يمكنهم إنشاء تقييماتهم الخاصة
CREATE POLICY "Users can create their own evaluations"
ON evaluations FOR INSERT
TO authenticated
WITH CHECK (
    evaluator_id = auth.uid() OR
    is_admin()
);

-- المستخدمون يمكنهم تعديل تقييماتهم في حالة المسودة
CREATE POLICY "Users can update their draft evaluations"
ON evaluations FOR UPDATE
TO authenticated
USING (
    evaluator_id = auth.uid() AND
    status = 'draft'
)
WITH CHECK (
    evaluator_id = auth.uid()
);

-- مديرو النظام يمكنهم الإدارة الكاملة
CREATE POLICY "Admins can manage all evaluations"
ON evaluations FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- ========================================
-- ANSWERS Policies
-- ========================================

-- المستخدمون يمكنهم رؤية إجاباتهم
CREATE POLICY "Users can view their answers"
ON answers FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM evaluations
        WHERE evaluations.id = answers.evaluation_id
        AND (
            evaluations.evaluator_id = auth.uid() OR
            evaluations.evaluated_user_id = auth.uid() OR
            is_admin()
        )
    )
);

-- المستخدمون يمكنهم إضافة إجابات لتقييماتهم
CREATE POLICY "Users can create answers for their evaluations"
ON answers FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM evaluations
        WHERE evaluations.id = answers.evaluation_id
        AND evaluations.evaluator_id = auth.uid()
        AND evaluations.status = 'draft'
    ) OR is_admin()
);

-- المستخدمون يمكنهم تعديل إجاباتهم في المسودات
CREATE POLICY "Users can update their answers in draft"
ON answers FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM evaluations
        WHERE evaluations.id = answers.evaluation_id
        AND evaluations.evaluator_id = auth.uid()
        AND evaluations.status = 'draft'
    ) OR is_admin()
);

-- ========================================
-- REPORTS Policies
-- ========================================

-- الجميع يمكنهم قراءة التقارير
CREATE POLICY "All users can view reports"
ON reports FOR SELECT
TO authenticated
USING (true);

-- مديرو النظام والمراجعون يمكنهم إنشاء التقارير
CREATE POLICY "Admins and reviewers can create reports"
ON reports FOR INSERT
TO authenticated
WITH CHECK (
    is_admin() OR
    get_user_role() = 'reviewer'
);

-- ========================================
-- AUDIT_LOGS Policies
-- ========================================

-- مديرو النظام فقط يمكنهم قراءة سجلات التدقيق
CREATE POLICY "Only admins can view audit logs"
ON audit_logs FOR SELECT
TO authenticated
USING (is_admin());

-- السماح بالإضافة للجميع (يتم عبر الـ triggers)
CREATE POLICY "Allow system to insert audit logs"
ON audit_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- ========================================
-- CUSTOM POLICIES للحالات الخاصة
-- ========================================

-- سياسة خاصة: المديرون يمكنهم تقييم موظفيهم فقط
CREATE POLICY "Managers can only evaluate their employees"
ON evaluations FOR INSERT
TO authenticated
WITH CHECK (
    (get_user_role() = 'manager' AND
    evaluated_user_id IN (
        SELECT user_id FROM employees WHERE manager_id = auth.uid()
    )) OR
    is_admin()
);

-- سياسة خاصة: الموظفون يمكنهم التقييم الذاتي فقط
CREATE POLICY "Employees can only create self-evaluations"
ON evaluations FOR INSERT
TO authenticated
WITH CHECK (
    (get_user_role() = 'employee' AND
    evaluator_id = auth.uid() AND
    evaluated_user_id = auth.uid()) OR
    get_user_role() IN ('admin', 'manager', 'reviewer')
);

-- ========================================
-- GRANT Permissions
-- ========================================

-- منح الصلاحيات للمستخدمين المصادق عليهم
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- ========================================
-- COMMENTS للتوثيق
-- ========================================

COMMENT ON POLICY "Users can view their own data" ON users IS 'يسمح للمستخدمين برؤية بياناتهم الشخصية';
COMMENT ON POLICY "Managers can view their employees" ON users IS 'يسمح للمديرين برؤية بيانات موظفيهم';
COMMENT ON POLICY "Admins can view all users" ON users IS 'يسمح لمديري النظام برؤية جميع المستخدمين';

COMMENT ON FUNCTION get_user_role() IS 'دالة للحصول على دور المستخدم الحالي';
COMMENT ON FUNCTION is_manager() IS 'دالة للتحقق من كون المستخدم مديراً';
COMMENT ON FUNCTION is_admin() IS 'دالة للتحقق من كون المستخدم مدير نظام';
