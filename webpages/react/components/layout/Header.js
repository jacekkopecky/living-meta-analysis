import React, { useEffect } from 'react';
import './Header.css';


function Header() {
  const CLIENT_ID = '358237292980-kbme56c9ih4rpmob16sq8bjig5dms6pl.apps.googleusercontent.com';
  const { gapi, lima } = window;
  const { _ } = lima;
  function onSignIn(googleUser) {
    let username;
    let photo;
    if (!googleUser.isSignedIn()) {
      _.removeClass('body', 'signed-on');
      return;
    }

    // check if we should redirect to the /register page - if LiMA doesn't know the user who has just logged in
    // if the user has canceled registration by leaving the page, we will sign them out
    if (window.location.pathname !== '/register') {
      const idToken = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;
      fetch('https://lima.soc.port.ac.uk/api/user', {
        method: 'GET',
        headers: _.idTokenToFetchHeaders(idToken),
      })
        .then((res) => {
          if (res.status === 401) {
            // user isn't known but someone is signed in. Save and then redirect to register.
            // window.location.href = '/register';
          } else if (res.status >= 400) {
            // an unexpected error happened with /api/user, server not happy
            _.apiFail();
          } else {
            return _.fetchJson(res);
          }
        })
        .then((user) => {
          if (!user) return;

          username = user.username || user.email;
          photo = user.photos[0].value;
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }
  useEffect(() => {
    gapi.load('auth2', () => {
      gapi.auth2.init({ client_id: CLIENT_ID });
      gapi.signin2.render('gbutton');
      gapi.auth2.getAuthInstance().then(
        (gauth) => {
          gauth.currentUser.listen(onSignIn);
          // add signout button event
          if (gauth.isSignedIn.get()) onSignIn(gauth.currentUser.get());
          try {
            if (lima.initPage) lima.initPage();
          } catch (e) {
            console.error(e);
            _.apiFail();
          }
        },
        (err) => {
          console.log('failed getting gapi auth instance');
          console.log(err);
        },
      );
    });
  }, []);

  // Displays header and handles google auth connexion
  return (
    <header>
      <a href="/" id="logo-box">
        <h1>LiMA</h1>
        <h2>Living Meta-Analysis</h2>
      </a>
      <div className="userinfo signedoff">
        {/* <img src="./user.png" alt="user" className="userphoto" /> */}
        <div className="actions">
          <div className="name when-signed-on">
            {/* Signed in as: */}
            <span className="username" />
          </div>
          <div id="gbutton" />
          <a href="/profile" className="profile when-signed-on">Profile</a>
          <a href="/" id="toggle-editing" className="only-if-page-about-you">
            {/* Turn editing */}
            {/* <span className="ifon">off</span>
            <span className="ifoff">on</span> */}
          </a>
          {/* <a className="signout when-signed-on">Sign out</a> */}
        </div>
      </div>
    </header>
  );
}

export default Header;
