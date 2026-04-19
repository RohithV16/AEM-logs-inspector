import { render } from '@testing-library/react';
import { FilterPanel } from '@/features/filters/FilterPanel';
import { useFilterStore } from '@/features/filters/useFilters';

describe('FilterPanel', () => {
  it('renders date range and log type filters', () => {
    const { getByText } = render(<FilterPanel />);
    expect(getByText(/Date Range/i)).toBeInTheDocument();
    expect(getByText(/Log Type/i)).toBeInTheDocument();
  });
});

describe('useFilterStore', () => {
  beforeEach(() => {
    useFilterStore.setState({
      dateRange: { start: '', end: '' },
      logType: 'error',
      packages: [],
      loggers: [],
      threads: [],
      exceptions: [],
    });
  });

  it('adds and removes packages', () => {
    const store = useFilterStore.getState();
    store.addPackage('com.example.app');
    expect(useFilterStore.getState().packages).toContain('com.example.app');
    store.removePackage('com.example.app');
    expect(useFilterStore.getState().packages).not.toContain('com.example.app');
  });

  it('clears all filters', () => {
    const store = useFilterStore.getState();
    store.addPackage('com.example.app');
    store.addLogger('ERROR');
    store.clear();
    expect(useFilterStore.getState().packages).toEqual([]);
    expect(useFilterStore.getState().loggers).toEqual([]);
  });
});