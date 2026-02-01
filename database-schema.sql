-- ========================================
-- نظام التقييم المركزي - قاعدة البيانات
-- Government Customer Service Evaluation System
-- ========================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================
-- 1. الأدوار والمستخدمين (Roles & Users)
-- ========================================

-- جدول الأدوار
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    name_ar VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول المستخدمين (يرتبط مع Supabase Auth)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) NOT NULL,
    center_id UUID REFERENCES centers(id) ON DELETE SET NULL,
    full_name VARCHAR(200) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    employee_number VARCHAR(50) UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 2. المراكز (Centers)
-- ========================================

CREATE TABLE centers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    name_ar VARCHAR(200) NOT NULL,
    location TEXT,
    manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 3. الموظفين (Employees)
-- ========================================

CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    center_id UUID REFERENCES centers(id) NOT NULL,
    manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
    position VARCHAR(100),
    position_ar VARCHAR(100),
    department VARCHAR(100),
    department_ar VARCHAR(100),
    hire_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 4. النماذج (Evaluation Forms)
-- ========================================

CREATE TABLE forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    title_ar VARCHAR(200) NOT NULL,
    description TEXT,
    form_type VARCHAR(50) NOT NULL, -- 'center_visit', 'manager_evaluation', 'self_evaluation'
    target_role_id UUID REFERENCES roles(id),
    max_score DECIMAL(10,2) DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT check_form_type CHECK (form_type IN ('center_visit', 'manager_evaluation', 'self_evaluation'))
);

-- ========================================
-- 5. الأسئلة (Questions)
-- ========================================

CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID REFERENCES forms(id) ON DELETE CASCADE NOT NULL,
    question_number INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    question_text_ar TEXT NOT NULL,
    question_type VARCHAR(30) NOT NULL, -- 'yes_no', 'scale', 'multiple_choice', 'text'
    weight DECIMAL(5,2) DEFAULT 1.0, -- الوزن النسبي
    max_points DECIMAL(10,2) DEFAULT 10,
    options JSONB, -- للاختيارات المتعددة
    is_required BOOLEAN DEFAULT true,
    order_index INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT check_question_type CHECK (question_type IN ('yes_no', 'scale', 'multiple_choice', 'text')),
    CONSTRAINT unique_form_question UNIQUE(form_id, question_number)
);

-- ========================================
-- 6. الزيارات الميدانية (Field Visits)
-- ========================================

CREATE TABLE visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    center_id UUID REFERENCES centers(id) NOT NULL,
    visit_number INTEGER NOT NULL, -- 1 or 2 (first or second visit of the month)
    visit_date DATE NOT NULL,
    visitor_id UUID REFERENCES users(id) NOT NULL,
    visit_month INTEGER NOT NULL,
    visit_year INTEGER NOT NULL,
    status VARCHAR(30) DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'cancelled'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT check_visit_number CHECK (visit_number IN (1, 2)),
    CONSTRAINT check_visit_month CHECK (visit_month BETWEEN 1 AND 12),
    CONSTRAINT check_status CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    CONSTRAINT unique_center_visit UNIQUE(center_id, visit_year, visit_month, visit_number)
);

-- ========================================
-- 7. التقييمات (Evaluations)
-- ========================================

CREATE TABLE evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID REFERENCES forms(id) NOT NULL,
    evaluator_id UUID REFERENCES users(id) NOT NULL,
    evaluated_user_id UUID REFERENCES users(id), -- للتقييمات الشخصية
    evaluated_center_id UUID REFERENCES centers(id), -- لتقييم المراكز
    visit_id UUID REFERENCES visits(id), -- للزيارات الميدانية
    evaluation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_score DECIMAL(10,2),
    percentage DECIMAL(5,2),
    status VARCHAR(30) DEFAULT 'draft', -- 'draft', 'submitted', 'approved', 'rejected'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    submitted_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT check_eval_status CHECK (status IN ('draft', 'submitted', 'approved', 'rejected'))
);

-- ========================================
-- 8. الإجابات (Answers)
-- ========================================

CREATE TABLE answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    evaluation_id UUID REFERENCES evaluations(id) ON DELETE CASCADE NOT NULL,
    question_id UUID REFERENCES questions(id) NOT NULL,
    answer_value TEXT, -- قيمة الإجابة (نص، نعم/لا، رقم)
    score DECIMAL(10,2), -- الدرجة المحتسبة
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_eval_question UNIQUE(evaluation_id, question_id)
);

-- ========================================
-- 9. التقارير (Reports Cache)
-- ========================================

CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_type VARCHAR(50) NOT NULL, -- 'center_ranking', 'manager_compliance', 'period_summary'
    report_period VARCHAR(50), -- 'monthly', 'quarterly', 'yearly'
    start_date DATE,
    end_date DATE,
    filters JSONB,
    data JSONB NOT NULL,
    generated_by UUID REFERENCES users(id),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 10. سجل النشاطات (Audit Log)
-- ========================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- INDEXES للأداء
-- ========================================

-- Users & Roles
CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_users_center ON users(center_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active);

-- Centers
CREATE INDEX idx_centers_manager ON centers(manager_id);
CREATE INDEX idx_centers_code ON centers(code);
CREATE INDEX idx_centers_active ON centers(is_active);

-- Employees
CREATE INDEX idx_employees_center ON employees(center_id);
CREATE INDEX idx_employees_manager ON employees(manager_id);
CREATE INDEX idx_employees_user ON employees(user_id);

-- Forms & Questions
CREATE INDEX idx_forms_type ON forms(form_type);
CREATE INDEX idx_forms_active ON forms(is_active);
CREATE INDEX idx_questions_form ON questions(form_id);
CREATE INDEX idx_questions_order ON questions(form_id, order_index);

-- Visits
CREATE INDEX idx_visits_center ON visits(center_id);
CREATE INDEX idx_visits_date ON visits(visit_date);
CREATE INDEX idx_visits_period ON visits(visit_year, visit_month);
CREATE INDEX idx_visits_status ON visits(status);

-- Evaluations
CREATE INDEX idx_evaluations_form ON evaluations(form_id);
CREATE INDEX idx_evaluations_evaluator ON evaluations(evaluator_id);
CREATE INDEX idx_evaluations_evaluated_user ON evaluations(evaluated_user_id);
CREATE INDEX idx_evaluations_center ON evaluations(evaluated_center_id);
CREATE INDEX idx_evaluations_visit ON evaluations(visit_id);
CREATE INDEX idx_evaluations_date ON evaluations(evaluation_date);
CREATE INDEX idx_evaluations_status ON evaluations(status);

-- Answers
CREATE INDEX idx_answers_evaluation ON answers(evaluation_id);
CREATE INDEX idx_answers_question ON answers(question_id);

-- Audit Logs
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_table ON audit_logs(table_name);
CREATE INDEX idx_audit_created ON audit_logs(created_at);

-- ========================================
-- FUNCTIONS & TRIGGERS
-- ========================================

-- تحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- تطبيق الـ trigger على كل الجداول
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_centers_updated_at BEFORE UPDATE ON centers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forms_updated_at BEFORE UPDATE ON forms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_visits_updated_at BEFORE UPDATE ON visits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_evaluations_updated_at BEFORE UPDATE ON evaluations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_answers_updated_at BEFORE UPDATE ON answers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- حساب الدرجات تلقائياً
-- ========================================

CREATE OR REPLACE FUNCTION calculate_evaluation_score()
RETURNS TRIGGER AS $$
DECLARE
    v_total_score DECIMAL(10,2);
    v_max_score DECIMAL(10,2);
    v_percentage DECIMAL(5,2);
BEGIN
    -- حساب مجموع الدرجات
    SELECT COALESCE(SUM(score), 0)
    INTO v_total_score
    FROM answers
    WHERE evaluation_id = NEW.evaluation_id;
    
    -- الحصول على الحد الأقصى للدرجة
    SELECT max_score
    INTO v_max_score
    FROM forms
    WHERE id = (SELECT form_id FROM evaluations WHERE id = NEW.evaluation_id);
    
    -- حساب النسبة المئوية
    IF v_max_score > 0 THEN
        v_percentage := (v_total_score / v_max_score) * 100;
    ELSE
        v_percentage := 0;
    END IF;
    
    -- تحديث جدول التقييمات
    UPDATE evaluations
    SET total_score = v_total_score,
        percentage = v_percentage
    WHERE id = NEW.evaluation_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_score_after_answer
AFTER INSERT OR UPDATE ON answers
FOR EACH ROW EXECUTE FUNCTION calculate_evaluation_score();

-- ========================================
-- سجل التدقيق (Audit Trail)
-- ========================================

CREATE OR REPLACE FUNCTION log_audit_trail()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values)
        VALUES (
            auth.uid(),
            TG_OP,
            TG_TABLE_NAME,
            OLD.id,
            row_to_json(OLD)
        );
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values)
        VALUES (
            auth.uid(),
            TG_OP,
            TG_TABLE_NAME,
            NEW.id,
            row_to_json(OLD),
            row_to_json(NEW)
        );
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values)
        VALUES (
            auth.uid(),
            TG_OP,
            TG_TABLE_NAME,
            NEW.id,
            row_to_json(NEW)
        );
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- البيانات الأساسية (Seed Data)
-- ========================================

-- الأدوار
INSERT INTO roles (name, name_ar, description) VALUES
    ('admin', 'مدير النظام', 'Full system access'),
    ('manager', 'مدير قسم', 'Manage department and employees'),
    ('employee', 'موظف', 'Self-evaluation access'),
    ('reviewer', 'مراجع', 'Read-only access for reports');

-- ========================================
-- VIEWS للتقارير
-- ========================================

-- عرض ترتيب المراكز
CREATE OR REPLACE VIEW v_center_rankings AS
SELECT 
    c.id,
    c.code,
    c.name_ar,
    COUNT(DISTINCT e.id) as total_evaluations,
    AVG(e.percentage) as avg_percentage,
    MAX(e.evaluation_date) as last_evaluation_date,
    RANK() OVER (ORDER BY AVG(e.percentage) DESC) as ranking
FROM centers c
LEFT JOIN evaluations e ON e.evaluated_center_id = c.id AND e.status = 'submitted'
WHERE c.is_active = true
GROUP BY c.id, c.code, c.name_ar;

-- عرض التزام المديرين
CREATE OR REPLACE VIEW v_manager_compliance AS
SELECT 
    u.id,
    u.full_name,
    c.name_ar as center_name,
    COUNT(e.id) as evaluations_count,
    COUNT(CASE WHEN e.status = 'submitted' THEN 1 END) as submitted_count,
    MAX(e.evaluation_date) as last_evaluation_date,
    CASE 
        WHEN COUNT(e.id) = 0 THEN 'غير ملتزم'
        WHEN COUNT(CASE WHEN e.status = 'submitted' THEN 1 END) >= COUNT(emp.id) THEN 'ملتزم'
        ELSE 'التزام جزئي'
    END as compliance_status
FROM users u
INNER JOIN roles r ON u.role_id = r.id AND r.name = 'manager'
LEFT JOIN centers c ON u.center_id = c.id
LEFT JOIN employees emp ON emp.manager_id = u.id
LEFT JOIN evaluations e ON e.evaluator_id = u.id
WHERE u.is_active = true
GROUP BY u.id, u.full_name, c.name_ar;

-- عرض حالة إدخال الموظفين
CREATE OR REPLACE VIEW v_employee_submission_status AS
SELECT 
    emp.id,
    u.full_name,
    c.name_ar as center_name,
    mgr.full_name as manager_name,
    COUNT(e.id) as total_submissions,
    MAX(e.evaluation_date) as last_submission_date,
    CASE 
        WHEN COUNT(e.id) > 0 THEN 'تم الإدخال'
        ELSE 'لم يتم الإدخال'
    END as submission_status
FROM employees emp
INNER JOIN users u ON emp.user_id = u.id
LEFT JOIN centers c ON emp.center_id = c.id
LEFT JOIN users mgr ON emp.manager_id = mgr.id
LEFT JOIN evaluations e ON e.evaluator_id = u.id AND e.status IN ('submitted', 'approved')
WHERE emp.is_active = true
GROUP BY emp.id, u.full_name, c.name_ar, mgr.full_name;

COMMENT ON TABLE roles IS 'جدول الأدوار والصلاحيات';
COMMENT ON TABLE users IS 'جدول المستخدمين مرتبط مع Supabase Auth';
COMMENT ON TABLE centers IS 'جدول مراكز خدمة العملاء';
COMMENT ON TABLE employees IS 'جدول الموظفين';
COMMENT ON TABLE forms IS 'جدول نماذج التقييم';
COMMENT ON TABLE questions IS 'جدول الأسئلة';
COMMENT ON TABLE visits IS 'جدول الزيارات الميدانية';
COMMENT ON TABLE evaluations IS 'جدول التقييمات';
COMMENT ON TABLE answers IS 'جدول الإجابات';
COMMENT ON TABLE reports IS 'جدول التقارير المؤقتة';
COMMENT ON TABLE audit_logs IS 'سجل التدقيق والنشاطات';
