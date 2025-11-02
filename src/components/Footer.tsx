import { Heart, MessageCircle, Calendar, BookOpen, Users, Phone, Mail, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border/30">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="font-heading font-semibold text-xl text-foreground">
                WellnessSpace
              </span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Supporting student mental health with compassionate care, professional resources, and a judgment-free community.
            </p>
            <div className="flex space-x-2">
              <Button size="sm" variant="ghost" className="w-10 h-10 p-0">
                <MessageCircle className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost" className="w-10 h-10 p-0">
                <Users className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-heading font-semibold text-foreground mb-4">Support Services</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">AI Chat Support</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Professional Counseling</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Peer Community</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Crisis Support</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-heading font-semibold text-foreground mb-4">Resources</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Mental Health Basics</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Coping Strategies</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Study Wellness</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Sleep & Wellness</a></li>
            </ul>
          </div>

          {/* Emergency */}
          <div>
            <h3 className="font-heading font-semibold text-foreground mb-4">Crisis Support</h3>
            <div className="space-y-3">
              <div className="p-3 bg-accent/10 rounded-lg border border-accent/20">
                <p className="text-sm font-medium text-foreground mb-1">National Suicide Prevention Lifeline</p>
                <p className="text-lg font-bold text-primary">988</p>
              </div>
              <div className="p-3 bg-accent/10 rounded-lg border border-accent/20">
                <p className="text-sm font-medium text-foreground mb-1">Crisis Text Line</p>
                <p className="text-lg font-bold text-primary">Text HOME to 741741</p>
              </div>
            </div>
          </div>
        </div>

        <hr className="border-border/30 my-8" />

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6">
            <p className="text-sm text-muted-foreground">
              © 2024 WellnessSpace. All rights reserved.
            </p>
            <div className="flex space-x-4 text-sm">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Terms of Service</a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Accessibility</a>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Shield className="w-4 h-4" />
            <span>HIPAA Compliant & Secure</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;