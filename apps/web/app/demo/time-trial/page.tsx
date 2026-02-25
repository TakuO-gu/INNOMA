import { generateQuizData, getSlotData } from "@/lib/demo/quiz-data";
import { TimeTrialClient } from "./client";

export default function TimeTrialPage() {
  const questions = generateQuizData();
  const slotData = getSlotData(questions);

  return (
    <TimeTrialClient
      questions={questions}
      slotData={slotData}
    />
  );
}
