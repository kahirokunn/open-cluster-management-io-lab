import { Link } from '@kinvolk/headlamp-plugin/lib/components/common';
import { Fragment } from 'react';
import StatusLabel from '../common/StatusLabel';
import { getConditionStatus } from '../helpers';
import { ManifestWorkReplicaSet } from '../resources';

/**
 * Shows `ok` when the condition is true. A false condition shows its reason,
 * or `Not {ok}` if the reason is empty. A reason matching `inProgress` is a warning,
 * and any other false condition is an error. Missing or unknown conditions show `Unknown`.
 */
export function ConditionLabel({
  replicaSet,
  type,
  ok,
  inProgress,
}: {
  replicaSet: ManifestWorkReplicaSet;
  type: string;
  ok: string;
  inProgress?: string;
}) {
  const condition = getConditionStatus(replicaSet.jsonData.status?.conditions, type);
  if (condition?.status === 'True') return <StatusLabel status="success">{ok}</StatusLabel>;
  if (condition?.status === 'False') {
    return (
      <StatusLabel status={condition.reason === inProgress ? 'warning' : 'error'}>
        {condition.reason || `Not ${ok}`}
      </StatusLabel>
    );
  }
  return <StatusLabel status="unknown">Unknown</StatusLabel>;
}

/** Renders the ManifestWorkReplicaSet's ManifestworkApplied condition as a status badge. */
export function AppliedLabel({ replicaSet }: { replicaSet: ManifestWorkReplicaSet }) {
  return (
    <ConditionLabel
      replicaSet={replicaSet}
      type="ManifestworkApplied"
      ok="Applied"
      inProgress="Processing"
    />
  );
}

/** Links to the Placements that select the clusters a ManifestWorkReplicaSet deploys to. */
export function PlacementLinks({ replicaSet }: { replicaSet: ManifestWorkReplicaSet }) {
  const refs = replicaSet.placementRefs;
  if (refs.length === 0) return <>-</>;

  return (
    <>
      {refs.map((ref, index) => (
        <Fragment key={ref.name}>
          {index > 0 && ', '}
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
        </Fragment>
      ))}
    </>
  );
}
