import { Loader } from '@kinvolk/headlamp-plugin/lib/components/common';
import { Alert } from '@mui/material';
import type { ReactNode } from 'react';

export interface ResourceError {
  status?: number;
  message: string;
}

export interface ResourceListResult<T> {
  items: T[] | null;
  error: ResourceError | null;
  isFetching?: boolean;
}

/** Headlamp can return an empty array before every request finishes. */
export function isResourceListLoading({
  items,
  isFetching = false,
}: ResourceListResult<unknown>): boolean {
  return items === null || (items.length === 0 && isFetching);
}

export function ResourceErrorNotice({
  error,
  resource,
  hasData = false,
}: {
  error: ResourceError;
  resource: string;
  hasData?: boolean;
}) {
  const status = error.status;
  if (status === 401) {
    return <Alert severity="warning">Sign in to read {resource}.</Alert>;
  }
  if (status === 403) {
    return (
      <Alert severity="warning">
        {hasData
          ? `Access to some ${resource} was denied. Results may be incomplete.`
          : `You do not have permission to read ${resource}.`}
      </Alert>
    );
  }
  if (status === 404 && !hasData) {
    return <Alert severity="info">{resource} could not be found.</Alert>;
  }
  return (
    <Alert severity={hasData ? 'warning' : 'error'}>
      {hasData ? `Updates for ${resource} were interrupted.` : `Could not load ${resource}.`}{' '}
      {error.message}
    </Alert>
  );
}

export function ResourceListState<T>({
  result,
  resource,
  empty,
  children,
}: {
  result: ResourceListResult<T>;
  resource: string;
  empty: string;
  children: (items: T[]) => ReactNode;
}) {
  const { items, error } = result;
  const hasData = !!items?.length;
  const showData = hasData && error?.status !== 401;

  return (
    <>
      {error && <ResourceErrorNotice error={error} resource={resource} hasData={showData} />}
      {showData
        ? children(items)
        : !error &&
          (isResourceListLoading(result) ? (
            <Loader title={`Loading ${resource}…`} />
          ) : (
            <p>{empty}</p>
          ))}
    </>
  );
}
