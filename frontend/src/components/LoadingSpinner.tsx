export default function LoadingSpinner() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] p-8" role="status" aria-label="Loading">
      <div className="w-10 h-10 border-4 border-siet-primary/20 border-t-siet-primary rounded-full animate-spin mb-4" />
      <p className="text-sm font-medium text-siet-slate tracking-wide">Loading portal view...</p>
    </div>
  );
}
