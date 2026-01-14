import Link from 'next/link';

const SAMPLE_MUNICIPALITIES = [
  { id: 'utashinai', name: '歌志内市', prefecture: '北海道' },
  { id: 'sample', name: 'サンプル市', prefecture: '東京都' },
];

export default function MunicipalitiesPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        自治体一覧
      </h1>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SAMPLE_MUNICIPALITIES.map((municipality) => (
          <Link
            key={municipality.id}
            href={`/municipalities/${municipality.id}`}
            className="block p-6 border border-gray-300 rounded-lg hover:shadow-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {municipality.name}
            </h2>
            <p className="text-sm text-gray-600">{municipality.prefecture}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> これはデモページです。実際の自治体データを表示するには、
          Transformerでデータを変換してJSONファイルとして保存する必要があります。
        </p>
      </div>
    </main>
  );
}
