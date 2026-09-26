import { memo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Layers } from "lucide-react";
import { cn } from "@/utils";
import type { StatsBarProps } from "./types";
import { useLocale } from "@/config/hooks";
import { ALL_GROUPS } from "@/hooks/useNodeCommons";

export const GroupSelector = memo(
  ({
    groups,
    selectedGroup,
    onSelectGroup,
  }: Pick<StatsBarProps, "groups" | "selectedGroup" | "onSelectGroup">) => {
    const { t } = useLocale();
    if (!groups?.length || !onSelectGroup) return null;

    return (
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="default"
            size="sm"
            className="h-7 shrink-0 rounded-full px-2 text-xs font-semibold">
            <Layers className="mr-1.5 h-3.5 w-3.5" />
            {selectedGroup === ALL_GROUPS ? t("group.all") : selectedGroup}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center">
          <DropdownMenuLabel>{t("group.selectTitle")}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {groups.map((group) => (
            <DropdownMenuItem
              key={group}
              className={cn(
                "cursor-pointer text-sm",
                selectedGroup === group && "bg-secondary/30 font-semibold"
              )}
              onSelect={() => onSelectGroup(group)}>
              {group === ALL_GROUPS ? t("group.all") : group}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
);
