export enum NavSection {
  Overview = 'overview',
  Topology = 'topology',
  MacCluster = 'mac-cluster',
  Proxmox = 'proxmox',
  Services = 'services',
  Observability = 'observability',
  Network = 'network',
  Roadmap = 'roadmap',
}

export enum InferenceMode {
  Distributed = 'distributed',
  Independent = 'independent',
}

export enum DeploymentStatus {
  Planned = 'Planned',
  Conceptual = 'Conceptual',
  Demo = 'Demo',
}

export enum RoadmapItemStatus {
  NotStarted = 'Not Started',
  Conceptual = 'Conceptual',
  InProgress = 'In Progress',
  Completed = 'Completed',
}

export enum ConnectionStyleType {
  Api = 'api',
  Inference = 'inference',
  Data = 'data',
  Telemetry = 'telemetry',
  Rdma = 'rdma',
}

export enum ServiceCategory {
  Clients = 'clients',
  Gateway = 'gateway',
  Inference = 'inference',
  Automation = 'automation',
  Data = 'data',
  Rag = 'rag',
  Mcp = 'mcp',
  Observability = 'observability',
}

export enum ArchitectureZoneId {
  ZoneA = 'zone-a',
  ZoneB = 'zone-b',
  ZoneC = 'zone-c',
  ZoneD = 'zone-d',
}

export interface MacCluster {
  id: string;
  clusterNumber: number;
  name: string;
  shortName: string;
  purpose: string;
  nodeCount: number;
  ramPerNodeGb: number;
  totalRamGb: number;
  usableWiredGb: number;
  bandwidth: string;
  rdmaInterconnect: string;
  nodeIds: string[];
  primaryModels: string[];
  vlanSubnet: string;
  tb5Subnet: string;
  roleBadge: string;
}

export interface PhysicalNode {
  id: string;
  hostname: string;
  name: string;
  vendorModel: string;
  role: string;
  nodeType: 'mac-studio' | 'proxmox-host';
  clusterId?: string;
  clusterIndex?: number;
  cpuSpec: string;
  gpuSpec: string;
  neuralEngineSpec?: string;
  memoryGb: number;
  memoryLabel: string;
  memoryBandwidth: string;
  storageSpec: string;
  osRuntime: string;
  interconnects: string[];
  managementIp: string;
  computeIp: string;
  vlanIds: number[];
  status: DeploymentStatus;
  powerEnvelopeWatts: string;
  notes: string[];
}

export interface ProxmoxVM {
  id: string;
  vmid: number;
  hostname: string;
  title: string;
  role: string;
  vcpuAllocation: string;
  vcpuMin: number;
  vcpuMax: number;
  ramAllocation: string;
  ramMinGb: number;
  ramMaxGb: number;
  storageAllocation: string;
  vlanId: number;
  ipAddress: string;
  status: DeploymentStatus;
  serviceIds: string[];
  featureBullets: string[];
  isolationNotes: string;
}

export interface ArchitectureService {
  id: string;
  name: string;
  shortName: string;
  category: ServiceCategory;
  zoneId: ArchitectureZoneId;
  iconName: string;
  tagline: string;
  description: string;
  assignedHostOrVm: string;
  vmId?: string;
  physicalNodeId?: string;
  cpuAllocation: string;
  memoryAllocation: string;
  portsAndProtocols: string[];
  vlanSegment: string;
  status: DeploymentStatus;
  dependencies: string[];
  securityConsiderations: string[];
  architectureNotes: string[];
  configSnippet: {
    filename: string;
    language: string;
    content: string;
  };
  observabilitySignals: {
    metrics: string[];
    logs: string[];
    traces: string[];
  };
  docsUrl?: string;
}

export interface ServiceConnection {
  id: string;
  source: string;
  target: string;
  label: string;
  protocol: string;
  styleType: ConnectionStyleType;
  bidirectional?: boolean;
  modeSpecific?: InferenceMode;
  isTelemetry?: boolean;
  description: string;
}

export interface NetworkVlan {
  vlanId: number;
  name: string;
  subnet: string;
  gateway: string;
  purpose: string;
  securityZone: string;
  connectedHosts: string[];
  firewallPolicy: string;
  accentColor: string;
}

export interface ModelCategorySpec {
  id: string;
  rangeLabel: string;
  exampleModels: string[];
  representativeParamsB: number;
  recommendedMode: InferenceMode;
  quantizationDefault: 'FP16' | 'Q8_0' | 'Q4_K_M';
  estimatedFootprintQ4Gb: string;
  estimatedFootprintQ8Gb: string;
  singleNodeViable: boolean;
  distributedViable: boolean;
  engineeringNotes: string;
}

export interface RoadmapTask {
  id: string;
  title: string;
  detail: string;
  defaultStatus: RoadmapItemStatus;
  category: string;
}

export interface RoadmapPhase {
  id: string;
  phaseNumber: number;
  title: string;
  subtitle: string;
  targetMilestone: string;
  dependencies: string;
  tasks: RoadmapTask[];
}

export interface ArchitectureMetadata {
  projectName: string;
  subtitle: string;
  version: string;
  environment: string;
  statusLabel: DeploymentStatus;
  lastUpdated: string;
}

export interface ArchitectureConfig {
  metadata: ArchitectureMetadata;
  macClusters: MacCluster[];
  physicalNodes: PhysicalNode[];
  proxmoxVms: ProxmoxVM[];
  services: ArchitectureService[];
  connections: ServiceConnection[];
  vlans: NetworkVlan[];
  modelCategories: ModelCategorySpec[];
  roadmapPhases: RoadmapPhase[];
}
