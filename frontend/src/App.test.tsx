import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ServicesProvider } from './state/services';
import App from './App';

const fetchMock = vi.fn();
beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  localStorage.clear();
});

describe('App realm switching', () => {
  it('keeps a running crawl visible after visiting search and coming back', async () => {
    fetchMock.mockReturnValue(new Promise(() => {})); // crawl never resolves
    render(<ServicesProvider><App /></ServicesProvider>);

    await userEvent.click(screen.getByRole('button', { name: '⚙ Engine Room' }));
    await userEvent.click(screen.getByRole('button', { name: /^crawl$/i }));
    expect(screen.getByText(/^crawling…/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '⌕ Search' }));
    await userEvent.click(screen.getByRole('button', { name: '⚙ Engine Room' }));

    expect(screen.getByText(/^crawling…/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^crawl$/i })).toBeDisabled();
  });
});
