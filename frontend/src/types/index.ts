export interface Transaction {
  id: string;
  tx_hash: string;
  chain_id: number;
  network: string;
  block_number: number | null;
  block_hash: string | null;
  transaction_index: number | null;
  from_address: string;
  to_address: string | null;
  value_wei: string;
  value_native: number;
  gas_limit: number;
  gas_price: string | null;
  nonce: number;
  input_data: string;
  transaction_type: number;
  status: "MINED" | "OBSERVED_PENDING";
  is_contract_interaction: boolean;
  first_seen_at: string;
  mined_at: string | null;
  source_provider: string;
  source_subscription: string;
  received_at: string;
  ingestion_latency_ms: number;
  processing_latency_ms: number;
  risk_score?: number;
  risk_level?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  risk?: {
    score: number;
    level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    factors: { name: string; description: string; weight: number; category: string }[];
    model_name: string;
    model_version: string;
    feature_version?: string;
    confidence: number;
    analyzed_at: string;
    explanation: string;
  } | null;
}

export interface ConnectionState {
  status: "CONNECTING" | "LIVE" | "RECONNECTING" | "OFFLINE";
  network: string;
  provider: string;
  subscription: string;
  last_event_at: string | null;
  last_block: string | null;
  events_received: number;
  events_processed: number;
  reconnect_count: number;
  connected_at: string | null;
  latency_ms: number;
}

export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  tx_hash?: string;
  wallet_address?: string;
  created_at: string;
  status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED";
}

export interface WalletProfile {
  address: string;
  risk_score: number;
  risk_level: string;
  tx_count: number;
  incoming_volume: number;
  outgoing_volume: number;
  first_seen: string;
  counterparties: number;
}

export interface InvestigationCase {
  id: string;
  title: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  status: "OPEN" | "UNDER_INVESTIGATION" | "RESOLVED" | "CLOSED";
  created_at: string;
  assigned_to: string;
  transactions: string[];
  wallets: string[];
  notes: string;
}

export type NavItem = {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
};
