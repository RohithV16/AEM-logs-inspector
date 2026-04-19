import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SourceModeSwitcher } from '../../frontend/src/features/workspace/SourceModeSwitcher';

describe('SourceModeSwitcher', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('switches between local and cloudmanager', async () => {
    render(<SourceModeSwitcher />);
    const buttons = screen.getAllByRole('radio');
    await userEvent.click(buttons[1]);
    expect(localStorage.getItem('aem_sourceMode')).toBe('cloudmanager');
  });
});