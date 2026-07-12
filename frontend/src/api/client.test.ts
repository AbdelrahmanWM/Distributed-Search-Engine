import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiClient, ApiError, EngineOfflineError } from './client';

const fetchMock = vi.fn();
beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

const ok = (body: unknown, isJson = true) =>
  Promise.resolve(new Response(isJson ? JSON.stringify(body) : String(body), { status: 200 }));

describe('ApiClient', () => {
  const api = new ApiClient('http://localhost:8080');

  it('search hits GET /search with encoded params and parses results', async () => {
    fetchMock.mockReturnValue(ok([{ title: 't', content: 'c', url: 'u', score: 1.5 }]));
    const results = await api.search('a AND "b c"', 0.7);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8080/search?query=a%20AND%20%22b%20c%22&accuracy=0.7',
      expect.objectContaining({ method: 'GET' }),
    );
    expect(results).toEqual([{ title: 't', content: 'c', url: 'u', score: 1.5 }]);
  });

  it('crawl POSTs seedUrls and numberOfPages as JSON', async () => {
    fetchMock.mockReturnValue(ok('Successfully crawled the pages', false));
    const msg = await api.crawl(['https://x.com'], 10);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://localhost:8080/crawl');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ seedUrls: ['https://x.com'], numberOfPages: 10 });
    expect(msg).toBe('Successfully crawled the pages');
  });

  it('sends booleans as 0/1 numbers', async () => {
    fetchMock.mockReturnValue(ok('ok', false));
    await api.indexDocuments(true);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ clear: 1 });
    fetchMock.mockReturnValue(ok('ok', false));
    await api.terminateCrawl(false);
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ clearDocumentsHistory: 0 });
    fetchMock.mockReturnValue(ok('ok', false));
    await api.terminateIndex(true);
    expect(JSON.parse(fetchMock.mock.calls[2][1].body)).toEqual({ clearIndexHistory: 1 });
  });

  it('crawlAndIndex sends all three fields', async () => {
    fetchMock.mockReturnValue(ok('ok', false));
    await api.crawlAndIndex(['https://x.com'], 5, true);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      seedUrls: ['https://x.com'],
      numberOfPages: 5,
      clear: 1,
    });
  });

  it('setRankerParameters PUTs all four params', async () => {
    fetchMock.mockReturnValue(ok('ok', false));
    await api.setRankerParameters({ BM25_K1: 1.5, BM25_B: 0.75, PHRASE_BOOST: 1.2, EXACT_MATCH_WEIGHT: 2 });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://localhost:8080/setRankerParameters');
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body)).toEqual({ BM25_K1: 1.5, BM25_B: 0.75, PHRASE_BOOST: 1.2, EXACT_MATCH_WEIGHT: 2 });
  });

  it('setThreadsNumber PUTs the thread count', async () => {
    fetchMock.mockReturnValue(ok('ok', false));
    await api.setThreadsNumber(6);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://localhost:8080/setThreadsNumber');
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body)).toEqual({ numberOfThreads: 6 });
  });

  it('clearCrawlHistory uses DELETE', async () => {
    fetchMock.mockReturnValue(ok('cleared', false));
    await api.clearCrawlHistory();
    expect(fetchMock.mock.calls[0][1].method).toBe('DELETE');
  });

  it('throws ApiError with server text on non-2xx', async () => {
    fetchMock.mockReturnValue(Promise.resolve(new Response('Error something broke', { status: 500 })));
    await expect(api.indexDocuments(false)).rejects.toThrowError(ApiError);
    fetchMock.mockReturnValue(Promise.resolve(new Response('Error something broke', { status: 500 })));
    await expect(api.indexDocuments(false)).rejects.toThrow('Error something broke');
  });

  it('throws EngineOfflineError when fetch rejects', async () => {
    fetchMock.mockReturnValue(Promise.reject(new TypeError('Failed to fetch')));
    await expect(api.search('x', 0.5)).rejects.toThrowError(EngineOfflineError);
  });

  it('strips trailing slash from base url', async () => {
    fetchMock.mockReturnValue(ok('ok', false));
    await new ApiClient('http://host:1/').clearCrawlHistory();
    expect(fetchMock.mock.calls[0][0]).toBe('http://host:1/clearCrawlHistory');
  });
});
