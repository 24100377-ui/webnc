import bcrypt from 'bcryptjs';

const ymd = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const shiftMonth = (base, offset) => {
  const d = new Date(base.getFullYear(), base.getMonth() - offset, 1);
  return d;
};

const atDay = (year, month, day) => new Date(year, month, day);

const round = (n, step = 1000) => Math.round(n / step) * step;

const EXPENSE_TEMPLATES = [
  { title: 'Tiền thuê nhà', category: 'Nhà ở', account: 'Vietcombank', amount: 6500000, day: 27 },
  { title: 'Điện tháng này', category: 'Hóa đơn', account: 'Vietcombank', amount: 1240000, day: 22 },
  { title: 'Netflix', category: 'Giải trí', account: 'Visa Platinum', amount: 260000, day: 25 },
  { title: 'Spotify Premium', category: 'Giải trí', account: 'Visa Platinum', amount: 59000, day: 12 },
  { title: 'Starbucks', category: 'Ăn uống', account: 'Visa Platinum', amount: 120000, day: 6 },
  { title: 'WinMart', category: 'Mua sắm', account: 'Visa Platinum', amount: 930000, day: 24 },
  { title: 'Grab', category: 'Di chuyển', account: 'Ví MoMo', amount: 185000, day: 27 },
  { title: 'Phí phần mềm', category: 'Hóa đơn', account: 'Visa Platinum', amount: 490000, day: 20 },
  { title: 'Ăn trưa văn phòng', category: 'Ăn uống', account: 'Tiền mặt', amount: 850000, day: 15 },
  { title: 'Shopee', category: 'Mua sắm', account: 'Visa Platinum', amount: 1470000, day: 18 },
  { title: 'Xăng xe', category: 'Di chuyển', account: 'Tiền mặt', amount: 300000, day: 10 },
  { title: 'CGV Cinemas', category: 'Giải trí', account: 'Ví MoMo', amount: 240000, day: 8 },
  { title: 'Cà phê sáng', category: 'Ăn uống', account: 'Ví MoMo', amount: 65000, day: 3 },
  { title: 'Nhà thuốc', category: 'Khác', account: 'Tiền mặt', amount: 320000, day: 21 },
  { title: 'Internet FPT', category: 'Hóa đơn', account: 'Vietcombank', amount: 220000, day: 7 },
];

const ACCOUNTS = [
  { name: 'Vietcombank', type: 'bank', balance: 42150000, icon: 'landmark', color: '#2563eb' },
  { name: 'Visa Platinum', type: 'credit', balance: -8200000, credit_limit: 50000000, last4: '4821', icon: 'credit-card', color: '#6366f1' },
  { name: 'Ví MoMo', type: 'ewallet', balance: 1850000, icon: 'smartphone', color: '#ec4899' },
  { name: 'Tiền mặt', type: 'cash', balance: 3200000, icon: 'banknote', color: '#f59e0b' },
  { name: 'Quỹ đầu tư Finhay', type: 'investment', balance: 18750000, icon: 'trending-up', color: '#10b981' },
];

const EXPENSE_CATEGORIES = [
  { name: 'Nhà ở', icon: 'home', color: '#6366f1' },
  { name: 'Ăn uống', icon: 'coffee', color: '#f59e0b' },
  { name: 'Mua sắm', icon: 'shopping-bag', color: '#ec4899' },
  { name: 'Hóa đơn', icon: 'zap', color: '#06b6d4' },
  { name: 'Di chuyển', icon: 'navigation', color: '#3b82f6' },
  { name: 'Giải trí', icon: 'music', color: '#8b5cf6' },
  { name: 'Khác', icon: 'more-horizontal', color: '#94a3b8' },
];

const INCOME_CATEGORIES = [
  { name: 'Thu nhập', icon: 'wallet', color: '#10b981' },
  { name: 'Thu nhập khác', icon: 'sparkles', color: '#22c55e' },
];

export async function seed(conn, { reset = false } = {}) {
  if (reset) {
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const table of ['goal_contributions', 'goals', 'budgets', 'transactions', 'recurring_bills', 'categories', 'accounts', 'users']) {
      await conn.query(`TRUNCATE TABLE ${table}`);
    }
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
  }

  const [existing] = await conn.query('SELECT id FROM users LIMIT 1');
  if (existing.length > 0) return { skipped: true };

  const passwordHash = await bcrypt.hash('123456', 10);
  const [userResult] = await conn.query(
    `INSERT INTO users (name, email, password_hash, currency, theme)
     VALUES (?, ?, ?, 'VND', 'light')`,
    ['Mạnh', 'manh@finora.vn', passwordHash],
  );
  const userId = userResult.insertId;

  const accountIds = {};
  for (const a of ACCOUNTS) {
    const [r] = await conn.query(
      `INSERT INTO accounts (user_id, name, type, balance, credit_limit, last4, icon, color)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, a.name, a.type, a.balance, a.credit_limit ?? null, a.last4 ?? null, a.icon, a.color],
    );
    accountIds[a.name] = r.insertId;
  }

  const categoryIds = {};
  for (const c of [...EXPENSE_CATEGORIES.map((x) => ({ ...x, type: 'expense' })), ...INCOME_CATEGORIES.map((x) => ({ ...x, type: 'income' }))]) {
    const [r] = await conn.query(
      'INSERT INTO categories (user_id, name, type, icon, color, is_system) VALUES (?, ?, ?, ?, ?, 1)',
      [userId, c.name, c.type, c.icon, c.color],
    );
    categoryIds[`${c.type}:${c.name}`] = r.insertId;
  }

  const today = new Date();
  const monthOffset = (offset) => shiftMonth(today, offset);

  for (let offset = 0; offset < 3; offset += 1) {
    const m = monthOffset(offset);
    const year = m.getFullYear();
    const month = m.getMonth();
    const factor = 1 - offset * 0.02;

    for (const t of EXPENSE_TEMPLATES) {
      if (offset === 0 && t.day > today.getDate()) continue;
      const [r] = await conn.query(
        `INSERT INTO transactions (user_id, account_id, category_id, type, amount, title, occurred_at, status)
         VALUES (?, ?, ?, 'expense', ?, ?, ?, ?)`,
        [
          userId,
          accountIds[t.account],
          categoryIds[`expense:${t.category}`],
          round(t.amount * factor),
          t.title,
          ymd(atDay(year, month, t.day)),
          offset === 0 && t.title === 'Phí phần mềm' ? 'pending' : 'completed',
        ],
      );
      if (offset === 0 && t.title === 'Phí phần mềm') {
        void r;
      }
    }

    const incomes = [
      { title: `Lương tháng ${month + 1}`, amount: 25000000, day: 1, category: 'Thu nhập' },
      { title: 'Freelance · Brand kit', amount: 4800000, day: 25, category: 'Thu nhập khác' },
    ];
    for (const inc of incomes) {
      if (offset === 0 && inc.day > today.getDate()) continue;
      await conn.query(
        `INSERT INTO transactions (user_id, account_id, category_id, type, amount, title, occurred_at, status)
         VALUES (?, ?, ?, 'income', ?, ?, ?, 'completed')`,
        [userId, accountIds.Vietcombank, categoryIds[`income:${inc.category}`], round(inc.amount * factor), inc.title, ymd(atDay(year, month, inc.day))],
      );
    }
  }

  const period = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const budgets = [
    { category: 'Ăn uống', amount: 5000000 },
    { category: 'Mua sắm', amount: 3000000 },
    { category: 'Di chuyển', amount: 1800000 },
    { category: 'Giải trí', amount: 1200000 },
    { category: 'Hóa đơn', amount: 2500000 },
    { category: 'Khác', amount: 1000000 },
  ];
  for (const b of budgets) {
    await conn.query(
      'INSERT INTO budgets (user_id, category_id, period, amount) VALUES (?, ?, ?, ?)',
      [userId, categoryIds[`expense:${b.category}`], period, b.amount],
    );
  }

  const goals = [
    { name: 'Quỹ khẩn cấp', description: 'An tâm hơn mỗi ngày', target: 60000000, saved: 42600000, deadline: '2026-12-31', icon: 'shield', color: '#10b981' },
    { name: 'Du lịch Nhật Bản', description: 'Tokyo · Kyoto · Osaka', target: 35000000, saved: 18500000, deadline: '2027-04-15', icon: 'plane', color: '#3b82f6' },
    { name: 'Mua xe mới', description: 'Chiếc xe đầu tiên', target: 220000000, saved: 78000000, deadline: '2028-06-30', icon: 'car', color: '#f59e0b' },
    { name: 'Đầu tư dài hạn', description: 'Tự do tài chính', target: 100000000, saved: 18750000, deadline: '2030-12-31', icon: 'trending-up', color: '#8b5cf6' },
  ];
  for (const g of goals) {
    const [gr] = await conn.query(
      `INSERT INTO goals (user_id, name, description, icon, color, target_amount, saved_amount, deadline, kind)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'savings')`,
      [userId, g.name, g.description, g.icon, g.color, g.target, g.saved, g.deadline],
    );
    const contribution = Math.round(g.saved / 6);
    for (let i = 2; i >= 1; i -= 1) {
      const d = monthOffset(i);
      await conn.query(
        'INSERT INTO goal_contributions (goal_id, amount, contributed_at, note) VALUES (?, ?, ?, ?)',
        [gr.insertId, contribution, ymd(new Date(d.getFullYear(), d.getMonth(), 5)), 'Đóng góp hàng tháng'],
      );
    }
  }

  const addDays = (n) => {
    const d = new Date(today);
    d.setDate(d.getDate() + n);
    return ymd(d);
  };
  const bills = [
    { name: 'Internet FPT', category: 'Hóa đơn', account: 'Vietcombank', amount: 220000, due: addDays(1), icon: 'wifi' },
    { name: 'Spotify Premium', category: 'Giải trí', account: 'Visa Platinum', amount: 59000, due: addDays(6), icon: 'music' },
    { name: 'Phí chung cư', category: 'Nhà ở', account: 'Vietcombank', amount: 1650000, due: addDays(9), icon: 'building' },
    { name: 'Adobe Creative Cloud', category: 'Hóa đơn', account: 'Visa Platinum', amount: 520000, due: addDays(14), icon: 'pen-tool' },
  ];
  for (const b of bills) {
    await conn.query(
      `INSERT INTO recurring_bills (user_id, name, category_id, account_id, amount, frequency, next_due_date, auto_pay, icon)
       VALUES (?, ?, ?, ?, ?, 'monthly', ?, 1, ?)`,
      [userId, b.name, categoryIds[`expense:${b.category}`], accountIds[b.account], b.amount, b.due, b.icon],
    );
  }

  return { skipped: false, userId, period };
}
