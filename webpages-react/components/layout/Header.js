import React, { useContext } from 'react';
import './Header.css';
import EditContext from '../metaanalysis/EditContext';
import { SignInButton, SignOutButton } from '../../tools/google-auth';

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

  if (currentUser) {
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
          <span
            id="toggle-editing"
            role="menuitem"
            tabIndex="0"
            onClick={edit.toggle}
            onKeyPress={edit.toggle}
          >
            { edit.flag ? 'Stop editing' : 'Edit' }
          </span>
          <SignOutButton />
        </div>
      </div>
    );
  } else {
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
