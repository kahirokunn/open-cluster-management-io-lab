import { act, cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, useHistory, useParams } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import OCMPage from './OCMPage';

const { discover } = vi.hoisted(() => ({ discover: vi.fn() }));

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  ApiProxy: { clusterRequest: discover },
  K8s: { useSelectedClusters: () => ['hub'] },
}));

vi.mock('@kinvolk/headlamp-plugin/lib/components/common', () => ({
  Loader: ({ title }: { title: string }) => <p>{title}</p>,
  SectionBox: ({ children }: { children: ReactNode }) => <section>{children}</section>,
}));

afterEach(cleanup);

describe('OCMPage', () => {
  it('retries failed discovery on another resource of the same cluster', async () => {
    discover.mockReset().mockRejectedValue(new Error('Discovery unavailable'));
    let history: ReturnType<typeof useHistory>;

    function ClusterDetail() {
      history = useHistory();
      const { name } = useParams<{ name: string }>();
      return (
        <OCMPage clusterRole="hub" title="Managed Cluster">
          {name}
        </OCMPage>
      );
    }

    render(
      <MemoryRouter initialEntries={['/c/hub/ocm/clusters/east']}>
        <Route path="/c/:cluster/ocm/clusters/:name" component={ClusterDetail} />
      </MemoryRouter>
    );

    expect((await screen.findByRole('alert')).textContent).toContain('Discovery unavailable');
    discover.mockResolvedValue({ resources: [{ name: 'managedclusters' }] });
    act(() => history.push('/c/hub/ocm/clusters/west'));

    expect(await screen.findByText('west')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();

    discover.mockClear();
    act(() => history.push('/c/hub/ocm/clusters/north'));
    expect(screen.getByText('north')).toBeTruthy();
    expect(discover).not.toHaveBeenCalled();
  });
});
