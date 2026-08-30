import { questions, topics } from "../../content/questions";
import { FullInterview } from "./full-interview";

export const metadata = { title: "مقابلة كاملة" };

export default function FullInterviewPage() {
  return <FullInterview questions={questions} topics={topics} />;
}
