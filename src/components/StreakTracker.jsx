import { FaFire } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';
import PropTypes from 'prop-types';

export default function StreakTracker({ size = 'normal' }) {
  const { userProfile } = useAuth();
  if (!userProfile) return null;

  const streak = userProfile.currentStreak || 0;
  const longestStreak = userProfile.longestStreak || 0;
  const progress = Math.min((streak / 7) * 100, 100);
  const milestoneText = streak >= 7 ? '7-day milestone reached' : (7 - streak) + ' days to your next milestone';

  if (size === 'mini') {
    return (
      <div className="streak-mini-pill flex items-center gap-2 rounded-full border border-[var(--border-color)] px-3 py-2 text-sm font-semibold text-[var(--text-main)]" aria-label={streak + ' day learning streak'}>
        <FaFire className="text-orange-500" aria-hidden="true" />
        <span>{streak === 1 ? '1 day' : streak === 0 ? '0 day' : streak + ' days'}</span>
      </div>
    );
  }

  return (
    <section className="home-stat-card h-full">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="home-action-icon streak-flame"><FaFire aria-hidden="true" /></span>
          <div>
            <p className="eyebrow">Current streak</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-[var(--text-main)]">{streak} {streak === 1 ? 'day' : 'days'}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-[var(--text-muted)]">Best</p>
          <p className="font-semibold text-[var(--text-main)]">{longestStreak} days</p>
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
        <span>{streak ? 'Keep your practice rhythm going' : 'Complete a practice session to begin'}</span>
        <span className="shrink-0">{milestoneText}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--border-color)]" role="progressbar" aria-label="Progress to 7 day streak" aria-valuenow={Math.min(streak, 7)} aria-valuemin={0} aria-valuemax={7}>
        <div className="streak-progress h-full rounded-full" style={{ width: progress + '%' }} />
      </div>
    </section>
  );
}

StreakTracker.propTypes = { size: PropTypes.string };
