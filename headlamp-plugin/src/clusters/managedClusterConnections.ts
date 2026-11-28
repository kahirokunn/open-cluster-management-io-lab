import * as Headlamp from '@kinvolk/headlamp-plugin/lib';
import { useMemo } from 'react';

interface RegisteredClusterProfile {
  id: string;
  displayName: string;
  origin: { resource: { namespace: string; name: string } };
  owner: { metadata: { labels?: Record<string, string> } } | null;
}

// The plugin requires a Headlamp with ClusterProfile.useRegisteredClusters. The published
// @kinvolk/headlamp-plugin package does not declare it yet.
const { ClusterProfile } = Headlamp.K8s as typeof Headlamp.K8s & {
  ClusterProfile: {
    useRegisteredClusters: (options: { originCluster?: string; labelSelector?: string }) => {
      clusters: readonly RegisteredClusterProfile[];
    };
  };
};

const ocmProfiles = 'x-k8s.io/cluster-manager=open-cluster-management';
const clusterNameLabel = 'open-cluster-management.io/cluster-name';

export interface ManagedClusterConnection {
  /** The Headlamp cluster to open. A ClusterProfile created again gets a new one. */
  id: string;
  /** The namespace of the ClusterProfile. OCM creates one for each bound ManagedClusterSet. */
  namespace: string;
  /** The ClusterProfile access provider that the connection uses. */
  provider: string;
}

type ConnectionMetadata = {
  presentation?: { fields?: { provider?: string } };
};

/**
 * Gets the clusters Headlamp discovered for a managed cluster from its OCM ClusterProfiles.
 * @param hub - The connection name of the hub that manages the cluster.
 * @param clusterName - The name of the ManagedCluster.
 */
export function useManagedClusterConnections(hub: string, clusterName: string) {
  const configurations = Headlamp.K8s.useClustersConf();
  const { clusters } = ClusterProfile.useRegisteredClusters({
    originCluster: hub,
    labelSelector: ocmProfiles,
  });

  return useMemo<ManagedClusterConnection[]>(
    () =>
      clusters
        .filter(cluster => cluster.owner?.metadata.labels?.[clusterNameLabel] === clusterName)
        .map(cluster => ({
          id: cluster.id,
          namespace: cluster.origin.resource.namespace,
          provider:
            (configurations?.[cluster.id]?.meta_data as ConnectionMetadata | undefined)
              ?.presentation?.fields?.provider || cluster.displayName,
        }))
        .sort(
          (a, b) =>
            a.namespace.localeCompare(b.namespace) ||
            a.provider.localeCompare(b.provider) ||
            a.id.localeCompare(b.id)
        ),
    [clusters, configurations, clusterName]
  );
}
