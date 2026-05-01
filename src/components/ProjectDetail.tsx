import React from 'react';
import styled, { createGlobalStyle, keyframes } from 'styled-components';

// 1. 전역 스타일 (배경색 유지)
const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
    background: linear-gradient(180deg, #35328a 0%, #173db9 40%, #000000 100%) no-repeat fixed;
    color: white;
    font-family: 'Inter', sans-serif;
  }
`;

// 애니메이션
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const ProjectDetailPage = () => {
  // 예시 데이터 (나중에 Props로 받아서 쓸 수 있음)
  const projectData = {
    title: "task flow",
    subTitle: "(운세 iOS 앱)",
    logoImg: "/artifact-logo.png", // 로고 이미지 경로
    mainImg: "/KakaoTalk_20260502_011119529.jpg", // 메인 이미지 경로
    description: "사용자의 운세와 일정을 결합하여 최적의 태스크 흐름을 제안합니다. AI 알고리즘을 통해 매일 아침 개인화된 리포트를 제공하며, 직관적인 UI로 복잡한 일정을 한눈에 관리할 수 있게 설계되었습니다."
  };

  return (
    <>
      <GlobalStyle />
      <DetailContainer>
        {/* 상단 영역: 로고박스 + 프로젝트 제목 */}
        <HeaderSection>
          <LogoBox>
            <img src={projectData.logoImg} alt="logo" />
          </LogoBox>
          <TitleArea>
            <ProjectTitle>{projectData.title}</ProjectTitle>
            <ProjectSubTitle>{projectData.subTitle}</ProjectSubTitle>
          </TitleArea>
        </HeaderSection>

        {/* 중단 영역: 실행 버튼 + 메인 이미지 */}
        <MainSection>
          <SideArea>
            <RunButton onClick={() => alert('앱을 실행합니다!')}>
              실행 <PlayIcon>▶</PlayIcon>
            </RunButton>
          </SideArea>
          
          <ImageBox>
            <img src={projectData.mainImg} alt="main project" />
          </ImageBox>
        </MainSection>

        {/* 하단 영역: 상세 설명 */}
        <DescriptionSection>
          <DescLabel>PROJECT INFO</DescLabel>
          <DescText>{projectData.description}</DescText>
        </DescriptionSection>
      </DetailContainer>
    </>
  );
};

export default ProjectDetailPage;

// --- [Styled Components] ---

const DetailContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 60px 20px;
  animation: ${fadeIn} 0.6s ease-out;
`;

const HeaderSection = styled.div`
  display: flex;
  align-items: center;
  gap: 30px;
  margin-bottom: 40px;
`;

const LogoBox = styled.div`
  width: 100px;
  height: 100px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);

  img {
    width: 70%;
    height: auto;
    object-fit: contain;
  }
`;

const TitleArea = styled.div`
  display: flex;
  flex-direction: column;
`;

const ProjectTitle = styled.h1`
  font-size: 56px;
  margin: 0;
  font-weight: 800;
  letter-spacing: -1px;
`;

const ProjectSubTitle = styled.span`
  font-size: 24px;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 5px;
`;

const MainSection = styled.div`
  display: flex;
  gap: 40px;
  align-items: flex-start;
  margin-bottom: 50px;
`;

const SideArea = styled.div`
  width: 120px;
  flex-shrink: 0;
`;

const RunButton = styled.button`
  width: 100%;
  padding: 15px 0;
  border-radius: 50px; /* 알약 모양 */
  border: none;
  background: linear-gradient(135deg, #7b2cbf 0%, #ff85a1 100%);
  color: white;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: transform 0.3s ease;
  box-shadow: 0 10px 20px rgba(123, 44, 191, 0.4);

  &:hover {
    transform: translateY(-5px);
    filter: brightness(1.1);
  }
`;

const PlayIcon = styled.span`
  font-size: 14px;
`;

const ImageBox = styled.div`
  flex-grow: 1;
  aspect-ratio: 16 / 9;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 30px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const DescriptionSection = styled.div`
  padding-left: 160px; /* 사이드 버튼 너비 + 간격만큼 띄움 */
  max-width: 900px;

  @media (max-width: 768px) {
    padding-left: 0;
  }
`;

const DescLabel = styled.h3`
  font-size: 14px;
  color: #ff85a1;
  letter-spacing: 2px;
  margin-bottom: 15px;
`;

const DescText = styled.p`
  font-size: 20px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
`;