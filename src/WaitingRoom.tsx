import React, { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/api";
import "./WaitingRoom.css";

const client = generateClient();

interface WaitingRoomProps {
  onMatchFound: (chatroomId: string, userId: string) => void;
}

function WaitingRoom({ onMatchFound }: WaitingRoomProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const [isWaiting, setIsWaiting] = useState(false);
  const [status, setStatus] = useState("Join the waiting room to find players");
  const [waitTime, setWaitTime] = useState(0);

  // Replace with your actual API endpoint from Amplify
  const WAITING_ROOM_API_URL =
    import.meta.env.VITE_WAITING_ROOM_API_URL ||
    "https://your-waiting-room-api-url.amazonaws.com/prod/join";

  const joinWaitingRoom = async () => {
    try {
      setStatus("Joining waiting room...");
      setIsWaiting(true);

      const response = await fetch(WAITING_ROOM_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setUserId(data.userId);
      setStatus("Waiting for other players...");
      setWaitTime(0);
    } catch (error) {
      console.error("Error joining waiting room:", error);
      setStatus("Failed to join waiting room. Please try again.");
      setIsWaiting(false);
    }
  };

  const startPollingForMatch = (currentUserId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        // Check if user is still in waiting room
        const statusResponse = await fetch(
          `${WAITING_ROOM_API_URL}/status?userId=${currentUserId}`
        );
        const statusData = await statusResponse.json();

        if (statusData.status === "matched" && statusData.chatroomId) {
          clearInterval(pollInterval);
          onMatchFound(statusData.chatroomId, currentUserId);
        }

        setWaitTime((prev) => prev + 1);
      } catch (error) {
        console.error("Error polling for match:", error);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  };

  const leaveWaitingRoom = async () => {
    if (userId) {
      try {
        await fetch(`${WAITING_ROOM_API_URL}/leave?userId=${userId}`, {
          method: "DELETE",
        });
      } catch (error) {
        console.error("Error leaving waiting room:", error);
      }
    }
    setIsWaiting(false);
    setUserId(null);
    setStatus("Join the waiting room to find players");
    setWaitTime(0);
  };

  useEffect(() => {
    let pollCleanup: (() => void) | undefined;

    if (userId && isWaiting) {
      pollCleanup = startPollingForMatch(userId);
    }

    return () => {
      if (pollCleanup) pollCleanup();
    };
  }, [userId, isWaiting]);

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
            <p className="status">{status}</p>
            <p className="wait-time">Waiting for {waitTime} seconds...</p>
            <p className="user-id">Your ID: {userId}</p>
            <button onClick={leaveWaitingRoom} className="leave-button">
              Leave Waiting Room
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default WaitingRoom;
