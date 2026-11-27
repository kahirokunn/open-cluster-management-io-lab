import { SectionBox } from '@kinvolk/headlamp-plugin/lib/components/common';
import { ManagedCluster } from '../resources';
import { ClusterTable } from './ClusterTable';

export default function ClusterList() {
  const clusters = ManagedCluster.useList();
  return (
    <SectionBox title="Managed Clusters">
      <ClusterTable clusters={clusters} />
    </SectionBox>
  );
}
