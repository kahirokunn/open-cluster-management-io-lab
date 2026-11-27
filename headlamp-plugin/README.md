# Open Cluster Management

The Open Cluster Management (OCM) plugin helps fleet operators see how managed clusters join the
hub, which clusters a Placement selects, and whether work and add-ons are running.

## Views

Headlamp includes the selected cluster in each URL. These examples use a hub connection named
`fleet-hub`, a managed cluster named `edge-west`, and a placement namespace named `fleet`.

| View | Example URL | What it shows |
| --- | --- | --- |
| Overview | `/c/fleet-hub/ocm/overview` | Fleet availability, joined clusters, Placements, work, and add-ons |
| Clusters | `/c/fleet-hub/ocm/clusters` | ManagedCluster availability, Kubernetes version, and capacity |
| ManagedCluster | `/c/fleet-hub/ocm/clusters/edge-west` | Cluster conditions, capacity, claims, and taints |
| Placements | `/c/fleet-hub/ocm/placements/fleet/observability` | Placement conditions and selected clusters from PlacementDecision |
| ManifestWork | `/c/fleet-hub/ocm/manifestwork/edge-west/observability` | Target cluster, manifests, and their applied and available conditions |
| Add-ons | `/c/fleet-hub/ocm/addons/cluster-proxy` | Add-on install strategy and each ManagedClusterAddOn's status |
| This Cluster | `/c/edge-west/ocm/managed` | Klusterlet, ClusterClaims, applied work, and agent Pods on the selected managed cluster |

The views are read-only and use Headlamp's Kubernetes resource watches. The **Status** column reports
ManagedCluster availability as seen by OCM.

## API access

| Reader | API and required access |
| --- | --- |
| Hub user | `get`, `list`, and `watch` on the OCM resources used by each view. ManagedCluster and ManifestWork use `v1`. Placement, PlacementDecision, and the add-on APIs use `v1beta1`. |

## License

Apache 2.0
