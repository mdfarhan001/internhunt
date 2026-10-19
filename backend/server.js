const express = require('express');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const SECRET = process.env.JWT_SECRET || 'change-this-secret-before-deploy';
const db = new Database(process.env.DB_PATH || path.join(__dirname, 'internhunt.db'));
db.pragma('journal_mode = WAL');
db.exec(`
CREATE TABLE IF NOT EXISTS users(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS apps(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  deadline TEXT,
  stipend INTEGER,
  status TEXT NOT NULL DEFAULT 'wish',
  link TEXT,
  notes TEXT,
  checklist TEXT NOT NULL DEFAULT '[]'
);`);

const STATUSES = ['wish', 'applied', 'interview', 'offer', 'rejected'];
const app = express();
app.use(express.json());

const sign = (u) => jwt.sign({ id: u.id }, SECRET, { expiresIn: '7d' });
function auth(req, res, next) {
  const h = req.headers.authorization || '';
  try { req.uid = jwt.verify(h.startsWith('Bearer ') ? h.slice(7) : '', SECRET).id; next(); }
  catch (e) { res.status(401).json({ error: 'Please log in again.' }); }
}
const toRow = (r) => ({ ...r, stipend: r.stipend == null ? '' : r.stipend, checklist: JSON.parse(r.checklist || '[]') });
function clean(b) {
  const s = Number(b.stipend);
  return {
    company: String(b.company || '').trim().slice(0, 40),
    role: String(b.role || '').trim().slice(0, 40),
    deadline: b.deadline || null,
    stipend: b.stipend === '' || b.stipend == null || isNaN(s) ? null : s,
    status: STATUSES.includes(b.status) ? b.status : 'wish',
    link: String(b.link || '').slice(0, 300),
    notes: String(b.notes || '').slice(0, 1000),
    checklist: JSON.stringify(Array.isArray(b.checklist) ? b.checklist.map(c => ({ t: String(c.t).slice(0, 80), d: !!c.d })) : [])
  };
}

app.post('/api/signup', (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'Enter your name and a valid email.' });
  if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  if (db.prepare('SELECT 1 FROM users WHERE email=?').get(email.toLowerCase())) return res.status(409).json({ error: 'This email already has an account. Log in instead.' });
  const info = db.prepare('INSERT INTO users(name,email,password_hash) VALUES(?,?,?)').run(name.trim().slice(0, 24), email.toLowerCase(), bcrypt.hashSync(password, 10));
  res.json({ token: sign({ id: info.lastInsertRowid }), user: { name: name.trim(), email: email.toLowerCase() } });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body || {};
  const u = db.prepare('SELECT * FROM users WHERE email=?').get(String(email || '').toLowerCase());
  if (!u || !bcrypt.compareSync(String(password || ''), u.password_hash)) return res.status(401).json({ error: 'Wrong email or password.' });
  res.json({ token: sign(u), user: { name: u.name, email: u.email } });
});

app.get('/api/me', auth, (req, res) => res.json(db.prepare('SELECT name,email FROM users WHERE id=?').get(req.uid)));

app.get('/api/apps', auth, (req, res) => res.json(db.prepare('SELECT * FROM apps WHERE user_id=? ORDER BY id').all(req.uid).map(toRow)));

app.post('/api/apps', auth, (req, res) => {
  const a = clean(req.body || {});
  if (!a.company || !a.role) return res.status(400).json({ error: 'Company and role are required.' });
  const info = db.prepare('INSERT INTO apps(user_id,company,role,deadline,stipend,status,link,notes,checklist) VALUES(?,?,?,?,?,?,?,?,?)')
    .run(req.uid, a.company, a.role, a.deadline, a.stipend, a.status, a.link, a.notes, a.checklist);
  res.json(toRow(db.prepare('SELECT * FROM apps WHERE id=?').get(info.lastInsertRowid)));
});

app.put('/api/apps/:id', auth, (req, res) => {
  const own = db.prepare('SELECT 1 FROM apps WHERE id=? AND user_id=?').get(req.params.id, req.uid);
  if (!own) return res.status(404).json({ error: 'Application not found.' });
  const a = clean(req.body || {});
  if (!a.company || !a.role) return res.status(400).json({ error: 'Company and role are required.' });
  db.prepare('UPDATE apps SET company=?,role=?,deadline=?,stipend=?,status=?,link=?,notes=?,checklist=? WHERE id=?')
    .run(a.company, a.role, a.deadline, a.stipend, a.status, a.link, a.notes, a.checklist, req.params.id);
  res.json(toRow(db.prepare('SELECT * FROM apps WHERE id=?').get(req.params.id)));
});

app.delete('/api/apps/:id', auth, (req, res) => {
  db.prepare('DELETE FROM apps WHERE id=? AND user_id=?').run(req.params.id, req.uid);
  res.json({ ok: true });
});

app.post('/api/seed', auth, (req, res) => {
  const day = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  const prep = JSON.stringify(['Research the company and its product', 'Update resume for this role', 'Prepare 3 project stories', 'Practice common questions', 'Write 2 questions to ask them'].map(t => ({ t, d: false })));
  const rows = [['Razorpay', 'Backend Intern', 2, 'wish', 35000], ['Zomato', 'SDE Intern', 9, 'wish', 40000], ['Swiggy', 'Data Analyst Intern', 5, 'applied', 30000],
    ['Flipkart', 'Frontend Intern', 12, 'applied', 45000], ['Atlassian', 'Software Intern', -3, 'interview', 60000], ['CRED', 'Product Design Intern', 0, 'offer', 50000], ['Startup X', 'Web Dev Intern', -10, 'rejected', 15000]];
  const ins = db.prepare('INSERT INTO apps(user_id,company,role,deadline,stipend,status,link,notes,checklist) VALUES(?,?,?,?,?,?,?,?,?)');
  rows.forEach(r => ins.run(req.uid, r[0], r[1], day(r[2]), r[4], r[3], '', '', r[3] === 'interview' ? prep : '[]'));
  res.json({ ok: true });
});

app.use(express.static(path.join(__dirname, '..', 'frontend')));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('InternHunt running on http://localhost:' + PORT));
