import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import {
  Plus, Edit, Trash2, Users, Calendar, Clock,
  Loader2, AlertCircle, X, Save, BookOpen,
  ChevronDown, ChevronUp, GraduationCap, Banknote
} from 'lucide-react';
import { groupsAPI } from '@/api/services';
import { toast } from 'sonner';

// ── Constants ─────────────────────────────────────────────────────────────────
const ACADEMIC_YEARS = [
  { value: 'first-prep',  label: 'الصف الأول الإعدادي',  color: '#6366f1', bg: '#eef2ff' },
  { value: 'second-prep', label: 'الصف الثاني الإعدادي', color: '#8b5cf6', bg: '#f5f3ff' },
  { value: 'third-prep',  label: 'الصف الثالث الإعدادي', color: '#a855f7', bg: '#faf5ff' },
  { value: 'first-sec',   label: 'الصف الأول الثانوي',   color: '#0ea5e9', bg: '#f0f9ff' },
  { value: 'second-sec',  label: 'الصف الثاني الثانوي',  color: '#14b8a6', bg: '#f0fdfa' },
  { value: 'third-sec',   label: 'الصف الثالث الثانوي',  color: '#f43f5e', bg: '#fff1f2' },
];

const DAYS_OF_WEEK = [
  'السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة',
];

const EMPTY_SESSION = { day: '', time: '' };
const EMPTY_FORM = {
  name: '',
  academicYear: '',
  session1: { ...EMPTY_SESSION },
  session2: { ...EMPTY_SESSION },
  monthlyFee: '',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function getYearMeta(value) {
  return ACADEMIC_YEARS.find(y => y.value === value) || ACADEMIC_YEARS[0];
}

function formToPayload(form) {
  const schedule = [];
  if (form.session1.day && form.session1.time) schedule.push({ ...form.session1 });
  if (form.session2.day && form.session2.time) schedule.push({ ...form.session2 });
  return {
    name:         form.name.trim(),
    academicYear: form.academicYear,
    schedule,
    monthlyFee:   form.monthlyFee ? Number(form.monthlyFee) : 0,
  };
}

function groupToForm(group) {
  const s = group.schedule || [];
  return {
    name:         group.name,
    academicYear: group.academicYear,
    session1:     s[0] ? { day: s[0].day, time: s[0].time } : { ...EMPTY_SESSION },
    session2:     s[1] ? { day: s[1].day, time: s[1].time } : { ...EMPTY_SESSION },
    monthlyFee:   group.monthlyFee || '',
  };
}

// ── SessionPicker ─────────────────────────────────────────────────────────────
function SessionPicker({ label, value, onChange, otherDay }) {
  return (
    <div style={{
      background: 'var(--session-bg, #f8fafc)',
      border: '1.5px solid var(--session-border, #e2e8f0)',
      borderRadius: '12px',
      padding: '14px 16px',
    }}>
      <p style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '10px', letterSpacing: '0.05em' }}>
        {label}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {/* Day select */}
        <div>
          <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>اليوم</label>
          <select
            value={value.day}
            onChange={e => onChange({ ...value, day: e.target.value })}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1.5px solid #e2e8f0',
              fontSize: '14px',
              background: 'white',
              color: value.day ? '#1e293b' : '#94a3b8',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="">اختر يوم...</option>
            {DAYS_OF_WEEK.filter(d => d !== otherDay).map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        {/* Time input */}
        <div>
          <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>الوقت</label>
          <input
            type="time"
            value={value.time}
            onChange={e => onChange({ ...value, time: e.target.value })}
            disabled={!value.day}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1.5px solid #e2e8f0',
              fontSize: '14px',
              background: value.day ? 'white' : '#f1f5f9',
              color: '#1e293b',
              outline: 'none',
              direction: 'ltr',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>
      {value.day && value.time && (
        <div style={{
          marginTop: '8px',
          padding: '6px 10px',
          background: '#ecfdf5',
          borderRadius: '6px',
          fontSize: '12px',
          color: '#059669',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          <span>✓</span>
          <span>
            {value.day} — {(() => {
              try {
                const [h, m] = value.time.split(':');
                const hour = Number(h);
                const suffix = hour >= 12 ? 'م' : 'ص';
                const h12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
                return `${h12}:${m} ${suffix}`;
              } catch { return value.time; }
            })()}
          </span>
        </div>
      )}
    </div>
  );
}

// ── GroupModal ────────────────────────────────────────────────────────────────
function GroupModal({ group, onClose, onSaved }) {
  const isEdit = !!group;
  const [form, setForm] = useState(isEdit ? groupToForm(group) : EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const setField = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('اسم المجموعة مطلوب'); return; }
    if (!form.academicYear) { toast.error('السنة الدراسية مطلوبة'); return; }

    // Validate sessions are complete if day is set
    if (form.session1.day && !form.session1.time) { toast.error('حدد وقت اليوم الأول'); return; }
    if (form.session2.day && !form.session2.time) { toast.error('حدد وقت اليوم الثاني'); return; }
    if (form.session1.day && form.session2.day && form.session1.day === form.session2.day) {
      toast.error('يجب أن يكون اليومان مختلفين'); return;
    }

    setSaving(true);
    try {
      const payload = formToPayload(form);
      if (isEdit) {
        await groupsAPI.update(group._id, payload);
        toast.success('تم تعديل المجموعة بنجاح ✅');
      } else {
        await groupsAPI.create(payload);
        toast.success('تم إنشاء المجموعة بنجاح ✅');
      }
      onSaved();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'فشلت العملية، تحقق من الاتصال بالخادم');
    } finally {
      setSaving(false);
    }
  };

  const selectedYear = ACADEMIC_YEARS.find(y => y.value === form.academicYear);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '20px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
          width: '100%',
          maxWidth: '520px',
          maxHeight: '90vh',
          overflowY: 'auto',
          direction: 'rtl',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '1px solid #f1f5f9',
          background: selectedYear ? `linear-gradient(135deg, ${selectedYear.bg}, white)` : 'white',
          borderRadius: '20px 20px 0 0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: selectedYear ? `${selectedYear.color}20` : '#f1f5f9',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Users size={20} color={selectedYear?.color || '#64748b'} />
            </div>
            <h3 style={{ fontWeight: 800, fontSize: '18px', color: '#1e293b', margin: 0 }}>
              {isEdit ? 'تعديل المجموعة' : 'إضافة مجموعة جديدة'}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px', height: '32px', borderRadius: '8px',
              border: 'none', background: '#f1f5f9', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={16} color="#64748b" />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Name */}
          <div>
            <label style={{ fontSize: '13px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '6px' }}>
              اسم المجموعة <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              value={form.name}
              onChange={e => setField('name', e.target.value)}
              placeholder="مثال: مجموعة النخبة أ"
              style={{
                width: '100%', padding: '10px 14px', borderRadius: '10px',
                border: '1.5px solid #e2e8f0', fontSize: '14px',
                outline: 'none', boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = '#6366f1'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          {/* Academic Year */}
          <div>
            <label style={{ fontSize: '13px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '8px' }}>
              السنة الدراسية <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {ACADEMIC_YEARS.map(y => (
                <button
                  key={y.value}
                  onClick={() => !isEdit && setField('academicYear', y.value)}
                  disabled={isEdit}
                  style={{
                    padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                    border: `2px solid ${form.academicYear === y.value ? y.color : '#e2e8f0'}`,
                    background: form.academicYear === y.value ? y.bg : 'white',
                    color: form.academicYear === y.value ? y.color : '#64748b',
                    cursor: isEdit ? 'default' : 'pointer',
                    transition: 'all 0.15s',
                    opacity: isEdit ? 0.75 : 1,
                  }}
                >
                  {y.label}
                </button>
              ))}
            </div>
          </div>

          {/* Schedule */}
          <div>
            <label style={{ fontSize: '13px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '10px' }}>
              <Calendar size={14} style={{ display: 'inline', marginLeft: '6px', verticalAlign: 'middle' }} />
              جدول المجموعة (يومان في الأسبوع)
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <SessionPicker
                label="📅 اليوم الأول"
                value={form.session1}
                onChange={v => setField('session1', v)}
                otherDay={form.session2.day}
              />
              <SessionPicker
                label="📅 اليوم الثاني"
                value={form.session2}
                onChange={v => setField('session2', v)}
                otherDay={form.session1.day}
              />
            </div>
          </div>

          {/* Monthly Fee */}
          <div>
            <label style={{ fontSize: '13px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '6px' }}>
              <Banknote size={14} style={{ display: 'inline', marginLeft: '6px', verticalAlign: 'middle' }} />
              القسط الشهري (ج.م)
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                min="0"
                value={form.monthlyFee}
                onChange={e => setField('monthlyFee', e.target.value)}
                placeholder="0"
                style={{
                  width: '100%', padding: '10px 14px', paddingLeft: '50px',
                  borderRadius: '10px', border: '1.5px solid #e2e8f0',
                  fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                  direction: 'ltr', textAlign: 'right',
                }}
                onFocus={e => e.target.style.borderColor = '#6366f1'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
              <span style={{
                position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                fontSize: '12px', fontWeight: 700, color: '#94a3b8',
              }}>ج.م</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', gap: '12px', padding: '16px 24px',
          borderTop: '1px solid #f1f5f9',
        }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              flex: 1, padding: '11px', borderRadius: '10px',
              border: '1.5px solid #e2e8f0', background: 'white',
              fontSize: '14px', fontWeight: 600, color: '#64748b',
              cursor: 'pointer',
            }}
          >
            إلغاء
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 1, padding: '11px', borderRadius: '10px',
              border: 'none',
              background: saving ? '#c7d2fe' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              fontSize: '14px', fontWeight: 700, color: 'white',
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              boxShadow: saving ? 'none' : '0 4px 12px rgba(99,102,241,0.4)',
              transition: 'all 0.2s',
            }}
          >
            {saving
              ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> جاري الحفظ...</>
              : <><Save size={16} /> {isEdit ? 'حفظ التعديلات' : 'إضافة المجموعة'}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ConfirmDelete ─────────────────────────────────────────────────────────────
function ConfirmDelete({ group, onClose, onDeleted }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await groupsAPI.remove(group._id);
      toast.success('تم حذف المجموعة بنجاح');
      onDeleted();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'فشل الحذف');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white', borderRadius: '20px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
          width: '100%', maxWidth: '380px', padding: '28px',
          direction: 'rtl', textAlign: 'center',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{
          width: '60px', height: '60px', borderRadius: '50%',
          background: '#fee2e2', margin: '0 auto 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Trash2 size={28} color="#ef4444" />
        </div>
        <h3 style={{ fontWeight: 800, fontSize: '18px', color: '#1e293b', marginBottom: '8px' }}>تأكيد الحذف</h3>
        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px', lineHeight: 1.6 }}>
          هل تريد حذف مجموعة <strong style={{ color: '#1e293b' }}>{group.name}</strong>؟
          <br />لا يمكن التراجع عن هذا الإجراء.
        </p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              flex: 1, padding: '11px', borderRadius: '10px',
              border: '1.5px solid #e2e8f0', background: 'white',
              fontSize: '14px', fontWeight: 600, color: '#64748b', cursor: 'pointer',
            }}
          >
            إلغاء
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            style={{
              flex: 1, padding: '11px', borderRadius: '10px',
              border: 'none', background: loading ? '#fca5a5' : '#ef4444',
              fontSize: '14px', fontWeight: 700, color: 'white',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}
          >
            {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={16} />}
            حذف
          </button>
        </div>
      </div>
    </div>
  );
}

// ── GroupCard ─────────────────────────────────────────────────────────────────
function GroupCard({ group, yearMeta, onEdit, onDelete }) {
  const schedule = group.schedule || [];

  function formatTime(timeStr) {
    if (!timeStr) return '';
    try {
      const [h, m] = timeStr.split(':');
      const hour = Number(h);
      const suffix = hour >= 12 ? 'م' : 'ص';
      const h12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      return `${h12}:${m} ${suffix}`;
    } catch { return timeStr; }
  }

  return (
    <div style={{
      background: 'white',
      border: '1.5px solid #e2e8f0',
      borderRadius: '16px',
      overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      transition: 'box-shadow 0.2s, border-color 0.2s',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = `0 8px 24px rgba(0,0,0,0.10)`;
        e.currentTarget.style.borderColor = yearMeta.color;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
        e.currentTarget.style.borderColor = '#e2e8f0';
      }}
    >
      {/* Card top strip */}
      <div style={{ height: '4px', background: `linear-gradient(90deg, ${yearMeta.color}, ${yearMeta.color}88)` }} />

      <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Name + count */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h4 style={{ fontWeight: 800, fontSize: '16px', color: '#1e293b', margin: 0 }}>{group.name}</h4>
          <span style={{
            padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
            background: `${yearMeta.color}18`, color: yearMeta.color,
            display: 'flex', alignItems: 'center', gap: '4px',
          }}>
            <Users size={12} />
            {group.studentCount || 0} طالب
          </span>
        </div>

        {/* Schedule */}
        {schedule.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {schedule.map((s, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '7px 10px', borderRadius: '8px',
                background: i === 0 ? '#f0f9ff' : '#fdf4ff',
              }}>
                <Calendar size={13} color={i === 0 ? '#0ea5e9' : '#a855f7'} />
                <span style={{ fontWeight: 700, fontSize: '13px', color: '#334155' }}>{s.day}</span>
                <span style={{ color: '#94a3b8', fontSize: '12px', marginRight: 'auto' }}>
                  <Clock size={11} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '3px' }} />
                  {formatTime(s.time)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: '12px', color: '#cbd5e1', fontStyle: 'italic', margin: 0 }}>لم يُحدد جدول بعد</p>
        )}

        {/* Fee */}
        {group.monthlyFee > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '7px 10px', borderRadius: '8px', background: '#f0fdf4',
          }}>
            <Banknote size={13} color="#16a34a" />
            <span style={{ fontSize: '13px', color: '#374151' }}>القسط الشهري</span>
            <span style={{ fontWeight: 800, fontSize: '14px', color: '#16a34a', marginRight: 'auto' }}>
              {group.monthlyFee} ج.م
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{
        display: 'flex', gap: '0',
        borderTop: '1px solid #f1f5f9',
      }}>
        <button
          onClick={() => onEdit(group)}
          style={{
            flex: 1, padding: '11px', border: 'none',
            background: 'white', fontSize: '13px', fontWeight: 600,
            color: '#6366f1', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            borderRadius: '0 0 14px 0',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#f0f0ff'}
          onMouseLeave={e => e.currentTarget.style.background = 'white'}
        >
          <Edit size={14} /> تعديل
        </button>
        <div style={{ width: '1px', background: '#f1f5f9' }} />
        <button
          onClick={() => onDelete(group)}
          style={{
            flex: 1, padding: '11px', border: 'none',
            background: 'white', fontSize: '13px', fontWeight: 600,
            color: '#ef4444', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            borderRadius: '0 0 0 14px',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#fff0f0'}
          onMouseLeave={e => e.currentTarget.style.background = 'white'}
        >
          <Trash2 size={14} /> حذف
        </button>
      </div>
    </div>
  );
}

// ── YearSection ───────────────────────────────────────────────────────────────
function YearSection({ yearMeta, groups, onEdit, onDelete }) {
  const [open, setOpen] = useState(true);
  const totalStudents = groups.reduce((s, g) => s + (g.studentCount || 0), 0);

  return (
    <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1.5px solid #e2e8f0' }}>
      {/* Section header */}
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          width: '100%', padding: '16px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: `linear-gradient(135deg, ${yearMeta.bg}, white)`,
          border: 'none', cursor: 'pointer', direction: 'rtl',
          borderBottom: open ? `1px solid ${yearMeta.color}30` : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '12px',
            background: `${yearMeta.color}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <GraduationCap size={20} color={yearMeta.color} />
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontWeight: 800, fontSize: '16px', color: '#1e293b', margin: 0 }}>{yearMeta.label}</p>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0' }}>
              {groups.length} مجموعة • {totalStudents} طالب إجمالاً
            </p>
          </div>
        </div>
        <div style={{ color: yearMeta.color }}>
          {open ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </button>

      {/* Cards grid */}
      {open && (
        <div style={{
          padding: '20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '16px',
          background: '#fafafa',
        }}>
          {groups.map(g => (
            <GroupCard
              key={g._id}
              group={g}
              yearMeta={yearMeta}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function GroupsPage() {
  const [groups,   setGroups]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [modal,    setModal]    = useState(null);   // null | 'add' | { group }
  const [deleting, setDeleting] = useState(null);   // null | group

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await groupsAPI.getAll();
      setGroups(data.groups || []);
    } catch {
      setError('فشل تحميل المجموعات. تأكد من أن الخادم يعمل.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Group by academicYear — memoized so this only recomputes when `groups`
  // actually changes, not on every render.
  const byYear = useMemo(() => groups.reduce((acc, g) => {
    if (!acc[g.academicYear]) acc[g.academicYear] = [];
    acc[g.academicYear].push(g);
    return acc;
  }, {}), [groups]);

  const totalStudents = useMemo(
    () => groups.reduce((s, g) => s + (g.studentCount || 0), 0),
    [groups]
  );

  return (
    <>
      <Helmet><title>المجموعات الدراسية | نظام المعلم</title></Helmet>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
      `}</style>

      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', direction: 'rtl' }}>
        {/* ── Header ── */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
          gap: '16px', marginBottom: '28px',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          borderRadius: '20px', padding: '24px 28px',
          boxShadow: '0 8px 32px rgba(99,102,241,0.3)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '14px',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <BookOpen size={26} color="white" />
            </div>
            <div>
              <h2 style={{ fontWeight: 900, fontSize: '22px', color: 'white', margin: 0 }}>المجموعات الدراسية</h2>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '13px', margin: '4px 0 0' }}>
                {loading ? '...' : `${groups.length} مجموعة • ${totalStudents} طالب`}
              </p>
            </div>
          </div>
          <button
            onClick={() => setModal('add')}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '12px 20px', borderRadius: '12px',
              border: '2px solid rgba(255,255,255,0.4)',
              background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
              fontSize: '14px', fontWeight: 700, color: 'white',
              cursor: 'pointer', transition: 'background 0.2s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
          >
            <Plus size={18} /> إضافة مجموعة
          </button>
        </div>

        {/* ── Loading ── */}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
            <div style={{ textAlign: 'center' }}>
              <Loader2 size={40} color="#6366f1" style={{ animation: 'spin 1s linear infinite', marginBottom: '12px' }} />
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>جاري تحميل المجموعات...</p>
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '16px 20px', borderRadius: '14px',
            background: '#fef2f2', border: '1.5px solid #fecaca',
            marginBottom: '20px',
          }}>
            <AlertCircle size={20} color="#ef4444" />
            <span style={{ color: '#ef4444', fontWeight: 600, flex: 1 }}>{error}</span>
            <button
              onClick={load}
              style={{
                padding: '6px 14px', borderRadius: '8px',
                border: 'none', background: '#ef4444', color: 'white',
                fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              }}
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        {/* ── Empty ── */}
        {!loading && !error && groups.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '80px 20px',
            background: 'white', borderRadius: '20px',
            border: '2px dashed #e2e8f0',
            animation: 'fadeIn 0.4s ease',
          }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%',
              background: '#f0f0ff', margin: '0 auto 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Users size={32} color="#6366f1" />
            </div>
            <h3 style={{ fontWeight: 800, fontSize: '18px', color: '#1e293b', marginBottom: '8px' }}>لا توجد مجموعات بعد</h3>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px' }}>ابدأ بإضافة أول مجموعة دراسية</p>
            <button
              onClick={() => setModal('add')}
              style={{
                padding: '12px 24px', borderRadius: '12px',
                border: 'none', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: 'white', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
              }}
            >
              <Plus size={16} /> إضافة مجموعة جديدة
            </button>
          </div>
        )}

        {/* ── Groups by year ── */}
        {!loading && !error && groups.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.4s ease' }}>
            {ACADEMIC_YEARS.filter(y => byYear[y.value]?.length).map(year => (
              <YearSection
                key={year.value}
                yearMeta={year}
                groups={byYear[year.value]}
                onEdit={g => setModal({ group: g })}
                onDelete={g => setDeleting(g)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {modal === 'add' && (
        <GroupModal
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}
      {modal?.group && (
        <GroupModal
          group={modal.group}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}
      {deleting && (
        <ConfirmDelete
          group={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={() => { setDeleting(null); load(); }}
        />
      )}
    </>
  );
}