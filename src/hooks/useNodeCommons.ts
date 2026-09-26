import { useMemo, useState } from "react";
import { formatPrice } from "@/utils";
import type { NodeData } from "@/types/node";
import type { RpcNodeStatus } from "@/types/rpc";
import { useNodeData } from "@/contexts/NodeDataContext";
import { useLiveData } from "@/contexts/LiveDataContext";
import type { NodeDataContextType } from "@/contexts/NodeDataContext";
import type { LiveDataContextType } from "@/contexts/LiveDataContext";
import { useLocale, useAppConfig } from "@/config/hooks";

type SortKey = "trafficUp" | "trafficDown" | "speedUp" | "speedDown" | null;
type SortOrder = "asc" | "desc";

/**
 * “全部分组”的哨兵值。
 * 以前直接用本地化文案 t("group.all") 当哨兵，管理员一改文案节点就会被过滤成空，
 * 现在用与文案无关的常量，展示时再翻译。
 */
export const ALL_GROUPS = "__all__";

/**
 * 安全地把后端数值字段转成有限数值：字段缺失（null / undefined / 非数字）时回退为 0。
 * 否则 NaN 会一路传到下游的 toFixed()（节点卡/表格的百分比、流量进度条）直接抛错。
 */
const toFiniteNumber = (value: unknown): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

export const useNodeListCommons = (searchTerm: string) => {
  const {
    nodes: staticNodes,
    loading,
    getGroups,
  } = useNodeData() as NodeDataContextType;
  const { liveData } = useLiveData() as LiveDataContextType;
  const { isOfflineNodesBehind, defaultSelectedGroup } = useAppConfig();
  const [selectedGroup, setSelectedGroup] = useState(
    defaultSelectedGroup || ALL_GROUPS
  );
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("desc");
    }
  };

  const combinedNodes = useMemo(() => {
    if (!staticNodes) return [];
    return staticNodes.map((node: NodeData) => {
      const stats = liveData ? liveData[node.uuid] : undefined;
      return {
        ...node,
        stats: stats,
      };
    });
  }, [staticNodes, liveData]);

  const groups = useMemo(
    () => [ALL_GROUPS, ...getGroups()],
    [getGroups]
  );

  const filteredNodes = useMemo(() => {
    let nodes = combinedNodes
      .filter(
        (node: NodeData & { stats?: any }) =>
          selectedGroup === ALL_GROUPS || node.group === selectedGroup
      )
      .filter((node: NodeData) =>
        node.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

    if (isOfflineNodesBehind || sortKey) {
      nodes.sort((a, b) => {
        if (isOfflineNodesBehind) {
          const aOnline = a.stats?.online || false;
          const bOnline = b.stats?.online || false;
          if (aOnline !== bOnline) {
            return aOnline ? -1 : 1;
          }
        }

        if (sortKey) {
          const sortMap: { [key in SortKey & string]: keyof RpcNodeStatus } = {
            trafficUp: "net_total_up",
            trafficDown: "net_total_down",
            speedUp: "net_out",
            speedDown: "net_in",
          };
          const statsKey = sortMap[sortKey];

          const aValue = Number(a.stats?.[statsKey] || 0);
          const bValue = Number(b.stats?.[statsKey] || 0);

          if (sortOrder === "asc") {
            return aValue - bValue;
          } else {
            return bValue - aValue;
          }
        }

        return 0;
      });
    }

    return nodes;
  }, [
    combinedNodes,
    selectedGroup,
    searchTerm,
    sortKey,
    sortOrder,
    isOfflineNodesBehind,
  ]);

  const stats = useMemo(() => {
    return {
      onlineCount: filteredNodes.filter((n) => n.stats?.online).length,
      totalCount: filteredNodes.length,
      uniqueRegions: new Set(filteredNodes.map((n) => n.region)).size,
      totalTrafficUp: filteredNodes.reduce(
        (acc, node) => acc + (node.stats?.net_total_up || 0),
        0
      ),
      totalTrafficDown: filteredNodes.reduce(
        (acc, node) => acc + (node.stats?.net_total_down || 0),
        0
      ),
      currentSpeedUp: filteredNodes.reduce(
        (acc, node) => acc + (node.stats?.net_out || 0),
        0
      ),
      currentSpeedDown: filteredNodes.reduce(
        (acc, node) => acc + (node.stats?.net_in || 0),
        0
      ),
    };
  }, [filteredNodes]);

  return {
    loading,
    groups,
    filteredNodes,
    stats,
    selectedGroup,
    setSelectedGroup,
    handleSort,
    sortKey,
    sortOrder,
  };
};

export const useNodeCommons = (node: NodeData & { stats?: any }) => {
  const { stats } = node;
  const { t } = useLocale();
  const isOnline = stats ? stats.online : false;
  const price = formatPrice(node.price, node.currency, node.billing_cycle);

  const cpuUsage = stats && isOnline ? toFiniteNumber(stats.cpu) : 0;
  const memUsage =
    stats && isOnline && node.mem_total > 0
      ? (toFiniteNumber(stats.ram) / node.mem_total) * 100
      : 0;
  const swapUsage =
    stats && isOnline && node.swap_total > 0
      ? (toFiniteNumber(stats.swap) / node.swap_total) * 100
      : 0;
  const diskUsage =
    stats && isOnline && node.disk_total > 0
      ? (toFiniteNumber(stats.disk) / node.disk_total) * 100
      : 0;

  const load =
    stats && isOnline
      ? [stats.load, stats.load5, stats.load15]
          .map((value) => {
            const num = Number(value);
            return Number.isFinite(num) ? num.toFixed(2) : "—";
          })
          .join(" | ")
      : t("node.notAvailable");

  const daysLeft =
    node.expired_at && new Date(node.expired_at).getTime() > 0
      ? Math.ceil(
          (new Date(node.expired_at).getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : null;

  let daysLeftTag = null;
  if (daysLeft !== null) {
    const daysLeftText = t("node.daysLeft", { daysLeft: daysLeft });
    if (daysLeft < 0) {
      daysLeftTag = `${t("node.expired")}<red>`;
    } else if (daysLeft <= 7) {
      daysLeftTag = `${daysLeftText}<red>`;
    } else if (daysLeft <= 15) {
      daysLeftTag = `${daysLeftText}<orange>`;
    } else if (daysLeft < 36500) {
      daysLeftTag = `${daysLeftText}<green>`;
    } else {
      daysLeftTag = `${t("node.longTerm")}<green>`;
    }
  }

  const expired_at =
    daysLeft !== null && daysLeft > 36500
      ? t("node.longTerm")
      : node.expired_at && new Date(node.expired_at).getTime() > 0
      ? new Date(node.expired_at).toLocaleDateString(undefined, {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })
      : t("node.notSet");

  const tagList = [
    ...(price ? [price] : []),
    ...(daysLeftTag ? [daysLeftTag] : []),
    ...(typeof node.tags === "string"
      ? node.tags
          .split(";")
          .map((tag) => tag.trim())
          .filter(Boolean)
      : []),
  ];

  // 计算流量使用百分比
  const trafficPercentage = useMemo(() => {
    if (!node.traffic_limit || !stats || !isOnline) return 0;

    // 根据流量限制类型确定使用的流量值
    let usedTraffic = 0;
    switch (node.traffic_limit_type) {
      case "up":
        usedTraffic = toFiniteNumber(stats.net_total_up);
        break;
      case "down":
        usedTraffic = toFiniteNumber(stats.net_total_down);
        break;
      case "sum":
        usedTraffic =
          toFiniteNumber(stats.net_total_up) +
          toFiniteNumber(stats.net_total_down);
        break;
      case "min":
        usedTraffic = Math.min(
          toFiniteNumber(stats.net_total_up),
          toFiniteNumber(stats.net_total_down)
        );
        break;
      default: // max 或者未设置
        usedTraffic = Math.max(
          toFiniteNumber(stats.net_total_up),
          toFiniteNumber(stats.net_total_down)
        );
        break;
    }

    return (usedTraffic / node.traffic_limit) * 100;
  }, [node.traffic_limit, node.traffic_limit_type, stats, isOnline]);

  return {
    stats,
    isOnline,
    tagList,
    cpuUsage,
    memUsage,
    swapUsage,
    diskUsage,
    load,
    expired_at,
    trafficPercentage,
  };
};
