import { useEffect, useRef, useState, useCallback } from 'react';
import { API_BASE_URL } from '../services/api';

interface WebSocketMessage {
  event: string;
  [key: string]: any;
}

export const useWebSocket = (channel: string, onMessage?: (data: WebSocketMessage) => void) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const retryCountRef = useRef(0);
  const isUnmountedRef = useRef(false);

  // Keep latest onMessage callback in a ref to avoid reconnecting on every render
  const onMessageRef = useRef(onMessage);
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const getWsUrl = useCallback((ch: string) => {
    try {
      // If API_BASE_URL is 'http://localhost:8000/api' or 'http://127.0.0.1:8000/api'
      const parsed = new URL(API_BASE_URL, window.location.href);
      const wsProtocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${wsProtocol}//${parsed.host}/ws/${ch}`;
    } catch {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? '127.0.0.1:8000'
        : window.location.host;
      return `${protocol}//${host}/ws/${ch}`;
    }
  }, []);

  const connect = useCallback(() => {
    if (isUnmountedRef.current) return;

    try {
      if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
        return;
      }

      const wsUrl = getWsUrl(channel);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (isUnmountedRef.current) {
          ws.close();
          return;
        }
        setIsConnected(true);
        retryCountRef.current = 0;
        console.debug(`[WebSocket] Connected to channel: ${channel}`);
      };

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          setLastMessage(parsed);
          if (onMessageRef.current) {
            onMessageRef.current(parsed);
          }
        } catch (e) {
          console.debug('[WebSocket] Message parse error', e);
        }
      };

      ws.onclose = () => {
        if (isUnmountedRef.current) return;
        setIsConnected(false);
        console.debug(`[WebSocket] Disconnected from channel: ${channel}`);

        // Reconnect with bounded exponential backoff (up to 10s)
        const delay = Math.min(1000 * Math.pow(1.5, retryCountRef.current), 10000);
        retryCountRef.current += 1;

        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          if (!isUnmountedRef.current) {
            connect();
          }
        }, delay);
      };

      ws.onerror = (err) => {
        setIsConnected(false);
        console.debug(`[WebSocket] Connection error on channel: ${channel}`, err);
      };
    } catch (err) {
      console.debug('[WebSocket] Failed to initialize connection', err);
    }
  }, [channel, getWsUrl]);

  useEffect(() => {
    isUnmountedRef.current = false;
    connect();

    return () => {
      isUnmountedRef.current = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [channel, connect]);

  const sendMessage = useCallback((msg: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  }, []);

  return { isConnected, lastMessage, sendMessage };
};
