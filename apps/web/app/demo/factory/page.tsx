import { generateQuizData } from "@/lib/demo/quiz-data";
import { FactoryTourClient } from "./client";

// 工場見学用に1つの自治体データを準備
export default function FactoryPage() {
  const questions = generateQuizData();
  // 高岡市を優先的に使用（最も充実したデータを持つ）
  const sampleQuestions = questions.filter(
    (q) => q.municipalityId === "takaoka"
  );
  const fallbackQuestions =
    sampleQuestions.length > 0 ? sampleQuestions : questions.slice(0, 5);

  // 使用する自治体情報
  const municipality = fallbackQuestions[0]
    ? {
        id: fallbackQuestions[0].municipalityId,
        name: fallbackQuestions[0].municipalityName,
        prefecture: fallbackQuestions[0].prefecture,
        officialUrl: fallbackQuestions[0].officialUrl,
      }
    : {
        id: "takaoka",
        name: "高岡市",
        prefecture: "富山県",
        officialUrl: "https://www.city.takaoka.toyama.jp/",
      };

  // サンプル変数（工場見学の「AI収集」ステップで使用）
  const sampleVariables = fallbackQuestions.map((q) => ({
    key: q.variableKey,
    question: q.question,
    answer: q.answer,
    category: q.category,
  }));

  return (
    <FactoryTourClient
      municipality={municipality}
      sampleVariables={sampleVariables}
    />
  );
}
