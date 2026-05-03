import React, { useState } from 'react'; // useState 추가
import styled, { keyframes } from 'styled-components';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

interface Project {
  id: number;
  title: string;
  subTitle?: string;
  img: string;
  logo?: string;
  description?: string;
  url?: string; 
}

interface ProjectDetailProps {
  project: Project;
  onBack: () => void;
}

const ProjectDetail: React.FC<ProjectDetailProps> = ({ project, onBack }) => {
  const [isLoading, setIsLoading] = useState(false); // 실행 중 상태 관리

  const handleRunService = () => {
    if (isLoading) return; // 이미 실행 중이면 중복 클릭 방지

    setIsLoading(true); // "실행 중..." 상태로 변경

    // 약 1.5초 뒤에 확인창 띄우기
    setTimeout(() => {
      const targetUrl = project.url || "https://jgj1020.github.io/meal_app/";
      const isConfirm = window.confirm("급식 앱 서비스로 이동하시겠습니까?");
      
      if (isConfirm) {
        window.open(targetUrl, '_blank');
      }
      
      setIsLoading(false); // 이동 후(혹은 취소 후) 버튼 상태 복구
    }, 1500); 
  };

  return (
    <FullContainer>
      <Header>
        <LogoImg src={project.logo || "/artifact-logo.png"} alt="Logo" />
        <BackButton onClick={onBack}>← 목록으로 돌아가기</BackButton>
      </Header>

      <MainContent>
        <InfoSide>
          <TitleBox>
            <MainTitle>{project.title.split(' (')[0]}</MainTitle>
            <SubTitle>{project.subTitle || "(급식 iOS 앱)"}</SubTitle>
          </TitleBox>

          {/* isLoading 상태에 따라 버튼 텍스트와 스타일 변경 */}
          <RunButton onClick={handleRunService} disabled={isLoading} $loading={isLoading}>
            <span className="btn-text">
              {isLoading ? "실행 중..." : "실행"}
            </span>
            {!isLoading && <span className="icon">▶</span>}
          </RunButton>
        </InfoSide>

        <ImageSide>
          <ProjectImage src={project.img} alt="Project Detail" />
        </ImageSide>
      </MainContent>

      <BottomSection>
        <ProjectInfoLabel>PROJECT INFO</ProjectInfoLabel>
        <DescriptionText>
          {project.description || "전국 학교의 급식 정보를 한눈에 확인하고 영양 정보를 체크할 수 있습니다."}
        </DescriptionText>
      </BottomSection>
    </FullContainer>
  );
};

export default ProjectDetail;

// --- [Styled Components] ---

const FullContainer = styled.div`
  width: 100%;
  height: 100vh;
  padding: 60px 100px;
  display: flex;
  flex-direction: column;
  background: transparent; 
  animation: ${fadeIn} 0.6s ease-out;
  box-sizing: border-box;
  overflow: hidden; 
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  width: 100%;
`;

const LogoImg = styled.img`
  height: 120px; 
  width: auto;
  object-fit: contain;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.4);
  font-size: 16px;
  cursor: pointer;
  padding-top: 15px;
  &:hover { color: white; }
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 60px;
  margin-top: -20px; 
`;

const InfoSide = styled.div`
  display: flex;
  flex-direction: column;
  gap: 45px;
  min-width: 400px;
  align-items: center; 
  text-align: center;
`;

const TitleBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const MainTitle = styled.h1`
  font-size: 56px;
  font-weight: 800;
  margin: 0;
  color: white;
  letter-spacing: -1px;
`;

const SubTitle = styled.span`
  font-size: 24px;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 10px;
`;

const RunButton = styled.button<{ $loading: boolean }>`
  width: 240px; 
  height: 64px;
  border-radius: 50px;
  border: none;
  /* 로딩 중일 때는 회색빛으로 변경 */
  background: ${props => props.$loading 
    ? 'rgba(255, 255, 255, 0.2)' 
    : 'linear-gradient(135deg, #7b2cbf 0%, #ff85a1 100%)'};
  color: white;
  font-size: 20px;
  font-weight: 800;
  cursor: ${props => props.$loading ? 'not-allowed' : 'pointer'};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  box-shadow: 0 10px 25px rgba(123, 44, 191, 0.3);
  transition: all 0.3s ease;

  &:hover { 
    transform: ${props => props.$loading ? 'none' : 'scale(1.05)'}; 
  }
  
  .btn-text { line-height: 1; margin-top: -2px; }
  .icon { font-size: 14px; display: flex; align-items: center; }
`;

const ImageSide = styled.div`
  flex: 1;
  max-width: 850px;
  height: 500px; 
  background: rgba(255, 255, 255, 0.05);
  border-radius: 40px;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ProjectImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover; 
`;

const BottomSection = styled.div`
  margin-top: auto;
  padding-bottom: 30px;
  text-align: center;
`;

const ProjectInfoLabel = styled.h3`
  font-size: 13px;
  color: #ff85a1;
  letter-spacing: 4px;
  margin-bottom: 12px;
  font-weight: 900;
`;

const DescriptionText = styled.p`
  max-width: 800px;
  margin: 0 auto;
  font-size: 18px;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.5;
`;