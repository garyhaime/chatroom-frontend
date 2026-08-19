import React, { useState, useEffect, useRef } from "react";
import { getMessages } from "./graphql/queries";
import { onNewMessage } from "./graphql/subscriptions";
import { sendMessage } from "./graphql/mutations";
import type { Message, OnNewMessageSubscription } from "./API";
import { client } from "./amplifyConfig";
import styles from "./ChatRoom.module.css";
import VoteModal from "./components/VoteModal"; // Import the new modal component

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

  // --- NEW: State for timer and game-over logic ---
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [isGameOver, setIsGameOver] = useState(false);
  const [subscriptionConnected, setSubscriptionConnected] = useState(true);

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

  // Generate friendly names for participants
  const generateFriendlyNames = (messages: Message[]) => {
    const namesMap: Record<string, string> = {};
    const colorsMap: Record<string, string> = {};

    // Sort by creation time so numbering follows who spoke first
    const sortedMessages = [...messages].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return aTime - bTime;
    });

    // Assign Player 1, 2, 3... in order of first message
    let playerNumber = 1;
    sortedMessages.forEach((message) => {
      const senderId = message.senderId;
      if (senderId && !namesMap[senderId]) {
        colorsMap[senderId] = generateUserColor(senderId);
        namesMap[senderId] = `Player ${playerNumber++}`;
      }
    });

    setParticipantNames(namesMap);
    setUserColors(colorsMap);
  };

  // --- NEW: Timer effect ---
  useEffect(() => {
    if (timeLeft <= 0) {
      setIsGameOver(true);
      return;
    }

    const timerId = setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);

    return () => clearInterval(timerId); // Cleanup interval on component unmount
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
          setSubscriptionConnected(true); // Mark as connected when receiving messages
          setMessages((prev) => {
            // Remove any temporary optimistic message for the same content from same sender
            const filtered = prev.filter(
              (msg) => 
                !(msg.id.startsWith('temp-') && 
                  msg.senderId === newMessage.senderId && 
                  msg.text === newMessage.text)
            );
            
            // Prevent duplicate messages with real IDs
            const exists = filtered.some((msg) => msg.id === newMessage.id);
            if (exists) return prev;
            
            const updatedMessages = [...filtered, newMessage as Message];
            generateFriendlyNames(updatedMessages);
            return updatedMessages;
          });
        }
      },
      error: (error) => {
        console.warn("Subscription error:", error);
        setSubscriptionConnected(false); // Mark as disconnected on error
      },
    });

    return () => subscription.unsubscribe();
  }, [chatroomId]);

  // Polling mechanism as backup to subscription (handles WebSocket drops)
  useEffect(() => {
    if (!chatroomId) return;

    const pollMessages = async () => {
      try {
        const response = await client.graphql({
          query: getMessages,
          variables: { chatroomId: chatroomId },
        });
        const loadedMessages = (response.data?.getMessages || []).filter(
          (m): m is Message => m !== null
        );
        
        setMessages((prev) => {
          // Only update if there are new messages
          if (loadedMessages.length > prev.length) {
            // Merge messages, avoiding duplicates
            const messageMap = new Map(prev.map(msg => [msg.id, msg]));
            loadedMessages.forEach(msg => messageMap.set(msg.id, msg));
            const updatedMessages = Array.from(messageMap.values())
              .sort((a, b) => 
                new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
              );
            generateFriendlyNames(updatedMessages);
            return updatedMessages;
          }
          return prev;
        });
      } catch (error) {
        console.error("Error polling messages:", error);
      }
    };

    // Poll every 2 seconds
    const pollInterval = setInterval(pollMessages, 2000);

    return () => clearInterval(pollInterval);
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

    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      chatroomId: chatroomId,
      senderId: currentUserId,
      text: messageText,
      createdAt: new Date().toISOString(),
    };

    // Optimistically add message to UI immediately
    setMessages((prev) => [...prev, optimisticMessage]);
    const sentText = messageText;
    setMessageText("");

    try {
      await client.graphql({
        query: sendMessage,
        variables: {
          chatroomId: chatroomId,
          senderId: currentUserId,
          text: sentText,
        },
      });
    } catch (error) {
      console.error("Error sending message:", error);
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== optimisticMessage.id));
      setMessageText(sentText); // Restore the message text
    }
  };

  // --- NEW: Handle the voting submission ---
  const handleVote = (votedUserId: string) => {
    const votedParticipant = participantNames[votedUserId] || "Unknown";
    const isAi = votedUserId.startsWith("ai-");

    alert(
      `You voted for ${votedParticipant}. This was ${
        isAi ? "correct!" : "incorrect."
      }`
    );
    // Here, you could add more complex logic, like showing a results screen,
    // storing the result, or navigating the user back to the waiting room.
  };

  // Format timestamp for display
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // --- NEW: Format the timer display ---
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
          {!subscriptionConnected && (
            <span style={{ color: "#FF6B6B", marginLeft: "10px", fontSize: "0.9em" }}>
              ⚠ Reconnecting...
            </span>
          )}
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
        >
          {/* The send icon is a CSS ::after element, so no text is needed here */}
        </button>
      </form>

      {/* --- NEW: Conditionally render the voting modal --- */}
      {isGameOver && (
        <VoteModal participants={otherParticipants} onVote={handleVote} />
      )}
    </div>
  );
}

export default ChatRoom;
