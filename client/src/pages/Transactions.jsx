import { useCallback, useEffect, useState } from 'react';
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, ChevronLeft, ChevronRight, Pencil, Plus, Search, SlidersHorizontal, Trash2, X } from 'lucide-react';
import { api, getErrorMessage } from '../lib/api';
import { formatDate, formatMoney } from '../lib/format';

const today = () => new Date().toLocaleDateString('sv-SE');
const emptyForm = () => ({ type: 'expense', amount: '', title: '', note: '', occurred_at: today(), status: 'completed', account_id: '', to_account_id: '', category_id: '' });
const typeLabels = { expense: 'Chi tiêu', income: 'Thu nhập', transfer: 'Chuyển khoản' };
const typeIcons = { expense: ArrowUpRight, income: ArrowDownLeft, transfer: ArrowLeftRight };
const typeColors = { expense: 'text-rose-500 bg-rose-500/10', income: 'text-emerald-500 bg-emerald-500/10', transfer: 'text-sky-500 bg-sky-500/10' };
const initialFilters = { search: '', type: 'all', account_id: '', category_id: '', from: '', to: '', sort: 'newest' };

function Field({ label, children }) {
  return <label className="block"><span className="label">{label}</span>{children}</label>;
}

function TransactionDialog({ transaction, accounts, categories, onClose, onSaved }) {
  const [form, setForm] = useState(() => transaction
    ? { type: transaction.type, amount: String(transaction.amount), title: transaction.title, note: transaction.note || '', occurred_at: String(transaction.occurred_at).slice(0, 10), status: transaction.status, account_id: String(transaction.account_id), to_account_id: transaction.to_account_id ? String(transaction.to_account_id) : '', category_id: transaction.category_id ? String(transaction.category_id) : '' }
    : { ...emptyForm(), account_id: String(accounts.find((a) => !a.is_archived)?.id || '') });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const activeAccounts = accounts.filter((a) => !a.is_archived || String(a.id) === form.account_id || String(a.id) === form.to_account_id);
  const availableCategories = categories.filter((c) => c.type === form.type);
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const payload = {
      ...form,
      amount: Number(form.amount),
      account_id: Number(form.account_id),
      to_account_id: form.type === 'transfer' ? Number(form.to_account_id) : null,
      category_id: form.type === 'transfer' ? null : Number(form.category_id),
    };
    try {
      if (transaction) await api.put(`/transactions/${transaction.id}`, payload);
      else await api.post('/transactions', payload);
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label={transaction ? 'Sửa giao dịch' : 'Thêm giao dịch'} className="card max-h-[92vh] w-full max-w-xl overflow-y-auto p-5 sm:p-7">
        <div className="mb-5 flex items-center justify-between">
          <div><p className="eyebrow">Dòng tiền</p><h2 className="mt-1 text-xl font-extrabold">{transaction ? 'Sửa giao dịch' : 'Thêm giao dịch'}</h2></div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 muted hover:bg-[var(--surface-2)]" aria-label="Đóng"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(typeLabels).map(([value, label]) => (
              <button key={value} type="button" onClick={() => setForm((current) => ({ ...current, type: value, category_id: '', to_account_id: '' }))}
                className={`rounded-xl border px-2 py-2.5 text-xs font-bold transition sm:text-sm ${form.type === value ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]' : 'muted hover:bg-[var(--surface-2)]'}`}
                style={form.type === value ? undefined : { borderColor: 'var(--border)' }}>{label}</button>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Số tiền"><input className="input" type="number" min="1" step="1" required value={form.amount} onChange={(e) => set('amount', e.target.value)} placeholder="0" /></Field>
            <Field label="Ngày giao dịch"><input className="input" type="date" required value={form.occurred_at} onChange={(e) => set('occurred_at', e.target.value)} /></Field>
          </div>
          <Field label="Tên giao dịch"><input className="input" maxLength="255" required value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Ví dụ: Ăn trưa" /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={form.type === 'transfer' ? 'Từ tài khoản' : 'Tài khoản'}>
              <select className="input" required value={form.account_id} onChange={(e) => set('account_id', e.target.value)}>
                <option value="">Chọn tài khoản</option>{activeAccounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </Field>
            {form.type === 'transfer' ? (
              <Field label="Đến tài khoản"><select className="input" required value={form.to_account_id} onChange={(e) => set('to_account_id', e.target.value)}>
                <option value="">Chọn tài khoản nhận</option>{activeAccounts.filter((a) => String(a.id) !== form.account_id).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select></Field>
            ) : (
              <Field label="Danh mục"><select className="input" required value={form.category_id} onChange={(e) => set('category_id', e.target.value)}>
                <option value="">Chọn danh mục</option>{availableCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select></Field>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Trạng thái"><select className="input" value={form.status} onChange={(e) => set('status', e.target.value)}><option value="completed">Hoàn tất</option><option value="pending">Chờ xử lý</option></select></Field>
            <Field label="Ghi chú"><input className="input" maxLength="5000" value={form.note} onChange={(e) => set('note', e.target.value)} placeholder="Không bắt buộc" /></Field>
          </div>
          {error && <p role="alert" className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{error}</p>}
          <div className="flex justify-end gap-2 pt-2"><button type="button" className="btn btn-ghost" onClick={onClose}>Hủy</button><button type="submit" disabled={busy} className="btn btn-primary">{busy ? 'Đang lưu…' : 'Lưu giao dịch'}</button></div>
        </form>
      </div>
    </div>
  );
}

export default function Transactions() {
  const [filters, setFilters] = useState(initialFilters);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [options, setOptions] = useState({ accounts: [], categories: [] });
  const [result, setResult] = useState({ items: [], total: 0, summary: { income: 0, expense: 0, pending: 0 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialog, setDialog] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    api.get('/transactions/options').then(({ data }) => setOptions(data)).catch((err) => setError(getErrorMessage(err)));
  }, [refresh]);

  useEffect(() => {
    const timer = setTimeout(() => setFilters((current) => current.search === search ? current : { ...current, search }), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { ...filters, page, limit: 10 };
      Object.keys(params).forEach((key) => { if (params[key] === '') delete params[key]; });
      const { data } = await api.get('/transactions', { params });
      setResult(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => { load(); }, [load, refresh]);
  const changeFilter = (key, value) => { setPage(1); setFilters((current) => ({ ...current, [key]: value })); };
  const saved = () => { setDialog(null); setPage(1); setRefresh((value) => value + 1); };

  async function remove(item) {
    if (!window.confirm(`Xóa giao dịch “${item.title}”? Số dư tài khoản sẽ được cập nhật.`)) return;
    setDeleting(item.id);
    setError('');
    try { await api.delete(`/transactions/${item.id}`); setRefresh((value) => value + 1); }
    catch (err) { setError(getErrorMessage(err)); }
    finally { setDeleting(null); }
  }

  const totalPages = Math.max(1, Math.ceil(result.total / 10));
  const summary = result.summary || { income: 0, expense: 0, pending: 0 };

  return (
    <div className="animate-fade-up space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="eyebrow">Dòng tiền</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight md:text-3xl">Giao dịch</h1><p className="mt-1.5 text-sm muted">Theo dõi mọi khoản thu, chi và chuyển khoản.</p></div>
        <button type="button" className="btn btn-primary" onClick={() => setDialog({ mode: 'new' })}><Plus className="h-4 w-4" /> Thêm giao dịch</button>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Tổng thu', value: summary.income, icon: ArrowDownLeft, tone: 'text-emerald-500 bg-emerald-500/10' },
          { label: 'Tổng chi', value: summary.expense, icon: ArrowUpRight, tone: 'text-rose-500 bg-rose-500/10' },
          { label: 'Chênh lệch', value: Number(summary.income) - Number(summary.expense), icon: ArrowLeftRight, tone: 'text-sky-500 bg-sky-500/10' },
        ].map((card) => <div key={card.label} className="card flex items-center gap-4 p-4 sm:p-5"><span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${card.tone}`}><card.icon className="h-5 w-5" /></span><div className="min-w-0"><p className="text-xs font-semibold muted">{card.label}</p><p className="mt-1 truncate text-lg font-extrabold md:text-xl">{formatMoney(card.value)}</p></div></div>)}
      </section>

      <section className="card p-4 sm:p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-bold"><SlidersHorizontal className="h-4 w-4 text-[var(--accent)]" /> Bộ lọc <span className="ml-auto text-xs font-medium muted">{result.total} giao dịch{Number(summary.pending) > 0 ? ` · ${summary.pending} chờ xử lý` : ''}</span></div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="relative sm:col-span-2"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 muted" /><input className="input pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Tìm tên hoặc ghi chú…" aria-label="Tìm giao dịch" /></label>
          <select className="input" aria-label="Lọc loại giao dịch" value={filters.type} onChange={(e) => changeFilter('type', e.target.value)}><option value="all">Mọi loại</option>{Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          <select className="input" aria-label="Lọc tài khoản" value={filters.account_id} onChange={(e) => changeFilter('account_id', e.target.value)}><option value="">Mọi tài khoản</option>{options.accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
          <select className="input" aria-label="Lọc danh mục" value={filters.category_id} onChange={(e) => changeFilter('category_id', e.target.value)}><option value="">Mọi danh mục</option>{options.categories.filter((c) => filters.type === 'all' || c.type === filters.type).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <input className="input" type="date" aria-label="Từ ngày" value={filters.from} onChange={(e) => changeFilter('from', e.target.value)} />
          <input className="input" type="date" aria-label="Đến ngày" value={filters.to} onChange={(e) => changeFilter('to', e.target.value)} />
          <select className="input" aria-label="Sắp xếp" value={filters.sort} onChange={(e) => changeFilter('sort', e.target.value)}><option value="newest">Mới nhất</option><option value="oldest">Cũ nhất</option><option value="amount_desc">Số tiền giảm dần</option><option value="amount_asc">Số tiền tăng dần</option></select>
        </div>
        <button type="button" className="mt-3 text-xs font-semibold text-[var(--accent)] hover:underline" onClick={() => { setSearch(''); setFilters(initialFilters); setPage(1); }}>Xóa bộ lọc</button>
      </section>

      <section className="card overflow-hidden">
        {error && <p role="alert" className="m-4 rounded-lg bg-rose-500/10 px-4 py-3 text-sm text-rose-500">{error}</p>}
        {loading ? <p className="p-10 text-center text-sm muted">Đang tải giao dịch…</p> : result.items.length === 0 ? <div className="p-12 text-center"><p className="font-bold">Chưa có giao dịch phù hợp</p><p className="mt-1 text-sm muted">Thử thay đổi bộ lọc hoặc thêm giao dịch mới.</p></div> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="border-b bg-[var(--surface-2)] text-xs muted" style={{ borderColor: 'var(--border)' }}><tr><th className="px-5 py-3 font-semibold">Giao dịch</th><th className="px-4 py-3 font-semibold">Ngày</th><th className="px-4 py-3 font-semibold">Danh mục</th><th className="px-4 py-3 font-semibold">Tài khoản</th><th className="px-4 py-3 text-right font-semibold">Số tiền</th><th className="px-4 py-3 text-right font-semibold">Thao tác</th></tr></thead><tbody>
            {result.items.map((item) => { const Icon = typeIcons[item.type] || ArrowLeftRight; return <tr key={item.id} className="border-b last:border-b-0 hover:bg-[var(--surface-2)]" style={{ borderColor: 'var(--border)' }}><td className="px-5 py-3.5"><div className="flex items-center gap-3"><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${typeColors[item.type]}`}><Icon className="h-4 w-4" /></span><div className="min-w-0"><p className="max-w-[210px] truncate font-semibold">{item.title}</p><p className="text-[11px] muted">{typeLabels[item.type]}{item.status === 'pending' ? ' · Chờ xử lý' : ''}</p></div></div></td><td className="whitespace-nowrap px-4 py-3.5 muted">{formatDate(item.occurred_at)}</td><td className="px-4 py-3.5 muted">{item.category_name || 'Chuyển khoản'}</td><td className="px-4 py-3.5 muted">{item.account_name}{item.to_account_name ? ` → ${item.to_account_name}` : ''}</td><td className={`whitespace-nowrap px-4 py-3.5 text-right font-bold ${item.type === 'income' ? 'text-emerald-500' : item.type === 'expense' ? 'text-rose-500' : ''}`}>{item.type === 'income' ? '+' : item.type === 'expense' ? '−' : ''}{formatMoney(item.amount)}</td><td className="whitespace-nowrap px-4 py-3.5 text-right"><button type="button" className="rounded-lg p-2 muted hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]" title="Sửa" aria-label={`Sửa ${item.title}`} onClick={() => setDialog({ mode: 'edit', item })}><Pencil className="h-4 w-4" /></button><button type="button" disabled={deleting === item.id} className="rounded-lg p-2 muted hover:bg-rose-500/10 hover:text-rose-500" title="Xóa" aria-label={`Xóa ${item.title}`} onClick={() => remove(item)}><Trash2 className="h-4 w-4" /></button></td></tr>; })}
          </tbody></table></div>
        )}
        <div className="flex items-center justify-between border-t px-5 py-3 text-xs muted" style={{ borderColor: 'var(--border)' }}><span>Trang {page}/{totalPages} · {result.total} giao dịch</span><div className="flex gap-1"><button type="button" className="rounded-lg border p-1.5 disabled:opacity-40" style={{ borderColor: 'var(--border)' }} disabled={page <= 1} aria-label="Trang trước" onClick={() => setPage((v) => v - 1)}><ChevronLeft className="h-4 w-4" /></button><button type="button" className="rounded-lg border p-1.5 disabled:opacity-40" style={{ borderColor: 'var(--border)' }} disabled={page >= totalPages} aria-label="Trang sau" onClick={() => setPage((v) => v + 1)}><ChevronRight className="h-4 w-4" /></button></div></div>
      </section>
      {dialog && <TransactionDialog key={dialog.item?.id || 'new'} transaction={dialog.item} accounts={options.accounts} categories={options.categories} onClose={() => setDialog(null)} onSaved={saved} />}
    </div>
  );
}
