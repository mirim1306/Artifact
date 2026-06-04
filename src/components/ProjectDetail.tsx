import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

interface MediaFile {
  url: string;
  type: 'image' | 'video';
}

interface Project {
  id: number;
  title: string;
  category: string;
  main_image: string;
  media_files?: (string | MediaFile)[];
  service_intro?: string;
  main_features?: string;
  detail_desc?: string;
  run_link?: string;
  file_link?: string;
  store_link?: string;
  github_link?: string;
  tech_environment?: string;
  team_members?: string;
  dev_period?: string;
  design_tool?: string;
  nickname?: string;
  username?: string;
  email?: string;
  user_bio?: string;
}

interface ProjectDetailProps {
  project: Project;
  onBack: () => void;
}

// Cloudinary URL과 로컬 경로 모두 처리
const getMediaUrl = (url: string): string => {
  if (!url) return '/artifact-logo.png';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `http://localhost:4000${url.startsWith('/') ? '' : '/'}${url}`;
};

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
  const mainImageUrl = getMediaUrl(project.main_image);

  return (
    <FullContainer>
      <Header>
        <BackButton onClick={onBack}>← 목록으로 돌아가기</BackButton>
      </Header>

      <MainContent>
        {/* ── 좌측: 메타데이터 박스 ── */}
        <InfoSide>
          <TitleBox>
            <MainTitle>{project.title}</MainTitle>
            <SubTitle>{project.category}</SubTitle>
          </TitleBox>

          <RunButton onClick={handleRunService} disabled={isLoading} $loading={isLoading} $hasUrl={!!url}>
            <span className="btn-text">
              {isLoading ? '실행 중...' : url ? '실행' : '준비 중'}
            </span>
            {!isLoading && url && <span className="icon">▶</span>}
          </RunButton>

          <MetaInfo>
            {project.dev_period && <MetaItem><MetaLabel>개발 기간</MetaLabel><MetaValue>{project.dev_period}</MetaValue></MetaItem>}
            {project.team_members && <MetaItem><MetaLabel>팀원</MetaLabel><MetaValue>{project.team_members}</MetaValue></MetaItem>}
            {project.tech_environment && <MetaItem><MetaLabel>기술 스택 / 환경</MetaLabel><MetaValue>{project.tech_environment}</MetaValue></MetaItem>}
            {project.design_tool && <MetaItem><MetaLabel>사용 디자인 툴</MetaLabel><MetaValue>{project.design_tool}</MetaValue></MetaItem>}

            {/* 카테고리별 조건부 링크 */}
            {project.category === '웹' && project.run_link && <MetaItem><MetaLabel>웹 실행 URL</MetaLabel><MetaValue><a href={project.run_link} target="_blank" rel="noreferrer">{project.run_link}</a></MetaValue></MetaItem>}
            {project.category === '앱' && project.store_link && <MetaItem><MetaLabel>스토어 링크</MetaLabel><MetaValue><a href={project.store_link} target="_blank" rel="noreferrer">{project.store_link}</a></MetaValue></MetaItem>}
            {project.category === '게임' && (project.file_link || project.run_link) && (
              <>
                {project.file_link && <MetaItem><MetaLabel>실행 파일 다운로드</MetaLabel><MetaValue><a href={project.file_link}>{project.file_link}</a></MetaValue></MetaItem>}
                {project.run_link && <MetaItem><MetaLabel>웹 게임 링크</MetaLabel><MetaValue><a href={project.run_link} target="_blank" rel="noreferrer">{project.run_link}</a></MetaValue></MetaItem>}
              </>
            )}

            {project.github_link && <MetaItem><MetaLabel>GitHub</MetaLabel><MetaValue><a href={project.github_link} target="_blank" rel="noreferrer">{project.github_link}</a></MetaValue></MetaItem>}

            {project.main_features && (
              <MetaItem>
                <MetaLabel>주요 기능</MetaLabel>
                <MetaValueBox>{project.main_features}</MetaValueBox>
              </MetaItem>
            )}

            {project.detail_desc && (
              <MetaItem>
                <MetaLabel>상세 설명</MetaLabel>
                <MetaValueBox>{project.detail_desc}</MetaValueBox>
              </MetaItem>
            )}

            <UserDivider />
            <MetaItem><MetaLabel>등록자</MetaLabel><MetaValue>{project.nickname || '이름 없음'}</MetaValue></MetaItem>
            {project.username && <MetaItem><MetaLabel>사용자 ID</MetaLabel><MetaValue>@{project.username}</MetaValue></MetaItem>}
            {project.email && <MetaItem><MetaLabel>이메일</MetaLabel><MetaValue>{project.email}</MetaValue></MetaItem>}
          </MetaInfo>
        </InfoSide>

        {/* ── 우측: 메인 이미지 + 미디어 그리드 ── */}
        <ImageSide>
          <MainImageWrapper>
            <ProjectImage src={mainImageUrl} alt="Project Main" />
          </MainImageWrapper>

          {project.media_files && project.media_files.length > 0 && (
            <MediaGrid>
              {project.media_files.map((file, index) => {
                const isVideo = typeof file === 'string'
                  ? file.endsWith('.mp4') || file.endsWith('.webm')
                  : file.type === 'video';
                const fileUrl = typeof file === 'string'
                  ? getMediaUrl(file)
                  : getMediaUrl(file.url);

                return (
                  <MediaItemBox key={index}>
                    {isVideo ? (
                      <video src={fileUrl} controls muted playsInline />
                    ) : (
                      <img src={fileUrl} alt={`sub-media-${index}`} />
                    )}
                  </MediaItemBox>
                );
              })}
            </MediaGrid>
          )}
        </ImageSide>
      </MainContent>

      {/* ── 하단: 서비스 소개 & 크리에이터 소개 ── */}
      <BottomSection>
        {project.service_intro && (
          <ContentBlock>
            <SectionLabel>SERVICE INTRO</SectionLabel>
            <DescriptionText>{project.service_intro}</DescriptionText>
          </ContentBlock>
        )}

        {project.user_bio && (
          <ContentBlock className="creator-block">
            <SectionLabel>ABOUT THE CREATOR</SectionLabel>
            <DescriptionText>{project.user_bio}</DescriptionText>
          </ContentBlock>
        )}
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
  width: 100%;
  margin-bottom: 20px;
  display: flex;
  justify-content: flex-end;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: rgba(255,255,255,0.4);
  font-size: 16px;
  cursor: pointer;
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
  color: #7c6fcd;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
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
        : '#7c6fcd'};
  color: white;
  font-size: 18px;
  font-weight: 800;
  cursor: ${props => (!props.$hasUrl || props.$loading) ? 'not-allowed' : 'pointer'};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  box-shadow: ${props => props.$hasUrl ? '0 8px 20px rgba(124,111,205,0.3)' : 'none'};
  transition: all 0.3s ease;
  &:hover {
    transform: ${props => (!props.$hasUrl || props.$loading) ? 'none' : 'scale(1.03)'};
    background: ${props => props.$hasUrl && !props.$loading ? '#9187d8' : undefined};
  }
  .btn-text { line-height: 1; }
  .icon { font-size: 13px; }
`;

const MetaInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px;
  padding: 24px;
`;

const MetaItem = styled.div` display: flex; flex-direction: column; gap: 6px; `;
const MetaLabel = styled.span` font-size: 11px; color: #7c6fcd; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; `;
const MetaValue = styled.span`
  font-size: 14px; color: rgba(255,255,255,0.8);
  word-break: break-all;
  a { color: #a29bfe; text-decoration: none; &:hover { text-decoration: underline; } }
`;

const MetaValueBox = styled.span`
  font-size: 14px;
  color: rgba(255,255,255,0.85);
  line-height: 1.5;
  white-space: pre-line;
  word-break: break-all;
`;

const UserDivider = styled.div`
  margin: 8px 0;
  border-top: 1px dashed rgba(255, 255, 255, 0.15);
`;

const ImageSide = styled.div`
  flex: 1;
  max-width: 750px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const MainImageWrapper = styled.div`
  width: 100%;
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

const MediaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  width: 100%;
`;

const MediaItemBox = styled.div`
  aspect-ratio: 16 / 10;
  background: rgba(255,255,255,0.05);
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.1);

  img, video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const BottomSection = styled.div`
  margin-top: 50px;
  padding-bottom: 60px;
  display: flex;
  flex-direction: column;
  gap: 48px;
`;

const ContentBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;

  &.creator-block {
    border-top: 1px solid rgba(255,255,255,0.1);
    padding-top: 30px;
  }
`;

const SectionLabel = styled.h3`
  font-size: 14px;
  color: #7c6fcd;
  letter-spacing: 3px;
  margin: 0;
  font-weight: 900;
  text-transform: uppercase;
  text-align: center;
`;

const DescriptionText = styled.p`
  max-width: 850px;
  font-size: 16px;
  color: rgba(255,255,255,0.85);
  line-height: 1.8;
  white-space: pre-line;
  margin: 0;
  text-align: center;
`;
