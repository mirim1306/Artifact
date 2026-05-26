import React, { useState, useEffect } from 'react';
import styled, { keyframes, createGlobalStyle, css } from 'styled-components';
import ProjectDetail from './components/ProjectDetail';
import AuthPage from './components/Authpage';
import RegisterPage from './components/Registerpage';
import MyPage from './components/Mypage';

const GlobalStyle = createGlobalStyle`
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    overflow-x: hidden;
    background: linear-gradient(180deg, #35328a 0%, #173db9 40%, #000000 100%) no-repeat fixed;
    color: white;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  }
`;

const scrollX = keyframes`
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
`;

type Category = '전체' | '앱' | '웹' | '디자인' | '게임';
type Page = 'main' | 'auth' | 'detail' | 'register' | 'mypage';

interface Project {
  id: number;
  category: Category[];
  title: string;
  subTitle?: string;
  img: string;
  logo?: string;
  description?: string;
  url?: string;
}

interface User {
  id: number;
  username: string;
  nickname: string;
  email: string;
  created_at?: string;
}

const DATA: Project[] = [
  {
    id: 1, category: ['앱', '게임'], title: 'monster baseball', subTitle: '(숫자 야구 앱)',
    img: '/monster-baseball.png', logo: '/artifact-logo.png',
    description: '숨겨진 3자리 숫자를 유추하여 맞추는 몬스터 숫자야구 게임입니다.',
    url: 'https://jgj1020.github.io/monster-baseball-game/'
  },
  {
    id: 2, category: ['앱'], title: 'Meal_App (급식 iOS 앱)', subTitle: '(급식 iOS 앱)',
    img: '/Meal_App.png', logo: '/artifact-logo.png',
    description: '전국 학교의 급식 정보를 한눈에 확인하고 영양 정보를 체크할 수 있습니다.',
    url: 'https://jgj1020.github.io/meal_app/'
  },
  {
    id: 3, category: ['게임'], title: '슈퍼 알까기', subTitle: '알까기 게임',
    img: '/슈퍼_알까기-게임.png', logo: '/artifact-logo.png',
    description: '고유 능력을 가진 알로 하는 2D 전략 알까기 게임입니다. 다양한 캐릭터와 스킬을 활용하여 상대방을 이겨보세요.',
    url: 'https://github.com/mirim1306/Algaki/releases/download/v1.0.0/algaki_installer.exe'
  },
  {
    id: 4, category: ['웹', '게임'], title: '호냥이 대전쟁', subTitle: '라인 디펜스 게임',
    img: '/호냥이_대전쟁-웹.png', logo: '/artifact-logo.png',
    description: '귀여운 호냥이들이 적의 침략을 막아내는 라인 디펜스 게임입니다. 다양한 호냥이와 업그레이드를 통해 최강의 방어선을 구축하세요.',
    url: 'https://mirim1306.github.io/java-script-project2/'
  },
  {
    id: 5, category: ['게임'], title: '레인보우 홀덤', subTitle: '홀덤 카드 게임',
    img: '/레인보우_홀덤-게임.png', logo: '/artifact-logo.png',
    description: '1~10까지의 카드를 활용한 심리전 전략 카드 게임입니다. 상대방의 패를 예측하고 최대 이익을 벌고 승리하세요.',
    url: 'https://github.com/mirim1306/java-project2/releases/download/v1.0.0/rainbow_holdem_installer.exe'
  },
  {
    id: 6, category: ['게임'], title: '체스 카드 배틀', subTitle: '체스 카드 게임',
    img: '/체스카드-게임.png', logo: '/artifact-logo.png',
    description: '전통적인 체스와 카드 게임의 결합으로 이루어진 새로운 전략 게임입니다. 다양한 전략을 사용하여 상대방을 이겨보세요.',
    url: 'https://github.com/mirim1306/python-project/releases/download/v1.0.0/chesscardgame_installer.exe'
  },
  {
    id: 7, category: ['웹'], title: 'Match mood', subTitle: '감정 매칭 웹사이트',
    img: '/Match_mood.png', logo: '/artifact-logo.png',
    description: '사용자의 감정을 분석하여 비슷한 취미를 가진 사용자와 매칭해주는 웹사이트입니다.',
    url: 'https://match-mood.onrender.com'
  },
  {
    id: 8, category: ['웹'], title: '자기소개 웹사이트', subTitle: '개인 브랜딩 웹사이트',
    img: '/자기소개 웹사이트.png', logo: '/artifact-logo.png',
    description: '개인의 역량과 경험을 효과적으로 표현할 수 있는 자기소개 웹사이트입니다.',
    url: 'https://jgj1020.github.io/HTML-pr/'
  },
  {
    id: 9, category: ['앱', '웹', '게임'], title: '오목까기', subTitle: '고전적인 게임인 오목과 알까기의 결합으로 이루어진 전략 게임',
    img: '/오목까기-웹.png', logo: '/artifact-logo.png',
    description: '고전적인 오목과 알까기의 결합으로 이루어진 전략 게임입니다. 다양한 전략을 사용하여 상대방을 이겨보세요.',
    url: 'https://mirim1306.github.io/omokkkagi/'
  }
];

const App = () => {
  const [tab, setTab] = useState<Category>('전체');
  const [page, setPage] = useState<Page>('main');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const handleLogin = (userData: User, token: string) => {
    setUser(userData);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setPage('main');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setPage('main');
  };

  const handleNavRegister = () => {
    if (!user) { setPage('auth'); return; }
    setPage('register');
  };

  const handleNavMypage = () => {
    if (!user) { setPage('auth'); return; }
    setPage('mypage');
  };

  const filtered = tab === '전체' ? DATA : DATA.filter(d => d.category.includes(tab));

  if (page === 'auth') return <><GlobalStyle /><AuthPage onLogin={handleLogin} onBack={() => setPage('main')} /></>;
  if (page === 'detail' && selectedProject) return <><GlobalStyle /><ProjectDetail project={selectedProject} onBack={() => { setPage('main'); setSelectedProject(null); }} /></>;
  if (page === 'register') return <><GlobalStyle /><RegisterPage onBack={() => setPage('mypage')} onSuccess={() => setPage('mypage')} /></>;
  if (page === 'mypage' && user) return <><GlobalStyle /><MyPage user={user} onBack={() => setPage('main')} onRegister={() => setPage('register')} /></>;

  return (
    <>
      <GlobalStyle />
      <Container>
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
              <HeaderButton onClick={() => setPage('auth')}>로그인 / 회원가입</HeaderButton>
            )}
          </HeaderRight>
        </Header>

        <NavPanel>
          <NavPanelInner>
            <NavItem $active={page === 'main'} onClick={() => setPage('main')}>홈</NavItem>
            <NavItem $active={false} onClick={handleNavRegister}>등록</NavItem>
            <NavItem $active={false} onClick={handleNavMypage}>마이페이지</NavItem>
          </NavPanelInner>
        </NavPanel>

        <Nav>
          {['전체', '앱', '웹', '디자인', '게임'].map(c => (
            <TabButton key={c} $active={tab === c} onClick={() => setTab(c as Category)}>{c}</TabButton>
          ))}
        </Nav>

        <CarouselSection>
          <InfiniteTrack>
            {[...DATA, ...DATA].map((item, i) => (
              <CarouselCard key={i}><img src={item.img} alt="carousel" /></CarouselCard>
            ))}
          </InfiniteTrack>
        </CarouselSection>

        <GridMain>
          {filtered.map(item => (
            <GridItem key={item.id} onDoubleClick={() => { setSelectedProject(item); setPage('detail'); }}>
              <div className="image-box">
                <img src={item.img} alt={item.title} />
                <div className="card-info">
                  <span className="cat">{item.category.join(' / ')}</span>
                  <span className="id">{String(item.id).padStart(2, '0')}</span>
                </div>
                <div className="hover-tip">더블 클릭 하세요!</div>
              </div>
              <div className="title-label">{item.title}</div>
            </GridItem>
          ))}
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
      </Container>
    </>
  );
};

export default App;

const Container = styled.div` position: relative; width: 100%; padding-top: 160px; `;
const Header = styled.div`
  position: absolute; top: 0; left: 0; right: 0; z-index: 100;
  display: flex; justify-content: space-between; align-items: center;
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
  position: absolute; top: 80px; left: 0; right: 0; z-index: 99;
  display: flex; justify-content: center;
  padding: 0 40px;
  pointer-events: none;
  & > * { pointer-events: all; }
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
const Footer = styled.footer` padding: 80px 60px; background: rgba(0, 0, 0, 0.3); border-top: 1px solid rgba(255, 255, 255, 0.05); `;
const FooterContent = styled.div` max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; `;
const GithubLink = styled.a` display: flex; align-items: center; gap: 12px; text-decoration: none; color: white; background: rgba(255, 255, 255, 0.1); padding: 12px 24px; border-radius: 12px; transition: 0.3s; font-weight: 600; &:hover { background: rgba(255, 255, 255, 0.2); transform: translateY(-3px); } `;
