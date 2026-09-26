import { useState, useEffect, useRef, createContext, useContext } from "react";
import { useIsMobile } from "@/hooks/useMobile";
import { useAppConfig } from "@/config";
import {
  DEFAULT_CONFIG,
  allAppearance,
  allColors,
  allViewModes,
} from "@/config/default";
import type { AppearanceType, ColorType, ViewModeType } from "@/config/default";
import { parseBoolean } from "@/utils/parseBoolean";

type themeAppearanceType = "light" | "dark";
const defaultThemeAppearance: themeAppearanceType = "light";

export interface ThemeContextType {
  appearance: themeAppearanceType;
  rawAppearance: AppearanceType;
  setAppearance: (appearance: AppearanceType) => void;
  color: ColorType;
  setColor: (color: ColorType) => void;
  viewMode: ViewModeType;
  setViewMode: (mode: ViewModeType) => void;
  statusCardsVisibility: {
    currentTime: boolean;
    currentOnline: boolean;
    regionOverview: boolean;
    trafficOverview: boolean;
    networkSpeed: boolean;
  };
  setStatusCardsVisibility: (
    visibility: Partial<ThemeContextType["statusCardsVisibility"]>
  ) => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  appearance: defaultThemeAppearance,
  rawAppearance: DEFAULT_CONFIG.selectedDefaultAppearance as AppearanceType,
  setAppearance: () => {},
  color: DEFAULT_CONFIG.selectThemeColor as ColorType,
  setColor: () => {},
  viewMode: DEFAULT_CONFIG.selectedDefaultView as ViewModeType,
  setViewMode: () => {},
  statusCardsVisibility: {
    currentTime: true,
    currentOnline: true,
    regionOverview: true,
    trafficOverview: true,
    networkSpeed: true,
  },
  setStatusCardsVisibility: () => {},
});

/**
 * 将 Radix UI 的 "system" 外观转换为实际的 "light" 或 "dark" 外观
 * @param appearance - 上下文中的外观设置（"light"、"dark" 或 "system"）。
 * 返回 Radix UI 已解析的外观（ "light" 或 "dark"）
 */
export const useSystemTheme = (
  appearance: AppearanceType
): themeAppearanceType => {
  const [systemTheme, setSystemTheme] = useState<themeAppearanceType>(() => {
    // Initial system theme detection
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return "light";
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? "dark" : "light");
    };

    // Add listener for system theme changes
    mediaQuery.addEventListener("change", handleChange);

    // Cleanup
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Return the resolved theme
  if (appearance === "system") {
    return systemTheme;
  }

  return appearance as themeAppearanceType;
};

const useStoredState = <T>(
  key: string,
  defaultValue: T,
  validator?: (value: any) => value is T
): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const { enableLocalStorage } = useAppConfig();

  const [state, setState] = useState<T>(() => {
    if (enableLocalStorage) {
      try {
        const storedValue = localStorage.getItem(key);
        if (storedValue) {
          const parsedValue = JSON.parse(storedValue);
          if (!validator || validator(parsedValue)) {
            return parsedValue as T;
          }
        }
      } catch (error) {
        console.error("Error parsing stored state:", error);
        // Fallback to default value if parsing fails
      }
    }
    return defaultValue;
  });

  useEffect(() => {
    if (enableLocalStorage) {
      try {
        localStorage.setItem(key, JSON.stringify(state));
      } catch (error) {
        console.error("Error setting stored state:", error);
      }
    }
  }, [key, state, enableLocalStorage]);

  return [state, setState];
};

export const useThemeManager = () => {
  const {
    selectedDefaultAppearance,
    selectThemeColor,
    selectedDefaultView,
    selectMobileDefaultView,
    enableLocalStorage,
  } = useAppConfig();
  const defaultstatusCardsVisibility = useAppConfig().statusCardsVisibility;
  const isMobile = useIsMobile();

  const [appearance, setAppearance] = useStoredState<AppearanceType>(
    "appearance",
    selectedDefaultAppearance,
    (v): v is AppearanceType => allAppearance.includes(v)
  );

  const [color, setColor] = useStoredState<ColorType>(
    "color",
    selectThemeColor,
    (v): v is ColorType => allColors.includes(v)
  );

  const [viewMode, setViewMode] = useStoredState<ViewModeType>(
    "nodeViewMode",
    selectedDefaultView,
    (v): v is ViewModeType => allViewModes.includes(v)
  );

  // 上一次从后台拿到的默认值（null 表示还没同步过，即首次挂载）
  const prevDesktopDefaultView = useRef<ViewModeType | null>(null);
  const prevMobileDefaultView = useRef<ViewModeType | null>(null);
  const prevThemeColor = useRef<ColorType | null>(null);

  useEffect(() => {
    // 判断“后台默认值是否真的发生了变化”，并顺手更新快照。
    // 首次挂载（快照为 null）时默认不同步，避免把用户在本地保存的选择覆盖掉。
    const isFirstRun =
      prevDesktopDefaultView.current === null &&
      prevMobileDefaultView.current === null;
    const desktopDefaultChanged =
      prevDesktopDefaultView.current !== null &&
      prevDesktopDefaultView.current !== selectedDefaultView;
    const mobileDefaultChanged =
      prevMobileDefaultView.current !== null &&
      prevMobileDefaultView.current !== selectMobileDefaultView;

    prevDesktopDefaultView.current = selectedDefaultView;
    prevMobileDefaultView.current = selectMobileDefaultView;

    // enableLocalStorage 为 false 时，用户的本地选择无处存放，保持原有的
    // “配置强制生效”语义：允许首次挂载就把视图同步成配置里的默认值。
    // 开启本地存储时则只在后台默认值真的变化后才同步。
    const configForcesValue = !enableLocalStorage;
    const shouldSyncDesktop =
      desktopDefaultChanged || (isFirstRun && configForcesValue);
    const shouldSyncMobile =
      mobileDefaultChanged || (isFirstRun && configForcesValue);

    // 只同步当前设备对应的默认值；不再因为 isMobile 跨 768px 断点变化而重置用户视图
    // （配置没变时本函数会提前 return，即仅窗口尺寸变化不会产生任何 setViewMode）。
    if (isMobile) {
      if (shouldSyncMobile) {
        setViewMode(selectMobileDefaultView || selectedDefaultView);
      }
    } else if (shouldSyncDesktop) {
      setViewMode(selectedDefaultView);
    }
  }, [
    isMobile,
    selectMobileDefaultView,
    selectedDefaultView,
    enableLocalStorage,
    setViewMode,
  ]);

  const [statusCardsVisibility, setStatusCardsVisibility] = useStoredState(
    "statusCardsVisibility",
    (() => {
      const visibility: { [key: string]: boolean } = {};
      defaultstatusCardsVisibility.split(",").forEach((item) => {
        const [key, value] = item.split(":");
        visibility[key] = parseBoolean(value, false);
      });
      return visibility as ThemeContextType["statusCardsVisibility"];
    })()
  );

  const handleSetStatusCardsVisibility = (
    newVisibility: Partial<ThemeContextType["statusCardsVisibility"]>
  ) => {
    setStatusCardsVisibility((prev) => ({ ...prev, ...newVisibility }));
  };

  useEffect(() => {
    // 与视图模式同一套规则：首次挂载不覆盖用户本地保存的颜色，
    // 之后只在后台默认颜色发生变化时同步；配置强制生效（未启用本地存储）时允许首次同步。
    const isFirstRun = prevThemeColor.current === null;
    const colorChanged =
      prevThemeColor.current !== null &&
      prevThemeColor.current !== selectThemeColor;

    prevThemeColor.current = selectThemeColor;

    if (isFirstRun && enableLocalStorage) {
      return;
    }
    if (!isFirstRun && !colorChanged) {
      return;
    }

    setColor(selectThemeColor);
  }, [selectThemeColor, enableLocalStorage, setColor]);

  const resolvedAppearance = useSystemTheme(appearance);

  return {
    appearance: resolvedAppearance,
    rawAppearance: appearance,
    setAppearance,
    color,
    setColor,
    viewMode,
    setViewMode,
    statusCardsVisibility,
    setStatusCardsVisibility: handleSetStatusCardsVisibility,
  };
};
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
