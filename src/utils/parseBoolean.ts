/**
 * 布尔值解析工具
 *
 * 后台配置里的开关值（theme_settings / komari-theme.json / 导入的配置文件）
 * 可能是布尔、数字或字符串，例如 `true` / `1` / `"true"` / `"off"` / `"关闭"`。
 * 直接把它当布尔用会出问题（字符串 "false" 在 JS 里是 truthy），
 * 所以统一走这里解析，保证 UI（Radix Switch 的 checked 等）与渲染逻辑口径一致。
 */

/** 视为“开”的字符串（小写比较） */
const TRUTHY_STRINGS = new Set([
  "true",
  "1",
  "on",
  "yes",
  "y",
  "enable",
  "enabled",
  "开",
  "是",
  "真",
]);

/** 视为“关”的字符串（小写比较） */
const FALSY_STRINGS = new Set([
  "false",
  "0",
  "off",
  "no",
  "n",
  "none",
  "disable",
  "disabled",
  "关闭",
  "否",
  "不",
  "假",
]);

/**
 * 将任意值解析为布尔值
 * @param value 待解析的值
 * @param fallback 无法识别时的兜底值（默认为 false）
 * @returns 解析后的布尔值
 */
export const parseBoolean = (value: unknown, fallback = false): boolean => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value !== 0 : fallback;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (TRUTHY_STRINGS.has(normalized)) {
      return true;
    }
    if (FALSY_STRINGS.has(normalized)) {
      return false;
    }
  }

  return fallback;
};
