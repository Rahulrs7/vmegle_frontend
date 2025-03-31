"use client";  // Add this line at the top

import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import EmojiPicker from "emoji-picker-react";
import styles from "./page.module.css";

// Your component code remains the same...


const ChatApp = () => {
  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [connected, setConnected] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const emojiPickerRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (socket) socket.disconnect();
    };
  }, [socket]);

  const startNewChat = () => {
    if (socket) socket.disconnect();
    const newSocket = io("https://vmegle-backend.onrender.com/");
    setSocket(newSocket);
    setMessages([{ text: "Connecting you to a user...", sender: "system" }]);
    setConnected(true);

    newSocket.on("connect", () => {
      newSocket.once("paired", (data) => {
        setRoomId(data.roomId);
        setMessages([{ text: "Connected to a random user.", sender: "system" }]);
      });

      newSocket.on("message", (data) => {
        setMessages((prev) => [...prev, { text: data.message, sender: "stranger" }]);
      });

      newSocket.on("strangerDisconnected", () => {
        setMessages((prev) => [...prev, { text: "Stranger disconnected.", sender: "system" }]);
        endChat();
      });
    });
  };

  const sendMessage = () => {
    if (message.trim() && roomId && socket) {
      socket.emit("message", { roomId, message });
      setMessages((prev) => [...prev, { text: `You: ${message}`, sender: "self" }]);
      setMessage("");
    }
  };

  const endChat = () => {
    if (socket) socket.disconnect();
    setSocket(null);
    setConnected(false);
  };

  const handleEmojiClick = (emojiObject) => {
    setMessage((prevMessage) => prevMessage + emojiObject.emoji);
  };

  return (
    <div className={styles.chatContainer}>
      <header>
        <h1>Vmegle</h1>
      </header>
      {!connected ? (
        <div className={styles.welcome}>
          <p>Welcome to Vmegle! Click below to start a new chat.</p>
          <button onClick={startNewChat}>New Chat</button>
        </div>
      ) : (
        <div className={styles.chatRoom}>
  <div className={styles.messages}>
    {messages.map((msg, index) => (
      <p key={index} className={`${styles.message} ${styles[msg.sender]}`}>{msg.text}</p>
    ))}
    <div ref={messagesEndRef} />
  </div>

  {/* Emoji Picker - Move it outside inputContainer */}
  {showEmojiPicker && (
    <div ref={emojiPickerRef} className={styles.emojiPicker}>
      <EmojiPicker onEmojiClick={handleEmojiClick} />
    </div>
  )}

  <div className={styles.inputContainer}>
    <input
      type="text"
      value={message}
      onChange={(e) => setMessage(e.target.value)}
      onKeyDown={(e) => e.key === "Enter" && sendMessage()}
      placeholder="Type your message..."
    />
    <button className={styles.emojiBtn} onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
      😀
    </button>
    <button className={styles.sendbtn} onClick={sendMessage}>Send</button>
    <button className={styles.exitbtn} onClick={endChat}>Exit Chat</button>
  </div>
</div>

      )}
    </div>
  );
};

export default ChatApp;
