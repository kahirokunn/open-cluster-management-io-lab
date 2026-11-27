import {
  ConditionsTable,
  Link,
  Loader,
  MainInfoSection,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';
import { ResourceErrorNotice, ResourceListState } from '../common/ResourceState';
import StatusLabel, { conditionToStatus } from '../common/StatusLabel';
import { getConditionStatus } from '../helpers';
import { Placement, PlacementDecision } from '../resources';

export default function PlacementDetail() {
  const { namespace, name } = useParams<{ namespace: string; name: string }>();
  const [placement, error] = Placement.useGet(name!, namespace!);
  const decisions = PlacementDecision.useList({
    clusters: placement ? [placement.cluster] : [],
    namespace,
    labelSelector: `cluster.open-cluster-management.io/placement=${name}`,
  });

  if (!placement || error?.status === 401 || error?.status === 403 || error?.status === 404) {
    return (
      <SectionBox title="Placement">
        {error ? (
          <ResourceErrorNotice error={error} resource="Placement" />
        ) : (
          <Loader title="Loading Placement…" />
        )}
      </SectionBox>
    );
  }

  const satisfied = getConditionStatus(placement.jsonData.status?.conditions, 'PlacementSatisfied');

  return (
    <>
      {error && <ResourceErrorNotice error={error} resource="Placement" hasData />}
      <MainInfoSection
        noDefaultActions
        resource={placement}
        title="Placement"
        extraInfo={[
          {
            name: 'Namespace',
            value: placement.metadata.namespace,
          },
          {
            name: 'Cluster Sets',
            value: placement.jsonData.spec?.clusterSets?.join(', ') || '-',
          },
          {
            name: 'Requested Clusters',
            value: placement.jsonData.spec?.numberOfClusters?.toString() ?? 'Any',
          },
          {
            name: 'Selected Clusters',
            value: placement.numberOfSelectedClusters.toString(),
          },
          {
            name: 'Status',
            value: (
              <StatusLabel status={conditionToStatus(satisfied?.status)}>
                {satisfied?.status === 'True'
                  ? 'Satisfied'
                  : satisfied?.status === 'False'
                  ? 'Not Satisfied'
                  : 'Unknown'}
              </StatusLabel>
            ),
          },
        ]}
      />

      <SectionBox title="Selected Clusters">
        <ResourceListState
          result={{
            ...decisions,
            items: decisions.items?.flatMap(decision => decision.decisions) ?? null,
          }}
          resource="placement decisions"
          empty="No clusters selected."
        >
          {selectedClusters => (
            <SimpleTable
              data={selectedClusters}
              columns={[
                {
                  label: 'Cluster',
                  getter: (row: { clusterName: string }) => (
                    <Link
                      routeName="ocm-cluster-detail"
                      params={{ name: row.clusterName, cluster: placement.cluster }}
                    >
                      {row.clusterName}
                    </Link>
                  ),
                },
                {
                  label: 'Reason',
                  getter: (row: { reason: string }) => row.reason || '-',
                },
              ]}
            />
          )}
        </ResourceListState>
      </SectionBox>

      <SectionBox title="Conditions">
        <ConditionsTable resource={placement} />
      </SectionBox>
    </>
  );
}
