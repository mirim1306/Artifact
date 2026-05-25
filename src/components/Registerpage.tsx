import React, { useState } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { portfolioAPI } from '../Api';

interface RegisterPageProps {
  onBack: () => void;
  onSuccess: () => void;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ onBack, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '웹',
    run_link: '',
    file_link: '',
    github_link: '',
    team_members: '',
    tech_stack: '',
    dev_period: '',
    is_public: 'true',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.title || !form.category) {
      setError('제목과 카테고리는 필수입니다.');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => formData.append(key, value));
    if (imageFile) formData.append('main_image', imageFile);

    const res = await portfolioAPI.create(formData);
    setLoading(false);

    if (res.success) {
      alert('포트폴리오가 등록되었습니다!');
      onSuccess();
    } else {
      setError(res.message || '등록 중 오류가 발생했습니다.');
    }
  };

  return (
    <Container>
      <BackButton onClick={onBack}>← 돌아가기</BackButton>
      <Title>포트폴리오 등록</Title>

      <Form onSubmit={handleSubmit}>
        {error && <ErrorMsg>{error}</ErrorMsg>}

        <Section>
          <SectionTitle>기본 정보</SectionTitle>

          <Label>메인 이미지</Label>
          <ImageUploadBox onClick={() => document.getElementById('imageInput')?.click()}>
            {imagePreview
              ? <PreviewImg src={imagePreview} alt="preview" />
              : <UploadPlaceholder>🖼️ 클릭하여 이미지 업로드</UploadPlaceholder>
            }
          </ImageUploadBox>
          <input id="imageInput" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />

          <Label>제목 <Required>*</Required></Label>
          <Input name="title" placeholder="프로젝트 제목" value={form.title} onChange={handleChange} />

          <Label>설명</Label>
          <Textarea name="description" placeholder="프로젝트 설명을 입력하세요" value={form.description} onChange={handleChange} rows={4} />

          <Label>카테고리 <Required>*</Required></Label>
          <Select name="category" value={form.category} onChange={handleChange}>
            <option value="웹">웹</option>
            <option value="앱">앱</option>
            <option value="게임">게임</option>
            <option value="디자인">디자인</option>
          </Select>

          <Label>공개 여부</Label>
          <Select name="is_public" value={form.is_public} onChange={handleChange}>
            <option value="true">공개</option>
            <option value="false">비공개</option>
          </Select>
        </Section>

        <Section>
          <SectionTitle>링크 정보</SectionTitle>

          <Label>실행 링크 (웹 서비스 URL)</Label>
          <Input name="run_link" placeholder="https://..." value={form.run_link} onChange={handleChange} />

          <Label>실행 파일 링크 (다운로드 URL)</Label>
          <Input name="file_link" placeholder="https://github.com/.../releases/..." value={form.file_link} onChange={handleChange} />

          <Label>GitHub 링크</Label>
          <Input name="github_link" placeholder="https://github.com/..." value={form.github_link} onChange={handleChange} />
        </Section>

        <Section>
          <SectionTitle>추가 정보</SectionTitle>

          <Label>팀원</Label>
          <Input name="team_members" placeholder="홍길동, 김철수" value={form.team_members} onChange={handleChange} />

          <Label>기술 스택</Label>
          <Input name="tech_stack" placeholder="React, Node.js, PostgreSQL" value={form.tech_stack} onChange={handleChange} />

          <Label>개발 기간</Label>
          <Input name="dev_period" placeholder="2024.01 ~ 2024.03" value={form.dev_period} onChange={handleChange} />
        </Section>

        <SubmitButton type="submit" disabled={loading}>
          {loading ? '등록 중...' : '포트폴리오 등록'}
        </SubmitButton>
      </Form>
    </Container>
  );
};

export default RegisterPage;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Container = styled.div`
  min-height: 100vh;
  max-width: 700px;
  margin: 0 auto;
  padding: 80px 40px;
  animation: ${fadeIn} 0.4s ease;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: rgba(255,255,255,0.6);
  font-size: 16px;
  cursor: pointer;
  margin-bottom: 30px;
  display: block;
  &:hover { color: white; }
`;

const Title = styled.h1`
  font-size: 36px;
  font-weight: 800;
  margin-bottom: 40px;
  background: linear-gradient(135deg, #7b2cbf, #ff85a1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Section = styled.div`
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 700;
  color: #ff85a1;
  margin-bottom: 8px;
  letter-spacing: 1px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: rgba(255,255,255,0.8);
  margin-top: 8px;
`;

const Required = styled.span` color: #ff85a1; `;

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

const Textarea = styled.textarea`
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.15);
  background: rgba(255,255,255,0.08);
  color: white;
  font-size: 15px;
  outline: none;
  resize: vertical;
  font-family: inherit;
  &::placeholder { color: rgba(255,255,255,0.3); }
  &:focus { border-color: #7b2cbf; }
`;

const Select = styled.select`
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.15);
  background: rgba(30,30,60,0.9);
  color: white;
  font-size: 15px;
  outline: none;
  cursor: pointer;
  &:focus { border-color: #7b2cbf; }
`;

const ImageUploadBox = styled.div`
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 16px;
  border: 2px dashed rgba(255,255,255,0.2);
  cursor: pointer;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: 0.3s;
  &:hover { border-color: #7b2cbf; }
`;

const PreviewImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const UploadPlaceholder = styled.div`
  color: rgba(255,255,255,0.4);
  font-size: 16px;
`;

const SubmitButton = styled.button`
  padding: 16px;
  border-radius: 16px;
  border: none;
  background: linear-gradient(135deg, #7b2cbf, #ff85a1);
  color: white;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  margin-top: 8px;
  &:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(123,44,191,0.4); }
  &:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
`;

const ErrorMsg = styled.p`
  color: #ff6b6b;
  font-size: 14px;
  text-align: center;
`;