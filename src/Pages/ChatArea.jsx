
import { useNavigate } from "react-router-dom";
import authService from "../services/authService";
import { useCallback, useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";
import PrivateChat from "./Privatechat";

import bgImage from "../assets/pexels-iriser-1590549.jpg";
import bgImage1 from "../assets/pexels-raymond-petrik-1448389535-33483265.jpg"

const ChatArea = () => {
  const navigate = useNavigate();
  const currentUser  = authService.getCurrentUser ();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState("");
  const [unreadMessages, setUnreadMessages] = useState(new Map());
  const [allUsers, setAllUsers] = useState(new Set());
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [activeChatUser , setActiveChatUser ] = useState(null);
  const messagesContainerRef = useRef(null); // hereeeeee

  const userColorsRef = useRef(new Map());
  const privateMessageHandler = useRef(new Map());
  const stompClient = useRef(null);
  const messageEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const receiveMessageIds = useRef(new Set()); // this one

  useEffect(() => { // hereeeee
  if (messagesContainerRef.current) {
    messagesContainerRef.current.scrollTo({
      top: messagesContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }
}, [messages]);


  if (!currentUser ) navigate("/login");
  const { username, color: userColor } = currentUser  || {};

  const normalizeUsername = (u) => (u ? u.trim().toLowerCase() : "");
  const scrollToBottom = () =>
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });

  const registerPrivateMessageHandler = useCallback((otherUser , handler) => {
    privateMessageHandler.current.set(normalizeUsername(otherUser) , handler);
  }, []);

  const unregisterPrivateMessageHandler = useCallback((otherUser ) => {
    privateMessageHandler.current.delete(normalizeUsername(otherUser));
  }, []);

  // Fetch unread message counts from backend API
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
        const data = await res.json(); // expected: { senderUsername: count, ... }
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
        const usersSet = new Set(data.map((u) => u.username).filter(Boolean));
        usersSet.add(username);
        setAllUsers(usersSet);

        data.forEach((u) => {
          if (u?.username && !userColorsRef.current.has(u.username)) {
            userColorsRef.current.set(u.username, u.color || "#007bff");
          }
        });
        if (username) {
          userColorsRef.current.set(username, userColor);
        }
      })
      .catch(console.error);
  }, [username, userColor]);
 //connecting to websocket

useEffect(() => {
  if (!username) return;

  const socket = new SockJS("http://localhost:8080/ws");
  stompClient.current = Stomp.over(socket);

  let publicSubscription = null;
  let privateSubscription = null;

   stompClient.current.connect({ username }, async () => {
    // Subscribe to public topic
       try{
        const res = await fetch("http://localhost:8080/api/users/online");
        if(res.ok){
          const onlineList = await res.json();
          setOnlineUsers(new Set(onlineList.map((u) => normalizeUsername(u))));
        }
       }catch(err){
        console.log("Failed to fetch online users: ",err);
        
       }
    publicSubscription = stompClient.current.subscribe("/topic/public", (mesg) => {
      const chatMessage = JSON.parse(mesg.body);

      // Ensure message has an ID for deduplication
      if (!chatMessage.id) {
        chatMessage.id = chatMessage.timeStamp + chatMessage.sender + chatMessage.content;
      }

      // Deduplicate messages by ID
      if (receiveMessageIds.current.has(chatMessage.id)) {
        return; // Ignore duplicate
      }
      receiveMessageIds.current.add(chatMessage.id);

      const sender = normalizeUsername(chatMessage.sender);
      if (chatMessage.type === "JOIN" && sender) {
        //setOnlineUsers((prev) => new Set(prev).add(chatMessage.sender));
        setOnlineUsers((prev) => new Set([...prev, sender]));
        if (!userColorsRef.current.has(sender)) {
          userColorsRef.current.set(
            sender,
            chatMessage.color || "#007bff"
          );
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
    privateSubscription = stompClient.current.subscribe(`/user/${username}/queue/private`, (mesg) => {
      const privateMessage = JSON.parse(mesg.body);

      // Deduplicate private messages similarly
      if (!privateMessage.id) {
        privateMessage.id = privateMessage.timeStamp + privateMessage.sender + privateMessage.content;
      }
      if (receiveMessageIds.current.has(privateMessage.id)) {
        return; // Ignore duplicate
      }
      receiveMessageIds.current.add(privateMessage.id);

      const otherUser  =
        normalizeUsername(privateMessage.sender) === normalizeUsername(username)
          ? normalizeUsername(privateMessage.receiver)
          : normalizeUsername(privateMessage.sender);

      if (!otherUser ) return;

      if (!userColorsRef.current.has(otherUser )) {
        userColorsRef.current.set(otherUser , privateMessage.color || "#007bff");
      }

      const handler = privateMessageHandler.current.get(otherUser );
      if (handler) {
        handler(privateMessage);
      } else if (normalizeUsername(privateMessage.receiver) === normalizeUsername(username)) {
        // Increment unread count for sender if no handler
        setUnreadMessages((prev) => {
          const newMap = new Map(prev);
          const count = newMap.get(otherUser ) || 0;
          newMap.set(otherUser , count + 1);
          return newMap;
        });
      }
    });

    // Broadcast join to public
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
    // Unsubscribe from topics to avoid duplicate subscriptions on remount
    if (publicSubscription) publicSubscription.unsubscribe();
    if (privateSubscription) privateSubscription.unsubscribe();

    if (stompClient.current?.connected) {
      stompClient.current.disconnect();
    }
    clearTimeout(typingTimeoutRef.current);

    // Clear received message IDs on disconnect to avoid memory leak
    receiveMessageIds.current.clear();
  };
}, [username, userColor]);



  // Open private chat with only one active chat at a time
  const openPrivateChat = (otherUser ) => {
    if (!otherUser  || normalizeUsername(otherUser)  === normalizeUsername(username)) return;
    setActiveChatUser (normalizeUsername(otherUser) );

    // Clear unread count locally
    setUnreadMessages((prev) => {
      const m = new Map(prev);
      m.delete(normalizeUsername(otherUser) );
      return m;
    });

    // Call backend API to mark messages as read
    fetch("http://localhost:8080/api/messages/markAsRead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, sender: otherUser  }),
    }).catch((err) => {
      console.error("Error marking messages as read:", err);
    });
  };

  // Close private chat window
  const closePrivateChat = () => {
    if (activeChatUser ) {
      unregisterPrivateMessageHandler(activeChatUser );
      setActiveChatUser (null);
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

  const emojis = [
    "😀",
    "😍",
    "🥰",
    "😘",
    "😎",
    "🤪",
    "🤨",
    "🥳",
    "🤩",
    "😡",
    "😭",
    "😩",
    "🥵",
    "🥶",
    "🤡",
    "☠️",
    "👀",
    "🐹",
    "🐶",
    "🔥",
    "🌚",
    "🍭",
    "🎂",
    "🧁",
    "🏏",
    "⚽",
    "❤️",
    "🖤",
    "💛",
    "😊",
    "😇",
    "🥹",
    "😅",
    "🙂",
    "🤑",
    "🫶",
    "🤝",
  ];

  const addEmoji = (emoji) => {
    setMessage((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  const formatTime = (ts) =>
    ts
      ? new Date(ts).toLocaleTimeString("en-US", {
         
          hour12: true,
          hour: "2-digit",
          minute: "2-digit",         
        })
      : "";

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Modern Sidebar */}
      <div className="w-80 bg-slate-800/95 backdrop-blur-sm border-r border-slate-700/50 flex flex-col shadow-2xl">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-slate-700/50 bg-gradient-to-r from-slate-800 to-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Chat Users</h2>
            <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50"></div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
            <span className="text-sm text-slate-300">{onlineUsers.size} online</span>
          </div>
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
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
                className={`group flex items-center p-3 rounded-xl cursor-pointer transition-all duration-200 hover:bg-slate-700/50 hover:shadow-lg hover:shadow-purple-500/10 hover:scale-[1.02] ${
                  activeChatUser  === user
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg shadow-purple-500/25"
                    : user === username
                    ? "bg-slate-700/50 border border-slate-600/50"
                    : ""
                }`}
                onClick={() => openPrivateChat(user)}
              >
                <div className="relative">
                  <div
                    className="w-12 h-12 flex items-center justify-center rounded-full text-white font-semibold text-sm shadow-lg ring-2 ring-white/20"
                    style={{
                      backgroundColor: userColorsRef.current.get(user) || "#007bff",
                    }}
                  >
                    {user?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  {onlineUsers.has(user) && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-slate-800 shadow-sm animate-pulse"></div>
                  )}
                </div>

                <div className="flex-1 ml-4 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium truncate group-hover:text-white">
                      {user || "Unknown"}
                    </span>
                    {user === username && (
                      <span className="text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded-full">(You)</span>
                    )}
                  </div>
                  {onlineUsers.has(user) && user !== normalizeUsername(username) && (
                    <span className="text-xs text-emerald-400 font-medium">Active now</span>
                  )}
                </div>

                {unreadMessages.get(user) > 0 && (
                  <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs px-2.5 py-1 rounded-full font-bold min-w-[20px] text-center shadow-lg animate-bounce">
                    {unreadMessages.get(user)}
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white/10 backdrop-blur-md shadow-xl p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-2xl font-bold text-white mb-1">
                Welcome,{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                  {username}
                </span>
              </h4>
              <p className="text-slate-300">Public Chat Room</p>
            </div>
            <div className="flex items-center space-x-3">
              {isTyping && isTyping !== username && (
                <div className="flex items-center space-x-3 bg-slate-800/50 px-4 py-2 rounded-full backdrop-blur-sm">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-purple-300">
                    {isTyping} is typing...
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div
          className="flex-1 overflow-y-auto space-y-0 relative "
          style={{
            backgroundImage: `url(${bgImage1})`,
            backgroundSize: "cover",
            //backgroundAttachment: "fixed",
          }}
        >
          {/* <div className="absolute inset-0 h-screen bg-slate-900/60 backdrop-blur-[1px]"></div> */}
          <div className="relative z-10 space-y-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex items-end space-x-3 ${
                  m.sender === username ? "flex-row-reverse space-x-reverse" : ""
                }`}
              >
                {/* Avatar */}
                <div
                  className="w-10 h-10 flex items-center justify-center rounded-full text-gray-600 font-semibold text-sm flex-shrink-0 shadow-lg ring-2 ring-white/20 ml-2 mr-2"
                  style={{
                    backgroundColor:
                      m.color || userColorsRef.current.get(m.sender) || "#007bff",
                  }}
                >
                  {m.sender?.charAt(0)?.toUpperCase() || "?"}
                </div>

                {/* Message Bubble */}
                <div ref ={messagesContainerRef} className="flex flex-col max-w-md">
                  <div className="flex items-center space-x-2 mb-2">
                    <span
                      className="text-sm font-semibold"
                      style={{ color: m.color || "#007bff" }}
                    >
                      {m.sender || "Unknown"}
                    </span>
                    <span className="text-xs text-slate-900">{formatTime(m.timeStamp)}</span>
                  </div>

                  <div
                    className={`px-4 py-3 rounded-2xl shadow-lg backdrop-blur-sm transition-all duration-200 hover:shadow-xl ${
                      m.sender === username
                        ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-br-md"
                        : "bg-white/10 text-white rounded-bl-md border border-white/20"
                    }`}
                  >
                    <div className="break-words">{m.content || ""}</div>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messageEndRef} />
          </div>
        </div>

        {/* Message Input */}
        <div className="bg-white/10 backdrop-blur-md p-6 border-t border-white/10">
          <form onSubmit={sendMessage} className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="w-12 h-12 bg-slate-700/50 hover:bg-slate-600/50 rounded-full flex items-center justify-center text-xl transition-all duration-200 hover:scale-110 backdrop-blur-sm"
            >
              😊
            </button>

            <input
              type="text"
              value={message}
              onChange={handleTyping}
              placeholder="Type your message..."
              className="flex-1 bg-white/10 border border-white/20 rounded-2xl px-6 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm transition-all duration-200"
            />

            <button
              type="submit"
              disabled={!message.trim()}
              className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-600 rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-110 disabled:scale-100 shadow-lg disabled:shadow-none"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </form>

                  {/* Emoji Picker */}

           {showEmojiPicker && (
        <div className="mx-5 mb-4 p-4 bg-popover/95 backdrop-blur-sm border border-border rounded-xl shadow-lg max-h-44 overflow-y-auto animate-in slide-in-from-bottom-2 duration-200">
          <div className="grid grid-cols-8 gap-2">
            {emojis.map(emoji => (
              <button 
                key={emoji} 
                type="button" 
                onClick={() => addEmoji(emoji)} 
                className="w-10 h-10 hover:bg-accent rounded-lg transition-all duration-150 flex items-center justify-center text-lg hover:scale-110 transform shadow-sm hover:shadow-md"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )} 
        </div>
      </div>

      {/* Private Chat Window */}
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







// ============================================================




