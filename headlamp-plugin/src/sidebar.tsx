import {
  K8s,
  registerAppBarAction,
  registerSidebarEntry,
  registerSidebarEntryFilter,
  Utils,
} from '@kinvolk/headlamp-plugin/lib';
import { useEffect } from 'react';
import { useOCMContext } from './helpers';

/** The OCM group in the sidebar. */
const ocmEntry = { parent: null, name: 'ocm', label: 'OCM', icon: 'vaadin:cluster' };
/** Pages about the fleet, which only a hub has. */
const hubPages = [
  'ocm-overview',
  'ocm-clusters',
  'ocm-placements',
  'ocm-manifestwork',
  'ocm-addons',
];
/** The page about the OCM agent on a managed cluster. */
const agentPage = 'ocm-managed';

type OCMRole = 'hub' | 'managed' | 'none';

/** The role of the clusters selected when it was last detected. */
let detected: { clusters: string; role: OCMRole } | undefined;

function selectedRole() {
  const clusters = (Utils.getClusterGroup() ?? []).join(',');
  return detected?.clusters === clusters ? detected.role : undefined;
}

/**
 * Shows the pages for the role of the selected clusters: the fleet pages on a hub, the agent
 * page on a managed cluster, and no OCM group elsewhere. Until the role is known, and when it
 * cannot be detected, every page is shown.
 */
function filterOCMPages<T extends { name: string }>(entry: T): T | null {
  switch (selectedRole()) {
    case 'hub':
      return entry.name === agentPage ? null : entry;
    case 'managed':
      return hubPages.includes(entry.name) ? null : entry;
    case 'none':
      return entry.name === ocmEntry.name ? null : entry;
    default:
      return entry;
  }
}

/** Detects the OCM role of the selected clusters and makes the sidebar apply it. */
function OCMRoleDetector() {
  const clusters = K8s.useSelectedClusters();
  const context = useOCMContext(clusters);
  const key = clusters.join(',');

  useEffect(() => {
    if (context.type === 'loading') return;
    if (context.type === 'error') {
      if (detected?.clusters !== key) return;
      detected = undefined;
    } else {
      if (detected?.clusters === key && detected.role === context.type) return;
      detected = { clusters: key, role: context.type };
    }
    // Registering the group again makes the sidebar run its filters again.
    registerSidebarEntry(ocmEntry);
  }, [key, context.type]);

  return null;
}

export function registerOCMSidebar() {
  registerSidebarEntry(ocmEntry);
  registerSidebarEntryFilter(filterOCMPages);
  registerAppBarAction(OCMRoleDetector);
}
