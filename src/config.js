export const API_BASE =
  import.meta.env.DEV
    ? "/api"
    : import.meta.env.VITE_API_BASE || "https://drawdownlabsfinal.onrender.com/api";
