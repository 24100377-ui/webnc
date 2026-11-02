import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { pool, withTransaction } from '../config/db.js';
import { requireAuth, PUBLIC_USER_FIELDS } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler, HttpError } from '../utils/errors.js';

const router = Router();
router.use(requireAuth);
const money = z.coerce.number().int().min(0).max(999999999999);
const positive = money.refine(v => v > 0, 'Số tiền phải lớn hơn 0');
const optionalId = z.coerce.number().int().positive().nullable();
const accountSchema = z.object({ name: z.string().trim().min(1).max(100), type: z.enum(['bank','credit','ewallet','cash','investment']), balance: z.coerce.number().int().min(-999999999999).max(999999999999), credit_limit: money.nullable().default(null), last4: z.string().regex(/^\d{4}$/).nullable().default(null), color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#10b981'), is_archived: z.coerce.boolean().default(false) });
const goalSchema = z.object({ name: z.string().trim().min(1).max(150), description: z.string().trim().max(255).default(''), target_amount: positive, deadline: z.iso.date().nullable().default(null), kind: z.enum(['savings','goal']), status: z.enum(['active','done','archived']).default('active') });
const billSchema = z.object({ name: z.string().trim().min(1).max(150), amount: positive, category_id: optionalId, account_id: optionalId, frequency: z.enum(['weekly','monthly','yearly']), next_due_date: z.iso.date(), is_active: z.coerce.boolean().default(true) });
function resourceId(req) { const parsed = z.coerce.number().int().positive().safeParse(req.params.id); if (!parsed.success) throw new HttpError(422, 'Mã không hợp lệ'); return parsed.data; }
async function owned(conn, table, id, userId, lock = false) {
  const [rows] = await conn.query(`SELECT * FROM ${table} WHERE id = ? AND user_id = ?${lock ? ' FOR UPDATE' : ''}`, [id, userId]);
  if (!rows.length) throw new HttpError(404, 'Không tìm thấy dữ liệu');
  return rows[0];
}

router.get('/accounts', asyncHandler(async (req, res) => {
  const [items] = await pool.query('SELECT * FROM accounts WHERE user_id = ? ORDER BY is_archived, id', [req.user.id]);
  res.json({ items });
}));
router.post('/accounts', validate(accountSchema), asyncHandler(async (req, res) => {
  const d = req.body;
  const [r] = await pool.query('INSERT INTO accounts (user_id,name,type,balance,credit_limit,last4,color,is_archived) VALUES (?,?,?,?,?,?,?,?)', [req.user.id,d.name,d.type,d.balance,d.credit_limit,d.last4,d.color,d.is_archived]);
  res.status(201).json({ id: r.insertId });
}));
router.put('/accounts/:id', validate(accountSchema), asyncHandler(async (req, res) => {
  const id = resourceId(req), d = req.body;
  await withTransaction(async conn => {
    await owned(conn, 'accounts', id, req.user.id, true);
    await conn.query('UPDATE accounts SET name=?,type=?,balance=?,credit_limit=?,last4=?,color=?,is_archived=? WHERE id=? AND user_id=?', [d.name,d.type,d.balance,d.credit_limit,d.last4,d.color,d.is_archived,id,req.user.id]);
  });
  res.json({ ok: true });
}));

router.get('/goals', asyncHandler(async (req, res) => {
  const [items] = await pool.query('SELECT * FROM goals WHERE user_id=? ORDER BY status, deadline, id', [req.user.id]);
  res.json({ items });
}));
router.post('/goals', validate(goalSchema), asyncHandler(async (req, res) => {
  const d = req.body;
  const [r] = await pool.query('INSERT INTO goals (user_id,name,description,target_amount,deadline,kind,status) VALUES (?,?,?,?,?,?,?)', [req.user.id,d.name,d.description,d.target_amount,d.deadline,d.kind,d.status]);
  res.status(201).json({ id: r.insertId });
}));
router.put('/goals/:id', validate(goalSchema), asyncHandler(async (req, res) => {
  const id = resourceId(req), d = req.body;
  await owned(pool, 'goals', id, req.user.id);
  await pool.query('UPDATE goals SET name=?,description=?,target_amount=?,deadline=?,kind=?,status=? WHERE id=? AND user_id=?', [d.name,d.description,d.target_amount,d.deadline,d.kind,d.status,id,req.user.id]);
  res.json({ ok: true });
}));
router.delete('/goals/:id', asyncHandler(async (req, res) => {
  const id = resourceId(req);
  await owned(pool, 'goals', id, req.user.id);
  await pool.query('DELETE FROM goals WHERE id=? AND user_id=?', [id,req.user.id]);
  res.json({ ok:true });
}));
router.get('/goals/:id/contributions', asyncHandler(async (req,res) => {
  const id = resourceId(req);
  await owned(pool,'goals',id,req.user.id);
  const [items] = await pool.query('SELECT * FROM goal_contributions WHERE goal_id=? ORDER BY contributed_at DESC,id DESC',[id]);
  res.json({items});
}));
router.post('/goals/:id/contributions', validate(z.object({ amount: positive, contributed_at:z.iso.date(), note:z.string().trim().max(255).default('') })), asyncHandler(async (req,res) => {
  const id = resourceId(req), d=req.body;
  await withTransaction(async conn => {
    const goal = await owned(conn,'goals',id,req.user.id,true);
    if(goal.status==='archived') throw new HttpError(422,'Mục tiêu đã lưu trữ');
    await conn.query('INSERT INTO goal_contributions (goal_id,amount,contributed_at,note) VALUES (?,?,?,?)',[id,d.amount,d.contributed_at,d.note]);
    const total=Number(goal.saved_amount)+d.amount;
    await conn.query('UPDATE goals SET saved_amount=?,status=? WHERE id=?',[total,total>=Number(goal.target_amount)?'done':'active',id]);
  });
  res.status(201).json({ok:true});
}));

router.get('/bills', asyncHandler(async (req,res) => {
  const [items]=await pool.query('SELECT b.*,a.name AS account_name,c.name AS category_name FROM recurring_bills b LEFT JOIN accounts a ON a.id=b.account_id LEFT JOIN categories c ON c.id=b.category_id WHERE b.user_id=? ORDER BY b.is_active DESC,b.next_due_date',[req.user.id]);
  res.json({items});
}));
async function billReferences(conn,d,userId) {
  if(d.account_id) { const a=await owned(conn,'accounts',d.account_id,userId); if(a.is_archived) throw new HttpError(422,'Tài khoản đã lưu trữ'); }
  if(d.category_id) { const c=await owned(conn,'categories',d.category_id,userId); if(c.type!=='expense') throw new HttpError(422,'Chọn danh mục chi tiêu'); }
}
router.post('/bills',validate(billSchema),asyncHandler(async(req,res)=>{
  const d=req.body;
  await billReferences(pool,d,req.user.id);
  const [r]=await pool.query('INSERT INTO recurring_bills (user_id,name,amount,category_id,account_id,frequency,next_due_date,is_active,auto_pay) VALUES (?,?,?,?,?,?,?,?,0)',[req.user.id,d.name,d.amount,d.category_id,d.account_id,d.frequency,d.next_due_date,d.is_active]);
  res.status(201).json({id:r.insertId});
}));
router.put('/bills/:id',validate(billSchema),asyncHandler(async(req,res)=>{
  const id=resourceId(req),d=req.body;
  await owned(pool,'recurring_bills',id,req.user.id);
  await billReferences(pool,d,req.user.id);
  await pool.query('UPDATE recurring_bills SET name=?,amount=?,category_id=?,account_id=?,frequency=?,next_due_date=?,is_active=?,auto_pay=0 WHERE id=? AND user_id=?',[d.name,d.amount,d.category_id,d.account_id,d.frequency,d.next_due_date,d.is_active,id,req.user.id]);
  res.json({ok:true});
}));
router.delete('/bills/:id',asyncHandler(async(req,res)=>{
  const id=resourceId(req);
  await owned(pool,'recurring_bills',id,req.user.id);
  await pool.query('DELETE FROM recurring_bills WHERE id=? AND user_id=?',[id,req.user.id]);
  res.json({ok:true});
}));
router.post('/bills/:id/pay',validate(z.object({expected_due_date:z.iso.date()})),asyncHandler(async(req,res)=>{
  const id=resourceId(req);
  await withTransaction(async conn=>{
    const bill=await owned(conn,'recurring_bills',id,req.user.id,true);
    if(!bill.is_active || !bill.account_id || !bill.category_id) throw new HttpError(422,'Cần hóa đơn đang hoạt động, tài khoản và danh mục để thanh toán');
    await billReferences(conn,bill,req.user.id);
    const due=String(bill.next_due_date).slice(0,10);
    if(req.body.expected_due_date!==due) throw new HttpError(409,'Kỳ hóa đơn đã thay đổi. Vui lòng tải lại danh sách.');
    const date=new Date(`${due}T12:00:00Z`), day=date.getUTCDate();
    if(bill.frequency==='weekly') date.setUTCDate(day+7);
    else { date.setUTCDate(1); if(bill.frequency==='monthly') date.setUTCMonth(date.getUTCMonth()+1); else date.setUTCFullYear(date.getUTCFullYear()+1); const end=new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+1,0)).getUTCDate(); date.setUTCDate(Math.min(day,end)); }
    const paidAt=new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Ho_Chi_Minh'});
    await conn.query("INSERT INTO transactions (user_id,account_id,category_id,type,amount,title,note,occurred_at,status) VALUES (?,?,?,'expense',?,?,?,?,'completed')",[req.user.id,bill.account_id,bill.category_id,bill.amount,bill.name,`Thanh toán hóa đơn kỳ ${due}`,paidAt]);
    await conn.query('UPDATE accounts SET balance=balance-? WHERE id=? AND user_id=?',[bill.amount,bill.account_id,req.user.id]);
    await conn.query('UPDATE recurring_bills SET next_due_date=? WHERE id=?',[date.toISOString().slice(0,10),id]);
  });
  res.json({ok:true});
}));

router.get('/reports',asyncHandler(async(req,res)=>{
  const parsed=z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).safeParse(req.query.period);
  if(!parsed.success) throw new HttpError(422,'Tháng không hợp lệ');
  const period=parsed.data,from=`${period}-01`,[year,month]=period.split('-').map(Number),until=new Date(Date.UTC(year,month,1)).toISOString().slice(0,10);
  const [totals]=await pool.query("SELECT type,COALESCE(SUM(amount),0) AS amount FROM transactions WHERE user_id=? AND status='completed' AND occurred_at>=? AND occurred_at<? GROUP BY type",[req.user.id,from,until]);
  const [categories]=await pool.query("SELECT COALESCE(c.name,'Chưa phân loại') AS name,COALESCE(c.color,'#94a3b8') AS color,SUM(t.amount) AS amount FROM transactions t LEFT JOIN categories c ON c.id=t.category_id WHERE t.user_id=? AND t.type='expense' AND t.status='completed' AND t.occurred_at>=? AND t.occurred_at<? GROUP BY c.id,c.name,c.color ORDER BY amount DESC",[req.user.id,from,until]);
  const [daily]=await pool.query("SELECT occurred_at AS date,SUM(IF(type='income',amount,0)) AS income,SUM(IF(type='expense',amount,0)) AS expense FROM transactions WHERE user_id=? AND status='completed' AND type<>'transfer' AND occurred_at>=? AND occurred_at<? GROUP BY occurred_at ORDER BY occurred_at",[req.user.id,from,until]);
  const [monthly]=await pool.query("SELECT DATE_FORMAT(occurred_at,'%Y-%m') AS month,SUM(IF(type='income',amount,0)) AS income,SUM(IF(type='expense',amount,0)) AS expense FROM transactions WHERE user_id=? AND status='completed' AND occurred_at>=DATE_SUB(?,INTERVAL 5 MONTH) AND occurred_at<? GROUP BY month ORDER BY month",[req.user.id,from,until]);
  const [accounts]=await pool.query('SELECT COALESCE(SUM(balance),0) AS balance FROM accounts WHERE user_id=? AND is_archived=0',[req.user.id]);
  const [recent]=await pool.query('SELECT id,title,type,amount,occurred_at,status FROM transactions WHERE user_id=? ORDER BY occurred_at DESC,id DESC LIMIT 6',[req.user.id]);
  res.json({period,income:Number(totals.find(x=>x.type==='income')?.amount||0),expense:Number(totals.find(x=>x.type==='expense')?.amount||0),balance:Number(accounts[0].balance),categories,daily,monthly,recent});
}));

const settingsSchema=z.object({name:z.string().trim().min(2).max(100),email:z.email().max(190).toLowerCase(),theme:z.enum(['light','dark','system']),notify_budget:z.coerce.boolean(),notify_report:z.coerce.boolean(),notify_tips:z.coerce.boolean()});
router.put('/settings',validate(settingsSchema),asyncHandler(async(req,res)=>{
  const d=req.body;
  await pool.query('UPDATE users SET name=?,email=?,theme=?,notify_budget=?,notify_report=?,notify_tips=? WHERE id=?',[d.name,d.email,d.theme,d.notify_budget,d.notify_report,d.notify_tips,req.user.id]);
  const [rows]=await pool.query(`SELECT ${PUBLIC_USER_FIELDS} FROM users WHERE id=?`,[req.user.id]);
  res.json({user:rows[0]});
}));
router.put('/settings/password',validate(z.object({current_password:z.string().min(1),password:z.string().min(6).max(72)})),asyncHandler(async(req,res)=>{
  const [rows]=await pool.query('SELECT password_hash FROM users WHERE id=?',[req.user.id]);
  if(!await bcrypt.compare(req.body.current_password,rows[0].password_hash)) throw new HttpError(422,'Mật khẩu hiện tại không đúng');
  await pool.query('UPDATE users SET password_hash=? WHERE id=?',[await bcrypt.hash(req.body.password,10),req.user.id]);
  res.json({ok:true});
}));
export default router;
