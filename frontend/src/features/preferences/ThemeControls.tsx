import { useTheme } from './ThemeProvider';

export function ThemeControls() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="theme-switcher upload-theme-switcher" role="group" aria-label="Color theme">
      <button
        className={`theme-option ${theme === 'system' ? 'active' : ''}`}
        type="button"
        onClick={() => setTheme('system')}
      >
        Auto
      </button>
      <button
        className={`theme-option ${theme === 'light' ? 'active' : ''}`}
        type="button"
        onClick={() => setTheme('light')}
      >
        Light
      </button>
      <button
        className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
        type="button"
        onClick={() => setTheme('dark')}
      >
        Dark
      </button>
    </div>
  );
}