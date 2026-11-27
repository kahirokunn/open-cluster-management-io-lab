import { Link, SectionBox, SimpleTable } from '@kinvolk/headlamp-plugin/lib/components/common';
import { ResourceListState } from '../common/ResourceState';
import { ManifestWorkReplicaSet } from '../resources';
import { AppliedLabel, PlacementLinks } from './ReplicaSetStatus';

export default function ManifestWorkReplicaSetList() {
  const result = ManifestWorkReplicaSet.useList();

  return (
    <SectionBox title="ManifestWorkReplicaSets">
      <ResourceListState
        result={result}
        resource="manifest work replica sets"
        empty="No manifest work replica sets found."
      >
        {items => (
          <SimpleTable
            data={items}
            columns={[
              {
                label: 'Name',
                getter: (r: ManifestWorkReplicaSet) => (
                  <Link
                    routeName="ocm-manifestworkreplicaset-detail"
                    params={{
                      namespace: r.metadata.namespace,
                      name: r.metadata.name,
                      cluster: r.cluster,
                    }}
                  >
                    {r.metadata.name}
                  </Link>
                ),
                sort: true,
              },
              {
                label: 'Namespace',
                getter: (r: ManifestWorkReplicaSet) => r.metadata.namespace,
              },
              {
                label: 'Placements',
                getter: (r: ManifestWorkReplicaSet) => <PlacementLinks replicaSet={r} />,
              },
              {
                label: 'Manifests',
                getter: (r: ManifestWorkReplicaSet) => r.manifests.length.toString(),
              },
              {
                label: 'ManifestWorks',
                getter: (r: ManifestWorkReplicaSet) =>
                  `${r.summary.available ?? 0}/${r.summary.total ?? 0} available`,
              },
              {
                label: 'Status',
                getter: (r: ManifestWorkReplicaSet) => <AppliedLabel replicaSet={r} />,
              },
              {
                label: 'Age',
                getter: (r: ManifestWorkReplicaSet) => r.metadata.creationTimestamp ?? '-',
                sort: true,
              },
            ]}
          />
        )}
      </ResourceListState>
    </SectionBox>
  );
}
