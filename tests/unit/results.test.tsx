import { render, screen } from '@testing-library/react';
import { LevelFilter } from '../../frontend/src/features/results/LevelFilter';
import { usePaginationStore } from '../../frontend/src/features/results/usePagination';

describe('LevelFilter', () => {
  it('renders level filter chips', () => {
    render(<LevelFilter counts={{ ALL: 100, ERROR: 50, WARN: 30, INFO: 20 }} />);
    expect(screen.getByText('ALL')).toBeInTheDocument();
    expect(screen.getByText('ERROR')).toBeInTheDocument();
  });
});

describe('usePaginationStore', () => {
  beforeEach(() => {
    usePaginationStore.setState({ page: 1, perPage: 50, total: 0 });
    localStorage.clear();
  });

  it('persists perPage to localStorage', () => {
    usePaginationStore.getState().setPerPage(100);
    expect(localStorage.getItem('aem_rawEventsPerPage')).toBe('100');
  });

  it('tracks page state', () => {
    usePaginationStore.getState().setPage(2);
    expect(usePaginationStore.getState().page).toBe(2);
  });
});