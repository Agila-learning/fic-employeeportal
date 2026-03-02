const VERCEL_HOST_SUFFIX = "vercel.app";

const isVercelDeployment = () => {
  if (typeof window === "undefined") return false;
  return window.location.hostname.endsWith(VERCEL_HOST_SUFFIX);
};

const buildProxiedTokenUrl = (requestUrl: string) => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  if (!supabaseUrl || !requestUrl.startsWith(supabaseUrl)) return null;
  if (!requestUrl.includes("/auth/v1/token")) return null;

  const pathWithQuery = requestUrl.slice(supabaseUrl.length).replace(/^\/+/, "");
  return `${window.location.origin}/api/lovable-cloud/${pathWithQuery}`;
};

export const installAuthTokenProxyFetch = () => {
  if (!isVercelDeployment()) return;

  const windowWithFlag = window as Window & { __authTokenProxyInstalled?: boolean };
  if (windowWithFlag.__authTokenProxyInstalled) return;

  const nativeFetch = window.fetch.bind(window);

  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const requestUrl =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

    const proxiedUrl = buildProxiedTokenUrl(requestUrl);

    if (!proxiedUrl) {
      return nativeFetch(input as RequestInfo, init);
    }

    if (input instanceof Request) {
      return nativeFetch(new Request(proxiedUrl, input));
    }

    return nativeFetch(proxiedUrl, init);
  };

  windowWithFlag.__authTokenProxyInstalled = true;
};
