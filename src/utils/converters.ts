import type { NodeStats } from "../types/node";
import type { RpcNodeStatus } from "../types/rpc";

/**
 * 把可能缺失或非法的数值字段安全地转换为有限数值。
 * 后端某个节点缺字段（或返回 null/"abc"）时回退为 0，
 * 避免一个坏字段把整批节点的转换都带崩。
 */
const toFiniteNumber = (value: unknown): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

export function convertNodeStatsToRpcNodeStatus(
  stats: NodeStats | null | undefined,
  clientUuid: string,
  isOnline: boolean
): RpcNodeStatus {
  return {
    client: clientUuid,
    // 时间戳缺失时回退到当前时间：下游会用 new Date(time).toISOString() 画实时图，
    // 空字符串会抛 RangeError（Invalid time value）。
    time: stats?.updated_at || new Date().toISOString(),
    cpu: toFiniteNumber(stats?.cpu?.usage),
    gpu: 0, // Old API does not provide GPU usage
    ram: toFiniteNumber(stats?.ram?.used),
    ram_total: toFiniteNumber(stats?.ram?.total),
    swap: toFiniteNumber(stats?.swap?.used),
    swap_total: toFiniteNumber(stats?.swap?.total),
    load: toFiniteNumber(stats?.load?.load1),
    load5: toFiniteNumber(stats?.load?.load5),
    load15: toFiniteNumber(stats?.load?.load15),
    temp: 0, // Old API does not provide temperature
    disk: toFiniteNumber(stats?.disk?.used),
    disk_total: toFiniteNumber(stats?.disk?.total),
    net_in: toFiniteNumber(stats?.network?.down),
    net_out: toFiniteNumber(stats?.network?.up),
    net_total_up: toFiniteNumber(stats?.network?.totalUp),
    net_total_down: toFiniteNumber(stats?.network?.totalDown),
    process: toFiniteNumber(stats?.process),
    connections: toFiniteNumber(stats?.connections?.tcp),
    connections_udp: toFiniteNumber(stats?.connections?.udp),
    online: isOnline,
    uptime: toFiniteNumber(stats?.uptime),
  };
}
