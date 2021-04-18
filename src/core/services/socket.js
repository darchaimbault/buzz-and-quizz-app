import io from 'socket.io-client';

const SOCKET_URL = 'http://192.168.1.15:8085';

const configSocket = {
  withCredentials: true,
  autoConnect: false
};

export const socket = io(SOCKET_URL, configSocket);