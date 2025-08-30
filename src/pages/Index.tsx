import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, BookOpen, Lightbulb, Target, Users, Zap } from "lucide-react";

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-learning-light-blue/30 to-learning-light-green/30">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <Brain className="h-16 w-16 text-primary" />
            <h1 className="text-6xl font-bold bg-gradient-to-r from-learning-blue to-learning-green bg-clip-text text-transparent">
              StudyBuddy
            </h1>
          </div>
          
          <h2 className="text-4xl font-bold text-foreground mb-6">
            Learn Smarter, Not Harder
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Transform your notes into AI-powered flashcards, quizzes, and smart summaries. 
            Upload any document and let our AI create personalized study materials just for you.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8 py-6" asChild>
              <a href="/auth">Start Learning for Free</a>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h3 className="text-3xl font-bold mb-4">Everything you need to ace your studies</h3>
          <p className="text-xl text-muted-foreground">
            Powerful AI tools designed to make studying more effective and enjoyable
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <BookOpen className="h-10 w-10 text-learning-blue mb-2" />
              <CardTitle>Smart Upload</CardTitle>
              <CardDescription>
                Upload PDFs, images, or text files and watch AI extract key concepts automatically
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Lightbulb className="h-10 w-10 text-learning-green mb-2" />
              <CardTitle>AI Flashcards</CardTitle>
              <CardDescription>
                Generate personalized flashcards from your content with intelligent difficulty levels
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Brain className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Smart Quizzes</CardTitle>
              <CardDescription>
                Take adaptive quizzes that adjust to your learning pace and knowledge gaps
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Target className="h-10 w-10 text-learning-blue mb-2" />
              <CardTitle>Progress Tracking</CardTitle>
              <CardDescription>
                Monitor your learning streaks, accuracy rates, and improvement over time
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Zap className="h-10 w-10 text-learning-green mb-2" />
              <CardTitle>XP & Rewards</CardTitle>
              <CardDescription>
                Earn points, unlock achievements, and compete with friends on leaderboards
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Users className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Study Groups</CardTitle>
              <CardDescription>
                Share flashcards with classmates and study together (coming soon)
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h3 className="text-3xl font-bold mb-4">Simple, transparent pricing</h3>
          <p className="text-xl text-muted-foreground">
            Start free and upgrade when you need more power
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="relative">
            <CardHeader>
              <CardTitle className="text-2xl">Free Plan</CardTitle>
              <CardDescription>Perfect for getting started</CardDescription>
              <div className="text-3xl font-bold">$0<span className="text-base font-normal">/month</span></div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                <li className="flex items-center">✓ 2 uploads per month</li>
                <li className="flex items-center">✓ 20 AI flashcards</li>
                <li className="flex items-center">✓ Basic progress tracking</li>
                <li className="flex items-center">✓ Web access</li>
              </ul>
              <Button className="w-full" variant="outline" asChild>
                <a href="/auth">Get Started Free</a>
              </Button>
            </CardContent>
          </Card>

          <Card className="relative border-primary border-2">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                Most Popular
              </span>
            </div>
            <CardHeader>
              <CardTitle className="text-2xl">Premium Plan</CardTitle>
              <CardDescription>For serious students</CardDescription>
              <div className="text-3xl font-bold">$9<span className="text-base font-normal">/month</span></div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                <li className="flex items-center">✓ Unlimited uploads</li>
                <li className="flex items-center">✓ Unlimited AI flashcards</li>
                <li className="flex items-center">✓ Advanced AI features</li>
                <li className="flex items-center">✓ Export to PDF</li>
                <li className="flex items-center">✓ Priority support</li>
              </ul>
              <Button className="w-full" asChild>
                <a href="/auth">Upgrade to Premium</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-card py-20">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-4">Ready to transform your studying?</h3>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of students who are already learning smarter with AI-powered study tools
          </p>
          <Button size="lg" className="text-lg px-8 py-6" asChild>
            <a href="/auth">Start Your Free Trial</a>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
