import {
  ConditionsTable,
  Link,
  Loader,
  MainInfoSection,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';
import { ResourceErrorNotice } from '../common/ResourceState';
import StatusLabel, { conditionToStatus } from '../common/StatusLabel';
import { getConditionStatus } from '../helpers';
import { ManifestWork } from '../resources';

export default function ManifestWorkDetail() {
  const { namespace, name } = useParams<{ namespace: string; name: string }>();
  const [work, error] = ManifestWork.useGet(name!, namespace!);

  if (!work || error?.status === 401 || error?.status === 403 || error?.status === 404) {
    return (
      <SectionBox title="ManifestWork">
        {error ? (
          <ResourceErrorNotice error={error} resource="ManifestWork" />
        ) : (
          <Loader title="Loading ManifestWork…" />
        )}
      </SectionBox>
    );
  }

  const applied = getConditionStatus(work.jsonData.status?.conditions, 'Applied');
  const available = getConditionStatus(work.jsonData.status?.conditions, 'Available');

  const resourceStatuses: Array<{
    kind: string;
    name: string;
    namespace: string;
    applied: string;
    available: string;
  }> = (work.jsonData.status?.resourceStatus?.manifests ?? []).map((m: any) => {
    const appliedCond = m.conditions?.find((c: any) => c.type === 'Applied');
    const availableCond = m.conditions?.find((c: any) => c.type === 'Available');
    return {
      kind: m.resourceMeta?.kind ?? '-',
      name: m.resourceMeta?.name ?? '-',
      namespace: m.resourceMeta?.namespace ?? '-',
      applied: appliedCond?.status ?? 'Unknown',
      available: availableCond?.status ?? 'Unknown',
    };
  });

  return (
    <>
      {error && <ResourceErrorNotice error={error} resource="ManifestWork" hasData />}
      <MainInfoSection
        noDefaultActions
        resource={work}
        title="ManifestWork"
        extraInfo={[
          {
            name: 'Source',
            value: (() => {
              const replicaSet =
                work.jsonData.metadata?.labels?.[
                  'work.open-cluster-management.io/manifestworkreplicaset'
                ];
              return replicaSet ? (
                <StatusLabel status="success">ReplicaSet ({replicaSet})</StatusLabel>
              ) : (
                <StatusLabel status="unknown">Manual</StatusLabel>
              );
            })(),
          },
          {
            name: 'Target Cluster',
            value: (
              <Link
                routeName="ocm-cluster-detail"
                params={{ name: work.metadata.namespace, cluster: work.cluster }}
              >
                {work.metadata.namespace}
              </Link>
            ),
          },
          {
            name: 'Manifests',
            value: work.manifestCount.toString(),
          },
          {
            name: 'Applied',
            value: (
              <StatusLabel status={conditionToStatus(applied?.status)}>
                {applied?.status === 'True'
                  ? 'Applied'
                  : applied?.status === 'False'
                  ? 'Not Applied'
                  : 'Unknown'}
              </StatusLabel>
            ),
          },
          {
            name: 'Available',
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
      />

      <SectionBox title="Manifests">
        <SimpleTable
          data={work.manifests}
          columns={[
            {
              label: 'Kind',
              getter: (m: { kind: string }) => m.kind,
            },
            {
              label: 'Name',
              getter: (m: { metadata: { name: string } }) => m.metadata.name,
            },
            {
              label: 'Namespace',
              getter: (m: { metadata: { namespace?: string } }) => m.metadata.namespace || '-',
            },
            {
              label: 'API Version',
              getter: (m: { apiVersion: string }) => m.apiVersion,
            },
          ]}
        />
      </SectionBox>

      {resourceStatuses.length > 0 && (
        <SectionBox title="Resource Status">
          <SimpleTable
            data={resourceStatuses}
            columns={[
              { label: 'Kind', getter: (r: { kind: string }) => r.kind },
              { label: 'Name', getter: (r: { name: string }) => r.name },
              { label: 'Namespace', getter: (r: { namespace: string }) => r.namespace },
              {
                label: 'Applied',
                getter: (r: { applied: string }) => (
                  <StatusLabel status={conditionToStatus(r.applied)}>
                    {r.applied === 'True' ? 'Yes' : r.applied === 'False' ? 'No' : 'Unknown'}
                  </StatusLabel>
                ),
              },
              {
                label: 'Available',
                getter: (r: { available: string }) => (
                  <StatusLabel status={conditionToStatus(r.available)}>
                    {r.available === 'True' ? 'Yes' : r.available === 'False' ? 'No' : 'Unknown'}
                  </StatusLabel>
                ),
              },
            ]}
          />
        </SectionBox>
      )}

      <SectionBox title="Conditions">
        <ConditionsTable resource={work} />
      </SectionBox>
    </>
  );
}
