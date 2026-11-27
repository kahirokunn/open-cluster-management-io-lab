import { Link } from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box } from '@mui/material';
import StatusLabel from '../common/StatusLabel';
import { replicaSetOf } from '../manifestworkreplicaset/owner';
import { ManifestWork } from '../resources';

/** Whether a ManifestWork was created by hand or by a ManifestWorkReplicaSet, which it links to. */
export default function WorkSource({ work }: { work: ManifestWork }) {
  const replicaSet = replicaSetOf(work);
  if (!replicaSet) return <StatusLabel status="unknown">Manual</StatusLabel>;

  return (
    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
      <StatusLabel status="success">ReplicaSet</StatusLabel>
      <Link
        routeName="ocm-manifestworkreplicaset-detail"
        params={{ ...replicaSet, cluster: work.cluster }}
      >
        {replicaSet.namespace}/{replicaSet.name}
      </Link>
    </Box>
  );
}
