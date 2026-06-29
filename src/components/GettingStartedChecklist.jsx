import { useState, useEffect, useContext } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { ToastContext } from '../context/ToastContext';

export default function GettingStartedChecklist() {
  const { addToast } = useContext(ToastContext);
  const [checklist, setChecklist] = useState([
    { id: 'profile', title: 'Complete Your Profile', reward: 500, icon: '👤', completed: false },
    { id: 'checkin', title: 'Check In 7 Days', reward: 70, icon: '✅', completed: false, progress: 0, target: 7 },
    { id: 'challenge', title: 'Join a Weekly Challenge', reward: 100, icon: '🎯', completed: false },
    { id: 'purchase', title: 'Make Your First Purchase', reward: 150, icon: '💳', completed: false },
    { id: 'refer', title: 'Refer a Friend', reward: 50, icon: '👥', completed: false },
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
        addToast(`✓ Unlocked ${item.reward} bonus points!`, 'success');
      }
    } catch (err) {
      console.error('Error updating checklist:', err);
    }
  };

  const completedCount = checklist.filter(item => item.completed).length;
  const progressPercent = (completedCount / checklist.length) * 100;

  return (
    <div className="getting-started-checklist">
      <div className="checklist-header">
        <h3>🚀 Getting Started</h3>
        <p>Complete tasks to earn bonus points</p>
      </div>

      <div className="checklist-progress">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
        <div className="progress-text">
          <span>{completedCount} of {checklist.length} complete</span>
          <span className="reward-badge">+{totalReward} pts</span>
        </div>
      </div>

      <div className="checklist-items">
        {checklist.map(item => (
          <div key={item.id} className={`checklist-item ${item.completed ? 'completed' : ''}`}>
            <div className="item-icon">{item.icon}</div>
            <div className="item-content">
              <div className="item-title">{item.title}</div>
              {item.progress !== undefined && (
                <div className="item-progress">
                  {item.progress}/{item.target} days
                </div>
              )}
            </div>
            <div className="item-reward">+{item.reward}</div>
            {!item.completed && (
              <button
                onClick={() => completeItem(item.id)}
                className="item-check"
              >
                →
              </button>
            )}
            {item.completed && <div className="item-checkmark">✓</div>}
          </div>
        ))}
      </div>

      {completedCount === checklist.length && (
        <div className="checklist-celebration">
          🎉 You've completed all onboarding tasks!
          <p>Keep earning and trading points to unlock more rewards.</p>
        </div>
      )}
    </div>
  );
}
