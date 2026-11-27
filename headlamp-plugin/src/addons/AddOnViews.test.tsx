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
    jsonData: { metadata: { name: 'cluster-proxy' } },
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
  ConditionsTable: ({ resource }: { resource: { metadata: { name: string } } }) => (
    <p>Conditions for {resource.metadata.name}</p>
  ),
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

describe('Add-on views', () => {
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

  it('keeps conditions for readable installations on a partial 404 and hides them on 401', () => {
    const installation = {
      metadata: { name: 'cluster-proxy', namespace: 'edge-east' },
      jsonData: { metadata: { name: 'installation on edge-east' } },
    };
    listInstallations.mockReturnValue({
      items: [installation],
      error: { status: 404, message: 'One namespace could not be found.' },
    });
    const view = render(<AddOnDetail />);

    expect(screen.getByText('Conditions for installation on edge-east')).toBeTruthy();

    listInstallations.mockReturnValue({
      items: [installation],
      error: { status: 401, message: 'Unauthorized' },
    });
    view.rerender(<AddOnDetail />);

    expect(screen.queryByText('Conditions for installation on edge-east')).toBeNull();
    expect(screen.getByText('Conditions for cluster-proxy')).toBeTruthy();
  });
});
