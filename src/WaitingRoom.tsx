import { useState, useEffect } from "react";
import {
  joinWaitingRoom as joinWaitingRoomMutation,
  leaveWaitingRoom as leaveWaitingRoomMutation,
} from "./graphql/mutations";
import { onMatchFound } from "./graphql/subscriptions";
import { client } from "./amplifyConfig";
import styles from "./WaitingRoom.module.css";

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
    console.log("Subscription variables:", { userId: currentUserId });
    console.log("Is waiting:", isWaiting);

    const subscription = client
      .graphql({
        query: onMatchFound,
        variables: { userId: currentUserId },
      })
      .subscribe({
        next: (payload) => {
          console.log("Raw payload:", payload);
          console.log("Has data:", !!payload.data);
          console.log("Has onMatchFound:", !!payload.data?.onMatchFound);

          if (payload.data?.onMatchFound) {
            const chatroomId = payload.data.onMatchFound.chatroomId;
            console.log("🚀 Match found! Switching to chatroom:", chatroomId);

            setChatroomId(chatroomId);
            setCurrentView("chat");
          }
        },
        error: (error) => {
          console.error("Subscription error details:", error);
        },
      });

    return () => subscription.unsubscribe();
  }, [currentUserId, isWaiting]);

  return (
    <div className={styles.waitingRoom}>
      <div className={styles.waitingRoomContent}>
        <h2 className={styles.title}>🎮 Waiting Room</h2>

        {!isWaiting ? (
          <div className={styles.joinSection}>
            <p className={styles.description}>
              Find other players to chat with!
            </p>
            <button onClick={joinWaitingRoom} className={styles.joinButton}>
              Join Waiting Room
            </button>
          </div>
        ) : (
          <div className={styles.waitingSection}>
            <div className={styles.loadingSpinner}></div>
            <p className={styles.status}>{waitingStatus}</p>
            <p className={styles.waitTime}>Waiting for {waitTime} seconds...</p>
            <p className={styles.userId}>Your ID: {currentUserId}</p>
            <button onClick={leaveWaitingRoom} className={styles.leaveButton}>
              Leave Waiting Room
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default WaitingRoom;
