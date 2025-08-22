import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/api";
import {
  joinWaitingRoom as joinWaitingRoomMutation,
  leaveWaitingRoom as leaveWaitingRoomMutation,
} from "./graphql/mutations";
import { onMatchFound } from "./graphql/subscriptions";

const client = generateClient();

interface WaitingRoomProps {
  setCurrentView: (view: "waiting" | "chat") => void;
  setChatroomId: (id: string) => void;
  setCurrentUserId: (id: string) => void;
}

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

  const joinWaitingRoom = async () => {
    try {
      setWaitingStatus("Joining waiting room...");
      setIsWaiting(true);

      const response = await client.graphql({
        query: joinWaitingRoomMutation,
        variables: {},
      });

      console.log("Join response:", response);

      if ("data" in response && response.data?.joinWaitingRoom) {
        const userId = response.data.joinWaitingRoom.userId;
        setLocalCurrentUserId(userId);
        setCurrentUserId(userId);
        setWaitingStatus("Waiting for other players...");
        setWaitTime(0);

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

  useEffect(() => {
    console.log("ONMATCHFOUND");
    if (!currentUserId || !isWaiting) return;

    const subscription = client
      .graphql({
        query: onMatchFound,
      })
      .subscribe({
        next: ({ data }) => {
          console.log("🎯 SUBSCRIPTION DATA RECEIVED:", data);
          if (data?.onMatchFound?.chatroomId) {
            console.log(
              "🚀 Switching to chatroom:",
              data.onMatchFound.chatroomId
            );
            setChatroomId(data.onMatchFound.chatroomId);
            setCurrentView("chat");
          }
        },
        error: (error: any) => {
          console.error("❌ Subscription error:", error);
        },
      });

    return () => subscription.unsubscribe();
  }, [currentUserId, isWaiting]);

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
