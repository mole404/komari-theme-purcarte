import { useEffect, useMemo } from "react";
import "./BootScreen.css";

type BootTheme = "light" | "dark";

/**
 * 配置还没回来时，唯一可用的外观信号是用户自己的本地选择或系统偏好：
 * 先读 localStorage 里显式选择过的亮/暗，没有就跟随系统。
 * 配置一到就由 Radix Theme 接管，这一屏只在加载期存在。
 */
const resolveBootTheme = (): BootTheme => {
  if (typeof window === "undefined") return "light";
  try {
    const raw = window.localStorage.getItem("appearance");
    const stored = raw ? JSON.parse(raw) : null;
    if (stored === "dark" || stored === "light") return stored;
  } catch {
    // localStorage 不可用（隐私模式等）时继续看系统偏好
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

/**
 * 加载配置期间的全屏加载页。
 * index.html 里那层静态首屏壳（#boot-shell）在 JS 执行前负责不白屏，
 * 这里挂载后把它摘掉，避免两层叠在一起。
 */
export default function BootScreen({
  text = "正在加载配置",
}: {
  text?: string;
}) {
  const theme = useMemo(resolveBootTheme, []);

  useEffect(() => {
    document.getElementById("boot-shell")?.remove();
    delete document.documentElement.dataset.bootTheme;
  }, []);

  return (
    <div
      className="boot-screen"
      data-theme={theme}
      role="status"
      aria-live="polite">
      <div className="boot-aura boot-aura-1" />
      <div className="boot-aura boot-aura-2" />
      <div className="boot-inner">
        <div className="boot-ring" />
        <p className="boot-title">Loading</p>
        <p className="boot-sub">{text}</p>
      </div>
    </div>
  );
}
