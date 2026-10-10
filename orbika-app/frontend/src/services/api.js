import axios from "axios";
import { supabase } from "./supabaseClient";

// Todas las llamadas a NUESTRO backend (no a Supabase directamente) pasan
// por aquí, que adjunta automáticamente el token de sesión de Supabase
// Auth como Authorization: Bearer <token> (ver backend/auth.middleware.js).
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
