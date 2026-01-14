export default function Loading() {
  return (
    <div className="min-h-screen bg-solid-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid-gray-300 border-t-blue-1000 mb-4"></div>
        <p className="text-solid-gray-600">読み込み中...</p>
      </div>
    </div>
  );
}
