import type { AxiosAdapter, AxiosResponse, AxiosRequestConfig } from 'axios';

import axios from 'axios';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

const localMockAdapter: AxiosAdapter = async (config): Promise<AxiosResponse> => {
  const url = config.url ?? '';
  const data =
    (url.includes('/api/product/list') && { products: [] }) ||
    (url.includes('/api/product/details') && { product: null }) ||
    (url.includes('/api/product/search') && { results: [] }) ||
    (url.includes('/api/post/list') && { posts: [] }) ||
    (url.includes('/api/post/details') && { post: null }) ||
    (url.includes('/api/post/latest') && { latestPosts: [] }) ||
    (url.includes('/api/post/search') && { results: [] }) ||
    {};

  return {
    data,
    config,
    status: 200,
    headers: {},
    statusText: 'OK',
  };
};

const axiosInstance = axios.create({
  baseURL: CONFIG.serverUrl || 'http://localhost',
  adapter: CONFIG.serverUrl ? undefined : localMockAdapter,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Optional: Add token (if using auth)
 *
 axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
*
*/

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error?.response?.data?.message || error?.message || 'Something went wrong!';
    console.error('Axios error:', message);
    return Promise.reject(new Error(message));
  }
);

export default axiosInstance;

// ----------------------------------------------------------------------

export const fetcher = async <T = unknown>(
  args: string | [string, AxiosRequestConfig]
): Promise<T> => {
  try {
    const [url, config] = Array.isArray(args) ? args : [args, {}];

    const res = await axiosInstance.get<T>(url, config);

    return res.data;
  } catch (error) {
    console.error('Fetcher failed:', error);
    throw error;
  }
};

// ----------------------------------------------------------------------

export const endpoints = {
  chat: '/api/chat',
  kanban: '/api/kanban',
  calendar: '/api/calendar',
  auth: {
    me: '/api/auth/me',
    signIn: '/api/auth/sign-in',
    signUp: '/api/auth/sign-up',
  },
  mail: {
    list: '/api/mail/list',
    details: '/api/mail/details',
    labels: '/api/mail/labels',
  },
  post: {
    list: '/api/post/list',
    details: '/api/post/details',
    latest: '/api/post/latest',
    search: '/api/post/search',
  },
  product: {
    list: '/api/product/list',
    details: '/api/product/details',
    search: '/api/product/search',
  },
} as const;
