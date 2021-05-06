import io from 'socket.io-client';

const SOCKET_URL = 'http://' + window.location.hostname + ':8095';

const configSocket = {
  withCredentials: true,
  autoConnect: false
};

export const socket = io(SOCKET_URL, configSocket);