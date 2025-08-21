import React, { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/api";

import { getMessages } from "./graphql/queries";
import { onNewMessage } from "./graphql/subscriptions";
import { sendMessage } from "./graphql/mutations";
import type {
  GetMessagesQuery,
  OnNewMessageSubscription,
  SendMessageMutation,
} from "./API";

type Message = {
  id: string;
  text: string;
  senderId: string;
  createdAt: string;
};

const client = generateClient();

// Waiting room API URL - you'll need to set this in your .env file
const WAITING_ROOM_API_URL =
  import.meta.env.VITE_WAITING_ROOM_API_URL ||
  "https://your-waiting-room-api-url.amazonaws.com/prod";

function App() {
  const [currentView, setCurrentView] = useState<"waiting" | "chat">("waiting");
  const [chatroomId, setChatroomId] = useState<string>("");
  const [currentUserId, setCurrentUserId] = useState<string>("");

  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [waitingStatus, setWaitingStatus] = useState(
    "Join the waiting room to find players"
  );
  const [waitTime, setWaitTime] = useState(0);
  const [isWaiting, setIsWaiting] = useState(false);

  // Waiting Room Functions
  const joinWaitingRoom = async () => {
    try {
      setWaitingStatus("Joining waiting room...");
      setIsWaiting(true);

      const response = await fetch(`${WAITING_ROOM_API_URL}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setCurrentUserId(data.userId);
      setWaitingStatus("Waiting for other players...");
      setWaitTime(0);
    } catch (error) {
      console.error("Error joining waiting room:", error);
      setWaitingStatus("Failed to join waiting room. Please try again.");
      setIsWaiting(false);
    }
  };

  const leaveWaitingRoom = async () => {
    if (currentUserId) {
      try {
        await fetch(`${WAITING_ROOM_API_URL}/leave?userId=${currentUserId}`, {
          method: "DELETE",
        });
      } catch (error) {
        console.error("Error leaving waiting room:", error);
      }
    }
    setIsWaiting(false);
    setCurrentUserId("");
    setWaitingStatus("Join the waiting room to find players");
    setWaitTime(0);
  };

  const startPollingForMatch = (userId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const statusResponse = await fetch(
          `${WAITING_ROOM_API_URL}/status?userId=${userId}`
        );
        const statusData = await statusResponse.json();

        if (statusData.status === "matched" && statusData.chatroomId) {
          clearInterval(pollInterval);
          setChatroomId(statusData.chatroomId);
          setCurrentView("chat");
        }

        setWaitTime((prev) => prev + 1);
      } catch (error) {
        console.error("Error polling for match:", error);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  };

  useEffect(() => {
    let pollCleanup: (() => void) | undefined;

    if (currentUserId && isWaiting) {
      pollCleanup = startPollingForMatch(currentUserId);
    }

    return () => {
      if (pollCleanup) pollCleanup();
    };
  }, [currentUserId, isWaiting]);

  // Chat Functions (your existing code)
  useEffect(() => {
    if (currentView !== "chat" || !chatroomId) return;

    const fetchData = async () => {
      try {
        const messageData = await client.graphql<GetMessagesQuery>({
          query: getMessages,
          variables: { chatroomId: chatroomId },
        });

        if ("data" in messageData) {
          const loadedMessages = (messageData.data?.getMessages || []).filter(
            (m: Message | null): m is Message => m !== null
          );
          setMessages(loadedMessages);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [chatroomId, currentView]);

  useEffect(() => {
    if (currentView !== "chat" || !chatroomId) return;

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
      error: (error) => console.warn(error),
    });

    return () => subscription.unsubscribe();
  }, [chatroomId, currentView]);

  const handleSendMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (messageText.trim() === "") return;

    const messageDetails = {
      chatroomId: chatroomId,
      senderId: currentUserId,
      text: messageText,
    };

    try {
      await client.graphql<SendMessageMutation>({
        query: sendMessage,
        variables: messageDetails,
      });
      setMessageText("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleLeaveChat = () => {
    setCurrentView("waiting");
    setChatroomId("");
    setMessages([]);
    setMessageText("");
    setLoading(true);
    leaveWaitingRoom();
  };

  if (currentView === "waiting") {
    return (
      <div className="waiting-room">
        <div className="waiting-room-content">
          <h2>🎮 Waiting Room</h2>

          {!isWaiting ? (
            <div className="join-section">
              <p>Find other players to chat with!</p>
              <button onClick={joinWaitingRoom} className="join-button">
                Join Waiting Room
              </button>
            </div>
          ) : (
            <div className="waiting-section">
              <div className="loading-spinner"></div>
              <p className="status">{waitingStatus}</p>
              <p className="wait-time">Waiting for {waitTime} seconds...</p>
              <p className="user-id">Your ID: {currentUserId}</p>
              <button onClick={leaveWaitingRoom} className="leave-button">
                Leave Waiting Room
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    return <div>Loading messages...</div>;
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <button onClick={handleLeaveChat} className="back-button">
          ← Leave Chat
        </button>
        <h2>Chat Room: {chatroomId.slice(0, 8)}...</h2>
      </div>

      <div className="messages-container">
        <h2>Messages:</h2>
        {messages.map((message) => (
          <div key={message.id} className="message">
            <p>
              <strong>{message.senderId}:</strong> {message.text}
              <br />
              <small>{new Date(message.createdAt).toLocaleString()}</small>
            </p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSendMessage} className="message-form">
        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
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

export default App;
