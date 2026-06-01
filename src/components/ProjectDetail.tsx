import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

interface Project {
  id: number;
  title: string;
  category: string;
  main_image: string;
  one_line_desc?: string;
  detail_desc?: string;
  run_link?: string;
  file_link?: string;
  store_link?: string;
  github_link?: string;
  tech_environment?: string;
  team_members?: string;
  dev_period?: string;
  nickname?: string;
  is_public: boolean;
}

interface ProjectDetailProps {
  project: Project;
  onBack: () => void;
}

const ProjectDetail: React.FC<ProjectDetailProps> = ({ project, onBack }) => {
  const [isLoading, setIsLoading] = useState(false);

  const getUrl = () => project.run_link || project.file_link || project.store_link || null;

  const handleRunService = () => {
    if (isLoading) return;
    const url = getUrl();
    if (!url) {
      alert('아직 서비스 URL이 등록되지 않은 프로젝트입니다.');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      const isDownload = url.includes('/releases/download/');
      if (isDownload) {
        const a = document.createElement('a');
        a.href = url;
        a.download = '';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        window.open(url, '_blank');
      }
      setIsLoading(false);
    }, 1500);
  };

  const url = getUrl();
  const imageUrl = project.main_image ? `http://localhost:4000${project.main_image}` : '/artifact-logo.png';

  return (
    <FullContainer>
      <Header>
        <LogoImg src="/artifact-logo.png" alt="Logo" />
        <BackButton onClick={onBack}>← 목록으로 돌아가기</BackButton>
      </Header>

      <MainContent>
        <InfoSide>
          <TitleBox>
            <MainTitle>{project.title}</MainTitle>
            <SubTitle>{project.category}</SubTitle>
            {project.one_line_desc && <OneLineDesc>{project.one_line_desc}</OneLineDesc>}
          </TitleBox>

          <RunButton onClick={handleRunService} disabled={isLoading} $loading={isLoading} $hasUrl={!!url}>
            <span className="btn-text">
              {isLoading ? '실행 중...' : url ? '실행' : '준비 중'}
            </span>
            {!isLoading && url && <span className="icon">▶</span>}
          </RunButton>

          <MetaInfo>
            {project.team_members && <MetaItem><MetaLabel>팀원</MetaLabel><MetaValue>{project.team_members}</MetaValue></MetaItem>}
            {project.dev_period && <MetaItem><MetaLabel>개발 기간</MetaLabel><MetaValue>{project.dev_period}</MetaValue></MetaItem>}
            {project.tech_environment && <MetaItem><MetaLabel>기술 스택</MetaLabel><MetaValue>{project.tech_environment}</MetaValue></MetaItem>}
            {project.github_link && <MetaItem><MetaLabel>GitHub</MetaLabel><MetaValue><a href={project.github_link} target="_blank" rel="noreferrer">{project.github_link}</a></MetaValue></MetaItem>}
            {project.nickname && <MetaItem><MetaLabel>등록자</MetaLabel><MetaValue>{project.nickname}</MetaValue></MetaItem>}
          </MetaInfo>
        </InfoSide>

        <ImageSide>
          <ProjectImage src={imageUrl} alt="Project Detail" />
        </ImageSide>
      </MainContent>

      <BottomSection>
        <ProjectInfoLabel>PROJECT INFO</ProjectInfoLabel>
        <DescriptionText>{project.detail_desc}</DescriptionText>
      </BottomSection>
    </FullContainer>
  );
};

export default ProjectDetail;

const FullContainer = styled.div`
  width: 100%;
  min-height: 100vh;
  padding: 40px 100px;
  display: flex;
  flex-direction: column;
  background: transparent;
  animation: ${fadeIn} 0.6s ease-out;
  box-sizing: border-box;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  width: 100%;
  margin-bottom: 20px;
`;

const LogoImg = styled.img`
  height: 80px;
  width: auto;
  object-fit: contain;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: rgba(255,255,255,0.4);
  font-size: 16px;
  cursor: pointer;
  padding-top: 15px;
  &:hover { color: white; }
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 60px;
`;

const InfoSide = styled.div`
  display: flex;
  flex-direction: column;
  gap: 30px;
  min-width: 350px;
  max-width: 400px;
`;

const TitleBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const MainTitle = styled.h1`
  font-size: 40px;
  font-weight: 800;
  margin: 0;
  color: white;
  letter-spacing: -1px;
`;

const SubTitle = styled.span`
  font-size: 16px;
  color: #ff85a1;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
`;

const OneLineDesc = styled.p`
  font-size: 16px;
  color: rgba(255,255,255,0.7);
  margin: 0;
  line-height: 1.5;
`;

const RunButton = styled.button<{ $loading: boolean; $hasUrl: boolean }>`
  width: 100%;
  height: 56px;
  border-radius: 50px;
  border: none;
  background: ${props =>
    !props.$hasUrl
      ? 'rgba(255,255,255,0.15)'
      : props.$loading
        ? 'rgba(255,255,255,0.2)'
        : 'linear-gradient(135deg, #7b2cbf 0%, #ff85a1 100%)'};
  color: white;
  font-size: 18px;
  font-weight: 800;
  cursor: ${props => (!props.$hasUrl || props.$loading) ? 'not-allowed' : 'pointer'};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  box-shadow: ${props => props.$hasUrl ? '0 8px 20px rgba(123,44,191,0.3)' : 'none'};
  transition: all 0.3s ease;
  &:hover { transform: ${props => (!props.$hasUrl || props.$loading) ? 'none' : 'scale(1.03)'}; }
  .btn-text { line-height: 1; }
  .icon { font-size: 13px; }
`;

const MetaInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px;
  padding: 20px;
`;

const MetaItem = styled.div` display: flex; flex-direction: column; gap: 4px; `;
const MetaLabel = styled.span` font-size: 11px; color: #ff85a1; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; `;
const MetaValue = styled.span`
  font-size: 14px; color: rgba(255,255,255,0.8);
  a { color: #7b2cbf; text-decoration: none; &:hover { text-decoration: underline; } }
`;

const ImageSide = styled.div`
  flex: 1;
  max-width: 750px;
  aspect-ratio: 16 / 10;
  background: rgba(255,255,255,0.05);
  border-radius: 30px;
  overflow: hidden;
`;

const ProjectImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const BottomSection = styled.div`
  margin-top: 40px;
  padding-bottom: 40px;
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
  font-size: 16px;
  color: rgba(255,255,255,0.8);
  line-height: 1.8;
  white-space: pre-line;
  margin: 0;
`;