// components/SpinnerLoader.tsx

type CompactSpinnerLoaderProps = {
  size?: number | string;
  color?: string;
  trackColor?: string;
  containerWidth?: "full" | number | string;
  containerHeight?: "auto" | number | string;
  className?: string;
  spinnerClassName?: string;
};

export default function CompactSpinnerLoader({
  size = 48,
  color = "#2f7d32",
  trackColor = "#d9ead7",
  containerWidth = "full",
  containerHeight = "auto",
  className = "",
  spinnerClassName = "",
}: CompactSpinnerLoaderProps) {
  const width =
    containerWidth === "full"
      ? "100%"
      : typeof containerWidth === "number"
        ? `${containerWidth}px`
        : containerWidth;

  const height =
    containerHeight === "auto"
      ? "auto"
      : typeof containerHeight === "number"
        ? `${containerHeight}px`
        : containerHeight;

  const spinnerSize = typeof size === "number" ? `${size}px` : size;

  return (
    <div
      className={`flex items-center justify-center ${className}`}
      style={{
        width,
        height,
      }}
    >
      <div
        role="status"
        aria-label="Loading"
        className={`animate-spin rounded-full border-4 ${spinnerClassName}`}
        style={{
          width: spinnerSize,
          height: spinnerSize,
          borderColor: trackColor,
          borderTopColor: color,
        }}
      />
    </div>
  );
}
