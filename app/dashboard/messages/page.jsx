"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { initSocket } from "../../../lib/socket";
import api from "@/services/api";

// Skeleton Loading Components
const SidebarSkeleton = () => (
  <div className="w-1/3 border-r bg-gray-50">
    <div className="p-4 border-b bg-white">
      <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
      <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
    </div>
    <div className="overflow-y-auto h-full p-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="mb-4 p-4 bg-white rounded-lg border">
          <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse mb-3"></div>
          <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="flex justify-between mt-3">
            <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ChatHeaderSkeleton = () => (
  <div className="p-4 border-b bg-white">
    <div className="flex justify-between items-center">
      <div>
        <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-2"></div>
        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
      </div>
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </div>
  </div>
);

const MessageSkeleton = () => (
  <div className="mb-4">
    <div className="flex items-start space-x-3">
      <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse flex-shrink-0"></div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline space-x-2 mb-2">
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-1"></div>
        <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </div>
  </div>
);

const ChatAreaSkeleton = () => (
  <div className="flex-1 flex flex-col">
    <ChatHeaderSkeleton />
    <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <MessageSkeleton key={i} />
      ))}
    </div>
    <div className="p-4 border-t bg-white">
      <div className="flex space-x-2">
        <div className="flex-1 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
        <div className="w-20 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
      </div>
    </div>
  </div>
);

const EmptyChatSkeleton = () => (
  <div className="flex-1 flex flex-col">
    <ChatHeaderSkeleton />
    <div className="flex-1 flex items-center justify-center text-gray-500">
      <div className="text-center">
        <div className="text-6xl mb-4">💬</div>
        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mx-auto mb-2"></div>
        <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mx-auto"></div>
      </div>
    </div>
  </div>
);

const getRelativeTime = (date) => {
  const now = new Date();
  const messageDate = new Date(date);
  const diffInSeconds = Math.floor((now - messageDate) / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInSeconds < 60) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return messageDate.toLocaleDateString([], { month: "short", day: "numeric" });
};
export default function MessagesPage() {
  const router = useRouter();
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("chat");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const messagesEndRef = useRef(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const activeGroupRef = useRef(activeGroup);
  const [unreadCounts, setUnreadCounts] = useState({});
  const socketRef = useRef(null);

  // New state for skeleton loading
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Check authentication on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("auth_token");
    const userDataStr = localStorage.getItem("user");

    if (!token || !userDataStr) {
      console.error("No auth token or user data found");
      router.push("/auth/login");
      return;
    }

    try {
      const userData = JSON.parse(userDataStr);
      if (!userData || !userData.id) {
        console.error("Invalid user data");
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user");
        router.push("/auth/login");
        return;
      }
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Error parsing user data:", error);
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
      router.push("/auth/login");
      return;
    } finally {
      setAuthChecking(false);
    }
  }, [router]);

  // Keep activeGroupRef in sync
  useEffect(() => {
    activeGroupRef.current = activeGroup;
  }, [activeGroup]);

  // Initialize socket and load data after authentication
  useEffect(() => {
    if (!isAuthenticated || typeof window === "undefined") return;

    const loadInitialData = async () => {
      try {
        setGroupsLoading(true);
        await Promise.all([loadNotifications(), loadGroups()]);
      } catch (error) {
        console.error("Error loading initial data:", error);
      } finally {
        setGroupsLoading(false);
        setInitialLoading(false);
      }
    };

    const token = localStorage.getItem("auth_token");
    const userDataStr = localStorage.getItem("user");

    if (!token || !userDataStr) return;

    let userData;
    try {
      userData = JSON.parse(userDataStr);
    } catch (error) {
      console.error("Error parsing user data:", error);
      return;
    }

    const socketInstance = initSocket(token);
    socketRef.current = socketInstance;
    setSocket(socketInstance);

    socketInstance.on("connect", () => {
      console.log("✅ Socket connected");
      setSocketConnected(true);

      if (activeGroupRef.current) {
        console.log(
          "🔄 Rejoining group after reconnect:",
          activeGroupRef.current
        );
        socketInstance.emit("join_group", { groupId: activeGroupRef.current });
      }
    });

    socketInstance.on("disconnect", () => {
      console.log("❌ Socket disconnected");
      setSocketConnected(false);
    });

    loadInitialData();

    // Socket event listeners
    socketInstance.on("notification", (notification) => {
      console.log("New notification received:", notification);
      setNotifications((prev) => [notification, ...prev]);
    });

    socketInstance.on("added_to_group", ({ group }) => {
      console.log("Added to new group:", group);
      setGroups((prev) => [...prev, group]);
    });

    socketInstance.on("message", (message) => {
      console.log("💬 New message received:", message);

      const userDataStr = localStorage.getItem("user");
      const currentUser = userDataStr ? JSON.parse(userDataStr) : {};

      // Convert all IDs to strings for comparison
      const currentUserId = String(currentUser.id);
      const messageSenderId = String(message.sender?._id || message.sender);
      const messageGroupId = String(message.group);
      const currentActiveGroupId = String(activeGroupRef.current);

      const isMyMessage = messageSenderId === currentUserId;
      const isActiveGroup = messageGroupId === currentActiveGroupId;

      console.log("🔍 Current User:", currentUserId);
      console.log("🔍 Message Sender:", messageSenderId);
      console.log("🔍 Is My Message:", isMyMessage);
      console.log("🔍 Is Active Group:", isActiveGroup);

      // Add to UI if it's the active group
      if (isActiveGroup) {
        console.log("✅ Adding to active chat");
        setMessages((prev) => [...prev, message]);
      }
      // Increment unread ONLY if: not active group AND not my message
      else if (!isMyMessage) {
        console.log("📬 Incrementing unread for group:", messageGroupId);
        setUnreadCounts((prev) => ({
          ...prev,
          [messageGroupId]: (prev[messageGroupId] || 0) + 1,
        }));
      } else {
        console.log("⏭️ Skipping - my message in different group");
      }

      // Update group's last message
      setGroups((prev) =>
        prev.map((g) =>
          String(g._id) === messageGroupId
            ? { ...g, lastMessage: message.text, updatedAt: message.createdAt }
            : g
        )
      );
    });

    socketInstance.on("joined_group", ({ groupId }) => {
      console.log("✅ Successfully joined group:", groupId);
    });

    socketInstance.on("error", (error) => {
      console.error("Socket error:", error);
    });

    socketInstance.emit("identify", { userId: userData.id });

    return () => {
      socketInstance.off("connect");
      socketInstance.off("disconnect");
      socketInstance.off("notification");
      socketInstance.off("added_to_group");
      socketInstance.off("message");
      socketInstance.off("error");
      socketInstance.disconnect();
    };
  }, [isAuthenticated]);

  useEffect(() => {
    const totalUnread = Object.values(unreadCounts).reduce(
      (sum, count) => sum + count,
      0
    );
    localStorage.setItem("unread_messages_count", totalUnread.toString());
    window.dispatchEvent(new Event("unreadCountChanged"));
  }, [unreadCounts]);

  const loadNotifications = async () => {
    try {
      const data = await api.notifications.getAll();
      setNotifications(data);
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  };

  const loadGroups = async () => {
    try {
      const data = await api.chat.getGroups();

      const groupsWithMessages = await Promise.all(
        data.map(async (group) => {
          try {
            const messages = await api.chat.getMessages(group._id, 1);
            if (messages.length > 0) {
              return {
                ...group,
                lastMessage: messages[0].text,
                updatedAt: messages[0].createdAt,
              };
            }
            return group;
          } catch (error) {
            console.error(
              `Error loading messages for group ${group._id}:`,
              error
            );
            return group;
          }
        })
      );

      setGroups(groupsWithMessages);
    } catch (error) {
      console.error("Error loading groups:", error);
    }
  };

  const loadMessages = async (groupId) => {
    setLoading(true);
    try {
      const data = await api.chat.getMessages(groupId, 100);
      setMessages(data);

      setUnreadCounts((prev) => {
        const newCounts = { ...prev };
        delete newCounts[groupId];
        return newCounts;
      });

      if (data.length > 0) {
        const lastMsg = data[data.length - 1];
        setGroups((prev) =>
          prev.map((g) =>
            g._id === groupId
              ? {
                  ...g,
                  lastMessage: lastMsg.text,
                  updatedAt: lastMsg.createdAt,
                }
              : g
          )
        );
      }
      setActiveGroup(groupId);
      if (socket?.connected) {
        console.log("🔵 Joining group via socket:", groupId);
        socket.emit("join_group", { groupId });
      } else {
        console.warn("⚠️ Socket not connected yet. Will join on connect.");
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeGroup) return;

    const messageText = newMessage.trim();
    setNewMessage("");

    try {
      if (socket && socket.connected) {
        const userDataStr = localStorage.getItem("user");
        if (!userDataStr) return;

        let userData;
        try {
          userData = JSON.parse(userDataStr);
        } catch (error) {
          console.error("Error parsing user data:", error);
          return;
        }

        console.log("Sending message via socket");
        socket.emit("send_message", {
          groupId: activeGroup,
          text: messageText,
          senderId: userData.id,
        });
      } else {
        console.warn("Socket not connected, using HTTP fallback");
        const sentMessage = await api.chat.sendMessage(activeGroup, {
          text: messageText,
        });
        setMessages((prev) => [...prev, sentMessage]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setNewMessage(messageText);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.notifications.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error("Error marking as read:", error);
      if (error.message.includes("401")) {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user");
        router.push("/auth/login");
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Show full page skeleton while checking authentication
  if (authChecking) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="flex h-[600px]">
              <SidebarSkeleton />
              <ChatAreaSkeleton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Show skeleton for initial data loading
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="flex h-[600px]">
              <SidebarSkeleton />
              <EmptyChatSkeleton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600">Communicate with your case teams</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="flex h-[600px]">
            {/* Groups Sidebar */}
            {groupsLoading ? (
              <SidebarSkeleton />
            ) : (
              <div className="w-1/3 border-r bg-gray-50">
                <div className="p-4 border-b bg-white">
                  <h2 className="text-lg font-semibold">Case Groups</h2>
                  <p className="text-sm text-gray-600">
                    {groups.length} group(s)
                  </p>
                  {/* DEBUG - Remove after testing */}
                  <div className="text-xs text-red-600 mt-2 font-mono">
                    Unread: {JSON.stringify(unreadCounts)}
                  </div>
                </div>

                <div className="overflow-y-auto h-full">
                  {groups.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      No chat groups yet. Create a case to get started.
                    </div>
                  ) : (
                    groups.map((group) => (
                      <div
                        key={group._id}
                        className={`p-4 border-b cursor-pointer transition-colors ${
                          activeGroup === group._id
                            ? "bg-blue-50 border-blue-200"
                            : "bg-white hover:bg-gray-50"
                        }`}
                        onClick={() => loadMessages(group._id)}
                      >
                        <h3 className="font-semibold text-gray-900">
                          {group.name}
                        </h3>
                        <p
                          className={`text-sm truncate mt-1 ${
                            unreadCounts[group._id] > 0
                              ? "font-black text-gray-900"
                              : "text-gray-600"
                          }`}
                        >
                          {group.lastMessage || "No messages yet"}
                        </p>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs text-gray-500">
                            {group.members?.length || 0} members
                          </span>
                          <div className="flex items-center space-x-2">
                            {unreadCounts[group._id] > 0 && (
                              <span className="bg-red-600 text-white text-xs font-bold rounded-full min-w-[22px] h-5 flex items-center justify-center px-2">
                                {unreadCounts[group._id]}
                              </span>
                            )}
                            <span
                              className={`text-xs ${
                                unreadCounts[group._id]
                                  ? "font-semibold text-blue-600"
                                  : "text-gray-400"
                              }`}
                            >
                              {getRelativeTime(group.updatedAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Chat Area */}
            {loading ? (
              <ChatAreaSkeleton />
            ) : activeGroup ? (
              <div className="flex-1 flex flex-col">
                {/* Chat Header */}
                <div className="p-4 border-b bg-white">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold">
                        {groups.find((g) => g._id === activeGroup)?.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Case discussion group
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          socketConnected ? "bg-green-500" : "bg-red-500"
                        }`}
                      ></div>
                      <span className="text-xs text-gray-500">
                        {socketConnected ? "Connected" : "Disconnected"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 mt-8">
                      No messages yet. Start the conversation!
                    </div>
                  ) : (
                    messages.map((message) => {
                      const currentUser = JSON.parse(
                        localStorage.getItem("user") || "{}"
                      );
                      const isCurrentUser =
                        message.sender?._id === currentUser.id ||
                        message.sender === currentUser.id;

                      return (
                        <div
                          key={message._id}
                          className={`mb-4 flex ${
                            isCurrentUser ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`flex items-start space-x-3 max-w-[70%] ${
                              isCurrentUser
                                ? "flex-row-reverse space-x-reverse"
                                : ""
                            }`}
                          >
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0 ${
                                isCurrentUser ? "bg-blue-500" : "bg-gray-500"
                              }`}
                            >
                              {message.sender?.name?.charAt(0)?.toUpperCase() ||
                                "U"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div
                                className={`rounded-lg p-3 ${
                                  isCurrentUser
                                    ? "bg-blue-500 text-white"
                                    : "bg-white border border-gray-200"
                                }`}
                              >
                                {!isCurrentUser && (
                                  <div className="font-semibold text-sm mb-1">
                                    {message.sender?.name || "Unknown User"}
                                  </div>
                                )}
                                <p className="whitespace-pre-wrap break-words">
                                  {message.text}
                                </p>
                                <div
                                  className={`text-xs mt-1 ${
                                    isCurrentUser
                                      ? "text-blue-100"
                                      : "text-gray-500"
                                  }`}
                                >
                                  {new Date(
                                    message.createdAt
                                  ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
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
              </div>
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
    </div>
  );
}
