const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: './server/.env' });

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
<<<<<<< HEAD

// 💡 [경로 보완] 항상 server/uploads 폴더를 정확히 바라보도록 절대 경로 매핑
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 💡 [DB 연결 및 보안 보완]
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('localhost') 
    ? false 
    : { rejectUnauthorized: false }
});

// 💡 [핵심] DB 연결이 순간적으로 끊겨도 백엔드 서버가 다운(Crash)되지 않도록 예외 처리 리스너 추가
pool.on('error', (err) => {
  console.error('⚠️ DB 풀 내부에서 예기치 못한 에러가 발생했습니다:', err.message);
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ 최초 DB 연결 실패:', err.message);
  } else {
    console.log('✅ DB 연결 성공!');
    release(); // 연결 확인 즉시 클라이언트를 풀에 반환하여 가용 자원 확보
  }
});

// 💡 실제 파일이 위치한 곳에 uploads 폴더 자동 생성 안전장치
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
=======
app.use('/uploads', express.static('uploads'));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.connect((err) => {
  if (err) console.error('DB 연결 실패:', err);
  else console.log('✅ DB 연결 성공!');
});

if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
>>>>>>> 9eb887f7c1283f5a6137564338c62861b8443c27
  filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.random().toString(36).substr(2,9) + path.extname(file.originalname))
});
const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/mov'];
    cb(null, allowed.includes(file.mimetype));
  }
});

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ success: false, message: '유효하지 않은 토큰입니다.' });
  }
};

// ══════════════════════════════════════════════════════════════
// 회원 API
// ══════════════════════════════════════════════════════════════

app.get('/api/check-username/:username', async (req, res) => {
<<<<<<< HEAD
  try {
    const result = await pool.query('SELECT id FROM users WHERE username = $1', [req.params.username]);
    res.json({ available: result.rows.length === 0 });
  } catch (err) {
    res.status(500).json({ success: false, message: '조회 중 오류가 발생했습니다.' });
  }
=======
  const result = await pool.query('SELECT id FROM users WHERE username = $1', [req.params.username]);
  res.json({ available: result.rows.length === 0 });
>>>>>>> 9eb887f7c1283f5a6137564338c62861b8443c27
});

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
      'INSERT INTO users (username, password, nickname, email) VALUES ($1,$2,$3,$4) RETURNING id, username, nickname, email',
      [username, hashedPassword, nickname, email]
    );
    res.status(201).json({ success: true, message: '가입이 완료되었습니다!', user: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ success: false, message: '이미 사용 중인 ID 또는 이메일입니다.' });
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ success: false, message: 'ID와 비밀번호를 입력해주세요.' });
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0)
      return res.status(401).json({ success: false, message: 'ID 또는 비밀번호가 일치하지 않습니다.' });
    const user = result.rows[0];
    if (!await bcrypt.compare(password, user.password))
      return res.status(401).json({ success: false, message: 'ID 또는 비밀번호가 일치하지 않습니다.' });
    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...userInfo } = user;
    res.json({ success: true, message: '로그인 성공!', token, user: userInfo });
  } catch {
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
  }
});

app.get('/api/me', authMiddleware, async (req, res) => {
<<<<<<< HEAD
  try {
    const result = await pool.query('SELECT id, username, nickname, email, created_at FROM users WHERE id = $1', [req.user.id]);
    res.json({ success: true, user: result.rows[0] });
  } catch {
    res.status(500).json({ success: false, message: '사용자 정보를 불러올 수 없습니다.' });
  }
=======
  const result = await pool.query('SELECT id, username, nickname, email, created_at FROM users WHERE id = $1', [req.user.id]);
  res.json({ success: true, user: result.rows[0] });
>>>>>>> 9eb887f7c1283f5a6137564338c62861b8443c27
});

// ══════════════════════════════════════════════════════════════
// 포트폴리오 API
// ══════════════════════════════════════════════════════════════

app.get('/api/portfolios', async (req, res) => {
<<<<<<< HEAD
  try {
    const { category } = req.query;
    let query = `SELECT p.*, u.nickname FROM portfolios p JOIN users u ON p.user_id = u.id WHERE p.is_public = true`;
    const params = [];
    if (category && category !== '전체') { query += ' AND p.category = $1'; params.push(category); }
    query += ' ORDER BY p.created_at DESC';
    const result = await pool.query(query, params);
    res.json({ success: true, portfolios: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: '데이터를 가져오는 중 오류가 발생했습니다.' });
  }
});

app.get('/api/portfolios/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT p.*, u.nickname FROM portfolios p JOIN users u ON p.user_id = u.id WHERE p.id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ success: false, message: '포트폴리오를 찾을 수 없습니다.' });
    
    const media = await pool.query(
      'SELECT * FROM portfolio_media WHERE portfolio_id = $1 ORDER BY order_num',
      [req.params.id]
    );
    res.json({ success: true, portfolio: { ...result.rows[0], media: media.rows } });
  } catch (err) {
    res.status(500).json({ success: false, message: '상세 정보 조회 오류.' });
  }
});

app.get('/api/my/portfolios', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM portfolios WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
    res.json({ success: true, portfolios: result.rows });
  } catch {
    res.status(500).json({ success: false, message: '내 포트폴리오 조회 오류.' });
  }
=======
  const { category } = req.query;
  let query = `SELECT p.*, u.nickname FROM portfolios p JOIN users u ON p.user_id = u.id WHERE p.is_public = true`;
  const params = [];
  if (category && category !== '전체') { query += ' AND p.category = $1'; params.push(category); }
  query += ' ORDER BY p.created_at DESC';
  const result = await pool.query(query, params);
  res.json({ success: true, portfolios: result.rows });
});

app.get('/api/portfolios/:id', async (req, res) => {
  const result = await pool.query(
    'SELECT p.*, u.nickname FROM portfolios p JOIN users u ON p.user_id = u.id WHERE p.id = $1',
    [req.params.id]
  );
  if (result.rows.length === 0)
    return res.status(404).json({ success: false, message: '포트폴리오를 찾을 수 없습니다.' });
  
  // 추가 이미지 조회
  const media = await pool.query(
    'SELECT * FROM portfolio_media WHERE portfolio_id = $1 ORDER BY order_num',
    [req.params.id]
  );
  res.json({ success: true, portfolio: { ...result.rows[0], media: media.rows } });
});

app.get('/api/my/portfolios', authMiddleware, async (req, res) => {
  const result = await pool.query('SELECT * FROM portfolios WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
  res.json({ success: true, portfolios: result.rows });
>>>>>>> 9eb887f7c1283f5a6137564338c62861b8443c27
});

// 포트폴리오 등록 (다중 이미지 지원)
app.post('/api/portfolios', authMiddleware, upload.fields([
  { name: 'main_image', maxCount: 1 },
  { name: 'media_files', maxCount: 20 }
]), async (req, res) => {
  const {
    title, category, service_intro,
    main_features, tech_environment,
    team_members, dev_period, github_link, is_public,
    run_link, file_link, store_link, design_tool
  } = req.body;

  if (!title || !category)
    return res.status(400).json({ success: false, message: '제목과 카테고리는 필수입니다.' });

  const main_image = req.files?.['main_image']?.[0] ? `/uploads/${req.files['main_image'][0].filename}` : null;
  const media_files = req.files?.['media_files'] || [];

  try {
    const result = await pool.query(
      `INSERT INTO portfolios 
        (user_id, title, category, main_image, service_intro,
        main_features, tech_environment, team_members, dev_period,
        github_link, is_public, run_link, file_link, store_link, design_tool)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [
        req.user.id, title, category, main_image,
        service_intro || null, main_features || null,
        tech_environment || null, team_members || null,
        dev_period || null, github_link || null,
        is_public === 'false' ? false : true,
        run_link || null, file_link || null, store_link || null, design_tool || null
      ]
    );

    const portfolioId = result.rows[0].id;

    // 추가 이미지 저장
    for (let i = 0; i < media_files.length; i++) {
      const isVideo = media_files[i].mimetype.startsWith('video/');
      await pool.query(
        'INSERT INTO portfolio_media (portfolio_id, media_url, media_type, order_num) VALUES ($1, $2, $3, $4)',
        [portfolioId, `/uploads/${media_files[i].filename}`, isVideo ? 'video' : 'image', i]
      );
<<<<<<< HEAD
    }
=======
  }
>>>>>>> 9eb887f7c1283f5a6137564338c62861b8443c27

    res.status(201).json({ success: true, message: '포트폴리오가 등록되었습니다!', portfolio: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
  }
});

// 포트폴리오 수정
app.put('/api/portfolios/:id', authMiddleware, upload.fields([
  { name: 'main_image', maxCount: 1 },
  { name: 'extra_images', maxCount: 100 }
]), async (req, res) => {
  const {
    title, category, service_intro,
    main_features, tech_environment,
    team_members, dev_period, github_link, is_public,
    run_link, file_link, store_link, design_tool
  } = req.body;

  try {
    const check = await pool.query('SELECT user_id FROM portfolios WHERE id = $1', [req.params.id]);
    if (check.rows.length === 0) return res.status(404).json({ success: false, message: '포트폴리오를 찾을 수 없습니다.' });
    if (check.rows[0].user_id !== req.user.id) return res.status(403).json({ success: false, message: '수정 권한이 없습니다.' });

    const main_image = req.files?.['main_image']?.[0] ? `/uploads/${req.files['main_image'][0].filename}` : undefined;
    const extra_images = req.files?.['extra_images'] || [];

    let query = `UPDATE portfolios SET 
      title=$1, category=$2, service_intro=$3,
      main_features=$4, tech_environment=$5, team_members=$6,
      dev_period=$7, github_link=$8, is_public=$9, run_link=$10, file_link=$11,
      store_link=$12, design_tool=$13, updated_at=NOW()`;
    
    const params = [
      title, category,
      service_intro || null, main_features || null,
      tech_environment || null, team_members || null,
      dev_period || null, github_link || null,
      is_public === 'false' ? false : true,
      run_link || null, file_link || null, store_link || null, design_tool || null
    ];

    if (main_image) { query += `, main_image=$${params.length + 1}`; params.push(main_image); }
    query += ` WHERE id=$${params.length + 1} RETURNING *`;
    params.push(req.params.id);

    const result = await pool.query(query, params);

    // 추가 이미지 새로 저장
    if (extra_images.length > 0) {
      await pool.query('DELETE FROM portfolio_images WHERE portfolio_id = $1', [req.params.id]);
      for (let i = 0; i < extra_images.length; i++) {
        await pool.query(
          'INSERT INTO portfolio_images (portfolio_id, image_url, order_num) VALUES ($1, $2, $3)',
          [req.params.id, `/uploads/${extra_images[i].filename}`, i]
        );
      }
    }

    res.json({ success: true, message: '포트폴리오가 수정되었습니다!', portfolio: result.rows[0] });
  } catch (err) {
    console.error(err);
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

app.listen(PORT, () => {
  console.log(`✅ 서버가 포트 ${PORT}에서 실행중입니다.`);
});