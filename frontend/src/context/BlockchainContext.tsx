import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import type { Transaction, ConnectionState, Alert } from "../types";

interface DashboardMetrics {
  transactions_processed: number;
  high_risk: number;
  critical_risk: number;
  medium_risk: number;
  low_risk: number;
  alerts_open: number;
  total_alerts: number;
  risk_analyzed: number;
  timestamp: string;
}

interface BlockchainContextType {
  transactions: Transaction[];
  connectionState: ConnectionState;
  metrics: DashboardMetrics;
  alerts: Alert[];
  selectedTx: Transaction | null;
  setSelectedTx: (tx: Transaction | null) => void;
  isConnected: boolean;
  acknowledgeAlert: (id: string) => Promise<void>;
}

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8080").replace(/\/$/, "");
const WS_URL = (import.meta.env.VITE_WS_URL || "ws://localhost:8080").replace(/\/$/, "");

const defaultConnection: ConnectionState = {
  status: "OFFLINE",
  network: "ethereum-mainnet",
  provider: "alchemy",
  subscription: "none",
  last_event_at: null,
  last_block: null,
  events_received: 0,
  events_processed: 0,
  reconnect_count: 0,
  connected_at: null,
  latency_ms: 0,
};

const defaultMetrics: DashboardMetrics = {
  transactions_processed: 0,
  high_risk: 0,
  critical_risk: 0,
  medium_risk: 0,
  low_risk: 0,
  alerts_open: 0,
  total_alerts: 0,
  risk_analyzed: 0,
  timestamp: new Date(0).toISOString(),
};

const Context = createContext<BlockchainContextType | null>(null);

export const BlockchainProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [connectionState, setConnectionState] = useState<ConnectionState>(defaultConnection);
  const [metrics, setMetrics] = useState<DashboardMetrics>(defaultMetrics);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<number | null>(null);

  useEffect(() => {
    let disposed = false;

    const hydrate = async () => {
      try {
        const [txResponse, alertResponse, metricResponse, stateResponse] = await Promise.all([
          fetch(`${API_URL}/api/v1/transactions?limit=500`),
          fetch(`${API_URL}/api/v1/alerts`),
          fetch(`${API_URL}/api/v1/metrics`),
          fetch(`${API_URL}/api/v1/health/blockchain`),
        ]);

        if (disposed) return;
        if (txResponse.ok) {
          const body = await txResponse.json();
          setTransactions(body.transactions || []);
        }
        if (alertResponse.ok) {
          const body = await alertResponse.json();
          setAlerts(body.alerts || []);
        }
        if (metricResponse.ok) setMetrics(await metricResponse.json());
        if (stateResponse.ok) setConnectionState(await stateResponse.json());
      } catch {
        // The WebSocket connection below remains the source of live updates.
      }
    };

    const connect = () => {
      if (disposed) return;
      const ws = new WebSocket(`${WS_URL}/ws/live`);
      wsRef.current = ws;

      ws.onopen = () => console.log("[BlockSentinel] WebSocket connected");

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === "connection_state") {
            setConnectionState(msg.data);
          } else if (msg.type === "metrics") {
            setMetrics(msg.data);
          } else if (msg.type === "snapshot") {
            if (Array.isArray(msg.data?.transactions)) setTransactions(msg.data.transactions);
            if (Array.isArray(msg.data?.alerts)) setAlerts(msg.data.alerts);
          } else if (msg.type === "transaction") {
            const tx: Transaction = msg.data;
            setTransactions((prev) => {
              const withoutDuplicate = prev.filter((item) => item.tx_hash !== tx.tx_hash);
              return [tx, ...withoutDuplicate].slice(0, 5000);
            });
          } else if (msg.type === "alert") {
            const alert: Alert = msg.data;
            setAlerts((prev) => [alert, ...prev.filter((a) => a.id !== alert.id)].slice(0, 500));
          }
        } catch {
          console.warn("[BlockSentinel] Ignored malformed WebSocket message");
        }
      };

      ws.onclose = () => {
        if (disposed) return;
        setConnectionState((prev) => ({ ...prev, status: "RECONNECTING" }));
        reconnectTimer.current = window.setTimeout(connect, 3000);
      };

      ws.onerror = () => ws.close();
    };

    hydrate();
    connect();

    return () => {
      disposed = true;
      if (reconnectTimer.current) window.clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, []);


  const acknowledgeAlert = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/alerts/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "ACKNOWLEDGED" }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const updated: Alert = await response.json();
      setAlerts((prev) => prev.map((alert) => alert.id === updated.id ? updated : alert));
    } catch (error) {
      console.error("[BlockSentinel] Failed to acknowledge alert", error);
    }
  };

  const isConnected = connectionState.status === "LIVE";

  return (
    <Context.Provider value={{
      transactions,
      connectionState,
      metrics,
      alerts,
      selectedTx,
      setSelectedTx,
      isConnected,
      acknowledgeAlert,
    }}>
      {children}
    </Context.Provider>
  );
};

export const useBlockchain = () => {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("useBlockchain must be used within BlockchainProvider");
  return ctx;
};
