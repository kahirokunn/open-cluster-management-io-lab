import { cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Overview from './Overview';

const { listClusters } = vi.hoisted(() => ({ listClusters: vi.fn() }));

vi.mock('../resources', () => ({
  ManagedCluster: { useList: listClusters },
  ClusterManager: { useList: () => ({ items: [], error: null }) },
}));

vi.mock('../addons/AddOnList', () => ({ default: () => null }));
vi.mock('../clusters/ClusterTable', () => ({ ClusterTable: () => null }));
vi.mock('../manifestwork/ManifestWorkList', () => ({ default: () => null }));
vi.mock('../placements/PlacementList', () => ({ default: () => null }));
vi.mock('@kinvolk/headlamp-plugin/lib', () => ({}));

vi.mock('@kinvolk/headlamp-plugin/lib/components/common', () => ({
  SectionBox: ({ title, children }: { title: string; children: ReactNode }) => (
    <section>
      <h2>{title}</h2>
      {children}
    </section>
  ),
  TileChart: ({ title, label }: { title: string; label: string }) => <p>{`${title} ${label}`}</p>,
}));

afterEach(cleanup);

describe('Fleet Overview', () => {
  const cluster = { jsonData: { status: { conditions: [] } } };

  it.each([
    { items: [], error: null, isFetching: true },
    { items: [], error: { status: 403 }, isFetching: false },
    { items: [cluster], error: { status: 401 }, isFetching: false },
  ])('hides tiles if the fleet size is unknown or sign-in is required (%#)', result => {
    listClusters.mockReturnValue(result);
    render(<Overview />);

    expect(screen.queryByRole('heading', { name: 'Fleet Overview' })).toBeNull();
  });

  it.each([
    { items: [], error: null, count: '0' },
    { items: [cluster], error: { status: 403 }, count: '1' },
  ])('renders tiles for completed or readable results (%#)', ({ items, error, count }) => {
    listClusters.mockReturnValue({ items, error, isFetching: false });
    render(<Overview />);

    expect(screen.getByText(`Availability 0 / ${count}`)).toBeTruthy();
  });
});
