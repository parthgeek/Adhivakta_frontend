"use client";

import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';

export default function NotificationListener({ user }) {
  const socketRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    // Determine userId from passed user object or raw id
    const userId = user?._id || user?.id || user;
    if (!userId) return;

    // Use explicit socket URL env var (do NOT use API_URL if it contains /api)
    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '') || 'http://localhost:5000';

    // Connect to Socket.IO server
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      // Identify user to join their personal room
      socket.emit('identify', { userId: String(userId) });
      console.log('Socket connected, identified as', userId);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    // Listen for notification events
    socket.on('notification', (data) => {
      console.log('Received notification:', data);

      const { title, type, message, link, caseTitle } = data;

      toast.info(
        <div className="cursor-pointer">
          <div className="font-semibold">{title || caseTitle || 'New Notification'}</div>
          <div className="text-sm mt-1">{message}</div>
          {link && <div className="text-xs text-blue-600 mt-1">Click to view →</div>}
        </div>,
        {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          onClick: () => {
            if (link) router.push(link);
          },
        }
      );
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.off('notification');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user, router]);

  return null;
}
