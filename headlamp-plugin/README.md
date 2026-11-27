# Open Cluster Management

The Open Cluster Management (OCM) plugin helps fleet operators see how managed clusters join the
hub, which clusters a Placement selects, and whether work and add-ons are running. When Headlamp
discovers a managed cluster from its OCM ClusterProfile, operators can go from the cluster's OCM
details page to the cluster itself in Headlamp.

## Views

Headlamp includes the selected cluster in each URL. These examples use a hub connection named
`fleet-hub`, a managed cluster named `edge-west`, and a placement namespace named `fleet`.

| View | Example URL | What it shows |
| --- | --- | --- |
| Overview | `/c/fleet-hub/ocm/overview` | Fleet availability, joined clusters, Placements, work, and add-ons |
| Clusters | `/c/fleet-hub/ocm/clusters` | ManagedCluster availability, Kubernetes version, and capacity |
| ManagedCluster | `/c/fleet-hub/ocm/clusters/edge-west` | Cluster conditions, capacity, claims, and taints, with **Go to cluster** when Headlamp discovered the cluster |
| Placements | `/c/fleet-hub/ocm/placements/fleet/observability` | Placement conditions and selected clusters from PlacementDecision |
| ManifestWork | `/c/fleet-hub/ocm/manifestwork/edge-west/observability` | Target cluster, manifests, and their applied and available conditions |
| Add-ons | `/c/fleet-hub/ocm/addons/cluster-proxy` | Add-on install strategy and each ManagedClusterAddOn's status |
| Agent | `/c/edge-west/ocm/managed` | Klusterlet, ClusterClaims, applied work, and agent Pods on the selected managed cluster |

The OCM menu lists the hub views on a hub and only **Agent** on a managed cluster.

The views are read-only and use Headlamp's Kubernetes resource watches. The **Status** column reports
ManagedCluster availability as seen by OCM. **Go to cluster** opens the managed cluster in Headlamp,
where you sign in to it and use Headlamp's own views. If Headlamp discovered several connections for
the cluster, such as one for each ClusterProfile namespace, the button opens a menu of them by
namespace and access provider.

## API access

| Reader | API and required access |
| --- | --- |
| Hub user | `get`, `list`, and `watch` on the OCM resources used by each view. ManagedCluster and ManifestWork use `v1`. Placement, PlacementDecision, and the add-on APIs use `v1beta1`. |
| Headlamp discovery and Hub user | `list` and `watch` on the Hub's `multicluster.x-k8s.io/v1alpha1` ClusterProfiles in the namespaces used for discovery. |

The plugin requires a Headlamp frontend and backend with the live registration API from
[Headlamp PR #7383](https://github.com/kubernetes-sigs/headlamp/pull/7383). **Go to cluster** also
requires Cluster Inventory discovery, and the managed cluster's API server must accept the user's
OIDC token.

## License

Apache 2.0
