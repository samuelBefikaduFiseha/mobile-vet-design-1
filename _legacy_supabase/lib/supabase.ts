import { createBrowserClient } from "@supabase/ssr";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

const createDummyClient = (): any => {
  const handler: ProxyHandler<any> = {
    get() {
      return new Proxy(() => {}, handler);
    },
    apply() {
      return Promise.resolve({ data: null, error: null });
    },
  };
  return new Proxy(() => {}, handler);
};

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    if (typeof window === "undefined") {
      return createDummyClient();
    }
    throw new Error(
      `@supabase/ssr: Your project's URL and API key are required to create a Supabase client!\n\n` +
        `Check your Supabase project's API settings to find these values\n\n` +
        `https://supabase.com/dashboard/project/_/settings/api`
    );
  }

  if (typeof window === "undefined") {
    return createDummyClient();
  }

  if (!browserClient) {
    browserClient = createBrowserClient(url, key, {
      cookies: {
        getAll() {
          return document.cookie.split(";").map((cookie) => {
            const [name, ...rest] = cookie.trim().split("=");
            return { name, value: rest.join("=") };
          });
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            let cookie = `${name}=${value}`;
            if (options) {
              if (options.path) cookie += `; path=${options.path}`;
              if (options.maxAge) cookie += `; max-age=${options.maxAge}`;
              if (options.domain) cookie += `; domain=${options.domain}`;
              if (options.secure) cookie += `; secure`;
              if (options.sameSite) cookie += `; samesite=${options.sameSite}`;
            }
            document.cookie = cookie;
          });
        },
      },
    });
  }

  return browserClient;
}
