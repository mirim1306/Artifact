const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const path = require('path');

dotenv.config({ path: './server/.env' });

const app = express();
const PORT = process.env.PORT || 4000;

// ── 미들웨어 ──────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// ── DB 연결 ───────────────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.connect((err) => {
  if (err) console.error('DB 연결 실패:', err);
  else console.log('✅ DB 연결 성공!');
});

// ── 이미지 업로드 설정 ────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// ── JWT 인증 미들웨어 ─────────────────────────────────────────
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ success: false, message: '유효하지 않은 토큰입니다.' });
  }
};

// ══════════════════════════════════════════════════════════════
// 회원 API
// ══════════════════════════════════════════════════════════════

// ID 중복 체크
app.get('/api/check-username/:username', async (req, res) => {
  const { username } = req.params;
  const result = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
  res.json({ available: result.rows.length === 0 });
});

// 회원가입
app.post('/api/register', async (req, res) => {
  const { username, password, nickname, email } = req.body;

  if (!username || !password || !nickname || !email)
    return res.status(400).json({ success: false, message: '모든 항목을 입력해주세요.' });
  if (username.length < 4 || username.length > 20)
    return res.status(400).json({ success: false, message: 'ID는 4~20자여야 합니다.' });
  if (password.length < 8)
    return res.status(400).json({ success: false, message: '비밀번호는 8자 이상이어야 합니다.' });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, password, nickname, email) VALUES ($1, $2, $3, $4) RETURNING id, username, nickname, email',
      [username, hashedPassword, nickname, email]
    );
    res.status(201).json({ success: true, message: '가입이 완료되었습니다!', user: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ success: false, message: '이미 사용 중인 ID 또는 이메일입니다.' });
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
  }
});

// 로그인
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ success: false, message: 'ID와 비밀번호를 입력해주세요.' });

  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0)
      return res.status(401).json({ success: false, message: 'ID 또는 비밀번호가 일치하지 않습니다.' });

    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid)
      return res.status(401).json({ success: false, message: 'ID 또는 비밀번호가 일치하지 않습니다.' });

    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...userInfo } = user;
    res.json({ success: true, message: '로그인 성공!', token, user: userInfo });
  } catch {
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
  }
});

// 내 정보 조회
app.get('/api/me', authMiddleware, async (req, res) => {
  const result = await pool.query('SELECT id, username, nickname, email, created_at FROM users WHERE id = $1', [req.user.id]);
  res.json({ success: true, user: result.rows[0] });
});

// ══════════════════════════════════════════════════════════════
// 포트폴리오 API
// ══════════════════════════════════════════════════════════════

// 메인 페이지 - 공개 포트폴리오 전체 조회
app.get('/api/portfolios', async (req, res) => {
  const { category } = req.query;
  let query = `
    SELECT p.*, u.nickname 
    FROM portfolios p 
    JOIN users u ON p.user_id = u.id 
    WHERE p.is_public = true
  `;
  const params = [];
  if (category && category !== '전체') {
    query += ' AND p.category = $1';
    params.push(category);
  }
  query += ' ORDER BY p.created_at DESC';

  const result = await pool.query(query, params);
  res.json({ success: true, portfolios: result.rows });
});

// 포트폴리오 상세 조회
app.get('/api/portfolios/:id', async (req, res) => {
  const result = await pool.query(
    'SELECT p.*, u.nickname FROM portfolios p JOIN users u ON p.user_id = u.id WHERE p.id = $1',
    [req.params.id]
  );
  if (result.rows.length === 0)
    return res.status(404).json({ success: false, message: '포트폴리오를 찾을 수 없습니다.' });
  res.json({ success: true, portfolio: result.rows[0] });
});

// 마이페이지 - 내 포트폴리오 조회
app.get('/api/my/portfolios', authMiddleware, async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM portfolios WHERE user_id = $1 ORDER BY created_at DESC',
    [req.user.id]
  );
  res.json({ success: true, portfolios: result.rows });
});

// 포트폴리오 등록
app.post('/api/portfolios', authMiddleware, upload.single('main_image'), async (req, res) => {
  const { title, description, category, run_link, file_link, github_link, team_members, tech_stack, dev_period, is_public } = req.body;
  const main_image = req.file ? `/uploads/${req.file.filename}` : null;

  if (!title || !category)
    return res.status(400).json({ success: false, message: '제목과 카테고리는 필수입니다.' });

  try {
    const result = await pool.query(
      `INSERT INTO portfolios 
        (user_id, title, description, category, main_image, run_link, file_link, github_link, team_members, tech_stack, dev_period, is_public) 
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) 
       RETURNING *`,
      [req.user.id, title, description, category, main_image, run_link, file_link, github_link, team_members, tech_stack, dev_period, is_public === 'false' ? false : true]
    );
    res.status(201).json({ success: true, message: '포트폴리오가 등록되었습니다!', portfolio: result.rows[0] });
  } catch {
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
  }
});

// 포트폴리오 수정
app.put('/api/portfolios/:id', authMiddleware, upload.single('main_image'), async (req, res) => {
  const { title, description, category, run_link, file_link, github_link, team_members, tech_stack, dev_period, is_public } = req.body;

  try {
    const check = await pool.query('SELECT user_id FROM portfolios WHERE id = $1', [req.params.id]);
    if (check.rows.length === 0) return res.status(404).json({ success: false, message: '포트폴리오를 찾을 수 없습니다.' });
    if (check.rows[0].user_id !== req.user.id) return res.status(403).json({ success: false, message: '수정 권한이 없습니다.' });

    const main_image = req.file ? `/uploads/${req.file.filename}` : undefined;
    const imageQuery = main_image ? ', main_image = $12' : '';

    const params = [title, description, category, run_link, file_link, github_link, team_members, tech_stack, dev_period, is_public === 'false' ? false : true, req.params.id];
    if (main_image) params.push(main_image);

    const result = await pool.query(
      `UPDATE portfolios SET 
        title=$1, description=$2, category=$3, run_link=$4, file_link=$5, 
        github_link=$6, team_members=$7, tech_stack=$8, dev_period=$9, 
        is_public=$10, updated_at=NOW()${imageQuery}
       WHERE id=$11 RETURNING *`,
      params
    );
    res.json({ success: true, message: '포트폴리오가 수정되었습니다!', portfolio: result.rows[0] });
  } catch {
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
  }
});

// 포트폴리오 삭제
app.delete('/api/portfolios/:id', authMiddleware, async (req, res) => {
  try {
    const check = await pool.query('SELECT user_id FROM portfolios WHERE id = $1', [req.params.id]);
    if (check.rows.length === 0) return res.status(404).json({ success: false, message: '포트폴리오를 찾을 수 없습니다.' });
    if (check.rows[0].user_id !== req.user.id) return res.status(403).json({ success: false, message: '삭제 권한이 없습니다.' });

    await pool.query('DELETE FROM portfolios WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: '포트폴리오가 삭제되었습니다.' });
  } catch {
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
  }
});

// ── 서버 시작 ─────────────────────────────────────────────────
// uploads 폴더 생성
const fs = require('fs');
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

app.listen(PORT, () => {
  console.log(`✅ 서버가 포트 ${PORT}에서 실행중입니다.`);
});