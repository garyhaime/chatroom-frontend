import React, { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/api";
import { Amplify } from "aws-amplify";

import { getMessages } from "./graphql/queries";
import { onNewMessage } from "./graphql/subscriptions";
import { sendMessage } from "./graphql/mutations";
import {
  joinWaitingRoom as joinWaitingRoomMutation,
  leaveWaitingRoom as leaveWaitingRoomMutation,
} from "./graphql/mutations";
import { onMatchFound } from "./graphql/subscriptions";

import type {
  GetMessagesQuery,
  OnNewMessageSubscription,
  SendMessageMutation,
  JoinWaitingRoomMutation,
  LeaveWaitingRoomMutation,
} from "./API";

type Message = {
  id: string;
  text: string;
  senderId: string;
  createdAt: string;
};

// Configure Amplify
const awsConfig = {
  aws_project_region: import.meta.env.VITE_AWS_REGION,
  aws_appsync_graphqlEndpoint: import.meta.env.VITE_APPSYNC_ENDPOINT,
  aws_appsync_region: import.meta.env.VITE_AWS_REGION,
  aws_appsync_authenticationType: "API_KEY",
  aws_appsync_apiKey: import.meta.env.VITE_APPSYNC_API_KEY,
};

Amplify.configure(awsConfig);

const client = generateClient();

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

  // Waiting Room Functions using AppSync
  const joinWaitingRoom = async () => {
    try {
      setWaitingStatus("Joining waiting room...");
      setIsWaiting(true);

      // Use AppSync mutation instead of fetch
      const response = await client.graphql<JoinWaitingRoomMutation>({
        query: joinWaitingRoomMutation,
        variables: {},
      });

      console.log("Join response:", response);

      if ("data" in response && response.data?.joinWaitingRoom) {
        const userId = response.data.joinWaitingRoom.userId;
        setCurrentUserId(userId);
        setWaitingStatus("Waiting for other players...");
        setWaitTime(0);

        // If immediately matched (for testing)
        if (response.data.joinWaitingRoom.chatroomId) {
          setChatroomId(response.data.joinWaitingRoom.chatroomId);
          setCurrentView("chat");
        }
      }
    } catch (error) {
      console.error("Error joining waiting room:", error);
      setWaitingStatus("Failed to join waiting room. Please try again.");
      setIsWaiting(false);
    }
  };

  const leaveWaitingRoom = async () => {
    if (currentUserId) {
      try {
        await client.graphql<LeaveWaitingRoomMutation>({
          query: leaveWaitingRoomMutation,
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

  // Use AppSync subscription for real-time matching
  useEffect(() => {
    if (!currentUserId || !isWaiting) return;

    const subscription = client
      .graphql({
        query: onMatchFound,
      })
      .subscribe({
        next: ({ data }) => {
          console.log("Match subscription data:", data);
          if (data?.onMatchFound?.chatroomId) {
            setChatroomId(data.onMatchFound.chatroomId);
            setCurrentView("chat");
          }
        },
        error: (error: any) => {
          console.error("Match subscription error:", error);
        },
      });

    return () => subscription.unsubscribe();
  }, [currentUserId, isWaiting]);

  // // Fallback polling function (optional)
  // const startPollingForMatch = () => {
  //   const pollInterval = setInterval(async () => {
  //     try {
  //       setWaitTime((prev) => prev + 1);
  //     } catch (error) {
  //       console.error("Error polling for match:", error);
  //     }
  //   }, 3000);

  //   return () => clearInterval(pollInterval);
  // };

  // Chat Functions
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
