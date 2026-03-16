/** @type {import('astro').APIRoute} */
export const prerender = false;

/** @type {import('astro').APIRoute} */
export const GET = async ({ redirect, url }) => {
  const clientId = import.meta.env.GITHUB_CLIENT_ID;
  const redirectUri = `${url.origin}/auth/callback`;
  
  const githubAuthUrl = new URL('https://github.com/login/oauth/authorize');
  githubAuthUrl.searchParams.set('client_id', clientId);
  githubAuthUrl.searchParams.set('redirect_uri', redirectUri);
  githubAuthUrl.searchParams.set('scope', 'read:user');
  
  return redirect(githubAuthUrl.toString());
};
