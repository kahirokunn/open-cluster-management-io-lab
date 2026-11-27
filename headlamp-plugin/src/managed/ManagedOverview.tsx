import { K8s } from '@kinvolk/headlamp-plugin/lib';
import {
  ConditionsTable,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { ResourceListState } from '../common/ResourceState';
import StatusLabel, { conditionToStatus } from '../common/StatusLabel';
import { getConditionStatus } from '../helpers';
import { AppliedManifestWork, ClusterClaim, Klusterlet } from '../resources';
import AgentPods from './AgentPods';

function KlusterletInfo({ klusterlet }: { klusterlet: Klusterlet }) {
  const available = getConditionStatus(klusterlet.jsonData.status?.conditions, 'Available');
  return (
    <div>
      <h3>
        {klusterlet.cluster} / {klusterlet.metadata.name}
      </h3>
      <SimpleTable
        data={[
          { label: 'Cluster Name', value: klusterlet.clusterName || '-' },
          { label: 'Deploy Mode', value: klusterlet.deployMode },
          { label: 'Agent Namespace', value: klusterlet.agentNamespace },
          {
            label: 'Status',
            value: (
              <StatusLabel status={conditionToStatus(available?.status)}>
                {available?.status === 'True'
                  ? 'Available'
                  : available?.status === 'False'
                  ? 'Unavailable'
                  : 'Unknown'}
              </StatusLabel>
            ),
          },
        ]}
        columns={[
          { label: 'Field', getter: (row: { label: string }) => row.label },
          { label: 'Value', getter: row => row.value },
        ]}
      />
      <ConditionsTable resource={klusterlet.jsonData} />
    </div>
  );
}

export default function ManagedOverview() {
  const clusters = K8s.useSelectedClusters();
  const klusterlets = Klusterlet.useList();
  const claims = ClusterClaim.useList();
  const appliedWorks = AppliedManifestWork.useList();

  return (
    <>
      <SectionBox title="Klusterlets">
        <ResourceListState
          result={klusterlets}
          resource="klusterlets"
          empty="No klusterlets found."
        >
          {items =>
            items.map(klusterlet => (
              <KlusterletInfo
                key={JSON.stringify([klusterlet.cluster, klusterlet.metadata.name])}
                klusterlet={klusterlet}
              />
            ))
          }
        </ResourceListState>
      </SectionBox>

      <SectionBox title="Cluster Claims">
        <ResourceListState
          result={claims}
          resource="cluster claims"
          empty="No cluster claims found."
        >
          {items => (
            <SimpleTable
              data={items}
              columns={[
                {
                  label: 'Name',
                  getter: (claim: InstanceType<typeof ClusterClaim>) => claim.metadata.name,
                },
                {
                  label: 'Value',
                  getter: (claim: InstanceType<typeof ClusterClaim>) => claim.claimValue || '-',
                },
              ]}
            />
          )}
        </ResourceListState>
      </SectionBox>

      <SectionBox title="Applied ManifestWorks">
        <ResourceListState
          result={appliedWorks}
          resource="applied manifest works"
          empty="No manifest works applied to this cluster."
        >
          {items => (
            <SimpleTable
              data={items}
              columns={[
                {
                  label: 'Name',
                  getter: (work: InstanceType<typeof AppliedManifestWork>) => work.metadata.name,
                },
                {
                  label: 'Resources',
                  getter: (work: InstanceType<typeof AppliedManifestWork>) =>
                    work.appliedResources.length.toString(),
                },
                {
                  label: 'Age',
                  getter: (work: InstanceType<typeof AppliedManifestWork>) =>
                    work.metadata.creationTimestamp ?? '-',
                },
              ]}
            />
          )}
        </ResourceListState>
      </SectionBox>

      <SectionBox title="Agent Pods">
        {clusters.map(cluster => (
          <div key={cluster}>
            {clusters.length > 1 && <h3>{cluster}</h3>}
            <AgentPods cluster={cluster} />
          </div>
        ))}
      </SectionBox>
    </>
  );
}
