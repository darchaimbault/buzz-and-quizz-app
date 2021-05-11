import io from 'socket.io-client';

/*eslint-disable no-eval */
const apiHost = process.env.REACT_APP_API_HOST.includes('window') ? eval(process.env.REACT_APP_API_HOST) : process.env.REACT_APP_API_HOST;

const SOCKET_URL = 'http://' + apiHost + ':' + process.env.REACT_APP_API_PORT;

const configSocket = {
  withCredentials: true,
  autoConnect: false
};

export const socket = io(SOCKET_URL, configSocket);