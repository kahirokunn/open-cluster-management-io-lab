import {
  ConditionsTable,
  Link,
  Loader,
  MainInfoSection,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';
import {
  isResourceListLoading,
  ResourceErrorNotice,
  ResourceListState,
} from '../common/ResourceState';
import StatusLabel, { conditionToStatus } from '../common/StatusLabel';
import { getConditionStatus } from '../helpers';
import { ClusterManagementAddOn, ManagedClusterAddOn } from '../resources';

export default function AddOnDetail() {
  const { name } = useParams<{ name: string }>();
  const [addon, error] = ClusterManagementAddOn.useGet(name!);
  const clusterAddons = ManagedClusterAddOn.useList({
    clusters: addon ? [addon.cluster] : [],
    fieldSelector: `metadata.name=${name}`,
  });

  if (!addon || error?.status === 401 || error?.status === 403 || error?.status === 404) {
    return (
      <SectionBox title="Add-on">
        {error ? (
          <ResourceErrorNotice error={error} resource="Add-on" />
        ) : (
          <Loader title="Loading Add-on…" />
        )}
      </SectionBox>
    );
  }

  return (
    <>
      {error && <ResourceErrorNotice error={error} resource="Add-on" hasData />}
      <MainInfoSection
        noDefaultActions
        resource={addon}
        title="Add-on"
        extraInfo={[
          {
            name: 'Display Name',
            value: addon.displayName,
          },
          {
            name: 'Description',
            value: addon.description || '-',
          },
          {
            name: 'Install Strategy',
            value: addon.installStrategy,
          },
          {
            name: 'Clusters',
            value: clusterAddons.error
              ? 'Unavailable'
              : isResourceListLoading(clusterAddons)
              ? 'Loading…'
              : String(clusterAddons.items?.length ?? 0),
          },
        ]}
      />

      <SectionBox title="Cluster Status">
        <ResourceListState
          result={clusterAddons}
          resource="managed cluster add-ons"
          empty="This add-on has no managed cluster installations."
        >
          {perCluster => (
            <SimpleTable
              data={perCluster}
              columns={[
                {
                  label: 'Cluster',
                  getter: (ca: InstanceType<typeof ManagedClusterAddOn>) => (
                    <Link
                      routeName="ocm-cluster-detail"
                      params={{ name: ca.metadata.namespace, cluster: ca.cluster }}
                    >
                      {ca.metadata.namespace}
                    </Link>
                  ),
                  sort: true,
                },
                {
                  label: 'Available',
                  getter: (ca: InstanceType<typeof ManagedClusterAddOn>) => {
                    const available = getConditionStatus(
                      ca.jsonData.status?.conditions,
                      'Available'
                    );
                    return (
                      <StatusLabel status={conditionToStatus(available?.status)}>
                        {available?.status === 'True'
                          ? 'Available'
                          : available?.status === 'False'
                          ? 'Unavailable'
                          : 'Unknown'}
                      </StatusLabel>
                    );
                  },
                },
                {
                  label: 'Configured',
                  getter: (ca: InstanceType<typeof ManagedClusterAddOn>) => {
                    const configured = getConditionStatus(
                      ca.jsonData.status?.conditions,
                      'Configured'
                    );
                    return (
                      <StatusLabel status={conditionToStatus(configured?.status)}>
                        {configured?.status === 'True'
                          ? 'Yes'
                          : configured?.status === 'False'
                          ? 'No'
                          : 'Unknown'}
                      </StatusLabel>
                    );
                  },
                },
                {
                  label: 'Install Namespace',
                  getter: (ca: InstanceType<typeof ManagedClusterAddOn>) => ca.installNamespace,
                },
              ]}
            />
          )}
        </ResourceListState>
      </SectionBox>

      <SectionBox title="Conditions">
        <ConditionsTable resource={addon} />
        {clusterAddons.error?.status !== 401 &&
          clusterAddons.error?.status !== 404 &&
          clusterAddons.items?.map(ca => (
            <div key={ca.metadata.uid ?? ca.metadata.namespace}>
              <h4>{ca.metadata.namespace}</h4>
              <ConditionsTable resource={ca} />
            </div>
          ))}
      </SectionBox>
    </>
  );
}
