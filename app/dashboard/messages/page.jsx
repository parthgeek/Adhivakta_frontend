"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { initSocket } from "../../../lib/socket";
import api from "@/services/api";

const toId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value.toString) return value.toString();
  return String(value);
};

const uniqueIds = (values = []) =>
  Array.from(new Set(values.map((value) => toId(value)).filter(Boolean)));

const getStoredUser = () => {
  if (typeof window === "undefined") return {};

  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

const normalizeMessage = (message) => {
  const sender =
    typeof message?.sender === "object" && message?.sender
      ? {
          ...message.sender,
          _id: toId(message.sender._id || message.sender.id),
          id: toId(message.sender._id || message.sender.id),
        }
      : message?.sender
        ? {
            _id: toId(message.sender),
            id: toId(message.sender),
          }
        : null;

  const messageId = toId(message?._id || message?.id);
  const groupId = toId(message?.group || message?.groupId);

  return {
    ...message,
    _id: messageId,
    id: messageId,
    group: groupId,
    groupId,
    sender,
    senderId: toId(message?.senderId || sender?._id || message?.sender),
    deliveredTo: uniqueIds(message?.deliveredTo || []),
    seenBy: uniqueIds(message?.seenBy || []),
    deletedFor: uniqueIds(message?.deletedFor || []),
    deletedForEveryone: Boolean(message?.deletedForEveryone),
  };
};

const isMessageHiddenForUser = (message, userId) =>
  normalizeMessage(message).deletedFor.includes(toId(userId));

const getRenderedMessageText = (message) =>
  message.deletedForEveryone ? "This message was deleted" : message.text || "";

const getMessagePreview = (message) => {
  if (!message) return "No messages yet";
  if (message.deletedForEveryone) return "This message was deleted";
  if (message.text) return message.text;
  const attachmentCount = Array.isArray(message.attachments)
    ? message.attachments.length
    : 0;
  if (attachmentCount === 1) return "Attachment";
  if (attachmentCount > 1) return `${attachmentCount} attachments`;
  return "No messages yet";
};

const removeMessageFromList = (messageList, messageId) =>
  messageList.filter((message) => toId(message._id) !== toId(messageId));

const mergeMessageIntoList = (messageList, nextMessage, currentUserId) => {
  const normalizedMessage = normalizeMessage(nextMessage);
  const withoutExisting = removeMessageFromList(
    messageList,
    normalizedMessage._id
  );

  if (isMessageHiddenForUser(normalizedMessage, currentUserId)) {
    return withoutExisting;
  }

  return [...withoutExisting, normalizedMessage].sort(
    (left, right) => new Date(left.createdAt) - new Date(right.createdAt)
  );
};

const applyStatusUpdates = (messageList, updates, currentUserId) => {
  if (!Array.isArray(updates) || updates.length === 0) {
    return messageList;
  }

  const updateMap = updates.reduce((accumulator, update) => {
    accumulator[toId(update.messageId || update.id)] = update;
    return accumulator;
  }, {});

  return messageList
    .map((message) => {
      const messageId = toId(message._id);
      const update = updateMap[messageId];

      if (!update) return message;

      const mergedMessage = normalizeMessage({
        ...message,
        deliveredTo: update.deliveredTo || message.deliveredTo,
        seenBy: update.seenBy || message.seenBy,
        deletedFor: update.deletedFor || message.deletedFor,
        deletedForEveryone:
          update.deletedForEveryone ?? message.deletedForEveryone,
      });

      return mergedMessage;
    })
    .filter((message) => !isMessageHiddenForUser(message, currentUserId));
};

const updateGroupPreview = (groupList, groupId, message) =>
  groupList.map((group) =>
    toId(group._id) === toId(groupId)
      ? {
          ...group,
          lastMessage: getMessagePreview(message),
          updatedAt: message.createdAt || new Date().toISOString(),
          lastMessageAt: message.createdAt || new Date().toISOString(),
        }
      : group
  );

const getRelativeTime = (date) => {
  if (!date) return "";

  const now = new Date();
  const messageDate = new Date(date);
  const diffInSeconds = Math.floor((now - messageDate) / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInSeconds < 60) return "now";
  if (diffInMinutes < 60) return `${diffInMinutes}m`;
  if (diffInHours < 24) return `${diffInHours}h`;
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 7) return `${diffInDays}d`;
  return messageDate.toLocaleDateString([], { month: "short", day: "numeric" });
};

const getInitials = (name) =>
  name
    ? name
        .split(" ")
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

const getMemberName = (member) =>
  member?.user?.name ||
  member?.user?.email?.split("@")[0] ||
  member?.name ||
  member?.email?.split("@")[0] ||
  null;

const getMessageStatus = (message) => {
  if ((message.seenBy || []).length > 0) return "seen";
  if ((message.deliveredTo || []).length > 0) return "delivered";
  return "sent";
};

const MessageSquareIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="48"
    height="48"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const SendIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const SearchIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const UsersIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const XIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const MoreIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
    <circle cx="5" cy="12" r="1" />
  </svg>
);

const TrashIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M9 6V4h6v2" />
  </svg>
);

const Shimmer = ({ className }) => (
  <div className={`bg-slate-100 rounded-lg animate-pulse ${className}`} />
);

const SidebarSkeleton = () => (
  <div className="w-[300px] flex-shrink-0 border-r border-slate-100 bg-white flex flex-col">
    <div className="p-5 border-b border-slate-100 space-y-3">
      <Shimmer className="h-7 w-36" />
      <Shimmer className="h-9 w-full rounded-xl" />
    </div>
    <div className="flex-1 p-3 space-y-1">
      {[1, 2, 3, 4, 5].map((item) => (
        <div key={item} className="p-3 rounded-xl space-y-2">
          <div className="flex items-center space-x-3">
            <Shimmer className="w-10 h-10 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Shimmer className="h-4 w-3/4" />
              <Shimmer className="h-3 w-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ChatAreaSkeleton = () => (
  <div className="flex-1 flex flex-col bg-white">
    <div className="px-6 py-4 border-b border-slate-100 flex items-center space-x-3">
      <Shimmer className="w-10 h-10 rounded-full" />
      <div className="space-y-1.5">
        <Shimmer className="h-4 w-32" />
        <Shimmer className="h-3 w-20" />
      </div>
    </div>
    <div className="flex-1 p-6 space-y-5">
      {[1, 2, 3, 4, 5].map((item) => (
        <div
          key={item}
          className={`flex items-end space-x-2 ${item % 2 === 0 ? "justify-end" : ""}`}
        >
          {item % 2 !== 0 && (
            <Shimmer className="w-8 h-8 rounded-full flex-shrink-0" />
          )}
          <Shimmer
            className={`h-12 rounded-2xl ${
              item % 2 === 0 ? "w-48" : "w-64"
            }`}
          />
        </div>
      ))}
    </div>
    <div className="p-4 border-t border-slate-100">
      <Shimmer className="h-12 w-full rounded-xl" />
    </div>
  </div>
);

const Avatar = ({ name, size = "md", soft = false, className = "" }) => {
  const sizes = {
    sm: "w-7 h-7 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-16 h-16 text-xl",
  };
  const color = soft
    ? "bg-[#E6F0FF] text-primary"
    : "bg-primary/10 text-primary";

  return (
    <div
      className={`${sizes[size]} ${color} rounded-full flex items-center justify-center font-semibold flex-shrink-0 ${className}`}
    >
      {getInitials(name)}
    </div>
  );
};

const GroupListItem = ({ group, isActive, unreadCount, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full text-left px-3 py-3 rounded-2xl border transition-all duration-150 group relative ${
      isActive
        ? "bg-[#EAF2FF] border-[#D7E6FF] shadow-sm"
        : "border-transparent hover:bg-[#F7FAFF] hover:border-[#E4EEFF]"
    }`}
  >
    {isActive && (
      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
    )}
    <div className="flex items-center space-x-3 pl-1">
      <Avatar name={group.name} size="md" />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-1">
          <span
            className={`text-sm truncate ${
              isActive
                ? "font-semibold text-slate-900"
                : "font-medium text-slate-800"
            }`}
          >
            {group.name}
          </span>
          <span className="text-[10px] text-slate-400 flex-shrink-0">
            {getRelativeTime(group.updatedAt || group.lastMessageAt)}
          </span>
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <p
            className={`text-xs truncate max-w-[160px] ${
              unreadCount > 0 ? "font-medium text-slate-700" : "text-slate-400"
            }`}
          >
            {group.lastMessage || "No messages yet"}
          </p>
          {unreadCount > 0 && (
            <span className="ml-1 bg-primary text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 flex-shrink-0">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  </button>
);

const EmptyState = () => (
  <div className="flex-1 flex flex-col items-center justify-center bg-[#F7FAFF] text-center px-8 select-none">
    <div className="w-20 h-20 bg-[#E6F0FF] rounded-3xl flex items-center justify-center text-primary mb-6">
      <MessageSquareIcon />
    </div>
    <h3 className="text-xl font-semibold text-slate-800 mb-2">
      Select a conversation
    </h3>
    <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
      Choose a case group from the sidebar to start messaging your team.
    </p>
  </div>
);

const NoMessagesYet = () => (
  <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
    <div className="w-14 h-14 bg-[#E6F0FF] rounded-2xl flex items-center justify-center text-primary mb-4">
      <MessageSquareIcon />
    </div>
    <p className="text-sm font-medium text-slate-600">No messages yet</p>
    <p className="text-xs text-slate-400 mt-1">
      Be the first to start the conversation.
    </p>
  </div>
);

const MessageStatusTicks = ({ status }) => {
  const tickColor =
    status === "seen"
      ? "text-primary"
      : status === "delivered"
        ? "text-slate-400"
        : "text-slate-500";

  return (
    <span className={`text-[11px] font-semibold tracking-[-0.1em] ${tickColor}`}>
      {status === "sent" ? "✓" : "✓✓"}
    </span>
  );
};

export default function MessagesPage() {
  const router = useRouter();
  const [socket, setSocket] = useState(null);
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [currentUser, setCurrentUser] = useState({});
  const [actionMenuMessageId, setActionMenuMessageId] = useState(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);
  const messagesEndRef = useRef(null);
  const activeGroupRef = useRef(activeGroup);
  const socketRef = useRef(null);
  const inputRef = useRef(null);
  const currentUserRef = useRef(currentUser);
  const seenRequestRef = useRef({});

  const currentUserId = toId(currentUser.id || currentUser._id);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("auth_token");
    const storedUser = getStoredUser();

    if (!token || !(storedUser?.id || storedUser?._id)) {
      router.push("/auth/login");
      return;
    }

    setCurrentUser(storedUser);
    setIsAuthenticated(true);
    setAuthChecking(false);
  }, [router]);

  useEffect(() => {
    activeGroupRef.current = activeGroup;
  }, [activeGroup]);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const total = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);
    localStorage.setItem("unread_messages_count", total.toString());
    window.dispatchEvent(new Event("unreadCountChanged"));
  }, [unreadCounts]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!actionMenuMessageId) return undefined;

    const handleWindowClick = () => setActionMenuMessageId(null);
    window.addEventListener("click", handleWindowClick);

    return () => window.removeEventListener("click", handleWindowClick);
  }, [actionMenuMessageId]);

  const refreshGroupsAndUnread = async () => {
    const [groupData, unreadData] = await Promise.all([
      api.chat.getGroups(),
      api.chat.getUnreadCounts(),
    ]);

    setGroups(groupData);
    setUnreadCounts(unreadData.groups || {});
  };

  const loadMessages = async (groupId) => {
    setLoading(true);
    setShowGroupInfo(false);
    setActionMenuMessageId(null);

    try {
      const data = await api.chat.getMessages(groupId, 100);
      const visibleMessages = data
        .map((message) => normalizeMessage(message))
        .filter((message) => !isMessageHiddenForUser(message, currentUserId));

      setMessages(visibleMessages);
      setActiveGroup(groupId);
      setUnreadCounts((previousCounts) => {
        const nextCounts = { ...previousCounts };
        delete nextCounts[groupId];
        return nextCounts;
      });

      if (socketRef.current?.connected) {
        socketRef.current.emit("join_group", { groupId });
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const markGroupAsSeen = async (groupId) => {
    if (!groupId || seenRequestRef.current[groupId]) return;

    seenRequestRef.current[groupId] = true;

    try {
      const response = await api.chat.markAsSeen(groupId);

      if (response?.updates?.length) {
        setMessages((previousMessages) =>
          applyStatusUpdates(previousMessages, response.updates, currentUserId)
        );
      }

      setUnreadCounts((previousCounts) => {
        const nextCounts = { ...previousCounts };
        delete nextCounts[groupId];
        return nextCounts;
      });
    } catch (error) {
      console.error("Error marking messages as seen:", error);
    } finally {
      delete seenRequestRef.current[groupId];
    }
  };

  useEffect(() => {
    if (!activeGroup || !currentUserId) return;

    const hasUnseenIncomingMessage = messages.some(
      (message) =>
        message.senderId !== currentUserId && !message.seenBy.includes(currentUserId)
    );

    if (hasUnseenIncomingMessage) {
      markGroupAsSeen(activeGroup);
    }
  }, [activeGroup, currentUserId, messages]);

  useEffect(() => {
    if (!isAuthenticated || typeof window === "undefined") return undefined;

    let isMounted = true;

    const loadInitialData = async () => {
      try {
        setGroupsLoading(true);
        await refreshGroupsAndUnread();
      } catch (error) {
        console.error("Error loading initial chat data:", error);
      } finally {
        if (isMounted) {
          setGroupsLoading(false);
          setInitialLoading(false);
        }
      }
    };

    const token = localStorage.getItem("auth_token");
    const storedUser = getStoredUser();
    if (!token || !(storedUser?.id || storedUser?._id)) return undefined;

    const socketInstance = initSocket(token);
    socketRef.current = socketInstance;
    setSocket(socketInstance);

    const handleConnect = async () => {
      setSocketConnected(true);
      socketInstance.emit("identify", {
        userId: storedUser.id || storedUser._id,
      });

      if (activeGroupRef.current) {
        socketInstance.emit("join_group", { groupId: activeGroupRef.current });
      }

      try {
        await refreshGroupsAndUnread();
      } catch (error) {
        console.error("Error refreshing chat state on reconnect:", error);
      }
    };

    const handleDisconnect = () => setSocketConnected(false);

    const handleIncomingMessage = (incomingMessage) => {
      const message = normalizeMessage(incomingMessage);
      const liveUserId = toId(
        currentUserRef.current.id || currentUserRef.current._id
      );
      const isMyMessage = message.senderId === liveUserId;
      const isActiveConversation =
        message.groupId === toId(activeGroupRef.current);

      setGroups((previousGroups) =>
        updateGroupPreview(previousGroups, message.groupId, message)
      );

      if (isActiveConversation) {
        setMessages((previousMessages) =>
          mergeMessageIntoList(previousMessages, message, liveUserId)
        );
        return;
      }

      if (!isMyMessage) {
        setUnreadCounts((previousCounts) => ({
          ...previousCounts,
          [message.groupId]: (previousCounts[message.groupId] || 0) + 1,
        }));
      }
    };

    const handleStatusEvent = (payload) => {
      setMessages((previousMessages) =>
        applyStatusUpdates(
          previousMessages,
          payload?.updates || [],
          toId(currentUserRef.current.id || currentUserRef.current._id)
        )
      );
    };

    const handleDeleteEvent = async (payload) => {
      if (payload?.scope === "everyone" && payload.message) {
        const message = normalizeMessage(payload.message);

        setMessages((previousMessages) =>
          mergeMessageIntoList(
            previousMessages,
            message,
            toId(currentUserRef.current.id || currentUserRef.current._id)
          )
        );
        setGroups((previousGroups) =>
          updateGroupPreview(previousGroups, message.groupId, message)
        );
        return;
      }

      if (payload?.scope === "me") {
        setMessages((previousMessages) =>
          removeMessageFromList(previousMessages, payload.messageId || payload.id)
        );

        try {
          await refreshGroupsAndUnread();
        } catch (error) {
          console.error("Error refreshing groups after delete:", error);
        }
      }
    };

    const handleAddedToGroup = async () => {
      try {
        await refreshGroupsAndUnread();
      } catch (error) {
        console.error("Error refreshing group list:", error);
      }
    };

    socketInstance.on("connect", handleConnect);
    socketInstance.on("disconnect", handleDisconnect);
    socketInstance.on("message_sent", handleIncomingMessage);
    socketInstance.on("message_delivered", handleStatusEvent);
    socketInstance.on("message_seen", handleStatusEvent);
    socketInstance.on("message_deleted", handleDeleteEvent);
    socketInstance.on("added_to_group", handleAddedToGroup);
    socketInstance.on("error", (error) =>
      console.error("Chat socket error:", error)
    );

    loadInitialData();

    return () => {
      isMounted = false;
      socketInstance.off("connect", handleConnect);
      socketInstance.off("disconnect", handleDisconnect);
      socketInstance.off("message_sent", handleIncomingMessage);
      socketInstance.off("message_delivered", handleStatusEvent);
      socketInstance.off("message_seen", handleStatusEvent);
      socketInstance.off("message_deleted", handleDeleteEvent);
      socketInstance.off("added_to_group", handleAddedToGroup);
      socketInstance.off("error");
      socketInstance.disconnect();
    };
  }, [isAuthenticated]);

  const sendMessage = async (event) => {
    event.preventDefault();

    if (!newMessage.trim() || !activeGroup) return;

    const text = newMessage.trim();
    setNewMessage("");
    setActionMenuMessageId(null);

    try {
      if (socketRef.current?.connected) {
        socketRef.current.emit("send_message", {
          groupId: activeGroup,
          text,
        });
        return;
      }

      const sentMessage = await api.chat.sendMessage(activeGroup, { text });
      const normalizedMessage = normalizeMessage(sentMessage);

      setMessages((previousMessages) =>
        mergeMessageIntoList(previousMessages, normalizedMessage, currentUserId)
      );
      setGroups((previousGroups) =>
        updateGroupPreview(previousGroups, activeGroup, normalizedMessage)
      );
    } catch (error) {
      console.error("Error sending message:", error);
      setNewMessage(text);
    }
  };

  const handleDeleteMessage = async (messageId, scope) => {
    setDeleteLoadingId(messageId);
    setActionMenuMessageId(null);

    try {
      const result = await api.chat.deleteMessage(messageId, scope);

      if (result?.scope === "everyone" && result.message) {
        const normalizedMessage = normalizeMessage(result.message);

        setMessages((previousMessages) =>
          mergeMessageIntoList(previousMessages, normalizedMessage, currentUserId)
        );
        setGroups((previousGroups) =>
          updateGroupPreview(previousGroups, normalizedMessage.groupId, normalizedMessage)
        );
      } else {
        setMessages((previousMessages) =>
          removeMessageFromList(previousMessages, messageId)
        );
        await refreshGroupsAndUnread();
      }
    } catch (error) {
      console.error("Error deleting message:", error);
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const filteredGroups = groups
    .filter((group) => {
      const matchesSearch = group.name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesFilter =
        filter === "all" || (filter === "unread" && unreadCounts[group._id] > 0);

      return matchesSearch && matchesFilter;
    })
    .sort(
      (left, right) =>
        new Date(right.updatedAt || right.lastMessageAt || 0) -
        new Date(left.updatedAt || left.lastMessageAt || 0)
    );

  const activeGroupData = groups.find(
    (group) => toId(group._id) === toId(activeGroup)
  );

  if (authChecking || initialLoading) {
    return (
      <div className="h-screen bg-slate-50 flex flex-col">
        <div className="px-8 py-6 border-b border-slate-100 bg-white">
          <Shimmer className="h-8 w-40 mb-1" />
          <Shimmer className="h-4 w-56 mt-2" />
        </div>
        <div className="flex flex-1 overflow-hidden">
          <SidebarSkeleton />
          <ChatAreaSkeleton />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      <div className="px-8 py-5 border-b border-slate-100 bg-white flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Messages
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Communicate with your case teams
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className={`flex items-center space-x-1.5 text-xs px-2.5 py-1 rounded-full border ${
                socketConnected
                  ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                  : "border-slate-200 bg-slate-50 text-slate-400"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  socketConnected ? "bg-emerald-500" : "bg-slate-400"
                }`}
              />
              <span>{socketConnected ? "Live" : "Offline"}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {groupsLoading ? (
          <SidebarSkeleton />
        ) : (
          <aside className="w-[300px] flex-shrink-0 border-r border-slate-100 bg-white flex flex-col">
            <div className="p-4 space-y-3 border-b border-slate-100">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/60">
                  <SearchIcon />
                </span>
                <input
                  type="text"
                  placeholder="Search groups..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-[#F7FAFF] border border-[#D7E6FF] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 placeholder-slate-400 transition"
                />
              </div>

              <div className="flex space-x-1 bg-[#F4F8FF] p-1 rounded-xl">
                {[
                  ["all", "All"],
                  ["unread", "Unread"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => setFilter(value)}
                    className={`flex-1 text-xs font-medium py-1.5 rounded-lg transition-all ${
                      filter === value
                        ? "bg-white shadow-sm text-primary"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {label}
                    {value === "unread" &&
                      Object.keys(unreadCounts).length > 0 && (
                        <span className="ml-1 text-primary">
                          (
                          {Object.values(unreadCounts).reduce(
                            (sum, count) => sum + count,
                            0
                          )}
                          )
                        </span>
                      )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredGroups.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-4 py-12">
                  <div className="w-12 h-12 bg-[#E6F0FF] rounded-2xl flex items-center justify-center text-primary mb-3">
                    <MessageSquareIcon />
                  </div>
                  <p className="text-sm font-medium text-slate-500">
                    {searchQuery ? "No groups found" : "No case groups yet"}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {searchQuery
                      ? "Try a different search term"
                      : "Create a case to get started"}
                  </p>
                </div>
              ) : (
                filteredGroups.map((group) => (
                  <GroupListItem
                    key={group._id}
                    group={group}
                    isActive={toId(activeGroup) === toId(group._id)}
                    unreadCount={unreadCounts[group._id] || 0}
                    onClick={() => loadMessages(group._id)}
                  />
                ))
              )}
            </div>

            <div className="px-4 py-3 border-t border-slate-100">
              <p className="text-xs text-slate-400 text-center">
                {groups.length} group{groups.length !== 1 ? "s" : ""}
              </p>
            </div>
          </aside>
        )}

        <main className="flex-1 flex overflow-hidden bg-white">
          {loading ? (
            <ChatAreaSkeleton />
          ) : activeGroup && activeGroupData ? (
            <div className="flex-1 flex overflow-hidden">
              <div className="flex-1 flex flex-col min-w-0">
                <div
                  className="px-6 py-4 border-b border-slate-100 bg-white flex items-center justify-between flex-shrink-0 cursor-pointer hover:bg-[#F8FBFF] transition-colors"
                  onClick={() => setShowGroupInfo(!showGroupInfo)}
                >
                  <div className="flex items-center space-x-3">
                    <Avatar name={activeGroupData.name} size="md" />
                    <div>
                      <h2 className="text-sm font-semibold text-slate-900 leading-tight">
                        {activeGroupData.name}
                      </h2>
                      <div className="flex items-center space-x-1.5 mt-0.5 text-primary/70">
                        <UsersIcon />
                        <span className="text-xs text-slate-400">
                          {activeGroupData.members?.length || 0} participants
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-xs text-slate-400 hidden sm:block">
                      {showGroupInfo ? "Hide info" : "View info"}
                    </span>
                    <span
                      className={`text-primary/60 transition-transform ${
                        showGroupInfo ? "rotate-90" : ""
                      }`}
                    >
                      <ChevronRightIcon />
                    </span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4 bg-gradient-to-b from-[#F7FAFF] to-white flex flex-col">
                  {messages.length === 0 ? (
                    <NoMessagesYet />
                  ) : (
                    <div className="space-y-3 mt-auto">
                      {messages.map((message) => {
                        const isMe = message.senderId === currentUserId;
                        const isDeleted = message.deletedForEveryone;
                        const status = getMessageStatus(message);
                        const isDeleteLoading =
                          deleteLoadingId === toId(message._id);

                        return (
                          <div
                            key={message._id}
                            className={`flex items-end gap-2 ${
                              isMe ? "flex-row-reverse" : ""
                            }`}
                          >
                            {!isMe && (
                              <Avatar
                                name={
                                  getMemberName(message.sender) ||
                                  message.sender?.name
                                }
                                size="sm"
                                className="mb-1"
                              />
                            )}

                            {isMe && !isDeleted && (
                              <div
                                className="relative self-start"
                                onClick={(event) => event.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setActionMenuMessageId((currentId) =>
                                      currentId === message._id
                                        ? null
                                        : message._id
                                    );
                                  }}
                                  className="w-8 h-8 flex items-center justify-center rounded-xl text-primary/70 hover:text-primary hover:bg-[#EAF2FF] transition"
                                  disabled={isDeleteLoading}
                                >
                                  <MoreIcon />
                                </button>

                                {actionMenuMessageId === message._id && (
                                  <div className="absolute top-9 right-0 z-10 w-44 rounded-2xl border border-[#D7E6FF] bg-white shadow-lg p-1.5">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDeleteMessage(message._id, "me")
                                      }
                                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-[#F4F8FF] rounded-xl transition"
                                    >
                                      <TrashIcon />
                                      <span>Delete for Me</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDeleteMessage(
                                          message._id,
                                          "everyone"
                                        )
                                      }
                                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-[#F4F8FF] rounded-xl transition"
                                    >
                                      <TrashIcon />
                                      <span>Delete for Everyone</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}

                            <div
                              className={`max-w-[72%] flex flex-col ${
                                isMe ? "items-end" : "items-start"
                              }`}
                            >
                              {!isMe && (
                                <span className="text-[10px] font-semibold text-slate-500 mb-1 ml-1">
                                  {getMemberName(message.sender) ||
                                    message.sender?.name ||
                                    "Unknown"}
                                </span>
                              )}

                              <div
                                className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                                  isDeleted
                                    ? "bg-slate-100 border border-slate-200 text-slate-400 italic"
                                    : isMe
                                      ? "bg-[#E6F0FF] border border-[#CFE0FF] text-[#173C76]"
                                      : "bg-white border border-slate-200 text-slate-800 shadow-sm"
                                } ${isMe ? "rounded-tr-sm" : "rounded-tl-sm"}`}
                              >
                                <p className="whitespace-pre-wrap break-words">
                                  {getRenderedMessageText(message)}
                                </p>
                                <div
                                  className={`mt-2 flex items-center gap-1 justify-end text-[10px] ${
                                    isDeleted
                                      ? "text-slate-400"
                                      : isMe
                                        ? "text-[#597AAC]"
                                        : "text-slate-400"
                                  }`}
                                >
                                  <span>
                                    {new Date(message.createdAt).toLocaleTimeString(
                                      [],
                                      {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      }
                                    )}
                                  </span>
                                  {isMe && <MessageStatusTicks status={status} />}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                <form
                  onSubmit={sendMessage}
                  className="px-4 py-4 border-t border-slate-100 bg-white flex-shrink-0"
                >
                  <div className="flex items-center gap-2 bg-[#F7FAFF] border border-[#D7E6FF] rounded-2xl px-4 py-2 focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/15 transition">
                    <input
                      ref={inputRef}
                      type="text"
                      value={newMessage}
                      onChange={(event) => setNewMessage(event.target.value)}
                      placeholder={`Message ${activeGroupData.name}...`}
                      className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
                      disabled={loading}
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || loading}
                      className="w-8 h-8 bg-primary hover:bg-primary/90 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
                    >
                      <SendIcon />
                    </button>
                  </div>
                </form>
              </div>

              {showGroupInfo && (
                <aside className="w-72 flex-shrink-0 border-l border-slate-100 bg-white flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                    <span className="text-sm font-semibold text-slate-800">
                      Group Info
                    </span>
                    <button
                      onClick={() => setShowGroupInfo(false)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-primary/60 hover:text-primary hover:bg-[#EAF2FF] transition"
                    >
                      <XIcon />
                    </button>
                  </div>

                  <div className="px-5 py-6 border-b border-slate-100 flex flex-col items-center text-center flex-shrink-0">
                    <Avatar
                      name={activeGroupData.name}
                      size="lg"
                      soft
                      className="mb-3 shadow-sm"
                    />
                    <h3 className="text-base font-bold text-slate-900">
                      {activeGroupData.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {activeGroupData.members?.length || 0} participants
                    </p>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3 px-1">
                      Participants
                    </p>
                    <div className="space-y-1">
                      {activeGroupData.members?.map((member, index) => {
                        const displayName = getMemberName(member);
                        const memberKey =
                          member?._id ||
                          member?.email ||
                          member?.user?._id ||
                          `${displayName || "member"}-${index}`;

                        return (
                          <div
                            key={memberKey}
                            className="flex items-center space-x-3 px-2 py-2 rounded-xl hover:bg-[#F7FAFF] transition"
                          >
                            <Avatar name={displayName || member.role} size="sm" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-800 truncate">
                                {displayName || (
                                  <span className="italic text-slate-400">
                                    Unknown
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-slate-400 capitalize truncate">
                                {member.role || "Member"}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </aside>
              )}
            </div>
          ) : (
            <EmptyState />
          )}
        </main>
      </div>
    </div>
  );
}
