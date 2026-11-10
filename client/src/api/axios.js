import axios from "axios";

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "/api" });

// Hama request ekakatama token eka auto ekathu karanawa
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Token eka expire wela / waradi nam login page ekata yawanawa
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && localStorage.getItem("token")) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// Backend eke error message eka ganna helper eka
export const getErrorMessage = (err) =>
  err.response?.data?.message || "Something went wrong. Please try again.";

export default api;