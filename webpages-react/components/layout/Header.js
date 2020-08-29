import React, { useContext } from 'react';
import './Header.css';
import { SignInButton, SignOutButton } from '../../tools/google-auth';
import EditContext from '../metaanalysis/EditContext';

function Header({ currentUser }) {
  return (
    <header>
      <a href="/" id="logo-box">
        <h1>LiMA</h1>
        <h2>Living Meta-Analysis</h2>
      </a>
      <UserInfo currentUser={currentUser} />
    </header>
  );
}

function UserInfo({ currentUser }) {
  const edit = useContext(EditContext);
  function disableEdit() {
    edit.toggle();
  }
  if (currentUser) {
    // User is signed in
    return (
      <div className="userinfo">
        <img src={currentUser.photos[0].value} alt="user avatar" className="userphoto" />
        <div className="actions">
          <div className="name when-signed-on">
            Signed in as:
            { ' ' }
            { currentUser.username || currentUser.email }
          </div>
          <a href="/profile" className="profile">Profile</a>
          <div role="button" tabIndex={0} onClick={edit.flag ? disableEdit : null} onKeyDown={edit.flag ? disableEdit : null}>
            <SignOutButton />
          </div>
        </div>
      </div>
    );
  } else {
    // User is not signed in
    return (
      <div className="userinfo">
        <img src="/img/user.png" alt="user not logged in" className="userphoto" />
        <div className="actions">
          <SignInButton />
        </div>
      </div>
    );
  }
}

export default Header;
