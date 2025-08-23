// src/components/ChatRoom.tsx

import React, { useState, useEffect } from "react";

import { getMessages } from "./graphql/queries";
import { onNewMessage } from "./graphql/subscriptions";
import { sendMessage } from "./graphql/mutations";
import type { Message, OnNewMessageSubscription } from "./API";
import { client } from "./amplifyConfig";


interface ChatRoomProps {
  chatroomId: string;
  currentUserId: string;
  onLeaveChat: () => void;
}

function ChatRoom({ chatroomId, currentUserId, onLeaveChat }: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);

  // Effect to fetch initial messages
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await client.graphql({
          query: getMessages,
          variables: { chatroomId: chatroomId },
        });
        const loadedMessages = (response.data?.getMessages || []).filter(
          (m): m is Message => m !== null
        );
        setMessages(loadedMessages);
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [chatroomId]);

  useEffect(() => {
    if (!chatroomId) return; // Only run if we have a chatroom

    const observable = client.graphql({
      query: onNewMessage,
      variables: { chatroomId: chatroomId },
    }) as unknown as {
      subscribe: (options: {
        next: (value: { data: OnNewMessageSubscription }) => void;
        error: (error: any) => void;
      }) => { unsubscribe: () => void };
    };

    const subscription = observable.subscribe({
      next: ({ data }) => {
        const newMessage = data.onNewMessage;
        if (newMessage) {
          setMessages((prev) => [...prev, newMessage as Message]);
        }
      },
      error: (error) => console.warn("Subscription error:", error),
    });

    return () => subscription.unsubscribe();
  }, [chatroomId]); // Only depend on chatroomId now

  const handleSendMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (messageText.trim() === "" || !currentUserId) return;

    try {
      await client.graphql({
        query: sendMessage,
        variables: {
          chatroomId: chatroomId,
          senderId: currentUserId,
          text: messageText,
        },
      });
      setMessageText("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  if (loading) {
    return <div>Loading chat...</div>;
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <button onClick={onLeaveChat} className="back-button">
          ← Leave Chat
        </button>
        <h2>Chat Room: {chatroomId.slice(0, 8)}...</h2>
      </div>
      <div className="messages-container">
        {messages.map((message) => (
          <div key={message.id} className="message">
            <p>
              <strong>
                {message.senderId === currentUserId ? "You" : message.senderId}:
              </strong>{" "}
              {message.text}
            </p>
          </div>
        ))}
      </div>
      <form onSubmit={handleSendMessage} className="message-form">
        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)} // Corrected from e.targetValue
          placeholder="Type a message..."
          className="message-input"
        />
        <button type="submit" className="send-button">
          Send
        </button>
      </form>
    </div>
  );
}

export default ChatRoom;
