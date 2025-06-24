import { ApiError } from '@/types/api.types';
import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';

axios.defaults.withCredentials = true;
import { getAccessToken } from '@/helpers/get-access-token';

const { accessToken, logout } = getAccessToken();
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL!,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = typeof window !== 'undefined' ? accessToken : null;
    console.log(token);

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `🚀 ${config.method?.toUpperCase()} ${config.url}`,
        config.data
      );
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// intercepteur pour les reponses

api.interceptors.response.use(
  (response: AxiosResponse) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `🚀 ${response.config.method?.toUpperCase()} ${response.config.url}`,
        response.data
      );
    }
    return response;
  },
  (error: AxiosError) => {
    const apiError: ApiError = {
      message: 'Une erreur est survenue',
      status: error.response?.status || 500,
    };

    if (error.response?.data) {
      const data = error.response?.data as Record<string, unknown>;
      apiError.message =
        (data as { message?: string; error?: string }).message ||
        (data as { error?: string }).error ||
        apiError.message;
      const errors = (data as { errors?: unknown }).errors;
      apiError.errors =
        errors && typeof errors === 'object' && !Array.isArray(errors)
          ? (errors as Record<string, string[]>)
          : undefined;
    }

    // Gestion des erreurs d'authentification
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        logout();
        // window.location.href = '/unauthorized';
      }
    }
    if (process.env.NODE_ENV === 'development') {
      console.error(
        `❌ ${error.response?.status} ${error.config?.url}`,
        apiError
      );
    }

    return Promise.reject(apiError);
  }
);
