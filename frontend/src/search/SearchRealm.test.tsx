import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ServicesProvider } from '../state/services';
import SearchRealm from './SearchRealm';

const fetchMock = vi.fn();
beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  localStorage.clear();
});

const results = [
  { title: 'Raft Consensus', content: 'the <span>consensus</span> problem', url: 'https://raft.io', score: 9.4 },
  { title: 'Paxos', content: 'a <span>consensus</span> protocol', url: 'https://paxos.io', score: 4.7 },
];

describe('SearchRealm', () => {
  it('searches on Enter and renders sanitized, highlighted results', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify(results), { status: 200 }));
    render(
      <ServicesProvider>
        <SearchRealm />
      </ServicesProvider>,
    );

    await userEvent.type(screen.getByRole('searchbox'), 'consensus{Enter}');

    expect(await screen.findByText('Raft Consensus')).toBeInTheDocument();
    expect(fetchMock.mock.calls[0][0]).toContain('/search?query=consensus&accuracy=0.5');
    const marks = document.querySelectorAll('mark.hit');
    expect(marks.length).toBe(2);
    expect(screen.getByRole('link', { name: 'https://raft.io' })).toHaveAttribute('href', 'https://raft.io');
    expect(screen.getByText(/2 results/i)).toBeInTheDocument();
  });

  it('shows empty state when no results', async () => {
    fetchMock.mockResolvedValue(new Response('[]', { status: 200 }));
    render(
      <ServicesProvider>
        <SearchRealm />
      </ServicesProvider>,
    );
    await userEvent.type(screen.getByRole('searchbox'), 'nothing{Enter}');
    expect(await screen.findByText(/no results/i)).toBeInTheDocument();
  });

  it('inserts syntax chips into the query', async () => {
    render(
      <ServicesProvider>
        <SearchRealm />
      </ServicesProvider>,
    );
    const box = screen.getByRole('searchbox');
    await userEvent.type(box, 'alpha');
    await userEvent.click(screen.getByRole('button', { name: 'AND' }));
    expect(box).toHaveValue('alpha AND ');
  });
});
