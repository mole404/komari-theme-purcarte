import "./Loading.css";

type LoadingProps = {
  text?: string;
  children?: React.ReactNode;
  size?: number;
  className?: string;
};

const Loading = ({ text, children, size = 44, className }: LoadingProps) => {
  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center ${
        className || ""
      }`}>
      <div className="loader" style={{ width: size, height: size }}>
        <svg className="circular" viewBox="25 25 50 50">
          <circle
            className="path"
            cx="50"
            cy="50"
            r="20"
            fill="none"
            strokeWidth="3"
            strokeMiterlimit="10"
          />
        </svg>
      </div>
      {text && <p className="mt-3 text-sm text-muted-foreground">{text}</p>}
      <div>{children}</div>
    </div>
  );
};

export default Loading;
