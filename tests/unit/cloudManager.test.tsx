import { render, screen, waitFor } from '@testing-library/react';
import { CloudManagerPanel } from '../../frontend/src/features/cloud-manager/CloudManagerPanel';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const createQueryClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

const renderWithQuery = (ui: React.ReactElement) => {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
};

describe('CloudManagerPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders program selector', async () => {
    renderWithQuery(<CloudManagerPanel />);
    await screen.findByRole('combobox', { name: /program/i });
  });

  it('renders environment selector disabled initially', async () => {
    renderWithQuery(<CloudManagerPanel />);
    const envSelect = await screen.findByRole('combobox', { name: /environment/i });
    expect(envSelect).toBeDisabled();
  });
});