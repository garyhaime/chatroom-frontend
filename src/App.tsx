import React, { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/api";
import { Amplify } from "aws-amplify";
import awsConfig from "./aws-exports";

Amplify.configure(awsConfig);
import { getMessages } from "./graphql/queries";
import { onNewMessage } from "./graphql/subscriptions";
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

const sendMessage = /* GraphQL */ `
  mutation SendMessage(
    $chatroomId: String!
    $text: String!
    $senderId: String!
  ) {
    sendMessage(chatroomId: $chatroomId, text: $text, senderId: $senderId) {
      id
      chatroomId
      text
      senderId
      createdAt
      __typename
    }
  }
`;

const CHATROOM_ID = "c5c0a5e8-5b12-4f30-8a1a-0d674b884941";
const CURRENT_USER_ID = "user-12345";

const client = generateClient();

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);

  // Effect to fetch initial messages - FIXED
  useEffect(() => {
    const fetchData = async () => {
      try {
        const messageData = await client.graphql<GetMessagesQuery>({
          query: getMessages,
          variables: { chatroomId: CHATROOM_ID },
        });

        // Check if data exists and handle the response properly
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
  }, []);

  // Effect to subscribe to new messages
  useEffect(() => {
    // Use a type assertion to handle the subscription properly
    const observable = client.graphql({
      query: onNewMessage,
      variables: { chatroomId: CHATROOM_ID },
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
  }, []);

  // Handler for sending a message
  const handleSendMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (messageText.trim() === "") return;

    const messageDetails = {
      chatroomId: CHATROOM_ID,
      senderId: CURRENT_USER_ID,
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

  if (loading) {
    return <div>Loading messages...</div>;
  }

  return (
    <div>
      <h1>Chatroom Logic Active</h1>
      <div>
        <h2>Messages:</h2>
        {messages.map((message) => (
          <div key={message.id}>
            <p>
              <strong>{message.senderId}:</strong> {message.text}
              <br />
              <small>{new Date(message.createdAt).toLocaleString()}</small>
            </p>
          </div>
        ))}
      </div>
      <form onSubmit={handleSendMessage}>
        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

export default App;
