import { useEffect, useState } from 'react';
import { AlertTriangle, ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight, CircleCheck, Coffee, Home, MoreHorizontal, Music2, Navigation, Pencil, Plus, ShoppingBag, Trash2, Wallet, X, Zap } from 'lucide-react';
import { api, getErrorMessage } from '../lib/api';
import { formatMoney } from '../lib/format';

const icons = { home: Home, coffee: Coffee, 'shopping-bag': ShoppingBag, zap: Zap, navigation: Navigation, music: Music2, 'more-horizontal': MoreHorizontal };
const currentPeriod = () => new Date().toLocaleDateString('sv-SE').slice(0, 7);
const periodLabel = (period) => {
  const [year, month] = period.split('-');
  return `Tháng ${Number(month)} / ${year}`;
};
const shiftPeriod = (period, offset) => {
  const [year, month] = period.split('-').map(Number);
  const date = new Date(year, month - 1 + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};
const budgetState = (item) => {
  if (!item.budget_id) return { label: 'Chưa đặt hạn mức', tone: 'muted', bar: 'bg-slate-300' };
  const ratio = Number(item.spent) / Number(item.amount);
  if (ratio >= 1) return { label: 'Đã vượt ngân sách', tone: 'text-rose-500', bar: 'bg-rose-500' };
  if (ratio >= 0.8) return { label: 'Sắp chạm hạn mức', tone: 'text-amber-500', bar: 'bg-amber-500' };
  return { label: 'Trong kế hoạch', tone: 'text-emerald-500', bar: 'bg-emerald-500' };
};

function BudgetDialog({ item, categories, period, onClose, onSaved }) {
  const [categoryId, setCategoryId] = useState(item ? String(item.category_id) : categories.length === 1 ? String(categories[0].category_id) : '');
  const [amount, setAmount] = useState(item ? String(item.amount) : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (item) await api.put(`/budgets/${item.budget_id}`, { amount: Number(amount) });
      else await api.post('/budgets', { period, category_id: Number(categoryId), amount: Number(amount) });
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div role="dialog" aria-modal="true" aria-label={item ? 'Sửa ngân sách' : 'Thêm ngân sách'} className="card w-full max-w-md p-5 sm:p-7">
      <div className="mb-5 flex items-start justify-between"><div><p className="eyebrow">{periodLabel(period)}</p><h2 className="mt-1 text-xl font-extrabold">{item ? 'Sửa ngân sách' : 'Thêm ngân sách'}</h2></div><button type="button" onClick={onClose} className="rounded-lg p-2 muted hover:bg-[var(--surface-2)]" aria-label="Đóng"><X className="h-5 w-5" /></button></div>
      <form onSubmit={submit} className="space-y-4">
        <label className="block"><span className="label">Danh mục chi tiêu</span><select className="input" required disabled={Boolean(item)} value={categoryId} onChange={(event) => setCategoryId(event.target.value)}><option value="">Chọn danh mục</option>{categories.map((category) => <option key={category.category_id} value={category.category_id}>{category.name}</option>)}</select></label>
        <label className="block"><span className="label">Hạn mức tháng</span><input className="input" required type="number" min="1" step="1" max="999999999999" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Ví dụ: 3000000" /></label>
        {item && <p className="text-xs muted">Đã chi {formatMoney(item.spent)} trong tháng này. Thay đổi hạn mức không sửa các giao dịch đã ghi.</p>}
        {error && <p role="alert" className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{error}</p>}
        <div className="flex justify-end gap-2 pt-2"><button type="button" className="btn btn-ghost" onClick={onClose}>Hủy</button><button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Đang lưu…' : 'Lưu ngân sách'}</button></div>
      </form>
    </div>
  </div>;
}

export default function Budgets() {
  const [period, setPeriod] = useState(currentPeriod);
  const [data, setData] = useState({ items: [], total_budget: 0, total_spent: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialog, setDialog] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    api.get('/budgets', { params: { period } })
      .then(({ data: result }) => { if (alive) setData(result); })
      .catch((err) => { if (alive) setError(getErrorMessage(err)); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [period, refresh]);

  const items = data.items || [];
  const active = items.filter((item) => item.budget_id);
  const available = items.filter((item) => !item.budget_id);
  const totalBudget = Number(data.total_budget);
  const totalSpent = Number(data.total_spent);
  const remaining = totalBudget - totalSpent;
  const ratio = totalBudget > 0 ? totalSpent / totalBudget : 0;
  const warningCount = active.filter((item) => Number(item.spent) >= Number(item.amount) * 0.8).length;

  async function remove(item) {
    if (!window.confirm(`Xóa ngân sách “${item.name}” của ${periodLabel(period)}? Giao dịch vẫn được giữ nguyên.`)) return;
    setDeleting(item.budget_id);
    setError('');
    try { await api.delete(`/budgets/${item.budget_id}`); setRefresh((value) => value + 1); }
    catch (err) { setError(getErrorMessage(err)); }
    finally { setDeleting(null); }
  }

  return <div className="animate-fade-up space-y-5">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Kế hoạch tháng</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight md:text-3xl">Ngân sách</h1><p className="mt-1.5 text-sm muted">Theo dõi hạn mức và chi tiêu theo từng danh mục.</p></div><button type="button" className="btn btn-primary" disabled={loading || available.length === 0} onClick={() => setDialog({ mode: 'new' })}><Plus className="h-4 w-4" /> Thêm ngân sách</button></header>

    <section className="card flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5"><div><p className="text-xs font-semibold muted">Đang xem</p><p className="mt-1 text-lg font-extrabold">{periodLabel(period)}</p></div><div className="flex items-center gap-2"><button type="button" className="btn btn-ghost px-2.5" onClick={() => setPeriod((value) => shiftPeriod(value, -1))} aria-label="Tháng trước"><ChevronLeft className="h-4 w-4" /></button><input type="month" className="input w-[165px]" value={period} onChange={(event) => { if (event.target.value) setPeriod(event.target.value); }} aria-label="Chọn tháng ngân sách" /><button type="button" className="btn btn-ghost px-2.5" onClick={() => setPeriod((value) => shiftPeriod(value, 1))} aria-label="Tháng sau"><ChevronRight className="h-4 w-4" /></button></div></section>

    {error && <p role="alert" className="rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-500">{error}</p>}
    {loading ? <div className="card p-12 text-center text-sm muted">Đang tải ngân sách…</div> : <>
      <section className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Tổng hạn mức', value: totalBudget, icon: Wallet, tone: 'text-sky-500 bg-sky-500/10' },
          { label: 'Đã chi', value: totalSpent, icon: ArrowUpRight, tone: 'text-rose-500 bg-rose-500/10' },
          { label: remaining >= 0 ? 'Còn lại' : 'Vượt hạn mức', value: Math.abs(remaining), icon: remaining >= 0 ? ArrowDownRight : AlertTriangle, tone: remaining >= 0 ? 'text-emerald-500 bg-emerald-500/10' : 'text-rose-500 bg-rose-500/10' },
        ].map((card) => <div key={card.label} className="card flex items-center gap-4 p-4 sm:p-5"><span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${card.tone}`}><card.icon className="h-5 w-5" /></span><div className="min-w-0"><p className="text-xs font-semibold muted">{card.label}</p><p className="mt-1 truncate text-lg font-extrabold md:text-xl">{formatMoney(card.value)}</p></div></div>)}
      </section>

      <section className="card p-5 sm:p-6"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow">Toàn bộ tháng</p><h2 className="mt-1 text-lg font-extrabold">Tiến độ chi tiêu</h2></div><span className={`text-sm font-bold ${ratio >= 1 ? 'text-rose-500' : ratio >= 0.8 ? 'text-amber-500' : 'text-[var(--accent)]'}`}>{totalBudget ? `${Math.round(ratio * 100)}% hạn mức` : 'Chưa có hạn mức'}</span></div><div className="mt-4 h-3 overflow-hidden rounded-full bg-[var(--surface-2)]"><div className={`h-full rounded-full transition-all ${ratio >= 1 ? 'bg-rose-500' : ratio >= 0.8 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(ratio * 100, 100)}%` }} /></div><p className="mt-3 text-xs muted">{active.length} danh mục có ngân sách{warningCount > 0 ? ` · ${warningCount} danh mục đã đạt ít nhất 80% hạn mức` : ''}. Chỉ tính giao dịch chi tiêu đã hoàn tất.</p></section>

      <section><div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-extrabold">Theo danh mục</h2><span className="text-xs muted">{items.length} danh mục</span></div>{items.length === 0 ? <div className="card p-10 text-center text-sm muted">Chưa có danh mục chi tiêu.</div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map((item) => {
        const Icon = icons[item.icon] || Wallet;
        const state = budgetState(item);
        const percent = item.budget_id ? Math.round(Number(item.spent) / Number(item.amount) * 100) : 0;
        const left = Number(item.amount) - Number(item.spent);
        return <article key={item.category_id} className="card p-5"><div className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl" style={{ backgroundColor: item.color ? `${item.color}1c` : 'var(--accent-soft)', color: item.color || 'var(--accent)' }}><Icon className="h-5 w-5" /></span><div className="min-w-0 flex-1"><h3 className="truncate font-bold">{item.name}</h3><p className={`mt-0.5 text-xs font-semibold ${state.tone}`}>{state.label}</p></div>{item.budget_id && <div className="flex shrink-0 gap-0.5"><button type="button" className="rounded-lg p-1.5 muted hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]" aria-label={`Sửa ngân sách ${item.name}`} onClick={() => setDialog({ mode: 'edit', item })}><Pencil className="h-4 w-4" /></button><button type="button" disabled={deleting === item.budget_id} className="rounded-lg p-1.5 muted hover:bg-rose-500/10 hover:text-rose-500" aria-label={`Xóa ngân sách ${item.name}`} onClick={() => remove(item)}><Trash2 className="h-4 w-4" /></button></div>}</div><div className="mt-5 flex items-end justify-between gap-2"><div><p className="text-xs muted">Đã chi</p><p className="mt-1 text-lg font-extrabold">{formatMoney(item.spent)}</p></div><div className="text-right"><p className="text-xs muted">Hạn mức</p><p className="mt-1 text-sm font-bold">{item.budget_id ? formatMoney(item.amount) : '—'}</p></div></div><div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[var(--surface-2)]"><div className={`h-full rounded-full ${state.bar}`} style={{ width: `${Math.min(percent, 100)}%` }} /></div><div className="mt-3 flex items-center justify-between text-xs"><span className="muted">{item.transaction_count} giao dịch</span>{item.budget_id ? <span className={left < 0 ? 'font-semibold text-rose-500' : 'muted'}>{left < 0 ? `Vượt ${formatMoney(-left)}` : `Còn ${formatMoney(left)}`}</span> : <button type="button" className="font-semibold text-[var(--accent)] hover:underline" onClick={() => setDialog({ mode: 'new', category: item })}>Đặt hạn mức</button>}</div></article>;
      })}</div>}</section>
    </>}
    {dialog && <BudgetDialog key={`${period}-${dialog.item?.budget_id || dialog.category?.category_id || 'new'}`} item={dialog.item} categories={dialog.category ? [dialog.category] : available} period={period} onClose={() => setDialog(null)} onSaved={() => { setDialog(null); setRefresh((value) => value + 1); }} />}
  </div>;
}
