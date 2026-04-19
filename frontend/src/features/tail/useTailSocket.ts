import { useState, useCallback, useEffect } from 'react';

export interface TailEntry {
  id: string;
  timestamp: string;
  level: string;
  message: string;
}

interface TailStartPayload {
  source: 'cloudmanager';
  environmentId: string;
  programId?: string;
  selections: Array<{ service: string; logName: string }>;
}

interface TailMessage {
  type: string;
  error?: string;
  message?: string;
  entry?: Partial<TailEntry> & { rawLine?: string };
}

function getWebSocketUrl() {
  if (typeof window === 'undefined') {
    return 'ws://localhost:3000';
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const localHostnames = new Set(['localhost', '127.0.0.1', '0.0.0.0']);
  const isLocalDevHost = localHostnames.has(window.location.hostname);
  if (isLocalDevHost && window.location.port && window.location.port !== '3000') {
    return `${protocol}//${window.location.hostname}:3000`;
  }

  return `${protocol}//${window.location.host}`;
}

export function useTailSocket() {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [entries, setEntries] = useState<TailEntry[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback((payload: TailStartPayload) => {
    const newSocket = new WebSocket(getWebSocketUrl());
    newSocket.onopen = () => {
      setConnected(true);
      setError(null);
      newSocket.send(JSON.stringify({ action: 'tail-start', ...payload }));
    };

    newSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as TailMessage;
        if (data.type === 'tail-entry') {
          const entry = data.entry || {};
          const timestamp = String(entry.timestamp || new Date().toISOString());
          const level = String(entry.level || 'INFO');
          const message = String(entry.message || entry.rawLine || '');
          setEntries((prev) => [...prev.slice(-499), {
            id: `${Date.now()}-${prev.length}`,
            timestamp,
            level,
            message
          }]);
          return;
        }
        if (data.type === 'tail-error') {
          setError(data.error || 'Live tail failed.');
        } else if (data.type === 'tail-stopped') {
          setConnected(false);
        }
      } catch {
        setError('Received invalid tail response from server.');
      }
    };

    newSocket.onerror = () => {
      setError('WebSocket connection failed.');
      setConnected(false);
    };

    newSocket.onclose = () => {
      setConnected(false);
    };

    setSocket(newSocket);
  }, []);

  const disconnect = useCallback(() => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ action: 'tail-stop' }));
    }
    socket?.close();
    setSocket(null);
    setConnected(false);
  }, [socket]);

  const clear = useCallback(() => setEntries([]), []);

  useEffect(() => {
    return () => {
      socket?.close();
    };
  }, [socket]);

  return { entries, connected, error, connect, disconnect, clear };
}
