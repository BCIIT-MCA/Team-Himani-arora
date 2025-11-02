import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Menu,
  X,
  Heart,
  MessageCircle,
  Calendar,
  BookOpen,
  Users,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";
import { NotificationBell } from "@/components/notifications/NotificationBell";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center breathing">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading font-semibold text-xl text-foreground">
              WellnessSpace
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/chat"
              className="text-muted-foreground hover:text-primary transition-colors flex items-center space-x-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>AI Support</span>
            </Link>
            <Link
              to="/assessment"
              className="text-muted-foreground hover:text-primary transition-colors flex items-center space-x-2"
            >
              <BookOpen className="w-4 h-4" />
              <span>Assessment</span>
            </Link>
            <Link
              to="/counseling"
              className="text-muted-foreground hover:text-primary transition-colors flex items-center space-x-2"
            >
              <Calendar className="w-4 h-4" />
              <span>Counseling</span>
            </Link>
            <Link
              to="/resources"
              className="text-muted-foreground hover:text-primary transition-colors flex items-center space-x-2"
            >
              <BookOpen className="w-4 h-4" />
              <span>Resources</span>
            </Link>
            <Link
              to="/community"
              className="text-muted-foreground hover:text-primary transition-colors flex items-center space-x-2"
            >
              <Users className="w-4 h-4" />
              <span>Community</span>
            </Link>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <NotificationBell />
                <span className="text-sm text-muted-foreground">
                  Welcome back!
                </span>
                <Button
                  variant="ghost"
                  onClick={handleSignOut}
                  className="text-muted-foreground hover:text-primary"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link to="/auth">
                  <Button
                    variant="ghost"
                    className="text-muted-foreground hover:text-primary"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button
                    variant="default"
                    className="bg-gradient-hero hover:opacity-90 shadow-soft"
                  >
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 space-y-2 animate-fade-in">
            <Link
              to="/chat"
              className="block px-3 py-2 text-muted-foreground hover:text-primary transition-colors"
            >
              AI Support
            </Link>
            <Link
              to="/assessment"
              className="block px-3 py-2 text-muted-foreground hover:text-primary transition-colors"
            >
              Assessment
            </Link>
            <Link
              to="/counseling"
              className="block px-3 py-2 text-muted-foreground hover:text-primary transition-colors"
            >
              Counseling
            </Link>
            <Link
              to="/resources"
              className="block px-3 py-2 text-muted-foreground hover:text-primary transition-colors"
            >
              Resources
            </Link>
            <Link
              to="/community"
              className="block px-3 py-2 text-muted-foreground hover:text-primary transition-colors"
            >
              Community
            </Link>
            <hr className="border-border/50" />
            <div className="px-3 py-2 space-y-2">
              {user ? (
                <Button
                  variant="ghost"
                  onClick={handleSignOut}
                  className="w-full justify-start"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              ) : (
                <>
                  <Link to="/auth">
                    <Button variant="ghost" className="w-full justify-start">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/auth">
                    <Button
                      variant="default"
                      className="w-full bg-gradient-hero hover:opacity-90"
                    >
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
