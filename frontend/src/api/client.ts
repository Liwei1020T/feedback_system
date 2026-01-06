import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8001";

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: false
});

// Simple token refresh coordination so we only refresh once
let isRefreshing = false;
let queuedResolvers: Array<(token: string | null) => void> = [];

const flushQueue = (token: string | null) => {
  queuedResolvers.forEach((resolve) => resolve(token));
  queuedResolvers = [];
};

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status as number | undefined;
    const original = error?.config ?? {};

    // Never try to refresh for auth endpoints
    const url: string = original?.url || "";
    const isAuthPath = /\/api\/auth\/(login|refresh|logout)/.test(url);

    if (status === 401 && !isAuthPath && !original._retry) {
      const refreshToken = localStorage.getItem("refresh_token");
      if (!refreshToken) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queuedResolvers.push((newToken) => {
            if (!newToken) return reject(error);
            original._retry = true;
            original.headers = original.headers || {};
            original.headers.Authorization = `Bearer ${newToken}`;
            resolve(apiClient(original));
          });
        });
      }

      original._retry = true;
      isRefreshing = true;
      try {
        const { data } = await axios.post(`${API_URL}/api/auth/refresh`, {
          refresh_token: refreshToken,
        });
        const newToken: string | undefined = data?.access_token;
        if (newToken) {
          localStorage.setItem("access_token", newToken);
          flushQueue(newToken);
          original.headers = original.headers || {};
          original.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(original);
        }
      } catch (e) {
        flushQueue(null);
        // Refresh failed — clear stored auth so UI can prompt login
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("auth_user");
        window.dispatchEvent(new Event("auth:logout"));
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
