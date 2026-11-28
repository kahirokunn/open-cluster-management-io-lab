import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import type { ResourceError } from '../common/ResourceState';

type OCMContext =
  | { type: 'loading' }
  | { type: 'hub' }
  | { type: 'managed' }
  | { type: 'none' }
  | { type: 'error'; error: ResourceError };

async function hasResource(cluster: string, apiVersion: string, resource: string) {
  try {
    const discovery: { resources: { name: string }[] } = await ApiProxy.clusterRequest(
      `/apis/${apiVersion}`,
      { cluster, autoLogoutOnAuthError: false }
    );
    return discovery.resources.some(item => item.name === resource);
  } catch (error) {
    if ((error as ResourceError).status === 404) return false;
    throw error;
  }
}

async function discoverOCM(clusters: string[]): Promise<OCMContext> {
  const hubs = await Promise.allSettled(
    clusters.map(cluster =>
      hasResource(cluster, 'cluster.open-cluster-management.io/v1', 'managedclusters')
    )
  );
  if (hubs.some(result => result.status === 'fulfilled' && result.value)) return { type: 'hub' };
  const managed = await Promise.allSettled(
    clusters.map(cluster =>
      hasResource(cluster, 'operator.open-cluster-management.io/v1', 'klusterlets')
    )
  );
  if (managed.some(result => result.status === 'fulfilled' && result.value))
    return { type: 'managed' };
  const failure = [...hubs, ...managed].find(result => result.status === 'rejected');
  if (failure) return { type: 'error', error: failure.reason };
  return { type: 'none' };
}

/** Detects the OCM role of the selected clusters and retries on navigation if no role was found. */
export function useOCMContext(clusters: string[]): OCMContext {
  const { pathname } = useLocation();
  const clusterKey = JSON.stringify(clusters);
  const [retryPath, setRetryPath] = useState(pathname);
  const [result, setResult] = useState<{ clusterKey: string; context: OCMContext }>();
  const context: OCMContext =
    result?.clusterKey === clusterKey ? result.context : { type: 'loading' };

  useEffect(() => {
    if (context.type === 'error' || context.type === 'none') setRetryPath(pathname);
  }, [context.type, pathname]);

  useEffect(() => {
    let current = true;
    void discoverOCM(JSON.parse(clusterKey)).then(context => {
      if (current) setResult({ clusterKey, context });
    });
    return () => {
      current = false;
    };
  }, [clusterKey, retryPath]);

  return context;
}

export function getConditionStatus(
  conditions:
    | Array<{ type: string; status: string; message?: string; reason?: string }>
    | undefined,
  conditionType: string
): { status: string; message: string; reason: string } | null {
  if (!conditions) return null;
  const condition = conditions.find(c => c.type === conditionType);
  if (!condition) return null;
  return {
    status: condition.status,
    message: condition.message ?? '',
    reason: condition.reason ?? '',
  };
}
