import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ResourceListState } from './ResourceState';

vi.mock('@kinvolk/headlamp-plugin/lib/components/common', () => ({
  Loader: ({ title }: { title: string }) => <p>{title}</p>,
}));

afterEach(cleanup);

function renderList(status: number, items: string[]) {
  return render(
    <ResourceListState
      result={{ items, error: { status, message: 'The API request failed.' } }}
      resource="cluster claims"
      empty="No cluster claims found."
    >
      {claims => <p>{claims.join(', ')}</p>}
    </ResourceListState>
  );
}

describe('ResourceListState', () => {
  it('waits for pending requests before showing the empty state and keeps available rows', () => {
    function list(items: string[], isFetching: boolean) {
      return (
        <ResourceListState
          result={{ items, error: null, isFetching }}
          resource="cluster claims"
          empty="No cluster claims found."
        >
          {claims => <p>{claims.join(', ')}</p>}
        </ResourceListState>
      );
    }

    const view = render(list([], true));
    expect(screen.getByText('Loading cluster claims…')).toBeTruthy();
    expect(screen.queryByText('No cluster claims found.')).toBeNull();

    view.rerender(list(['readable-claim'], true));
    expect(screen.getByText('readable-claim')).toBeTruthy();
    expect(screen.queryByText('Loading cluster claims…')).toBeNull();

    view.rerender(list([], false));
    expect(screen.getByText('No cluster claims found.')).toBeTruthy();
  });

  it('keeps readable results when part of the list returns 404', () => {
    renderList(404, ['readable-claim']);

    expect(screen.getByText('readable-claim')).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toContain('Updates for cluster claims');
  });

  it('shows a not-found notice when a 404 has no results', () => {
    renderList(404, []);

    expect(screen.getByRole('alert').textContent).toBe('cluster claims could not be found.');
  });

  it('requires sign-in when the API returns 401', () => {
    renderList(401, ['cached-claim']);

    expect(screen.queryByText('cached-claim')).toBeNull();
    expect(screen.getByRole('alert').textContent).toBe('Sign in to read cluster claims.');
  });
});
