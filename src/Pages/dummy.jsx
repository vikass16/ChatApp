import { useNavigate } from "react-router-dom";
import authService from "../services/authService";
import { useCallback, useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";
import PrivateChat from "./Privatechat";

import bgImage1 from "../assets/pexels-raymond-petrik-1448389535-33483265.jpg";

const ChatArea = () => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState("");
  const [unreadMessages, setUnreadMessages] = useState(new Map());
  const [allUsers, setAllUsers] = useState(new Set());
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [activeChatUser, setActiveChatUser] = useState(null);

  const userColorsRef = useRef(new Map());
  const privateMessageHandler = useRef(new Map());
  const stompClient = useRef(null);
  const messageEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const receiveMessageIds = useRef(new Set());

  if (!currentUser) navigate("/login");
  const { username, color: userColor } = currentUser || {};

  const normalizeUsername = (u) => (u ? u.trim().toLowerCase() : "");

  const scrollToBottom = () =>
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });

  const registerPrivateMessageHandler = useCallback((otherUser, handler) => {
    privateMessageHandler.current.set(normalizeUsername(otherUser), handler);
  }, []);

  const unregisterPrivateMessageHandler = useCallback((otherUser) => {
    privateMessageHandler.current.delete(normalizeUsername(otherUser));
  }, []);

  // Fetch unread message counts
  useEffect(() => {
    if (!username) return;

    const fetchUnreadCounts = async () => {
      try {
        const res = await fetch(
          `http://localhost:8080/api/messages/unreadCounts?username=${encodeURIComponent(
            username
          )}`
        );
        if (!res.ok) throw new Error("Failed to fetch unread counts");
        const data = await res.json();
        setUnreadMessages(new Map(Object.entries(data)));
      } catch (err) {
        console.error("Error fetching unread counts:", err);
      }
    };

    fetchUnreadCounts();
  }, [username]);

  // Fetch All users
  useEffect(() => {
    if (!username) return;
    fetch("http://localhost:8080/api/users")
      .then((res) => res.json())
      .then((data) => {
        const usersSet = new Set(data.map((u) => normalizeUsername(u.username)).filter(Boolean));
        usersSet.add(normalizeUsername(username));
        setAllUsers(usersSet);

        data.forEach((u) => {
          if (u?.username && !userColorsRef.current.has(normalizeUsername(u.username))) {
            userColorsRef.current.set(normalizeUsername(u.username), u.color || "#007bff");
          }
        });
        if (username) {
          userColorsRef.current.set(normalizeUsername(username), userColor);
        }
      })
      .catch(console.error);
  }, [username, userColor]);

  // WebSocket connection
  useEffect(() => {
    if (!username) return;

    const socket = new SockJS("http://localhost:8080/ws");
    stompClient.current = Stomp.over(socket);

    let publicSubscription = null;
    let privateSubscription = null;

    stompClient.current.connect({ username }, async () => {
      // Fetch current online users from backend
      try {
        const res = await fetch("http://localhost:8080/api/users/online");
        if (res.ok) {
          const onlineList = await res.json();
          setOnlineUsers(new Set(onlineList.map((u) => normalizeUsername(u))));
        }
      } catch (err) {
        console.error("Failed to fetch online users:", err);
      }

      // Subscribe to public topic
      publicSubscription = stompClient.current.subscribe("/topic/public", (mesg) => {
        const chatMessage = JSON.parse(mesg.body);

        if (!chatMessage.id) {
          chatMessage.id =
            chatMessage.timeStamp + chatMessage.sender + chatMessage.content;
        }

        if (receiveMessageIds.current.has(chatMessage.id)) {
          return;
        }
        receiveMessageIds.current.add(chatMessage.id);

        const sender = normalizeUsername(chatMessage.sender);

        if (chatMessage.type === "JOIN" && sender) {
          setOnlineUsers((prev) => new Set([...prev, sender]));
          if (!userColorsRef.current.has(sender)) {
            userColorsRef.current.set(sender, chatMessage.color || "#007bff");
          }
        } else if (chatMessage.type === "LEAVE" && sender) {
          setOnlineUsers((prev) => {
            const s = new Set(prev);
            s.delete(sender);
            return s;
          });
        } else if (chatMessage.type === "TYPING" && sender) {
          setIsTyping(sender);
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setIsTyping(""), 2000);
        } else if (chatMessage.type === "CHAT" && sender) {
          setMessages((prev) => [
            ...prev,
            {
              ...chatMessage,
              sender,
              timeStamp: chatMessage.timeStamp || new Date().toISOString(),
              id: chatMessage.id,
            },
          ]);
          scrollToBottom();
        }
      });

      // Subscribe to private messages
      privateSubscription = stompClient.current.subscribe(
        `/user/${username}/queue/private`,
        (mesg) => {
          const privateMessage = JSON.parse(mesg.body);

          if (!privateMessage.id) {
            privateMessage.id =
              privateMessage.timeStamp +
              privateMessage.sender +
              privateMessage.content;
          }
          if (receiveMessageIds.current.has(privateMessage.id)) {
            return;
          }
          receiveMessageIds.current.add(privateMessage.id);

          const otherUser =
            normalizeUsername(privateMessage.sender) === normalizeUsername(username)
              ? normalizeUsername(privateMessage.receiver)
              : normalizeUsername(privateMessage.sender);

          if (!otherUser) return;

          if (!userColorsRef.current.has(otherUser)) {
            userColorsRef.current.set(otherUser, privateMessage.color || "#007bff");
          }

          const handler = privateMessageHandler.current.get(otherUser);
          if (handler) {
            handler(privateMessage);
          } else if (normalizeUsername(privateMessage.receiver) === normalizeUsername(username)) {
            setUnreadMessages((prev) => {
              const newMap = new Map(prev);
              const count = newMap.get(otherUser) || 0;
              newMap.set(otherUser, count + 1);
              return newMap;
            });
          }
        }
      );

      // Send JOIN
      stompClient.current.send(
        "/app/chat.addUser",
        {},
        JSON.stringify({
          sender: username,
          type: "JOIN",
          color: userColor,
        })
      );
    });

    return () => {
      if (publicSubscription) publicSubscription.unsubscribe();
      if (privateSubscription) privateSubscription.unsubscribe();

      if (stompClient.current?.connected) {
        stompClient.current.disconnect();
      }
      clearTimeout(typingTimeoutRef.current);
      receiveMessageIds.current.clear();
    };
  }, [username, userColor]);

  // open private chat
  const openPrivateChat = (otherUser) => {
    if (!otherUser || normalizeUsername(otherUser) === normalizeUsername(username)) return;
    setActiveChatUser(normalizeUsername(otherUser));

    setUnreadMessages((prev) => {
      const m = new Map(prev);
      m.delete(normalizeUsername(otherUser));
      return m;
    });

    fetch("http://localhost:8080/api/messages/markAsRead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, sender: otherUser }),
    }).catch((err) => {
      console.error("Error marking messages as read:", err);
    });
  };

  const closePrivateChat = () => {
    if (activeChatUser) {
      unregisterPrivateMessageHandler(activeChatUser);
      setActiveChatUser(null);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() || !stompClient.current?.connected) return;

    const chatMessage = {
      sender: username,
      content: message,
      type: "CHAT",
      color: userColor,
    };
    stompClient.current.send("/app/chat.sendMessage", {}, JSON.stringify(chatMessage));
    setMessage("");
    setShowEmojiPicker(false);
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);
    if (stompClient.current?.connected && e.target.value.trim()) {
      stompClient.current.send(
        "/app/chat.sendMessage",
        {},
        JSON.stringify({ sender: username, type: "TYPING" })
      );
    }
  };

  const emojis = ["😀", "😍", "🥰", "😘", "😎", "🤪"];

  const addEmoji = (emoji) => {
    setMessage((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  const formatTime = (ts) =>
    ts
      ? new Date(ts).toLocaleTimeString("en-US", {
          timeZone: "Asia/Kolkata",
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Sidebar */}
      <div className="w-80 bg-slate-800/95 border-r border-slate-700/50 flex flex-col shadow-2xl">
        <div className="p-6 border-b border-slate-700/50">
          <h2 className="text-xl font-bold text-white">Chat Users</h2>
          <div className="flex items-center space-x-2 mt-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
            <span className="text-sm text-slate-300">{onlineUsers.size} online</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {Array.from(allUsers)
            .filter(Boolean)
            .sort((a, b) => {
              if (a === normalizeUsername(username)) return -1;
              if (b === normalizeUsername(username)) return 1;
              return a.localeCompare(b);
            })
            .map((user) => (
              <div
                key={user}
                className={`flex items-center p-3 rounded-xl cursor-pointer ${
                  activeChatUser === user ? "bg-purple-600" : ""
                }`}
                onClick={() => openPrivateChat(user)}
              >
                <div
                  className="w-12 h-12 flex items-center justify-center rounded-full text-white font-semibold"
                  style={{
                    backgroundColor: userColorsRef.current.get(user) || "#007bff",
                  }}
                >
                  {user?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div className="ml-4 flex-1">
                  <span className="text-white font-medium">{user}</span>
                  {onlineUsers.has(user) && user !== normalizeUsername(username) && (
                    <span className="text-xs text-emerald-400 ml-2">Online</span>
                  )}
                </div>
                {unreadMessages.get(user) > 0 && (
                  <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {unreadMessages.get(user)}
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>

      {/* Main Chat */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white/10 p-6 border-b border-white/10">
          <h4 className="text-2xl font-bold text-white">
            Welcome,{" "}
            <span className="text-purple-400">{username}</span>
          </h4>
        </div>

        {/* Messages */}
        <div
          className="flex-1 overflow-y-auto relative"
          style={{
            backgroundImage: `url(${bgImage1})`,
            backgroundSize: "cover",
          }}
        >
          <div className="absolute inset-0 bg-slate-900/60"></div>
          <div className="relative z-10 p-4 space-y-4">
            {messages.map((m) => (
              <div key={m.id} className="flex items-start space-x-3">
                <div
                  className="w-10 h-10 flex items-center justify-center rounded-full text-white font-semibold"
                  style={{
                    backgroundColor:
                      m.color || userColorsRef.current.get(m.sender) || "#007bff",
                  }}
                >
                  {m.sender?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span style={{ color: m.color || "#007bff" }}>
                      {m.sender}
                    </span>
                    <span className="text-xs text-slate-400">
                      {formatTime(m.timeStamp)}
                    </span>
                  </div>
                  <div className="bg-white/10 px-4 py-2 rounded-xl text-white">
                    {m.content}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messageEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="bg-white/10 p-4">
          <form onSubmit={sendMessage} className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="w-12 h-12 bg-slate-700 rounded-full text-xl"
            >
              😊
            </button>
            <input
              type="text"
              value={message}
              onChange={handleTyping}
              placeholder="Type..."
              className="flex-1 bg-white/10 rounded-2xl px-6 py-3 text-white"
            />
            <button
              type="submit"
              disabled={!message.trim()}
              className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-white"
            >
              ➤
            </button>
          </form>

          {showEmojiPicker && (
            <div className="mt-2 grid grid-cols-6 gap-2">
              {emojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => addEmoji(emoji)}
                  className="bg-slate-700 rounded-lg p-2"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {activeChatUser && (
        <PrivateChat
          key={activeChatUser}
          currentUser={username}
          receiver={activeChatUser}
          userColor={userColorsRef.current.get(activeChatUser) || "#007bff"}
          stompClient={stompClient}
          onClose={closePrivateChat}
          registerPrivateMessageHandler={registerPrivateMessageHandler}
          unregisterPrivateMessageHandler={unregisterPrivateMessageHandler}
        />
      )}
    </div>
  );
};

export default ChatArea;

