import { Link, SimpleTable } from '@kinvolk/headlamp-plugin/lib/components/common';
import { type ResourceListResult, ResourceListState } from '../common/ResourceState';
import StatusLabel, { conditionToStatus } from '../common/StatusLabel';
import { getConditionStatus } from '../helpers';
import type { ManagedCluster } from '../resources';

function ClusterCondition({
  cluster,
  condition,
  whenTrue,
  whenFalse,
}: {
  cluster: ManagedCluster;
  condition: string;
  whenTrue: string;
  whenFalse: string;
}) {
  const status = getConditionStatus(cluster.jsonData.status?.conditions, condition)?.status;
  return (
    <StatusLabel status={conditionToStatus(status)}>
      {status === 'True' ? whenTrue : status === 'False' ? whenFalse : 'Unknown'}
    </StatusLabel>
  );
}

export function ClusterTable({ clusters }: { clusters: ResourceListResult<ManagedCluster> }) {
  return (
    <ResourceListState result={clusters} resource="managed clusters" empty="No managed clusters.">
      {items => (
        <SimpleTable
          data={items}
          columns={[
            {
              label: 'Name',
              getter: cluster => (
                <Link
                  routeName="ocm-cluster-detail"
                  params={{ name: cluster.metadata.name, cluster: cluster.cluster }}
                >
                  {cluster.metadata.name}
                </Link>
              ),
              sort: true,
            },
            {
              label: 'Role',
              getter: cluster =>
                cluster.metadata.labels?.['local-cluster'] === 'true' ? 'Hub' : 'Managed',
            },
            {
              label: 'Status',
              getter: cluster => (
                <ClusterCondition
                  cluster={cluster}
                  condition="ManagedClusterConditionAvailable"
                  whenTrue="Available"
                  whenFalse="Unavailable"
                />
              ),
            },
            {
              label: 'Joined',
              getter: cluster => (
                <ClusterCondition
                  cluster={cluster}
                  condition="ManagedClusterJoined"
                  whenTrue="Joined"
                  whenFalse="Not joined"
                />
              ),
            },
            { label: 'K8s Version', getter: cluster => cluster.kubernetesVersion || '—' },
            { label: 'CPU', getter: cluster => cluster.cpuCapacity || '—' },
            { label: 'Memory', getter: cluster => cluster.memoryCapacity || '—' },
            {
              label: 'Created',
              getter: cluster => cluster.metadata.creationTimestamp ?? '—',
              sort: true,
            },
          ]}
        />
      )}
    </ResourceListState>
  );
}
