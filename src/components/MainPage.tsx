import React, { useState } from 'react';
import styled, { keyframes, createGlobalStyle } from 'styled-components';

// 1. 전역 스타일: body에 그라데이션을 직접 입혀서 양옆 '남색 기둥'을 없앰
const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
  }
  html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    min-height: 100vh;
    /* 화면 전체에 그라데이션을 깔아버려서 경계를 없앰 */
    background: linear-gradient(180deg, #243f91 0%, #591782 40%, #2c0f50 100%) fixed;
    color: white;
    font-family: 'Inter', sans-serif;
  }
`;

type Category = '전체' | '앱' | '웹' | '디자인' | '게임';

const DATA = Array.from({ length: 12 }).map((_, i) => ({
  id: i + 1,
  category: (['앱', '웹', '디자인', '게임'][i % 4]) as Category,
  title: `PROJECT ${i + 1}`,
  img: `https://picsum.photos/seed/${i + 125}/1200/800`
}));

const scroll = keyframes`
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
`;

const App = () => {
  const [tab, setTab] = useState<Category>('전체');
  const filtered = tab === '전체' ? DATA : DATA.filter(d => d.category === tab);

  return (
    <>
      <GlobalStyle />
      <Container>
        {/* [상단 1] 로고 - 노트북 화면 꽉 차게 더 크게 */}
        <Header>
          <Logo src="/artifact-logo.png" alt="ARTIFACT" />
        </Header>

        {/* [상단 2] 카테고리 탭 - 크기 확대 */}
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

        {/* [중단] 자동 회전 배너 - 여백 시원하게 조절 */}
        <CarouselSection>
          <InfiniteTrack>
            {[...DATA, ...DATA].map((item, i) => (
              <CarouselCard key={`${item.id}-${i}`}>
                <img src={item.img} alt="carousel" />
                <div className="label">Carousel {item.id}</div>
              </CarouselCard>
            ))}
          </InfiniteTrack>
        </CarouselSection>

        {/* [하단] 그리드 - 배경 투명화로 경계선 제거 */}
        <GridMain>
          {filtered.map(item => (
            <GridItem key={item.id}>
              <div className="image-box">
                <img src={item.img} alt={item.title} />
                <div className="card-info">
                  <span className="cat">{item.category}</span>
                  <span className="id">ID: {String(item.id).padStart(2, '0')}</span>
                </div>
              </div>
              <div className="title-label">{item.title}</div>
            </GridItem>
          ))}
        </GridMain>
      </Container>
    </>
  );
};

export default App;

// --- Styled Components ---

const Container = styled.div`
  width: 100%;
  /* Container 자체 배경을 없애서 body의 배경이 보이게 함 */
  background: transparent;
  display: flex;
  flex-direction: column;
`;

const Header = styled.header`
  padding: 100px 60px 40px; /* 로고 상단 여백 확대 */
  display: flex;
  justify-content: flex-start;
`;

const Logo = styled.img`
  height: 200px; /* 로고를 훨씬 더 크게 키움 */
  width: auto;
  object-fit: contain;
`;

const Nav = styled.nav`
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-bottom: 100px;
`;

const TabButton = styled.button<{ $active: boolean }>`
  padding: 18px 50px;
  border-radius: 60px;
  border: 2px solid ${props => props.$active ? '#ff4d4d' : 'rgba(255,255,255,0.3)'};
  background: ${props => props.$active ? '#ff4d4d' : 'transparent'};
  color: white;
  font-size: 24px; /* 버튼 글자 크기 대폭 확대 */
  font-weight: 700;
  cursor: pointer;
  transition: 0.3s;
`;

const CarouselSection = styled.section`
  width: 100%;
  overflow: hidden;
  margin-bottom: 80px;
`;

const InfiniteTrack = styled.div`
  display: flex;
  width: max-content;
  gap: 40px; /* 배너 사이 여백 시원하게 */
  animation: ${scroll} 60s linear infinite;
`;

const CarouselCard = styled.div`
  width: 600px;
  aspect-ratio: 16 / 9;
  position: relative;
  img { 
    width: 100%; 
    height: 100%; 
    object-fit: cover; 
    border-radius: 30px; /* 둥근 모서리 강조 */
  }
  .label { position: absolute; bottom: 25px; left: 30px; font-size: 16px; }
`;

const GridMain = styled.main`
  display: grid;
  grid-template-columns: repeat(3, 1fr); 
  width: 100%;
  gap: 60px; /* 프로젝트 칸 사이 여백 확대 */
  padding: 0 60px 150px;
`;

const GridItem = styled.div`
  display: flex;
  flex-direction: column;
  background: transparent; /* 배경을 투명하게 해서 경계 제거 */
  
  .image-box {
    width: 100%;
    aspect-ratio: 16 / 11;
    overflow: hidden;
    position: relative;
    
    img { 
      width: 100%; 
      height: 100%; 
      object-fit: cover; 
      border-radius: 30px; 
      transition: 0.5s;
    }
    &:hover img { transform: scale(1.04); }

    .card-info {
      position: absolute;
      top: 25px; left: 30px; right: 30px;
      display: flex; justify-content: space-between;
      font-size: 16px; font-weight: bold;
    }
  }

  .title-label {
    padding: 30px 0;
    text-align: center;
    font-size: 24px; /* 프로젝트 이름 시원하게 확대 */
    font-weight: 700;
    background: transparent; /* 글자 배경 검은 선 제거 */
  }
`;