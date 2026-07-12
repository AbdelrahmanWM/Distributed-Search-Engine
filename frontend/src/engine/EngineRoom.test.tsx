import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ServicesProvider } from '../state/services';
import EngineRoom from './EngineRoom';

const fetchMock = vi.fn();
beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  localStorage.clear();
});

describe('EngineRoom / CrawlerPanel', () => {
  it('starts a crawl with seed urls and page count', async () => {
    fetchMock.mockResolvedValue(new Response('Successfully crawled the pages', { status: 200 }));
    render(<ServicesProvider><EngineRoom /></ServicesProvider>);

    const seedInput = screen.getByPlaceholderText('https://…');
    await userEvent.clear(seedInput);
    await userEvent.type(seedInput, 'https://example.com');
    const pages = screen.getByLabelText(/pages/i);
    await userEvent.clear(pages);
    await userEvent.type(pages, '25');

    await userEvent.click(screen.getByRole('button', { name: /^crawl$/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/crawl');
    expect(JSON.parse(init.body)).toEqual({ seedUrls: ['https://example.com'], numberOfPages: 25 });
  });

  it('locks crawl buttons while a crawl runs and keeps terminate available', async () => {
    let resolveCrawl!: (r: Response) => void;
    fetchMock.mockReturnValue(new Promise((res) => (resolveCrawl = res)));
    render(<ServicesProvider><EngineRoom /></ServicesProvider>);

    await userEvent.click(screen.getByRole('button', { name: /^crawl$/i }));
    expect(screen.getByRole('button', { name: /^crawl$/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /crawl \+ index/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /^terminate$/i })).toBeEnabled();
    expect(screen.getByText(/crawling/i)).toBeInTheDocument();

    resolveCrawl(new Response('done', { status: 200 }));
    await waitFor(() => expect(screen.getByRole('button', { name: /^crawl$/i })).toBeEnabled());
  });

  it('clear history requires arming the confirm button', async () => {
    fetchMock.mockResolvedValue(new Response('Successfully cleared crawl history.', { status: 200 }));
    render(<ServicesProvider><EngineRoom /></ServicesProvider>);

    await userEvent.click(screen.getByRole('button', { name: /clear crawl history/i }));
    expect(fetchMock).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: /really clear/i }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(fetchMock.mock.calls[0][1].method).toBe('DELETE');
  });

  it('builds the index with the clear flag', async () => {
    fetchMock.mockResolvedValue(new Response('Successfully created Inverted Index', { status: 200 }));
    render(<ServicesProvider><EngineRoom /></ServicesProvider>);

    await userEvent.click(screen.getByLabelText(/clear existing index before build/i));
    await userEvent.click(screen.getByRole('button', { name: /build index/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/indexDocuments');
    expect(JSON.parse(init.body)).toEqual({ clear: 1 });
  });

  it('terminates indexing with clear-history flag', async () => {
    fetchMock.mockResolvedValue(new Response('Successfully terminated indexing process', { status: 200 }));
    render(<ServicesProvider><EngineRoom /></ServicesProvider>);

    await userEvent.click(screen.getByRole('button', { name: /terminate indexing/i }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/indexDocuments_terminate');
    expect(JSON.parse(init.body)).toEqual({ clearIndexHistory: 0 });
  });
});
