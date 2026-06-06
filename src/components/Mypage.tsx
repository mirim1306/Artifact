import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { portfolioAPI, authAPI } from '../Api';

const getImageUrl = (url: string | undefined): string => {
  if (!url) return '/artifact-logo.png';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `http://localhost:4000${url.startsWith('/') ? '' : '/'}${url}`;
};

interface Portfolio {
  id: number;
  title: string;
  description: string;
  category: string;
  main_image: string;
  run_link: string;
  file_link: string;
  github_link: string;
  team_members: string;
  tech_stack: string;
  dev_period: string;
  is_public: boolean;
  created_at: string;
  like_count?: number;
  view_count?: number;
  tags?: string[];
}

interface MyPageProps {
  user: { id: number; username: string; nickname: string; email: string };
  onBack: () => void;
  onRegister: () => void;
  onEdit: (portfolio: Portfolio) => void;
  onLogout: () => void;
}

const MyPage: React.FC<MyPageProps> = ({ user, onBack, onRegister, onEdit, onLogout }) => {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);


  const fetchPortfolios = async () => {
    setLoading(true);
    const res = await portfolioAPI.getMyPortfolios();
    if (res.success) setPortfolios(res.portfolios);
    setLoading(false);
  };

  useEffect(() => { fetchPortfolios(); }, []);

  const handleWithdraw = async () => {
    if (!window.confirm(`정말로 탈퇴하시겠습니까?\n탈퇴하면 모든 포트폴리오가 삭제됩니다.`)) return;
    const res = await authAPI.withdraw();
    if (res.success) {
      alert('탈퇴가 완료되었습니다.');
      onLogout();
    } else {
      alert(res.message || '탈퇴 처리 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    const res = await portfolioAPI.delete(id);
    if (res.success) {
      alert('삭제되었습니다.');
      fetchPortfolios();
    }
  };



  return (
    <Container>
      {/* 💡 제거 완료: <BackButton> 태그를 삭제했습니다. */}

      <ProfileSection>
        <Avatar>👤</Avatar>
        <ProfileInfo>
          <Nickname>{user.nickname}</Nickname>
          <Username>@{user.username}</Username>
          <Email>{user.email}</Email>
        </ProfileInfo>
        <RegisterBtn onClick={onRegister}>+ 포트폴리오 등록</RegisterBtn>
        <WithdrawBtn onClick={handleWithdraw}>회원 탈퇴</WithdrawBtn>
      </ProfileSection>

      <SectionTitle>내 포트폴리오 ({portfolios.length})</SectionTitle>

      {loading ? (
        <LoadingText>불러오는 중...</LoadingText>
      ) : portfolios.length === 0 ? (
        <EmptyText>
          아직 등록한 포트폴리오가 없어요.<br />
          <span onClick={onRegister}>포트폴리오를 등록해보세요!</span>
        </EmptyText>
      ) : (
        <Grid>
          {portfolios.map(p => (
            <Card key={p.id}>
              <CardImage>
                {p.main_image
                  ? <img src={getImageUrl(p.main_image)} alt={p.title} />
                  : <NoImage>🖼️</NoImage>
                }
                <Badge $public={p.is_public}>{p.is_public ? '공개' : '비공개'}</Badge>
              </CardImage>
              <CardBody>
                <CardCategory>{p.category}</CardCategory>
                <CardTitle>{p.title}</CardTitle>
                <CardDesc>{p.description}</CardDesc>
                {p.tech_stack && <TechStack>{p.tech_stack}</TechStack>}
                <CardDate>{new Date(p.created_at).toLocaleDateString('ko-KR')}</CardDate>
                <CardStats>
                  <span>❤️ {p.like_count || 0}</span>
                  <span>👁 {p.view_count || 0}</span>
                </CardStats>
                <ButtonRow>
                  <EditBtn onClick={() => onEdit(p)}>수정</EditBtn>
                  <DeleteBtn onClick={() => handleDelete(p.id)}>삭제</DeleteBtn>
                </ButtonRow>
              </CardBody>
            </Card>
          ))}
        </Grid>
      )}

    </Container>
  );
};

export default MyPage;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Container = styled.div`
  min-height: 100vh;
  max-width: 1100px;
  margin: 0 auto;
  padding: 60px 40px;
  animation: ${fadeIn} 0.4s ease;
`;

// 💡 제거 완료: 사용하지 않는 BackButton 스타일 컴포넌트를 삭제했습니다.

const ProfileSection = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 24px;
  padding: 30px;
  margin-bottom: 40px;
`;

const Avatar = styled.div`
  font-size: 60px;
  width: 80px; height: 80px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0.1);
  border-radius: 50%;
`;

const ProfileInfo = styled.div` flex: 1; `;
const Nickname = styled.h2` font-size: 24px; font-weight: 800; margin: 0 0 4px; `;
const Username = styled.p` font-size: 15px; color: rgba(255,255,255,0.5); margin: 0 0 4px; `;
const Email = styled.p` font-size: 14px; color: rgba(255,255,255,0.4); margin: 0; `;

const WithdrawBtn = styled.button`
  padding: 10px 18px; border-radius: 50px; font-size: 13px; font-weight: 600; cursor: pointer;
  background: transparent; border: 1px solid rgba(255, 100, 100, 0.4); color: rgba(255,100,100,0.7);
  transition: all 0.2s;
  &:hover { background: rgba(255,100,100,0.1); border-color: #ff6b6b; color: #ff6b6b; }
`;
const RegisterBtn = styled.button`
  padding: 12px 24px;
  border-radius: 50px;
  border: none;
  background: linear-gradient(135deg, #7b2cbf, #ff85a1);
  color: white; font-size: 15px; font-weight: 700;
  cursor: pointer; transition: 0.3s;
  &:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(123,44,191,0.4); }
`;

const SectionTitle = styled.h2`
  font-size: 22px; font-weight: 800; margin-bottom: 24px;
`;

const LoadingText = styled.p` text-align: center; color: rgba(255,255,255,0.5); padding: 60px 0; `;

const EmptyText = styled.p`
  text-align: center; color: rgba(255,255,255,0.5);
  padding: 60px 0; font-size: 16px; line-height: 2;
  span { color: #ff85a1; cursor: pointer; &:hover { text-decoration: underline; } }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
`;

const Card = styled.div`
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 20px;
  overflow: hidden;
  transition: 0.3s;
  &:hover { transform: translateY(-4px); border-color: rgba(123,44,191,0.5); }
`;

const CardImage = styled.div`
  width: 100%; aspect-ratio: 16/9;
  position: relative; overflow: hidden;
  background: rgba(0,0,0,0.3);
  img { width: 100%; height: 100%; object-fit: cover; }
`;

const NoImage = styled.div`
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  font-size: 40px; color: rgba(255,255,255,0.2);
`;

const Badge = styled.span<{ $public: boolean }>`
  position: absolute; top: 10px; right: 10px;
  padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700;
  background: ${p => p.$public ? 'rgba(81,207,102,0.8)' : 'rgba(255,107,107,0.8)'};
`;

const CardBody = styled.div` padding: 16px; display: flex; flex-direction: column; gap: 6px; `;
const CardCategory = styled.span` font-size: 11px; color: #ff85a1; font-weight: 700; letter-spacing: 1px; `;
const CardTitle = styled.h3` font-size: 16px; font-weight: 700; margin: 0; `;
const CardDesc = styled.p` font-size: 13px; color: rgba(255,255,255,0.6); margin: 0; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; `;
const TechStack = styled.p` font-size: 12px; color: rgba(255,255,255,0.4); margin: 0; `;
const CardDate = styled.p` font-size: 12px; color: rgba(255,255,255,0.3); margin: 0; `;
const CardStats = styled.div` display: flex; gap: 12px; font-size: 12px; color: rgba(255,255,255,0.35); `;

const ButtonRow = styled.div` display: flex; gap: 8px; margin-top: 8px; `;
const EditBtn = styled.button`
  flex: 1; padding: 8px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.2);
  background: transparent; color: white; font-size: 13px; font-weight: 600; cursor: pointer;
  &:hover { background: rgba(255,255,255,0.1); }
`;
const DeleteBtn = styled.button`
  flex: 1; padding: 8px; border-radius: 10px; border: none;
  background: rgba(255,107,107,0.2); color: #ff6b6b; font-size: 13px; font-weight: 600; cursor: pointer;
  &:hover { background: rgba(255,107,107,0.4); }
`;