import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';

// 1. 타입 및 데이터 (12개 프로젝트)
type Category = '전체' | '앱' | '웹' | '디자인' | '게임';

const DATA = Array.from({ length: 12 }).map((_, i) => ({
  id: i + 1,
  category: (['앱', '웹', '디자인', '게임'][i % 4]) as Category,
  title: `PROJECT ${i + 1}`,
  img: `https://picsum.photos/seed/${i + 70}/600/400`
}));

// 무한 회전 애니메이션
const scroll = keyframes`
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
`;

const App = () => {
  const [tab, setTab] = useState<Category>('전체');
  const filtered = tab === '전체' ? DATA : DATA.filter(d => d.category === tab);

  return (
    <Container>
      {/* [상단 1] 로고 - 왼쪽 상단 배치 및 크기 확대 */}
      <Header>
        <Logo src="/artifact-logo.png" alt="ARTIFACT" />
      </Header>

      {/* [상단 2] 카테고리 버튼 - 중앙 정렬 */}
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

      {/* [중단] 가로 무한 회전 배너 */}
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

      {/* [하단] 3열 4행 그리드 - 여백 없이 꽉 채움 */}
      <GridMain>
        {filtered.map(item => (
          <GridItem key={item.id}>
            <div className="image-box">
              <img src={item.img} alt={item.title} />
              <div className="card-info">
                <span>{item.category}</span>
                <span>ID: {String(item.id).padStart(2, '0')}</span>
              </div>
            </div>
            <div className="title-label">{item.title}</div>
          </GridItem>
        ))}
      </GridMain>
    </Container>
  );
};

export default App;

// --- Styled Components ---

const Container = styled.div`
  min-height: 100vh;
  /* 이미지의 배경색: 상단 남색 -> 하단 보라/검정 그라데이션 */
  background: linear-gradient(180deg, #243f91 0%, #591782 40%, #2c0f50 100%);
  color: white;
  width: 100%;
  margin: 0;
  padding: 0;
  font-family: 'Inter', sans-serif;
  overflow-x: hidden;
`;

const Header = styled.header`
  padding: 50px 40px 10px; /* 로고 왼쪽 위 여백 */
  display: flex;
  justify-content: flex-start; /* 왼쪽 정렬 */
`;

const Logo = styled.img`
  height: 80px; /* 로고 크기 대폭 확대 */
  width: auto;
  object-fit: contain;
`;

const Nav = styled.nav`
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-bottom: 40px;
  padding: 20px 0;
`;

const TabButton = styled.button<{ $active: boolean }>`
  padding: 6px 22px;
  border-radius: 20px;
  border: 1px solid ${props => props.$active ? '#ff4d4d' : 'rgba(255,255,255,0.2)'};
  background: ${props => props.$active ? '#ff4d4d' : 'transparent'};
  color: white;
  font-size: 13px;
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
  animation: ${scroll} 50s linear infinite;
`;

const CarouselCard = styled.div`
  width: 400px;
  aspect-ratio: 16 / 9;
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.1);
  img { width: 100%; height: 100%; object-fit: cover; filter: brightness(0.8); }
  .label {
    position: absolute; bottom: 12px; left: 12px;
    font-size: 11px; color: #ccc;
  }
`;

const GridMain = styled.main`
  display: grid;
  grid-template-columns: repeat(3, 1fr); /* 3열 */
  width: 100%;
  gap: 30px; 
  padding: 0 40px 100px; /* 양옆 여백 최소화 */
`;

const GridItem = styled.div`
  display: flex;
  flex-direction: column;
  
  .image-box {
    width: 100%;
    aspect-ratio: 4 / 3;
    background: rgba(255,255,255,0.05);
    border-radius: 12px;
    overflow: hidden;
    position: relative;
    border: 1px solid rgba(255,255,255,0.1);
    
    img { width: 100%; height: 100%; object-fit: cover; transition: 0.4s; }
    &:hover img { transform: scale(1.05); }

    .card-info {
      position: absolute;
      top: 12px; left: 12px; right: 12px;
      display: flex; justify-content: space-between;
      font-size: 10px; color: #aaa;
    }
  }

  .title-label {
    margin-top: 15px;
    text-align: center;
    font-size: 13px;
    color: #eee;
    letter-spacing: 1px;
  }
`;