import "./amplifyConfig";
import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/api";

import WaitingRoom from "./WaitingRoom"; // Import WaitingRoom component
import ChatRoom from "./ChatRoom"; // Import ChatRoom component

import { getMessages } from "./graphql/queries";
import { onNewMessage } from "./graphql/subscriptions";

import type { GetMessagesQuery, OnNewMessageSubscription } from "./API";

type Message = {
  id: string;
  text: string;
  senderId: string;
  createdAt: string;
};

const client = generateClient();

function App() {
  const [currentView, setCurrentView] = useState<"waiting" | "chat">("waiting");
  const [chatroomId, setChatroomId] = useState<string>("");
  const [currentUserId, setCurrentUserId] = useState<string>("");

  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);

  // Chat Functions
  useEffect(() => {
    if (currentView !== "chat" || !chatroomId) return;
    messages;
    messageText;
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

  const handleLeaveChat = () => {
    setCurrentView("waiting");
    setChatroomId("");
    setMessages([]);
    setMessageText("");
    setLoading(true);
  };

  if (currentView === "waiting") {
    return (
      <WaitingRoom
        setCurrentView={setCurrentView}
        setChatroomId={setChatroomId}
        setCurrentUserId={setCurrentUserId}
      />
    );
  }

  if (loading) {
    return <div>Loading messages...</div>;
  }

  return (
    <ChatRoom
      chatroomId={chatroomId}
      currentUserId={currentUserId}
      onLeaveChat={handleLeaveChat}
    />
  );
}

export default App;
