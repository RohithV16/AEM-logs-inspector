import { render, screen } from '@testing-library/react';
import { TailPanel } from '../../frontend/src/features/tail/TailPanel';

describe('TailPanel', () => {
  it('renders tail panel', () => {
    render(<TailPanel />);
    expect(screen.getByText('Disconnected')).toBeInTheDocument();
  });
});