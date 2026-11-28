import { K8s } from '@kinvolk/headlamp-plugin/lib';
import { Loader, SimpleTable } from '@kinvolk/headlamp-plugin/lib/components/common';
import { useMemo } from 'react';
import {
  isResourceListLoading,
  ResourceErrorNotice,
  ResourceListState,
} from '../common/ResourceState';
import { Klusterlet } from '../resources';

export default function AgentPods({ cluster }: { cluster: string }) {
  const klusterlets = Klusterlet.useList({ cluster });
  const { items, error } = klusterlets;
  const namespaces = useMemo(
    () =>
      items?.length
        ? [...new Set(items.map(klusterlet => klusterlet.agentNamespace))]
        : [Klusterlet.defaultAgentNamespace],
    [items]
  );
  if (error && (!items?.length || error.status === 401)) {
    return <ResourceErrorNotice error={error} resource="the klusterlet" />;
  }
  if (isResourceListLoading(klusterlets)) {
    return <Loader title="Finding the agent namespace…" />;
  }

  return (
    <>
      {error && (
        <ResourceErrorNotice error={error} resource="agent namespace information" hasData />
      )}
      <AgentPodList cluster={cluster} namespaces={namespaces} />
    </>
  );
}

function AgentPodList({ cluster, namespaces }: { cluster: string; namespaces: string[] }) {
  const pods = K8s.ResourceClasses.Pod.useList({ cluster, namespace: namespaces });

  return (
    <ResourceListState result={pods} resource="agent pods" empty="No agent pods found.">
      {items => (
        <SimpleTable
          data={items}
          columns={[
            { label: 'Name', getter: pod => pod.metadata.name },
            { label: 'Namespace', getter: pod => pod.metadata.namespace },
            { label: 'Status', getter: pod => pod.getDetailedStatus().reason },
            { label: 'Restarts', getter: pod => pod.getDetailedStatus().restarts },
            { label: 'Age', getter: pod => pod.metadata.creationTimestamp ?? '-' },
          ]}
        />
      )}
    </ResourceListState>
  );
}
