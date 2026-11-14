import { type ReactNode, useCallback, useMemo, useEffect } from "react";
import { useAppConfig } from "@/config/hooks";
import { useIsMobile } from "@/hooks/useMobile";
import { useTheme } from "@/hooks/useTheme";
import { parseBoolean } from "@/utils/parseBoolean";

const BACKGROUND_SIZES = ["cover", "contain", "fill"] as const;
const BACKGROUND_POSITIONS = [
  "center",
  "top",
  "bottom",
  "left",
  "right",
  "top left",
  "top right",
  "bottom left",
  "bottom right",
] as const;
const MOBILE_BACKGROUND_SIZES = ["inherit", ...BACKGROUND_SIZES] as const;
const MOBILE_BACKGROUND_POSITIONS = ["inherit", ...BACKGROUND_POSITIONS] as const;
const DEFAULT_ALIGNMENT_SIZE = "cover";
const DEFAULT_ALIGNMENT_POSITION = "center";

const pickOption = (
  value: unknown,
  allowed: readonly string[],
  fallback: string
) => {
  const raw = typeof value === "string" ? value.trim() : "";
  return allowed.includes(raw) ? raw : fallback;
};

export function DynamicContent({ children }: { children: ReactNode }) {
  const config = useAppConfig();
  const isMobile = useIsMobile();
  const { appearance } = useTheme();

  const getUrlFromConfig = useCallback(
    (urls: string) => {
      if (!urls) return "";
      const urlList = urls.split("|").map((u) => u.trim());
      if (urlList.length > 1) {
        return appearance === "dark" ? urlList[1] : urlList[0];
      }
      return urlList[0];
    },
    [appearance]
  );

  const imageUrl = useMemo(() => {
    if (!config) return "";
    const { backgroundImage, backgroundImageMobile } = config;
    return isMobile && backgroundImageMobile
      ? getUrlFromConfig(backgroundImageMobile)
      : getUrlFromConfig(backgroundImage);
  }, [config, isMobile, getUrlFromConfig]);

  const videoUrl = useMemo(() => {
    if (!config || !config.enableVideoBackground) return "";
    const { videoBackgroundUrl, videoBackgroundUrlMobile } = config;
    return isMobile && videoBackgroundUrlMobile
      ? getUrlFromConfig(videoBackgroundUrlMobile)
      : getUrlFromConfig(videoBackgroundUrl);
  }, [config, isMobile, getUrlFromConfig]);

  const dynamicStyles = useMemo(() => {
    if (!config) return "";
    const {
      mainWidth,
      blurValue,
      blurBackgroundColor,
      enableBlur,
      backgroundMaskDesktop,
      backgroundMaskMobile,
    } = config;
    const blurPx =
      Number.isFinite(Number(blurValue)) && Number(blurValue) >= 0
        ? Number(blurValue)
        : 10;
    const width = Math.min(100, Math.max(1, Number(mainWidth) || 85));
    const isBlurOff = !parseBoolean(enableBlur, true);
    const styles: string[] = [];

    styles.push(`--main-width: ${width}vw;`);
    styles.push(`--body-background-url: url(${imageUrl});`);
    styles.push(`--purcarte-blur: ${isBlurOff ? 0 : blurPx}px;`);

    // 背景遮罩：0-100 的整数，越靠近 100 背景越暗，同时覆盖图片与视频背景
    const maskRaw = isMobile ? backgroundMaskMobile : backgroundMaskDesktop;
    const mask = Math.min(100, Math.max(0, Number(maskRaw) || 0));
    styles.push(`--body-mask: rgba(0, 0, 0, ${mask / 100});`);

    const colors = blurBackgroundColor.split("|").map((color) => color.trim());
    const lightDefault = "rgba(255, 255, 255, 0.5)";
    const darkDefault = "rgba(0, 0, 0, 0.5)";
    styles.push(`--card-light: ${colors[0] || lightDefault};`);
    styles.push(
      `--card-dark: ${(colors.length >= 2 ? colors[1] : colors[0]) || darkDefault};`
    );

    return `:root { ${styles.join(" ")} }`;
  }, [config, imageUrl, isMobile]);

  useEffect(() => {
    const imageBackground = document.getElementById("image-background");
    const videoBackground = document.getElementById(
      "video-background"
    ) as HTMLVideoElement;

    const desktopSize = pickOption(
      config.backgroundSizeDesktop,
      BACKGROUND_SIZES,
      DEFAULT_ALIGNMENT_SIZE
    );
    const desktopPosition = pickOption(
      config.backgroundPositionDesktop,
      BACKGROUND_POSITIONS,
      DEFAULT_ALIGNMENT_POSITION
    );
    const mobileSize = pickOption(
      config.backgroundSizeMobile,
      MOBILE_BACKGROUND_SIZES,
      "inherit"
    );
    const mobilePosition = pickOption(
      config.backgroundPositionMobile,
      MOBILE_BACKGROUND_POSITIONS,
      "inherit"
    );

    // 移动端选了“跟随桌面端”就落回桌面值；其余情况两端各自独立
    const size = isMobile && mobileSize !== "inherit" ? mobileSize : desktopSize;
    const position =
      isMobile && mobilePosition !== "inherit" ? mobilePosition : desktopPosition;

    // background-size 不接受 fill（整条声明会被丢弃），图片侧换成等价写法；
    // object-fit 的三种取值都合法，视频侧直接使用
    const imageSize = size === "fill" ? "100% 100%" : size;

    if (imageBackground) {
      imageBackground.style.backgroundImage = `url(${imageUrl})`;
      imageBackground.style.backgroundSize = imageSize;
      imageBackground.style.backgroundPosition = position;
    }

    if (videoBackground) {
      if (config.enableVideoBackground && videoUrl) {
        videoBackground.src = videoUrl;
        videoBackground.style.objectFit = size;
        videoBackground.style.objectPosition = position;
        videoBackground.style.display = "block";
      } else {
        videoBackground.style.display = "none";
      }
    }
  }, [
    imageUrl,
    videoUrl,
    isMobile,
    config.backgroundSizeDesktop,
    config.backgroundPositionDesktop,
    config.backgroundSizeMobile,
    config.backgroundPositionMobile,
    config.enableVideoBackground,
  ]);

  return (
    <>
      <style>{dynamicStyles}</style>
      <div className="fade-in">{children}</div>
    </>
  );
}
