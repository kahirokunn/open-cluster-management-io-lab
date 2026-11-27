import { cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AddOnDetail from './AddOnDetail';
import AddOnList from './AddOnList';

const { listInstallations } = vi.hoisted(() => ({ listInstallations: vi.fn() }));

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({}));
vi.mock('react-router-dom', () => ({ useParams: () => ({ name: 'cluster-proxy' }) }));

vi.mock('../resources', () => {
  const addon = {
    cluster: 'hub',
    metadata: { name: 'cluster-proxy' },
    displayName: 'Cluster Proxy',
  };
  return {
    ClusterManagementAddOn: {
      useList: () => ({ items: [addon], error: null }),
      useGet: () => [addon, null],
    },
    ManagedClusterAddOn: { useList: listInstallations },
  };
});

vi.mock('@kinvolk/headlamp-plugin/lib/components/common', () => ({
  ConditionsTable: () => null,
  Link: ({ children }: { children: ReactNode }) => <span>{children}</span>,
  Loader: () => null,
  MainInfoSection: ({ extraInfo }: { extraInfo: { name: string; value: ReactNode }[] }) => (
    <p>{extraInfo.find(row => row.name === 'Clusters')?.value}</p>
  ),
  SectionBox: ({ children }: { children: ReactNode }) => <section>{children}</section>,
  SimpleTable: ({
    data,
    columns,
  }: {
    data: unknown[];
    columns: { label: string; getter: (row: unknown) => ReactNode }[];
  }) => (
    <p>{data.length > 0 && columns.find(column => column.label === 'Clusters')?.getter(data[0])}</p>
  ),
}));

afterEach(cleanup);

describe('Add-on installation counts', () => {
  it.each([
    { View: AddOnList, empty: '0 / 0 available' },
    { View: AddOnDetail, empty: '0' },
  ])('waits for installations in $View.name', ({ View, empty }) => {
    listInstallations.mockReturnValue({ items: [], error: null, isFetching: true });
    const view = render(<View />);

    expect(screen.getByText('Loading…')).toBeTruthy();
    expect(screen.queryByText(empty)).toBeNull();

    listInstallations.mockReturnValue({ items: [], error: null, isFetching: false });
    view.rerender(<View />);

    expect(screen.getByText(empty)).toBeTruthy();
  });
});
