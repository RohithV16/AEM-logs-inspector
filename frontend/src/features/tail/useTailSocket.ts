import { useState, useCallback, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

export interface TailEntry {
  id: string;
  timestamp: string;
  level: string;
  message: string;
}

export function useTailSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [entries, setEntries] = useState<TailEntry[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback((filters?: Record<string, string[]>) => {
    const newSocket = io('/tail');
    newSocket.on('connect', () => setConnected(true));
    newSocket.on('disconnect', () => setConnected(false));
    newSocket.on('tail-entry', (entry: TailEntry) => {
      setEntries((prev) => [...prev.slice(-499), entry]);
    });
    newSocket.on('tail-error', (err: string) => setError(err));
    newSocket.on('error', (err: string) => setError(err));
    if (filters) newSocket.emit('tail-start', filters);
    setSocket(newSocket);
  }, []);

  const disconnect = useCallback(() => {
    socket?.emit('tail-stop');
    socket?.disconnect();
    setSocket(null);
    setConnected(false);
  }, [socket]);

  const clear = useCallback(() => setEntries([]), []);

  useEffect(() => {
    return () => {
      socket?.disconnect();
    };
  }, [socket]);

  return { entries, connected, error, connect, disconnect, clear };
}