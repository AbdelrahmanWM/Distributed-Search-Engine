import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ServicesProvider } from '../state/services';
import EngineLogsPanel from './EngineLogsPanel';

const fetchMock = vi.fn();
const logsResponse = (lines: unknown[]) =>
  new Response(JSON.stringify({ lines }), { status: 200 });

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('EngineLogsPanel', () => {
  it('shows engine log lines and polls incrementally', async () => {
    vi.useFakeTimers();
    fetchMock
      .mockResolvedValueOnce(logsResponse([{ id: 1, time: '12:00:00', text: 'Crawling: https://bbc.com' }]))
      .mockResolvedValue(logsResponse([]));
    render(<ServicesProvider><EngineLogsPanel active={true} /></ServicesProvider>);

    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    expect(screen.getByText(/Crawling: https:\/\/bbc\.com/)).toBeInTheDocument();
    expect(String(fetchMock.mock.calls[0][0])).toContain('/logs?after=0');

    await act(async () => { await vi.advanceTimersByTimeAsync(2000); });
    expect(String(fetchMock.mock.calls[1][0])).toContain('/logs?after=1');
  });

  it('shows an offline note when polling fails', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'));
    render(<ServicesProvider><EngineLogsPanel active={true} /></ServicesProvider>);
    expect(await screen.findByText(/engine offline/i)).toBeInTheDocument();
  });

  it('does not poll while inactive', async () => {
    render(<ServicesProvider><EngineLogsPanel active={false} /></ServicesProvider>);
    await act(async () => {});
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByText(/no engine output yet/i)).toBeInTheDocument();
  });
});
