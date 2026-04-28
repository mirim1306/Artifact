import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';

// 1. 타입 및 데이터 정의
type Category = '전체' | '웹사이트' | 'AI' | '포스터' | '디자인';

const DATA = Array.from({ length: 12 }).map((_, i) => ({
  id: i + 1,
  category: (['웹사이트', 'AI', '포스터', '디자인'][i % 4]) as Category,
  title: `PROJECT 0${i + 1}`,
  img: `https://picsum.photos/seed/${i + 100}/600/400`
}));

// 무한 회전 애니메이션 정의
const scroll = keyframes`
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
`;

const App: React.FC = () => {
  const [tab, setTab] = useState<Category>('전체');
  const filtered = tab === '전체' ? DATA : DATA.filter(d => d.category === tab);
  
  // 무한 캐러셀을 위한 트랙 ref
  const trackRef = useRef<HTMLDivElement>(null);

  // 무한 캐러셀 애니메이션 재설정 (데이터 변경 시 대응)
  useEffect(() => {
    if (trackRef.current) {
      const track = trackRef.current;
      track.style.animation = 'none';
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      trackRef.current.offsetHeight; // 트리거
      track.style.animation = `scroll 60s linear infinite`; // 속도 조절
    }
  }, [tab]); // 카테고리 탭 변경 시 애니메이션 재설정

  return (
    <Container>
      {/* 1. 상단 섹션 */}
      <HeaderSection>
        {/* [상단 1] 로고 - 이미지 중앙 배치 */}
        <Header>
          <LogoImage src="/artifact-logo.png" alt="ARTIFACT" />
        </Header>

        {/* [상단 2] 카테고리 버튼 - 중앙 배치 */}
        <Nav>
          {['전체', '웹사이트', 'AI', '포스터', '디자인'].map(c => (
            <TabButton 
              key={c}
              $active={tab === c}
              onClick={() => setTab(c as Category)}
            >
              {c}
            </TabButton>
          ))}
        </Nav>
      </HeaderSection>

      {/* 2. 중단 섹션: 무한 회전형(Infinite Carousel) */}
      <CarouselWrapper>
        <InfiniteTrack ref={trackRef}>
          {/* 무한 느낌을 위해 데이터를 두 번 반복 출력합니다 */}
          {[...DATA, ...DATA].map((item, index) => (
            <CarouselItem key={`${item.id}-${index}`}>
              <img src={item.img} alt={item.title} />
            </CarouselItem>
          ))}
        </InfiniteTrack>
      </CarouselWrapper>

      {/* 3. 하단 섹션: 3열 4행 그리드 */}
      <GridMain>
        {filtered.map(item => (
          <GridCard key={item.id}>
            <CardInfo>
              <span>{item.category}</span>
              <span>ID: 0{item.id}</span>
            </CardInfo>
            <ImageWrapper>
              <img src={item.img} alt={item.title} />
            </ImageWrapper>
            <CardTitle>{item.title}</CardTitle>
          </GridCard>
        ))}
      </GridMain>
    </Container>
  );
};

export default App;

// --- Styled Components ---

const Container = styled.div`
  min-height: 100vh;
  /* 이미지 배경색 반영: 어두운 보라색/남색 */
  background-color: #0d0f1a;
  color: white;
  width: 100%;
  margin: 0;
  padding: 0;
  font-family: 'Inter', sans-serif;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  align-items: center; /* 로고와 카테고리를 중앙으로 */
`;

const HeaderSection = styled.div`
  width: 100%;
  max-width: 1200px; /* 상단 섹션 너비 제한 */
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px; /* 상단 여백 추가 */
`;

const Header = styled.header`
  margin-bottom: 30px;
  display: flex;
  justify-content: center; /* 로고 중앙 정렬 */
  width: 100%;
`;

const LogoImage = styled.img`
  height: 50px; /* 로고 크기 적절히 조절 */
  width: auto;
  object-fit: contain;
`;

const Nav = styled.nav`
  display: flex;
  justify-content: center; /* 카테고리 중앙 정렬 */
  gap: 15px; /* 카테고리 버튼 간격 조절 */
  width: 100%;
`;

const TabButton = styled.button<{ $active: boolean }>`
  padding: 8px 20px;
  font-size: 13px;
  border-radius: 30px;
  border: 1px solid ${props => props.$active ? '#cc0000' : 'rgba(255,255,255,0.2)'};
  cursor: pointer;
  transition: 0.3s ease;
  background-color: ${props => props.$active ? '#cc0000' : 'transparent'};
  color: white;
  white-space: nowrap;

  &:hover {
    border-color: #cc0000;
  }
`;

const CarouselWrapper = styled.section`
  width: 100%;
  overflow: hidden;
  margin-bottom: 60px;
  position: relative;
  /* 캐러셀 양옆에 페이드 효과 추가 (선택 사항) */
  &::before, &::after {
    content: '';
    position: absolute;
    top: 0;
    width: 100px;
    height: 100%;
    z-index: 2;
  }
  &::before { left: 0; background: linear-gradient(to right, #0d0f1a, transparent); }
  &::after { right: 0; background: linear-gradient(to left, #0d0f1a, transparent); }
`;

const InfiniteTrack = styled.div`
  display: flex;
  width: max-content;
  gap: 20px; /* 캐러셀 아이템 간격 조절 */
  /* 애니메이션 설정 (useEffect에서 제어) */
  animation: none; 
  padding: 20px 0;

  &:hover {
    animation-play-state: paused; /* 마우스 올리면 멈춤 */
  }
`;

const CarouselItem = styled.div`
  width: 350px; /* 캐러셀 카드 크기 적절히 조절 */
  aspect-ratio: 16 / 9;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
  cursor: pointer;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: grayscale(80%);
    transition: 0.5s ease;
  }
  
  &:hover img {
    filter: grayscale(0%);
    transform: scale(1.03);
  }
`;

const GridMain = styled.main`
  display: grid;
  grid-template-columns: repeat(3, 1fr); /* 3열 배치 */
  gap: 40px 20px; /* 그리드 간격 조절 */
  width: 100%;
  max-width: 1200px; /* 그리드 섹션 너비 제한 (여백 생성) */
  padding: 0 20px 100px;
  margin: 0 auto; /* 중앙 정렬 */
`;

const GridCard = styled.div`
  display: flex;
  flex-direction: column;
  cursor: pointer;
`;

const CardInfo = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: #888;
  margin-bottom: 8px;
`;

const ImageWrapper = styled.div`
  width: 100%;
  aspect-ratio: 16 / 9;
  background-color: #111;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px; /* 이미지wrapper에도 둥근 모서리 적용 */
  overflow: hidden;
  transition: 0.3s ease;

  ${GridCard}:hover & {
    border-color: #cc0000;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: grayscale(50%);
    transition: 0.4s ease;
  }
`;

const CardTitle = styled.div`
  margin-top: 15px;
  text-align: center;
  font-size: 13px;
  font-weight: 500;
  color: #ccc;
  letter-spacing: 0.5px;
  text-transform: uppercase; /* 제목 대문자 변환 */
`;