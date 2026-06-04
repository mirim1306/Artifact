const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const cloudinary = require('cloudinary').v2;

dotenv.config({ path: './server/.env' });

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// 💡 로컬 uploads 폴더 정적 서빙 (로컬 환경 fallback)
const uploadDir = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadDir));

// ── Cloudinary 설정 (환경변수가 있을 때만 활성화) ──
const useCloudinary = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (useCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('☁️  Cloudinary 연동 활성화');
} else {
  console.log('📁  Cloudinary 미설정 → 로컬 uploads 사용');
}

// ── DB 연결 ──
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost')
    ? false
    : { rejectUnauthorized: false },
});

// DB 풀 내부 예기치 않은 에러 발생 시 서버 Crash 방지
pool.on('error', (err) => {
  console.error('⚠️ DB 풀 내부에서 예기치 못한 에러가 발생했습니다:', err.message);
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ 최초 DB 연결 실패:', err.message);
  } else {
    console.log('✅ DB 연결 성공!');
    release();
  }
});

// ── uploads 폴더 자동 생성 ──
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) =>
    cb(null, Date.now() + '-' + Math.random().toString(36).substr(2, 9) + path.extname(file.originalname)),
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/mov'];
    cb(null, allowed.includes(file.mimetype));
  },
});

// ── Cloudinary 업로드 헬퍼: Cloudinary 설정이 없으면 로컬 경로 반환 ──
async function uploadFile(localPath, folder) {
  if (!useCloudinary) {
    return `/uploads/${path.basename(localPath)}`;
  }
  const result = await cloudinary.uploader.upload(localPath, {
    folder,
    resource_type: 'auto',
  });
  if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
  return result.secure_url;
}

// ── Cloudinary 삭제 헬퍼: URL에서 public_id를 추출해 삭제 ──
// Cloudinary URL 예시: https://res.cloudinary.com/<cloud>/image/upload/v123/portfolio_main/abc.jpg
// → public_id: portfolio_main/abc
async function deleteFromCloudinary(url) {
  if (!useCloudinary || !url) return;
  if (!url.startsWith('https://res.cloudinary.com')) return; // 로컬 경로면 무시

  try {
    // URL에서 /upload/ 이후 부분 추출, 버전(v숫자/) 제거, 확장자 제거
    const uploadIndex = url.indexOf('/upload/');
    if (uploadIndex === -1) return;

    let publicIdWithExt = url.slice(uploadIndex + '/upload/'.length);
    // 버전 prefix 제거 (예: v1234567890/)
    publicIdWithExt = publicIdWithExt.replace(/^v\d+\//, '');
    // 확장자 제거
    const publicId = publicIdWithExt.replace(/\.[^/.]+$/, '');

    // 이미지/영상 모두 시도
    const resourceType = url.includes('/video/') ? 'video' : 'image';
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    console.log(`🗑️  Cloudinary 삭제 완료: ${publicId}`);
  } catch (err) {
    // 삭제 실패해도 DB 삭제는 계속 진행
    console.error('⚠️  Cloudinary 삭제 중 오류 (무시하고 계속):', err.message);
  }
}

// ── JWT 인증 미들웨어 ──
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
  try {
    const result = await pool.query('SELECT id FROM users WHERE username = $1', [req.params.username]);
    res.json({ available: result.rows.length === 0 });
  } catch (err) {
    res.status(500).json({ success: false, message: '조회 중 오류가 발생했습니다.' });
  }
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
    if (err.code === '23505')
      return res.status(409).json({ success: false, message: '이미 사용 중인 ID 또는 이메일입니다.' });
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
  try {
    const result = await pool.query(
      'SELECT id, username, nickname, email, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    res.json({ success: true, user: result.rows[0] });
  } catch {
    res.status(500).json({ success: false, message: '사용자 정보를 불러올 수 없습니다.' });
  }
});

// ══════════════════════════════════════════════════════════════
// 포트폴리오 API
// ══════════════════════════════════════════════════════════════

app.get('/api/portfolios', async (req, res) => {
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
      'SELECT p.*, u.nickname, u.username, u.email FROM portfolios p JOIN users u ON p.user_id = u.id WHERE p.id = $1',
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
    const result = await pool.query(
      'SELECT * FROM portfolios WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ success: true, portfolios: result.rows });
  } catch {
    res.status(500).json({ success: false, message: '내 포트폴리오 조회 오류.' });
  }
});

// 포트폴리오 등록 (다중 이미지/영상 지원)
app.post('/api/portfolios', authMiddleware, upload.fields([
  { name: 'main_image', maxCount: 1 },
  { name: 'media_files', maxCount: 20 },
]), async (req, res) => {
  const {
    title, category, service_intro,
    main_features, tech_environment,
    team_members, dev_period, github_link, is_public,
    run_link, file_link, store_link, design_tool,
  } = req.body;

  if (!title || !category)
    return res.status(400).json({ success: false, message: '제목과 카테고리는 필수입니다.' });

  try {
    let main_image_url = null;

    if (req.files?.['main_image']?.[0]) {
      main_image_url = await uploadFile(req.files['main_image'][0].path, 'portfolio_main');
    }

    const result = await pool.query(
      `INSERT INTO portfolios
        (user_id, title, category, main_image, service_intro,
        main_features, tech_environment, team_members, dev_period,
        github_link, is_public, run_link, file_link, store_link, design_tool)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [
        req.user.id, title, category, main_image_url,
        service_intro || null, main_features || null,
        tech_environment || null, team_members || null,
        dev_period || null, github_link || null,
        is_public === 'false' ? false : true,
        run_link || null, file_link || null, store_link || null, design_tool || null,
      ]
    );

    const portfolioId = result.rows[0].id;
    const media_files = req.files?.['media_files'] || [];

    for (let i = 0; i < media_files.length; i++) {
      const isVideo = media_files[i].mimetype.startsWith('video/');
      const mediaUrl = await uploadFile(media_files[i].path, 'portfolio_media');
      await pool.query(
        'INSERT INTO portfolio_media (portfolio_id, media_url, media_type, order_num) VALUES ($1, $2, $3, $4)',
        [portfolioId, mediaUrl, isVideo ? 'video' : 'image', i]
      );
    }

    res.status(201).json({ success: true, message: '포트폴리오가 등록되었습니다!', portfolio: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
  }
});

// 포트폴리오 수정
app.put('/api/portfolios/:id', authMiddleware, upload.fields([
  { name: 'main_image', maxCount: 1 },
  { name: 'extra_images', maxCount: 100 },
]), async (req, res) => {
  const {
    title, category, service_intro,
    main_features, tech_environment,
    team_members, dev_period, github_link, is_public,
    run_link, file_link, store_link, design_tool,
  } = req.body;

  try {
    const check = await pool.query('SELECT user_id FROM portfolios WHERE id = $1', [req.params.id]);
    if (check.rows.length === 0)
      return res.status(404).json({ success: false, message: '포트폴리오를 찾을 수 없습니다.' });
    if (check.rows[0].user_id !== req.user.id)
      return res.status(403).json({ success: false, message: '수정 권한이 없습니다.' });

    let main_image_url = undefined;

    if (req.files?.['main_image']?.[0]) {
      main_image_url = await uploadFile(req.files['main_image'][0].path, 'portfolio_main');
    }

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
      run_link || null, file_link || null, store_link || null, design_tool || null,
    ];

    if (main_image_url) { query += `, main_image=$${params.length + 1}`; params.push(main_image_url); }
    query += ` WHERE id=$${params.length + 1} RETURNING *`;
    params.push(req.params.id);

    const result = await pool.query(query, params);

    const extra_images = req.files?.['extra_images'] || [];

    if (extra_images.length > 0) {
      await pool.query('DELETE FROM portfolio_images WHERE portfolio_id = $1', [req.params.id]);
      for (let i = 0; i < extra_images.length; i++) {
        const imgUrl = await uploadFile(extra_images[i].path, 'portfolio_media');
        await pool.query(
          'INSERT INTO portfolio_images (portfolio_id, image_url, order_num) VALUES ($1, $2, $3)',
          [req.params.id, imgUrl, i]
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
    const check = await pool.query(
      'SELECT user_id, main_image FROM portfolios WHERE id = $1',
      [req.params.id]
    );
    if (check.rows.length === 0)
      return res.status(404).json({ success: false, message: '포트폴리오를 찾을 수 없습니다.' });
    if (check.rows[0].user_id !== req.user.id)
      return res.status(403).json({ success: false, message: '삭제 권한이 없습니다.' });

    // Cloudinary에 올라간 모든 미디어 파일 삭제 (DB 삭제 전 URL 수집)
    if (useCloudinary) {
      const mainImageUrl = check.rows[0].main_image;

      const mediaRows = await pool.query(
        'SELECT media_url FROM portfolio_media WHERE portfolio_id = $1',
        [req.params.id]
      ).catch(() => ({ rows: [] })); // 테이블이 없을 경우 무시
      const imageRows = await pool.query(
        'SELECT image_url FROM portfolio_images WHERE portfolio_id = $1',
        [req.params.id]
      ).catch(() => ({ rows: [] })); // 테이블이 없을 경우 무시

      const allUrls = [
        mainImageUrl,
        ...mediaRows.rows.map(r => r.media_url),
        ...imageRows.rows.map(r => r.image_url),
      ].filter(Boolean);

      // 병렬로 Cloudinary 삭제 (실패해도 DB 삭제는 계속 진행)
      await Promise.all(allUrls.map(url => deleteFromCloudinary(url)));
    }

    // DB 삭제 (CASCADE 설정 시 portfolio_media, portfolio_images도 함께 삭제)
    await pool.query('DELETE FROM portfolios WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: '포트폴리오가 삭제되었습니다.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ 서버가 포트 ${PORT}에서 실행중입니다.`);
});