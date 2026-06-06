import { Link } from "wouter";
import { GraduationCap } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-background">
      {/* Left Panel */}
      <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-24 py-12 border-b md:border-b-0 md:border-r border-border bg-sidebar/30">
        <div className="max-w-xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-primary rounded-xl text-primary-foreground shadow-sm">
              <GraduationCap className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Study Manager</h1>
          </div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground mb-6 leading-[1.1]">
            Your private productivity hub.
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed">
            A focused, beautifully organized notebook for your classes, topics, and study materials. Built for focus. Designed for you.
          </p>
          
          <div className="space-y-6">
            {[
              "Organize subjects, topics, and formulas effortlessly",
              "Keep track of exams and upcoming events",
              "Manage PDFs, videos, and quick notes in one place"
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7"></path></svg>
                </div>
                <span className="text-foreground font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-12 bg-background">
        <div className="w-full max-w-sm space-y-8 text-center">
          <div>
            <h3 className="text-2xl font-bold text-foreground mb-2">Welcome back</h3>
            <p className="text-muted-foreground">Sign in to access your study materials.</p>
          </div>
          
          <Link href="/sign-in" className="flex items-center justify-center w-full py-3 px-4 rounded-xl bg-primary text-primary-foreground font-medium shadow-sm hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            Sign in with Google
          </Link>
          
          <p className="text-sm text-muted-foreground">
            Don't have an account? <Link href="/sign-up" className="text-primary hover:underline font-medium">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}