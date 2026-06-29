import { useState, useEffect, useContext } from 'react';
import { ToastContext } from '../context/ToastContext';
import './OnboardingTour.css';

export default function OnboardingTour({ onComplete, visible }) {
  const { addToast } = useContext(ToastContext);
  const [step, setStep] = useState(0);

  const steps = [
    {
      target: 'body',
      title: '🎉 Welcome to HASKE!',
      description: 'Earn points by doing campus activities, then redeem for airtime, data, and more.',
      position: 'center',
      highlight: false,
    },
    {
      target: '[data-tour="points-card"]',
      title: '💰 Your Points',
      description: 'Earn points through check-ins, missions, and challenges. Watch your total grow!',
      position: 'bottom',
      highlight: true,
    },
    {
      target: '[data-tour="marketplace"]',
      title: '🛍️ Rewards Marketplace',
      description: 'Redeem your points for airtime, data, gift cards, and more. Instant delivery!',
      position: 'top',
      highlight: true,
    },
    {
      target: '[data-tour="point-market"]',
      title: '📊 Point Market',
      description: 'Sell your earned points for cash or buy from others. The market sets the price!',
      position: 'top',
      highlight: true,
    },
    {
      target: '[data-tour="challenges"]',
      title: '🎯 Weekly Challenges',
      description: 'Complete challenges each week for bonus points. New challenges every Monday!',
      position: 'top',
      highlight: true,
    },
    {
      target: 'body',
      title: '✨ You\'re all set!',
      description: 'Check in today to earn your first 10 points, then explore the app.',
      position: 'center',
      highlight: false,
      action: true,
    },
  ];

  const currentStep = steps[step];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      addToast('Welcome! Check in today to start earning. 🎉', 'success');
      onComplete();
    }
  };

  const handleSkip = () => {
    addToast('You can always view this tour in settings.', 'info');
    onComplete();
  };

  if (!visible) return null;

  return (
    <div className="onboarding-overlay">
      <div className={`onboarding-spotlight ${currentStep.highlight ? 'active' : ''}`} />

      <div className={`onboarding-card onboarding-${currentStep.position}`}>
        <div className="onboarding-header">
          <h2>{currentStep.title}</h2>
          <button onClick={handleSkip} className="onboarding-close">×</button>
        </div>

        <p className="onboarding-description">{currentStep.description}</p>

        <div className="onboarding-progress">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`progress-dot ${i === step ? 'active' : ''} ${i < step ? 'completed' : ''}`}
            />
          ))}
        </div>

        <div className="onboarding-actions">
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} className="onboarding-btn secondary">
              ← Back
            </button>
          )}
          <button onClick={handleNext} className="onboarding-btn primary">
            {step === steps.length - 1 ? '✓ Start Earning!' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}
