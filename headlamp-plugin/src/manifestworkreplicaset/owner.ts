/**
 * The label OCM puts on each ManifestWork that a ManifestWorkReplicaSet created, with the value
 * `<namespace>.<name>`. OCM 1.4 deprecated it but still sets it when the value fits in a label.
 */
export const replicaSetLabel = 'work.open-cluster-management.io/manifestworkreplicaset';

/** The ManifestWorkReplicaSet that created a ManifestWork, if any. */
export function replicaSetOf(work: {
  metadata: { labels?: Record<string, string> };
}): { namespace: string; name: string } | undefined {
  const value = work.metadata.labels?.[replicaSetLabel];
  // A namespace cannot contain a dot, so the first one ends it.
  const dot = value?.indexOf('.') ?? -1;
  if (!value || dot <= 0) return undefined;
  return { namespace: value.slice(0, dot), name: value.slice(dot + 1) };
}
