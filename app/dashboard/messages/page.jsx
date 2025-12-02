"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { initSocket } from "../../../lib/socket";
import api from "@/services/api";
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
  // Check authentication on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("auth_token");
    const userDataStr = localStorage.getItem("user"); // ✅ CHANGED: Using "user" instead of "user_data"

    if (!token || !userDataStr) {
      console.error("No auth token or user data found");
      router.push("/auth/login");
      return;
    }

    // Validate user data can be parsed
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

    const token = localStorage.getItem("auth_token");
    const userDataStr = localStorage.getItem("user"); // ✅ CHANGED: Using "user"

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
    // Add these lines:
    socketInstance.on("connect", () => {
      console.log("✅ Socket connected");
      setSocketConnected(true);

      // Rejoin active group if user was in one (for reconnections)
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

    socketInstance.on("disconnect", () => {
      console.log("Socket disconnected");
      setSocketConnected(false);
    });

    // Load initial data
    loadNotifications();
    loadGroups();

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
      console.log("📍 Current active group:", activeGroupRef.current);
      console.log("📍 Message group:", message.group);

      if (String(message.group) === String(activeGroupRef.current)) {
        console.log("✅ Message matches active group, adding to UI");
        setMessages((prev) => [...prev, message]);
      } else {
        console.log("⚠️ Message doesn't match active group, ignoring");
        // Increment unread count for non-active groups
        setUnreadCounts((prev) => ({
          ...prev,
          [message.group]: (prev[message.group] || 0) + 1,
        }));
      }

      // Always update last message in sidebar
      setGroups((prev) =>
        prev.map((g) =>
          g._id === message.group
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

    // Identify user to server
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
  //
  useEffect(() => {
    const totalUnread = Object.values(unreadCounts).reduce(
      (sum, count) => sum + count,
      0
    );
    localStorage.setItem("unread_messages_count", totalUnread.toString());

    // Dispatch event for real-time sidebar update
    window.dispatchEvent(new Event("unreadCountChanged"));
  }, [unreadCounts]);
  //
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

      // Fetch last message for each group
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

      // Clear unread count for this group
      setUnreadCounts((prev) => {
        const newCounts = { ...prev };
        delete newCounts[groupId];
        return newCounts;
      });

      // Update last message in sidebar
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
      setNewMessage(messageText); // Restore message on error
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

  // Show loading state while checking authentication
  if (authChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
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
                      <p className="text-sm text-gray-600 truncate mt-1">
                        {group.lastMessage || "No messages yet"}
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
                    {loading ? (
                      <div className="text-center text-gray-500">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                        Loading messages...
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center text-gray-500 mt-8">
                        No messages yet. Start the conversation!
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div key={message._id} className="mb-4">
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                              {message.sender?.name?.charAt(0)?.toUpperCase() ||
                                "U"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline space-x-2">
                                <span className="font-semibold text-gray-900">
                                  {message.sender?.name || "Unknown User"}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(
                                    message.createdAt
                                  ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
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
                  <form
                    onSubmit={sendMessage}
                    className="p-4 border-t bg-white"
                  >
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
                    <h3 className="text-lg font-semibold mb-2">
                      Select a group
                    </h3>
                    <p>
                      Choose a case group from the sidebar to start chatting
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
