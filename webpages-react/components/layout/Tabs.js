import React, { useContext } from 'react';
import {
  NavLink, Route, Switch, HashRouter as Router, Redirect,
} from 'react-router-dom';
import './Tabs.css';
import OnTabChange from './OnTabChange';
import EditContext from '../metaanalysis/EditContext';

function Tabs(props) {
  const {
    children, displayedCell, setDisplayedCell,
  } = props;
  const edit = useContext(EditContext);
  return (
    <Router hashType="noslash">
      <OnTabChange displayedCell={displayedCell} setDisplayedCell={setDisplayedCell} />
      { /* Creating nav links corresponding to children components */ }
      <nav className="tabs">
        <ul className={`${edit.flag ? 'editMode secondary' : ''}`}>
          {
            React.Children.map(children, (element) => (
              <NavLink activeClassName={`active ${edit.flag ? 'editMode primary' : ''}`} to={element.props.path}>
                <li>
                  { element.props.tabName }
                </li>
              </NavLink>
            ))
          }
        </ul>
      </nav>
      { /* Rendering components */ }
      { /* Thanks to <Switch>, only the first component to match the url is displayed */ }
      <Switch>
        {
          React.Children.map(children, (element) => (
            <Route path={element.props.path}>{ element }</Route>
          ))
        }
        <Redirect exact from="/" to="info" />
      </Switch>
    </Router>
  );
}

export default Tabs;
