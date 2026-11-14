import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { StatsBar } from "@/components/sections/StatsBar";
import { NodeGridContainer } from "@/components/sections/NodeGrid";
import { NodeCompactContainer } from "@/components/sections/NodeCompact";
import { NodeTable } from "@/components/sections/NodeTable";
import Loading from "@/components/loading";
import type { NodeData } from "@/types/node";
import { useNodeData } from "@/contexts/NodeDataContext";
import { useAppConfig } from "@/config";
import { useTheme } from "@/hooks/useTheme";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useIsMobile } from "@/hooks/useMobile";
import { useLocale } from "@/config/hooks";
import { ALL_GROUPS } from "@/hooks/useNodeCommons";
import { cn } from "@/utils";

const NodeGridSkeleton = () => (
  <div className="my-4 grid grid-cols-[repeat(auto-fill,minmax(18rem,1fr))] gap-4">
    {Array.from({ length: 6 }).map((_, index) => (
      <div
        key={index}
        className="theme-card-style animate-pulse rounded-lg bg-(--card) p-4 backdrop-blur-md">
        <div className="mb-4 flex items-center justify-between">
          <div className="h-4 w-28 rounded bg-(--foreground)/20" />
          <div className="h-4 w-4 rounded bg-(--foreground)/20" />
        </div>
        <div className="space-y-3">
          <div className="h-3 w-3/4 rounded bg-(--foreground)/15" />
          <div className="h-3 w-1/2 rounded bg-(--foreground)/15" />
          <div className="mt-2 h-16 w-full rounded bg-(--foreground)/10" />
        </div>
      </div>
    ))}
  </div>
);

interface HomePageProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredNodes: (NodeData & { stats?: any })[];
  selectedGroup: string;
  setSelectedGroup: (group: string) => void;
  stats: any;
  groups: string[];
  handleSort: (key: any) => void;
}

const HomePage: React.FC<HomePageProps> = ({
  searchTerm,
  setSearchTerm,
  filteredNodes,
  selectedGroup,
  setSelectedGroup,
  stats,
  groups,
  handleSort,
}) => {
  const { viewMode, statusCardsVisibility, setStatusCardsVisibility } =
    useTheme();
  const { loading, error, refreshNodes } = useNodeData();
  const {
    enableGroupedBar,
    enableStatsBar,
    enableSwap,
    enableListItemProgressBar,
    selectTrafficProgressStyle,
    isShowStatsInHeader,
    mergeGroupsWithStats,
  } = useAppConfig();
  const { t } = useLocale();

  const isMobile = useIsMobile();

  const hasSearchTerm = searchTerm.trim().length > 0;
  // 数据到达前会有一小段 loading：延迟 300ms 再露脸，绝大多数情况下数据已经到了，
  // 避免刚进首页就闪一下转圈
  const [showLoading, setShowLoading] = useState(false);
  useEffect(() => {
    if (!loading) {
      setShowLoading(false);
      return;
    }
    const timer = setTimeout(() => setShowLoading(true), 300);
    return () => clearTimeout(timer);
  }, [loading]);

  if (loading) {
    // 网格视图用骨架卡片占位，避免刚进首页时再闪一次转圈；其他视图保留转圈但延迟出现
    if (viewMode === "grid") {
      return <NodeGridSkeleton />;
    }
    return showLoading ? (
      <div className="flex min-h-[70vh] w-full items-center justify-center">
        <Loading text={t("homePage.loadingData")} />
      </div>
    ) : null;
  }

  const renderContent = () => {
    if (viewMode === "grid") {
      return (
        <NodeGridContainer
          nodes={filteredNodes}
          enableSwap={enableSwap}
          selectTrafficProgressStyle={selectTrafficProgressStyle}
        />
      );
    }
    if (viewMode === "compact") {
      return <NodeCompactContainer nodes={filteredNodes} />;
    }
    if (viewMode === "table") {
      return (
        <NodeTable
          nodes={filteredNodes}
          enableSwap={enableSwap}
          enableListItemProgressBar={enableListItemProgressBar}
          selectTrafficProgressStyle={selectTrafficProgressStyle}
        />
      );
    }
    return null;
  };

  return (
    <div className="fade-in my-4">
      {enableStatsBar && (!isShowStatsInHeader || isMobile) && (
        <StatsBar
          displayOptions={statusCardsVisibility}
          setDisplayOptions={setStatusCardsVisibility}
          stats={stats}
          loading={loading}
          isShowStatsInHeader={isShowStatsInHeader}
          enableGroupedBar={enableGroupedBar}
          groups={groups}
          selectedGroup={selectedGroup}
          onSelectGroup={setSelectedGroup}
          onSort={handleSort}
        />
      )}

      {enableGroupedBar && !mergeGroupsWithStats && (
        <div className="flex purcarte-blur theme-card-style overflow-auto whitespace-nowrap overflow-x-auto items-center min-w-[300px] text-primary space-x-4 px-4 my-4">
          <span>{t("group.name")}</span>
          {groups?.map((group: string) => (
            <Button
              key={group}
              variant={selectedGroup === group ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setSelectedGroup?.(group)}>
              {group === ALL_GROUPS ? t("group.all") : group}
            </Button>
          ))}
        </div>
      )}

      <div className={cn("space-y-4", viewMode === "table" && "-mx-2 -mb-2")}>
        {filteredNodes.length > 0 ? (
          renderContent()
        ) : (
          <div className="flex flex-grow items-center justify-center">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="text-2xl font-bold">
                  {hasSearchTerm
                    ? t("search.notFound")
                    : error
                    ? t("homePage.errorFetchingNodes")
                    : t("homePage.noNodes")}
                </CardTitle>
                <CardDescription>
                  {hasSearchTerm
                    ? t("search.tryChangingFilters")
                    : error
                    ? t("homePage.retryFetchingNodes")
                    : t("homePage.addNodesInAdmin")}
                </CardDescription>
              </CardHeader>
              <CardFooter>
                {hasSearchTerm ? (
                  <Button onClick={() => setSearchTerm("")} className="w-full">
                    {t("search.clear")}
                  </Button>
                ) : error ? (
                  <Button
                    onClick={() => void refreshNodes()}
                    className="w-full">
                    {t("search.retry")}
                  </Button>
                ) : (
                  <Button
                    onClick={() =>
                      window.open("/admin", "_blank", "noopener,noreferrer")
                    }
                    className="w-full">
                    {t("homePage.addNode")}
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
