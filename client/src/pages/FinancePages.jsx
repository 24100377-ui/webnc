import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Pencil,
  Trash2,
  Wallet,
  Target,
  ReceiptText,
  Download,
  X,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { api, getErrorMessage } from "../lib/api";
import { formatMoney, formatDate, formatCompact } from "../lib/format";
import { useAuth } from "../context/AuthContext";
import { applyTheme, saveTheme } from "../lib/theme";

const today = () => new Date().toLocaleDateString("sv-SE");
const accountTypes = {
  bank: "Ngân hàng",
  credit: "Thẻ tín dụng",
  ewallet: "Ví điện tử",
  cash: "Tiền mặt",
  investment: "Đầu tư",
};
const statuses = {
  active: "Đang thực hiện",
  done: "Hoàn thành",
  archived: "Đã lưu trữ",
};
const frequencies = {
  weekly: "Hàng tuần",
  monthly: "Hàng tháng",
  yearly: "Hàng năm",
};
function useData(path) {
  const [data, setData] = useState(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [version, setVersion] = useState(0);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    api
      .get(path)
      .then((r) => {
        if (alive) setData(r.data);
      })
      .catch((e) => {
        if (alive) setError(getErrorMessage(e));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [path, version]);
  return { data, error, loading, reload: () => setVersion((v) => v + 1) };
}
function Heading({ title, description, children }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="eyebrow">Finora · Tài chính cá nhân</p>
        <h1 className="mt-1 text-2xl font-extrabold md:text-3xl">{title}</h1>
        <p className="mt-2 text-sm muted">{description}</p>
      </div>
      {children}
    </header>
  );
}
function Notice({ error, loading }) {
  return error ? (
    <p
      role="alert"
      className="rounded-xl bg-rose-500/10 p-4 text-sm text-rose-500"
    >
      {error}
    </p>
  ) : loading ? (
    <p className="card p-8 text-center muted">Đang tải dữ liệu…</p>
  ) : null;
}
function Stats({ items }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {items.map(([label, value]) => (
        <div className="card p-5" key={label}>
          <p className="text-xs font-semibold muted">{label}</p>
          <p className="mt-3 text-xl font-extrabold">{formatMoney(value)}</p>
        </div>
      ))}
    </div>
  );
}
function Empty() {
  return (
    <div className="card p-10 text-center muted">
      Chưa có dữ liệu. Bạn có thể thêm mới để bắt đầu.
    </div>
  );
}
function FormDialog({ title, fields, initial, onSubmit, onClose }) {
  const [values, setValues] = useState(initial),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onSubmit(values);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="card max-h-[90vh] w-full max-w-lg overflow-y-auto p-6"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} aria-label="Đóng" className="p-2">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          {fields.map((f) => (
            <label key={f.key} className="block">
              <span className="label">{f.label}</span>
              {f.type === "checkbox" ? (
                <input
                  type="checkbox"
                  checked={Boolean(values[f.key])}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [f.key]: e.target.checked }))
                  }
                />
              ) : f.options ? (
                <select
                  className="input"
                  value={values[f.key] ?? ""}
                  required={f.required !== false}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [f.key]: e.target.value }))
                  }
                >
                  {f.options.map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className="input"
                  type={f.type || "text"}
                  min={f.min}
                  max={f.max}
                  step={f.type === "number" ? "1" : undefined}
                  maxLength={f.maxLength || 255}
                  required={f.required !== false}
                  value={values[f.key] ?? ""}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [f.key]: e.target.value }))
                  }
                />
              )}
            </label>
          ))}
          {error && (
            <p role="alert" className="text-sm text-rose-500">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Hủy
            </button>
            <button disabled={busy} className="btn btn-primary">
              {busy ? "Đang lưu…" : "Lưu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
const nameField = { key: "name", label: "Tên", maxLength: 100 };
const amountField = {
  key: "amount",
  label: "Số tiền (đ)",
  type: "number",
  min: 1,
};

export function Accounts() {
  const { data, error, loading, reload } = useData("/accounts"),
    [editing, setEditing] = useState(null);
  const items = data?.items || [],
    active = items.filter((x) => !x.is_archived);
  const fields = [
    nameField,
    {
      key: "type",
      label: "Loại tài khoản",
      options: Object.entries(accountTypes),
    },
    { key: "balance", label: "Số dư thực tế (đ)", type: "number" },
    {
      key: "credit_limit",
      label: "Hạn mức thẻ (đ)",
      type: "number",
      min: 0,
      required: false,
    },
    { key: "last4", label: "4 số cuối thẻ", maxLength: 4, required: false },
    { key: "color", label: "Màu", type: "color" },
    { key: "is_archived", label: "Lưu trữ tài khoản", type: "checkbox" },
  ];
  return (
    <div className="space-y-5">
      <Heading
        title="Ví & tài khoản"
        description="Quản lý số dư và các nguồn tiền của bạn."
      >
        <button className="btn btn-primary" onClick={() => setEditing({})}>
          <Plus size={16} />
          Thêm tài khoản
        </button>
      </Heading>
      <Stats
        items={[
          ["Tài sản ròng", active.reduce((s, x) => s + Number(x.balance), 0)],
          [
            "Tài sản",
            active.reduce((s, x) => s + Math.max(0, Number(x.balance)), 0),
          ],
          [
            "Dư nợ",
            active.reduce((s, x) => s + Math.max(0, -Number(x.balance)), 0),
          ],
        ]}
      />
      <Notice error={error} loading={loading} />
      {!loading && !items.length && <Empty />}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((x) => (
          <article
            key={x.id}
            className={`card p-6 ${x.is_archived ? "opacity-60" : ""}`}
          >
            <div className="flex items-center gap-3">
              <Wallet style={{ color: x.color || "var(--accent)" }} />
              <h2 className="flex-1 font-bold">{x.name}</h2>
              <button
                aria-label={`Sửa ${x.name}`}
                onClick={() => setEditing(x)}
                className="p-2 muted"
              >
                <Pencil size={16} />
              </button>
            </div>
            <p className="mt-2 text-xs muted">
              {accountTypes[x.type]}
              {x.last4 ? ` · •••• ${x.last4}` : ""}
              {x.is_archived ? " · Đã lưu trữ" : ""}
            </p>
            <p className="mt-6 text-2xl font-extrabold">
              {formatMoney(x.balance)}
            </p>
            {x.type === "credit" && (
              <p className="mt-2 text-xs muted">
                Hạn mức {formatMoney(x.credit_limit)}
              </p>
            )}
          </article>
        ))}
      </div>
      {editing && (
        <FormDialog
          title={editing.id ? "Sửa tài khoản" : "Thêm tài khoản"}
          fields={fields}
          initial={{
            name: "",
            type: "bank",
            balance: 0,
            credit_limit: "",
            last4: "",
            color: "#10b981",
            is_archived: false,
            ...editing,
          }}
          onClose={() => setEditing(null)}
          onSubmit={async (v) => {
            const payload = {
              ...v,
              is_archived: Boolean(v.is_archived),
              credit_limit:
                v.credit_limit === "" ? null : Number(v.credit_limit),
              last4: v.last4 || null,
            };
            await api[editing.id ? "put" : "post"](
              editing.id ? `/accounts/${editing.id}` : "/accounts",
              payload,
            );
            reload();
          }}
        />
      )}
      <p className="text-xs muted">
        Sửa số dư là đối chiếu với số dư thực tế. Tài khoản lưu trữ vẫn giữ lịch
        sử giao dịch.
      </p>
    </div>
  );
}

export function GoalPage({ kind = "goal" }) {
  const { data, error, loading, reload } = useData("/goals"),
    [editing, setEditing] = useState(null),
    [contributing, setContributing] = useState(null),
    [history, setHistory] = useState(null),
    [actionError, setActionError] = useState("");
  const items = (data?.items || []).filter((x) => x.kind === kind),
    title = kind === "savings" ? "Tiết kiệm" : "Mục tiêu tài chính";
  const fields = [
    nameField,
    { key: "description", label: "Mô tả", required: false },
    {
      key: "target_amount",
      label: "Số tiền mục tiêu (đ)",
      type: "number",
      min: 1,
    },
    { key: "deadline", label: "Ngày dự kiến", type: "date", required: false },
    { key: "status", label: "Trạng thái", options: Object.entries(statuses) },
  ];
  async function remove(x) {
    if (!confirm(`Xóa “${x.name}” và lịch sử đóng góp?`)) return;
    try {
      await api.delete(`/goals/${x.id}`);
      reload();
    } catch (e) {
      setActionError(getErrorMessage(e));
    }
  }
  return (
    <div className="space-y-5">
      <Heading
        title={title}
        description="Tích lũy từng bước cho những điều bạn đang hướng tới."
      >
        <button className="btn btn-primary" onClick={() => setEditing({})}>
          <Plus size={16} />
          Thêm mục tiêu
        </button>
      </Heading>
      <Stats
        items={[
          ["Mục tiêu", items.reduce((s, x) => s + Number(x.target_amount), 0)],
          [
            "Đã tích lũy",
            items.reduce((s, x) => s + Number(x.saved_amount), 0),
          ],
          [
            "Cần tích lũy thêm",
            items.reduce(
              (s, x) =>
                s +
                Math.max(0, Number(x.target_amount) - Number(x.saved_amount)),
              0,
            ),
          ],
        ]}
      />
      <Notice error={error || actionError} loading={loading} />
      {!loading && !items.length && <Empty />}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((x) => (
          <article className="card p-5" key={x.id}>
            <div className="flex items-center gap-2">
              <Target className="text-[var(--accent)]" size={20} />
              <h2 className="flex-1 font-bold">{x.name}</h2>
              <button
                className="p-1 muted"
                aria-label="Sửa"
                onClick={() => setEditing(x)}
              >
                <Pencil size={16} />
              </button>
              <button
                className="p-1 text-rose-500"
                aria-label="Xóa"
                onClick={() => remove(x)}
              >
                <Trash2 size={16} />
              </button>
            </div>
            <p className="mt-2 min-h-5 text-sm muted">{x.description}</p>
            <p className="mt-4 text-xl font-extrabold">
              {formatMoney(x.saved_amount)}
            </p>
            <p className="mt-1 text-xs muted">
              trên {formatMoney(x.target_amount)}
            </p>
            <div className="my-4 h-2 overflow-hidden rounded-full bg-[var(--border)]">
              <div
                className="h-full bg-[var(--accent)]"
                style={{
                  width: `${Math.min(100, (Number(x.saved_amount) / Number(x.target_amount)) * 100)}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-xs muted">
              <span>{statuses[x.status]}</span>
              <span>
                {x.deadline ? formatDate(x.deadline) : "Chưa đặt hạn"}
              </span>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                disabled={x.status === "archived"}
                className="btn btn-primary text-xs"
                onClick={() => setContributing(x)}
              >
                Đóng góp
              </button>
              <button
                className="btn btn-ghost text-xs"
                onClick={async () => {
                  try {
                    const r = await api.get(`/goals/${x.id}/contributions`);
                    setHistory({ name: x.name, items: r.data.items });
                  } catch (e) {
                    setActionError(getErrorMessage(e));
                  }
                }}
              >
                Lịch sử
              </button>
            </div>
          </article>
        ))}
      </div>
      {editing && (
        <FormDialog
          title="Mục tiêu tích lũy"
          fields={fields}
          initial={{
            name: "",
            description: "",
            target_amount: "",
            deadline: "",
            status: "active",
            ...editing,
          }}
          onClose={() => setEditing(null)}
          onSubmit={async (v) => {
            await api[editing.id ? "put" : "post"](
              editing.id ? `/goals/${editing.id}` : "/goals",
              { ...v, kind, deadline: v.deadline || null },
            );
            reload();
          }}
        />
      )}
      {contributing && (
        <FormDialog
          title={`Đóng góp · ${contributing.name}`}
          fields={[
            amountField,
            { key: "contributed_at", label: "Ngày", type: "date" },
            { key: "note", label: "Ghi chú", required: false },
          ]}
          initial={{ amount: "", contributed_at: today(), note: "" }}
          onClose={() => setContributing(null)}
          onSubmit={async (v) => {
            await api.post(`/goals/${contributing.id}/contributions`, v);
            reload();
          }}
        />
      )}
      {history && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <section className="card max-h-[80vh] w-full max-w-lg overflow-auto p-6">
            <div className="flex justify-between">
              <h2 className="font-bold">Lịch sử · {history.name}</h2>
              <button onClick={() => setHistory(null)} aria-label="Đóng">
                <X />
              </button>
            </div>
            {history.items.length ? (
              history.items.map((x) => (
                <div className="mt-4 border-b pb-3" key={x.id}>
                  <p className="font-semibold">{formatMoney(x.amount)}</p>
                  <p className="text-xs muted">
                    {formatDate(x.contributed_at)} · {x.note}
                  </p>
                </div>
              ))
            ) : (
              <p className="mt-4 muted">Chưa có đóng góp.</p>
            )}
          </section>
        </div>
      )}
      <p className="text-xs muted">
        Đóng góp ghi nhận số tiền đã dành riêng cho mục tiêu; số dư ví không
        thay đổi.
      </p>
    </div>
  );
}

export function Bills() {
  const { data, error, loading, reload } = useData("/bills"),
    options = useData("/transactions/options"),
    [editing, setEditing] = useState(null),
    [actionError, setActionError] = useState(""),
    [paying, setPaying] = useState(null);
  const items = data?.items || [];
  const fields = [
    nameField,
    amountField,
    {
      key: "account_id",
      label: "Tài khoản",
      options: [
        ["", "Chưa chọn"],
        ...(options.data?.accounts || [])
          .filter((x) => !x.is_archived)
          .map((x) => [x.id, x.name]),
      ],
      required: false,
    },
    {
      key: "category_id",
      label: "Danh mục",
      options: [
        ["", "Chưa chọn"],
        ...(options.data?.categories || [])
          .filter((x) => x.type === "expense")
          .map((x) => [x.id, x.name]),
      ],
      required: false,
    },
    { key: "frequency", label: "Chu kỳ", options: Object.entries(frequencies) },
    { key: "next_due_date", label: "Hạn thanh toán", type: "date" },
    { key: "is_active", label: "Đang hoạt động", type: "checkbox" },
  ];
  async function action(x, remove = false) {
    if (
      !confirm(
        remove
          ? `Xóa hóa đơn “${x.name}”?`
          : `Thanh toán “${x.name}” ${formatMoney(x.amount)} cho kỳ ${formatDate(x.next_due_date)}?`,
      )
    )
      return;
    setPaying(x.id);
    setActionError("");
    try {
      if (remove) await api.delete(`/bills/${x.id}`);
      else
        await api.post(`/bills/${x.id}/pay`, {
          expected_due_date: String(x.next_due_date).slice(0, 10),
        });
      reload();
    } catch (e) {
      setActionError(getErrorMessage(e));
    } finally {
      setPaying(null);
    }
  }
  return (
    <div className="space-y-5">
      <Heading
        title="Hóa đơn định kỳ"
        description="Theo dõi hạn thanh toán và ghi nhận chi phí mỗi kỳ."
      >
        <button className="btn btn-primary" onClick={() => setEditing({})}>
          <Plus size={16} />
          Thêm hóa đơn
        </button>
      </Heading>
      <Notice error={error || actionError} loading={loading} />
      {!loading && !items.length && <Empty />}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((x) => (
          <article className="card p-5" key={x.id}>
            <div className="flex items-center gap-2">
              <ReceiptText className="text-[var(--accent)]" size={20} />
              <h2 className="flex-1 font-bold">{x.name}</h2>
              <button
                className="p-1 muted"
                aria-label="Sửa"
                onClick={() => setEditing(x)}
              >
                <Pencil size={16} />
              </button>
              <button
                className="p-1 text-rose-500"
                aria-label="Xóa"
                onClick={() => action(x, true)}
              >
                <Trash2 size={16} />
              </button>
            </div>
            <p className="my-5 text-2xl font-extrabold">
              {formatMoney(x.amount)}
            </p>
            <p className="text-sm muted">
              {frequencies[x.frequency]} ·{" "}
              {x.account_name || "Chưa chọn tài khoản"}
            </p>
            <p
              className={`mt-2 text-sm ${x.is_active && String(x.next_due_date) < today() ? "text-rose-500" : "muted"}`}
            >
              Hạn: {formatDate(x.next_due_date)} ·{" "}
              {x.is_active ? "Đang hoạt động" : "Tạm dừng"}
            </p>
            <button
              disabled={!x.is_active || paying === x.id}
              className="btn btn-primary mt-5"
              onClick={() => action(x)}
            >
              {paying === x.id ? "Đang xử lý…" : "Thanh toán kỳ này"}
            </button>
          </article>
        ))}
      </div>
      {editing && (
        <FormDialog
          title="Hóa đơn định kỳ"
          fields={fields}
          initial={{
            name: "",
            amount: "",
            account_id: "",
            category_id: "",
            frequency: "monthly",
            next_due_date: today(),
            is_active: true,
            ...editing,
          }}
          onClose={() => setEditing(null)}
          onSubmit={async (v) => {
            await api[editing.id ? "put" : "post"](
              editing.id ? `/bills/${editing.id}` : "/bills",
              {
                ...v,
                is_active: Boolean(v.is_active),
                account_id: v.account_id ? Number(v.account_id) : null,
                category_id: v.category_id ? Number(v.category_id) : null,
              },
            );
            reload();
          }}
        />
      )}
    </div>
  );
}

export function Reports({ dashboard = false }) {
  const [period, setPeriod] = useState(() => today().slice(0, 7));
  const { data, error, loading } = useData(`/reports?period=${period}`),
    { user } = useAuth();
  function download() {
    const rows = [
      ["Ngày", "Thu nhập", "Chi tiêu"],
      ...(data?.daily || []).map((x) => [x.date, x.income, x.expense]),
    ];
    const blob = new Blob(
      ["\uFEFF" + rows.map((x) => x.join(",")).join("\r\n")],
      { type: "text/csv;charset=utf-8;" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finora-${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className="space-y-5">
      <Heading
        title={
          dashboard ? `Xin chào, ${user?.name || "bạn"}` : "Báo cáo & phân tích"
        }
        description="Nắm rõ dòng tiền và thói quen chi tiêu của bạn."
      >
        <div className="flex gap-2">
          <input
            className="input w-44"
            type="month"
            value={period}
            aria-label="Tháng báo cáo"
            onChange={(e) => {
              if (e.target.value) setPeriod(e.target.value);
            }}
          />
          {!dashboard && (
            <button
              className="btn btn-ghost"
              disabled={!data}
              onClick={download}
            >
              <Download size={16} />
              CSV
            </button>
          )}
        </div>
      </Heading>
      <Notice error={error} loading={loading} />
      {data && !loading && (
        <>
          <Stats
            items={
              dashboard
                ? [
                    ["Tài sản ròng", data.balance],
                    ["Thu nhập tháng", data.income],
                    ["Chi tiêu tháng", data.expense],
                  ]
                : [
                    ["Thu nhập", data.income],
                    ["Chi tiêu", data.expense],
                    ["Thu nhập − chi tiêu", data.income - data.expense],
                  ]
            }
          />
          <div className="grid gap-5 lg:grid-cols-2">
            <article className="card min-w-0 p-5">
              <h2 className="mb-5 font-bold">Dòng tiền 6 tháng</h2>
              {data.monthly.length ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.monthly}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--border)"
                      />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis
                        tickFormatter={(v) => formatCompact(v)}
                        tick={{ fontSize: 11 }}
                        width={55}
                      />
                      <Tooltip
                        formatter={(v) => formatMoney(v)}
                        contentStyle={{
                          background: "var(--surface)",
                          borderColor: "var(--border)",
                          color: "var(--text)",
                        }}
                      />
                      <Bar
                        dataKey="income"
                        name="Thu nhập"
                        fill="#10b981"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="expense"
                        name="Chi tiêu"
                        fill="#f43f5e"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="muted">
                  Chưa có giao dịch trong khoảng thời gian này.
                </p>
              )}
            </article>
            <article className="card p-5">
              <h2 className="mb-5 font-bold">Chi tiêu theo danh mục</h2>
              {data.categories.length ? (
                data.categories.map((x, i) => (
                  <div key={i} className="mb-4">
                    <div className="mb-2 flex justify-between gap-2 text-sm">
                      <span>{x.name}</span>
                      <span className="font-semibold">
                        {formatMoney(x.amount)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[var(--border)]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          background: x.color,
                          width: `${data.expense ? (Number(x.amount) / data.expense) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="muted">Chưa có chi tiêu trong tháng.</p>
              )}
            </article>
          </div>
          {dashboard && (
            <section className="card p-5">
              <div className="mb-4 flex justify-between">
                <h2 className="font-bold">Giao dịch gần đây</h2>
                <Link
                  to="/transactions"
                  className="text-sm text-[var(--accent)]"
                >
                  Xem tất cả →
                </Link>
              </div>
              {data.recent.length ? (
                data.recent.map((x) => (
                  <div
                    className="flex items-center justify-between gap-4 border-t border-[var(--border)] py-3"
                    key={x.id}
                  >
                    <div>
                      <p className="text-sm font-semibold">{x.title}</p>
                      <p className="text-xs muted">
                        {formatDate(x.occurred_at)}
                        {x.status === "pending" ? " · Chờ xử lý" : ""}
                      </p>
                    </div>
                    <p
                      className={`text-sm font-bold ${x.type === "income" ? "text-emerald-500" : x.type === "expense" ? "text-rose-500" : ""}`}
                    >
                      {x.type === "income"
                        ? "+"
                        : x.type === "expense"
                          ? "−"
                          : ""}
                      {formatMoney(x.amount)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="muted">Chưa có giao dịch.</p>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}

export function Settings() {
  const { user, setUser } = useAuth(),
    [form, setForm] = useState(() => ({
      ...user,
      notify_budget: Boolean(user.notify_budget),
      notify_report: Boolean(user.notify_report),
      notify_tips: Boolean(user.notify_tips),
    })),
    [password, setPassword] = useState({ current_password: "", password: "" }),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function save(e, changePassword = false) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (changePassword) {
        await api.put("/settings/password", password);
        setPassword({ current_password: "", password: "" });
      } else {
        const r = await api.put("/settings", form);
        setUser(r.data.user);
        saveTheme(form.theme);
        applyTheme(form.theme);
      }
      setMessage("Đã lưu thay đổi.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-5">
      <Heading
        title="Cài đặt"
        description="Quản lý hồ sơ, giao diện và bảo mật tài khoản."
      />
      {message && (
        <p
          role="status"
          className="rounded-xl bg-emerald-500/10 p-4 text-emerald-600"
        >
          {message}
        </p>
      )}
      <Notice error={error} />
      <div className="grid gap-5 lg:grid-cols-2">
        <form onSubmit={(e) => save(e)} className="card space-y-4 p-6">
          <h2 className="font-bold">Thông tin cá nhân</h2>
          {[
            ["name", "Họ tên", "text"],
            ["email", "Email", "email"],
          ].map(([key, label, type]) => (
            <label className="block" key={key}>
              <span className="label">{label}</span>
              <input
                className="input"
                type={type}
                required
                value={form[key]}
                onChange={(e) =>
                  setForm((v) => ({ ...v, [key]: e.target.value }))
                }
              />
            </label>
          ))}
          <label className="block">
            <span className="label">Giao diện</span>
            <select
              className="input"
              value={form.theme}
              onChange={(e) =>
                setForm((v) => ({ ...v, theme: e.target.value }))
              }
            >
              <option value="light">Sáng</option>
              <option value="dark">Tối</option>
              <option value="system">Theo hệ thống</option>
            </select>
          </label>
          <p className="text-xs muted">
            Tiền tệ: VNĐ. Tất cả số tiền được ghi nhận bằng đồng Việt Nam.
          </p>
          <button className="btn btn-primary" disabled={busy}>
            Lưu hồ sơ
          </button>
        </form>
        <form onSubmit={(e) => save(e, true)} className="card space-y-4 p-6">
          <h2 className="font-bold">Đổi mật khẩu</h2>
          <label className="block">
            <span className="label">Mật khẩu hiện tại</span>
            <input
              className="input"
              type="password"
              autoComplete="current-password"
              required
              value={password.current_password}
              onChange={(e) =>
                setPassword((v) => ({ ...v, current_password: e.target.value }))
              }
            />
          </label>
          <label className="block">
            <span className="label">Mật khẩu mới</span>
            <input
              className="input"
              type="password"
              autoComplete="new-password"
              minLength={6}
              maxLength={72}
              required
              value={password.password}
              onChange={(e) =>
                setPassword((v) => ({ ...v, password: e.target.value }))
              }
            />
          </label>
          <button className="btn btn-primary" disabled={busy}>
            Đổi mật khẩu
          </button>
        </form>
      </div>
    </div>
  );
}
