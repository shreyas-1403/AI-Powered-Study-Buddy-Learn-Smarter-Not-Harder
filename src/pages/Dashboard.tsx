import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, BookOpen, Target, Upload, Plus, LogOut, Zap, TrendingUp, FileQuestion } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [notes, setNotes] = useState<any[]>([]);
  const [progress, setProgress] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [notesRes, progressRes] = await Promise.all([
        supabase.from("notes").select("id, title, content, created_at").order("created_at", { ascending: false }) as any,
        supabase.from("progress").select("score, accuracy").eq("user_id", user!.id).limit(1).single() as any,
      ]);
      if (notesRes.data) setNotes(notesRes.data);
      if (progressRes.data) setProgress(progressRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-learning-light-blue/20 to-learning-light-green/20">
      <header className="bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate("/dashboard")}>
            <Brain className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">StudyBuddy</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="secondary">Free Plan</Badge>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" /> Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome back!</h2>
          <p className="text-muted-foreground">Ready to continue your learning journey?</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-l-4 border-l-learning-blue">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Notes Uploaded</CardTitle>
              <BookOpen className="h-4 w-4 text-learning-blue" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{notes.length}</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-learning-green">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quiz Score</CardTitle>
              <Zap className="h-4 w-4 text-learning-green" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{progress?.score ?? 0}</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{progress?.accuracy ? `${Math.round(progress.accuracy * 100)}%` : "N/A"}</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/upload")}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="h-5 w-5 mr-2 text-learning-blue" /> Smart Upload
              </CardTitle>
              <CardDescription>Upload notes and let AI extract key concepts</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full"><Plus className="h-4 w-4 mr-2" /> Upload Notes</Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/flashcards")}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="h-5 w-5 mr-2 text-learning-green" /> AI Flashcards
              </CardTitle>
              <CardDescription>Study with AI-generated flashcards from your notes</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline"><BookOpen className="h-4 w-4 mr-2" /> Study Flashcards</Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/quiz")}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileQuestion className="h-5 w-5 mr-2 text-primary" /> Smart Quizzes
              </CardTitle>
              <CardDescription>Take adaptive quizzes generated from your materials</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="secondary"><Target className="h-4 w-4 mr-2" /> Start Quiz</Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Notes</CardTitle>
            <CardDescription>Your recently uploaded study materials</CardDescription>
          </CardHeader>
          <CardContent>
            {notes.length > 0 ? (
              <div className="space-y-4">
                {notes.slice(0, 5).map((note: any) => (
                  <div key={note.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{note.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(note.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline" onClick={() => navigate(`/flashcards?noteId=${note.id}`)}>
                        Flashcards
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => navigate(`/quiz?noteId=${note.id}`)}>
                        Quiz
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">No notes yet</h3>
                <p className="text-muted-foreground mb-4">Upload your first document to get started</p>
                <Button onClick={() => navigate("/upload")}>
                  <Upload className="h-4 w-4 mr-2" /> Upload Your First Notes
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
