import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateModelMemoryPlan,
  calculateProxmoxTotals,
  computeRoadmapProgress,
  filterServices,
  getConnectedGraphIds,
} from './architectureLogic';
import { ARCHITECTURE_CONFIG } from '../data/architectureData';
import { InferenceMode, RoadmapItemStatus, ServiceCategory } from '../types/architecture';

test('400B+ Q4 model exceeds single Mac Studio 224GB usable cap in Independent mode but fits comfortably in Distributed mode', () => {
  const independentPlan = calculateModelMemoryPlan(
    450,
    'Q4_K_M',
    32768,
    InferenceMode.Independent
  );
  assert.equal(independentPlan.fitStatus, 'exceeds');
  assert.equal(independentPlan.replicaFailoverCandidate, false);
  assert.ok(independentPlan.perNodeAllocatedGb > independentPlan.perNodeUsableCapGb);

  const distributedPlan = calculateModelMemoryPlan(
    450,
    'Q4_K_M',
    32768,
    InferenceMode.Distributed,
    4
  );
  assert.equal(distributedPlan.fitStatus, 'comfortable');
  assert.equal(distributedPlan.replicaFailoverCandidate, false);
  assert.equal(distributedPlan.estimatedPerNodeSharePercent, 25);
  assert.equal(distributedPlan.usablePoolGb, 896); // 4 nodes * 224 GB
  assert.ok(distributedPlan.perNodeAllocatedGb < distributedPlan.perNodeUsableCapGb);
});

test('70B Q8_0 model is a memory-eligible redundant-replica candidate, not proven HA', () => {
  const plan = calculateModelMemoryPlan(70, 'Q8_0', 16384, InferenceMode.Independent);
  assert.equal(plan.fitStatus, 'comfortable');
  assert.equal(plan.replicaFailoverCandidate, true);
  assert.ok(plan.totalRequiredGb > 75 && plan.totalRequiredGb < 110);
});

test('Roadmap defaults all tasks to Not Started (0% completion) and updates accurately with local status overrides', () => {
  const initial = computeRoadmapProgress(ARCHITECTURE_CONFIG.roadmapPhases, {});
  assert.equal(initial.completionPercent, 0);
  assert.equal(initial.notStartedCount, initial.totalTasks);
  assert.ok(initial.totalTasks >= 20);

  const overrides: Record<string, RoadmapItemStatus> = {
    'p1-proxmox-vms': RoadmapItemStatus.Completed,
    'p1-storage-net': RoadmapItemStatus.Completed,
    'p1-auth': RoadmapItemStatus.InProgress,
    'p1-postgres': RoadmapItemStatus.InProgress,
  };
  const updated = computeRoadmapProgress(ARCHITECTURE_CONFIG.roadmapPhases, overrides);
  assert.equal(updated.completedCount, 2);
  assert.equal(updated.inProgressCount, 2);
  // Phase 1 has 4 tasks: 2 completed + 2 in-progress (0.5 each) = 3/4 = 75%
  assert.equal(updated.phaseBreakdown[0].percent, 75);
  assert.ok(updated.completionPercent > 0);
});

test('getConnectedGraphIds respects InferenceMode and telemetry filter', () => {
  const distHighlight = getConnectedGraphIds(
    'svc-mlx-server',
    ARCHITECTURE_CONFIG.connections,
    InferenceMode.Distributed,
    false
  );
  assert.ok(distHighlight.edgeIds.has('conn-mlx-cluster1'));
  assert.ok(distHighlight.edgeIds.has('conn-mlx-cluster2'));
  assert.ok(!distHighlight.edgeIds.has('conn-mlx-otel'));

  const withTelemetry = getConnectedGraphIds(
    'svc-mlx-server',
    ARCHITECTURE_CONFIG.connections,
    InferenceMode.Independent,
    true
  );
  assert.ok(!withTelemetry.edgeIds.has('conn-mlx-cluster1')); // ModeSpecific to Distributed
  assert.ok(withTelemetry.edgeIds.has('conn-mlx-cluster2'));
  assert.ok(withTelemetry.edgeIds.has('conn-mlx-otel'));
});

test('filterServices and calculateProxmoxTotals match expected architecture inventory', () => {
  const dataServices = filterServices(ARCHITECTURE_CONFIG.services, 'redis', ServiceCategory.Data);
  assert.equal(dataServices.length, 1);
  assert.equal(dataServices[0].id, 'svc-redis');

  const totals = calculateProxmoxTotals(ARCHITECTURE_CONFIG.proxmoxVms);
  assert.equal(ARCHITECTURE_CONFIG.proxmoxVms.length, 6);
  assert.equal(totals.minVcpu, 24);
  assert.equal(totals.maxVcpu, 36);
  assert.equal(totals.minRamGb, 64);
  assert.equal(totals.maxRamGb, 112);
});

test('3 Mac Studio clusters with 4 nodes each provides 3,072 GB Unified Memory and 896 GB usable pool per cluster', () => {
  const macNodes = ARCHITECTURE_CONFIG.physicalNodes.filter((n) => n.nodeType === 'mac-studio');
  assert.equal(macNodes.length, 12, 'Must have exactly 12 Mac Studio nodes');

  for (const node of macNodes) {
    assert.equal(node.memoryGb, 256, `Node ${node.hostname} must have 256 GB RAM`);
  }

  assert.equal(ARCHITECTURE_CONFIG.macClusters?.length, 3, 'Must have exactly 3 clusters');
  for (const cluster of ARCHITECTURE_CONFIG.macClusters || []) {
    assert.equal(cluster.nodeCount, 4, `Cluster ${cluster.name} must have 4 nodes`);
    assert.equal(cluster.totalRamGb, 1024, `Cluster ${cluster.name} must have 1,024 GB RAM`);
    assert.equal(cluster.usableWiredGb, 896, `Cluster ${cluster.name} must have 896 GB usable wired pool`);
  }

  const totalRam = macNodes.reduce((acc, n) => acc + n.memoryGb, 0);
  assert.equal(totalRam, 3072, 'Total Mac fleet Unified Memory must equal 3,072 GB');
});

test('architecture inventory has unique IDs and consistent references', () => {
  const config = ARCHITECTURE_CONFIG;
  const unique = (values: string[], label: string) =>
    assert.equal(new Set(values).size, values.length, 'Duplicate ' + label);

  unique(config.macClusters.map((c) => c.id), 'cluster IDs');
  unique(config.physicalNodes.map((n) => n.id), 'physical node IDs');
  unique(config.proxmoxVms.map((v) => v.id), 'VM IDs');
  unique(config.services.map((s) => s.id), 'service IDs');
  unique(config.connections.map((c) => c.id), 'connection IDs');
  unique(config.roadmapPhases.flatMap((p) => p.tasks.map((t) => t.id)), 'roadmap task IDs');

  const nodeById = new Map(config.physicalNodes.map((n) => [n.id, n]));
  const vmById = new Map(config.proxmoxVms.map((v) => [v.id, v]));
  const serviceById = new Map(config.services.map((s) => [s.id, s]));

  for (const cluster of config.macClusters) {
    assert.equal(cluster.nodeIds.length, cluster.nodeCount, 'Node count mismatch: ' + cluster.id);
    assert.equal(cluster.totalRamGb, cluster.nodeCount * cluster.ramPerNodeGb);
    for (const nodeId of cluster.nodeIds) {
      const node = nodeById.get(nodeId);
      assert.ok(node, 'Missing physical node ' + nodeId);
      assert.equal(node.clusterId, cluster.id);
      assert.equal(node.memoryGb, cluster.ramPerNodeGb);
      assert.match(node.vendorModel, /M5 Ultra/);
    }
  }

  for (const vm of config.proxmoxVms) {
    assert.ok(vm.vcpuMin <= vm.vcpuMax, 'Invalid vCPU range: ' + vm.id);
    assert.ok(vm.ramMinGb <= vm.ramMaxGb, 'Invalid memory range: ' + vm.id);
    for (const serviceId of vm.serviceIds) {
      assert.ok(serviceById.has(serviceId), 'VM ' + vm.id + ' references unknown service ' + serviceId);
    }
  }

  for (const service of config.services) {
    if (service.vmId) assert.ok(vmById.has(service.vmId), 'Unknown VM on ' + service.id);
    if (service.physicalNodeId) assert.ok(nodeById.has(service.physicalNodeId), 'Unknown node on ' + service.id);
    for (const dependency of service.dependencies) {
      assert.ok(serviceById.has(dependency), service.id + ' references unknown dependency ' + dependency);
    }
  }

  // Cluster nodes in React Flow are aggregate view IDs rather than services.
  const syntheticGraphIds = new Set(['cluster-c1', 'cluster-c2', 'cluster-c3']);
  for (const connection of config.connections) {
    for (const endpoint of [connection.source, connection.target]) {
      assert.ok(
        serviceById.has(endpoint) || syntheticGraphIds.has(endpoint),
        'Unknown graph endpoint ' + endpoint + ' in ' + connection.id
      );
    }
  }
});

test('MoE sizing uses total stored parameters, not just active parameters', () => {
  const deepSeek = calculateModelMemoryPlan(671, 'Q4_K_M', 32768, InferenceMode.Distributed, 4);
  assert.ok(deepSeek.weightsGb > 380, '671B total Q4 weights must not use active params');
  assert.equal(deepSeek.nodeCount, 4);
  assert.ok(deepSeek.perNodeAllocatedGb > 95);
});
