import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaClock } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { isDemoDailyChallengeComplete } from '@/lib/demoMode';
import { Button } from '@/components/ui/button';
import PropTypes from 'prop-types';

export default function DailyChallenge({ compact = false }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [challengeCompleted, setChallengeCompleted] = useState(false);
  const [timeUntilReset, setTimeUntilReset] = useState('');
  const [loading, setLoading] = useState(true);

  const checkDailyChallenge = useCallback(async () => {
    if (!user) return;
    try {
      const today = new Date().toDateString();
      const challengeRef = doc(db, 'dailyChallenges', user.uid + '_' + today);
      const snapshot = await getDoc(challengeRef);
      setChallengeCompleted(snapshot.exists());
    } catch (error) {
      console.error('Daily challenge status could not be loaded.', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.isDemo) {
      setChallengeCompleted(isDemoDailyChallengeComplete());
      setLoading(false);
    } else if (user) {
      checkDailyChallenge();
    } else {
      setLoading(false);
    }

    const updateCountdown = () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const remaining = tomorrow.getTime() - Date.now();
      const hours = Math.floor(remaining / 3600000);
      const minutes = Math.floor((remaining % 3600000) / 60000);
      setTimeUntilReset(hours + 'h ' + minutes + 'm');
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [user, checkDailyChallenge]);

  const startDailyChallenge = () => {
    sessionStorage.setItem('quizConfig', JSON.stringify({
      category: 0,
      difficulty: 'medium',
      amount: 10,
      mode: 'classic',
      timePerQuestion: 15,
      isDaily: true,
    }));
    navigate('/quiz');
  };

  if (loading) {
    return <div className="glass-panel animate-pulse h-full rounded-3xl p-5" aria-label="Loading daily challenge"><div className="h-5 w-2/5 rounded bg-[var(--border-color)]" /><div className="mt-4 h-4 w-3/4 rounded bg-[var(--border-color)]" /></div>;
  }

  return (
    <section className={`glass-panel h-full rounded-3xl ${compact ? 'p-5' : 'p-5 md:p-6'}`} aria-label="Daily challenge">
      <div className={`flex h-full flex-col ${compact ? 'gap-3' : 'gap-5'}`}>
        <div>
          <p className="eyebrow">Daily set</p>
          <h3 className="mt-2 text-xl font-semibold tracking-tight text-[var(--text-main)]">Daily challenge</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{compact ? 'A quick knowledge check.' : 'Ten questions for a focused knowledge check.'}</p>
        </div>
        {compact ? (
          <p className="mt-auto text-xs font-semibold text-[var(--text-muted)]">10 questions <span aria-hidden="true">·</span> 50 XP</p>
        ) : (
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full border border-[var(--border-color)] bg-[var(--bg-base)] px-3 py-2 text-[var(--text-main)]">50 XP</span>
            <span className="rounded-full border border-[var(--border-color)] bg-[var(--bg-base)] px-3 py-2 text-[var(--text-main)]">Streak progress</span>
            <span className="rounded-full border border-[var(--border-color)] bg-[var(--bg-base)] px-3 py-2 text-[var(--text-main)]">10 questions</span>
          </div>
        )}
        {challengeCompleted ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent-soft)] p-4">
            <span className="flex items-center gap-2 text-sm font-semibold text-[var(--accent)]"><FaCheckCircle aria-hidden="true" />Completed today</span>
            <span className="flex items-center gap-2 text-xs text-[var(--text-muted)]"><FaClock aria-hidden="true" />Resets in {timeUntilReset}</span>
          </div>
        ) : (
          <Button onClick={user ? startDailyChallenge : () => navigate('/login')} className="btn-primary mt-auto min-h-10 w-full justify-center rounded-xl px-2 text-sm">
            {user ? 'Start challenge' : 'Sign in to play'}
          </Button>
        )}
      </div>
    </section>
  );
}

DailyChallenge.propTypes = { compact: PropTypes.bool };
