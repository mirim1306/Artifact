import { useState, useEffect, useCallback } from 'react';
import styled, { createGlobalStyle, css } from 'styled-components';
import ProjectDetail from './components/ProjectDetail';
import AuthPage from './components/Authpage';
import RegisterPage from './components/Registerpage';
import MyPage from './components/Mypage';
import { portfolioAPI } from './Api';

const GlobalStyle = createGlobalStyle`
  * { box-sizing: border-box; }
  html, body {
    margin: 0; padding: 0; width: 100%; overflow-x: hidden;
    background: linear-gradient(180deg, #141828 0%, #1c2440 50%, #111623 100%) no-repeat fixed;
    color: white;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  }
`;

type Category = '전체' | '앱' | '웹' | '디자인' | '게임';
type NavTab = 'home' | 'register' | 'mypage';

interface Project {
  id: number;
  category: string;
  title: string;
  main_image: string;
  one_line_desc?: string;
  run_link?: string;
  file_link?: string;
  store_link?: string;
  is_public: boolean;
  nickname?: string;
  sub_categories?: string;
}

interface User {
  id: number;
  username: string;
  nickname: string;
  email: string;
  created_at?: string;
}

interface SliderItem {
  id: number;
  title: string;
  image: string;
  category: string;
  projectRef: Project;
}

// Cloudinary URL(http/https)과 로컬 경로(/uploads/...) 모두 처리
const getImageUrl = (url: string | undefined): string => {
  if (!url) return '/artifact-logo.png';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `http://localhost:4000${url.startsWith('/') ? '' : '/'}${url}`;
};

const App = () => {
  const [tab, setTab] = useState<Category>('전체');
  const [navTab, setNavTab] = useState<NavTab>('home');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [portfolios, setPortfolios] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [sliderItems, setSliderItems] = useState<SliderItem[]>([]);
  const [sliderIndex, setSliderIndex] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [sort, setSort] = useState<'latest' | 'likes' | 'views'>('latest');
  const [editPortfolio, setEditPortfolio] = useState<Project | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const fetchPortfolios = useCallback(async (currentTab: Category, currentSort = 'latest', query = '') => {
    setLoading(true);
    try {
      const res = await portfolioAPI.getAll(currentTab === '전체' ? undefined : currentTab, currentSort !== 'latest' ? currentSort : undefined, query || undefined);
      if (res && res.success && Array.isArray(res.portfolios)) {
        setPortfolios(res.portfolios);
        const itemsForSlider = res.portfolios.slice(0, 5).map((p: Project) => ({
          id: p.id, title: p.title, image: p.main_image, category: p.category, projectRef: p,
        }));
        setSliderItems(itemsForSlider);
      } else {
        setPortfolios([]);
        setSliderItems([]);
      }
    } catch (error) {
      console.error('데이터를 가져오는 중 오류가 발생했습니다:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (navTab === 'home') fetchPortfolios(tab, sort);
  }, [navTab, tab, sort, refreshTrigger, fetchPortfolios]);

  // 자동 슬라이더 (5초)
  useEffect(() => {
    if (sliderItems.length > 1 && navTab === 'home' && !selectedProject) {
      const timer = setInterval(() => {
        setSliderIndex((prev) => (prev + 1) % sliderItems.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [sliderItems, navTab, selectedProject]);

  const handleTabChange = (c: Category) => {
    setTab(c);
    setSliderIndex(0);
  };

  const handleLogin = (userData: User, token: string) => {
    setUser(userData);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setShowAuth(false);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setNavTab('home');
    setSelectedProject(null);
  };

  const handleNavRegister = () => {
    if (!user) { setShowAuth(true); return; }
    setNavTab('register');
    setSelectedProject(null);
  };

  const handleNavMypage = () => {
    if (!user) { setShowAuth(true); return; }
    setNavTab('mypage');
    setSelectedProject(null);
  };

  const handleNavHome = () => {
    setNavTab('home');
    setSelectedProject(null);
  };

  if (showAuth) return (
    <>
      <GlobalStyle />
      <AuthPage onLogin={handleLogin} onBack={() => setShowAuth(false)} />
    </>
  );

  const renderContent = () => {
    if (selectedProject) return <ProjectDetail project={selectedProject} onBack={() => setSelectedProject(null)} />;

    if (navTab === 'register') {
      return (
        <RegisterPage

          onSuccess={() => {
            setNavTab('home');
            setSliderIndex(0);
            setEditPortfolio(null);
            setRefreshTrigger(prev => prev + 1);
          }}
          editData={editPortfolio}
        />
      );
    }

    if (navTab === 'mypage' && user)
      return <MyPage user={user} onRegister={() => setNavTab('register')}
        onEdit={(p: Project) => { setEditPortfolio(p); setNavTab('register'); }}
        onLogout={handleLogout} />;

    return (
      <>
        {sliderItems.length > 0 && (
          <MainSliderSection>
            <SliderContainer>
              <SliderTrack $currentIndex={sliderIndex}>
                {sliderItems.map((item, idx) => (
                  <SlideItem key={idx} onDoubleClick={async () => {
                    const res = await portfolioAPI.getOne(item.projectRef.id);
                    if (res.success) setSelectedProject(res.portfolio);
                    else setSelectedProject(item.projectRef);
                  }}>
                    <img src={getImageUrl(item.image)} alt={item.title} />
                    <SliderOverlay><h2>{item.title}</h2></SliderOverlay>
                  </SlideItem>
                ))}
              </SliderTrack>
              {sliderItems.length > 1 && (
                <>
                  <SliderArrowBtn $left onClick={() => setSliderIndex(i => (i - 1 + sliderItems.length) % sliderItems.length)}>‹</SliderArrowBtn>
                  <SliderArrowBtn onClick={() => setSliderIndex(i => (i + 1) % sliderItems.length)}>›</SliderArrowBtn>
                  <SliderDots>
                    {sliderItems.map((_, i) => (
                      <Dot key={i} $active={i === sliderIndex} onClick={() => setSliderIndex(i)} />
                    ))}
                  </SliderDots>
                </>
              )}
            </SliderContainer>
          </MainSliderSection>
        )}

        <SearchRow>
          <SearchInput
            type="text"
            placeholder="제목, 기술 스택, 팀원 이름으로 검색..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') fetchPortfolios(tab, sort, searchQuery); }}
          />
          <SearchBtn onClick={() => fetchPortfolios(tab, sort, searchQuery)}>검색</SearchBtn>
        </SearchRow>

        <ControlRow>
          <Nav>
            {(['전체', '앱', '웹', '디자인', '게임'] as Category[]).map(c => (
            <TabButton key={c} $active={tab === c} onClick={() => handleTabChange(c)}>{c}</TabButton>
          ))}
          </Nav>
          <SortRow>
            {([['latest','최신순'], ['likes','좋아요순'], ['views','조회순']] as const).map(([key, label]) => (
              <SortBtn key={key} $active={sort === key} onClick={() => { setSort(key); fetchPortfolios(tab, key, searchQuery); }}>{label}</SortBtn>
            ))}
          </SortRow>
        </ControlRow>

        <GridMain>
          {loading ? (
            <LoadingText>불러오는 중...</LoadingText>
          ) : portfolios.length === 0 ? (
            <EmptyText>등록된 포트폴리오가 없어요.</EmptyText>
          ) : (
            portfolios.map(item => (
              <GridItem key={item.id} onDoubleClick={async () => {
                const res = await portfolioAPI.getOne(item.id);
                if (res.success) setSelectedProject(res.portfolio);
                else setSelectedProject(item);
              }}>
                <div className="image-box">
                  <img src={getImageUrl(item.main_image)} alt={item.title} />
                  <div className="card-info">
                    <span className="cat">{item.category}</span>
                    {(item as any).sub_categories && (item as any).sub_categories.split(',').map((s: string, i: number) => (
                      <span key={i} className="sub-cat">{s.trim()}</span>
                    ))}
                  </div>
                  <div className="hover-tip">더블 클릭 하세요!</div>
                </div>
                <div className="title-label">{item.title}</div>
                {item.nickname && <div className="nickname-label">by {item.nickname}</div>}
                <div className="stats-row">
                  <span>❤️ {(item as any).like_count || 0}</span>
                  <span>👁 {(item as any).view_count || 0}</span>
                </div>
              </GridItem>
            ))
          )}
        </GridMain>

        <Footer>
          <FooterContent>
            <div className="info">
              <h3>ARTIFACT</h3>
              <p>© 2026 ARTIFACT Team. All rights reserved.</p>
            </div>
            <GithubLink href="https://github.com/mirim1306/Artifact" target="_blank" rel="noreferrer">
              <svg height="24" viewBox="0 0 16 16" width="24" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path></svg>
              <span>Visit our GitHub</span>
            </GithubLink>
          </FooterContent>
        </Footer>
      </>
    );
  };

  return (
    <>
      <GlobalStyle />
      <PageWrapper>
        <TopArea>
          <Header>
            <LogoWrapper onClick={handleNavHome} style={{ cursor: 'pointer' }}>
              <Logo src="/artifact-logo.png" alt="ARTIFACT" />
            </LogoWrapper>
            <HeaderRight>
              {user ? (
                <>
                  <NicknameText>👋 {user.nickname}</NicknameText>
                  <HeaderButton $outline onClick={handleLogout}>로그아웃</HeaderButton>
                </>
              ) : (
                <HeaderButton onClick={() => setShowAuth(true)}>로그인 / 회원가입</HeaderButton>
              )}
            </HeaderRight>
          </Header>
          <NavPanel>
            <NavPanelInner>
              <NavItem $active={navTab === 'home' && !selectedProject} onClick={handleNavHome}>홈</NavItem>
              <NavItem $active={navTab === 'register'} onClick={handleNavRegister}>등록</NavItem>
              <NavItem $active={navTab === 'mypage'} onClick={handleNavMypage}>마이페이지</NavItem>
            </NavPanelInner>
          </NavPanel>
        </TopArea>
        <ContentArea>{renderContent()}</ContentArea>
      </PageWrapper>
    </>
  );
};

export default App;

/* ── 레이아웃 ── */
const PageWrapper = styled.div` width: 100%; min-height: 100vh; display: flex; flex-direction: column; `;
const TopArea = styled.div` width: 100%; padding-bottom: 20px; `;
const Header = styled.div` display: flex; justify-content: space-between; align-items: center; padding: 20px 40px; `;
const LogoWrapper = styled.div``;
const Logo = styled.img` height: 50px; width: auto; object-fit: contain; `;
const HeaderRight = styled.div` display: flex; align-items: center; gap: 12px; `;
const NicknameText = styled.span` font-size: 15px; color: rgba(255,255,255,0.8); font-weight: 600; `;

/* ── 헤더 버튼 ── */
const HeaderButton = styled.button<{ $outline?: boolean }>`
  padding: 12px 24px; border-radius: 50px; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.3s;
  ${props => props.$outline ? css`
    background: transparent;
    border: 1px solid rgba(159,151,232,0.45);
    color: rgba(191,186,242,0.85);
    &:hover { border-color: #bfbaf2; color: #bfbaf2; }
  ` : css`
    background: #7c6fcd;
    border: none;
    color: #ffffff;
    &:hover { transform: translateY(-2px); box-shadow: 0 5px 18px rgba(124,111,205,0.5); background: #9187d8; }
  `}
`;

/* ── 네비게이션 패널 ── */
const NavPanel = styled.div` display: flex; justify-content: center; padding: 0 40px; margin-top: 10px; `;
const NavPanelInner = styled.div`
  display: flex; gap: 10px;
  background: rgba(20,24,40,0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 50px; padding: 8px;
`;
const NavItem = styled.button<{ $active: boolean }>`
  padding: 12px 45px; border-radius: 50px; font-size: 16px; font-weight: 700;
  cursor: pointer; border: none; transition: all 0.3s;
  ${props => props.$active ? css`
    background: #7c6fcd;
    color: #ffffff;
    box-shadow: 0 4px 12px rgba(124,111,205,0.4);
  ` : css`
    background: transparent; color: rgba(255,255,255,0.45);
    &:hover { background: rgba(255,255,255,0.05); color: white; }
  `}
`;
const ContentArea = styled.div` flex: 1; width: 100%; `;

/* ── 슬라이더 ── */
const MainSliderSection = styled.section` width: 100%; padding: 0 60px; margin-bottom: 10px; `;
const SliderContainer = styled.div`
  position: relative; width: 100%; aspect-ratio: 16/6; border-radius: 24px; overflow: hidden;
  background: #111623;
  box-shadow: 0 20px 40px rgba(0,0,0,0.5);
`;
const SliderTrack = styled.div<{ $currentIndex: number }>`
  display: flex; width: 100%; height: 100%;
  transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1);
  transform: translateX(${props => -(props.$currentIndex * 100)}%);
`;
const SlideItem = styled.div`
  min-width: 100%; width: 100%; height: 100%; position: relative; flex-shrink: 0; cursor: pointer;
  img { width: 100%; height: 100%; object-fit: cover; opacity: 0.85; }
`;
const SliderOverlay = styled.div`
  position: absolute; inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 65%);
  display: flex; flex-direction: column; justify-content: flex-end; padding: 50px;
  h2 { font-size: 36px; margin: 0; font-weight: 800; color: #ffffff; text-shadow: 0 2px 10px rgba(0,0,0,0.3); }
`;
const SliderArrowBtn = styled.button<{ $left?: boolean }>`
  position: absolute; top: 50%; transform: translateY(-50%);
  ${p => p.$left ? 'left: 30px;' : 'right: 30px;'}
  background: rgba(20,24,40,0.6);
  border: 1px solid rgba(159,151,232,0.25);
  color: #bfbaf2;
  font-size: 36px; width: 50px; height: 50px; border-radius: 50%; backdrop-filter: blur(4px);
  cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 5;
  transition: all 0.2s ease;
  &:hover {
    background: #7c6fcd;
    color: #ffffff;
    border-color: transparent;
    transform: translateY(-50%) scale(1.08);
  }
`;
const SliderDots = styled.div` position: absolute; bottom: 35px; right: 50px; display: flex; gap: 8px; z-index: 5; `;
const Dot = styled.button<{ $active: boolean }>`
  width: ${p => p.$active ? '26px' : '9px'}; height: 9px; border-radius: 10px; border: none; cursor: pointer;
  background: ${p => p.$active ? '#7c6fcd' : 'rgba(255,255,255,0.25)'};
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
`;

/* ── 카테고리 탭 ── */
const Nav = styled.nav` display: flex; justify-content: center; gap: 16px; margin: 40px 0; `;
const TabButton = styled.button<{ $active: boolean }>`
  padding: 14px 36px; border-radius: 50px; font-size: 16px; font-weight: 700;
  cursor: pointer; border: 1px solid transparent; outline: none; transition: all 0.2s ease;
  ${props => props.$active ? css`
    background: #7c6fcd;
    color: #ffffff;
    border-color: transparent;
    box-shadow: 0 4px 15px rgba(124,111,205,0.3);
  ` : css`
    background: #1c2440;
    color: rgba(255,255,255,0.45);
    border-color: rgba(255,255,255,0.06);
    &:hover { background: #222e50; color: white; }
  `}
`;

/* ── 그리드 ── */
const GridMain = styled.main` display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px; padding: 0 60px 100px; `;
const GridItem = styled.div`
  display: flex; flex-direction: column; cursor: pointer;
  .image-box {
    width: 100%; aspect-ratio: 16 / 10; overflow: hidden; position: relative;
    border-radius: 16px; background: #1c2440; border: 1px solid rgba(255,255,255,0.05);
    img { width: 100%; height: 100%; object-fit: cover; transition: 0.5s ease; }
    .card-info { position: absolute; top: 15px; left: 20px; right: 20px; display: flex; flex-wrap: wrap; gap: 5px; align-items: flex-start; font-size: 11px; font-weight: bold; z-index: 2; }
    .cat { background: rgba(0,0,0,0.6); padding: 4px 10px; border-radius: 5px; }
    .sub-cat { background: rgba(0,0,0,0.6); padding: 4px 10px; border-radius: 5px; }
    .hover-tip { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); opacity: 0; transition: 0.3s; z-index: 1; }
  }
  &:hover img { transform: scale(1.04); }
  &:hover .hover-tip { opacity: 1; }
  .title-label { padding: 15px 5px 2px 5px; text-align: left; font-size: 18px; font-weight: 700; color: #eef0f8; }
  .nickname-label { padding: 2px 5px 0; font-size: 13px; color: rgba(255,255,255,0.4); }
  .stats-row { display: flex; gap: 12px; padding: 4px 5px 0; font-size: 12px; color: rgba(255,255,255,0.35); }
`;
const LoadingText = styled.div` grid-column: 1/-1; text-align: center; padding: 100px; color: rgba(255,255,255,0.4); font-size: 16px; `;
const EmptyText = styled.div` grid-column: 1/-1; text-align: center; padding: 100px; color: rgba(255,255,255,0.3); font-size: 16px; `;

const SearchRow = styled.div` display: flex; gap: 12px; padding: 0 60px; margin-top: 20px; margin-bottom: 0; `;
const SearchInput = styled.input`
  flex: 1; padding: 14px 20px; border-radius: 50px; font-size: 15px;
  background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1); color: white; outline: none;
  &::placeholder { color: rgba(255,255,255,0.3); }
  &:focus { border-color: #7c6fcd; }
`;
const SearchBtn = styled.button`
  padding: 14px 28px; border-radius: 50px; font-size: 15px; font-weight: 700;
  background: #7c6fcd; border: none; color: white; cursor: pointer;
  &:hover { background: #9187d8; }
`;
const ControlRow = styled.div` display: flex; justify-content: space-between; align-items: center; padding: 0 60px; margin: 20px 0; `;
const SortRow = styled.div` display: flex; gap: 8px; `;
const SortBtn = styled.button<{ $active: boolean }>`
  padding: 10px 20px; border-radius: 50px; font-size: 13px; font-weight: 700; cursor: pointer; border: 1px solid transparent;
  background: ${p => p.$active ? '#7c6fcd' : 'rgba(255,255,255,0.07)'};
  color: ${p => p.$active ? 'white' : 'rgba(255,255,255,0.5)'};
  &:hover { background: ${p => p.$active ? '#7c6fcd' : 'rgba(255,255,255,0.12)'}; color: white; }
`;

/* ── 푸터 ── */
const Footer = styled.footer`
  padding: 60px;
  background: #0d1022;
  border-top: 1px solid rgba(124,111,205,0.15);
`;
const FooterContent = styled.div`
  max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center;
  h3 { margin: 0 0 5px 0; font-size: 20px; color: #ffffff; }
  p { margin: 0; font-size: 14px; color: #ffffff; }
`;
const GithubLink = styled.a`
  display: flex; align-items: center; gap: 12px; text-decoration: none;
  color: #ffffff;
  background: #1a1f3a;
  padding: 10px 20px; border-radius: 10px; transition: 0.3s; font-size: 14px; font-weight: 600;
  border: 1px solid rgba(255, 255, 255, 0.3);
  &:hover { background: #1a1f3a; border-color: rgba(124,111,205,0.3); color: #ffffff; }
`;