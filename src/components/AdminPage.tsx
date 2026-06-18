import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

const API_URL = '';

const adminFetch = (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  return fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options.headers },
  }).then(r => r.json());
};

interface User { id: number; username: string; nickname: string; email: string; created_at: string; is_admin: boolean; }
interface Portfolio { id: number; title: string; category: string; nickname: string; username: string; created_at: string; is_public: boolean; }
interface Comment { id: number; content: string; nickname: string; username: string; portfolio_title: string; created_at: string; }

type Tab = 'users' | 'portfolios' | 'comments';

interface AdminPageProps { onBack: () => void; }

const AdminPage: React.FC<AdminPageProps> = ({ onBack }) => {
  const [tab, setTab] = useState<Tab>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async (t: Tab) => {
    setLoading(true);
    try {
      if (t === 'users') {
        const res = await adminFetch('/api/admin/users');
        if (res.success) setUsers(res.users);
      } else if (t === 'portfolios') {
        const res = await adminFetch('/api/admin/portfolios');
        if (res.success) setPortfolios(res.portfolios);
      } else {
        const res = await adminFetch('/api/admin/comments');
        if (res.success) setComments(res.comments);
      }
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(tab); }, [tab]);

  const deleteUser = async (id: number) => {
    const res = await adminFetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    if (res.success) setUsers(users.filter(u => u.id !== id));
  };

  const deletePortfolio = async (id: number) => {
    const res = await adminFetch(`/api/admin/portfolios/${id}`, { method: 'DELETE' });
    if (res.success) setPortfolios(portfolios.filter(p => p.id !== id));
  };

  const deleteComment = async (id: number) => {
    const res = await adminFetch(`/api/admin/comments/${id}`, { method: 'DELETE' });
    if (res.success) setComments(comments.filter(c => c.id !== id));
  };

  return (
    <Container>
      <Header>
        <BackBtn onClick={onBack}>← 돌아가기</BackBtn>
        <Title>🛡️ 관리자 페이지</Title>
      </Header>

      <TabRow>
        <TabBtn $active={tab === 'users'} onClick={() => setTab('users')}>유저 관리 ({users.length})</TabBtn>
        <TabBtn $active={tab === 'portfolios'} onClick={() => setTab('portfolios')}>포트폴리오 관리 ({portfolios.length})</TabBtn>
        <TabBtn $active={tab === 'comments'} onClick={() => setTab('comments')}>댓글 관리 ({comments.length})</TabBtn>
      </TabRow>

      {loading ? <LoadingText>불러오는 중...</LoadingText> : (
        <>
          {/* 유저 목록 */}
          {tab === 'users' && (
            <TableWrap>
              <Table>
                <colgroup>
                  <col style={{ width: '14%' }} /><col style={{ width: '14%' }} />
                  <col style={{ width: '28%' }} /><col style={{ width: '20%' }} />
                  <col style={{ width: '12%' }} /><col style={{ width: '12%' }} />
                </colgroup>
                <thead>
                  <tr><Th>닉네임</Th><Th>ID</Th><Th>이메일</Th><Th>가입일</Th><Th>관리자</Th><Th>삭제</Th></tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <Td>{u.nickname}</Td>
                      <Td>@{u.username}</Td>
                      <Td>{u.email}</Td>
                      <Td>{new Date(u.created_at).toLocaleDateString('ko-KR')}</Td>
                      <Td>{u.is_admin ? '✅' : ''}</Td>
                      <Td>{!u.is_admin && <DeleteBtn onClick={() => deleteUser(u.id)}>탈퇴</DeleteBtn>}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          )}

          {/* 포트폴리오 목록 */}
          {tab === 'portfolios' && (
            <TableWrap>
              <Table>
                <colgroup>
                  <col style={{ width: '30%' }} /><col style={{ width: '12%' }} />
                  <col style={{ width: '16%' }} /><col style={{ width: '12%' }} />
                  <col style={{ width: '18%' }} /><col style={{ width: '12%' }} />
                </colgroup>
                <thead>
                  <tr><Th>제목</Th><Th>카테고리</Th><Th>등록자</Th><Th>공개</Th><Th>등록일</Th><Th>삭제</Th></tr>
                </thead>
                <tbody>
                  {portfolios.map(p => (
                    <tr key={p.id}>
                      <Td>{p.title}</Td>
                      <Td>{p.category}</Td>
                      <Td>{p.nickname}</Td>
                      <Td>{p.is_public ? '공개' : '비공개'}</Td>
                      <Td>{new Date(p.created_at).toLocaleDateString('ko-KR')}</Td>
                      <Td><DeleteBtn onClick={() => deletePortfolio(p.id)}>삭제</DeleteBtn></Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          )}

          {/* 댓글 목록 */}
          {tab === 'comments' && (
            <TableWrap>
              <Table>
                <colgroup>
                  <col style={{ width: '35%' }} /><col style={{ width: '15%' }} />
                  <col style={{ width: '25%' }} /><col style={{ width: '15%' }} />
                  <col style={{ width: '10%' }} />
                </colgroup>
                <thead>
                  <tr><Th>내용</Th><Th>작성자</Th><Th>포트폴리오</Th><Th>작성일</Th><Th>삭제</Th></tr>
                </thead>
                <tbody>
                  {comments.map(c => (
                    <tr key={c.id}>
                      <Td>{c.content}</Td>
                      <Td>{c.nickname}</Td>
                      <Td>{c.portfolio_title}</Td>
                      <Td>{new Date(c.created_at).toLocaleDateString('ko-KR')}</Td>
                      <Td><DeleteBtn onClick={() => deleteComment(c.id)}>삭제</DeleteBtn></Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          )}
        </>
      )}
    </Container>
  );
};

export default AdminPage;

const fadeIn = keyframes` from { opacity: 0; } to { opacity: 1; } `;
const Container = styled.div` padding: 40px 60px; min-height: 100vh; animation: ${fadeIn} 0.3s ease; `;
const Header = styled.div` display: flex; align-items: center; gap: 20px; margin-bottom: 32px; `;
const BackBtn = styled.button` background: none; border: none; color: rgba(255,255,255,0.4); font-size: 16px; cursor: pointer; &:hover { color: white; } `;
const Title = styled.h1` font-size: 28px; font-weight: 800; margin: 0; color: white; `;
const TabRow = styled.div` display: flex; gap: 10px; margin-bottom: 24px; `;
const TabBtn = styled.button<{ $active: boolean }>`
  padding: 12px 28px; border-radius: 50px; font-size: 14px; font-weight: 700; cursor: pointer; border: 1px solid transparent;
  background: ${p => p.$active ? '#7c6fcd' : 'rgba(255,255,255,0.07)'};
  color: ${p => p.$active ? 'white' : 'rgba(255,255,255,0.5)'};
  &:hover { background: ${p => p.$active ? '#7c6fcd' : 'rgba(255,255,255,0.12)'}; color: white; }
`;
const TableWrap = styled.div`
  border-radius: 16px; overflow: hidden;
  background: rgba(255,255,255,0.04);
`;
const Table = styled.table`
  width: 100%; border-collapse: collapse; table-layout: fixed;
`;
const Th = styled.th`
  padding: 14px 16px; text-align: left; vertical-align: middle;
  font-size: 12px; font-weight: 700; color: #7c6fcd;
  border-bottom: 1px solid rgba(255,255,255,0.08);
`;
const Td = styled.td`
  padding: 12px 16px; text-align: left; vertical-align: middle;
  font-size: 13px; color: rgba(255,255,255,0.8);
  border-bottom: 1px solid rgba(255,255,255,0.05);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
`;
const DeleteBtn = styled.button`
  padding: 6px 14px; border-radius: 8px; border: 1px solid rgba(255,100,100,0.4);
  background: transparent; color: rgba(255,100,100,0.7); font-size: 12px; font-weight: 700; cursor: pointer;
  &:hover { background: rgba(255,100,100,0.1); color: #ff6b6b; border-color: #ff6b6b; }
`;
const LoadingText = styled.div` text-align: center; padding: 80px; color: rgba(255,255,255,0.4); `;