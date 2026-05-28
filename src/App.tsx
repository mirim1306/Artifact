import React, { useState, useEffect } from 'react';
import styled, { keyframes, createGlobalStyle, css } from 'styled-components';
import ProjectDetail from './components/ProjectDetail';
import AuthPage from './components/Authpage';
import RegisterPage from './components/Registerpage';
import MyPage from './components/Mypage';
import { portfolioAPI } from './Api';

const GlobalStyle = createGlobalStyle`
  * { box-sizing: border-box; }
  html, body {
    margin: 0; padding: 0; width: 100%; overflow-x: hidden;
    background: linear-gradient(180deg, #252433 0%, #22242b 40%, #000000 100%) no-repeat fixed;
    color: white;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  }
`;

const scrollX = keyframes`
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
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
}

interface User {
  id: number;
  username: string;
  nickname: string;
  email: string;
  created_at?: string;
}

const App = () => {
  const [tab, setTab] = useState<Category>('전체');
  const [navTab, setNavTab] = useState<NavTab>('home');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [portfolios, setPortfolios] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) setUser(JSON.parse(savedUser));
  }, []);

  useEffect(() => {
    if (navTab === 'home') fetchPortfolios();
  }, [navTab, tab]);

  const fetchPortfolios = async () => {
    setLoading(true);
    const res = await portfolioAPI.getAll(tab === '전체' ? undefined : tab);
    if (res.success) setPortfolios(res.portfolios);
    setLoading(false);
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
    if (selectedProject) {
      return <ProjectDetail project={selectedProject} onBack={() => setSelectedProject(null)} />;
    }
    if (navTab === 'register') {
      return <RegisterPage onBack={() => setNavTab('home')} onSuccess={() => { setNavTab('home'); fetchPortfolios(); }} />;
    }
    if (navTab === 'mypage' && user) {
      return <MyPage user={user} onBack={() => setNavTab('home')} onRegister={() => setNavTab('register')} />;
    }
    return (
      <>
        <Nav>
          {(['전체', '앱', '웹', '디자인', '게임'] as Category[]).map(c => (
            <TabButton key={c} $active={tab === c} onClick={() => setTab(c)}>{c}</TabButton>
          ))}
        </Nav>

        <CarouselSection>
          <InfiniteTrack>
            {[...portfolios, ...portfolios].map((item, i) => (
              <CarouselCard key={i}>
                <img src={item.main_image ? `http://localhost:4000${item.main_image}` : '/artifact-logo.png'} alt="carousel" />
              </CarouselCard>
            ))}
          </InfiniteTrack>
        </CarouselSection>

        <GridMain>
          {loading ? (
            <LoadingText>불러오는 중...</LoadingText>
          ) : portfolios.length === 0 ? (
            <EmptyText>등록된 포트폴리오가 없어요.</EmptyText>
          ) : (
            portfolios.map(item => (
              <GridItem key={item.id} onDoubleClick={() => setSelectedProject(item)}>
                <div className="image-box">
                  <img
                    src={item.main_image ? `http://localhost:4000${item.main_image}` : '/artifact-logo.png'}
                    alt={item.title}
                  />
                  <div className="card-info">
                    <span className="cat">{item.category}</span>
                    <span className="id">{String(item.id).padStart(2, '0')}</span>
                  </div>
                  <div className="hover-tip">더블 클릭 하세요!</div>
                </div>
                <div className="title-label">{item.title}</div>
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
            <LogoWrapper>
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

        <ContentArea>
          {renderContent()}
        </ContentArea>
      </PageWrapper>
    </>
  );
};

export default App;

const PageWrapper = styled.div`
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const TopArea = styled.div`
  width: 100%;
  padding-bottom: 20px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 40px;
`;
const LogoWrapper = styled.div``;
const Logo = styled.img` height: 80px; width: auto; `;
const HeaderRight = styled.div` display: flex; align-items: center; gap: 12px; `;
const NicknameText = styled.span` font-size: 15px; color: rgba(255,255,255,0.8); font-weight: 600; `;
const HeaderButton = styled.button<{ $outline?: boolean }>`
  padding: 10px 20px; border-radius: 50px; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.3s;
  ${props => props.$outline ? css`
    background: transparent; border: 1px solid rgba(255,255,255,0.3); color: rgba(255,255,255,0.7);
    &:hover { border-color: white; color: white; }
  ` : css`
    background: linear-gradient(135deg, #7b2cbf, #ff85a1); border: none; color: white;
    &:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(123,44,191,0.4); }
  `}
`;

const NavPanel = styled.div`
  display: flex;
  justify-content: center;
  padding: 0 40px;
`;
const NavPanelInner = styled.div`
  display: flex; gap: 8px;
  background: rgba(255,255,255,0.08);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 50px;
  padding: 6px;
`;
const NavItem = styled.button<{ $active: boolean }>`
  padding: 12px 40px; border-radius: 50px; font-size: 15px; font-weight: 700;
  cursor: pointer; border: none; transition: all 0.3s;
  ${props => props.$active ? css`
    background: linear-gradient(135deg, #7b2cbf, #ff85a1); color: white;
    box-shadow: 0 4px 12px rgba(123,44,191,0.4);
  ` : css`
    background: transparent; color: rgba(255,255,255,0.6);
    &:hover { background: rgba(255,255,255,0.1); color: white; }
  `}
`;

const ContentArea = styled.div`
  flex: 1;
  padding-top: 30px;
`;

const Nav = styled.nav` display: flex; justify-content: center; gap: 40px; margin-bottom: 70px; `;
const TabButton = styled.button<{ $active: boolean }>`
  padding: 14px 42px; border-radius: 50px; font-size: 18px; font-weight: 800;
  cursor: pointer; border: none; outline: none;
  transition: all 0.5s cubic-bezier(0.68, -0.6, 0.32, 1.6);
  ${props => props.$active ? css`
    background: linear-gradient(135deg, #7b2cbf 0%, #ff85a1 100%); color: white;
    box-shadow: 0 10px 20px rgba(123, 44, 191, 0.4); transform: translateY(-12px) scale(1.12);
  ` : css`
    background: rgba(255, 255, 255, 0.1); color: rgba(255, 255, 255, 0.5); backdrop-filter: blur(10px);
    &:hover { background: rgba(255, 255, 255, 0.2); color: white; transform: translateY(-5px) scale(1.05); }
  `}
`;
const CarouselSection = styled.section` width: 100%; overflow: hidden; margin-bottom: 80px; `;
const InfiniteTrack = styled.div` display: flex; width: max-content; gap: 25px; animation: ${scrollX} 60s linear infinite; `;
const CarouselCard = styled.div` width: 400px; aspect-ratio: 16 / 9; img { width: 100%; height: 100%; object-fit: cover; border-radius: 24px; } `;
const GridMain = styled.main` display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px; padding: 0 60px 100px; `;
const GridItem = styled.div`
  display: flex; flex-direction: column; cursor: pointer;
  .image-box {
    width: 100%; aspect-ratio: 16 / 10; overflow: hidden; position: relative; border-radius: 24px; background: rgba(0,0,0,0.3);
    img { width: 100%; height: 100%; object-fit: cover; transition: 0.6s ease; }
    .card-info { position: absolute; top: 15px; left: 20px; right: 20px; display: flex; justify-content: space-between; font-size: 11px; font-weight: bold; }
    .hover-tip { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); opacity: 0; transition: 0.3s; }
  }
  &:hover img { transform: scale(1.08); }
  &:hover .hover-tip { opacity: 1; }
  .title-label { padding: 15px 5px; text-align: center; font-size: 18px; font-weight: 700; }
`;
const LoadingText = styled.div` grid-column: 1/-1; text-align: center; padding: 60px; color: rgba(255,255,255,0.5); font-size: 16px; `;
const EmptyText = styled.div` grid-column: 1/-1; text-align: center; padding: 60px; color: rgba(255,255,255,0.4); font-size: 16px; `;
const Footer = styled.footer` padding: 80px 60px; background: rgba(0, 0, 0, 0.3); border-top: 1px solid rgba(255, 255, 255, 0.05); `;
const FooterContent = styled.div` max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; `;
const GithubLink = styled.a` display: flex; align-items: center; gap: 12px; text-decoration: none; color: white; background: rgba(255, 255, 255, 0.1); padding: 12px 24px; border-radius: 12px; transition: 0.3s; font-weight: 600; &:hover { background: rgba(255, 255, 255, 0.2); transform: translateY(-3px); } `;