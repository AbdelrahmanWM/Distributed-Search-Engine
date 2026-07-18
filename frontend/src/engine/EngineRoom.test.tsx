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

    const seedBox = screen.getByLabelText('seed urls');
    await userEvent.clear(seedBox);
    await userEvent.type(seedBox, 'https://example.com');
    const pages = screen.getByLabelText(/pages/i);
    await userEvent.clear(pages);
    await userEvent.type(pages, '25');

    await userEvent.click(screen.getByRole('button', { name: /^crawl$/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/crawl');
    expect(JSON.parse(init.body)).toEqual({ seedUrls: ['https://example.com'], numberOfPages: 25 });
  });

  it('persists textarea seeds to localStorage as an array and shows a count', async () => {
    render(<ServicesProvider><EngineRoom /></ServicesProvider>);

    const seedBox = screen.getByLabelText('seed urls');
    await userEvent.clear(seedBox);
    await userEvent.type(seedBox, 'https://a.com{enter}https://b.com');

    expect(JSON.parse(localStorage.getItem('distirolis.seedUrls')!)).toEqual([
      'https://a.com',
      'https://b.com',
    ]);
    expect(screen.getByText('2 seed URLs')).toBeInTheDocument();
  });

  it('locks crawl buttons while a crawl runs and keeps terminate available', async () => {
    let resolveCrawl!: (r: Response) => void;
    fetchMock.mockReturnValue(new Promise((res) => (resolveCrawl = res)));
    render(<ServicesProvider><EngineRoom /></ServicesProvider>);

    await userEvent.click(screen.getByRole('button', { name: /^crawl$/i }));
    expect(screen.getByRole('button', { name: /^crawl$/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /crawl \+ index/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /^terminate$/i })).toBeEnabled();
    expect(screen.getByText(/^crawling…/)).toBeInTheDocument();

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

  it('applies ranker parameters and persists them', async () => {
    fetchMock.mockResolvedValue(new Response('Successfully set new Ranker parameters', { status: 200 }));
    render(<ServicesProvider><EngineRoom /></ServicesProvider>);

    const k1 = screen.getByLabelText('BM25_K1 value');
    await userEvent.clear(k1);
    await userEvent.type(k1, '2.1');
    await userEvent.click(screen.getByRole('button', { name: /apply parameters/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/setRankerParameters');
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body)).toEqual({ BM25_K1: 2.1, BM25_B: 0.75, PHRASE_BOOST: 1.2, EXACT_MATCH_WEIGHT: 2 });
    expect(JSON.parse(localStorage.getItem('distirolis.ranker')!)).toMatchObject({ BM25_K1: 2.1 });
  });

  it('reset restores ranker defaults in the form', async () => {
    render(<ServicesProvider><EngineRoom /></ServicesProvider>);
    const k1 = screen.getByLabelText('BM25_K1 value');
    await userEvent.clear(k1);
    await userEvent.type(k1, '2.9');
    await userEvent.click(screen.getByRole('button', { name: /reset to defaults/i }));
    expect(k1).toHaveValue(1.5);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sets thread count', async () => {
    fetchMock.mockResolvedValue(new Response('Successfully updated threads number.', { status: 200 }));
    render(<ServicesProvider><EngineRoom /></ServicesProvider>);

    const threads = screen.getByLabelText(/threads value/i);
    await userEvent.clear(threads);
    await userEvent.type(threads, '6');
    await userEvent.click(screen.getByRole('button', { name: /apply threads/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/setThreadsNumber');
    expect(JSON.parse(init.body)).toEqual({ numberOfThreads: 6 });
  });

  it('changes the engine base url via the connection row', async () => {
    fetchMock.mockResolvedValue(new Response('ok', { status: 200 }));
    render(<ServicesProvider><EngineRoom /></ServicesProvider>);

    const urlInput = screen.getByLabelText(/engine url/i);
    await userEvent.clear(urlInput);
    await userEvent.type(urlInput, 'http://10.0.0.5:8080');
    await userEvent.click(screen.getByRole('button', { name: /connect/i }));

    await userEvent.click(screen.getByRole('button', { name: /terminate indexing/i }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(fetchMock.mock.calls[0][0]).toContain('http://10.0.0.5:8080/');
  });

  it('shows api calls in the activity log', async () => {
    fetchMock.mockResolvedValue(new Response('Successfully created Inverted Index', { status: 200 }));
    render(<ServicesProvider><EngineRoom /></ServicesProvider>);

    await userEvent.click(screen.getByRole('button', { name: /build index/i }));

    const log = await screen.findByRole('table');
    expect(log).toHaveTextContent('/indexDocuments');
    expect(log).toHaveTextContent('POST');
    expect(log).toHaveTextContent('Successfully created Inverted Index');
  });
});
