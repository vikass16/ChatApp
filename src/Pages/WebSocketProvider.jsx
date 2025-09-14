import React, { useEffect, useRef } from 'react';
import { connectWebSocket, disconnectWebSocket } from '../services/WebsocketClient';
import {authService} from '../services/authService';

const WebSocketProvider = ({ children }) => {
  const stompClientRef = useRef(null);
  const currentUser  = authService.getCurrentuser ()?.username;
  const token = localStorage.getItem('jwtToken');

  useEffect(() => {
    if (currentUser  && token) {
      stompClientRef.current = connectWebSocket(token, currentUser );
    }

    return () => {
      disconnectWebSocket();
    };
  }, [currentUser , token]);

  return <>{children}</>;
};

export default WebSocketProvider;
