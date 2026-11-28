import { K8s } from '@kinvolk/headlamp-plugin/lib';
import { Loader, SectionBox } from '@kinvolk/headlamp-plugin/lib/components/common';
import type { ReactNode } from 'react';
import { useOCMContext } from '../helpers';
import { ResourceErrorNotice } from './ResourceState';

export default function OCMPage({
  clusterRole,
  title,
  children,
}: {
  clusterRole: 'hub' | 'managed';
  title: string;
  children: ReactNode;
}) {
  const clusters = K8s.useSelectedClusters();
  const context = useOCMContext(clusters);
  if (context.type === clusterRole) return <>{children}</>;

  return (
    <SectionBox title={title}>
      {context.type === 'loading' && <Loader title="Discovering Open Cluster Management APIs…" />}
      {context.type === 'error' && (
        <ResourceErrorNotice
          error={context.error}
          resource="Open Cluster Management API discovery"
        />
      )}
      {context.type === 'none' && (
        <p>Open Cluster Management APIs are unavailable on the selected clusters.</p>
      )}
      {context.type === 'managed' && <p>Switch to an OCM hub cluster to view its fleet.</p>}
      {context.type === 'hub' && <p>Switch to a managed cluster to view its agents.</p>}
    </SectionBox>
  );
}
