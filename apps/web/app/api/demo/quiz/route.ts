import { NextResponse } from "next/server";
import { generateQuizData, getSlotData } from "@/lib/demo/quiz-data";

export async function GET() {
  const questions = generateQuizData();
  const slotData = getSlotData(questions);

  return NextResponse.json({
    questions,
    slotData,
    totalCount: questions.length,
  });
}
