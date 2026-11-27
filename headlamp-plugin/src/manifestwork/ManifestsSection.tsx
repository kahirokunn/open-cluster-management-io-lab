import { Activity } from '@kinvolk/headlamp-plugin/lib';
import {
  EditorDialog,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import type { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { Link as TextButton } from '@mui/material';
import type { Manifest } from '../resources';

/** Shows a manifest's YAML in the same read-only panel as Headlamp's View YAML. */
function viewManifest(owner: KubeObject, index: number, manifest: Manifest) {
  const id = `ocm-manifest-${owner.metadata.uid}-${index}`;
  Activity.close(id);
  Activity.launch({
    id,
    title: `${manifest.kind} ${manifest.metadata.name}`,
    cluster: owner.cluster,
    location: window.innerWidth >= 1280 ? 'split-right' : 'window',
    content: (
      <EditorDialog
        noDialog
        open
        item={manifest}
        allowToHideManagedFields
        onClose={() => Activity.close(id)}
        onSave={null}
      />
    ),
  });
}

/** The manifests of a ManifestWork or its template, each of which opens its YAML. */
export default function ManifestsSection({
  owner,
  manifests,
}: {
  owner: KubeObject;
  manifests: Manifest[];
}) {
  return (
    <SectionBox title="Manifests">
      <SimpleTable
        data={manifests}
        columns={[
          {
            label: 'Kind',
            getter: (m: Manifest) => m.kind,
          },
          {
            label: 'Name',
            getter: (m: Manifest) => (
              <TextButton
                component="button"
                onClick={() => viewManifest(owner, manifests.indexOf(m), m)}
              >
                {m.metadata.name}
              </TextButton>
            ),
          },
          {
            label: 'Namespace',
            getter: (m: Manifest) => m.metadata.namespace || '-',
          },
          {
            label: 'API Version',
            getter: (m: Manifest) => m.apiVersion,
          },
        ]}
      />
    </SectionBox>
  );
}
