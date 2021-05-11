import React from 'react';
import ReactDOM from 'react-dom';
import './index.scss';
import App from './App';
import reportWebVitals from './reportWebVitals';
import axios from 'axios';
import dotenv from 'dotenv';

import 'primereact/resources/themes/saga-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css';

dotenv.config();

/*eslint-disable no-eval */
const apiHost = process.env.REACT_APP_API_HOST.includes('window') ? eval(process.env.REACT_APP_API_HOST) : process.env.REACT_APP_API_HOST;

axios.defaults.baseURL = 'http://' + apiHost + ':' + process.env.REACT_APP_API_PORT + '/api';
axios.defaults.withCredentials = true;

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
