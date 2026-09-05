import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/useStore';

export const useWebSocket = () => {
  const ws = useRef(null);
  const { addLiveTx, setWsStatus } = useAppStore();

  useEffect(() => {
    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => { console.log('WS connected'); };

      ws.current.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'transaction') addLiveTx(msg.data);
          else if (msg.type === 'status') setWsStatus(msg.data);
        } catch (e) {}
      };

      ws.current.onclose = () => {
        setWsStatus({ connected: false, source: 'none' });
        setTimeout(connect, 5000);
      };

      ws.current.onerror = () => { ws.current.close(); };
    };

    connect();
    return () => ws.current?.close();
  }, []);

  return ws.current;
};
