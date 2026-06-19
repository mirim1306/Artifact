import React, { useState, useEffect, useCallback } from 'react';
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
  parent_id?: number | null;
  like_count?: number;
  dislike_count?: number;
  user_liked?: boolean;
  user_disliked?: boolean;
  replies?: Comment[];
}

interface Project {
  id: number; title: string; category: string; main_image: string;
  media?: { media_url: string; media_type: string }[];
  media_files?: (string | MediaFile)[];
  service_intro?: string; main_features?: string; detail_desc?: string;
  run_link?: string; file_link?: string; store_link?: string; github_link?: string;
  tech_environment?: string; team_members?: string; dev_period?: string; design_tool?: string;
  design_link?: string; sub_categories?: string;
  nickname?: string; username?: string; email?: string; user_bio?: string;
  comments?: Comment[]; like_count?: number; view_count?: number; comments_enabled?: boolean;
}

interface ProjectDetailProps { project: Project; onBack: () => void; onViewUser?: (username: string) => void; }

function buildCommentTree(flat: Comment[]): Comment[] {
  const map: Record<number, Comment> = {};
  const roots: Comment[] = [];
  for (const c of flat) map[c.id] = { ...c, replies: [] };
  for (const c of flat) {
    if (c.parent_id && map[c.parent_id]) {
      map[c.parent_id].replies!.push(map[c.id]);
    } else if (!c.parent_id) {
      roots.push(map[c.id]);
    }
  }
  return roots;
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

const ProjectDetail: React.FC<ProjectDetailProps> = ({ project, onBack, onViewUser }) => {
  const [isRunLoading, setIsRunLoading] = useState(false);
  const [activeMedia, setActiveMedia] = useState<{ url: string; isVideo: boolean } | null>(null);

  // 포트폴리오 좋아요/싫어요
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [likeCount, setLikeCount] = useState(project.like_count || 0);
  const [dislikeCount, setDislikeCount] = useState(0);

  // 댓글
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  // 댓글 수정
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyInput, setReplyInput] = useState('');
  const [replyTargetNick, setReplyTargetNick] = useState<string | null>(null);

  const currentUserId = getCurrentUserId();

  const fetchComments = useCallback(() => {
    commentAPI.getAll(project.id).then(res => {
      if (res.success) setComments(buildCommentTree(res.comments));
    });
  }, [project.id]);

  const fetchLikes = useCallback(() => {
    likeAPI.getStatus(project.id).then(res => {
      if (res.success) { setLiked(res.liked); setLikeCount(res.count); }
    });
    likeAPI.getDislikeStatus(project.id).then(res => {
      if (res.success) { setDisliked(res.disliked); setDislikeCount(res.count); }
    });
  }, [project.id]);

  useEffect(() => {
    fetchLikes();
    fetchComments();

    let es: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let reconnectDelay = 1000;
    let commentDebounce: ReturnType<typeof setTimeout> | null = null;
    let likesDebounce: ReturnType<typeof setTimeout> | null = null;

    const debouncedFetchComments = () => {
      if (commentDebounce) clearTimeout(commentDebounce);
      commentDebounce = setTimeout(fetchComments, 300);
    };
    const debouncedFetchLikes = () => {
      if (likesDebounce) clearTimeout(likesDebounce);
      likesDebounce = setTimeout(fetchLikes, 300);
    };

    const connect = () => {
      es = new EventSource(`/api/sse/portfolio-${project.id}`);
      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'comments') debouncedFetchComments();
          else if (data.type === 'likes') debouncedFetchLikes();
        } catch {}
        reconnectDelay = 1000;
      };
      es.onerror = () => {
        es?.close();
        reconnectTimer = setTimeout(connect, reconnectDelay);
        reconnectDelay = Math.min(reconnectDelay * 2, 30000);
      };
    };

    connect();

    // 탭 복귀 시 즉시 갱신
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchComments();
        fetchLikes();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // SSE 장애 시 폴백 폴링 (60초)
    const fallback = setInterval(() => { fetchComments(); fetchLikes(); }, 60000);

    return () => {
      es?.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (commentDebounce) clearTimeout(commentDebounce);
      if (likesDebounce) clearTimeout(likesDebounce);
      clearInterval(fallback);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [project.id, fetchComments, fetchLikes]);

  const handleLike = async () => {
    if (!currentUserId) return;
    const res = await likeAPI.toggle(project.id);
    if (res.success) { setLiked(res.liked); setDisliked(false); setLikeCount(res.count); setDislikeCount(res.dislikeCount ?? dislikeCount); }
  };

  const handleDislike = async () => {
    if (!currentUserId) return;
    const res = await likeAPI.toggleDislike(project.id);
    if (res.success) { setDisliked(res.disliked); setLiked(false); setDislikeCount(res.dislikeCount); setLikeCount(res.likeCount); }
  };

  const handleAddComment = async () => {
    if (!currentUserId || !commentInput.trim()) return;
    setCommentLoading(true);
    const res = await commentAPI.create(project.id, commentInput);
    if (res.success) { fetchComments(); setCommentInput(''); }
    setCommentLoading(false);
  };

  const handleAddReply = async (parentId: number) => {
    if (!currentUserId || !replyInput.trim()) return;
    const res = await commentAPI.create(project.id, replyInput, parentId);
    if (res.success) {
      fetchComments();
      setReplyInput('');
      setReplyingTo(null);
      setReplyTargetNick(null);
    }
  };

  const handleDeleteComment = async (id: number, parentId?: number) => {
    const res = await commentAPI.delete(id);
    if (res.success) {
      if (parentId) {
        // 대댓글 삭제
        setComments(prev => prev.map(c =>
          c.id === parentId ? { ...c, replies: (c.replies || []).filter(r => r.id !== id) } : c
        ));
      } else {
        // 댓글 삭제
        setComments(prev => prev.filter(c => c.id !== id));
      }
    }
  };

  const handleEditStart = (c: Comment) => {
    setEditingCommentId(c.id);
    setEditingContent(c.content);
  };

  const handleEditSave = async (id: number, parentId?: number) => {
    if (!editingContent.trim()) return;
    const res = await commentAPI.update(id, editingContent);
    if (res.success) {
      if (parentId) {
        setComments(prev => prev.map(c =>
          c.id === parentId
            ? { ...c, replies: (c.replies || []).map(r => r.id === id ? { ...r, content: editingContent } : r) }
            : c
        ));
      } else {
        setComments(prev => prev.map(c => c.id === id ? { ...c, content: editingContent } : c));
      }
      setEditingCommentId(null);
    }
  };

  const handleCommentLike = async (id: number, parentId?: number) => {
    if (!currentUserId) return;
    const res = await commentAPI.like(id);
    if (res.success) {
      const updateComment = (c: Comment): Comment => {
        if (c.id === id) return { ...c, user_liked: res.liked, user_disliked: false, like_count: res.likeCount, dislike_count: res.dislikeCount };
        if (parentId && c.id === parentId) return { ...c, replies: (c.replies || []).map(r => r.id === id ? { ...r, user_liked: res.liked, user_disliked: false, like_count: res.likeCount, dislike_count: res.dislikeCount } : r) };
        return c;
      };
      setComments(prev => prev.map(updateComment));
    }
  };

  const handleCommentDislike = async (id: number, parentId?: number) => {
    if (!currentUserId) return;
    const res = await commentAPI.dislike(id);
    if (res.success) {
      const updateComment = (c: Comment): Comment => {
        if (c.id === id) return { ...c, user_liked: false, user_disliked: res.disliked, like_count: res.likeCount, dislike_count: res.dislikeCount };
        if (parentId && c.id === parentId) return { ...c, replies: (c.replies || []).map(r => r.id === id ? { ...r, user_liked: false, user_disliked: res.disliked, like_count: res.likeCount, dislike_count: res.dislikeCount } : r) };
        return c;
      };
      setComments(prev => prev.map(updateComment));
    }
  };

  const getUrl = () => project.run_link || project.file_link || project.store_link || project.design_link || null;
  const handleRunService = async () => {
    if (isRunLoading) return;
    const url = getUrl();
    if (!url) return;
    setIsRunLoading(true);

    // 커스텀 URL 스킴 (algaki://, chesscardgame://, rainbowholdem://)
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      const a = document.createElement('a');
      a.href = url;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => setIsRunLoading(false), 1500);
      return;
    }

    // localhost 런처 서버 감지: http://localhost:7777/launch?game=xxx
    if (url.startsWith('http://localhost:17777/')) {
      const img = new Image();
      img.src = url;
      setTimeout(() => setIsRunLoading(false), 1500);
      return;
    }

    setTimeout(() => {
      const isDownload = url.includes('/releases/download/') || /\.(exe|zip|msi|dmg|pkg|apk)$/i.test(url);
      if (isDownload) {
        const a = document.createElement('a'); a.href = url; a.download = '';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
      } else { window.open(url, '_blank'); }
      setIsRunLoading(false);
    }, 1500);
  };

  const mediaList: { url: string; isVideo: boolean }[] = (() => {
    if (project.media && project.media.length > 0)
      return project.media.map(m => ({ url: getMediaUrl(m.media_url), isVideo: m.media_type === 'video' }));
    if (project.media_files && project.media_files.length > 0)
      return project.media_files.map(f => {
        const url = typeof f === 'string' ? getMediaUrl(f) : getMediaUrl(f.url);
        const isVideo = typeof f === 'string' ? f.endsWith('.mp4') || f.endsWith('.webm') : f.type === 'video';
        return { url, isVideo };
      });
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
        <InfoSide>
          <TitleBox>
            <MainTitle>{project.title}</MainTitle>
            <SubTitle>{project.category}</SubTitle>
          </TitleBox>

          {/* 좋아요/싫어요 버튼 */}
          <ReactionRow>
            <ReactionBtn $active={liked} $color="#ff2d55" onClick={handleLike}>
              {liked ? '❤️' : '🤍'} {likeCount}
            </ReactionBtn>
            <ReactionBtn $active={disliked} $color="#6c757d" onClick={handleDislike}>
              {disliked ? '👎' : '👎🏻'} {dislikeCount}
            </ReactionBtn>
          </ReactionRow>

          <RunButton onClick={handleRunService} disabled={isRunLoading} $loading={isRunLoading} $hasUrl={!!url}>
            <span className="btn-text">{isRunLoading ? '실행 중...' : url ? '실행' : '준비 중'}</span>
            {!isRunLoading && url && <span className="icon">▶</span>}
          </RunButton>

          <MetaInfo>
            {project.sub_categories && <MetaItem><MetaLabel>추가 카테고리</MetaLabel><MetaValue>{project.sub_categories.split(',').filter(Boolean).join(' · ')}</MetaValue></MetaItem>}
            {project.dev_period && <MetaItem><MetaLabel>개발 기간</MetaLabel><MetaValue>{project.dev_period}</MetaValue></MetaItem>}
            {project.team_members && <MetaItem><MetaLabel>팀원</MetaLabel><MetaValue>{project.team_members}</MetaValue></MetaItem>}
            {project.tech_environment && <MetaItem><MetaLabel>기술 스택 / 환경</MetaLabel><MetaValue>{project.tech_environment}</MetaValue></MetaItem>}
            {project.design_tool && <MetaItem><MetaLabel>사용 디자인 툴</MetaLabel><MetaValue>{project.design_tool}</MetaValue></MetaItem>}
            {project.github_link && <MetaItem><MetaLabel>GitHub</MetaLabel><MetaValue><a href={project.github_link} target="_blank" rel="noreferrer">{project.github_link}</a></MetaValue></MetaItem>}
            {project.main_features && <MetaItem><MetaLabel>주요 기능</MetaLabel><MetaValueBox>{project.main_features}</MetaValueBox></MetaItem>}
            {project.detail_desc && <MetaItem><MetaLabel>상세 설명</MetaLabel><MetaValueBox>{project.detail_desc}</MetaValueBox></MetaItem>}
            <UserDivider />
            <MetaItem>
              <MetaLabel>등록자</MetaLabel>
              <MetaValue>
                {project.username && onViewUser
                  ? <AuthorLink onClick={() => onViewUser(project.username!)}>{project.nickname || '이름 없음'}</AuthorLink>
                  : (project.nickname || '이름 없음')}
              </MetaValue>
            </MetaItem>
            {project.email && <MetaItem><MetaLabel>이메일</MetaLabel><MetaValue>{project.email}</MetaValue></MetaItem>}
          </MetaInfo>
        </InfoSide>

        <ImageSide>
          <MainImageWrapper>
            {activeMedia
              ? activeMedia.isVideo
                ? <MainVideo src={activeMedia.url} controls autoPlay muted playsInline />
                : <ProjectImage src={activeMedia.url} alt="Active Media" />
              : <ProjectImage src={mainImageUrl} alt="Project Main" />
            }
          </MainImageWrapper>
          {mediaList.length > 0 && (
            <MediaGrid>
              <MediaItemBox $active={activeMedia === null} onClick={() => setActiveMedia(null)}>
                <img src={mainImageUrl} alt="main" />
              </MediaItemBox>
              {mediaList.map((m, i) => (
                <MediaItemBox key={i} $active={activeMedia?.url === m.url} onClick={() => setActiveMedia(m)}>
                  {m.isVideo ? <video src={m.url} muted playsInline /> : <img src={m.url} alt={`media-${i}`} />}
                </MediaItemBox>
              ))}
            </MediaGrid>
          )}
        </ImageSide>
      </MainContent>

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

        {project.comments_enabled === false ? (
          <DisabledComment>댓글이 비활성화된 포트폴리오입니다.</DisabledComment>
        ) : (
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
        )}
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
                    <CommentBtns>
                      {editingCommentId === c.id ? (
                        <>
                          <CommentActionBtn onClick={() => handleEditSave(c.id)}>저장</CommentActionBtn>
                          <CommentActionBtn onClick={() => setEditingCommentId(null)}>취소</CommentActionBtn>
                        </>
                      ) : (
                        <>
                          <CommentActionBtn onClick={() => handleEditStart(c)}>수정</CommentActionBtn>
                          <DeleteCommentBtn onClick={() => handleDeleteComment(c.id)}>삭제</DeleteCommentBtn>
                        </>
                      )}
                    </CommentBtns>
                  )}
                </CommentMeta>

                {editingCommentId === c.id ? (
                  <CommentEditInput
                    value={editingContent}
                    onChange={e => setEditingContent(e.target.value)}
                    autoFocus
                  />
                ) : (
                  <CommentContent>{c.content}</CommentContent>
                )}

                {/* 댓글 좋아요/싫어요 */}
                <CommentReactionRow>
                  <CommentReactionBtn $active={!!c.user_liked} $color="#ff2d55" onClick={() => handleCommentLike(c.id)} disabled={!currentUserId}>
                    {c.user_liked ? '❤️' : '🤍'} {c.like_count || 0}
                  </CommentReactionBtn>
                  <CommentReactionBtn $active={!!c.user_disliked} $color="#6c757d" onClick={() => handleCommentDislike(c.id)} disabled={!currentUserId}>
                    👎 {c.dislike_count || 0}
                  </CommentReactionBtn>
                  {currentUserId && (
                    <ReplyBtn onClick={() => {
                      setReplyingTo(replyingTo === c.id ? null : c.id);
                      setReplyTargetNick(null);
                      setReplyInput('');
                    }}>
                      💬 답글
                    </ReplyBtn>
                  )}
                </CommentReactionRow>

                {/* 답글 입력 */}
                {replyingTo === c.id && (
                  <ReplyInputRow>
                    <CommentInput
                      placeholder={replyTargetNick ? `@${replyTargetNick}에게 답글...` : '답글을 입력하세요...'}
                      value={replyInput}
                      onChange={e => setReplyInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddReply(c.id); } }}
                    />
                    <CommentSubmitBtn onClick={() => handleAddReply(c.id)}>등록</CommentSubmitBtn>
                  </ReplyInputRow>
                )}

                {/* 대댓글 목록 */}
                {c.replies && c.replies.length > 0 && (
                  <ReplyList>
                    {c.replies.map(r => (
                      <ReplyItem key={r.id}>
                        <CommentMeta>
                          <span className="nick">↳ {r.nickname}</span>
                          <span className="date">{new Date(r.created_at).toLocaleDateString('ko-KR')}</span>
                          {currentUserId === r.user_id && (
                            <CommentBtns>
                              {editingCommentId === r.id ? (
                                <>
                                  <CommentActionBtn onClick={() => handleEditSave(r.id, c.id)}>저장</CommentActionBtn>
                                  <CommentActionBtn onClick={() => setEditingCommentId(null)}>취소</CommentActionBtn>
                                </>
                              ) : (
                                <>
                                  <CommentActionBtn onClick={() => { setEditingCommentId(r.id); setEditingContent(r.content); }}>수정</CommentActionBtn>
                                  <DeleteCommentBtn onClick={() => handleDeleteComment(r.id, c.id)}>삭제</DeleteCommentBtn>
                                </>
                              )}
                            </CommentBtns>
                          )}
                        </CommentMeta>
                        {editingCommentId === r.id ? (
                          <CommentEditInput
                            value={editingContent}
                            onChange={e => setEditingContent(e.target.value)}
                            autoFocus
                          />
                        ) : (
                          <CommentContent>{r.content}</CommentContent>
                        )}
                        {/* 대댓글 좋아요/싫어요/답글 */}
                        <CommentReactionRow>
                          <CommentReactionBtn $active={!!r.user_liked} $color="#ff2d55" onClick={() => handleCommentLike(r.id, c.id)} disabled={!currentUserId}>
                            {r.user_liked ? '❤️' : '🤍'} {r.like_count || 0}
                          </CommentReactionBtn>
                          <CommentReactionBtn $active={!!r.user_disliked} $color="#6c757d" onClick={() => handleCommentDislike(r.id, c.id)} disabled={!currentUserId}>
                            👎 {r.dislike_count || 0}
                          </CommentReactionBtn>
                          {currentUserId && (
                            <ReplyBtn onClick={() => {
                              const isToggling = replyingTo === c.id && replyTargetNick === r.nickname;
                              if (isToggling) {
                                setReplyingTo(null);
                                setReplyTargetNick(null);
                                setReplyInput('');
                              } else {
                                setReplyingTo(c.id);
                                setReplyTargetNick(r.nickname);
                                setReplyInput(`@${r.nickname} `);
                              }
                            }}>
                              💬 답글
                            </ReplyBtn>
                          )}
                        </CommentReactionRow>
                      </ReplyItem>
                    ))}
                  </ReplyList>
                )}
              </CommentItem>
            ))}
          </CommentList>
        )}
      </CommentSection>
    </FullContainer>
  );
};

export default ProjectDetail;

const FullContainer = styled.div`
  width: 100%; min-height: 100vh; padding: 40px 100px;
  display: flex; flex-direction: column; background: transparent;
  animation: ${fadeIn} 0.6s ease-out; box-sizing: border-box;
`;
const Header = styled.header` width: 100%; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; `;
const BackButton = styled.button` background: none; border: none; color: rgba(255,255,255,0.4); font-size: 16px; cursor: pointer; &:hover { color: white; } `;
const ViewCount = styled.span` font-size: 14px; color: rgba(255,255,255,0.35); `;
const MainContent = styled.div` flex: 1; display: flex; align-items: flex-start; justify-content: space-between; gap: 60px; `;
const InfoSide = styled.div` display: flex; flex-direction: column; gap: 20px; min-width: 350px; max-width: 400px; `;
const TitleBox = styled.div` display: flex; flex-direction: column; gap: 8px; `;
const MainTitle = styled.h1` font-size: 40px; font-weight: 800; margin: 0; color: white; letter-spacing: -1px; `;
const SubTitle = styled.span` font-size: 16px; color: #7c6fcd; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; `;
const ReactionRow = styled.div` display: flex; gap: 10px; `;
const ReactionBtn = styled.button<{ $active: boolean; $color: string }>`
  flex: 1; height: 48px; border-radius: 50px;
  border: 2px solid ${p => p.$active ? p.$color : 'rgba(255,255,255,0.15)'};
  background: ${p => p.$active ? `${p.$color}33` : 'transparent'};
  color: ${p => p.$active ? p.$color : 'rgba(255,255,255,0.6)'};
  font-size: 15px; font-weight: 700; cursor: pointer; transition: all 0.2s;
  &:hover { border-color: ${p => p.$color}; color: ${p => p.$color}; }
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
const MetaInfo = styled.div` display: flex; flex-direction: column; gap: 16px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 24px; `;
const MetaItem = styled.div` display: flex; flex-direction: column; gap: 6px; `;
const MetaLabel = styled.span` font-size: 11px; color: #7c6fcd; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; `;
const MetaValue = styled.span` font-size: 14px; color: rgba(255,255,255,0.8); word-break: break-all; a { color: #a29bfe; text-decoration: none; &:hover { text-decoration: underline; } } `;
const MetaValueBox = styled.span` font-size: 14px; color: rgba(255,255,255,0.85); line-height: 1.5; white-space: pre-line; word-break: break-all; `;
const UserDivider = styled.div` margin: 8px 0; border-top: 1px dashed rgba(255,255,255,0.15); `;
const AuthorLink = styled.span`
  cursor: pointer; color: #a89ee8;
  &:hover { color: white; text-decoration: underline; }
`;
const ImageSide = styled.div` flex: 1; max-width: 750px; display: flex; flex-direction: column; gap: 16px; `;
const MainImageWrapper = styled.div` width: 100%; aspect-ratio: 16/10; background: rgba(255,255,255,0.05); border-radius: 30px; overflow: hidden; `;
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
const BottomSection = styled.div` margin-top: 50px; padding-bottom: 40px; display: flex; flex-direction: column; gap: 48px; `;
const ContentBlock = styled.div`
  display: flex; flex-direction: column; gap: 16px; align-items: center;
  &.creator-block { border-top: 1px solid rgba(255,255,255,0.1); padding-top: 30px; }
`;
const SectionLabel = styled.h3` font-size: 14px; color: #7c6fcd; letter-spacing: 3px; margin: 0; font-weight: 900; text-transform: uppercase; text-align: center; `;
const DescriptionText = styled.p` max-width: 850px; font-size: 16px; color: rgba(255,255,255,0.85); line-height: 1.8; white-space: pre-line; margin: 0; text-align: center; `;
const CommentSection = styled.div` border-top: 1px solid rgba(255,255,255,0.08); padding-top: 40px; padding-bottom: 80px; display: flex; flex-direction: column; gap: 24px; `;
const CommentInputRow = styled.div`
  display: flex; align-items: center; gap: 8px;
  padding: 6px 6px 6px 20px;
  background: #1c2035; border-radius: 50px;
`;
const CommentInput = styled.textarea`
  flex: 1; padding: 10px 0; border: none;
  background: transparent; color: white; font-size: 14px; resize: none; height: 40px;
  outline: none; font-family: inherit; line-height: 1.5; overflow: hidden;
  &::placeholder { color: rgba(255,255,255,0.28); }
  &:disabled { opacity: 0.4; }
`;
const CommentSubmitBtn = styled.button`
  padding: 10px 24px; border-radius: 50px; border: none; background: #7c6fcd; color: white; font-size: 14px; font-weight: 700; cursor: pointer; flex-shrink: 0;
  &:hover:not(:disabled) { background: #9187d8; } &:disabled { opacity: 0.4; cursor: not-allowed; }
`;
const DisabledComment = styled.p` text-align: center; color: rgba(255,255,255,0.3); padding: 30px 0; font-size: 14px; border: 1px dashed rgba(255,255,255,0.15); border-radius: 12px; `;
const ReplyBtn = styled.button`
  background: none; border: none; color: rgba(255,255,255,0.4); font-size: 12px; cursor: pointer; padding: 2px 8px;
  &:hover { color: #7c6fcd; }
`;
const ReplyInputRow = styled.div`
  display: flex; align-items: center; gap: 8px;
  padding: 6px 6px 6px 20px; margin-top: 10px; margin-left: 20px;
  background: #1c2035; border-radius: 50px;
`;
const ReplyList = styled.div` display: flex; flex-direction: column; gap: 10px; margin-top: 12px; padding-left: 20px; border-left: 2px solid rgba(124,111,205,0.3); `;
const ReplyItem = styled.div`
  background: rgba(255,255,255,0.03); border-radius: 10px; padding: 12px 16px;
`;
const NoComment = styled.p` text-align: center; color: rgba(255,255,255,0.3); padding: 30px 0; font-size: 14px; `;
const CommentList = styled.div` display: flex; flex-direction: column; gap: 16px; `;
const CommentItem = styled.div` background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 16px 20px; `;
const CommentMeta = styled.div`
  display: flex; align-items: center; gap: 10px; margin-bottom: 8px;
  .nick { font-size: 14px; font-weight: 700; color: #bfbaf2; }
  .date { font-size: 12px; color: rgba(255,255,255,0.3); }
`;
const CommentActionBtn = styled.button`
  background: none; border: none; color: rgba(180,180,255,0.6); font-size: 12px; cursor: pointer;
  &:hover { color: #bfbaf2; }
`;
const CommentBtns = styled.div` margin-left: auto; display: flex; gap: 4px; align-items: center; `;
const DeleteCommentBtn = styled.button`
  background: none; border: none; color: rgba(255,100,100,0.5); font-size: 12px; cursor: pointer;
  &:hover { color: #ff6b6b; }
`;
const CommentContent = styled.p` font-size: 14px; color: rgba(255,255,255,0.75); line-height: 1.6; margin: 0; white-space: pre-line; text-align: left; `;
const CommentEditInput = styled.textarea`
  width: 100%; padding: 10px 14px; border-radius: 10px; border: 1px solid #7c6fcd;
  background: rgba(255,255,255,0.08); color: white; font-size: 14px; resize: none;
  outline: none; font-family: inherit; min-height: 60px; box-sizing: border-box;
`;
const CommentReactionRow = styled.div` display: flex; gap: 8px; margin-top: 10px; `;
const CommentReactionBtn = styled.button<{ $active: boolean; $color: string }>`
  padding: 4px 12px; border-radius: 50px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s;
  border: 1px solid ${p => p.$active ? p.$color : 'rgba(255,255,255,0.15)'};
  background: ${p => p.$active ? `${p.$color}22` : 'transparent'};
  color: ${p => p.$active ? p.$color : 'rgba(255,255,255,0.4)'};
  &:hover:not(:disabled) { border-color: ${p => p.$color}; color: ${p => p.$color}; }
  &:disabled { cursor: default; }
`;