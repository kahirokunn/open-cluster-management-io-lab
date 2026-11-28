import { act, cleanup, render, waitFor } from '@testing-library/react';
import type { ComponentType } from 'react';
import { MemoryRouter, useHistory } from 'react-router-dom';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { registerOCMSidebar } from './sidebar';

type Role = 'hub' | 'managed' | 'none' | 'signed-out';
type Filter = (entry: { name: string }) => { name: string } | null;

const { selected, roles, discovery, registry } = vi.hoisted(() => ({
  selected: { clusters: [] as string[] },
  roles: {} as Record<string, Role>,
  discovery: vi.fn(),
  registry: {
    filter: undefined as unknown as Filter,
    detector: undefined as unknown as ComponentType,
    refreshes: 0,
  },
}));

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  ApiProxy: { clusterRequest: discovery },
  K8s: { useSelectedClusters: () => selected.clusters },
  // Headlamp's runtime returns the whole URL group since kubernetes-sigs/headlamp#8070.
  Utils: { getClusterGroup: () => selected.clusters },
  registerSidebarEntry: () => {
    registry.refreshes++;
  },
  registerSidebarEntryFilter: (filter: Filter) => {
    registry.filter = filter;
  },
  registerAppBarAction: (action: ComponentType) => {
    registry.detector = action;
  },
}));

const pages = [
  'ocm',
  'ocm-overview',
  'ocm-clusters',
  'ocm-placements',
  'ocm-manifestwork',
  'ocm-manifestworkreplicasets',
  'ocm-addons',
  'ocm-managed',
  'workloads',
];

/** The sidebar entries left after the plugin's filter. */
const shown = () => pages.filter(name => registry.filter({ name }));

/** Renders the detector for the selected clusters and returns a way to navigate. */
function view(...clusters: string[]) {
  selected.clusters = clusters;
  let history: ReturnType<typeof useHistory>;
  function Navigator() {
    history = useHistory();
    return null;
  }
  const Detector = registry.detector;
  render(
    <MemoryRouter initialEntries={[`/c/${clusters.join('+')}/`]}>
      <Detector />
      <Navigator />
    </MemoryRouter>
  );
  return (path: string) => act(() => history.push(path));
}

beforeAll(registerOCMSidebar);

beforeEach(() => {
  // Each cluster serves the OCM APIs of its role, as API discovery does.
  discovery.mockReset().mockImplementation(async (path: string, { cluster }) => {
    const role = roles[cluster];
    if (role === 'signed-out') throw Object.assign(new Error('Unauthorized'), { status: 401 });
    if (role === 'hub' && path === '/apis/cluster.open-cluster-management.io/v1') {
      return { resources: [{ name: 'managedclusters' }] };
    }
    if (role === 'managed' && path === '/apis/operator.open-cluster-management.io/v1') {
      return { resources: [{ name: 'klusterlets' }] };
    }
    throw Object.assign(new Error('Not Found'), { status: 404 });
  });
});

afterEach(cleanup);

describe('OCM sidebar', () => {
  it('shows only the fleet pages on a hub', async () => {
    roles['hub-1'] = 'hub';
    const navigate = view('hub-1');

    await waitFor(() =>
      expect(shown()).toEqual([
        'ocm',
        'ocm-overview',
        'ocm-clusters',
        'ocm-placements',
        'ocm-manifestwork',
        'ocm-manifestworkreplicasets',
        'ocm-addons',
        'workloads',
      ])
    );
    // A detected role is kept while the user moves between pages of the cluster.
    const requests = discovery.mock.calls.length;
    navigate('/c/hub-1/ocm/clusters');
    expect(discovery).toHaveBeenCalledTimes(requests);
  });

  it('shows only the agent page on a managed cluster', async () => {
    roles['edge-1'] = 'managed';
    view('edge-1');

    await waitFor(() => expect(shown()).toEqual(['ocm', 'ocm-managed', 'workloads']));
  });

  it('shows only the agent page when two managed clusters are selected', async () => {
    roles['edge-east'] = 'managed';
    roles['edge-west'] = 'managed';
    view('edge-east', 'edge-west');

    await waitFor(() => expect(shown()).toEqual(['ocm', 'ocm-managed', 'workloads']));
  });

  it('hides the OCM group on a cluster without OCM', async () => {
    roles['plain'] = 'none';
    view('plain');

    await waitFor(() => expect(shown()).not.toContain('ocm'));
  });

  it('shows the menu on the next navigation after OCM is installed', async () => {
    roles['newly-managed'] = 'none';
    const navigate = view('newly-managed');
    await waitFor(() => expect(shown()).not.toContain('ocm'));

    roles['newly-managed'] = 'managed';
    navigate('/c/newly-managed/workloads');

    await waitFor(() => expect(shown()).toEqual(['ocm', 'ocm-managed', 'workloads']));
  });

  it('restores the fallback menu after a retry fails on a previously undiscovered cluster', async () => {
    roles['retry-failed'] = 'none';
    const navigate = view('retry-failed');
    await waitFor(() => expect(shown()).not.toContain('ocm'));

    roles['retry-failed'] = 'signed-out';
    navigate('/c/retry-failed/workloads');

    await waitFor(() => expect(shown()).toEqual(pages));
  });

  it('detects the role again once the user signs in', async () => {
    roles['edge-2'] = 'signed-out';
    const navigate = view('edge-2');

    await waitFor(() => expect(discovery).toHaveBeenCalled());
    // Until the role is known, every page stays.
    expect(shown()).toEqual(pages);

    // Headlamp asks the user to sign in, then brings them back to the page they were on.
    navigate('/c/edge-2/login');
    roles['edge-2'] = 'managed';
    const refreshes = registry.refreshes;
    navigate('/c/edge-2/');

    await waitFor(() => expect(shown()).toEqual(['ocm', 'ocm-managed', 'workloads']));
    expect(registry.refreshes).toBeGreaterThan(refreshes);
  });
});
