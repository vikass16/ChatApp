// import { useEffect, useRef, useState } from "react";

// const PrivateChat = ({
//   currentUser,
//   receiver,
//   userColor,
//   stompClient,
//   onClose,
//   registerPrivateMessageHandler,
//   unregisterPrivateMessageHandler,
// }) => {
//   const [messages, setMessages] = useState([]);
//   const [message, setMessage] = useState("");
//   const [showEmojiPicker, setShowEmojiPicker] = useState(false);
//   const messagesEndRef = useRef(null);
//   const messageIdsRef = useRef(new Set());

//   const emojis = [
//     "😀","😍","🥰","😘","😎","🤪","🤨","🥳","🤩","😡","😭","😩","🥵","🥶","🤡","☠️","👀","🐹","🐶","🔥","🌚","🍭","🎂","🧁","🏏","⚽","❤️","🖤","💛","😊","😇","🥹","😅","🙂","🤑","🫶","🤝"
//   ];

//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   };

//   const createMessageId = (mesg) =>
//     `${mesg.sender}-${mesg.receiver}-${mesg.content}-${mesg.timeStamp}`;

//   // Handler for incoming private messages
//   const handleIncomingPrivateMessage = (privateMessage) => {
//     const messageId = privateMessage.id || createMessageId(privateMessage);
//     const relevant =
//       (privateMessage.sender === currentUser && privateMessage.receiver === receiver) ||
//       (privateMessage.sender === receiver && privateMessage.receiver === currentUser);

//     if (relevant && !messageIdsRef.current.has(messageId)) {
//       const newMessage = { ...privateMessage, id: messageId };
//       messageIdsRef.current.add(messageId);
//       setMessages((prev) => [...prev, newMessage]);
//       scrollToBottom();
//     }
//   };

//   // Load messages and register handler on receiver change
//   useEffect(() => {
//     if (!currentUser || !receiver) return;

//     let isMounted = true;

//     // Clear previous messages and IDs when receiver changes
//     setMessages([]);
//     messageIdsRef.current.clear();


//     const loadMessages = async () => {
//       try {
//         const res = await fetch(
//           `http://localhost:8080/api/messages/private?user1=${encodeURIComponent(currentUser)}&user2=${encodeURIComponent(receiver)}`
//         );
//         const history = await res.json();
//         if (isMounted) {
//           const processed = history.map((m) => ({ ...m, id: createMessageId(m) }));
//           processed.forEach((m) => messageIdsRef.current.add(m.id));
//           setMessages(processed);
//           scrollToBottom();
//         }
//       } catch (err) {
//         console.error("Error loading private messages:", err);
//       }
//     };

//     loadMessages();

//     // Register the private message handler for this receiver
//     registerPrivateMessageHandler(receiver, handleIncomingPrivateMessage);

//     return () => {
//       isMounted = false;
//       unregisterPrivateMessageHandler(receiver);
//     };
//   }, [currentUser, receiver, registerPrivateMessageHandler, unregisterPrivateMessageHandler]);

//   const sendPrivateMessage = (e) => {
//     e.preventDefault();
//     if (!message.trim() || !stompClient.current?.connected) return;

//     const timeStamp = new Date().toISOString();
//     const privateMessage = {
//       sender: currentUser,
//       receiver,
//       content: message.trim(),
//       type: "PRIVATE_MESSAGE",
//       color: userColor,
//       timeStamp,
//     };

//     try {
//       // Correct send destination for private messages
//       stompClient.current.send(
//         "/app/chat.sendPrivateMessage",
//         {},
//         JSON.stringify(privateMessage)
//       );
//       setMessage("");
//       setShowEmojiPicker(false);
//       scrollToBottom();
//     } catch (error) {
//       console.error("Error sending private message", error);
//       messageIdsRef.current.delete(message);
//       alert("Connection lost. Message not sent.");
//     }
//   };

//    const addEmoji = (emoji) => {
//     setMessage((prev) => prev + emoji);
//     setShowEmojiPicker(false);
//   };

//   const formatTime = (ts) =>
//     ts
//       ? new Date(ts).toLocaleTimeString("en-US", {
         
//           hour12: true,
//           hour: "2-digit",
//           minute: "2-digit",         
//         })
//       : "";

//   return (
//     <div className="fixed bottom-6 right-6 w-96 h-[36rem] bg-card/95 backdrop-blur-sm border border-border rounded-2xl shadow-2xl flex flex-col z-50 animate-in slide-in-from-bottom-4 duration-300">
//       {/* Header */}
//       <div className="flex items-center justify-between p-5 border-b border-border bg-gradient-to-r from-primary/5 to-accent/5 rounded-t-2xl">
//         <div className="flex items-center space-x-3">
//           <div className="relative">
//             <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-bold text-lg shadow-lg">
//               {receiver.charAt(0).toUpperCase()}
//             </div>
//             {/* <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-card rounded-full shadow-sm animate-pulse"></div> */}
//           </div>
//           <div>
//             <h3 className="font-semibold text-foreground text-base">{receiver}</h3>
//             {/* <p className="text-sm text-muted-foreground">Active now</p> */}
//           </div>
//         </div>
//         <button 
//           onClick={onClose} 
//           className="w-10 h-10 rounded-full bg-secondary/80 hover:bg-destructive/80 text-secondary-foreground hover:text-destructive-foreground transition-all duration-200 flex items-center justify-center group shadow-sm"
//         >
//           <span className="text-lg group-hover:scale-110 transition-transform">✕</span>
//         </button>
//       </div>

//       {/* Messages */}
//       <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-gradient-to-b from-background/50 to-muted/20">
//         {messages.length === 0 ? (
//           <div className="text-center text-muted-foreground text-sm mt-16 space-y-4">
//             <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary/10 to-accent/10 rounded-full flex items-center justify-center mb-4 shadow-inner">
//               <span className="text-4xl">💬</span>
//             </div>
//             <p className="font-medium text-base">No messages yet</p>
//             <p className="text-xs opacity-75">Start the conversation with {receiver}!</p>
//           </div>
//         ) : (
//           messages.map((m, index) => {
//             const isCurrentUser = m.sender === currentUser;
//             return (
//               <div 
//                 key={m.id} 
//                 className={`flex flex-col animate-in fade-in-50 slide-in-from-${isCurrentUser ? 'right' : 'left'}-2 duration-300 ${
//                   isCurrentUser ? "items-end" : "items-start"
//                 }`}
//                 style={{ animationDelay: `${index * 30}ms` }}
//               >
//                 <div className="flex flex-col space-y-2 max-w-[80%]">
//                   <div className={`flex items-center space-x-2 ${isCurrentUser ? "justify-end" : "justify-start"}`}>
//                     <span className="font-medium text-xs text-muted-foreground">
//                       {isCurrentUser ? "You" : m.sender}
//                     </span>
//                     <span className="text-muted-foreground text-xs opacity-75">{formatTime(m.timeStamp)}</span>
//                   </div>
//                   <div className={`px-5 py-3 rounded-2xl shadow-md transition-all duration-200 hover:shadow-lg transform hover:scale-[1.02] ${
//                     isCurrentUser 
//                       ? "bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground rounded-br-md shadow-primary/20" 
//                       : "bg-gradient-to-br from-secondary via-secondary to-secondary/90 text-secondary-foreground rounded-bl-md border border-border/30 shadow-secondary/20"
//                   }`}>
//                     <p className="text-sm leading-relaxed font-medium">{m.content}</p>
//                   </div>
//                 </div>
//               </div>
//             );
//           })
//         )}
//         <div ref={messagesEndRef}></div>
//       </div>

//       {/* Emoji Picker */}
//       {showEmojiPicker && (
//         <div className="mx-5 mb-4 p-4 bg-popover/95 backdrop-blur-sm border border-border rounded-xl shadow-lg max-h-44 overflow-y-auto animate-in slide-in-from-bottom-2 duration-200">
//           <div className="grid grid-cols-8 gap-2">
//             {emojis.map(emoji => (
//               <button 
//                 key={emoji} 
//                 type="button" 
//                 onClick={() => addEmoji(emoji)} 
//                 className="w-10 h-10 hover:bg-accent rounded-lg transition-all duration-150 flex items-center justify-center text-lg hover:scale-110 transform shadow-sm hover:shadow-md"
//               >
//                 {emoji}
//               </button>
//             ))}
//           </div>
//         </div>
//       )}

//       {/* Input Section */}
//       <div className="p-5 border-t border-border bg-gradient-to-r from-card to-background/50 rounded-b-2xl">
//         <form onSubmit={sendPrivateMessage} className="flex items-end space-x-3">
//           <button 
//             type="button" 
//             onClick={() => setShowEmojiPicker(!showEmojiPicker)} 
//             className={`w-12 h-12 rounded-full transition-all duration-200 flex items-center justify-center text-xl hover:scale-105 shadow-md ${
//               showEmojiPicker 
//                 ? "bg-primary text-primary-foreground shadow-primary/30 scale-105" 
//                 : "bg-secondary hover:bg-accent text-secondary-foreground shadow-secondary/20"
//             }`}
//           >
//             😊
//           </button>
          
//           <div className="flex-1 relative">
//             <input
//               type="text"
//               value={message}
//               onChange={(e) => setMessage(e.target.value)}
//               placeholder={`Message ${receiver}...`}
//               className="w-full bg-input border border-border rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 placeholder:text-muted-foreground shadow-inner"
//               maxLength={500}
//             />
//             {message.length > 450 && (
//               <div className="absolute -top-7 right-3 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded-md shadow-sm">
//                 {message.length}/500
//               </div>
//             )}
//           </div>
          
//           <button 
//             type="submit" 
//             disabled={!message.trim()} 
//             className="w-12 h-12 bg-gradient-to-r from-primary to-primary/90 disabled:from-muted disabled:to-muted text-primary-foreground disabled:text-muted-foreground rounded-full hover:shadow-lg disabled:hover:shadow-none transition-all duration-200 flex items-center justify-center hover:scale-105 disabled:hover:scale-100 disabled:opacity-50 group shadow-md"
//           >
//             <svg 
//               className="w-5 h-5 transform group-hover:translate-x-0.5 transition-transform" 
//               fill="currentColor" 
//               viewBox="0 0 20 20"
//             >
//               <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/>
//             </svg>
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default PrivateChat;




import { useEffect, useRef, useState } from "react";

const PrivateChat = ({
  currentUser ,
  receiver,
  userColor,
  stompClient,
  onClose,
  registerPrivateMessageHandler,
  unregisterPrivateMessageHandler,
}) => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const messageIdsRef = useRef(new Set());

  const emojis = [
    "😀","😍","🥰","😘","😎","🤪","🤨","🥳","🤩","😡","😭","😩","🥵","🥶","🤡","☠️","👀","🐹","🐶","🔥","🌚","🍭","🎂","🧁","🏏","⚽","❤️","🖤","💛","😊","😇","🥹","😅","🙂","🤑","🫶","🤝"
  ];

  // Scroll the messages container to bottom smoothly
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  const createMessageId = (mesg) =>
    `${mesg.sender}-${mesg.receiver}-${mesg.content}-${mesg.timeStamp}`;

  // Handler for incoming private messages
  const handleIncomingPrivateMessage = (privateMessage) => {
    const messageId = privateMessage.id || createMessageId(privateMessage);
    const relevant =
      (privateMessage.sender === currentUser  && privateMessage.receiver === receiver) ||
      (privateMessage.sender === receiver && privateMessage.receiver === currentUser );

    if (relevant && !messageIdsRef.current.has(messageId)) {
      const newMessage = { ...privateMessage, id: messageId };
      messageIdsRef.current.add(messageId);
      setMessages((prev) => [...prev, newMessage]);
      scrollToBottom();
    }
  };

  // Load messages and register handler on receiver change
  useEffect(() => {
    if (!currentUser  || !receiver) return;

    let isMounted = true;

    // Clear previous messages and IDs when receiver changes
    setMessages([]);
    messageIdsRef.current.clear();

    const loadMessages = async () => {
      try {
        const res = await fetch(
          `http://localhost:8080/api/messages/private?user1=${encodeURIComponent(currentUser )}&user2=${encodeURIComponent(receiver)}`
        );
        const history = await res.json();
        if (isMounted) {
          const processed = history.map((m) => ({ ...m, id: createMessageId(m) }));
          processed.forEach((m) => messageIdsRef.current.add(m.id));
          setMessages(processed);
          // Scroll after messages are set
          setTimeout(() => {
            scrollToBottom();
          }, 100);
        }
      } catch (err) {
        console.error("Error loading private messages:", err);
      }
    };

    loadMessages();

    // Register the private message handler for this receiver
    registerPrivateMessageHandler(receiver, handleIncomingPrivateMessage);

    return () => {
      isMounted = false;
      unregisterPrivateMessageHandler(receiver);
    };
  }, [currentUser , receiver, registerPrivateMessageHandler, unregisterPrivateMessageHandler]);

  // Scroll to bottom whenever messages change (e.g., new message sent or received)
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendPrivateMessage = (e) => {
    e.preventDefault();
    if (!message.trim() || !stompClient.current?.connected) return;

    const timeStamp = new Date().toISOString();
    const privateMessage = {
      sender: currentUser ,
      receiver,
      content: message.trim(),
      type: "PRIVATE_MESSAGE",
      color: userColor,
      timeStamp,
    };

    try {
      // Correct send destination for private messages
      stompClient.current.send(
        "/app/chat.sendPrivateMessage",
        {},
        JSON.stringify(privateMessage)
      );
      setMessage("");
      setShowEmojiPicker(false);
      // scrollToBottom(); // This will be handled by messages update effect
    } catch (error) {
      console.error("Error sending private message", error);
      messageIdsRef.current.delete(message);
      alert("Connection lost. Message not sent.");
    }
  };

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
    <div className="fixed bottom-6 right-6 w-96 h-[36rem] bg-card/95 backdrop-blur-sm border border-border rounded-2xl shadow-2xl flex flex-col z-50 animate-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-border bg-gradient-to-r from-primary/5 to-accent/5 rounded-t-2xl">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-bold text-lg shadow-lg">
              {receiver.charAt(0).toUpperCase()}
            </div>
            {/* <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-card rounded-full shadow-sm animate-pulse"></div> */}
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-base">{receiver}</h3>
            {/* <p className="text-sm text-muted-foreground">Active now</p> */}
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="w-10 h-10 rounded-full bg-secondary/80 hover:bg-destructive/80 text-secondary-foreground hover:text-destructive-foreground transition-all duration-200 flex items-center justify-center group shadow-sm"
        >
          <span className="text-lg group-hover:scale-110 transition-transform">✕</span>
        </button>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 p-5 overflow-y-auto space-y-4 bg-gradient-to-b from-background/50 to-muted/20"
      >
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm mt-16 space-y-4">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary/10 to-accent/10 rounded-full flex items-center justify-center mb-4 shadow-inner">
              <span className="text-4xl">💬</span>
            </div>
            <p className="font-medium text-base">No messages yet</p>
            <p className="text-xs opacity-75">Start the conversation with {receiver}!</p>
          </div>
        ) : (
          messages.map((m, index) => {
            const isCurrentUser  = m.sender === currentUser ;
            return (
              <div 
                key={m.id} 
                className={`flex flex-col animate-in fade-in-50 slide-in-from-${isCurrentUser  ? 'right' : 'left'}-2 duration-300 ${
                  isCurrentUser  ? "items-end" : "items-start"
                }`}
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div className="flex flex-col space-y-2 max-w-[80%]">
                  <div className={`flex items-center space-x-2 ${isCurrentUser  ? "justify-end" : "justify-start"}`}>
                    <span className="font-medium text-xs text-muted-foreground">
                      {isCurrentUser  ? "You" : m.sender}
                    </span>
                    <span className="text-muted-foreground text-xs opacity-75">{formatTime(m.timeStamp)}</span>
                  </div>
                  <div className={`px-5 py-3 rounded-2xl shadow-md transition-all duration-200 hover:shadow-lg transform hover:scale-[1.02] ${
                    isCurrentUser  
                      ? "bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground rounded-br-md shadow-primary/20" 
                      : "bg-gradient-to-br from-secondary via-secondary to-secondary/90 text-secondary-foreground rounded-bl-md border border-border/30 shadow-secondary/20"
                  }`}>
                    <p className="text-sm leading-relaxed font-medium">{m.content}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef}></div>
      </div>

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

      {/* Input Section */}
      <div className="p-5 border-t border-border bg-gradient-to-r from-card to-background/50 rounded-b-2xl">
        <form onSubmit={sendPrivateMessage} className="flex items-end space-x-3">
          <button 
            type="button" 
            onClick={() => setShowEmojiPicker(!showEmojiPicker)} 
            className={`w-12 h-12 rounded-full transition-all duration-200 flex items-center justify-center text-xl hover:scale-105 shadow-md ${
              showEmojiPicker 
                ? "bg-primary text-primary-foreground shadow-primary/30 scale-105" 
                : "bg-secondary hover:bg-accent text-secondary-foreground shadow-secondary/20"
            }`}
          >
            😊
          </button>
          
          <div className="flex-1 relative">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Message ${receiver}...`}
              className="w-full bg-input border border-border rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 placeholder:text-muted-foreground shadow-inner"
              maxLength={500}
            />
            {message.length > 450 && (
              <div className="absolute -top-7 right-3 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded-md shadow-sm">
                {message.length}/500
              </div>
            )}
          </div>
          
          <button 
            type="submit" 
            disabled={!message.trim()} 
            className="w-12 h-12 bg-gradient-to-r from-primary to-primary/90 disabled:from-muted disabled:to-muted text-primary-foreground disabled:text-muted-foreground rounded-full hover:shadow-lg disabled:hover:shadow-none transition-all duration-200 flex items-center justify-center hover:scale-105 disabled:hover:scale-100 disabled:opacity-50 group shadow-md"
          >
            <svg 
              className="w-5 h-5 transform group-hover:translate-x-0.5 transition-transform" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/>
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default PrivateChat;

