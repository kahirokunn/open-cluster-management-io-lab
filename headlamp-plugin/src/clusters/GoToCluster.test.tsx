import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import GoToCluster from './GoToCluster';

const { inventory, registeredClusters } = vi.hoisted(() => ({
  inventory: { registrations: [] as ReturnType<typeof registration>[] },
  registeredClusters: vi.fn(),
}));

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  K8s: {
    useClustersConf: () => ({}),
    ClusterProfile: { useRegisteredClusters: registeredClusters },
  },
  Router: {
    createRouteURL: (route: string, params: { cluster: string }) => `/c/${params.cluster}/`,
  },
}));

/** A connection Headlamp discovered from an OCM ClusterProfile, with that profile. */
function registration(id: string, clusterName = 'edge-1', hub = 'hub', namespace = 'inventory') {
  return {
    id,
    displayName: id,
    hub,
    origin: { resource: { namespace, name: clusterName } },
    owner: { metadata: { labels: { 'open-cluster-management.io/cluster-name': clusterName } } },
  };
}

function view() {
  let location = '';
  render(
    <MemoryRouter initialEntries={['/c/hub/ocm/clusters/edge-1']}>
      <GoToCluster hub="hub" clusterName="edge-1" />
      <Route
        path="*"
        render={({ location: current }) => {
          location = current.pathname;
          return null;
        }}
      />
    </MemoryRouter>
  );
  return () => location;
}

beforeEach(() => {
  inventory.registrations = [];
  // Headlamp returns only the connections discovered from the requested hub.
  registeredClusters.mockReset().mockImplementation(({ originCluster }) => ({
    clusters: inventory.registrations.filter(item => item.hub === originCluster),
  }));
});

afterEach(cleanup);

describe('Go to cluster', () => {
  it('opens the cluster Headlamp discovered from the OCM ClusterProfile', () => {
    inventory.registrations = [registration('other-cluster', 'edge-2'), registration('edge-1-id')];
    const location = view();

    expect(registeredClusters).toHaveBeenLastCalledWith({
      originCluster: 'hub',
      labelSelector: 'x-k8s.io/cluster-manager=open-cluster-management',
    });
    fireEvent.click(screen.getByRole('button', { name: 'Go to cluster' }));
    expect(location()).toBe('/c/edge-1-id/');
  });

  it('shows nothing when Headlamp has not discovered the cluster', () => {
    inventory.registrations = [registration('on-another-hub', 'edge-1', 'another-hub')];
    view();

    expect(screen.queryByRole('button')).toBeNull();
  });

  it('lists the connections in a menu when the cluster has several', () => {
    inventory.registrations = [
      registration('from-team-b', 'edge-1', 'hub', 'team-b'),
      registration('from-team-a', 'edge-1', 'hub', 'team-a'),
    ];
    const location = view();

    expect(screen.getAllByRole('button').map(button => button.textContent)).toEqual([
      'Go to cluster',
    ]);
    fireEvent.click(screen.getByRole('button', { name: 'Go to cluster' }));
    expect(screen.getAllByRole('menuitem').map(item => item.textContent)).toEqual([
      'team-aAccess provider: from-team-a',
      'team-bAccess provider: from-team-b',
    ]);
    fireEvent.click(screen.getByRole('menuitem', { name: /team-b/ }));
    expect(location()).toBe('/c/from-team-b/');
  });
});
