import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ConfigOptions } from "@/config/default";
import { parseBoolean } from "@/utils/parseBoolean";

const OPTION_LABELS: Record<string, string> = {
  cover: "填满裁切",
  contain: "完整显示",
  fill: "拉伸铺满",
  inherit: "跟随桌面端",
  center: "居中",
  top: "顶部",
  bottom: "底部",
  left: "左侧",
  right: "右侧",
  "top left": "左上",
  "top right": "右上",
  "bottom left": "左下",
  "bottom right": "右下",
};

interface SettingItemProps {
  item: any;
  editingConfig: Partial<ConfigOptions>;
  onConfigChange: (key: keyof ConfigOptions, value: any) => void;
}

const SettingItem = ({
  item,
  editingConfig,
  onConfigChange,
}: SettingItemProps) => {
  const defaultValue = item.default;
  const currentValue =
    editingConfig[item.key as keyof ConfigOptions] ?? defaultValue;
  // switch 项的值可能是 "true" / "1" 这类字符串：用与开关显示（parseBoolean）一致的口径比较，
  // 否则没改动过的项也会被标成已修改（* 号）。
  const defaultSwitchValue = parseBoolean(defaultValue, false);
  const isModified =
    item.type === "switch"
      ? parseBoolean(currentValue, defaultSwitchValue) !== defaultSwitchValue
      : currentValue !== defaultValue;
  const [localValue, setLocalValue] = useState(currentValue);

  useEffect(() => {
    setLocalValue(currentValue);
  }, [currentValue]);

  const handleBlur = () => {
    if (item.type === "number") {
      onConfigChange(item.key, Number(localValue));
    } else {
      onConfigChange(item.key, localValue);
    }
  };

  const renderInput = () => {
    switch (item.type) {
      case "number":
        return (
          <Input
            type="number"
            className="theme-card-style"
            value={localValue as number}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleBlur}
          />
        );
      case "string":
        return (
          <Input
            type="text"
            className="theme-card-style"
            value={localValue as string}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleBlur}
          />
        );
      case "switch":
        return (
          <Switch
            // 配置/导入数据里的开关可能是 "false" 这类字符串，
            // Radix 的 checked 只看真值，直接传字符串 "false" 会显示成“开”
            checked={parseBoolean(localValue, parseBoolean(defaultValue, false))}
            onCheckedChange={(checked) => {
              setLocalValue(checked);
              onConfigChange(item.key, checked);
            }}
          />
        );
      case "select": {
        const options = String(item.options ?? "")
          .split(",")
          .map((option: string) => option.trim())
          .filter(Boolean);
        // 历史脏值不在清单里时 Radix 的触发器会显示空白，回落成该项默认值，
        // 至少让当前生效的取值看得见
        const fallback = options.includes(String(defaultValue))
          ? String(defaultValue)
          : options[0] ?? "";
        const raw = String(localValue ?? "");
        return (
          <Select
            value={options.includes(raw) ? raw : fallback}
            onValueChange={(value) => {
              setLocalValue(value);
              onConfigChange(item.key, value);
            }}>
            <SelectTrigger className="w-auto min-w-28 whitespace-nowrap">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {OPTION_LABELS[option] ?? option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      }
      default:
        return null;
    }
  };

  if (item.type === "title") {
    return <h3 className="text-lg font-semibold mt-4 mb-2">{item.name}</h3>;
  }

  if (item.type === "switch" || item.type === "select") {
    return (
      <div className="mb-4 flex items-center justify-between">
        <div>
          <span className="text-base font-bold">
            {item.name}
            {isModified && <span className="text-yellow-500 ml-2">*</span>}
          </span>
          {item.help && (
            <p className="text-sm text-gray-500 mt-1">{item.help}</p>
          )}
        </div>
        <div className="mt-2 ml-3 shrink-0">{renderInput()}</div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between">
        <span className="text-base font-bold">
          {item.name}
          {isModified && <span className="text-yellow-500 ml-2">*</span>}
        </span>
      </div>
      {item.help && <p className="text-sm text-gray-500 mt-1">{item.help}</p>}
      <div className="mt-2">{renderInput()}</div>
    </div>
  );
};

export default SettingItem;
