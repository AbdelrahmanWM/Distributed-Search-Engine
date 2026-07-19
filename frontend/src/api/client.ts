export interface SearchResult {
  title: string;
  content: string;
  url: string;
  score: number;
}

export interface RankerParams {
  BM25_K1: number;
  BM25_B: number;
  PHRASE_BOOST: number;
  EXACT_MATCH_WEIGHT: number;
}

export interface EngineLogLine {
  id: number;
  time: string;
  text: string;
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export class EngineOfflineError extends Error {
  constructor() {
    super('Engine is unreachable');
    this.name = 'EngineOfflineError';
  }
}

const bit = (b: boolean): number => (b ? 1 : 0);

export class ApiClient {
  private base: string;

  constructor(baseUrl: string) {
    this.base = baseUrl.replace(/\/+$/, '');
  }

  async search(query: string, accuracy: number): Promise<SearchResult[]> {
    const qs = `query=${encodeURIComponent(query)}&accuracy=${encodeURIComponent(accuracy)}`;
    const text = await this.request('GET', `/search?${qs}`);
    return JSON.parse(text) as SearchResult[];
  }

  crawl(seedUrls: string[], numberOfPages: number): Promise<string> {
    return this.request('POST', '/crawl', { seedUrls, numberOfPages });
  }

  terminateCrawl(clearDocumentsHistory: boolean): Promise<string> {
    return this.request('PUT', '/crawl_terminate', { clearDocumentsHistory: bit(clearDocumentsHistory) });
  }

  indexDocuments(clear: boolean): Promise<string> {
    return this.request('POST', '/indexDocuments', { clear: bit(clear) });
  }

  terminateIndex(clearIndexHistory: boolean): Promise<string> {
    return this.request('PUT', '/indexDocuments_terminate', { clearIndexHistory: bit(clearIndexHistory) });
  }

  crawlAndIndex(seedUrls: string[], numberOfPages: number, clear: boolean): Promise<string> {
    return this.request('POST', '/crawlAndIndexDocument', { seedUrls, numberOfPages, clear: bit(clear) });
  }

  setRankerParameters(p: RankerParams): Promise<string> {
    return this.request('PUT', '/setRankerParameters', p);
  }

  setThreadsNumber(numberOfThreads: number): Promise<string> {
    return this.request('PUT', '/setThreadsNumber', { numberOfThreads });
  }

  clearCrawlHistory(): Promise<string> {
    return this.request('DELETE', '/clearCrawlHistory');
  }

  async logs(after: number): Promise<EngineLogLine[]> {
    const text = await this.request('GET', `/logs?after=${encodeURIComponent(after)}`);
    return (JSON.parse(text) as { lines?: EngineLogLine[] }).lines ?? [];
  }

  private async request(method: string, path: string, body?: unknown): Promise<string> {
    let res: Response;
    try {
      res = await fetch(`${this.base}${path}`, {
        method,
        ...(body !== undefined
          ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
          : {}),
      });
    } catch {
      throw new EngineOfflineError();
    }
    const text = await res.text();
    if (!res.ok) throw new ApiError(res.status, text);
    return text;
  }
}
