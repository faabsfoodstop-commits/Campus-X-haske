import { useState, useEffect, useContext } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { ToastContext } from '../context/ToastContext';
import Button from './Button';
import './GettingStartedChecklist.css';

// Icon Components
const ProfileIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const CheckinIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ChallengeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const PurchaseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);

const ReferralIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const ICONS = {
  profile: ProfileIcon,
  checkin: CheckinIcon,
  challenge: ChallengeIcon,
  purchase: PurchaseIcon,
  refer: ReferralIcon,
};

export default function GettingStartedChecklist() {
  const { addToast } = useContext(ToastContext);
  const [checklist, setChecklist] = useState([
    { id: 'profile', title: 'Complete Your Profile', reward: 500, iconKey: 'profile', completed: false },
    { id: 'checkin', title: 'Check In 7 Days', reward: 70, iconKey: 'checkin', completed: false, progress: 0, target: 7 },
    { id: 'challenge', title: 'Join a Weekly Challenge', reward: 100, iconKey: 'challenge', completed: false },
    { id: 'purchase', title: 'Make Your First Purchase', reward: 150, iconKey: 'purchase', completed: false },
    { id: 'refer', title: 'Refer a Friend', reward: 50, iconKey: 'refer', completed: false },
  ]);
  const [totalReward, setTotalReward] = useState(0);

  useEffect(() => {
    calculateReward();
  }, [checklist]);

  const calculateReward = () => {
    const completed = checklist.filter(item => item.completed).length;
    const total = checklist.reduce((sum, item) => sum + item.reward, 0);
    setTotalReward(Math.round((completed / checklist.length) * total));
  };

  const completeItem = async (id) => {
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const newChecklist = checklist.map(item =>
          item.id === id ? { ...item, completed: true } : item
        );
        setChecklist(newChecklist);

        const item = checklist.find(i => i.id === id);
        addToast(`Unlocked ${item.reward} bonus points!`, 'success');
      }
    } catch (err) {
      console.error('Error updating checklist:', err);
    }
  };

  const completedCount = checklist.filter(item => item.completed).length;
  const progressPercent = (completedCount / checklist.length) * 100;
  const allComplete = completedCount === checklist.length;

  return (
    <div className="getting-started-checklist">
      <div className="checklist-header">
        <div className="header-top">
          <h3>Getting Started</h3>
          <div className="progress-badge">
            <span className="badge-label">Progress</span>
            <span className="badge-value">{completedCount}/{checklist.length}</span>
          </div>
        </div>
        <p>Complete these tasks to earn bonus points and unlock your full potential</p>
      </div>

      <div className="checklist-progress">
        <div className="progress-container">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="progress-stats">
            <span className="stat-text">{Math.round(progressPercent)}% complete</span>
            <span className="reward-badge">+{totalReward} pts</span>
          </div>
        </div>
      </div>

      <div className="checklist-items">
        {checklist.map(item => {
          const IconComponent = ICONS[item.iconKey];
          return (
            <div key={item.id} className={`checklist-item ${item.completed ? 'completed' : ''} ${allComplete ? 'all-complete' : ''}`}>
              <div className="item-icon">
                <IconComponent />
              </div>

              <div className="item-content">
                <div className="item-title">{item.title}</div>
                {item.progress !== undefined && (
                  <div className="item-progress">
                    {item.progress} of {item.target} check-ins
                  </div>
                )}
              </div>

              <div className="item-actions">
                <div className="item-reward">+{item.reward}</div>
                {!item.completed && (
                  <Button
                    onClick={() => completeItem(item.id)}
                    variant="primary"
                    size="sm"
                    className="item-check-button"
                  >
                    Start
                  </Button>
                )}
                {item.completed && (
                  <div className="item-checkmark">
                    <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {allComplete && (
        <div className="checklist-celebration">
          <div className="celebration-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
              <polyline points="13 2 13 9 20 9" />
              <polyline points="9 13 12 16 16 12" />
            </svg>
          </div>
          <h4>Onboarding Complete!</h4>
          <p>You've unlocked all starter tasks. Continue earning points and trading them for rewards.</p>
        </div>
      )}
    </div>
  );
}
