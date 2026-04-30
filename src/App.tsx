import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes, createGlobalStyle, css } from 'styled-components';

// 1. 전역 스타일: 배경 그라데이션 및 기본 폰트 설정
const GlobalStyle = createGlobalStyle`
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    overflow-x: hidden;
    background: linear-gradient(180deg, #35328a 0%, #173db9 40%, #000000 100%) no-repeat fixed;
    color: white;
    font-family: 'Inter', sans-serif;
  }
`;

// 애니메이션: 상단 무한 롤링 배너
const scrollX = keyframes`
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
`;

// 스크롤 시 나타나는 애니메이션 컴포넌트
const ScrollReveal = ({ children }: { children: React.ReactNode }) => {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => setIsVisible(entry.isIntersecting));
    });
    if (domRef.current) observer.observe(domRef.current);
    return () => { if (domRef.current) observer.unobserve(domRef.current); };
  }, []);

  return (
    <RevealWrapper ref={domRef} $isVisible={isVisible}>
      {children}
    </RevealWrapper>
  );
};

const RevealWrapper = styled.div<{ $isVisible: boolean }>`
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.8s ease-out;
  ${props => props.$isVisible && css`
    opacity: 1;
    transform: translateY(0);
  `}
`;

type Category = '전체' | '앱' | '웹' | '디자인' | '게임';

// --- [데이터 구성] ---
// 카테고리를 배열로 만들어 중복 탭 노출 가능하게 설정
const DATA: { id: number; category: Category[]; title: string; img: string }[] = [
  // 앱 카테고리
  { id: 1, category: ['앱'], title: 'Meal_App (급식 iOS 앱)', img: '/Meal_App.png' },
  { id: 2, category: ['앱', '게임'], title: '슈퍼 알까기', img: '/슈퍼_알까기-게임.png' },
  
  // 게임 & 웹 중복 (호냥이는 게임이면서 웹기술 기반)
  { id: 3, category: ['웹', '게임'], title: '호냥이 대전쟁', img: '/호냥이_대전쟁-웹.png' }, 

  // 게임 전용
  { id: 4, category: ['게임'], title: '레인보우 홀덤', img: '/레인보우_홀덤-게임.png' },
  { id: 5, category: ['게임'], title: '체스 카드 배틀', img: '/체스카드-게임.png' },

  // 웹 전용
  { id: 6, category: ['웹'], title: 'Match mood', img: '/Match_mood.png' },
  { id: 7, category: ['웹'], title: '자기소개 웹사이트', img: '/자기소개 웹사이트.png' },
  
  // 나머지 임시 데이터 (공간 채우기용)
  ...Array.from({ length: 5 }).map((_, i) => ({
    id: i + 8,
    category: [(i % 2 === 0 ? '디자인' : '웹')] as Category[],
    title: `PROJECT ${i + 8}`,
    img: `https://picsum.photos/seed/${i + 500}/800/500`
  }))
];

const App = () => {
  const [tab, setTab] = useState<Category>('전체');
  
  // 선택된 탭이 데이터의 카테고리 배열에 포함되어 있는지 필터링
  const filtered = tab === '전체' 
    ? DATA 
    : DATA.filter(d => d.category.includes(tab));

  return (
    <>
      <GlobalStyle />
      <Container>
        {/* [상단 1] 로고: 왼쪽 상단, 거대한 크기 */}
        <LogoWrapper>
          <Logo src="/artifact-logo.png" alt="ARTIFACT" />
        </LogoWrapper>

        {/* [상단 2] 카테고리 네비게이션 */}
        <Nav>
          {['전체', '앱', '웹', '디자인', '게임'].map(c => (
            <TabButton 
              key={c} 
              $active={tab === c} 
              onClick={() => setTab(c as Category)}
            >
              {c}
            </TabButton>
          ))}
        </Nav>

        {/* [중단] 무한 슬라이드 배너 */}
        <CarouselSection>
          <InfiniteTrack>
            {[...DATA.slice(0, 7), ...DATA.slice(0, 7)].map((item, i) => (
              <CarouselCard key={i}>
                <img src={item.img} alt="carousel" />
              </CarouselCard>
            ))}
          </InfiniteTrack>
        </CarouselSection>

        {/* [하단] 프로젝트 그리드 리스트 */}
        <GridMain>
          {filtered.map(item => (
            <ScrollReveal key={item.id}>
              <GridItem>
                <div className="image-box">
                  <img src={item.img} alt={item.title} />
                  <div className="card-info">
                    {/* 카테고리 여러 개일 경우 ' / '로 구분 표시 */}
                    <span className="cat">{item.category.join(' / ')}</span>
                    <span className="id">{String(item.id).padStart(2, '0')}</span>
                  </div>
                </div>
                <div className="title-label">{item.title}</div>
              </GridItem>
            </ScrollReveal>
          ))}
        </GridMain>
      </Container>
    </>
  );
};

export default App;

// --- [Styled Components] ---

const Container = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  padding-top: 280px; /* 로고 공간 확보 */
`;

const LogoWrapper = styled.div`
  position: absolute;
  top: 40px;
  left: 40px;
  z-index: 100;
`;

const Logo = styled.img`
  height: 200px; 
  width: auto;
  object-fit: contain;
`;

const Nav = styled.nav`
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-bottom: 50px;
`;

const TabButton = styled.button<{ $active: boolean }>`
  padding: 10px 30px;
  border-radius: 40px;
  border: 1.5px solid ${props => props.$active ? '#ff4d4d' : 'rgba(255, 255, 255, 0.3)'};
  background: ${props => props.$active ? '#ff4d4d' : 'transparent'};
  color: white;
  font-size: 16px; 
  font-weight: 600;
  cursor: pointer;
  transition: 0.3s;
  &:hover { border-color: #ff4d4d; }
`;

const CarouselSection = styled.section`
  width: 100%;
  overflow: hidden;
  margin-bottom: 60px;
`;

const InfiniteTrack = styled.div`
  display: flex;
  width: max-content;
  gap: 20px;
  animation: ${scrollX} 60s linear infinite;
  &:hover { animation-play-state: paused; } /* 마우스 올리면 정지 */
`;

const CarouselCard = styled.div`
  width: 380px; 
  aspect-ratio: 16 / 9;
  img { 
    width: 100%; 
    height: 100%; 
    object-fit: cover; 
    border-radius: 20px; 
  }
`;

const GridMain = styled.main`
  display: grid;
  grid-template-columns: repeat(3, 1fr); 
  width: 100%;
  gap: 30px;
  padding: 0 50px 100px;
  
  @media (max-width: 1024px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 600px) { grid-template-columns: 1fr; }
`;

const GridItem = styled.div`
  display: flex;
  flex-direction: column;
  
  .image-box {
    width: 100%;
    aspect-ratio: 16 / 10;
    overflow: hidden;
    position: relative;
    border-radius: 20px;
    background: #1a1a1a;
    
    img { 
      width: 100%; 
      height: 100%; 
      object-fit: cover; 
      transition: 0.5s ease;
    }
    &:hover img { transform: scale(1.05); }

    .card-info {
      position: absolute;
      top: 15px; left: 20px; right: 20px;
      display: flex; justify-content: space-between;
      font-size: 11px; font-weight: bold;
      text-shadow: 1px 1px 4px rgba(0,0,0,0.8);
      pointer-events: none;
    }
  }

  .title-label {
    padding: 15px 0;
    text-align: center;
    font-size: 18px; 
    font-weight: 700;
  }
`;