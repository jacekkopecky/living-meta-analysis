import React from 'react';
import {
  NavLink, Route, Switch, HashRouter as Router,
} from 'react-router-dom';
import './Tabs.css';

function Tabs(props) {
  const { children } = props;
  return (
    <div>
      <Router hashType="noslash">
        {/* Creating nav links corresponding to children components */}
        <nav className="tabs">
          <ul>
            {React.Children.map(children, (element) => (
              <NavLink activeClassName="active" to={element.props.path}>
                <li>
                  {element.props.tabName}
                </li>
              </NavLink>
            ))}
          </ul>
        </nav>
        {/* Rendering components */}
        {/* Thanks to <Switch>, only the first component to match the url is displayed */}
        <Switch>
          {React.Children.map(children, (element) => (
            <Route path={element.props.path}>{element}</Route>
          ))}
          ;
        </Switch>
      </Router>
    </div>
  );
}

export default Tabs;
