import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes, createGlobalStyle, css } from 'styled-components';

// --- [전역 스타일 및 애니메이션] ---
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

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const scrollX = keyframes`
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
`;

// --- [데이터 타입 정의] ---
type Category = '전체' | '앱' | '웹' | '디자인' | '게임';

interface Project {
  id: number;
  category: Category[];
  title: string;
  subTitle?: string; // 상세 페이지용 소제목
  img: string;
  logo?: string;    // 상세 페이지용 로고
  description?: string; // 상세 페이지용 설명
}

const DATA: Project[] = [
  { 
    id: 1, 
    category: ['앱'], 
    title: 'task flow (운세 iOS 앱)', 
    subTitle: '(운세 iOS 앱)',
    img: '/task flow.png',
    logo: '/artifact-logo.png',
    description: '사용자의 운세와 일정을 결합하여 최적의 흐름을 제안하는 서비스입니다.'
  },
  { 
    id: 2, 
    category: ['앱'], 
    title: 'Meal_App (급식 iOS 앱)', 
    subTitle: '(급식 iOS 앱)',
    img: '/Meal_App.png',
    logo: '/artifact-logo.png',
    description: '전국 학교의 급식 정보를 한눈에 확인하고 영양 정보를 체크할 수 있습니다.'
  },
  { id: 3, category: ['앱', '게임'], title: '슈퍼 알까기', img: '/슈퍼_알까기-게임.png' },
  { id: 4, category: ['웹', '게임'], title: '호냥이 대전쟁', img: '/호냥이_대전쟁-웹.png' }, 
  { id: 5, category: ['게임'], title: '레인보우 홀덤', img: '/레인보우_홀덤-게임.png' },
  { id: 6, category: ['게임'], title: '체스 카드 배틀', img: '/체스카드-게임.png' },
  { id: 7, category: ['웹'], title: 'Match mood', img: '/Match_mood.png' },
  { id: 8, category: ['웹'], title: '자기소개 웹사이트', img: '/자기소개 웹사이트.png' },
];

const App = () => {
  const [tab, setTab] = useState<Category>('전체');
  // 1. 선택된 프로젝트 상태 추가
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const filtered = tab === '전체' ? DATA : DATA.filter(d => d.category.includes(tab));

  // --- [상세 페이지 화면] ---
  if (selectedProject) {
    return (
      <>
        <GlobalStyle />
        <DetailContainer>
          <BackButton onClick={() => setSelectedProject(null)}>← 목록으로 돌아가기</BackButton>
          
          <HeaderSection>
            <LogoBox>
              <img src={selectedProject.logo || "/artifact-logo.png"} alt="logo" />
            </LogoBox>
            <TitleArea>
              <ProjectTitle>{selectedProject.title.split(' (')[0]}</ProjectTitle>
              <ProjectSubTitle>{selectedProject.subTitle || "(Project)"}</ProjectSubTitle>
            </TitleArea>
          </HeaderSection>

          <MainSection>
            <SideArea>
              <RunButton onClick={() => alert('앱을 실행합니다!')}>
                실행 <span>▶</span>
              </RunButton>
            </SideArea>
            <ImageBox>
              <img src={selectedProject.img} alt="main" />
            </ImageBox>
          </MainSection>

          <DescriptionSection>
            <DescLabel>PROJECT INFO</DescLabel>
            <DescText>
              {selectedProject.description || "상세 설명이 준비 중인 프로젝트입니다."}
            </DescText>
          </DescriptionSection>
        </DetailContainer>
      </>
    );
  }

  // --- [메인 리스트 화면] ---
  return (
    <>
      <GlobalStyle />
      <Container>
        <LogoWrapper>
          <Logo src="/artifact-logo.png" alt="ARTIFACT" />
        </LogoWrapper>

        <Nav>
          {['전체', '앱', '웹', '디자인', '게임'].map(c => (
            <TabButton key={c} $active={tab === c} onClick={() => setTab(c as Category)}>
              {c}
            </TabButton>
          ))}
        </Nav>

        <CarouselSection>
          <InfiniteTrack>
            {[...DATA, ...DATA].map((item, i) => (
              <CarouselCard key={i}>
                <img src={item.img} alt="carousel" />
              </CarouselCard>
            ))}
          </InfiniteTrack>
        </CarouselSection>

        <GridMain>
          {filtered.map(item => (
            <GridItem 
              key={item.id} 
              // 2. 더블 클릭 시 상세 페이지로 이동하는 이벤트 추가
              onDoubleClick={() => setSelectedProject(item)}
            >
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
            <GithubLink href="https://github.com/artifact-team" target="_blank" rel="noreferrer">
              <svg height="24" viewBox="0 0 16 16" width="24" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path></svg>
              <span>Visit our Github</span>
            </GithubLink>
          </FooterContent>
        </Footer>
      </Container>
    </>
  );
};

export default App;

// --- [Styled Components - 리스트] ---

const Container = styled.div` width: 100%; padding-top: 180px; `;
const LogoWrapper = styled.div` position: absolute; top: 40px; left: 40px; z-index: 100; `;
const Logo = styled.img` height: 180px; width: auto; `;
const Nav = styled.nav` display: flex; justify-content: center; gap: 15px; margin-bottom: 70px; `;
const TabButton = styled.button<{ $active: boolean }>`
  padding: 12px 32px; border-radius: 50px; font-size: 15px; font-weight: 700; cursor: pointer; transition: all 0.4s; border: none;
  ${props => props.$active ? css` background: linear-gradient(135deg, #7b2cbf 0%, #ff85a1 100%); color: white; ` : css` background: rgba(255, 255, 255, 0.1); color: rgba(255, 255, 255, 0.6); `}
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
    .hover-tip { position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.6); padding: 5px 12px; border-radius: 20px; font-size: 10px; opacity: 0; transition: 0.3s; }
  }
  &:hover img { transform: scale(1.08); }
  &:hover .hover-tip { opacity: 1; }
  .title-label { padding: 15px 5px; text-align: center; font-size: 18px; font-weight: 700; }
`;

// --- [Styled Components - 상세 페이지 추가] ---

const DetailContainer = styled.div`
  max-width: 1200px; margin: 0 auto; padding: 100px 20px; animation: ${fadeIn} 0.5s ease-out;
`;

const BackButton = styled.button`
  background: none; border: none; color: rgba(255,255,255,0.5); cursor: pointer; margin-bottom: 30px; font-size: 16px;
  &:hover { color: white; }
`;

const HeaderSection = styled.div` display: flex; align-items: center; gap: 30px; margin-bottom: 40px; `;
const LogoBox = styled.div` 
  width: 100px; height: 100px; background: rgba(255,255,255,0.1); border-radius: 20px; display: flex; align-items: center; justify-content: center;
  img { width: 70%; }
`;
const TitleArea = styled.div` display: flex; flex-direction: column; `;
const ProjectTitle = styled.h1` font-size: 56px; margin: 0; font-weight: 800; `;
const ProjectSubTitle = styled.span` font-size: 24px; color: rgba(255,255,255,0.5); `;

const MainSection = styled.div` display: flex; gap: 40px; margin-bottom: 50px; `;
const SideArea = styled.div` width: 120px; flex-shrink: 0; `;
const RunButton = styled.button`
  width: 100%; padding: 15px; border-radius: 50px; border: none; background: linear-gradient(135deg, #7b2cbf 0%, #ff85a1 100%);
  color: white; font-weight: 700; cursor: pointer; transition: 0.3s;
  &:hover { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(123,44,191,0.4); }
`;
const ImageBox = styled.div` flex-grow: 1; aspect-ratio: 16 / 9; border-radius: 30px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); img { width: 100%; height: 100%; object-fit: cover; } `;

const DescriptionSection = styled.div` padding-left: 160px; `;
const DescLabel = styled.h3` font-size: 14px; color: #ff85a1; letter-spacing: 2px; margin-bottom: 15px; `;
const DescText = styled.p` font-size: 20px; line-height: 1.6; color: rgba(255,255,255,0.8); `;

const Footer = styled.footer` padding: 80px 60px; background: rgba(0, 0, 0, 0.3); border-top: 1px solid rgba(255, 255, 255, 0.05); `;
const FooterContent = styled.div` max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; `;
const GithubLink = styled.a` display: flex; align-items: center; gap: 12px; text-decoration: none; color: white; background: rgba(255, 255, 255, 0.1); padding: 12px 24px; border-radius: 12px; transition: 0.3s; font-weight: 600; &:hover { background: rgba(255, 255, 255, 0.2); transform: translateY(-3px); } `;