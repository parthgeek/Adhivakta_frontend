"use client"
import { useEffect } from 'react';
import { initSocket } from '../';

export default function MessagesPage() {
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const socket = initSocket(token);

    socket.on('message', msg => {
      // append message to UI
    });

    socket.on('added_to_group', ({ group }) => {
      // refresh groups list
    });

    return () => {
      // cleanup listeners if needed
      socket.off('message');
      socket.off('added_to_group');
    };
  }, []);
}
