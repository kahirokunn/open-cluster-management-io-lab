import { cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Klusterlet } from '../resources';
import ManagedOverview from './ManagedOverview';

const { listKlusterlets, listPods } = vi.hoisted(() => ({
  listKlusterlets: vi.fn(),
  listPods: vi.fn(),
}));

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  K8s: {
    cluster: {
      KubeObject: class {
        constructor(public jsonData: { metadata: { name: string } }) {}

        get metadata() {
          return this.jsonData.metadata;
        }
      },
    },
    useSelectedClusters: () => ['edge-east', 'edge-west'],
    ResourceClasses: { Pod: { useList: listPods } },
  },
}));

vi.mock('@kinvolk/headlamp-plugin/lib/components/common', () => ({
  ConditionsTable: () => null,
  Loader: ({ title }: { title: string }) => <p>{title}</p>,
  SectionBox: ({ children }: { children: ReactNode }) => <section>{children}</section>,
  SimpleTable: ({ data }: { data: { metadata?: { name: string } }[] }) => (
    <p>{data.map(row => row.metadata?.name).join(', ')}</p>
  ),
}));

vi.mock('../resources', async importOriginal => {
  const resources = await importOriginal<typeof import('../resources')>();
  return {
    Klusterlet: class extends resources.Klusterlet {
      static useList = listKlusterlets;
    },
    ClusterClaim: { useList: () => ({ items: [], error: null }) },
    AppliedManifestWork: { useList: () => ({ items: [], error: null }) },
  };
});

const assignedNamespaces: Record<string, string> = {
  'edge-east': 'east-agents',
  'edge-west': 'west-agents',
};

function klusterlet(name: string, namespace: string, mode = 'Default') {
  return new Klusterlet({ metadata: { name }, spec: { namespace, deployOption: { mode } } });
}

beforeEach(() => {
  listKlusterlets.mockReset().mockImplementation((options?: { cluster: string }) => ({
    items: options
      ? [
          klusterlet(
            options.cluster,
            assignedNamespaces[options.cluster],
            options.cluster === 'edge-west' ? 'Singleton' : 'Default'
          ),
        ]
      : [],
    error: null,
  }));
  listPods
    .mockReset()
    .mockImplementation(({ cluster, namespace }) =>
      namespace.length === 1 && assignedNamespaces[cluster] === namespace[0]
        ? { items: [{ metadata: { name: `${cluster}-agent` } }], error: null }
        : { items: [], error: { status: 403, message: 'Forbidden' } }
    );
});

afterEach(cleanup);

describe('Agent Pods', () => {
  it('queries only the permitted agent namespace on each selected cluster', () => {
    render(<ManagedOverview />);

    expect(listPods.mock.calls).toEqual([
      [{ cluster: 'edge-east', namespace: ['east-agents'] }],
      [{ cluster: 'edge-west', namespace: ['west-agents'] }],
    ]);
    expect(screen.getByText('edge-east-agent')).toBeTruthy();
    expect(screen.getByText('edge-west-agent')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('uses each hosted klusterlet name as a namespace on its hosting cluster', () => {
    listKlusterlets.mockImplementation((options?: { cluster: string }) => ({
      items:
        options?.cluster === 'edge-east'
          ? [
              klusterlet('hosted-work', 'open-cluster-management-work', 'Hosted'),
              klusterlet(
                'hosted-singleton',
                'open-cluster-management-singleton',
                'SingletonHosted'
              ),
            ]
          : [],
      error: null,
    }));
    listPods.mockImplementation(
      ({ cluster, namespace }: { cluster: string; namespace: string[] }) => ({
        items:
          cluster === 'edge-east'
            ? namespace.map(name => ({ metadata: { name: `${name}-agent` } }))
            : [],
        error: null,
      })
    );

    render(<ManagedOverview />);

    expect(listPods).toHaveBeenCalledWith({
      cluster: 'edge-east',
      namespace: ['hosted-work', 'hosted-singleton'],
    });
    expect(listPods).toHaveBeenCalledTimes(2);
    expect(screen.getByText('hosted-work-agent, hosted-singleton-agent')).toBeTruthy();
  });

  it('waits for each cluster’s klusterlet result before using the default namespace', () => {
    let westKlusterlets: [] | null = null;
    let westIsFetching = true;
    listKlusterlets.mockImplementation((options?: { cluster: string }) => ({
      items:
        options?.cluster === 'edge-west'
          ? westKlusterlets
          : options
          ? [klusterlet('edge-east', 'east-agents')]
          : [],
      error: null,
      isFetching: options?.cluster === 'edge-west' && westIsFetching,
    }));
    const view = render(<ManagedOverview />);

    expect(listPods).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Finding the agent namespace…')).toBeTruthy();

    westKlusterlets = [];
    view.rerender(<ManagedOverview />);
    expect(listPods.mock.calls.every(([options]) => options.cluster === 'edge-east')).toBe(true);
    expect(screen.getByText('Finding the agent namespace…')).toBeTruthy();

    westIsFetching = false;
    view.rerender(<ManagedOverview />);

    expect(listPods).toHaveBeenLastCalledWith({
      cluster: 'edge-west',
      namespace: ['open-cluster-management-agent'],
    });
  });

  it('shows the klusterlet lookup error without guessing the agent namespace', () => {
    listKlusterlets.mockImplementation((options?: { cluster: string }) => {
      if (options?.cluster === 'edge-west') {
        return { items: [], error: { status: 403, message: 'Forbidden' } };
      }
      return { items: options ? [klusterlet('edge-east', 'east-agents')] : [], error: null };
    });

    render(<ManagedOverview />);

    expect(listPods.mock.calls).toEqual([[{ cluster: 'edge-east', namespace: ['east-agents'] }]]);
    expect(screen.getByText('edge-east-agent')).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toBe(
      'You do not have permission to read the klusterlet.'
    );
  });

  it('shows a warning and keeps Pods from the last known agent namespace on a lookup error', () => {
    listKlusterlets.mockImplementation((options?: { cluster: string }) => {
      if (options?.cluster === 'edge-east') {
        return {
          items: [klusterlet('edge-east', 'east-agents')],
          error: { status: 503, message: 'Service Unavailable' },
        };
      }
      return { items: options ? [klusterlet('edge-west', 'west-agents')] : [], error: null };
    });

    render(<ManagedOverview />);

    expect(screen.getByText('edge-east-agent')).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toContain(
      'Updates for agent namespace information were interrupted.'
    );
  });
});
