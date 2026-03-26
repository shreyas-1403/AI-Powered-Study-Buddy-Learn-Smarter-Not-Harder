import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, ArrowLeft, RotateCcw, CheckCircle2, XCircle, FileQuestion } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Quiz = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const noteId = searchParams.get("noteId");

  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [loadingQuiz, setLoadingQuiz] = useState(true);

  useEffect(() => {
    if (user) fetchQuiz();
  }, [user, noteId]);

  const fetchQuiz = async () => {
    let query = supabase.from("quizzes").select("*") as any;
    if (noteId) query = query.eq("note_id", noteId);
    const { data } = await query;
    if (data) setQuestions(data);
    setLoadingQuiz(false);
  };

  if (loading || loadingQuiz) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  const current = questions[currentIndex];
  const total = questions.length;
  const options = current ? [
    { key: "A", text: current.option_a },
    { key: "B", text: current.option_b },
    { key: "C", text: current.option_c },
    { key: "D", text: current.option_d },
  ] : [];

  const handleSelect = (key: string) => {
    if (answered) return;
    setSelectedAnswer(key);
    setAnswered(true);
    if (key === current.correct_answer) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = async () => {
    if (currentIndex < total - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setAnswered(false);
    } else {
      setFinished(true);
      // Save progress
      const accuracy = total > 0 ? score / total : 0;
      await (supabase.from("progress").insert({
        user_id: user!.id,
        score,
        accuracy,
      } as any) as any);
    }
  };

  const restart = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setAnswered(false);
    setScore(0);
    setFinished(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-learning-light-blue/20 to-learning-light-green/20">
      <header className="bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <div className="flex items-center space-x-2">
            <Brain className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Smart Quiz</span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {questions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileQuestion className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">No quizzes yet</h3>
              <p className="text-muted-foreground mb-4">Upload notes first to generate AI quizzes</p>
              <Button onClick={() => navigate("/upload")}>Upload Notes</Button>
            </CardContent>
          </Card>
        ) : finished ? (
          <Card>
            <CardContent className="text-center py-12">
              <h3 className="text-3xl font-bold mb-2">Quiz Complete! 🎉</h3>
              <p className="text-xl text-muted-foreground mb-2">
                Score: {score}/{total}
              </p>
              <p className="text-lg mb-6">
                {Math.round((score / total) * 100)}% accuracy
              </p>
              <div className="flex justify-center space-x-4">
                <Button onClick={restart}><RotateCcw className="h-4 w-4 mr-2" /> Try Again</Button>
                <Button variant="outline" onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm text-muted-foreground">Question {currentIndex + 1} of {total}</span>
              <Badge variant="outline">Score: {score}</Badge>
            </div>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">{current?.question}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {options.map((opt) => {
                  const isSelected = selectedAnswer === opt.key;
                  const isCorrect = opt.key === current.correct_answer;
                  let variant = "outline" as const;
                  let extraClass = "hover:border-primary";

                  if (answered) {
                    if (isCorrect) extraClass = "border-learning-green bg-learning-green/10 text-foreground";
                    else if (isSelected && !isCorrect) extraClass = "border-destructive bg-destructive/10 text-foreground";
                    else extraClass = "opacity-50";
                  }

                  return (
                    <Button
                      key={opt.key}
                      variant={variant}
                      className={`w-full justify-start text-left h-auto py-3 px-4 ${extraClass}`}
                      onClick={() => handleSelect(opt.key)}
                      disabled={answered}
                    >
                      <span className="font-bold mr-3">{opt.key}.</span>
                      <span className="flex-1">{opt.text}</span>
                      {answered && isCorrect && <CheckCircle2 className="h-5 w-5 text-learning-green ml-2" />}
                      {answered && isSelected && !isCorrect && <XCircle className="h-5 w-5 text-destructive ml-2" />}
                    </Button>
                  );
                })}
              </CardContent>
            </Card>

            {answered && (
              <Button className="w-full" size="lg" onClick={handleNext}>
                {currentIndex < total - 1 ? "Next Question" : "Finish Quiz"}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Quiz;
