import {
  ConditionsTable,
  Loader,
  MainInfoSection,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';
import { ResourceErrorNotice } from '../common/ResourceState';
import StatusLabel, { conditionToStatus } from '../common/StatusLabel';
import { getConditionStatus } from '../helpers';
import { ManagedCluster } from '../resources';
import GoToCluster from './GoToCluster';

export default function ClusterDetail() {
  const { name } = useParams<{ name: string }>();
  const [cluster, error] = ManagedCluster.useGet(name!);

  if (!cluster || error?.status === 401 || error?.status === 403 || error?.status === 404) {
    return (
      <SectionBox title="Managed Cluster">
        {error ? (
          <ResourceErrorNotice error={error} resource="Managed cluster" />
        ) : (
          <Loader title="Loading Managed cluster…" />
        )}
      </SectionBox>
    );
  }

  const available = getConditionStatus(
    cluster.jsonData.status?.conditions,
    'ManagedClusterConditionAvailable'
  );
  const joined = getConditionStatus(cluster.jsonData.status?.conditions, 'ManagedClusterJoined');

  return (
    <>
      {error && <ResourceErrorNotice error={error} resource="Managed cluster" hasData />}
      <MainInfoSection
        noDefaultActions
        resource={cluster}
        title="Managed Cluster"
        actions={[
          <GoToCluster
            key="go-to-cluster"
            hub={cluster.cluster}
            clusterName={cluster.metadata.name}
          />,
        ]}
        extraInfo={[
          {
            name: 'Status',
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
          {
            name: 'Joined',
            value: (
              <StatusLabel status={conditionToStatus(joined?.status)}>
                {joined?.status === 'True'
                  ? 'Joined'
                  : joined?.status === 'False'
                  ? 'Not Joined'
                  : 'Unknown'}
              </StatusLabel>
            ),
          },
          {
            name: 'Kubernetes Version',
            value: cluster.kubernetesVersion || '-',
          },
          {
            name: 'Hub Accepts Client',
            value:
              cluster.jsonData.spec?.hubAcceptsClient === true
                ? 'Yes'
                : cluster.jsonData.spec?.hubAcceptsClient === false
                ? 'No'
                : '-',
          },
          {
            name: 'Lease Duration',
            value: cluster.jsonData.spec?.leaseDurationSeconds
              ? `${cluster.jsonData.spec.leaseDurationSeconds}s`
              : '-',
          },
        ]}
      />

      <SectionBox title="Capacity & Allocatable">
        <SimpleTable
          data={Object.keys(cluster.jsonData.status?.capacity ?? {}).map(key => ({
            resource: key,
            capacity: cluster.jsonData.status?.capacity?.[key] ?? '-',
            allocatable: cluster.jsonData.status?.allocatable?.[key] ?? '-',
          }))}
          columns={[
            { label: 'Resource', getter: (row: { resource: string }) => row.resource },
            { label: 'Capacity', getter: (row: { capacity: string }) => row.capacity },
            { label: 'Allocatable', getter: (row: { allocatable: string }) => row.allocatable },
          ]}
        />
      </SectionBox>

      {cluster.clusterClaims.length > 0 && (
        <SectionBox title="Cluster Claims">
          <SimpleTable
            data={cluster.clusterClaims}
            columns={[
              { label: 'Name', getter: (row: { name: string }) => row.name },
              { label: 'Value', getter: (row: { value: string }) => row.value },
            ]}
          />
        </SectionBox>
      )}

      {cluster.jsonData.spec?.taints?.length > 0 && (
        <SectionBox title="Taints">
          <SimpleTable
            data={cluster.jsonData.spec.taints}
            columns={[
              { label: 'Key', getter: (row: { key: string }) => row.key },
              { label: 'Value', getter: (row: { value: string }) => row.value ?? '-' },
              { label: 'Effect', getter: (row: { effect: string }) => row.effect },
            ]}
          />
        </SectionBox>
      )}

      <SectionBox title="Conditions">
        <ConditionsTable resource={cluster.jsonData} />
      </SectionBox>
    </>
  );
}
