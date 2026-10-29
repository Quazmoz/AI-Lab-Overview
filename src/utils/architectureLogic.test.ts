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
  assert.equal(independentPlan.failoverAvailable, false);
  assert.ok(independentPlan.perNodeAllocatedGb > independentPlan.perNodeUsableCapGb);

  const distributedPlan = calculateModelMemoryPlan(
    450,
    'Q4_K_M',
    32768,
    InferenceMode.Distributed,
    4
  );
  assert.equal(distributedPlan.fitStatus, 'comfortable');
  assert.equal(distributedPlan.failoverAvailable, false);
  assert.equal(distributedPlan.nodeLayersPct, 25);
  assert.equal(distributedPlan.usablePoolGb, 896); // 4 nodes * 224 GB
  assert.ok(distributedPlan.perNodeAllocatedGb < distributedPlan.perNodeUsableCapGb);
});

test('70B Q8_0 model fits comfortably on single node in Independent mode with failover enabled', () => {
  const plan = calculateModelMemoryPlan(70, 'Q8_0', 16384, InferenceMode.Independent);
  assert.equal(plan.fitStatus, 'comfortable');
  assert.equal(plan.failoverAvailable, true);
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
