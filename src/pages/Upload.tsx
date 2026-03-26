import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Brain, Upload as UploadIcon, ArrowLeft, FileText, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Upload = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);

    if (f.type === "text/plain" || f.name.endsWith(".md") || f.name.endsWith(".txt")) {
      const text = await f.text();
      setContent(text);
      if (!title) setTitle(f.name.replace(/\.[^/.]+$/, ""));
    } else {
      if (!title) setTitle(f.name.replace(/\.[^/.]+$/, ""));
      toast({ title: "File selected", description: "For best results with PDFs, paste the text content below." });
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      toast({ variant: "destructive", title: "Missing fields", description: "Please provide a title and content." });
      return;
    }

    setUploading(true);
    try {
      // Save note
      const { data: note, error } = await (supabase.from("notes").insert({
        user_id: user.id,
        title: title.trim(),
        content: content.trim(),
      } as any).select().single() as any);

      if (error) throw error;

      // Upload file to storage if provided
      if (file) {
        await supabase.storage.from("note-uploads").upload(
          `${user.id}/${note.id}/${file.name}`,
          file
        );
      }

      toast({ title: "Notes uploaded!", description: "Now generate flashcards or quizzes from your notes." });
      
      // Ask to generate
      setUploading(false);
      setGenerating(true);

      // Generate flashcards
      const { data: fcData, error: fcError } = await supabase.functions.invoke("generate-study-materials", {
        body: { content: content.trim(), type: "flashcards", noteId: note.id },
      });

      if (fcError) throw fcError;

      if (fcData?.result?.flashcards) {
        const flashcardInserts = fcData.result.flashcards.map((fc: any) => ({
          note_id: note.id,
          question: fc.question,
          answer: fc.answer,
          difficulty: fc.difficulty,
        }));
        await (supabase.from("flashcards").insert(flashcardInserts) as any);
      }

      // Generate quiz
      const { data: qzData, error: qzError } = await supabase.functions.invoke("generate-study-materials", {
        body: { content: content.trim(), type: "quiz", noteId: note.id },
      });

      if (qzError) throw qzError;

      if (qzData?.result?.questions) {
        const quizInserts = qzData.result.questions.map((q: any) => ({
          note_id: note.id,
          question: q.question,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d,
          correct_answer: q.correct_answer,
        }));
        await (supabase.from("quizzes").insert(quizInserts) as any);
      }

      toast({ title: "Study materials generated!", description: "Flashcards and quizzes are ready." });
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to process notes." });
    } finally {
      setUploading(false);
      setGenerating(false);
    }
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
            <span className="text-xl font-bold">Smart Upload</span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-primary" /> Upload Study Materials
            </CardTitle>
            <CardDescription>
              Paste or upload your notes and AI will generate flashcards & quizzes automatically
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input placeholder="e.g. Biology Chapter 5" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Upload a file (optional)</label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors">
                <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <label className="cursor-pointer text-sm text-muted-foreground">
                  <span className="text-primary font-medium">Click to upload</span> or drag and drop
                  <input type="file" className="hidden" accept=".txt,.md,.pdf" onChange={handleFileUpload} />
                </label>
                {file && <p className="mt-2 text-sm font-medium text-foreground">{file.name}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notes Content</label>
              <Textarea
                placeholder="Paste your notes, textbook excerpts, or study material here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[200px]"
              />
            </div>

            <Button className="w-full" size="lg" onClick={handleSubmit} disabled={uploading || generating}>
              {uploading ? (
                <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2" /> Saving...</>
              ) : generating ? (
                <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2" /> Generating AI Materials...</>
              ) : (
                <><UploadIcon className="h-4 w-4 mr-2" /> Upload & Generate</>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Upload;
