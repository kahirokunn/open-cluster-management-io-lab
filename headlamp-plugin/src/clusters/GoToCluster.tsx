import { Icon } from '@iconify/react';
import { Router } from '@kinvolk/headlamp-plugin/lib';
import { Button, ListItemText, ListSubheader, Menu, MenuItem } from '@mui/material';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
  type ManagedClusterConnection,
  useManagedClusterConnections,
} from './managedClusterConnections';

/**
 * Opens the managed cluster in Headlamp when Headlamp discovered it from an OCM
 * ClusterProfile. When Headlamp discovered several connections, such as one for each
 * ClusterProfile namespace, the button opens a menu of them. Shows nothing otherwise.
 */
export default function GoToCluster({ hub, clusterName }: { hub: string; clusterName: string }) {
  const connections = useManagedClusterConnections(hub, clusterName);
  const history = useHistory();
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  if (connections.length === 0) return null;

  const several = connections.length > 1;
  const open = (connection: ManagedClusterConnection) =>
    history.push(Router.createRouteURL('cluster', { cluster: connection.id }));

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        startIcon={<Icon icon="mdi:open-in-app" />}
        endIcon={several ? <Icon icon="mdi:menu-down" /> : undefined}
        aria-haspopup={several ? 'menu' : undefined}
        aria-expanded={several ? !!menuAnchor : undefined}
        onClick={event => (several ? setMenuAnchor(event.currentTarget) : open(connections[0]))}
      >
        Go to cluster
      </Button>
      {several && (
        <Menu
          anchorEl={menuAnchor}
          open={!!menuAnchor}
          onClose={() => setMenuAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <ListSubheader>ClusterProfiles for {clusterName}</ListSubheader>
          {connections.map(connection => (
            <MenuItem key={connection.id} onClick={() => open(connection)}>
              <ListItemText
                primary={connection.namespace}
                secondary={`Access provider: ${connection.provider}`}
              />
            </MenuItem>
          ))}
        </Menu>
      )}
    </>
  );
}
