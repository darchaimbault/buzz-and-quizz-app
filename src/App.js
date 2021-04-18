import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect
} from 'react-router-dom';
import Player from './views/player';
import Monitor from './views/monitor/monitor'
import Admin from './views/admin';
import './App.scss';

function App() {
  return (
    <Router forceRefresh={false}>
      <Switch>
        <Route exact path="/">
          <Redirect to="/player" />
        </Route>

        <Route path="/player">
          <Player />
        </Route>

        <Route path="/monitor">
          <Monitor />
        </Route>

        <Route path="/admin">
          <Admin />
        </Route>
      </Switch>
    </Router>
  );
}

export default App;
