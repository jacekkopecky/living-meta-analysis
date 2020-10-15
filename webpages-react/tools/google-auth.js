import React, { useEffect, useState } from 'react';

const CLIENT_ID = '186190585645-38o2mpd18bd53km7rbpnp1rb9gg9d5sg.apps.googleusercontent.com';

export function SignInButton() {
  const gapi = window.gapi;
  useEffect(() => {
    gapi.load('auth2', async () => {
      await gapi.auth2.init({ client_id: CLIENT_ID });
      window.gapi.signin2.render('gbutton');
    });
  });
  return <div id="gbutton" />;
}

export function SignOutButton() {
  return (
    <span
      role="menuitem"
      tabIndex="0"
      className="signout"
      onClick={signOut}
      onKeyPress={signOut}
    >
      Sign out
    </span>
  );
}

function signOut() {
  window.gapi.auth2.getAuthInstance().signOut();
}

export default function useGoogleAuth() {
  const { gapi, lima } = window;
  const _ = lima._;

  const [currentUser, setUser] = useState(null);

  const onSignIn = async (googleUser) => {
    if (!googleUser.isSignedIn()) {
      setUser(null);
      return;
    }

    if (window.location.pathname !== '/register') {
      const idToken = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;
      const res = await fetch('/api/user', {
        method: 'GET',
        headers: _.idTokenToFetchHeaders(idToken),
      });
      if (res.status === 401) {
        // user isn't known but someone is signed in. Save locally and then redirect to register.
        // todo save locally
        window.location.href = '/register';
        return;
      } else if (res.status >= 400) {
        // an unexpected error happened with /api/user, server not happy
        // todo error handling
        return;
      }

      const user = await _.fetchJson(res);

      if (!user) return;
      setUser(user);
    }
  };

  useEffect(() => {
    gapi.load('auth2', async () => {
      await gapi.auth2.init({ client_id: CLIENT_ID });

      const gauth = await gapi.auth2.getAuthInstance();
      gauth.currentUser.listen(onSignIn);
      if (gauth.isSignedIn.get()) onSignIn(gauth.currentUser.get());
    });
  }, []);

  return [currentUser];
}
