import axios from 'axios';

// Since we have a rewrite in next.config.ts, we can just use /api
const api = axios.create({
  baseURL: '/api',
});

export const searchDocuments = async (params: any) => {
  const { data } = await api.get('/search', { params });
  return data;
};

export const getSearchSuggestions = async (q: string) => {
  const { data } = await api.get('/search/suggest', { params: { q } });
  return data;
};

export const getDocumentFacets = async () => {
  const { data } = await api.get('/documents/facets/stats');
  return data;
};

export const getDocumentDetails = async (id: string) => {
  const { data } = await api.get(`/documents/${id}`);
  return data;
};

export const getDocumentRelations = async (id: string) => {
  const { data } = await api.get(`/documents/${id}/relations`);
  return data;
};
