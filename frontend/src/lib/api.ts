export const apiFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers = new Headers(init?.headers);
  
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const newInit: RequestInit = {
    ...init,
    headers,
  };

  const response = await fetch(input, newInit);

  const urlStr = input.toString();
  const isLogin = urlStr.includes("/api/auth/login");
  const isPublicInvoice = urlStr.includes("/api/invoices/public/");

  if (response.status === 401 && !isLogin && !isPublicInvoice) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
  }

  return response;
};
