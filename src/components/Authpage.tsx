import React, { useState } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { authAPI } from '../Api';

interface AuthPageProps {
  onLogin: (user: any, token: string) => void;
  onBack: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin, onBack }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 로그인 폼
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });

  // 회원가입 폼
  const [registerForm, setRegisterForm] = useState({
    username: '', password: '', confirmPassword: '', nickname: '', email: ''
  });
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  // 아이디 중복 체크
  const checkUsername = async () => {
    if (!registerForm.username) return;
    const res = await authAPI.checkUsername(registerForm.username);
    setUsernameAvailable(res.available);
  };

  // 로그인
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await authAPI.login(loginForm);
    setLoading(false);
    if (res.success) {
      localStorage.setItem('token', res.token);
      onLogin(res.user, res.token);
    } else {
      setError(res.message);
    }
  };

  // 회원가입
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (registerForm.password !== registerForm.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (usernameAvailable === false) {
      setError('이미 사용 중인 아이디입니다.');
      return;
    }
    setLoading(true);
    const res = await authAPI.register({
      username: registerForm.username,
      password: registerForm.password,
      nickname: registerForm.nickname,
      email: registerForm.email,
    });
    setLoading(false);
    if (res.success) {
      setSuccess('가입이 완료되었습니다! 로그인해주세요.');
      setIsLogin(true);
    } else {
      setError(res.message);
    }
  };

  return (
    <Container>
      <BackButton onClick={onBack}>← 돌아가기</BackButton>

      <Card>
        <TabRow>
          <Tab $active={isLogin} onClick={() => { setIsLogin(true); setError(''); setSuccess(''); }}>로그인</Tab>
          <Tab $active={!isLogin} onClick={() => { setIsLogin(false); setError(''); setSuccess(''); }}>회원가입</Tab>
        </TabRow>

        {error && <ErrorMsg>{error}</ErrorMsg>}
        {success && <SuccessMsg>{success}</SuccessMsg>}

        {isLogin ? (
          <Form onSubmit={handleLogin}>
            <Label>아이디</Label>
            <Input
              type="text"
              placeholder="아이디를 입력하세요"
              value={loginForm.username}
              onChange={e => setLoginForm({ ...loginForm, username: e.target.value })}
            />
            <Label>비밀번호</Label>
            <Input
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={loginForm.password}
              onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
            />
            <SubmitButton type="submit" disabled={loading}>
              {loading ? '로그인 중...' : '로그인'}
            </SubmitButton>
          </Form>
        ) : (
          <Form onSubmit={handleRegister}>
            <Label>아이디 <span>(4~20자)</span></Label>
            <InputRow>
              <Input
                type="text"
                placeholder="아이디를 입력하세요"
                value={registerForm.username}
                onChange={e => { setRegisterForm({ ...registerForm, username: e.target.value }); setUsernameAvailable(null); }}
              />
              <CheckButton type="button" onClick={checkUsername}>중복확인</CheckButton>
            </InputRow>
            {usernameAvailable === true && <AvailableMsg>✅ 사용 가능한 아이디입니다.</AvailableMsg>}
            {usernameAvailable === false && <ErrorMsg>❌ 이미 사용 중인 아이디입니다.</ErrorMsg>}

            <Label>닉네임</Label>
            <Input
              type="text"
              placeholder="닉네임을 입력하세요"
              value={registerForm.nickname}
              onChange={e => setRegisterForm({ ...registerForm, nickname: e.target.value })}
            />

            <Label>이메일</Label>
            <Input
              type="email"
              placeholder="이메일을 입력하세요"
              value={registerForm.email}
              onChange={e => setRegisterForm({ ...registerForm, email: e.target.value })}
            />

            <Label>비밀번호 <span>(8자 이상)</span></Label>
            <Input
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={registerForm.password}
              onChange={e => setRegisterForm({ ...registerForm, password: e.target.value })}
            />

            <Label>비밀번호 확인</Label>
            <Input
              type="password"
              placeholder="비밀번호를 다시 입력하세요"
              value={registerForm.confirmPassword}
              onChange={e => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
            />

            <SubmitButton type="submit" disabled={loading}>
              {loading ? '가입 중...' : '회원가입'}
            </SubmitButton>
          </Form>
        )}
      </Card>
    </Container>
  );
};

export default AuthPage;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  animation: ${fadeIn} 0.4s ease;
`;

const BackButton = styled.button`
  position: fixed;
  top: 30px;
  left: 30px;
  background: none;
  border: none;
  color: rgba(255,255,255,0.6);
  font-size: 16px;
  cursor: pointer;
  &:hover { color: white; }
`;

const Card = styled.div`
  background: rgba(255,255,255,0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 24px;
  padding: 40px;
  width: 100%;
  max-width: 420px;
`;

const TabRow = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
`;

const Tab = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 12px;
  border-radius: 12px;
  border: none;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  ${props => props.$active ? css`
    background: linear-gradient(135deg, #7b2cbf, #ff85a1);
    color: white;
  ` : css`
    background: rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.5);
    &:hover { background: rgba(255,255,255,0.15); color: white; }
  `}
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: rgba(255,255,255,0.8);
  margin-top: 8px;
  span { color: rgba(255,255,255,0.4); font-weight: 400; }
`;

const Input = styled.input`
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.15);
  background: rgba(255,255,255,0.08);
  color: white;
  font-size: 15px;
  outline: none;
  &::placeholder { color: rgba(255,255,255,0.3); }
  &:focus { border-color: #7b2cbf; }
`;

const InputRow = styled.div`
  display: flex;
  gap: 8px;
  Input { flex: 1; }
`;

const CheckButton = styled.button`
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.15);
  background: rgba(255,255,255,0.08);
  color: white;
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
  &:hover { background: rgba(255,255,255,0.15); }
`;

const SubmitButton = styled.button`
  margin-top: 16px;
  padding: 14px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #7b2cbf, #ff85a1);
  color: white;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  &:hover { transform: translateY(-2px); }
  &:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
`;

const ErrorMsg = styled.p`
  color: #ff6b6b;
  font-size: 13px;
  margin: 4px 0;
`;

const AvailableMsg = styled.p`
  color: #51cf66;
  font-size: 13px;
  margin: 4px 0;
`;

const SuccessMsg = styled.p`
  color: #51cf66;
  font-size: 14px;
  text-align: center;
  margin-bottom: 10px;
`;