import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { api } from '../utils/api';
import { BarChart, RingChart } from '../components/CustomCharts';
import { MOOD_THEMES, formatDateLabel, toLocalDateKey } from '../utils/moods';
import { BarChart3, TrendingUp, Clock, Zap, Calendar, Music2, RefreshCw, Plus, ListMusic } from 'lucide-react';
import { useMood } from '../contexts/MoodContext';
import { useUI } from '../contexts/UIContext';

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="glass rounded-2xl p-5 border border-white/5 flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}20` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <div className="text-2xl font-display font-bold">{value}</div>
        <div className="text-xs text-slate-400 mt-0.5">{label}</div>
        {sub && <div className="text-[10px] text-slate-600 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}



// ── Ongoing Month Calendar Heatmap ─────────────────────────────────────
function CurrentMonthHeatmap({ logs }) {
  const now = useMemo(() => new Date(), []);
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed (8 for Sep)
  const todayDate = now.getDate();
  const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const [hoveredDay, setHoveredDay] = useState(null);

  // Map of dayNumber -> { count, moods, date } for current month
  const monthData = useMemo(() => {
    const dayMap = {};
    logs.forEach(l => {
      const d = new Date(l.createdAt);
      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        const day = d.getDate();
        if (!dayMap[day]) dayMap[day] = { count: 0, moods: [], date: d };
        dayMap[day].count++;
        if (l.mood && !dayMap[day].moods.includes(l.mood)) {
          dayMap[day].moods.push(l.mood);
        }
      }
    });
    return dayMap;
  }, [logs, currentYear, currentMonth]);

  // Calendar cells generation (Sun to Sat)
  const { calendarCells, activeDaysCount, totalMonthSessions, monthStreak } = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayWeekday = new Date(currentYear, currentMonth, 1).getDay(); // 0=Sun..6=Sat

    const cells = [];

    // Leading empty padding cells before Day 1
    for (let i = 0; i < firstDayWeekday; i++) {
      cells.push({ isPadding: true, key: `pad-prev-${i}` });
    }

    let activeCount = 0;
    let totalSessions = 0;

    // Day 1 to daysInMonth
    for (let day = 1; day <= daysInMonth; day++) {
      const entry = monthData[day] || { count: 0, moods: [] };
      const dateObj = new Date(currentYear, currentMonth, day);
      const isToday = day === todayDate;
      const isPast = day < todayDate;
      const isFuture = day > todayDate;

      if (entry.count > 0) {
        activeCount++;
        totalSessions += entry.count;
      }

      cells.push({
        isPadding: false,
        day,
        date: dateObj,
        count: entry.count,
        moods: entry.moods,
        isToday,
        isPast,
        isFuture,
        key: `day-${day}`,
      });
    }

    // Trailing padding cells to complete the 7-column grid
    const totalCells = cells.length;
    const remainder = totalCells % 7;
    if (remainder !== 0) {
      const needed = 7 - remainder;
      for (let i = 0; i < needed; i++) {
        cells.push({ isPadding: true, key: `pad-next-${i}` });
      }
    }

    // Calculate current month streak: consecutive active days in ongoing month
    let checkDay = todayDate;
    if (!monthData[todayDate] || monthData[todayDate].count === 0) {
      if (todayDate > 1 && monthData[todayDate - 1]?.count > 0) {
        checkDay = todayDate - 1; // streak alive from yesterday
      } else {
        checkDay = 0; // streak broken
      }
    }

    let streak = 0;
    if (checkDay > 0) {
      for (let d = checkDay; d >= 1; d--) {
        if (monthData[d]?.count > 0) {
          streak++;
        } else {
          break;
        }
      }
    }

    return {
      calendarCells: cells,
      activeDaysCount: activeCount,
      totalMonthSessions: totalSessions,
      monthStreak: streak,
    };
  }, [monthData, currentYear, currentMonth, todayDate]);

  const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  return (
    <div className="space-y-4">
      {/* Month Header Banner */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="text-base font-semibold text-white tracking-wide flex items-center gap-2">
              {monthName}
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25">
                Current Month
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {activeDaysCount} of {todayDate} days active this month
            </div>
          </div>
        </div>

        {/* Current Month Streak Pill */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300">
          <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs font-bold tracking-tight">
            {monthStreak}d Month Streak
          </span>
        </div>
      </div>

      {/* Weekday Column Headers */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center text-[10px] font-semibold tracking-wider text-slate-500 select-none">
        {weekdays.map((w, idx) => (
          <div
            key={w}
            className={`py-1 ${idx === 0 || idx === 6 ? 'text-slate-600' : 'text-slate-400'}`}
          >
            {w}
          </div>
        ))}
      </div>

      {/* Calendar 7-Column Grid */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {calendarCells.map((cell) => {
          if (cell.isPadding) {
            return (
              <div
                key={cell.key}
                className="aspect-square rounded-xl bg-white/[0.01] border border-white/[0.02]"
              />
            );
          }

          const hasSessions = cell.count > 0;
          let cellStyle = 'bg-white/[0.03] border-white/5 text-slate-400';
          let glowStyle = {};

          if (hasSessions) {
            if (cell.count === 1) {
              cellStyle = 'bg-amber-500/20 border-amber-500/40 text-amber-200';
              glowStyle = { boxShadow: '0 0 8px rgba(245, 158, 11, 0.18)' };
            } else if (cell.count === 2) {
              cellStyle = 'bg-amber-500/40 border-amber-400/60 text-amber-100 font-semibold';
              glowStyle = { boxShadow: '0 0 12px rgba(245, 158, 11, 0.35)' };
            } else {
              cellStyle = 'bg-gradient-to-br from-amber-500/60 to-orange-500/60 border-amber-300 text-white font-bold';
              glowStyle = { boxShadow: '0 0 16px rgba(245, 158, 11, 0.5)' };
            }
          } else if (cell.isFuture) {
            cellStyle = 'bg-white/[0.01] border-white/[0.03] text-slate-600';
          }

          return (
            <div
              key={cell.key}
              onMouseEnter={() => setHoveredDay(cell)}
              onMouseLeave={() => setHoveredDay(null)}
              className={`relative aspect-square rounded-xl border flex flex-col justify-between p-1.5 sm:p-2 transition-all duration-200 cursor-pointer ${cellStyle} ${
                cell.isToday
                  ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-[#0d1117] shadow-[0_0_14px_rgba(245,158,11,0.4)]'
                  : 'hover:scale-105 hover:border-white/20'
              }`}
              style={glowStyle}
            >
              {/* Day Number */}
              <div className="flex items-center justify-between w-full">
                <span className="text-xs sm:text-sm font-medium leading-none">
                  {cell.day}
                </span>
                {cell.isToday && (
                  <span className="text-[8px] font-black tracking-tighter uppercase px-1 py-0.2 rounded bg-amber-400 text-slate-950">
                    NOW
                  </span>
                )}
              </div>

              {/* Sessions indicator / Mood dots */}
              <div className="flex items-center justify-between w-full mt-auto">
                {hasSessions ? (
                  <>
                    <span className="text-[9px] sm:text-[10px] font-semibold text-amber-300">
                      {cell.count}
                    </span>
                    <div className="flex gap-0.5">
                      {cell.moods.slice(0, 3).map((m, idx) => {
                        const mTheme = MOOD_THEMES[m] || MOOD_THEMES['Calm'];
                        return (
                          <div
                            key={idx}
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: mTheme.hex }}
                          />
                        );
                      })}
                    </div>
                  </>
                ) : cell.isFuture ? (
                  <span className="text-[9px] text-slate-700 opacity-40">—</span>
                ) : (
                  <span className="text-[9px] text-slate-600 font-light">0</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Status & Details Bar */}
      <div className="pt-2 border-t border-white/5 min-h-[36px] flex items-center justify-between text-xs">
        {hoveredDay ? (
          <div className="flex items-center gap-2 text-amber-300 animate-in fade-in">
            <span className="font-semibold text-slate-200">
              {hoveredDay.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}:
            </span>
            <span className="font-bold text-amber-400">
              {hoveredDay.count} session{hoveredDay.count === 1 ? '' : 's'}
            </span>
            {hoveredDay.moods.length > 0 && (
              <span className="text-slate-400 text-[11px] truncate">
                ({hoveredDay.moods.join(', ')})
              </span>
            )}
            {hoveredDay.isToday && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-bold tracking-wider">
                TODAY
              </span>
            )}
          </div>
        ) : (
          <div className="text-slate-400 text-[11px]">
            {totalMonthSessions} sessions logged across {activeDaysCount} active days in {now.toLocaleDateString('en-US', { month: 'short' })}
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 select-none">
          <span>0</span>
          <div className="w-2.5 h-2.5 rounded-[3px] bg-white/[0.04] border border-white/5" />
          <div className="w-2.5 h-2.5 rounded-[3px] bg-amber-500/25 border border-amber-500/40" />
          <div className="w-2.5 h-2.5 rounded-[3px] bg-amber-500/50 border border-amber-400/60" />
          <div className="w-2.5 h-2.5 rounded-[3px] bg-gradient-to-br from-amber-500 to-orange-500 border border-amber-300" />
          <span>3+</span>
        </div>
      </div>
    </div>
  );
}

// ── Chronological Recent Moods with Precise Dates ──────────────────────────────────────
function MoodTimeline({ logs }) {
  const { openAddToPlaylist } = useUI();
  // Backend returns newest-first: display up to 50 recent songs and moods
  const recent = logs.slice(0, 50);

  if (!recent.length) {
    return (
      <div className="text-sm text-slate-500 py-16 text-center flex flex-col items-center justify-center gap-2 flex-1 min-h-[460px]">
        <Clock className="w-8 h-8 opacity-30 text-amber-400" />
        <div>No mood records yet.</div>
        <div className="text-xs text-slate-600">Play songs or log moods to see your timeline here.</div>
      </div>
    );
  }

  return (
    <div className="space-y-2.5 overflow-y-auto pr-1.5 flex-1 max-h-[515px] min-h-[460px] custom-scrollbar">
      {recent.map((l, i) => {
        const mTheme = MOOD_THEMES[l.mood] || MOOD_THEMES['Calm'];
        const dateStr = formatDateLabel(l.createdAt);

        return (
          <div
            key={l._id || l.id || i}
            className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 transition-all hover:border-white/10 group"
          >
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
              style={{ background: mTheme.hex, boxShadow: `0 0 8px ${mTheme.hex}80` }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-200">{l.mood}</span>
                {l.type && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded uppercase tracking-wider bg-white/5 text-slate-400 font-mono font-medium">
                    {l.type}
                  </span>
                )}
              </div>
              {l.trackName ? (
                <div className="text-xs text-slate-400 truncate mt-0.5">
                  <span className="text-amber-400/90 font-medium">{l.trackName}</span>
                  {l.artistName ? ` · ${l.artistName}` : ''}
                </div>
              ) : l.message ? (
                <div className="text-xs text-slate-400 truncate mt-0.5">{l.message}</div>
              ) : null}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {l.trackName && (
                <button
                  onClick={() => openAddToPlaylist({
                    id: l._id || `${l.trackName}_${l.artistName}`,
                    title: l.trackName,
                    artist: l.artistName || 'Unknown Artist',
                    duration: 210,
                  })}
                  title="Add to playlist"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-400/10 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}
              <div className="text-[11px] text-slate-400 font-medium tabular-nums text-right">
                {dateStr}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Analytics Page ────────────────────────────────────────────────
export default function Analytics() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const { theme } = useMood();

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.listMoods();
      setLogs(Array.isArray(data) ? data : []);
    } catch {
      // Ignore network aborts
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Live Auto-Update: listen for moodLogged events and tab visibility changes
  useEffect(() => {
    const onMoodLogged = () => fetchLogs();
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') fetchLogs();
    };

    window.addEventListener('syncora:moodLogged', onMoodLogged);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.removeEventListener('syncora:moodLogged', onMoodLogged);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [fetchLogs]);

  // Current Month calculations
  const now = useMemo(() => new Date(), []);
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const todayNum = now.getDate();
  const currentMonthName = now.toLocaleDateString('en-US', { month: 'long' });

  // Real Current Month Consecutive Day Streak
  const currentMonthStreak = useMemo(() => {
    const dayMap = {};
    logs.forEach(l => {
      const d = new Date(l.createdAt);
      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        dayMap[d.getDate()] = (dayMap[d.getDate()] || 0) + 1;
      }
    });

    let checkDay = todayNum;
    if (!dayMap[todayNum]) {
      if (todayNum > 1 && dayMap[todayNum - 1]) {
        checkDay = todayNum - 1;
      } else {
        return 0;
      }
    }

    let count = 0;
    for (let d = checkDay; d >= 1; d--) {
      if (dayMap[d]) count++;
      else break;
    }
    return count;
  }, [logs, currentYear, currentMonth, todayNum]);

  // Current Month stats
  const { monthSessions, monthActiveDays } = useMemo(() => {
    let sess = 0;
    const days = new Set();
    logs.forEach(l => {
      const d = new Date(l.createdAt);
      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        sess++;
        days.add(d.getDate());
      }
    });
    return { monthSessions: sess, monthActiveDays: days.size };
  }, [logs, currentYear, currentMonth]);

  // All-time Metrics computation
  const { data, totalSessions, topMood, avgPerDay } = useMemo(() => {
    const counts = {};
    logs.forEach(l => {
      if (l.mood) counts[l.mood] = (counts[l.mood] || 0) + 1;
    });

    const data = Object.keys(MOOD_THEMES).map(m => ({
      label: m,
      value: counts[m] || 0,
      color: MOOD_THEMES[m].hex,
    }));

    const top = data.reduce((a, b) => (b.value > a.value ? b : a), data[0]);

    let avg = '0.0';
    if (logs.length > 0) {
      const dates = logs.map(l => new Date(l.createdAt).getTime()).filter(t => !isNaN(t));
      if (dates.length) {
        const oldest = Math.min(...dates);
        const daySpan = Math.max(1, Math.ceil((Date.now() - oldest) / 86400000));
        avg = (logs.length / daySpan).toFixed(1);
      }
    }

    return {
      data,
      totalSessions: logs.length,
      topMood: top?.value > 0 ? top : null,
      avgPerDay: avg,
    };
  }, [logs]);

  return (
    <div className="space-y-6">
      {/* Header with Refresh button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-semibold flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-amber-400" /> Analytics
          </h1>
          <div className="text-xs text-slate-500 mt-1">
            {totalSessions} total session{totalSessions === 1 ? '' : 's'} recorded in MongoDB Atlas · {currentMonthName} Overview
          </div>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          title="Refresh analytics"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-slate-300 hover:text-white transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          {loading ? 'Updating…' : 'Refresh'}
        </button>
      </div>

      {/* Stat cards focusing on ongoing month & streaks */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Zap}
          label="Total sessions"
          value={totalSessions}
          sub={`${monthSessions} this month`}
          color="#f59e0b"
        />
        <StatCard
          icon={TrendingUp}
          label="Month streak"
          value={`${currentMonthStreak}d`}
          sub={`Ongoing in ${currentMonthName}`}
          color="#ec4899"
        />
        <StatCard
          icon={Music2}
          label="Top mood"
          value={topMood?.label || '—'}
          sub={topMood ? `${topMood.value} sessions` : 'No mood logged'}
          color={topMood?.color || '#10b981'}
        />
        <StatCard
          icon={Clock}
          label="Month active"
          value={`${monthActiveDays} / ${todayNum}d`}
          sub={`${Math.round((monthActiveDays / Math.max(1, todayNum)) * 100)}% active in ${currentMonthName}`}
          color="#8b5cf6"
        />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-6 border border-white/5 flex flex-col items-center gap-2">
          <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">Total Sessions</div>
          <RingChart
            value={totalSessions}
            max={Math.max(20, totalSessions)}
            label="sessions"
            color="#f59e0b"
          />
        </div>
        <div className="glass rounded-2xl p-6 border border-white/5 flex flex-col items-center gap-2">
          <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">Month Streak</div>
          <RingChart
            value={currentMonthStreak}
            max={Math.max(todayNum, 7)}
            label="day streak"
            color="#ec4899"
          />
        </div>
        <div className="glass rounded-2xl p-6 border border-white/5 flex flex-col items-center gap-2">
          <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">Moods used</div>
          <RingChart
            value={data.filter(d => d.value > 0).length}
            max={6}
            label="moods used"
            color="#10b981"
          />
        </div>
      </div>

      {/* Bar chart */}
      <div className="glass rounded-2xl p-6 border border-white/5">
        <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-amber-400" /> Mood distribution
        </h3>
        <BarChart data={data} />
      </div>

      {/* Current Month Calendar Heatmap + recent timeline side by side */}
      <div className="grid lg:grid-cols-2 gap-4 items-stretch">
        <div className="glass rounded-2xl p-6 border border-white/5 flex flex-col justify-between">
          <CurrentMonthHeatmap logs={logs} />
        </div>
        <div className="glass rounded-2xl p-6 border border-white/5 flex flex-col">
          <div className="flex items-center justify-between mb-3.5">
            <h3 className="font-display font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" /> Recent moods & history
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              {logs.length} session{logs.length === 1 ? '' : 's'} recorded
            </span>
          </div>
          <MoodTimeline logs={logs} />
        </div>
      </div>
    </div>
  );
}

