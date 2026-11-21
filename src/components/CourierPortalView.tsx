import React, { useState, useEffect, useCallback } from 'react';
import {
  Phone,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  LogOut,
  Package,
  CheckCircle2,
  Clock,
  Calendar,
  RefreshCw,
  Search,
  AlertTriangle,
  Store,
  MapPin,
  CreditCard,
  TrendingUp,
  Layers,
  XCircle,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { CourierPortalDashboardData, Order } from '../types';

function formatRiyadhDateTime(iso?: string, fallbackTime?: string): string {
  if (!iso) return fallbackTime || 'غير محدد';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return fallbackTime || 'غير محدد';
  return d.toLocaleString('ar-SA', {
    timeZone: 'Asia/Riyadh',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDayLabel(dateKey: string): string {
  const parts = dateKey.split('-');
  if (parts.length !== 3) return dateKey;
  const d = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12, 0, 0));
  if (isNaN(d.getTime())) return dateKey;
  return d.toLocaleDateString('ar-SA', {
    timeZone: 'Asia/Riyadh',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function getOrderStatusBadge(order: Order) {
  if (order.isCanceled || order.status === 'cancelled') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
        <XCircle className="w-3 h-3" />
        ملغي
      </span>
    );
  }
  if (order.isDelivered || order.status === 'delivered') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
        <CheckCircle2 className="w-3 h-3" />
        تم التوصيل
      </span>
    );
  }
  if (order.isDelayed || order.status === 'delayed') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
        <AlertTriangle className="w-3 h-3" />
        متأخر ({order.elapsedMinutes} د)
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
      <Clock className="w-3 h-3" />
      قيد التوصيل ({order.elapsedMinutes} د)
    </span>
  );
}

export const CourierPortalView: React.FC = () => {
  const initialPhone =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('phone') || ''
      : '';

  // Auth token stays exclusively in React state memory (never localStorage/sessionStorage)
  const [token, setToken] = useState<string | null>(null);
  const [phone, setPhone] = useState<string>(initialPhone);
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string>('');

  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [dashboard, setDashboard] = useState<CourierPortalDashboardData | null>(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState<boolean>(false);
  const [dashboardError, setDashboardError] = useState<string>('');

  const [orderFilter, setOrderFilter] = useState<'all' | 'delivered' | 'active' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchDashboard = useCallback(
    async (authToken: string, monthOverride?: string) => {
      setIsLoadingDashboard(true);
      setDashboardError('');
      try {
        const monthParam = monthOverride !== undefined ? monthOverride : selectedMonth;
        const url = monthParam
          ? `/api/courier-portal/dashboard?month=${encodeURIComponent(monthParam)}`
          : '/api/courier-portal/dashboard';
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        const data = await res.json();
        if (res.status === 401 || !data.success) {
          if (res.status === 401) {
            setToken(null);
            setDashboard(null);
            setLoginError(data.message || 'انتهت الجلسة، يرجى تسجيل الدخول مجدداً');
          } else {
            setDashboardError(data.message || 'تعذر تحميل بيانات المندوب');
          }
          return;
        }
        setDashboard(data.dashboard);
        if (!selectedMonth && data.dashboard?.monthKey) {
          setSelectedMonth(data.dashboard.monthKey);
        }
      } catch {
        setDashboardError('تعذر الاتصال بالخادم لتحديث الطلبات');
      } finally {
        setIsLoadingDashboard(false);
      }
    },
    [selectedMonth]
  );

  useEffect(() => {
    if (!token) return;
    fetchDashboard(token);
    const interval = setInterval(() => {
      fetchDashboard(token);
    }, 30000);
    return () => clearInterval(interval);
  }, [token, fetchDashboard]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!phone.trim() || !password.trim()) {
      setLoginError('يرجى إدخال رقم الجوال وكلمة المرور');
      return;
    }

    setIsLoggingIn(true);
    try {
      const res = await fetch('/api/courier-portal/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.trim(),
          password: password.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.token) {
        setLoginError(data.message || 'رقم الجوال أو كلمة المرور غير صحيحة');
        return;
      }
      setPassword('');
      setToken(data.token);
    } catch {
      setLoginError('تعذر الاتصال بالخادم، يرجى المحاولة مرة أخرى');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setDashboard(null);
    setPassword('');
    setLoginError('');
  };

  const handleMonthChange = (newMonth: string) => {
    setSelectedMonth(newMonth);
    if (token) {
      fetchDashboard(token, newMonth);
    }
  };

  // --- LOGIN VIEW ---
  if (!token) {
    return (
      <div
        dir="rtl"
        className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 font-sans text-slate-900"
      >
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
          <div className="bg-emerald-600 px-6 py-6 text-white text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center mx-auto border border-white/25">
              <Package className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">بوابة المندوب | متابعة الطلبات</h1>
            <p className="text-xs text-emerald-50">
              سجّل الدخول برقم جوالك وكلمة المرور للاطلاع على طلباتك وإحصائياتك الشهرية
            </p>
          </div>

          <form onSubmit={handleLogin} className="p-6 space-y-4 text-xs">
            {loginError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2 font-bold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">رقم الجوال:</label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="05XXXXXXXX أو 9665XXXXXXXX"
                  className="w-full font-mono text-sm px-3.5 py-2.5 pr-10 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none text-left"
                  dir="ltr"
                  autoComplete="tel"
                  required
                />
                <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">كلمة المرور:</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور المعطاة من الإدارة"
                  className="w-full font-mono text-sm px-3.5 py-2.5 pr-10 pl-10 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none text-left"
                  dir="ltr"
                  autoComplete="current-password"
                  required
                />
                <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري التحقق...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>دخول إلى حسابي</span>
                </>
              )}
            </button>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-center text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                دخول خاص ومشفر للمندوب
              </span>
            </div>
          </form>
        </div>
      </div>
    );
  }

  const filteredMonthlyOrders = (dashboard?.monthlyOrders || []).filter((order) => {
    const isDel = Boolean(order.isDelivered || order.status === 'delivered');
    const isCan = Boolean(order.isCanceled || order.status === 'cancelled');
    const isAct = !isDel && !isCan;

    if (orderFilter === 'delivered' && !isDel) return false;
    if (orderFilter === 'active' && !isAct) return false;
    if (orderFilter === 'cancelled' && !isCan) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        order.id.toLowerCase().includes(q) ||
        (order.restaurant || '').toLowerCase().includes(q) ||
        (order.customerAddress || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  // --- AUTHENTICATED COURIER DASHBOARD ---
  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-10">
      {/* Top Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-2xs">
        <div className="max-w-5xl mx-auto px-4 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
              {dashboard?.courier.name ? dashboard.courier.name.slice(0, 1) : 'م'}
            </div>
            <div>
              <h1 className="font-bold text-sm sm:text-base text-slate-900">
                {dashboard?.courier.name || 'حساب المندوب'}
              </h1>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono" dir="ltr">
                <span>{dashboard?.courier.phone || phone}</span>
                {dashboard?.courier.status === 'active' && (
                  <span className="font-sans px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    نشط
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Month Picker */}
            {dashboard?.availableMonths && dashboard.availableMonths.length > 0 && (
              <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <select
                  value={selectedMonth || dashboard.monthKey}
                  onChange={(e) => handleMonthChange(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  {dashboard.availableMonths.map((mk) => (
                    <option key={mk} value={mk}>
                      {mk}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={() => token && fetchDashboard(token)}
              disabled={isLoadingDashboard}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDashboard ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">تحديث</span>
            </button>

            <button
              onClick={handleLogout}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>خروج</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-6 space-y-6">
        {dashboardError && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{dashboardError}</span>
          </div>
        )}

        {!dashboard && isLoadingDashboard ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
            <p className="text-xs font-bold text-slate-600">جاري تحميل بيانات وطلبات المندوب...</p>
          </div>
        ) : dashboard ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-emerald-600 text-white rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-emerald-100 text-xs font-semibold">
                  <span>المنجز خلال {dashboard.monthLabel}</span>
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div className="mt-3">
                  <div className="text-3xl font-extrabold">{dashboard.summary.deliveredThisMonth}</div>
                  <div className="text-[11px] text-emerald-100 mt-1">
                    من إجمالي {dashboard.summary.totalOrdersThisMonth} طلب مسجل هذا الشهر
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                  <span>طلبات اليوم المنجزة</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="mt-3">
                  <div className="text-3xl font-extrabold text-slate-900">{dashboard.summary.deliveredToday}</div>
                  <div className="text-[11px] text-slate-500 mt-1">تم تسليمها اليوم</div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                  <span>الطلبات النشطة الآن</span>
                  <Layers className="w-4 h-4 text-blue-600" />
                </div>
                <div className="mt-3">
                  <div className="text-3xl font-extrabold text-slate-900">{dashboard.summary.activeNow}</div>
                  <div className="text-[11px] mt-1">
                    {dashboard.summary.delayedNow > 0 ? (
                      <span className="text-rose-600 font-bold">منها {dashboard.summary.delayedNow} متأخر</span>
                    ) : (
                      <span className="text-slate-500">قيد التوصيل حالياً</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                  <span>متوسط وقت التوصيل</span>
                  <Clock className="w-4 h-4 text-amber-500" />
                </div>
                <div className="mt-3">
                  <div className="text-3xl font-extrabold text-slate-900">
                    {dashboard.summary.avgDeliveryMinutesThisMonth}
                    <span className="text-sm font-bold text-slate-500 mr-1">دقيقة</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    طلبات ملغاة هذا الشهر: {dashboard.summary.canceledThisMonth}
                  </div>
                </div>
              </div>
            </div>

            {/* Active Orders Highlight */}
            {dashboard.activeOrders.length > 0 && (
              <section className="bg-white rounded-2xl border border-blue-200 p-4 sm:p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span>طلباتك النشطة حالياً ({dashboard.activeOrders.length})</span>
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {dashboard.activeOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className={`p-3.5 rounded-xl border space-y-2 ${
                        ord.isDelayed ? 'bg-rose-50/70 border-rose-200' : 'bg-blue-50/50 border-blue-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-bold text-sm text-slate-900">{ord.id}</span>
                        {getOrderStatusBadge(ord)}
                      </div>
                      <div className="text-xs text-slate-700 flex items-center gap-1.5 font-semibold">
                        <Store className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{ord.restaurant}</span>
                      </div>
                      {ord.customerAddress && (
                        <div className="text-[11px] text-slate-600 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{ord.customerAddress}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                        <span>الاستلام: {ord.pickupTime || formatRiyadhDateTime(ord.assignedAt || ord.createdAt)}</span>
                        {ord.deliveryCost && <span className="font-bold text-emerald-700">{ord.deliveryCost} ر.س</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Daily Breakdown for the Month */}
            {dashboard.dailyBreakdown.length > 0 && (
              <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-3">
                <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>التوزيع اليومي للطلبات خلال {dashboard.monthLabel}</span>
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                  {dashboard.dailyBreakdown.map((day) => (
                    <div
                      key={day.date}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1"
                    >
                      <div className="text-[11px] font-semibold text-slate-600">{formatDayLabel(day.date)}</div>
                      <div className="text-lg font-extrabold text-emerald-700">{day.delivered}</div>
                      <div className="text-[10px] text-slate-500">منجز (الإجمالي {day.total})</div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Monthly Orders Table & Filter */}
            <section className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="font-bold text-sm sm:text-base text-slate-900">
                    سجل طلبات شهر {dashboard.monthLabel} ({filteredMonthlyOrders.length})
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    يظهر لك فقط الطلبات المسجلة باسمك وحسابك خلال الشهر المحدد
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="بحث برقم الطلب أو المطعم..."
                      className="text-xs pl-3 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                  </div>

                  <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[11px] font-bold">
                    {(['all', 'delivered', 'active', 'cancelled'] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setOrderFilter(f)}
                        className={`px-2.5 py-1 rounded-md transition ${
                          orderFilter === f ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {f === 'all' ? 'الكل' : f === 'delivered' ? 'المنجزة' : f === 'active' ? 'النشطة' : 'الملغاة'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {filteredMonthlyOrders.length === 0 ? (
                <div className="p-10 text-center space-y-2">
                  <Package className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-600">لا توجد طلبات مطابقة في هذا الشهر</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4 font-bold">رقم الطلب</th>
                        <th className="py-3 px-4 font-bold">المتجر / المطعم</th>
                        <th className="py-3 px-4 font-bold">الحي / العنوان</th>
                        <th className="py-3 px-4 font-bold">التاريخ والوقت</th>
                        <th className="py-3 px-4 font-bold">المدة</th>
                        <th className="py-3 px-4 font-bold">التكلفة / الدفع</th>
                        <th className="py-3 px-4 font-bold">الحالة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredMonthlyOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">{order.id}</td>
                          <td className="py-3 px-4 font-semibold text-slate-800">{order.restaurant}</td>
                          <td className="py-3 px-4 text-slate-600">{order.customerAddress || '—'}</td>
                          <td className="py-3 px-4 text-slate-600">
                            {formatRiyadhDateTime(order.deliveryTime || order.assignedAt || order.createdAt, order.pickupTime)}
                          </td>
                          <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                            {order.elapsedMinutes} د
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            <div className="flex items-center gap-1.5">
                              {order.deliveryCost && (
                                <span className="font-bold text-emerald-700">{order.deliveryCost} ر.س</span>
                              )}
                              {order.paymentMethod && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                  <CreditCard className="w-2.5 h-2.5" />
                                  {order.paymentMethod}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">{getOrderStatusBadge(order)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
};
