const API_URL = 'https://artifact.mirim-it-show.site';

const fetchAPI = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  return res.json();
};

// ── 회원 API ──
export const authAPI = {
  checkUsername: (username: string) => fetchAPI(`/api/check-username/${username}`),
  register: (data: { username: string; password: string; nickname: string; email: string }) =>
    fetchAPI('/api/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: { username: string; password: string }) =>
    fetchAPI('/api/login', { method: 'POST', body: JSON.stringify(data) }),
  me: () => fetchAPI('/api/me'),
  withdraw: () => fetchAPI('/api/me', { method: 'DELETE' }),
};

// ── 포트폴리오 API ──
export const portfolioAPI = {
  getAll: (category?: string, sort?: string, search?: string) =>
    fetchAPI(`/api/portfolios?${new URLSearchParams({ ...(category ? { category } : {}), ...(sort ? { sort } : {}), ...(search ? { search } : {}) })}`),
  search: (q: string) =>
    fetchAPI(`/api/portfolios?${new URLSearchParams({ search: q })}`),
  getOne: (id: number) => fetchAPI(`/api/portfolios/${id}`),
  getMyPortfolios: () => fetchAPI('/api/my/portfolios'),
  create: (formData: FormData) => {
    const token = localStorage.getItem('token');
    return fetch(`${API_URL}/api/portfolios`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    }).then(res => res.json());
  },
  update: (id: number, formData: FormData) => {
    const token = localStorage.getItem('token');
    return fetch(`${API_URL}/api/portfolios/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    }).then(res => res.json());
  },
  delete: (id: number) => fetchAPI(`/api/portfolios/${id}`, { method: 'DELETE' }),
};

// ── 좋아요 API ──
export const likeAPI = {
  toggle: (portfolioId: number) =>
    fetchAPI(`/api/portfolios/${portfolioId}/like`, { method: 'POST' }),
  getStatus: (portfolioId: number) =>
    fetchAPI(`/api/portfolios/${portfolioId}/like`),
};

// ── 댓글 API ──
export const commentAPI = {
  getAll: (portfolioId: number) =>
    fetchAPI(`/api/portfolios/${portfolioId}/comments`),
  create: (portfolioId: number, content: string) =>
    fetchAPI(`/api/portfolios/${portfolioId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
  delete: (commentId: number) =>
    fetchAPI(`/api/comments/${commentId}`, { method: 'DELETE' }),
};