import { questions, topics } from "../../content/questions";
import { StudySession } from "./study-session";

export const metadata = { title: "جلسة مراجعة" };

export default function SessionPage() {
  return <StudySession questions={questions} topics={topics} />;
}
