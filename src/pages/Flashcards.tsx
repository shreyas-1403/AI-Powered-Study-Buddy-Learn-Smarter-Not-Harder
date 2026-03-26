import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, ArrowLeft, RotateCcw, ChevronLeft, ChevronRight, Check, X } from "lucide-react";

const Flashcards = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const noteId = searchParams.get("noteId");

  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loadingCards, setLoadingCards] = useState(true);
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });

  useEffect(() => {
    if (user) fetchFlashcards();
  }, [user, noteId]);

  const fetchFlashcards = async () => {
    let query = supabase.from("flashcards").select("id, question, answer, difficulty, note_id") as any;
    if (noteId) query = query.eq("note_id", noteId);
    const { data } = await query;
    if (data) setFlashcards(data);
    setLoadingCards(false);
  };

  if (loading || loadingCards) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  const current = flashcards[currentIndex];
  const total = flashcards.length;

  const handleAnswer = (correct: boolean) => {
    setScore((s) => ({
      correct: s.correct + (correct ? 1 : 0),
      incorrect: s.incorrect + (correct ? 0 : 1),
    }));
    setFlipped(false);
    if (currentIndex < total - 1) {
      setCurrentIndex((i) => i + 1);
    }
  };

  const restart = () => {
    setCurrentIndex(0);
    setFlipped(false);
    setScore({ correct: 0, incorrect: 0 });
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
            <span className="text-xl font-bold">AI Flashcards</span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {flashcards.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">No flashcards yet</h3>
              <p className="text-muted-foreground mb-4">Upload notes first to generate AI flashcards</p>
              <Button onClick={() => navigate("/upload")}>Upload Notes</Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Progress */}
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm text-muted-foreground">
                Card {currentIndex + 1} of {total}
              </span>
              <div className="flex items-center space-x-4">
                <Badge variant="outline" className="text-learning-green border-learning-green">
                  <Check className="h-3 w-3 mr-1" /> {score.correct}
                </Badge>
                <Badge variant="outline" className="text-destructive border-destructive">
                  <X className="h-3 w-3 mr-1" /> {score.incorrect}
                </Badge>
              </div>
            </div>

            {/* Flashcard */}
            <Card
              className="cursor-pointer min-h-[300px] flex items-center justify-center hover:shadow-lg transition-all"
              onClick={() => setFlipped(!flipped)}
            >
              <CardContent className="text-center p-8 w-full">
                {current?.difficulty && (
                  <Badge className="mb-4" variant={current.difficulty === "hard" ? "destructive" : current.difficulty === "easy" ? "secondary" : "default"}>
                    {current.difficulty}
                  </Badge>
                )}
                <p className="text-xs text-muted-foreground mb-2">{flipped ? "ANSWER" : "QUESTION"}</p>
                <p className="text-xl font-medium">{flipped ? current?.answer : current?.question}</p>
                {!flipped && <p className="text-sm text-muted-foreground mt-4">Click to reveal answer</p>}
              </CardContent>
            </Card>

            {/* Controls */}
            <div className="flex items-center justify-between mt-6">
              <Button variant="outline" onClick={() => { setCurrentIndex(Math.max(0, currentIndex - 1)); setFlipped(false); }} disabled={currentIndex === 0}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>

              {flipped && (
                <div className="flex space-x-2">
                  <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10" onClick={() => handleAnswer(false)}>
                    <X className="h-4 w-4 mr-1" /> Got it wrong
                  </Button>
                  <Button className="bg-learning-green hover:bg-learning-green/90 text-white" onClick={() => handleAnswer(true)}>
                    <Check className="h-4 w-4 mr-1" /> Got it right
                  </Button>
                </div>
              )}

              <Button variant="outline" onClick={() => { setCurrentIndex(Math.min(total - 1, currentIndex + 1)); setFlipped(false); }} disabled={currentIndex === total - 1}>
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            {/* Finished */}
            {currentIndex === total - 1 && (score.correct + score.incorrect) === total && (
              <Card className="mt-6">
                <CardContent className="text-center py-8">
                  <h3 className="text-2xl font-bold mb-2">Session Complete! 🎉</h3>
                  <p className="text-muted-foreground mb-4">
                    You got {score.correct} out of {total} correct ({Math.round((score.correct / total) * 100)}%)
                  </p>
                  <Button onClick={restart}><RotateCcw className="h-4 w-4 mr-2" /> Study Again</Button>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Flashcards;
