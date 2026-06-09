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

const uploadDir = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadDir));

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

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost')
    ? false
    : { rejectUnauthorized: false },
});

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

async function deleteFromCloudinary(url) {
  if (!useCloudinary || !url) return;
  if (!url.startsWith('https://res.cloudinary.com')) return;
  try {
    const uploadIndex = url.indexOf('/upload/');
    if (uploadIndex === -1) return;
    let publicIdWithExt = url.slice(uploadIndex + '/upload/'.length);
    publicIdWithExt = publicIdWithExt.replace(/^v\d+\//, '');
    const publicId = publicIdWithExt.replace(/\.[^/.]+$/, '');
    const resourceType = url.includes('/video/') ? 'video' : 'image';
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    console.log(`🗑️  Cloudinary 삭제 완료: ${publicId}`);
  } catch (err) {
    console.error('⚠️  Cloudinary 삭제 중 오류 (무시하고 계속):', err.message);
  }
}

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

const adminMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    const result = await pool.query('SELECT is_admin FROM users WHERE id = $1', [req.user.id]);
    if (!result.rows[0]?.is_admin) return res.status(403).json({ success: false, message: '관리자 권한이 필요합니다.' });
    next();
  } catch {
    res.status(401).json({ success: false, message: '유효하지 않은 토큰입니다.' });
  }
};

// 로그인 선택적 미들웨어 (비로그인도 통과, 로그인이면 user 세팅)
const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    try { req.user = jwt.verify(token, process.env.JWT_SECRET); } catch {}
  }
  next();
};

// ══════════════════════════════════════════════════════════════
// DB 초기화: 새 테이블 자동 생성
// ══════════════════════════════════════════════════════════════
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS portfolio_likes (
      id SERIAL PRIMARY KEY,
      portfolio_id INTEGER NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(portfolio_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS portfolio_comments (
      id SERIAL PRIMARY KEY,
      portfolio_id INTEGER NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS portfolio_tags (
      id SERIAL PRIMARY KEY,
      portfolio_id INTEGER NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
      tag VARCHAR(50) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS portfolio_media (
      id SERIAL PRIMARY KEY,
      portfolio_id INTEGER NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
      media_url TEXT NOT NULL,
      media_type VARCHAR(10) DEFAULT 'image',
      order_num INTEGER DEFAULT 0
    );
  `);

  // portfolios 테이블에 view_count 컬럼 추가 (없으면)
  await pool.query(`
    ALTER TABLE portfolios ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
  `);

  console.log('✅ DB 테이블 초기화 완료');
}
initDB().catch(err => console.error('DB 초기화 오류:', err.message));

// ══════════════════════════════════════════════════════════════
// 회원 API
// ══════════════════════════════════════════════════════════════

app.get('/api/check-username/:username', async (req, res) => {
  try {
    const result = await pool.query('SELECT id FROM users WHERE username = $1', [req.params.username]);
    res.json({ available: result.rows.length === 0 });
  } catch {
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
      'SELECT id, username, nickname, email, created_at, is_admin FROM users WHERE id = $1',
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

// 목록 조회 (카테고리 필터 + 검색 + 정렬)
app.get('/api/portfolios', optionalAuth, async (req, res) => {
  try {
    const { category, search, sort } = req.query;
    const userId = req.user?.id || null;

    let query = `
      SELECT p.*, u.nickname,
        COUNT(DISTINCT l.id) AS like_count,
        ${userId ? `BOOL_OR(l.user_id = ${parseInt(userId)}) AS liked_by_me,` : 'false AS liked_by_me,'}
        COALESCE(p.view_count, 0) AS view_count
      FROM portfolios p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN portfolio_likes l ON l.portfolio_id = p.id
      WHERE p.is_public = true
    `;
    const params = [];

    if (category && category !== '전체') {
      params.push(category);
      query += ` AND (p.category = $${params.length} OR (p.sub_categories IS NOT NULL AND p.sub_categories ILIKE '%' || $${params.length} || '%'))`;
    }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (p.title ILIKE $${params.length} OR p.tech_environment ILIKE $${params.length} OR p.team_members ILIKE $${params.length} OR p.service_intro ILIKE $${params.length})`;
    }

    query += ' GROUP BY p.id, u.nickname';

    if (search) {
      // 검색 시: 제목 일치 우선, 그 다음 최신순
      query += ` ORDER BY (CASE WHEN p.title ILIKE $${params.length} THEN 0 ELSE 1 END), p.created_at DESC`;
    } else if (sort === 'likes') {
      query += ' ORDER BY like_count DESC, p.created_at DESC';
    } else if (sort === 'views') {
      query += ' ORDER BY p.view_count DESC, p.created_at DESC';
    } else {
      query += ' ORDER BY p.created_at DESC';
    }

    const result = await pool.query(query, params);
    res.json({ success: true, portfolios: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: '데이터를 가져오는 중 오류가 발생했습니다.' });
  }
});

// 상세 조회 + 조회수 증가
app.get('/api/portfolios/:id', optionalAuth, async (req, res) => {
  try {
    const userId = req.user?.id || null;

    // 조회수 증가
    await pool.query('UPDATE portfolios SET view_count = COALESCE(view_count, 0) + 1 WHERE id = $1', [req.params.id]);

    const result = await pool.query(`
      SELECT p.*, u.nickname, u.username, u.email,
        COUNT(DISTINCT l.id) AS like_count,
        ${userId ? `BOOL_OR(l.user_id = ${parseInt(userId)}) AS liked_by_me` : 'false AS liked_by_me'}
      FROM portfolios p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN portfolio_likes l ON l.portfolio_id = p.id
      WHERE p.id = $1
      GROUP BY p.id, u.nickname, u.username, u.email
    `, [req.params.id]);

    if (result.rows.length === 0)
      return res.status(404).json({ success: false, message: '포트폴리오를 찾을 수 없습니다.' });

    const media = await pool.query(
      'SELECT * FROM portfolio_media WHERE portfolio_id = $1 ORDER BY order_num',
      [req.params.id]
    ).catch(() => ({ rows: [] }));

    const comments = await pool.query(`
      SELECT c.*, u.nickname, u.username
      FROM portfolio_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.portfolio_id = $1
      ORDER BY c.created_at DESC
    `, [req.params.id]).catch(() => ({ rows: [] }));

    res.json({
      success: true,
      portfolio: {
        ...result.rows[0],
        media: media.rows,
        comments: comments.rows,
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: '상세 정보 조회 오류.' });
  }
});

app.get('/api/my/portfolios', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, COUNT(DISTINCT l.id) AS like_count, COALESCE(p.view_count,0) AS view_count
       FROM portfolios p
       LEFT JOIN portfolio_likes l ON l.portfolio_id = p.id
       WHERE p.user_id = $1
       GROUP BY p.id
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, portfolios: result.rows });
  } catch {
    res.status(500).json({ success: false, message: '내 포트폴리오 조회 오류.' });
  }
});

// 포트폴리오 등록
app.post('/api/portfolios', authMiddleware, upload.fields([
  { name: 'main_image', maxCount: 1 },
  { name: 'extra_images', maxCount: 100 },
]), async (req, res) => {
  const {
    title, category, service_intro,
    main_features, tech_environment,
    team_members, dev_period, github_link, is_public,
    run_link, file_link, store_link, design_tool, design_link, sub_categories,
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
        (user_id, title, category, sub_categories, main_image, service_intro,
        main_features, tech_environment, team_members, dev_period,
        github_link, is_public, run_link, file_link, store_link, design_tool, design_link)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       RETURNING *`,
      [
        req.user.id, title, category, sub_categories || null, main_image_url,
        service_intro || null, main_features || null,
        tech_environment || null, team_members || null,
        dev_period || null, github_link || null,
        is_public === 'false' ? false : true,
        run_link || null, file_link || null, store_link || null, design_tool || null,
        design_link || null,
      ]
    );

    const portfolioId = result.rows[0].id;

    // 추가 미디어 파일 저장
    const media_files = req.files?.['extra_images'] || [];
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
    run_link, file_link, store_link, design_tool, design_link, sub_categories,
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
      store_link=$12, design_tool=$13, design_link=$14, updated_at=NOW()`;

    const params = [
      title, category,
      service_intro || null, main_features || null,
      tech_environment || null, team_members || null,
      dev_period || null, github_link || null,
      is_public === 'false' ? false : true,
      run_link || null, file_link || null, store_link || null, design_tool || null, design_link || null,
    ];

    if (sub_categories !== undefined) { query += `, sub_categories=$${params.length + 1}`; params.push(sub_categories || null); }
    if (main_image_url) { query += `, main_image=$${params.length + 1}`; params.push(main_image_url); }
    query += ` WHERE id=$${params.length + 1} RETURNING *`;
    params.push(req.params.id);

    const result = await pool.query(query, params);

    // 디자인 추가 이미지 처리
    const extra_images = req.files?.['extra_images'] || [];
    const keepExistingMedia = req.body.keep_existing_media === 'true';

    if (extra_images.length > 0) {
      // 새 이미지가 있으면 기존 미디어 삭제 후 새로 저장
      const oldMedia = await pool.query('SELECT media_url FROM portfolio_media WHERE portfolio_id = $1', [req.params.id]).catch(() => ({ rows: [] }));
      if (useCloudinary) {
        await Promise.all(oldMedia.rows.map(r => deleteFromCloudinary(r.media_url)));
      }
      await pool.query('DELETE FROM portfolio_media WHERE portfolio_id = $1', [req.params.id]).catch(() => {});
      for (let i = 0; i < extra_images.length; i++) {
        const mediaUrl = await uploadFile(extra_images[i].path, 'portfolio_media');
        await pool.query(
          'INSERT INTO portfolio_media (portfolio_id, media_url, media_type, order_num) VALUES ($1, $2, $3, $4)',
          [req.params.id, mediaUrl, 'image', i]
        );
      }
    } else if (!keepExistingMedia) {
      // 새 이미지도 없고 유지 신호도 없으면 기존 미디어 전체 삭제
      const oldMedia = await pool.query('SELECT media_url FROM portfolio_media WHERE portfolio_id = $1', [req.params.id]).catch(() => ({ rows: [] }));
      if (useCloudinary) {
        await Promise.all(oldMedia.rows.map(r => deleteFromCloudinary(r.media_url)));
      }
      await pool.query('DELETE FROM portfolio_media WHERE portfolio_id = $1', [req.params.id]).catch(() => {});
    }
    // keepExistingMedia === true 이면 기존 미디어 그대로 유지 (아무것도 안 함)

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

    if (useCloudinary) {
      const mainImageUrl = check.rows[0].main_image;
      const mediaRows = await pool.query(
        'SELECT media_url FROM portfolio_media WHERE portfolio_id = $1',
        [req.params.id]
      ).catch(() => ({ rows: [] }));
      const imageRows = await pool.query(
        'SELECT image_url FROM portfolio_images WHERE portfolio_id = $1',
        [req.params.id]
      ).catch(() => ({ rows: [] }));
      const allUrls = [
        mainImageUrl,
        ...mediaRows.rows.map(r => r.media_url),
        ...imageRows.rows.map(r => r.image_url),
      ].filter(Boolean);
      await Promise.all(allUrls.map(url => deleteFromCloudinary(url)));
    }

    await pool.query('DELETE FROM portfolios WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: '포트폴리오가 삭제되었습니다.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
  }
});

// ══════════════════════════════════════════════════════════════
// 좋아요 API
// ══════════════════════════════════════════════════════════════

// 좋아요 상태 조회
app.get('/api/portfolios/:id/like', optionalAuth, async (req, res) => {
  try {
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM portfolio_likes WHERE portfolio_id = $1',
      [req.params.id]
    );
    const count = parseInt(countResult.rows[0].count);
    let liked = false;
    if (req.user) {
      const likeResult = await pool.query(
        'SELECT id FROM portfolio_likes WHERE portfolio_id = $1 AND user_id = $2',
        [req.params.id, req.user.id]
      );
      liked = likeResult.rows.length > 0;
    }
    res.json({ success: true, liked, count });
  } catch (err) {
    res.status(500).json({ success: false, liked: false, count: 0 });
  }
});

app.post('/api/portfolios/:id/like', authMiddleware, async (req, res) => {
  try {
    const existing = await pool.query(
      'SELECT id FROM portfolio_likes WHERE portfolio_id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (existing.rows.length > 0) {
      // 이미 좋아요 → 취소
      await pool.query('DELETE FROM portfolio_likes WHERE portfolio_id = $1 AND user_id = $2',
        [req.params.id, req.user.id]);
    } else {
      // 좋아요 추가
      await pool.query('INSERT INTO portfolio_likes (portfolio_id, user_id) VALUES ($1, $2)',
        [req.params.id, req.user.id]);
    }

    const count = await pool.query(
      'SELECT COUNT(*) FROM portfolio_likes WHERE portfolio_id = $1',
      [req.params.id]
    );
    res.json({ success: true, liked: existing.rows.length === 0, like_count: parseInt(count.rows[0].count) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: '좋아요 처리 중 오류가 발생했습니다.' });
  }
});

// ══════════════════════════════════════════════════════════════
// 댓글 API
// ══════════════════════════════════════════════════════════════

app.get('/api/portfolios/:id/comments', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, u.nickname, u.username
      FROM portfolio_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.portfolio_id = $1
      ORDER BY c.created_at DESC
    `, [req.params.id]);
    res.json({ success: true, comments: result.rows });
  } catch {
    res.status(500).json({ success: false, message: '댓글 조회 오류.' });
  }
});

app.post('/api/portfolios/:id/comments', authMiddleware, async (req, res) => {
  const { content } = req.body;
  if (!content?.trim())
    return res.status(400).json({ success: false, message: '댓글 내용을 입력해주세요.' });
  try {
    const result = await pool.query(
      `INSERT INTO portfolio_comments (portfolio_id, user_id, content)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [req.params.id, req.user.id, content.trim()]
    );
    const comment = await pool.query(`
      SELECT c.*, u.nickname, u.username
      FROM portfolio_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = $1
    `, [result.rows[0].id]);
    res.status(201).json({ success: true, comment: comment.rows[0] });
  } catch {
    res.status(500).json({ success: false, message: '댓글 등록 오류.' });
  }
});

app.delete('/api/comments/:id', authMiddleware, async (req, res) => {
  try {
    const check = await pool.query('SELECT user_id FROM portfolio_comments WHERE id = $1', [req.params.id]);
    if (check.rows.length === 0)
      return res.status(404).json({ success: false, message: '댓글을 찾을 수 없습니다.' });
    if (check.rows[0].user_id !== req.user.id)
      return res.status(403).json({ success: false, message: '삭제 권한이 없습니다.' });
    await pool.query('DELETE FROM portfolio_comments WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, message: '댓글 삭제 오류.' });
  }
});


// ══════════════════════════════════════════════════════════════
// 관리자 API
// ══════════════════════════════════════════════════════════════

// 전체 유저 목록
app.get('/api/admin/users', adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, nickname, email, created_at, is_admin FROM users ORDER BY created_at DESC'
    );
    res.json({ success: true, users: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: '유저 목록 조회 오류' });
  }
});

// 유저 강제 탈퇴
app.delete('/api/admin/users/:id', adminMiddleware, async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.user.id)
      return res.status(400).json({ success: false, message: '본인 계정은 삭제할 수 없습니다.' });

    // Cloudinary 미디어 삭제
    if (useCloudinary) {
      const portfolios = await pool.query('SELECT id, main_image FROM portfolios WHERE user_id = $1', [req.params.id]);
      for (const p of portfolios.rows) {
        const mediaRows = await pool.query('SELECT media_url FROM portfolio_media WHERE portfolio_id = $1', [p.id]).catch(() => ({ rows: [] }));
        const allUrls = [p.main_image, ...mediaRows.rows.map(r => r.media_url)].filter(Boolean);
        await Promise.all(allUrls.map(url => deleteFromCloudinary(url)));
      }
    }

    await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: '유저가 삭제되었습니다.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: '유저 삭제 오류' });
  }
});

// 전체 포트폴리오 목록 (관리자용)
app.get('/api/admin/portfolios', adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, u.nickname, u.username FROM portfolios p
       JOIN users u ON p.user_id = u.id
       ORDER BY p.created_at DESC`
    );
    res.json({ success: true, portfolios: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: '포트폴리오 목록 조회 오류' });
  }
});

// 관리자 포트폴리오 강제 삭제
app.delete('/api/admin/portfolios/:id', adminMiddleware, async (req, res) => {
  try {
    const check = await pool.query('SELECT main_image FROM portfolios WHERE id = $1', [req.params.id]);
    if (check.rows.length === 0) return res.status(404).json({ success: false, message: '포트폴리오를 찾을 수 없습니다.' });

    if (useCloudinary) {
      const mediaRows = await pool.query('SELECT media_url FROM portfolio_media WHERE portfolio_id = $1', [req.params.id]).catch(() => ({ rows: [] }));
      const allUrls = [check.rows[0].main_image, ...mediaRows.rows.map(r => r.media_url)].filter(Boolean);
      await Promise.all(allUrls.map(url => deleteFromCloudinary(url)));
    }

    await pool.query('DELETE FROM portfolios WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: '포트폴리오가 삭제되었습니다.' });
  } catch (err) {
    res.status(500).json({ success: false, message: '포트폴리오 삭제 오류' });
  }
});

// 전체 댓글 목록 (관리자용)
app.get('/api/admin/comments', adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, u.nickname, u.username, p.title AS portfolio_title
       FROM portfolio_comments c
       JOIN users u ON c.user_id = u.id
       JOIN portfolios p ON c.portfolio_id = p.id
       ORDER BY c.created_at DESC`
    );
    res.json({ success: true, comments: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: '댓글 목록 조회 오류' });
  }
});

// 관리자 댓글 강제 삭제
app.delete('/api/admin/comments/:id', adminMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM portfolio_comments WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: '댓글이 삭제되었습니다.' });
  } catch (err) {
    res.status(500).json({ success: false, message: '댓글 삭제 오류' });
  }
});
app.listen(PORT, () => {
  console.log(`✅ 서버가 포트 ${PORT}에서 실행중입니다.`);
});

// ══════════════════════════════════════════════════════════════
// 계정 탈퇴 API
// ══════════════════════════════════════════════════════════════

app.delete('/api/users/me', authMiddleware, async (req, res) => {
  try {
    // 내 포트폴리오의 Cloudinary 파일들 삭제
    if (useCloudinary) {
      const portfolios = await pool.query(
        'SELECT main_image FROM portfolios WHERE user_id = $1', [req.user.id]
      );
      const mediaRows = await pool.query(
        `SELECT pm.media_url FROM portfolio_media pm
         JOIN portfolios p ON pm.portfolio_id = p.id
         WHERE p.user_id = $1`, [req.user.id]
      ).catch(() => ({ rows: [] }));

      const allUrls = [
        ...portfolios.rows.map(r => r.main_image),
        ...mediaRows.rows.map(r => r.media_url),
      ].filter(Boolean);

      await Promise.all(allUrls.map(url => deleteFromCloudinary(url)));
    }

    // users 삭제 시 CASCADE로 portfolios, likes, comments도 전부 삭제됨
    await pool.query('DELETE FROM users WHERE id = $1', [req.user.id]);
    res.json({ success: true, message: '계정이 삭제되었습니다.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: '탈퇴 처리 중 오류가 발생했습니다.' });
  }
});