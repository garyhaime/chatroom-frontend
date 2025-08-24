import { useState } from "react";
import WaitingRoom from "./WaitingRoom"; // Import WaitingRoom component
import ChatRoom from "./ChatRoom"; // Import ChatRoom component
import styles from "./App.module.css";

type Message = {
  id: string;
  text: string;
  senderId: string;
  createdAt: string;
};

function App() {
  const [currentView, setCurrentView] = useState<"waiting" | "chat">("waiting");
  const [chatroomId, setChatroomId] = useState<string>("");
  const [currentUserId, setCurrentUserId] = useState<string>("");

  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);

  loading;
  messages;
  messageText;
  const handleLeaveChat = () => {
    setCurrentView("waiting");
    setChatroomId("");
    setMessages([]);
    setMessageText("");
    setLoading(true);
  };

  if (currentView === "waiting") {
    return (
      <div className={styles.appContainer}>
        <WaitingRoom
          setCurrentView={setCurrentView}
          setChatroomId={setChatroomId}
          setCurrentUserId={setCurrentUserId}
        />
      </div>
    );
  }

  return (
    <div className={styles.appContainer}>
      <ChatRoom
        chatroomId={chatroomId}
        currentUserId={currentUserId}
        onLeaveChat={handleLeaveChat}
      />
    </div>
  );
}

export default App;
