import { Link, SectionBox, SimpleTable } from '@kinvolk/headlamp-plugin/lib/components/common';
import {
  isResourceListLoading,
  ResourceErrorNotice,
  ResourceListState,
} from '../common/ResourceState';
import { getConditionStatus } from '../helpers';
import { ClusterManagementAddOn, ManagedClusterAddOn } from '../resources';

export default function AddOnList() {
  const addons = ClusterManagementAddOn.useList();
  const clusterAddons = ManagedClusterAddOn.useList();

  const installationsByHubAndName = new Map<string, InstanceType<typeof ManagedClusterAddOn>[]>();
  clusterAddons.items?.forEach((ca: InstanceType<typeof ManagedClusterAddOn>) => {
    const key = JSON.stringify([ca.cluster, ca.metadata.name]);
    const list = installationsByHubAndName.get(key) ?? [];
    list.push(ca);
    installationsByHubAndName.set(key, list);
  });

  return (
    <>
      <SectionBox title="Add-ons">
        {clusterAddons.error && (
          <ResourceErrorNotice error={clusterAddons.error} resource="managed cluster add-ons" />
        )}
        <ResourceListState result={addons} resource="add-ons" empty="No add-ons found.">
          {items => (
            <SimpleTable
              data={items}
              columns={[
                {
                  label: 'Name',
                  getter: (a: InstanceType<typeof ClusterManagementAddOn>) => (
                    <Link
                      routeName="ocm-addon-detail"
                      params={{ name: a.metadata.name, cluster: a.cluster }}
                    >
                      {a.displayName}
                    </Link>
                  ),
                  sort: true,
                },
                {
                  label: 'Install Strategy',
                  getter: (a: InstanceType<typeof ClusterManagementAddOn>) => a.installStrategy,
                },
                {
                  label: 'Clusters',
                  getter: (a: InstanceType<typeof ClusterManagementAddOn>) => {
                    if (clusterAddons.error) return 'Unavailable';
                    if (isResourceListLoading(clusterAddons)) return 'Loading…';
                    const cas =
                      installationsByHubAndName.get(JSON.stringify([a.cluster, a.metadata.name])) ??
                      [];
                    const available = cas.filter((ca: InstanceType<typeof ManagedClusterAddOn>) => {
                      const cond = getConditionStatus(ca.jsonData.status?.conditions, 'Available');
                      return cond?.status === 'True';
                    }).length;
                    return `${available} / ${cas.length} available`;
                  },
                },
                {
                  label: 'Age',
                  getter: (a: InstanceType<typeof ClusterManagementAddOn>) =>
                    a.metadata.creationTimestamp ?? '-',
                  sort: true,
                },
              ]}
            />
          )}
        </ResourceListState>
      </SectionBox>
    </>
  );
}
