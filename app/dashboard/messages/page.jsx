// app/dashboard/messages/page.jsx
"use client";
import { useEffect, useState, useRef } from 'react';
import { initSocket } from '../../../lib/socket';

export default function MessagesPage() {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('chat'); // 'chat' or 'notifications'
  const messagesEndRef = useRef(null);
if (typeof window === "undefined") return;
useEffect(() => {
  if (typeof window === "undefined") return;

  const token = localStorage.getItem('auth_token');
  const userData = JSON.parse(localStorage.getItem('user_data'));
  
  if (!token || !userData) {
    console.error('No auth token or user data found');
    return;
  }
  
  

    const socket = initSocket(token);
    setSocket(socket);

    // Load initial data
    loadNotifications();
    loadGroups();

    // Socket event listeners
    socket.on('notification', (notification) => {
      console.log('New notification received:', notification);
      setNotifications(prev => [notification, ...prev]);
    });

    socket.on('added_to_group', ({ group }) => {
      console.log('Added to new group:', group);
      setGroups(prev => [...prev, group]);
    });

    socket.on('message', (message) => {
      console.log('New message received:', message);
      if (message.group === activeGroup) {
        setMessages(prev => [...prev, message]);
      }
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Identify user to server
    socket.emit('identify', { userId: userData.id });

    return () => {
      socket.off('notification');
      socket.off('added_to_group');
      socket.off('new_message');
      socket.off('error');
    };
  }, []);

  const loadNotifications = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch notifications');
      
      const data = await response.json();
      if (data.success) {
        setNotifications(data.data);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const loadGroups = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/chat/groups', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch groups');
      
      const data = await response.json();
      if (data.success) {
        setGroups(data.data);
      }
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  };

  const loadMessages = async (groupId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/chat/groups/${groupId}/messages?limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch messages');
      
      const data = await response.json();
      if (data.success) {
        setMessages(data.data);
        setActiveGroup(groupId);
        
        // Join group room for real-time updates
        if (socket) {
          const userData = JSON.parse(localStorage.getItem('user_data'));
          socket.emit('join_group', { groupId });

        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeGroup) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      if (socket && socket.connected) {
        const userData = JSON.parse(localStorage.getItem('user_data'));
socket.emit('send_message', {
  groupId: activeGroup,
  text: messageText,
  senderId: userData.id
});

      } else {
        // Fallback to HTTP API
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`/api/chat/groups/${activeGroup}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ text: messageText })
        });

        if (!response.ok) throw new Error('Failed to send message');
        
        const data = await response.json();
        if (data.success) {
          // Message sent via HTTP, it will come back via socket
          console.log('Message sent via HTTP');
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Optionally show error to user
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('auth_token');
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setNotifications(prev => 
        prev.map(n => 
          n._id === notificationId ? { ...n, read: true } : n
        )
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600">Communicate with your case teams</p>
        </div>

        {/* View Toggle */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setView('chat')}
            className={`px-4 py-2 rounded-lg font-medium ${
              view === 'chat' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white text-gray-700 border hover:bg-gray-50'
            }`}
          >
            Chat
          </button>
          <button
            onClick={() => setView('notifications')}
            className={`px-4 py-2 rounded-lg font-medium ${
              view === 'notifications' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white text-gray-700 border hover:bg-gray-50'
            }`}
          >
            Notifications ({notifications.filter(n => !n.read).length})
          </button>
        </div>

        {view === 'chat' ? (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="flex h-[600px]">
              {/* Groups Sidebar */}
              <div className="w-1/3 border-r bg-gray-50">
                <div className="p-4 border-b bg-white">
                  <h2 className="text-lg font-semibold">Case Groups</h2>
                  <p className="text-sm text-gray-600">
                    {groups.length} group(s)
                  </p>
                </div>
                
                <div className="overflow-y-auto h-full">
                  {groups.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      No chat groups yet. Create a case to get started.
                    </div>
                  ) : (
                    groups.map(group => (
                      <div
                        key={group._id}
                        className={`p-4 border-b cursor-pointer transition-colors ${
                          activeGroup === group._id 
                            ? 'bg-blue-50 border-blue-200' 
                            : 'bg-white hover:bg-gray-50'
                        }`}
                        onClick={() => loadMessages(group._id)}
                      >
                        <h3 className="font-semibold text-gray-900">
                          {group.name}
                        </h3>
                        <p className="text-sm text-gray-600 truncate mt-1">
                          {group.lastMessage || 'No messages yet'}
                        </p>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs text-gray-500">
                            {group.members?.length || 0} members
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(group.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex-1 flex flex-col">
                {activeGroup ? (
                  <>
                    {/* Chat Header */}
                    <div className="p-4 border-b bg-white">
                      <h3 className="font-semibold">
                        {groups.find(g => g._id === activeGroup)?.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Case discussion group
                      </p>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                      {loading ? (
                        <div className="text-center text-gray-500">
                          Loading messages...
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="text-center text-gray-500 mt-8">
                          No messages yet. Start the conversation!
                        </div>
                      ) : (
                        messages.map(message => (
                          <div key={message._id} className="mb-4">
                            <div className="flex items-start space-x-3">
                              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                                {message.sender?.name?.charAt(0)?.toUpperCase() || 'U'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-baseline space-x-2">
                                  <span className="font-semibold text-gray-900">
                                    {message.sender?.name || 'Unknown User'}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(message.createdAt).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                                <p className="text-gray-800 mt-1 whitespace-pre-wrap break-words">
                                  {message.text}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input */}
                    <form onSubmit={sendMessage} className="p-4 border-t bg-white">
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type your message..."
                          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={loading}
                        />
                        <button
                          type="submit"
                          disabled={!newMessage.trim() || loading}
                          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Send
                        </button>
                      </div>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <div className="text-6xl mb-4">💬</div>
                      <h3 className="text-lg font-semibold mb-2">Select a group</h3>
                      <p>Choose a case group from the sidebar to start chatting</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Notifications View */
          <div className="bg-white rounded-lg shadow-lg">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Notifications</h2>
              
              {notifications.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <div className="text-4xl mb-4">🔔</div>
                  <p>No notifications yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map(notification => (
                    <div
                      key={notification._id}
                      className={`p-4 border rounded-lg ${
                        !notification.read 
                          ? 'bg-blue-50 border-blue-200' 
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-gray-800">{notification.message}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification._id)}
                            className="ml-4 text-blue-500 hover:text-blue-700 text-sm font-medium"
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}