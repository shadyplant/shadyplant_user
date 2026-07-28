// components/FullPageLoader.tsx

type SpinnerLoader = {
  className?: string;
  spinnerClassName?: string;
  offset?: number;
};

export default function SpinnerLoader({
  className = "",
  spinnerClassName = "",
  offset = 0,
}: SpinnerLoader) {
  return (
    <div
      className={`flex items-center justify-center ${className}`}
      style={{ minHeight: `calc(100vh - ${offset}px)` }}
    >
      <div className="mx-auto flex max-w-3xl items-center justify-center p-10 backdrop-blur-[16px] md:p-16">
        <div
          className={`h-12 w-12 animate-spin rounded-full border-4 border-[#d9ead7] border-t-[#2f7d32] ${spinnerClassName}`}
          role="status"
          aria-label="Loading"
        />
      </div>
    </div>
  );
}
