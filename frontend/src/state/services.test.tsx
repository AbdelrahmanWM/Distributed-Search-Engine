import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ServicesProvider, useServices, OfflineBanner } from './services';

const fetchMock = vi.fn();
beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  localStorage.clear();
});

function Probe() {
  const s = useServices();
  return (
    <div>
      <button onClick={() => s.run('POST', '/indexDocuments', (a) => a.indexDocuments(false)).catch(() => {})}>
        go
      </button>
      <div data-testid="log-count">{s.log.length}</div>
      <div data-testid="log-first">{s.log[0]?.message ?? ''}</div>
      <div data-testid="toast-count">{s.toasts.length}</div>
    </div>
  );
}

describe('services', () => {
  it('records successful calls in the log without toasting', async () => {
    fetchMock.mockResolvedValue(new Response('Successfully created Inverted Index', { status: 200 }));
    render(
      <ServicesProvider>
        <Probe />
      </ServicesProvider>,
    );
    await userEvent.click(screen.getByText('go'));
    await waitFor(() => expect(screen.getByTestId('log-count')).toHaveTextContent('1'));
    expect(screen.getByTestId('log-first')).toHaveTextContent('Successfully created Inverted Index');
    expect(screen.getByTestId('toast-count')).toHaveTextContent('0');
  });

  it('records failures and shows an error toast with server text', async () => {
    fetchMock.mockResolvedValue(new Response('Error boom', { status: 500 }));
    render(
      <ServicesProvider>
        <Probe />
      </ServicesProvider>,
    );
    await userEvent.click(screen.getByText('go'));
    await waitFor(() => expect(screen.getByTestId('toast-count')).toHaveTextContent('1'));
    expect(screen.getByTestId('log-first')).toHaveTextContent('Error boom');
  });

  it('shows offline banner when the engine is unreachable', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    render(
      <ServicesProvider>
        <OfflineBanner />
        <Probe />
      </ServicesProvider>,
    );
    await userEvent.click(screen.getByText('go'));
    await waitFor(() => expect(screen.getByText(/engine offline/i)).toBeInTheDocument());
  });
});
