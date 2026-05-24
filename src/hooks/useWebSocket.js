import { useEffect, useRef, useCallback } from 'react';

export function useWebSocket(url, { onMessage, maxRetries = 10, maxDelay = 30000, enabled = true } = {}) {
  const wsRef = useRef(null);
  const retriesRef = useRef(0);
  const cleanupRef = useRef(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const connect = useCallback(() => {
    if (!url || !enabled) return;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      retriesRef.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
          return;
        }
        onMessageRef.current?.(data);
      } catch (e) {}
    };

    ws.onclose = () => {
      if (retriesRef.current < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, retriesRef.current), maxDelay);
        retriesRef.current++;
        cleanupRef.current = setTimeout(connect, delay);
      }
    };

    ws.onerror = () => ws.close();
  }, [url, maxRetries, maxDelay, enabled]);

  useEffect(() => {
    if (!url || !enabled) return;
    connect();

    return () => {
      if (cleanupRef.current) clearTimeout(cleanupRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [url, enabled, connect]);

  const send = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  const isConnected = () => wsRef.current?.readyState === WebSocket.OPEN;

  return { send, isConnected, wsRef };
}
