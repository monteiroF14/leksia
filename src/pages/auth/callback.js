/** @type {import('astro').APIRoute} */
export const prerender = false;

function generateToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/** @type {import('astro').APIRoute} */
export const GET = async ({ url, cookies, redirect }) => {
  const code = url.searchParams.get('code');
  
  if (!code) {
    return redirect('/?error=no_code');
  }

  const clientId = import.meta.env.GITHUB_CLIENT_ID;
  const clientSecret = import.meta.env.GITHUB_CLIENT_SECRET;
  const redirectUri = `${url.origin}/auth/callback`;

  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });

  /** @type {{ access_token?: string; error?: string }} */
  const tokenData = await tokenResponse.json();

  if (tokenData.error || !tokenData.access_token) {
    return redirect('/?error=token_exchange_failed');
  }

  const accessToken = tokenData.access_token;

  const userResponse = await fetch('https://api.github.com/user', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
  });

  /** @type {{ id: number; login: string; email?: string; avatar_url?: string }} */
  const userData = await userResponse.json();

  const sessionToken = generateToken();
  
  const user = {
    githubId: userData.id,
    username: userData.login,
    email: userData.email || `${userData.login}@github.com`,
    avatarUrl: userData.avatar_url,
    sessionToken: sessionToken,
  };

  const dbResponse = await fetch('http://localhost:3000/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(user),
  });

  const dbText = await dbResponse.text();
  
  if (!dbResponse.ok) {
    console.error('Failed to save user to db:', dbText);
    return redirect('/?error=db_save_failed');
  }

  cookies.set('session_token', sessionToken, {
    path: '/',
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
  });

  return redirect('/?logged_in=true');
};
