import { Link, SectionBox, SimpleTable } from '@kinvolk/headlamp-plugin/lib/components/common';
import { ResourceListState } from '../common/ResourceState';
import StatusLabel, { conditionToStatus } from '../common/StatusLabel';
import { getConditionStatus } from '../helpers';
import { ManifestWork } from '../resources';

export default function ManifestWorkList() {
  const result = ManifestWork.useList();

  return (
    <SectionBox title="ManifestWorks">
      <ResourceListState result={result} resource="manifest works" empty="No manifest works found.">
        {items => (
          <SimpleTable
            data={items}
            columns={[
              {
                label: 'Name',
                getter: (w: InstanceType<typeof ManifestWork>) => (
                  <Link
                    routeName="ocm-manifestwork-detail"
                    params={{
                      namespace: w.metadata.namespace,
                      name: w.metadata.name,
                      cluster: w.cluster,
                    }}
                  >
                    {w.metadata.name}
                  </Link>
                ),
                sort: true,
              },
              {
                label: 'Target Cluster',
                getter: (w: InstanceType<typeof ManifestWork>) => (
                  <Link
                    routeName="ocm-cluster-detail"
                    params={{ name: w.metadata.namespace, cluster: w.cluster }}
                  >
                    {w.metadata.namespace}
                  </Link>
                ),
              },
              {
                label: 'Source',
                getter: (w: InstanceType<typeof ManifestWork>) => {
                  const replicaSet =
                    w.jsonData.metadata?.labels?.[
                      'work.open-cluster-management.io/manifestworkreplicaset'
                    ];
                  return replicaSet ? (
                    <StatusLabel status="success">ReplicaSet</StatusLabel>
                  ) : (
                    <StatusLabel status="unknown">Manual</StatusLabel>
                  );
                },
              },
              {
                label: 'Manifests',
                getter: (w: InstanceType<typeof ManifestWork>) => w.manifestCount.toString(),
              },
              {
                label: 'Applied',
                getter: (w: InstanceType<typeof ManifestWork>) => {
                  const applied = getConditionStatus(w.jsonData.status?.conditions, 'Applied');
                  return (
                    <StatusLabel status={conditionToStatus(applied?.status)}>
                      {applied?.status === 'True'
                        ? 'Applied'
                        : applied?.status === 'False'
                        ? 'Not Applied'
                        : 'Unknown'}
                    </StatusLabel>
                  );
                },
              },
              {
                label: 'Available',
                getter: (w: InstanceType<typeof ManifestWork>) => {
                  const available = getConditionStatus(w.jsonData.status?.conditions, 'Available');
                  return (
                    <StatusLabel status={conditionToStatus(available?.status)}>
                      {available?.status === 'True'
                        ? 'Available'
                        : available?.status === 'False'
                        ? 'Unavailable'
                        : 'Unknown'}
                    </StatusLabel>
                  );
                },
              },
              {
                label: 'Age',
                getter: (w: InstanceType<typeof ManifestWork>) =>
                  w.metadata.creationTimestamp ?? '-',
                sort: true,
              },
            ]}
          />
        )}
      </ResourceListState>
    </SectionBox>
  );
}
