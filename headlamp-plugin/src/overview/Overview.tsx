import { SectionBox, SimpleTable, TileChart } from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box, useTheme } from '@mui/material';
import AddOnList from '../addons/AddOnList';
import { ClusterTable } from '../clusters/ClusterTable';
import { isResourceListLoading, ResourceErrorNotice } from '../common/ResourceState';
import StatusLabel from '../common/StatusLabel';
import { getConditionStatus } from '../helpers';
import ManifestWorkList from '../manifestwork/ManifestWorkList';
import PlacementList from '../placements/PlacementList';
import { ClusterManager, ManagedCluster } from '../resources';

/** A Headlamp overview tile with a count of clusters in one state out of all clusters. */
function ClusterStateTile({
  title,
  total,
  good,
  bad,
  goodLabel,
  badLabel,
}: {
  title: string;
  total: number;
  good: number;
  bad: number;
  goodLabel: string;
  badLabel: string;
}) {
  const theme = useTheme();
  return (
    <TileChart
      title={title}
      total={total}
      label={`${good} / ${total}`}
      legend={`${good} ${goodLabel}${bad ? `, ${bad} ${badLabel}` : ''}`}
      data={[
        { name: goodLabel, value: good, fill: theme.palette.success.main },
        { name: badLabel, value: bad, fill: theme.palette.error.main },
        { name: 'unknown', value: total - good - bad, fill: theme.palette.grey[500] },
      ]}
    />
  );
}

export default function Overview() {
  const clusterResult = ManagedCluster.useList();
  const { items: clusters } = clusterResult;
  const clusterManagers = ClusterManager.useList();
  const featureGates = clusterManagers.items?.[0]?.featureGates ?? [];

  const total = clusters?.length ?? 0;
  const showFleetTiles =
    clusterResult.error?.status !== 401 &&
    (total > 0 || (!clusterResult.error && !isResourceListLoading(clusterResult)));

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
      {showFleetTiles && (
        <SectionBox title="Fleet Overview">
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            <Box sx={{ width: 300 }}>
              <ClusterStateTile
                title="Availability"
                total={total}
                good={availableCount}
                bad={unavailableCount}
                goodLabel="available"
                badLabel="unavailable"
              />
            </Box>
            <Box sx={{ width: 300 }}>
              <ClusterStateTile
                title="Join Status"
                total={total}
                good={joinedCount}
                bad={notJoinedCount}
                goodLabel="joined"
                badLabel="not joined"
              />
            </Box>
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
