import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar } from '../../frontend/src/features/workspace/Sidebar';

describe('Sidebar', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists collapsed state to localStorage', () => {
    render(<Sidebar />);
    const toggle = screen.getByRole('button');
    fireEvent.click(toggle);
    expect(localStorage.getItem('aem_sidebarCollapsed')).toBe('1');
  });
});