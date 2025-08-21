import { useState } from "react";
import "./WaitingRoom.css"; // Make sure you have this CSS file

// Get the API URL from environment variables
const WAITING_ROOM_API_URL = import.meta.env.VITE_WAITING_ROOM_API_URL;

interface WaitingRoomProps {
  // This function will be passed from the parent App component
  onJoinSuccess: (userId: string) => void;
  isWaiting: boolean;
  statusMessage: string;
  waitTime: number;
  currentUserId: string | null;
  onLeave: () => void;
}

function WaitingRoom({
  onJoinSuccess,
  isWaiting,
  statusMessage,
  waitTime,
  currentUserId,
  onLeave,
}: WaitingRoomProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleJoinClick = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${WAITING_ROOM_API_URL}/join`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: { userId: string } = await response.json();
      // Notify the parent component that we have a user ID
      onJoinSuccess(data.userId);
    } catch (error) {
      console.error("Error joining waiting room:", error);
      // You could pass an error message back to the parent here
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="waiting-room">
      <div className="waiting-room-content">
        <h2>🎮 Waiting Room</h2>
        {!isWaiting ? (
          <div className="join-section">
            <p>Find other players to chat with!</p>
            <button
              onClick={handleJoinClick}
              className="join-button"
              disabled={isLoading}
            >
              {isLoading ? "Joining..." : "Join Waiting Room"}
            </button>
          </div>
        ) : (
          <div className="waiting-section">
            <div className="loading-spinner"></div>
            <p className="status">{statusMessage}</p>
            <p className="wait-time">Waiting for {waitTime} seconds...</p>
            <p className="user-id">Your ID: {currentUserId}</p>
            <button onClick={onLeave} className="leave-button">
              Leave Waiting Room
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default WaitingRoom;
