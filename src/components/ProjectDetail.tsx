import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { likeAPI, commentAPI } from '../Api';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

interface MediaFile { url: string; type: 'image' | 'video'; }

interface Comment {
  id: number;
  user_id: number;
  content: string;
  nickname: string;
  username: string;
  created_at: string;
}

interface Project {
  id: number;
  title: string;
  category: string;
  main_image: string;
  media?: { media_url: string; media_type: string }[];
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
  comments?: Comment[];
  like_count?: number;
  view_count?: number;
}

interface ProjectDetailProps {
  project: Project;
  onBack: () => void;
}

const getMediaUrl = (url: string): string => {
  if (!url) return '/artifact-logo.png';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `http://localhost:4000${url.startsWith('/') ? '' : '/'}${url}`;
};

const getCurrentUserId = (): number | null => {
  const u = localStorage.getItem('user');
  return u ? JSON.parse(u).id : null;
};

const ProjectDetail: React.FC<ProjectDetailProps> = ({ project, onBack }) => {
  const [isRunLoading, setIsRunLoading] = useState(false);
  const [activeMedia, setActiveMedia] = useState<{ url: string; isVideo: boolean } | null>(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(project.like_count || 0);
  const [comments, setComments] = useState<Comment[]>(project.comments || []);
  const [commentInput, setCommentInput] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const currentUserId = getCurrentUserId();

  useEffect(() => {
    if (currentUserId) {
      likeAPI.getStatus(project.id).then(res => {
        if (res.success) { setLiked(res.liked); setLikeCount(res.count); }
      });
    }
  }, [project.id, currentUserId]);

  const handleLike = async () => {
    if (!currentUserId) return;
    const res = await likeAPI.toggle(project.id);
    if (res.success) { setLiked(res.liked); setLikeCount(res.count); }
  };

  const handleAddComment = async () => {
    if (!currentUserId) return;
    if (!commentInput.trim()) return;
    setCommentLoading(true);
    const res = await commentAPI.create(project.id, commentInput);
    if (res.success) {
      setComments([res.comment, ...comments]);
      setCommentInput('');
    }
    setCommentLoading(false);
  };

  const handleDeleteComment = async (id: number) => {
    const res = await commentAPI.delete(id);
    if (res.success) setComments(comments.filter(c => c.id !== id));
  };

  const getUrl = () => project.run_link || project.file_link || project.store_link || null;
  const handleRunService = () => {
    if (isRunLoading) return;
    const url = getUrl();
    if (!url) return;
    setIsRunLoading(true);
    setTimeout(() => {
      const isDownload = url.includes('/releases/download/');
      if (isDownload) {
        const a = document.createElement('a'); a.href = url; a.download = '';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
      } else { window.open(url, '_blank'); }
      setIsRunLoading(false);
    }, 1500);
  };

  // media 배열 정규화 (서버 응답 media[] 또는 레거시 media_files[] 모두 처리)
  const mediaList: { url: string; isVideo: boolean }[] = (() => {
    if (project.media && project.media.length > 0) {
      return project.media.map(m => ({ url: getMediaUrl(m.media_url), isVideo: m.media_type === 'video' }));
    }
    if (project.media_files && project.media_files.length > 0) {
      return project.media_files.map(f => {
        const url = typeof f === 'string' ? getMediaUrl(f) : getMediaUrl(f.url);
        const isVideo = typeof f === 'string' ? f.endsWith('.mp4') || f.endsWith('.webm') : f.type === 'video';
        return { url, isVideo };
      });
    }
    return [];
  })();

  const url = getUrl();
  const mainImageUrl = getMediaUrl(project.main_image);

  return (
    <FullContainer>
      <Header>
        <BackButton onClick={onBack}>← 목록으로 돌아가기</BackButton>
        <ViewCount>👁 {project.view_count || 0}</ViewCount>
      </Header>

      <MainContent>
        {/* ── 좌측 메타 ── */}
        <InfoSide>
          <TitleBox>
            <MainTitle>{project.title}</MainTitle>
            <SubTitle>{project.category}</SubTitle>
          </TitleBox>

          {/* 좋아요 버튼 */}
          <LikeButton $liked={liked} onClick={handleLike}>
            {liked ? '❤️' : '🤍'} {likeCount}
          </LikeButton>

          <RunButton onClick={handleRunService} disabled={isRunLoading} $loading={isRunLoading} $hasUrl={!!url}>
            <span className="btn-text">{isRunLoading ? '실행 중...' : url ? '실행' : '준비 중'}</span>
            {!isRunLoading && url && <span className="icon">▶</span>}
          </RunButton>


          <MetaInfo>
            {project.dev_period && <MetaItem><MetaLabel>개발 기간</MetaLabel><MetaValue>{project.dev_period}</MetaValue></MetaItem>}
            {project.team_members && <MetaItem><MetaLabel>팀원</MetaLabel><MetaValue>{project.team_members}</MetaValue></MetaItem>}
            {project.tech_environment && <MetaItem><MetaLabel>기술 스택 / 환경</MetaLabel><MetaValue>{project.tech_environment}</MetaValue></MetaItem>}
            {project.design_tool && <MetaItem><MetaLabel>사용 디자인 툴</MetaLabel><MetaValue>{project.design_tool}</MetaValue></MetaItem>}

            {project.category === '웹' && project.run_link && <MetaItem><MetaLabel>웹 실행 URL</MetaLabel><MetaValue><a href={project.run_link} target="_blank" rel="noreferrer">{project.run_link}</a></MetaValue></MetaItem>}
            {project.category === '앱' && project.store_link && <MetaItem><MetaLabel>스토어 링크</MetaLabel><MetaValue><a href={project.store_link} target="_blank" rel="noreferrer">{project.store_link}</a></MetaValue></MetaItem>}
            {project.category === '게임' && (
              <>
                {project.file_link && <MetaItem><MetaLabel>실행 파일 다운로드</MetaLabel><MetaValue><a href={project.file_link}>{project.file_link}</a></MetaValue></MetaItem>}
                {project.run_link && <MetaItem><MetaLabel>웹 게임 링크</MetaLabel><MetaValue><a href={project.run_link} target="_blank" rel="noreferrer">{project.run_link}</a></MetaValue></MetaItem>}
              </>
            )}
            {project.github_link && <MetaItem><MetaLabel>GitHub</MetaLabel><MetaValue><a href={project.github_link} target="_blank" rel="noreferrer">{project.github_link}</a></MetaValue></MetaItem>}

            {project.main_features && <MetaItem><MetaLabel>주요 기능</MetaLabel><MetaValueBox>{project.main_features}</MetaValueBox></MetaItem>}
            {project.detail_desc && <MetaItem><MetaLabel>상세 설명</MetaLabel><MetaValueBox>{project.detail_desc}</MetaValueBox></MetaItem>}

            <UserDivider />
            <MetaItem><MetaLabel>등록자</MetaLabel><MetaValue>{project.nickname || '이름 없음'}</MetaValue></MetaItem>
            {project.username && <MetaItem><MetaLabel>사용자 ID</MetaLabel><MetaValue>@{project.username}</MetaValue></MetaItem>}
            {project.email && <MetaItem><MetaLabel>이메일</MetaLabel><MetaValue>{project.email}</MetaValue></MetaItem>}
          </MetaInfo>
        </InfoSide>

        {/* ── 우측 이미지 ── */}
        <ImageSide>
          <MainImageWrapper>
            {activeMedia ? (
              activeMedia.isVideo
                ? <MainVideo src={activeMedia.url} controls autoPlay muted playsInline />
                : <ProjectImage src={activeMedia.url} alt="Active Media" />
            ) : (
              <ProjectImage src={mainImageUrl} alt="Project Main" />
            )}
          </MainImageWrapper>
          {mediaList.length > 0 && (
            <MediaGrid>
              {/* 메인 이미지도 썸네일로 */}
              <MediaItemBox
                $active={activeMedia === null}
                onClick={() => setActiveMedia(null)}
              >
                <img src={mainImageUrl} alt="main" />
              </MediaItemBox>
              {mediaList.map((m, i) => (
                <MediaItemBox
                  key={i}
                  $active={activeMedia?.url === m.url}
                  onClick={() => setActiveMedia(m)}
                >
                  {m.isVideo
                    ? <video src={m.url} muted playsInline />
                    : <img src={m.url} alt={`media-${i}`} />}
                </MediaItemBox>
              ))}
            </MediaGrid>
          )}
        </ImageSide>
      </MainContent>

      {/* ── 서비스 소개 ── */}
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

      {/* ── 댓글 ── */}
      <CommentSection>
        <SectionLabel>COMMENTS ({comments.length})</SectionLabel>

        <CommentInputRow>
          <CommentInput
            placeholder={currentUserId ? '댓글을 입력하세요...' : '로그인 후 댓글을 남길 수 있습니다.'}
            value={commentInput}
            onChange={e => setCommentInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }}
            disabled={!currentUserId}
          />
          <CommentSubmitBtn onClick={handleAddComment} disabled={commentLoading || !currentUserId}>
            {commentLoading ? '...' : '등록'}
          </CommentSubmitBtn>
        </CommentInputRow>

        {comments.length === 0 ? (
          <NoComment>아직 댓글이 없어요. 첫 댓글을 남겨보세요!</NoComment>
        ) : (
          <CommentList>
            {comments.map(c => (
              <CommentItem key={c.id}>
                <CommentMeta>
                  <span className="nick">{c.nickname}</span>
                  <span className="date">{new Date(c.created_at).toLocaleDateString('ko-KR')}</span>
                  {currentUserId === c.user_id && (
                    <DeleteCommentBtn onClick={() => handleDeleteComment(c.id)}>삭제</DeleteCommentBtn>
                  )}
                </CommentMeta>
                <CommentContent>{c.content}</CommentContent>
              </CommentItem>
            ))}
          </CommentList>
        )}
      </CommentSection>
    </FullContainer>
  );
};

export default ProjectDetail;

// ── 스타일 ──
const FullContainer = styled.div`
  width: 100%; min-height: 100vh; padding: 40px 100px;
  display: flex; flex-direction: column; background: transparent;
  animation: ${fadeIn} 0.6s ease-out; box-sizing: border-box;
`;
const Header = styled.header`
  width: 100%; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;
`;
const BackButton = styled.button`
  background: none; border: none; color: rgba(255,255,255,0.4); font-size: 16px; cursor: pointer;
  &:hover { color: white; }
`;
const ViewCount = styled.span` font-size: 14px; color: rgba(255,255,255,0.35); `;
const MainContent = styled.div`
  flex: 1; display: flex; align-items: flex-start; justify-content: space-between; gap: 60px;
`;
const InfoSide = styled.div`
  display: flex; flex-direction: column; gap: 20px; min-width: 350px; max-width: 400px;
`;
const TitleBox = styled.div` display: flex; flex-direction: column; gap: 8px; `;
const MainTitle = styled.h1`
  font-size: 40px; font-weight: 800; margin: 0; color: white; letter-spacing: -1px;
`;
const SubTitle = styled.span`
  font-size: 16px; color: #7c6fcd; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;
`;
const LikeButton = styled.button<{ $liked: boolean }>`
  width: 100%; height: 48px; border-radius: 50px; border: 2px solid ${p => p.$liked ? '#ff6b9d' : 'rgba(255,255,255,0.15)'};
  background: ${p => p.$liked ? 'rgba(255,107,157,0.15)' : 'transparent'};
  color: ${p => p.$liked ? '#ff6b9d' : 'rgba(255,255,255,0.6)'};
  font-size: 16px; font-weight: 700; cursor: pointer; transition: all 0.2s;
  &:hover { border-color: #ff6b9d; color: #ff6b9d; background: rgba(255,107,157,0.1); }
`;
const RunButton = styled.button<{ $loading: boolean; $hasUrl: boolean }>`
  width: 100%; height: 56px; border-radius: 50px; border: none;
  background: ${p => !p.$hasUrl ? 'rgba(255,255,255,0.15)' : p.$loading ? 'rgba(255,255,255,0.2)' : '#7c6fcd'};
  color: white; font-size: 18px; font-weight: 800;
  cursor: ${p => (!p.$hasUrl || p.$loading) ? 'not-allowed' : 'pointer'};
  display: flex; align-items: center; justify-content: center; gap: 12px;
  box-shadow: ${p => p.$hasUrl ? '0 8px 20px rgba(124,111,205,0.3)' : 'none'};
  transition: all 0.3s ease;
  &:hover { transform: ${p => (!p.$hasUrl || p.$loading) ? 'none' : 'scale(1.03)'}; }
  .btn-text { line-height: 1; } .icon { font-size: 13px; }
`;
const MetaInfo = styled.div`
  display: flex; flex-direction: column; gap: 16px;
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px; padding: 24px;
`;
const MetaItem = styled.div` display: flex; flex-direction: column; gap: 6px; `;
const MetaLabel = styled.span`
  font-size: 11px; color: #7c6fcd; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;
`;
const MetaValue = styled.span`
  font-size: 14px; color: rgba(255,255,255,0.8); word-break: break-all;
  a { color: #a29bfe; text-decoration: none; &:hover { text-decoration: underline; } }
`;
const MetaValueBox = styled.span`
  font-size: 14px; color: rgba(255,255,255,0.85); line-height: 1.5; white-space: pre-line; word-break: break-all;
`;
const UserDivider = styled.div` margin: 8px 0; border-top: 1px dashed rgba(255,255,255,0.15); `;
const ImageSide = styled.div` flex: 1; max-width: 750px; display: flex; flex-direction: column; gap: 16px; `;
const MainImageWrapper = styled.div`
  width: 100%; aspect-ratio: 16/10; background: rgba(255,255,255,0.05); border-radius: 30px; overflow: hidden;
`;
const ProjectImage = styled.img` width: 100%; height: 100%; object-fit: cover; `;
const MainVideo = styled.video` width: 100%; height: 100%; object-fit: cover; `;
const MediaGrid = styled.div` display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; width: 100%; `;
const MediaItemBox = styled.div<{ $active?: boolean }>`
  aspect-ratio: 16/10; background: rgba(255,255,255,0.05); border-radius: 14px; overflow: hidden;
  border: 2px solid ${p => p.$active ? '#7c6fcd' : 'rgba(255,255,255,0.1)'};
  cursor: pointer; transition: border-color 0.2s, transform 0.2s;
  img, video { width: 100%; height: 100%; object-fit: cover; }
  &:hover { border-color: #9187d8; transform: scale(1.03); }
`;
const BottomSection = styled.div`
  margin-top: 50px; padding-bottom: 40px; display: flex; flex-direction: column; gap: 48px;
`;
const ContentBlock = styled.div`
  display: flex; flex-direction: column; gap: 16px; align-items: center;
  &.creator-block { border-top: 1px solid rgba(255,255,255,0.1); padding-top: 30px; }
`;
const SectionLabel = styled.h3`
  font-size: 14px; color: #7c6fcd; letter-spacing: 3px; margin: 0;
  font-weight: 900; text-transform: uppercase; text-align: center;
`;
const DescriptionText = styled.p`
  max-width: 850px; font-size: 16px; color: rgba(255,255,255,0.85);
  line-height: 1.8; white-space: pre-line; margin: 0; text-align: center;
`;

// ── 댓글 스타일 ──
const CommentSection = styled.div`
  border-top: 1px solid rgba(255,255,255,0.08); padding-top: 40px; padding-bottom: 80px;
  display: flex; flex-direction: column; gap: 24px;
`;
const CommentInputRow = styled.div` display: flex; gap: 12px; `;
const CommentInput = styled.textarea`
  flex: 1; padding: 14px 18px; border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.06);
  color: white; font-size: 14px; resize: none; height: 52px; outline: none; font-family: inherit;
  &::placeholder { color: rgba(255,255,255,0.3); }
  &:focus { border-color: #7c6fcd; }
  &:disabled { opacity: 0.4; }
`;
const CommentSubmitBtn = styled.button`
  padding: 0 28px; border-radius: 14px; border: none;
  background: #7c6fcd; color: white; font-size: 14px; font-weight: 700; cursor: pointer;
  &:hover:not(:disabled) { background: #9187d8; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`;
const NoComment = styled.p` text-align: center; color: rgba(255,255,255,0.3); padding: 30px 0; font-size: 14px; `;
const CommentList = styled.div` display: flex; flex-direction: column; gap: 16px; `;
const CommentItem = styled.div`
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 14px; padding: 16px 20px;
`;
const CommentMeta = styled.div`
  display: flex; align-items: center; gap: 10px; margin-bottom: 8px;
  .nick { font-size: 14px; font-weight: 700; color: #bfbaf2; }
  .date { font-size: 12px; color: rgba(255,255,255,0.3); }
`;
const DeleteCommentBtn = styled.button`
  margin-left: auto; background: none; border: none; color: rgba(255,100,100,0.5);
  font-size: 12px; cursor: pointer; &:hover { color: #ff6b6b; }
`;
const CommentContent = styled.p`
  font-size: 14px; color: rgba(255,255,255,0.75); line-height: 1.6; margin: 0; white-space: pre-line;
`;