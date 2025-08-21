import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/api";
import {
  joinWaitingRoom as joinWaitingRoomMutation,
  leaveWaitingRoom as leaveWaitingRoomMutation,
} from "./graphql/mutations";
import { onMatchFound } from "./graphql/subscriptions";

const client = generateClient();

// Add this interface for the component props
interface WaitingRoomProps {
  setCurrentView: (view: "waiting" | "chat") => void;
  setChatroomId: (id: string) => void;
  setCurrentUserId: (id: string) => void;
}

// Use the interface in your function component
function WaitingRoom({
  setCurrentView,
  setChatroomId,
  setCurrentUserId,
}: WaitingRoomProps) {
  const [waitingStatus, setWaitingStatus] = useState(
    "Join the waiting room to find players"
  );
  const [waitTime, setWaitTime] = useState(0);
  const [isWaiting, setIsWaiting] = useState(false);
  const [currentUserId, setLocalCurrentUserId] = useState("");
  // Waiting Room Functions using AppSync
  const joinWaitingRoom = async () => {
    try {
      setWaitingStatus("Joining waiting room...");
      setIsWaiting(true);

      // Use AppSync mutation - server will generate the userId
      const response = await client.graphql({
        query: joinWaitingRoomMutation,
        variables: {}, // No arguments needed
      });

      console.log("Join response:", response);

      // Handle the response properly - check if it's a GraphQLResult
      if ("data" in response && response.data?.joinWaitingRoom) {
        const userId = response.data.joinWaitingRoom.userId;
        setLocalCurrentUserId(userId);
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
        await client.graphql({
          query: leaveWaitingRoomMutation,
          variables: { userId: currentUserId },
        });
      } catch (error) {
        console.error("Error leaving waiting room:", error);
      }
    }
    setIsWaiting(false);
    setLocalCurrentUserId("");
    setCurrentUserId("");
    setWaitingStatus("Join the waiting room to find players");
    setWaitTime(0);
  };

  // Use AppSync subscription for real-time matching instead of polling
  useEffect(() => {
    if (!currentUserId || !isWaiting) return;

    const subscription = client
      .graphql({
        query: onMatchFound,
        variables: { userId: currentUserId },
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
          // Fallback to polling if subscription fails - pass the userId
          startPollingForMatch(currentUserId);
        },
      });

    return () => subscription.unsubscribe();
  }, [currentUserId, isWaiting]);

  // Fallback polling function (optional) - now properly uses the userId parameter
  const startPollingForMatch = (userId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        // You could implement a getWaitingStatus query here using the userId
        console.log("Polling for match for user:", userId);
        setWaitTime((prev) => prev + 1);
      } catch (error) {
        console.error("Error polling for match:", error);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  };

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

export default WaitingRoom;
