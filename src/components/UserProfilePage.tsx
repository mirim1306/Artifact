import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { userAPI } from '../Api';

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
  created_at: string;
  like_count?: number;
  view_count?: number;
}

interface UserInfo {
  id: number;
  nickname: string;
  username: string;
}

interface Props {
  username: string;
  onBack: () => void;
  onSelectPortfolio: (portfolioId: number) => void;
}

const UserProfilePage: React.FC<Props> = ({ username, onBack, onSelectPortfolio }) => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    userAPI.getPublicProfile(username).then(res => {
      if (res.success) {
        setUserInfo(res.user);
        setPortfolios(res.portfolios);
      }
      setLoading(false);
    });
  }, [username]);

  return (
    <Container>
      <BackBtn onClick={onBack}>← 뒤로</BackBtn>

      {loading ? (
        <LoadingText>불러오는 중...</LoadingText>
      ) : (
        <>
          <ProfileSection>
            <Avatar>👤</Avatar>
            <ProfileInfo>
              <Nickname>{userInfo?.nickname || username}</Nickname>
              <Username>@{userInfo?.username || username}</Username>
            </ProfileInfo>
          </ProfileSection>

          <SectionTitle>공개 포트폴리오 ({portfolios.length})</SectionTitle>

          {portfolios.length === 0 ? (
            <EmptyText>공개된 포트폴리오가 없어요.</EmptyText>
          ) : (
            <Grid>
              {portfolios.map(p => (
                <Card key={p.id} onDoubleClick={() => onSelectPortfolio(p.id)}>
                  <CardImage>
                    {p.main_image
                      ? <img src={getImageUrl(p.main_image)} alt={p.title} />
                      : <NoImage>🖼️</NoImage>
                    }
                    <HoverTip>더블 클릭 하세요!</HoverTip>
                  </CardImage>
                  <CardBody>
                    <CardCategory>{p.category}</CardCategory>
                    <CardTitle>{p.title}</CardTitle>
                    <CardDate>{new Date(p.created_at).toLocaleDateString('ko-KR')}</CardDate>
                    <CardStats>
                      <span>❤️ {p.like_count || 0}</span>
                      <span>👁 {p.view_count || 0}</span>
                    </CardStats>
                  </CardBody>
                </Card>
              ))}
            </Grid>
          )}
        </>
      )}
    </Container>
  );
};

export default UserProfilePage;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Container = styled.div`
  min-height: 100vh;
  max-width: 1100px;
  margin: 0 auto;
  padding: 40px 40px 60px;
  animation: ${fadeIn} 0.4s ease;
`;

const BackBtn = styled.button`
  background: none; border: none;
  color: rgba(255,255,255,0.5); font-size: 15px; cursor: pointer;
  padding: 0; margin-bottom: 28px; display: block;
  &:hover { color: white; }
`;

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
  flex-shrink: 0;
`;

const ProfileInfo = styled.div`
  flex: 1;
  margin-left: 24px;
  text-align: left;
`;

const Nickname = styled.h2` font-size: 24px; font-weight: 800; margin: 0 0 4px; `;
const Username = styled.p` font-size: 15px; color: rgba(255,255,255,0.5); margin: 0; `;

const SectionTitle = styled.h2` font-size: 22px; font-weight: 800; margin-bottom: 24px; `;

const LoadingText = styled.p`
  text-align: center; color: rgba(255,255,255,0.5); padding: 60px 0;
`;

const EmptyText = styled.p`
  text-align: center; color: rgba(255,255,255,0.5);
  padding: 60px 0; font-size: 16px;
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
  cursor: pointer;
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

const HoverTip = styled.div`
  position: absolute; bottom: 0; left: 0; right: 0;
  background: rgba(0,0,0,0.6); color: white;
  font-size: 12px; text-align: center; padding: 6px;
  opacity: 0; transition: opacity 0.2s;
  ${Card}:hover & { opacity: 1; }
`;

const CardBody = styled.div` padding: 16px; display: flex; flex-direction: column; gap: 6px; `;
const CardCategory = styled.span` font-size: 11px; color: #ff85a1; font-weight: 700; letter-spacing: 1px; `;
const CardTitle = styled.h3` font-size: 16px; font-weight: 700; margin: 0; `;
const CardDate = styled.p` font-size: 12px; color: rgba(255,255,255,0.3); margin: 0; `;
const CardStats = styled.div` display: flex; gap: 12px; font-size: 12px; color: rgba(255,255,255,0.35); `;
