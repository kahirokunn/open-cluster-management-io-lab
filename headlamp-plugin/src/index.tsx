import { registerRoute, registerSidebarEntry } from '@kinvolk/headlamp-plugin/lib';
import AddOnDetail from './addons/AddOnDetail';
import AddOnList from './addons/AddOnList';
import ClusterDetail from './clusters/ClusterDetail';
import ClusterList from './clusters/ClusterList';
import OCMPage from './common/OCMPage';
import ManagedOverview from './managed/ManagedOverview';
import ManifestWorkDetail from './manifestwork/ManifestWorkDetail';
import ManifestWorkList from './manifestwork/ManifestWorkList';
import ManifestWorkReplicaSetDetail from './manifestworkreplicaset/ManifestWorkReplicaSetDetail';
import ManifestWorkReplicaSetList from './manifestworkreplicaset/ManifestWorkReplicaSetList';
import Overview from './overview/Overview';
import PlacementDetail from './placements/PlacementDetail';
import PlacementList from './placements/PlacementList';
import { registerOCMSidebar } from './sidebar';

// Top-level OCM sidebar group, which shows the pages for the selected cluster's role
registerOCMSidebar();

// Overview
registerSidebarEntry({
  parent: 'ocm',
  name: 'ocm-overview',
  label: 'Overview',
  url: '/ocm/overview',
});

registerRoute({
  path: '/ocm/overview',
  sidebar: 'ocm-overview',
  name: 'ocm-overview',
  exact: true,
  component: () => (
    <OCMPage clusterRole="hub" title="Fleet Overview">
      <Overview />
    </OCMPage>
  ),
});

// Clusters
registerSidebarEntry({
  parent: 'ocm',
  name: 'ocm-clusters',
  label: 'Clusters',
  url: '/ocm/clusters',
});

registerRoute({
  path: '/ocm/clusters',
  sidebar: 'ocm-clusters',
  name: 'ocm-clusters',
  exact: true,
  component: () => (
    <OCMPage clusterRole="hub" title="Managed Clusters">
      <ClusterList />
    </OCMPage>
  ),
});

registerRoute({
  path: '/ocm/clusters/:name',
  sidebar: 'ocm-clusters',
  name: 'ocm-cluster-detail',
  exact: true,
  component: () => (
    <OCMPage clusterRole="hub" title="Managed Cluster">
      <ClusterDetail />
    </OCMPage>
  ),
});

// Placements
registerSidebarEntry({
  parent: 'ocm',
  name: 'ocm-placements',
  label: 'Placements',
  url: '/ocm/placements',
});

registerRoute({
  path: '/ocm/placements',
  sidebar: 'ocm-placements',
  name: 'ocm-placements',
  exact: true,
  component: () => (
    <OCMPage clusterRole="hub" title="Placements">
      <PlacementList />
    </OCMPage>
  ),
});

registerRoute({
  path: '/ocm/placements/:namespace/:name',
  sidebar: 'ocm-placements',
  name: 'ocm-placement-detail',
  exact: true,
  component: () => (
    <OCMPage clusterRole="hub" title="Placement">
      <PlacementDetail />
    </OCMPage>
  ),
});

// ManifestWork
registerSidebarEntry({
  parent: 'ocm',
  name: 'ocm-manifestwork',
  label: 'ManifestWork',
  url: '/ocm/manifestwork',
});

registerRoute({
  path: '/ocm/manifestwork',
  sidebar: 'ocm-manifestwork',
  name: 'ocm-manifestwork',
  exact: true,
  component: () => (
    <OCMPage clusterRole="hub" title="ManifestWorks">
      <ManifestWorkList />
    </OCMPage>
  ),
});

registerRoute({
  path: '/ocm/manifestwork/:namespace/:name',
  sidebar: 'ocm-manifestwork',
  name: 'ocm-manifestwork-detail',
  exact: true,
  component: () => (
    <OCMPage clusterRole="hub" title="ManifestWork">
      <ManifestWorkDetail />
    </OCMPage>
  ),
});

// ManifestWorkReplicaSets
registerSidebarEntry({
  parent: 'ocm',
  name: 'ocm-manifestworkreplicasets',
  label: 'ManifestWorkReplicaSets',
  url: '/ocm/manifestworkreplicasets',
});

registerRoute({
  path: '/ocm/manifestworkreplicasets',
  sidebar: 'ocm-manifestworkreplicasets',
  name: 'ocm-manifestworkreplicasets',
  exact: true,
  component: () => (
    <OCMPage clusterRole="hub" title="ManifestWorkReplicaSets">
      <ManifestWorkReplicaSetList />
    </OCMPage>
  ),
});

registerRoute({
  path: '/ocm/manifestworkreplicasets/:namespace/:name',
  sidebar: 'ocm-manifestworkreplicasets',
  name: 'ocm-manifestworkreplicaset-detail',
  exact: true,
  component: () => (
    <OCMPage clusterRole="hub" title="ManifestWorkReplicaSet">
      <ManifestWorkReplicaSetDetail />
    </OCMPage>
  ),
});

// Add-ons
registerSidebarEntry({
  parent: 'ocm',
  name: 'ocm-addons',
  label: 'Add-ons',
  url: '/ocm/addons',
});

registerRoute({
  path: '/ocm/addons',
  sidebar: 'ocm-addons',
  name: 'ocm-addons',
  exact: true,
  component: () => (
    <OCMPage clusterRole="hub" title="Add-ons">
      <AddOnList />
    </OCMPage>
  ),
});

registerRoute({
  path: '/ocm/addons/:name',
  sidebar: 'ocm-addons',
  name: 'ocm-addon-detail',
  exact: true,
  component: () => (
    <OCMPage clusterRole="hub" title="Add-on">
      <AddOnDetail />
    </OCMPage>
  ),
});

// The OCM agent on a managed cluster
registerSidebarEntry({
  parent: 'ocm',
  name: 'ocm-managed',
  label: 'Agent',
  url: '/ocm/managed',
});

registerRoute({
  path: '/ocm/managed',
  sidebar: 'ocm-managed',
  name: 'ocm-managed',
  exact: true,
  component: () => (
    <OCMPage clusterRole="managed" title="Agent">
      <ManagedOverview />
    </OCMPage>
  ),
});
