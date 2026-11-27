import { describe, expect, it } from 'vitest';
import { replicaSetLabel, replicaSetOf } from './owner';

const work = (labels?: Record<string, string>) => ({ metadata: { labels } });

describe('replicaSetOf', () => {
  it('reads the ManifestWorkReplicaSet that created a ManifestWork from its label', () => {
    expect(replicaSetOf(work({ [replicaSetLabel]: 'fleet.observability' }))).toEqual({
      namespace: 'fleet',
      name: 'observability',
    });
  });

  it('keeps the dots in the name, because a namespace cannot contain one', () => {
    expect(replicaSetOf(work({ [replicaSetLabel]: 'fleet.app.v1' }))).toEqual({
      namespace: 'fleet',
      name: 'app.v1',
    });
  });

  it('returns nothing for a ManifestWork created by hand', () => {
    expect(replicaSetOf(work())).toBeUndefined();
    expect(replicaSetOf(work({ app: 'web' }))).toBeUndefined();
  });
});
