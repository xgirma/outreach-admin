import React from 'react';
import { Switch, Route } from 'react-router-dom';
import Application from '../application';
import PrivateRoute from './private-route';
import SigninForm from '../containers/signin';
import Home from '../containers/home';
import Information from '../containers/information';
import Introduction from '../containers/introduction';
import { Account, Blog, Events, Media, Services } from '../components';

const Routes = () => (
  <Application>
    <Switch>
      <PrivateRoute exact path="/home" component={Home} />
      <PrivateRoute exact path="/account" component={Account} />
      <PrivateRoute exact path="/blog" component={Blog} />
      <PrivateRoute exact path="/events" component={Events} />
      <PrivateRoute exact path="/information" component={Information} />
      <PrivateRoute exact path="/introduction" component={Introduction} />
      <PrivateRoute exact path="/media" component={Media} />
      <PrivateRoute exact path="/services" component={Services} />
      <PrivateRoute exact path="/" component={Home} />
      <Route exact path="/signin" component={SigninForm} />
    </Switch>
  </Application>
);

export default Routes;
