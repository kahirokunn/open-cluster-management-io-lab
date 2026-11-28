import { Link, SectionBox, SimpleTable } from '@kinvolk/headlamp-plugin/lib/components/common';
import { ResourceListState } from '../common/ResourceState';
import StatusLabel, { conditionToStatus } from '../common/StatusLabel';
import { getConditionStatus } from '../helpers';
import { Placement } from '../resources';

export default function PlacementList() {
  const result = Placement.useList();

  return (
    <SectionBox title="Placements">
      <ResourceListState result={result} resource="placements" empty="No placements found.">
        {items => (
          <SimpleTable
            data={items}
            columns={[
              {
                label: 'Name',
                getter: (p: InstanceType<typeof Placement>) => (
                  <Link
                    routeName="ocm-placement-detail"
                    params={{
                      namespace: p.metadata.namespace,
                      name: p.metadata.name,
                      cluster: p.cluster,
                    }}
                  >
                    {p.metadata.name}
                  </Link>
                ),
                sort: true,
              },
              {
                label: 'Namespace',
                getter: (p: InstanceType<typeof Placement>) => p.metadata.namespace,
              },
              {
                label: 'Cluster Sets',
                getter: (p: InstanceType<typeof Placement>) =>
                  p.jsonData.spec?.clusterSets?.join(', ') || '-',
              },
              {
                label: 'Selected',
                getter: (p: InstanceType<typeof Placement>) =>
                  `${p.numberOfSelectedClusters}` +
                  (p.jsonData.spec?.numberOfClusters
                    ? ` / ${p.jsonData.spec.numberOfClusters}`
                    : ''),
              },
              {
                label: 'Status',
                getter: (p: InstanceType<typeof Placement>) => {
                  const satisfied = getConditionStatus(
                    p.jsonData.status?.conditions,
                    'PlacementSatisfied'
                  );
                  return (
                    <StatusLabel status={conditionToStatus(satisfied?.status)}>
                      {satisfied?.status === 'True'
                        ? 'Satisfied'
                        : satisfied?.status === 'False'
                        ? 'Not Satisfied'
                        : 'Unknown'}
                    </StatusLabel>
                  );
                },
              },
              {
                label: 'Age',
                getter: (p: InstanceType<typeof Placement>) => p.metadata.creationTimestamp ?? '-',
                sort: true,
              },
            ]}
          />
        )}
      </ResourceListState>
    </SectionBox>
  );
}
