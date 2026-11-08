import { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import "./index.css";

const Landing = lazy(() => import("./pages/Landing"));
const Chat = lazy(() => import("./pages/Chat"));
const Quiz = lazy(() => import("./pages/Quiz"));
const Tools = lazy(() => import("./pages/Tools"));
const FlashCards = lazy(() => import("./pages/FlashCards"));
const ExamLabs = lazy(() => import("./pages/examlab"));
const NotFound = lazy(() => import("./pages/404"));
const PlannerPage = lazy(() => import("./pages/Planner"));
const Debate = lazy(() => import("./pages/Debate"));

ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Suspense
      fallback={
        <div className="min-h-screen bg-black text-stone-300 flex items-center justify-center">
          Loading page...
        </div>
      }
    >
      <Routes>
        <Route path="/" element={<App />}>
          <Route path="*" element={<NotFound />} />
          <Route index element={<Landing />} />
          <Route path="chat" element={<Chat />} />
          <Route path="quiz" element={<Quiz />} />
          <Route path="tools" element={<Tools />} />
          <Route path="planner" element={<PlannerPage />} />
          <Route path="debate" element={<Debate />} />
          <Route path="cards" element={<FlashCards />} />
          <Route path="exam" element={<ExamLabs />} />
        </Route>
      </Routes>
    </Suspense>
  </BrowserRouter>
);
