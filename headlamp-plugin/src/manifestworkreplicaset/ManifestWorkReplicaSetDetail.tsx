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
import ManifestsSection from '../manifestwork/ManifestsSection';
import ManifestWorkList from '../manifestwork/ManifestWorkList';
import { ManifestWorkReplicaSet } from '../resources';
import { AppliedLabel, ConditionLabel, PlacementLinks } from './ReplicaSetStatus';

type PlacementRef = ManifestWorkReplicaSet['placementRefs'][number];

export default function ManifestWorkReplicaSetDetail() {
  const { namespace, name } = useParams<{ namespace: string; name: string }>();
  const [replicaSet, error] = ManifestWorkReplicaSet.useGet(name!, namespace!);

  if (!replicaSet || error?.status === 401 || error?.status === 403 || error?.status === 404) {
    return (
      <SectionBox title="ManifestWorkReplicaSet">
        {error ? (
          <ResourceErrorNotice error={error} resource="ManifestWorkReplicaSet" />
        ) : (
          <Loader title="Loading ManifestWorkReplicaSet…" />
        )}
      </SectionBox>
    );
  }

  const summaries = new Map(replicaSet.placementSummaries.map(summary => [summary.name, summary]));
  const summaryOf = (ref: PlacementRef) => summaries.get(ref.name)?.summary ?? {};

  return (
    <>
      {error && <ResourceErrorNotice error={error} resource="ManifestWorkReplicaSet" hasData />}
      <MainInfoSection
        noDefaultActions
        resource={replicaSet}
        title="ManifestWorkReplicaSet"
        extraInfo={[
          {
            name: 'Placements',
            value: <PlacementLinks replicaSet={replicaSet} />,
          },
          {
            name: 'Cascade Deletion',
            value: replicaSet.jsonData.spec?.cascadeDeletionPolicy ?? 'Background',
          },
          {
            name: 'Manifests',
            value: replicaSet.manifests.length.toString(),
          },
          {
            name: 'Placement Status',
            value: (
              <ConditionLabel replicaSet={replicaSet} type="PlacementVerified" ok="Verified" />
            ),
          },
          {
            name: 'Rollout',
            value: (
              <ConditionLabel
                replicaSet={replicaSet}
                type="PlacementRolledOut"
                ok="Complete"
                inProgress="Progressing"
              />
            ),
          },
          {
            name: 'Applied',
            value: <AppliedLabel replicaSet={replicaSet} />,
          },
          {
            name: 'Available',
            value: `${replicaSet.summary.available ?? 0}/${replicaSet.summary.total ?? 0}`,
          },
        ]}
      />

      <SectionBox title="Placements">
        <SimpleTable
          data={replicaSet.placementRefs}
          columns={[
            {
              label: 'Placement',
              getter: (ref: PlacementRef) => (
                <Link
                  routeName="ocm-placement-detail"
                  params={{
                    namespace: replicaSet.metadata.namespace,
                    name: ref.name,
                    cluster: replicaSet.cluster,
                  }}
                >
                  {ref.name}
                </Link>
              ),
            },
            {
              label: 'Rollout Strategy',
              getter: (ref: PlacementRef) => ref.rolloutStrategy?.type ?? 'All',
            },
            {
              label: 'Available Decision Groups',
              getter: (ref: PlacementRef) =>
                summaries.get(ref.name)?.availableDecisionGroups || '-',
            },
            {
              label: 'ManifestWorks',
              getter: (ref: PlacementRef) => (summaryOf(ref).total ?? 0).toString(),
            },
            {
              label: 'Applied',
              getter: (ref: PlacementRef) => (summaryOf(ref).applied ?? 0).toString(),
            },
            {
              label: 'Available',
              getter: (ref: PlacementRef) => (summaryOf(ref).available ?? 0).toString(),
            },
          ]}
        />
      </SectionBox>

      <ManifestsSection owner={replicaSet} manifests={replicaSet.manifests} />

      <ManifestWorkList replicaSet={replicaSet} />

      <SectionBox title="Conditions">
        <ConditionsTable resource={replicaSet.jsonData} />
      </SectionBox>
    </>
  );
}
