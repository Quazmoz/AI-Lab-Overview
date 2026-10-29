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
import {
  applyMacHardwareScenario,
  DEFAULT_MAC_PROFILE_ID,
  getMacHardwareProfile,
  getMacStorageTb,
  illustrativeWiredGb,
  MAC_HARDWARE_PROFILES,
} from '../data/macHardwareProfiles';
import { candidateRuntime, getWorkloadDeploymentOption, WORKLOAD_DEPLOYMENT_OPTIONS } from '../data/workloadDeployment';
import { InferenceMode, RoadmapItemStatus, ServiceCategory } from '../types/architecture';

test('671B total-parameter Q4 MoE exceeds single Mac budget but is a four-rank memory candidate', () => {
  const independentPlan = calculateModelMemoryPlan(
    671,
    'Q4_K_M',
    32768,
    InferenceMode.Independent
  );
  assert.equal(independentPlan.fitStatus, 'exceeds');
  assert.equal(independentPlan.replicaFailoverCandidate, false);
  assert.ok(independentPlan.perNodeAllocatedGb > independentPlan.perNodeUsableCapGb);

  const distributedPlan = calculateModelMemoryPlan(
    671,
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

test('235B MoE is categorized by total weights and has different Q4/Q8 single-node outcomes', () => {
  const categories = ARCHITECTURE_CONFIG.modelCategories;
  const qwen235 = categories.find((category) => category.exampleModels.some((name) => name.includes('Qwen3-235B')));
  assert.equal(qwen235?.rangeLabel, '200B–399B');
  assert.equal(qwen235?.representativeParamsB, 235);

  const q4 = calculateModelMemoryPlan(235, 'Q4_K_M', 8192, InferenceMode.Independent);
  const q8 = calculateModelMemoryPlan(235, 'Q8_0', 8192, InferenceMode.Independent);
  assert.notEqual(q4.fitStatus, 'exceeds');
  assert.equal(q8.fitStatus, 'exceeds');
  assert.ok(q4.weightsGb > 125 && q4.weightsGb < 150);
  assert.ok(q8.weightsGb > 240);
});

test('model size tier labels never place the 32B or 235B examples outside their ranges', () => {
  const categories = ARCHITECTURE_CONFIG.modelCategories;
  assert.ok(categories.some((category) => category.rangeLabel === '8B–32B' && category.exampleModels.some((name) => name.includes('Coder-32B'))));
  assert.ok(categories.some((category) => category.rangeLabel === '200B–399B' && category.exampleModels.some((name) => name.includes('Qwen3-235B'))));
  assert.ok(!categories.some((category) => category.rangeLabel === '100B–200B' && category.exampleModels.some((name) => name.includes('235B'))));
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

test('supporting Linux services have typed runtime candidates without altering bare-metal inference', () => {
  const services = new Map(ARCHITECTURE_CONFIG.services.map((service) => [service.id, service]));
  const baselineIds = new Set(ARCHITECTURE_CONFIG.proxmoxVms.flatMap((vm) => vm.serviceIds));
  const optionIds = WORKLOAD_DEPLOYMENT_OPTIONS.map((option) => option.serviceId);

  assert.equal(new Set(optionIds).size, optionIds.length, 'Each service has one runtime plan');
  assert.deepEqual(new Set(optionIds), baselineIds, 'Every VM-hosted service has a plan and no other services are containerized');

  for (const option of WORKLOAD_DEPLOYMENT_OPTIONS) {
    const service = services.get(option.serviceId);
    assert.ok(service, 'Unknown service ' + option.serviceId);
    assert.ok(option.supportedRuntimes.includes('vm'), 'Baseline VM must always be supported');
    assert.ok(option.supportedRuntimes.includes('docker'), 'Docker candidate must be documented for Linux services');
    assert.ok(option.supportedRuntimes.includes(option.preferredRuntime), 'Preferred runtime must be eligible');
    assert.equal(candidateRuntime(service, 'vm'), 'vm');
    assert.equal(candidateRuntime(service, 'docker'), 'docker');
    assert.equal(
      candidateRuntime(service, 'kubernetes'),
      option.supportedRuntimes.includes('kubernetes') ? 'kubernetes' : 'vm'
    );
  }

  const eligibleKubernetes = WORKLOAD_DEPLOYMENT_OPTIONS
    .filter((option) => option.supportedRuntimes.includes('kubernetes'))
    .map((option) => option.serviceId)
    .sort();
  assert.deepEqual(eligibleKubernetes, ['svc-grafana', 'svc-litellm', 'svc-mcp', 'svc-n8n', 'svc-otel']);
  assert.equal(getWorkloadDeploymentOption('svc-mlx-server'), null);
  assert.equal(getWorkloadDeploymentOption('client-developers'), null);
  assert.equal(candidateRuntime(services.get('svc-mlx-server')!, 'kubernetes'), null);
  assert.equal(candidateRuntime(services.get('svc-postgres')!, 'kubernetes'), 'vm');
});

test('Apple-listed M5 Ultra scenarios update the full fleet without mutating the baseline', () => {
  const originalNode = ARCHITECTURE_CONFIG.physicalNodes.find((node) => node.nodeType === 'mac-studio')!;
  const originalCluster = ARCHITECTURE_CONFIG.macClusters[0];
  for (const profile of MAC_HARDWARE_PROFILES) {
    const scenario = applyMacHardwareScenario(ARCHITECTURE_CONFIG, profile, 8);
    const nodes = scenario.physicalNodes.filter((node) => node.nodeType === 'mac-studio');
    const budget = illustrativeWiredGb(profile.memoryGb);
    assert.equal(nodes.length, 12);
    assert.ok(nodes.every((node) =>
      node.memoryGb === profile.memoryGb
      && node.cpuSpec.startsWith(profile.cpuCores + '-core')
      && node.gpuSpec.startsWith(profile.gpuCores + '-core')
      && node.storageSpec.includes('8 TB')
    ));
    assert.equal(nodes.reduce((sum, node) => sum + node.memoryGb, 0), 12 * profile.memoryGb);
    assert.ok(scenario.macClusters.every((cluster) =>
      cluster.ramPerNodeGb === profile.memoryGb
      && cluster.totalRamGb === cluster.nodeCount * profile.memoryGb
      && cluster.usableWiredGb === cluster.nodeCount * budget
    ));
    assert.ok(scenario.services.find((svc) => svc.id === 'svc-mlx-server')!
      .memoryAllocation.includes((12 * profile.memoryGb).toLocaleString('en-US') + ' GB'));
    assert.equal(scenario.proxmoxVms, ARCHITECTURE_CONFIG.proxmoxVms);
  }
  assert.equal(originalNode.memoryGb, 256);
  assert.equal(originalNode.storageSpec.includes('4 TB'), true);
  assert.equal(originalCluster.totalRamGb, 1024);
});

test('profile and SSD choices reject invalid browser preferences', () => {
  assert.equal(getMacHardwareProfile('ultra-96').memoryGb, 96);
  assert.equal(getMacHardwareProfile('ultra-512').gpuCores, 80);
  assert.equal(getMacHardwareProfile('unlisted').id, DEFAULT_MAC_PROFILE_ID);
  assert.equal(getMacHardwareProfile({ id: 'ultra-512' }).id, DEFAULT_MAC_PROFILE_ID);
  assert.equal(getMacStorageTb('16'), 16);
  assert.equal(getMacStorageTb(2), 2);
  assert.equal(getMacStorageTb('4;rm'), 4);
  assert.equal(getMacStorageTb(0), 4);
});

test('hardware scenario changes model-fit results for the same model', () => {
  const fits = (profileId: string) => {
    const profile = getMacHardwareProfile(profileId);
    return calculateModelMemoryPlan(405, 'Q4_K_M', 8192, InferenceMode.Independent, 4, illustrativeWiredGb(profile.memoryGb));
  };
  assert.equal(fits('ultra-96').fitStatus, 'exceeds');
  assert.equal(fits('ultra-256').fitStatus, 'exceeds');
  assert.notEqual(fits('ultra-512').fitStatus, 'exceeds');
  assert.equal(fits('ultra-512').perNodeUsableCapGb, 448);
});
