import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { portfolioAPI } from '../Api';

interface RegisterPageProps {
  onBack: () => void;
  onSuccess: () => void;
  editData?: any | null; // 수정 시 기존 데이터
}

type Category = '웹' | '앱' | '게임' | '디자인';

const SUB_CATEGORY_OPTIONS: Record<Category, string[]> = {
  '웹':     ['앱', '게임', '디자인'],
  '앱':     ['웹', '게임', '디자인'],
  '게임':   ['웹', '앱', '디자인'],
  '디자인': ['웹', '앱', '게임'],
};

const RegisterPage: React.FC<RegisterPageProps> = ({ onBack, onSuccess, editData }) => {
  const isEdit = !!editData;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [designImages, setDesignImages] = useState<File[]>([]);
  const [designImagePreviews, setDesignImagePreviews] = useState<string[]>([]);
  const [subCategories, setSubCategories] = useState<string[]>([]);

  const [form, setForm] = useState({
    title: '',
    service_intro: '',
    main_features: '',
    tech_environment: '',
    team_members: '',
    dev_period: '',
    github_link: '',
    is_public: 'true',
    category: '웹' as Category,
    run_link: '',
    file_link: '',
    store_link: '',
    design_tool: '',
    design_link: '',
  });

  // 수정 모드면 기존 데이터로 폼 초기화
  useEffect(() => {
    if (editData) {
      setForm({
        title: editData.title || '',
        service_intro: editData.service_intro || '',
        main_features: editData.main_features || '',
        tech_environment: editData.tech_environment || '',
        team_members: editData.team_members || '',
        dev_period: editData.dev_period || '',
        github_link: editData.github_link || '',
        is_public: editData.is_public === false ? 'false' : 'true',
        category: (editData.category as Category) || '웹',
        run_link: editData.run_link || '',
        file_link: editData.file_link || '',
        store_link: editData.store_link || '',
        design_tool: editData.design_tool || '',
        design_link: editData.design_link || '',
      });
      // 기존 메인 이미지 미리보기
      if (editData.sub_categories) {
        const parsed = typeof editData.sub_categories === 'string'
          ? editData.sub_categories.split(',').filter(Boolean)
          : (editData.sub_categories || []);
        setSubCategories(parsed);
      }
      if (editData.main_image) {
        const url = editData.main_image.startsWith('http')
          ? editData.main_image
          : `http://localhost:4000${editData.main_image}`;
        setMainImagePreview(url);
      }
    }
  }, [editData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleMainImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMainImageFile(file);
      setMainImagePreview(URL.createObjectURL(file));
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
    if (subCategories.length > 0) formData.append('sub_categories', subCategories.join(','));
    if (mainImageFile) formData.append('main_image', mainImageFile);
    designImages.forEach(file => formData.append('media_files', file));

    const res = isEdit
      ? await portfolioAPI.update(editData.id, formData)
      : await portfolioAPI.create(formData);

    setLoading(false);
    if (res.success) {
      onSuccess();
    } else {
      setError(res.message || (isEdit ? '수정 중 오류가 발생했습니다.' : '등록 중 오류가 발생했습니다.'));
    }
  };

  return (
    <Container>
      <Header>
        <Title>{isEdit ? '포트폴리오 수정' : '포트폴리오 등록'}</Title>
      </Header>

      <Form onSubmit={handleSubmit}>
        {error && <ErrorMsg>{error}</ErrorMsg>}

        {/* ── 기본 정보 ── */}
        <Section>
          <SectionTitle>기본 정보</SectionTitle>

          <Row>
            <Col>
              <Label>카테고리 <Required>*</Required></Label>
              <Select name="category" value={form.category} onChange={e => {
                setForm({ ...form, category: e.target.value as Category });
                setSubCategories([]);
              }}>
                <option value="웹">웹</option>
                <option value="앱">앱</option>
                <option value="게임">게임</option>
                <option value="디자인">디자인</option>
              </Select>
            </Col>
            <Col>
              <Label>공개 여부</Label>
              <Select name="is_public" value={form.is_public} onChange={handleChange}>
                <option value="true">공개</option>
                <option value="false">비공개</option>
              </Select>
            </Col>
          </Row>

          <Label>추가 카테고리 <Hint>(해당되는 항목 선택, 복수 선택 가능)</Hint></Label>
          <SubCategoryRow>
            {SUB_CATEGORY_OPTIONS[form.category].map(cat => (
              <SubCategoryChip
                key={cat}
                type="button"
                $active={subCategories.includes(cat)}
                onClick={() => setSubCategories(prev =>
                  prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
                )}
              >
                {cat}
              </SubCategoryChip>
            ))}
          </SubCategoryRow>

          <Label>메인 이미지</Label>
          <ImageUploadBox onClick={() => document.getElementById('mainImageInput')?.click()}>
            {mainImagePreview
              ? <PreviewImg src={mainImagePreview} alt="preview" />
              : <UploadPlaceholder>🖼️ 클릭하여 메인 이미지 업로드</UploadPlaceholder>
            }
          </ImageUploadBox>
          <input id="mainImageInput" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleMainImage} />

          <Label>제목 <Required>*</Required></Label>
          <Input name="title" placeholder="프로젝트 제목" value={form.title} onChange={handleChange} />

          <Label>서비스 소개</Label>
          <Textarea name="service_intro" placeholder="서비스를 소개해주세요" value={form.service_intro} rows={4} onChange={handleChange} />

          <Label>주요 기능</Label>
          <Textarea name="main_features" placeholder="주요 기능을 입력해주세요" value={form.main_features} rows={4} onChange={handleChange} />

          <Label>{form.category === '디자인' ? '사용 툴 / 환경' : '개발 기술 / 환경'}</Label>
          <Input
            name="tech_environment"
            placeholder={form.category === '디자인' ? 'Figma, Photoshop, Illustrator...' : 'React, Node.js, PostgreSQL...'}
            value={form.tech_environment}
            onChange={handleChange}
          />

          <Label>팀원</Label>
          <Input name="team_members" placeholder="홍길동, 김철수" value={form.team_members} onChange={handleChange} />

          <Label>개발 기간</Label>
          <Input name="dev_period" placeholder="2024.01 ~ 2024.03" value={form.dev_period} onChange={handleChange} />
        </Section>

        {/* ── 카테고리별 정보 ── */}
        <Section>
          <SectionTitle>
            {form.category === '웹' && '웹 서비스 정보'}
            {form.category === '앱' && '앱 정보'}
            {form.category === '게임' && '게임 실행 정보'}
            {form.category === '디자인' && '디자인 정보'}
          </SectionTitle>

          {form.category === '웹' && (
            <>
              <Label>실행 링크 (웹 URL)</Label>
              <Input name="run_link" placeholder="https://..." value={form.run_link} onChange={handleChange} />
            </>
          )}

          {form.category === '앱' && (
            <>
              <Label>앱스토어 / 플레이스토어 링크</Label>
              <Input name="store_link" placeholder="https://apps.apple.com/... 또는 https://play.google.com/..." value={form.store_link} onChange={handleChange} />
            </>
          )}

          {form.category === '게임' && (
            <>
              <Label>실행 파일 링크 (exe 다운로드)</Label>
              <Input name="file_link" placeholder="https://github.com/.../releases/..." value={form.file_link} onChange={handleChange} />
              <Label>웹 게임 링크 <Hint>(웹 게임인 경우)</Hint></Label>
              <Input name="run_link" placeholder="https://..." value={form.run_link} onChange={handleChange} />
            </>
          )}

          {form.category === '디자인' && (
            <>
              <Label>추가 이미지 <Hint>(작업물 상세 이미지, 무제한)</Hint></Label>
              <MultiImageUploadBox onClick={() => document.getElementById('designImagesInput')?.click()}>
                {designImagePreviews.length > 0 ? (
                  <PreviewGrid>
                    {designImagePreviews.map((src, i) => (
                      <PreviewThumb key={i}>
                        <img src={src} alt={`design-${i}`} />
                        <RemoveBtn type="button" onClick={e => {
                          e.stopPropagation();
                          setDesignImages(prev => prev.filter((_, idx) => idx !== i));
                          setDesignImagePreviews(prev => prev.filter((_, idx) => idx !== i));
                        }}>×</RemoveBtn>
                      </PreviewThumb>
                    ))}
                    <AddMoreBtn>+ 추가</AddMoreBtn>
                  </PreviewGrid>
                ) : (
                  <UploadPlaceholder>🖼️ 클릭하여 추가 이미지 업로드</UploadPlaceholder>
                )}
              </MultiImageUploadBox>
              <input id="designImagesInput" type="file" accept="image/*" multiple style={{ display: 'none' }}
                onChange={e => {
                  const files = Array.from(e.target.files || []);
                  setDesignImages(prev => [...prev, ...files]);
                  setDesignImagePreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
                  e.target.value = '';
                }}
              />
              <Label>디자인 링크 <Hint>(Figma, Behance, Notion 등)</Hint></Label>
              <Input name="design_link" placeholder="https://www.figma.com/... 또는 https://www.behance.net/..." value={(form as any).design_link || ''} onChange={handleChange} />
            </>
          )}

          {form.category !== '디자인' && (
            <>
              <Label>GitHub 링크</Label>
              <Input name="github_link" placeholder="https://github.com/..." value={form.github_link} onChange={handleChange} />
            </>
          )}
        </Section>

        <SubmitButton type="submit" disabled={loading}>
          {loading ? (isEdit ? '수정 중...' : '등록 중...') : (isEdit ? '포트폴리오 수정' : '포트폴리오 등록')}
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
  max-width: 800px; margin: 0 auto; padding: 40px 40px 100px;
  animation: ${fadeIn} 0.4s ease;
`;
const Header = styled.div` margin-bottom: 32px; `;
const Title = styled.h1`
  font-size: 32px; font-weight: 800; margin: 0;
  background: linear-gradient(135deg, #7b2cbf, #ff85a1);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
`;
const Form = styled.form` display: flex; flex-direction: column; gap: 16px; `;
const Section = styled.div`
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
  border-radius: 20px; padding: 24px; display: flex; flex-direction: column; gap: 8px;
`;
const SectionTitle = styled.h3`
  font-size: 15px; font-weight: 700; color: #ff85a1;
  margin: 0 0 12px; letter-spacing: 1px; text-transform: uppercase;
`;
const Row = styled.div` display: flex; gap: 16px; `;
const Col = styled.div` flex: 1; display: flex; flex-direction: column; gap: 8px; `;
const Label = styled.label` font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.8); margin-top: 8px; `;
const Hint = styled.span` color: rgba(255,255,255,0.4); font-weight: 400; font-size: 12px; `;
const Required = styled.span` color: #ff85a1; `;
const Input = styled.input`
  padding: 11px 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.15);
  background: rgba(255,255,255,0.08); color: white; font-size: 14px; outline: none;
  &::placeholder { color: rgba(255,255,255,0.3); }
  &:focus { border-color: #7b2cbf; }
`;
const Textarea = styled.textarea`
  padding: 11px 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.15);
  background: rgba(255,255,255,0.08); color: white; font-size: 14px; outline: none;
  resize: vertical; font-family: inherit;
  &::placeholder { color: rgba(255,255,255,0.3); }
  &:focus { border-color: #7b2cbf; }
`;
const Select = styled.select`
  padding: 11px 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.15);
  background: rgba(30,30,60,0.9); color: white; font-size: 14px; outline: none; cursor: pointer;
  &:focus { border-color: #7b2cbf; }
`;
const ImageUploadBox = styled.div`
  width: 100%; aspect-ratio: 16/9; border-radius: 14px; border: 2px dashed rgba(255,255,255,0.2);
  cursor: pointer; overflow: hidden; display: flex; align-items: center; justify-content: center; transition: 0.3s;
  &:hover { border-color: #7b2cbf; }
`;
const PreviewImg = styled.img` width: 100%; height: 100%; object-fit: cover; `;
const UploadPlaceholder = styled.div` color: rgba(255,255,255,0.4); font-size: 15px; `;
const MultiImageUploadBox = styled.div`
  width: 100%; min-height: 120px; border-radius: 14px; border: 2px dashed rgba(255,255,255,0.2);
  cursor: pointer; padding: 12px; display: flex; align-items: center; justify-content: center; transition: 0.3s;
  &:hover { border-color: #7b2cbf; }
`;
const PreviewGrid = styled.div` display: flex; flex-wrap: wrap; gap: 8px; width: 100%; `;
const PreviewThumb = styled.div`
  position: relative; width: 80px; height: 80px; border-radius: 8px; overflow: hidden;
  img { width: 100%; height: 100%; object-fit: cover; }
`;
const RemoveBtn = styled.button`
  position: absolute; top: 2px; right: 2px; width: 20px; height: 20px; border-radius: 50%;
  border: none; background: rgba(0,0,0,0.7); color: white; font-size: 13px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  &:hover { background: #ff6b6b; }
`;
const AddMoreBtn = styled.div`
  width: 80px; height: 80px; border-radius: 8px; border: 2px dashed rgba(255,255,255,0.2);
  display: flex; align-items: center; justify-content: center; font-size: 12px; color: rgba(255,255,255,0.4);
`;
const SubmitButton = styled.button`
  padding: 16px; border-radius: 14px; border: none;
  background: linear-gradient(135deg, #7b2cbf, #ff85a1);
  color: white; font-size: 17px; font-weight: 700; cursor: pointer; transition: all 0.3s;
  &:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(123,44,191,0.4); }
  &:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
`;
const ErrorMsg = styled.p` color: #ff6b6b; font-size: 14px; text-align: center; margin: 0; `;
const SubCategoryRow = styled.div` display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 4px; `;
const SubCategoryChip = styled.button<{ $active: boolean }>`
  padding: 8px 20px; border-radius: 50px; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s;
  border: 1px solid ${p => p.$active ? '#7b2cbf' : 'rgba(255,255,255,0.2)'};
  background: ${p => p.$active ? 'rgba(123,44,191,0.3)' : 'transparent'};
  color: ${p => p.$active ? '#d8b4fe' : 'rgba(255,255,255,0.5)'};
  &:hover { border-color: #7b2cbf; color: #d8b4fe; }
`;