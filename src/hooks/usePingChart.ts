import { useState, useEffect } from "react";
import { useNodeData } from "@/contexts/NodeDataContext";
import type { PingHistoryResponse, NodeData } from "@/types/node";

const cache = new Map<
  string,
  { data: PingHistoryResponse; timestamp: number }
>();

/** 缓存有效期：60 秒 */
const CACHE_TTL = 60_000;

/** 手动清空 Ping 历史缓存（如数据明显过期时可由调用方触发） */
export const clearPingHistoryCache = () => {
  cache.clear();
};

export const usePingChart = (node: NodeData | null, hours: number) => {
  const { getPingHistory } = useNodeData();
  const [pingHistory, setPingHistory] = useState<PingHistoryResponse | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!node?.uuid) {
      setPingHistory(null);
      setLoading(false);
      return;
    }

    const cacheKey = `${node.uuid}-${hours}`;

    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setPingHistory(cached.data);
      setLoading(false);
      return;
    }
    if (cached) {
      // 命中过期缓存：删掉后照常重新请求
      cache.delete(cacheKey);
    }

    setLoading(true);
    setError(null);

    const fetchHistory = async () => {
      try {
        const data = await getPingHistory(node.uuid, hours);
        if (data) {
          cache.set(cacheKey, { data, timestamp: Date.now() });
        }
        setPingHistory(data);
      } catch (err: any) {
        setError(err.message || "Failed to fetch history data");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [node?.uuid, hours, getPingHistory]);

  return {
    loading,
    error,
    pingHistory,
  };
};
