import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '../../frontend/src/features/preferences/ThemeProvider';
import { ThemeControls } from '../../frontend/src/features/preferences/ThemeControls';

describe('ThemeControls', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('toggles between system, light, dark', async () => {
    render(
      <ThemeProvider>
        <ThemeControls />
      </ThemeProvider>
    );
    const select = screen.getByRole('combobox');
    await userEvent.selectOptions(select, ['dark']);
    expect(localStorage.getItem('aem_themePreference')).toBe('dark');
  });
});