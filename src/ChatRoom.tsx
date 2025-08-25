// src/components/ChatRoom.tsx

import React, { useState, useEffect, useRef } from "react"; // ADDED: useRef
import { getMessages } from "./graphql/queries";
import { onNewMessage } from "./graphql/subscriptions";
import { sendMessage } from "./graphql/mutations";
import type { Message, OnNewMessageSubscription } from "./API";
import { client } from "./amplifyConfig";
import styles from "./ChatRoom.module.css";

interface ChatRoomProps {
  chatroomId: string;
  currentUserId: string;
  onLeaveChat: () => void;
}

function ChatRoom({ chatroomId, currentUserId, onLeaveChat }: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [participantNames, setParticipantNames] = useState<
    Record<string, string>
  >({});
  const [userColors, setUserColors] = useState<Record<string, string>>({});

  // ADDED: Create a ref for the messages container
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Generate a consistent color for each user based on their ID
  const generateUserColor = (userId: string): string => {
    const colors = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#F9A826",
      "#6A0572",
      "#AB83A1",
      "#4CAF50",
      "#FF9800",
      "#795548",
      "#607D8B",
      "#9C27B0",
      "#3F51B5",
    ];

    // Simple hash function for consistent color assignment
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  };

  // Generate friendly names for participants
  const generateFriendlyNames = (messages: Message[]) => {
    const namesMap: Record<string, string> = {};
    const colorsMap: Record<string, string> = {};
    const seenUserIds = new Set<string>();
    let playerCount = 1;

    // Collect all unique user IDs from messages
    messages.forEach((message) => {
      if (message.senderId && !seenUserIds.has(message.senderId)) {
        seenUserIds.add(message.senderId);

        // Generate color for each participant
        colorsMap[message.senderId] = generateUserColor(message.senderId);

        if (message.senderId === currentUserId) {
          namesMap[message.senderId] = "You";
        } else if (message.senderId.startsWith("ai-")) {
          // Disguise AI as a normal player with a random name
          const aiNames = [
            "Alex",
            "Jordan",
            "Taylor",
            "Casey",
            "Morgan",
            "Riley",
            "Jamie",
            "Quinn",
          ];
          const randomName =
            aiNames[Math.floor(Math.random() * aiNames.length)];
          namesMap[message.senderId] = randomName;
        } else {
          // Assign friendly names to other human players
          namesMap[message.senderId] = `Player ${playerCount++}`;
        }
      }
    });

    setParticipantNames(namesMap);
    setUserColors(colorsMap);
  };

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
        generateFriendlyNames(loadedMessages);
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [chatroomId, currentUserId]);

  useEffect(() => {
    if (!chatroomId) return;

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
          setMessages((prev) => {
            const updatedMessages = [...prev, newMessage as Message];
            // Update names when new participants appear
            generateFriendlyNames(updatedMessages);
            return updatedMessages;
          });
        }
      },
      error: (error) => console.warn("Subscription error:", error),
    });

    return () => subscription.unsubscribe();
  }, [chatroomId]);

  // ADDED: Effect to smoothly scroll to the bottom when new messages arrive
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

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

  // Format timestamp for display
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return <div className="loading-chat">Loading chat...</div>;
  }
  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatHeader}>
        <button onClick={onLeaveChat} className={styles.backButton}>
          ← Leave Chat
        </button>
        <h2>Chat Room</h2>
        <div className={styles.participantCount}>
          {Object.keys(participantNames).length} participants
        </div>
      </div>

      {/* ADDED: Attach the ref to the messages container div */}
      <div ref={messagesContainerRef} className={styles.messagesContainer}>
        {messages.map((message) => {
          const senderName = participantNames[message.senderId] || "Unknown";
          const senderColor = userColors[message.senderId] || "#666";
          const isCurrentUser = message.senderId === currentUserId;

          return (
            <div
              key={message.id}
              className={`${styles.message} ${
                isCurrentUser ? styles.messageOwn : styles.messageOther
              }`}
            >
              <div className={styles.messageHeader}>
                <span
                  className={styles.senderName}
                  style={{ color: senderColor }}
                >
                  {senderName}
                </span>
                <span className={styles.messageTime}>
                  {message.createdAt
                    ? formatTime(message.createdAt)
                    : "Sending..."}
                </span>
              </div>
              <p className={styles.messageText}>{message.text}</p>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSendMessage} className={styles.messageForm}>
        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Type a message..."
          className={styles.messageInput}
        />
        <button type="submit" className={styles.sendButton}>
          Send
        </button>
      </form>
    </div>
  );
}

export default ChatRoom;
