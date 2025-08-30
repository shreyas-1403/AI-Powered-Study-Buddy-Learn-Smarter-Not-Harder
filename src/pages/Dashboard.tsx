import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  Brain, 
  BookOpen, 
  Target, 
  Crown,
  Plus,
  LogOut,
  Zap,
  TrendingUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  subscription_tier: string;
  credits_remaining: number;
  uploads_this_month: number;
}

interface UserProgress {
  study_streak: number;
  total_flashcards_reviewed: number;
  total_correct_answers: number;
  xp_points: number;
}

interface StudyMaterial {
  id: string;
  title: string;
  created_at: string;
  flashcards?: { count: number }[];
}

const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [studyMaterials, setStudyMaterials] = useState<StudyMaterial[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      // Fetch user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_tier, credits_remaining, uploads_this_month")
        .eq("user_id", user?.id)
        .single();

      if (profile) {
        setUserProfile(profile);
      }

      // Fetch user progress
      const { data: progress } = await supabase
        .from("user_progress")
        .select("study_streak, total_flashcards_reviewed, total_correct_answers, xp_points")
        .eq("user_id", user?.id)
        .single();

      if (progress) {
        setUserProgress(progress);
      }

      // Fetch study materials with flashcard counts
      const { data: materials } = await supabase
        .from("study_materials")
        .select(`
          id,
          title,
          created_at,
          flashcards(count)
        `)
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (materials) {
        setStudyMaterials(materials);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast({
        variant: "destructive",
        title: "Error loading data",
        description: "Failed to load your dashboard data. Please try refreshing.",
      });
    } finally {
      setLoadingData(false);
    }
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const accuracyRate = userProgress?.total_flashcards_reviewed 
    ? Math.round((userProgress.total_correct_answers / userProgress.total_flashcards_reviewed) * 100)
    : 0;

  const creditsUsed = 20 - (userProfile?.credits_remaining || 0);
  const creditsProgress = (creditsUsed / 20) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-learning-light-blue/20 to-learning-light-green/20">
      {/* Header */}
      <header className="bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">StudyBuddy</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant={userProfile?.subscription_tier === 'premium' ? 'default' : 'secondary'}>
              {userProfile?.subscription_tier === 'premium' ? (
                <><Crown className="h-3 w-3 mr-1" /> Premium</>
              ) : (
                'Free Plan'
              )}
            </Badge>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome back!</h2>
          <p className="text-muted-foreground">Ready to continue your learning journey?</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-learning-blue">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Study Streak</CardTitle>
              <Target className="h-4 w-4 text-learning-blue" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userProgress?.study_streak || 0} days</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-learning-green">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">XP Points</CardTitle>
              <Zap className="h-4 w-4 text-learning-green" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userProgress?.xp_points || 0} XP</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accuracy Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{accuracyRate}%</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-secondary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reviewed</CardTitle>
              <BookOpen className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userProgress?.total_flashcards_reviewed || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Credits Usage */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Monthly Credits</CardTitle>
            <CardDescription>
              {userProfile?.subscription_tier === 'free' 
                ? `You have ${userProfile?.credits_remaining || 0} flashcard credits remaining this month`
                : 'Unlimited credits with Premium plan'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {userProfile?.subscription_tier === 'free' && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Credits Used</span>
                  <span>{creditsUsed}/20</span>
                </div>
                <Progress value={creditsProgress} className="h-2" />
                {(userProfile?.credits_remaining || 0) < 5 && (
                  <p className="text-sm text-destructive">
                    Running low on credits! Consider upgrading to Premium for unlimited access.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="h-5 w-5 mr-2 text-learning-blue" />
                Upload Materials
              </CardTitle>
              <CardDescription>
                Upload your notes, textbooks, or PDFs to generate flashcards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Start Upload
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="h-5 w-5 mr-2 text-learning-green" />
                Review Flashcards
              </CardTitle>
              <CardDescription>
                Study with your AI-generated flashcards and track progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                <BookOpen className="h-4 w-4 mr-2" />
                Start Reviewing
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Crown className="h-5 w-5 mr-2 text-primary" />
                Upgrade Plan
              </CardTitle>
              <CardDescription>
                Unlock unlimited credits and advanced AI features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="secondary">
                <Crown className="h-4 w-4 mr-2" />
                Go Premium
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Study Materials */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Study Materials</CardTitle>
            <CardDescription>
              Your recently uploaded materials and generated flashcards
            </CardDescription>
          </CardHeader>
          <CardContent>
            {studyMaterials.length > 0 ? (
              <div className="space-y-4">
                {studyMaterials.slice(0, 5).map((material) => (
                  <div key={material.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{material.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        Created {new Date(material.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">
                        {material.flashcards?.[0]?.count || 0} cards
                      </Badge>
                      <Button size="sm" variant="outline">
                        Study
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">No study materials yet</h3>
                <p className="text-muted-foreground mb-4">
                  Upload your first document to get started with AI-generated flashcards
                </p>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Your First Material
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