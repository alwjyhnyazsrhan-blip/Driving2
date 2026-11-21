import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  UserCheck,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { Courier } from '../types';

interface CourierModalProps {
  isOpen: boolean;
  onClose: () => void;
  courierToEdit?: Courier | null;
  onSave: (courierData: Partial<Courier>) => void;
}

export const CourierModal: React.FC<CourierModalProps> = ({
  isOpen,
  onClose,
  courierToEdit,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [accountsInput, setAccountsInput] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'active' | 'idle' | 'off_duty'>('active');
  const [notes, setNotes] = useState('');
  const [portalPassword, setPortalPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [clearPortalPassword, setClearPortalPassword] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    setFormError('');
    setShowPassword(false);
    setClearPortalPassword(false);
    setPortalPassword('');
    if (courierToEdit) {
      setName(courierToEdit.name);
      setAccountsInput(courierToEdit.locatAccounts.join(', '));
      setPhone(courierToEdit.phone);
      setStatus(courierToEdit.status);
      setNotes(courierToEdit.notes || '');
    } else {
      setName('');
      setAccountsInput('');
      setPhone('+9665');
      setStatus('active');
      setNotes('');
    }
  }, [courierToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim() || !phone.trim()) {
      setFormError('يرجى إدخال اسم المندوب ورقم الواتساب');
      return;
    }

    const trimmedPass = portalPassword.trim();
    if (trimmedPass && trimmedPass.length < 4) {
      setFormError('كلمة مرور بوابة المندوب يجب أن لا تقل عن 4 أحرف أو أرقام');
      return;
    }

    const locatAccounts = accountsInput
      .split(',')
      .map((acc) => acc.trim())
      .filter(Boolean);

    onSave({
      id: courierToEdit ? courierToEdit.id : undefined,
      name: name.trim(),
      locatAccounts: locatAccounts.length > 0 ? locatAccounts : [`drv_${Date.now().toString().slice(-4)}`],
      phone: phone.trim(),
      status,
      notes: notes.trim(),
      ...(trimmedPass ? { portalPassword: trimmedPass } : {}),
      ...(clearPortalPassword && !trimmedPass ? { clearPortalPassword: true } : {}),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900">
                {courierToEdit ? 'تعديل بيانات المندوب وحساباته' : 'إضافة مندوب جديد إلى لوكيت'}
              </h2>
              <p className="text-xs text-slate-500">
                ربط حسابات لوكيت المتعددة برقم الواتساب وكلمة مرور بوابة المندوب
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2 font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              اسم المندوب الثلاثي:
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: أحمد عبد الله الشمري"
              className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-400 focus:outline-none"
              required
            />
          </div>

          {/* Locat Accounts - Allows multiple accounts */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
            <label className="block font-bold text-slate-800">
              حسابات المندوب في لوكيت (Locat Accounts / Driver IDs):
            </label>
            <p className="text-[11px] text-slate-500">
              إذا كان المندوب يتنقل بين عدة حسابات أو ورديات، أدخل أسماء الحسابات مفصولة بفاصلة (,) ليتمكن النظام من التعرف عليه تلقائياً:
            </p>
            <input
              type="text"
              value={accountsInput}
              onChange={(e) => setAccountsInput(e.target.value)}
              placeholder="مثال: ahmed_locat, DRV-101, ahmed_shift_night"
              className="w-full font-mono text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-400 focus:outline-none"
              dir="ltr"
            />
            <span className="text-[10px] text-slate-400 block">
              سيتم توجيه تنبيهات أي طلب مسند لأي من هذه الحسابات إلى نفس رقم الواتساب المسجل أدناه.
            </span>
          </div>

          {/* WhatsApp Phone */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              رقم الواتساب / الجوال (يستخدم أيضاً لتسجيل دخول المندوب):
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+966501234567"
              className="w-full font-mono text-sm px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-400 focus:outline-none text-left"
              dir="ltr"
              required
            />
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              يجب أن يبدأ بالرمز الدولي، مثل: +966 أو 00966
            </span>
          </div>

          {/* Portal Password */}
          <div className="bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-200 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label className="font-bold text-indigo-950 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                <span>كلمة مرور بوابة المندوب (لمتابعة طلباته وإنجازه الشهري):</span>
              </label>
              {courierToEdit?.hasPortalPassword && !clearPortalPassword && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  <ShieldCheck className="w-3 h-3" />
                  مفعّلة
                </span>
              )}
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={portalPassword}
                onChange={(e) => {
                  setPortalPassword(e.target.value);
                  if (e.target.value.trim()) setClearPortalPassword(false);
                }}
                placeholder={
                  courierToEdit?.hasPortalPassword && !clearPortalPassword
                    ? 'اتركه فارغاً للإبقاء على كلمة المرور الحالية، أو أدخل كلمة جديدة للتغيير'
                    : 'أدخل كلمة مرور (4 أحرف أو أرقام على الأقل)'
                }
                className="w-full font-mono text-xs px-3 py-2 pl-9 bg-white border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none text-left"
                dir="ltr"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                title={showPassword ? 'إخفاء' : 'إظهار'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center justify-between gap-2 text-[10px] text-indigo-700">
              <span>يستطيع المندوب الدخول عبر رابطه الخاص باستخدام رقم جواله وهذه الكلمة.</span>
              {courierToEdit?.hasPortalPassword && (
                <button
                  type="button"
                  onClick={() => {
                    setClearPortalPassword((prev) => !prev);
                    if (!clearPortalPassword) setPortalPassword('');
                  }}
                  className={`font-bold underline shrink-0 ${
                    clearPortalPassword ? 'text-rose-700' : 'text-slate-500 hover:text-rose-600'
                  }`}
                >
                  {clearPortalPassword ? 'التراجع عن الإزالة' : 'إلغاء كلمة المرور'}
                </button>
              )}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">حالة المندوب:</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-400 focus:outline-none"
            >
              <option value="active">نشط في الميدان (يستقبل طلبات)</option>
              <option value="idle">متاح / انتظار</option>
              <option value="off_duty">خارج الوردية / إجازة</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">ملاحظات إدارية (اختياري):</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="مثال: يعمل في منطقة شمال الرياض، دراجة نارية..."
              className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-400 focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1.5 transition shadow-2xs"
            >
              <Save className="w-4 h-4" />
              <span>{courierToEdit ? 'حفظ التعديلات' : 'إضافة المندوب'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
