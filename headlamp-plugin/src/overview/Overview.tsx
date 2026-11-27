import {
  PercentageCircle,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box, Typography } from '@mui/material';
import AddOnList from '../addons/AddOnList';
import { ClusterTable } from '../clusters/ClusterTable';
import { ResourceErrorNotice } from '../common/ResourceState';
import StatusLabel from '../common/StatusLabel';
import { getConditionStatus } from '../helpers';
import ManifestWorkList from '../manifestwork/ManifestWorkList';
import PlacementList from '../placements/PlacementList';
import { ClusterManager, ManagedCluster } from '../resources';

export default function Overview() {
  const clusterResult = ManagedCluster.useList();
  const { items: clusters } = clusterResult;
  const clusterManagers = ClusterManager.useList();
  const featureGates = clusterManagers.items?.[0]?.featureGates ?? [];

  const total = clusters?.length ?? 0;

  let availableCount = 0;
  let unavailableCount = 0;
  let joinedCount = 0;
  let notJoinedCount = 0;

  clusters?.forEach((cluster: InstanceType<typeof ManagedCluster>) => {
    const available = getConditionStatus(
      cluster.jsonData.status?.conditions,
      'ManagedClusterConditionAvailable'
    );
    const joined = getConditionStatus(cluster.jsonData.status?.conditions, 'ManagedClusterJoined');

    if (available?.status === 'True') availableCount++;
    else if (available?.status === 'False') unavailableCount++;

    if (joined?.status === 'True') joinedCount++;
    else if (joined?.status === 'False') notJoinedCount++;
  });

  return (
    <>
      {clusters && clusterResult.error?.status !== 401 && clusterResult.error?.status !== 404 && (
        <SectionBox title="Fleet Overview">
          <Box sx={{ display: 'flex', gap: 4, justifyContent: 'space-around', py: 2 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3">{total}</Typography>
              <Typography variant="body2" color="text.secondary">
                Total Clusters
              </Typography>
            </Box>
            <PercentageCircle
              title="Availability"
              size={140}
              total={total}
              data={[
                { name: 'Available', value: availableCount, fill: '#1b7a3d' },
                { name: 'Unavailable', value: unavailableCount, fill: '#c5221f' },
                {
                  name: 'Unknown',
                  value: total - availableCount - unavailableCount,
                  fill: '#5f6368',
                },
              ]}
            />
            <PercentageCircle
              title="Join Status"
              size={140}
              total={total}
              data={[
                { name: 'Joined', value: joinedCount, fill: '#1b7a3d' },
                { name: 'Not Joined', value: notJoinedCount, fill: '#c5221f' },
                { name: 'Unknown', value: total - joinedCount - notJoinedCount, fill: '#5f6368' },
              ]}
            />
          </Box>
        </SectionBox>
      )}

      <SectionBox title="Managed Clusters">
        <ClusterTable clusters={clusterResult} />
      </SectionBox>

      <PlacementList />
      <ManifestWorkList />
      <AddOnList />

      {(clusterManagers.error || featureGates.length > 0) && (
        <SectionBox title="Feature Gates">
          {clusterManagers.error ? (
            <ResourceErrorNotice error={clusterManagers.error} resource="cluster managers" />
          ) : (
            <SimpleTable
              data={featureGates}
              columns={[
                { label: 'Component', getter: gate => gate.component },
                { label: 'Feature', getter: gate => gate.feature },
                {
                  label: 'Mode',
                  getter: gate => (
                    <StatusLabel status={gate.mode === 'Enable' ? 'success' : 'unknown'}>
                      {gate.mode}
                    </StatusLabel>
                  ),
                },
              ]}
            />
          )}
        </SectionBox>
      )}
    </>
  );
}
