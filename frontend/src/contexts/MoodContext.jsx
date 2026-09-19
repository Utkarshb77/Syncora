import React, { createContext, useContext, useState } from 'react';
import { MOOD_THEMES } from '../utils/moods';

const MoodContext = createContext(null);
export const useMood = () => useContext(MoodContext);

export function MoodProvider({ children }) {
  const [currentMood, setCurrentModeState] = useState(() => {
    const saved = localStorage.getItem('syncora_mood');
    return saved && MOOD_THEMES[saved] ? saved : 'Calm';
  });

  const setCurrentMood = (mood) => {
    if (!MOOD_THEMES[mood]) return;
    setCurrentModeState(mood);
    localStorage.setItem('syncora_mood', mood);
  };

  const theme = MOOD_THEMES[currentMood];
  return (
    <MoodContext.Provider value={{ currentMood, setCurrentMood, theme, MOOD_THEMES }}>
      {children}
    </MoodContext.Provider>
  );
}
