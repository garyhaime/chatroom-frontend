// src/components/VoteModal.tsx

import styles from "./VoteModal.module.css";

interface VoteModalProps {
  // A map of participant IDs to their friendly names
  participants: Record<string, string>;
  onVote: (votedUserId: string) => void;
}

function VoteModal({ participants, onVote }: VoteModalProps) {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>Time's Up!</h2>
        <p>Who do you think is the AI?</p>
        <div className={styles.voteOptions}>
          {Object.entries(participants).map(([id, name]) => (
            <button
              key={id}
              onClick={() => onVote(id)}
              className={styles.voteButton}
            >
              {name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default VoteModal;
