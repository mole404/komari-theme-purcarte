import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

/**
 * 最外层错误边界：任何渲染期异常都会兜住，避免整站白屏。
 * 这里刻意使用内联样式（不依赖 Tailwind / Radix 主题变量），
 * 即使出错原因是主题或样式本身，也能正常展示提示。
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, message: "" };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : String(error),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error("Unhandled UI error:", error, errorInfo);
    }
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          fontFamily: "system-ui, -apple-system, sans-serif",
          color: "#1f2937",
          background: "#f3f4f6",
        }}>
        <div
          style={{
            maxWidth: "32rem",
            width: "100%",
            background: "#ffffff",
            borderRadius: "0.75rem",
            padding: "1.5rem",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
          }}>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.75rem" }}>
            页面出现异常
          </h1>
          <p style={{ fontSize: "0.875rem", marginBottom: "0.5rem" }}>
            页面渲染时发生错误，无法继续显示。可以尝试重新加载页面。
          </p>
          {this.state.message && (
            <pre
              style={{
                fontSize: "0.75rem",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: "0.5rem",
                padding: "0.5rem",
                marginBottom: "1rem",
                maxHeight: "10rem",
                overflow: "auto",
              }}>
              {this.state.message}
            </pre>
          )}
          <button
            type="button"
            onClick={this.handleReload}
            style={{
              cursor: "pointer",
              borderRadius: "0.5rem",
              border: "none",
              padding: "0.5rem 1rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "#ffffff",
              background: "#6d28d9",
            }}>
            重新加载
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
