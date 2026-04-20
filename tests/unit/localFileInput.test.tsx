import { render, screen, fireEvent } from '@testing-library/react';
import { LocalFileInput } from '../../frontend/src/features/analysis/LocalFileInput';
import { useAnalysis } from '../../frontend/src/features/analysis/useAnalysis';

jest.mock('../../frontend/src/features/analysis/useAnalysis', () => ({
  useAnalysis: jest.fn(),
}));

const mockMutate = jest.fn();
const mockUseAnalysis = useAnalysis as jest.Mock;

describe('LocalFileInput', () => {
  beforeEach(() => {
    mockUseAnalysis.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      error: null,
    });
  });

  it('calls mutate with file path when Analyze is clicked', () => {
    render(<LocalFileInput />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '/path/to/log.log' } });
    const button = screen.getByRole('button', { name: 'Analyze' });
    fireEvent.click(button);
    expect(mockMutate).toHaveBeenCalledWith('/path/to/log.log');
  });

  it('shows Analyzing... when isPending is true', () => {
    mockUseAnalysis.mockReturnValue({
      mutate: mockMutate,
      isPending: true,
      error: null,
    });
    render(<LocalFileInput />);
    expect(screen.getByText('Analyzing...')).toBeInTheDocument();
  });

  it('disables button when isPending is true', () => {
    mockUseAnalysis.mockReturnValue({
      mutate: mockMutate,
      isPending: true,
      error: null,
    });
    render(<LocalFileInput />);
    const button = screen.getByRole('button', { name: 'Analyzing...' });
    expect(button).toBeDisabled();
  });
});