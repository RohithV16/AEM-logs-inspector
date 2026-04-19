import { ThemeProvider } from './features/preferences/ThemeProvider';
import { ThemeControls } from './features/preferences/ThemeControls';
import { WorkspaceShell } from './features/workspace/WorkspaceShell';
import { SourceModeSwitcher } from './features/workspace/SourceModeSwitcher';
import { LocalFileInput } from './features/analysis/LocalFileInput';
import { BatchInput } from './features/analysis/BatchInput';

export default function App() {
  return (
    <ThemeProvider>
      <div id="app">
        <header>
          <ThemeControls />
          <SourceModeSwitcher />
        </header>
        <WorkspaceShell>
          <LocalFileInput />
          <BatchInput />
        </WorkspaceShell>
      </div>
    </ThemeProvider>
  );
}