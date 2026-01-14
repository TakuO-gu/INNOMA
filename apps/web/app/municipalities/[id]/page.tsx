import { MunicipalDataView } from '@innoma/ui-mapper';
import type { MunicipalStructuredData } from '@innoma/transformer';
import { notFound } from 'next/navigation';

// サンプルデータ（実際は外部JSONファイルまたはAPIから取得）
function getSampleMunicipalData(id: string): MunicipalStructuredData | null {
  if (id === 'sample') {
    return {
      metadata: {
        sourceUrl: 'https://www.example-city.jp/',
        extractedAt: new Date().toISOString(),
        municipality: 'サンプル市',
        prefecture: '東京都',
        confidence: 0.9,
        llmModel: 'gpt-4o',
        processingTimeMs: 5432,
      },
      news: [
        {
          title: '市役所年末年始の休業について',
          date: '2024-12-15',
          category: 'お知らせ',
          importance: 'medium' as const,
          content: '年末年始は12月29日から1月3日まで休業いたします。',
          url: 'https://www.example-city.jp/news/001',
        },
        {
          title: '【重要】マイナンバーカード申請受付中',
          date: '2024-12-10',
          category: '重要',
          importance: 'high' as const,
          content: 'マイナンバーカードの申請を受け付けています。',
          url: 'https://www.example-city.jp/news/002',
        },
      ],
      events: [
        {
          title: '市民祭り2025',
          startDate: '2025-08-15',
          endDate: '2025-08-16',
          location: '市民会館',
          description: '毎年恒例の市民祭りを開催します。',
          contact: '市民課 TEL: 0123-45-6789',
          url: 'https://www.example-city.jp/events/001',
        },
      ],
      procedures: [
        {
          title: '住民票の写しの交付',
          category: '戸籍・住民票',
          description: '住民票の写しを交付します。',
          requiredDocuments: ['本人確認書類', '印鑑'],
          targetAudience: '市民全員',
          window: '市民課窓口',
          fee: '300円',
          onlineAvailable: true,
          url: 'https://www.example-city.jp/procedures/001',
        },
      ],
      facilities: [
        {
          name: '市立図書館',
          category: '図書館',
          address: '東京都サンプル市中央1-1-1',
          phone: '0123-45-6789',
          openingHours: '9:00-17:00',
          closedDays: '月曜日、祝日',
          barrierFree: true,
          url: 'https://www.example-city.jp/facilities/library',
        },
      ],
      contacts: [
        {
          department: '市民課',
          phone: '0123-45-6789',
          fax: '0123-45-9876',
          email: 'shimin@example-city.jp',
          hours: '平日 8:30-17:15',
          address: '東京都サンプル市中央1-1-1',
        },
      ],
      emergencyInfo: [],
    };
  }

  return null;
}

export default async function MunicipalityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = getSampleMunicipalData(id);

  if (!data) {
    notFound();
  }

  return (
    <main>
      <MunicipalDataView data={data} />
    </main>
  );
}

export function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  return params.then(({ id }) => {
    const data = getSampleMunicipalData(id);
    if (!data) {
      return { title: 'Not Found' };
    }
    return {
      title: `${data.metadata.municipality} - INNOMA`,
      description: `${data.metadata.municipality}（${data.metadata.prefecture}）の行政情報を確認できます。`,
    };
  });
}
