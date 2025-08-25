import React, { useState, useEffect, useRef } from "react";
import { getMessages } from "./graphql/queries";
import { onNewMessage } from "./graphql/subscriptions";
import { sendMessage } from "./graphql/mutations";
import type { Message, OnNewMessageSubscription } from "./API";
import { client } from "./amplifyConfig";
import styles from "./ChatRoom.module.css";
import VoteModal from "./components/VoteModal"; // Import the modal component

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
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [isGameOver, setIsGameOver] = useState(false);

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
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // =============== MODIFIED FUNCTION START ===============
  // Generate friendly names for participants
  const generateFriendlyNames = (messages: Message[]) => {
    const namesMap: Record<string, string> = {};
    const colorsMap: Record<string, string> = {};
    const seenUserIds = new Set<string>();
    let playerCount = 1;

    messages.forEach((message) => {
      if (message.senderId && !seenUserIds.has(message.senderId)) {
        seenUserIds.add(message.senderId);
        colorsMap[message.senderId] = generateUserColor(message.senderId);

        if (message.senderId === currentUserId) {
          namesMap[message.senderId] = "You";
        } else {
          // This block now applies to BOTH the AI and other human players,
          // making the AI indistinguishable by name.
          namesMap[message.senderId] = `Player ${playerCount++}`;
        }
      }
    });

    setParticipantNames(namesMap);
    setUserColors(colorsMap);
  };
  // =============== MODIFIED FUNCTION END ===============

  // Timer effect
  useEffect(() => {
    if (timeLeft <= 0) {
      setIsGameOver(true);
      return;
    }
    const timerId = setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);
    return () => clearInterval(timerId);
  }, [timeLeft]);

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

  // Effect for new message subscriptions
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
            generateFriendlyNames(updatedMessages);
            return updatedMessages;
          });
        }
      },
      error: (error) => console.warn("Subscription error:", error),
    });
    return () => subscription.unsubscribe();
  }, [chatroomId]);

  // Effect to scroll to the bottom when new messages arrive
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  // Handle sending a message
  const handleSendMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (messageText.trim() === "" || !currentUserId || isGameOver) return;
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

  // Handle the voting submission
  const handleVote = (votedUserId: string) => {
    const votedParticipant = participantNames[votedUserId] || "Unknown";
    const isAi = votedUserId.startsWith("ai-");
    alert(
      `You voted for ${votedParticipant}. This was ${
        isAi ? "correct!" : "incorrect."
      }`
    );
  };

  // Format timestamp for display
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format the timer display
  const formatTimer = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };

  if (loading) {
    return <div className="loading-chat">Loading chat...</div>;
  }

  // Create a list of other participants for the voting modal
  const otherParticipants = Object.entries(participantNames)
    .filter(([id]) => id !== currentUserId)
    .reduce((acc, [id, name]) => {
      acc[id] = name;
      return acc;
    }, {} as Record<string, string>);

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatHeader}>
        <button onClick={onLeaveChat} className={styles.backButton}>
          ← Leave Chat
        </button>
        <h2>Time Left: {formatTimer(timeLeft)}</h2>
        <div className={styles.participantCount}>
          {Object.keys(participantNames).length} participants
        </div>
      </div>

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
          placeholder={isGameOver ? "Time's up!" : "Type a message..."}
          className={styles.messageInput}
          disabled={isGameOver}
        />
        <button
          type="submit"
          className={styles.sendButton}
          disabled={isGameOver}
        ></button>
      </form>

      {isGameOver && (
        <VoteModal participants={otherParticipants} onVote={handleVote} />
      )}
    </div>
  );
}

export default ChatRoom;
