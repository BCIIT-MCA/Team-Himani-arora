import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Heart } from "lucide-react";

const CTA = () => {
  return (
    <section className="py-20 bg-gradient-hero relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-20 h-20 bg-white rounded-full animate-float"></div>
        <div
          className="absolute bottom-10 right-10 w-16 h-16 bg-white rounded-full animate-float"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/4 w-12 h-12 bg-white rounded-full animate-float"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      <div className="container mx-auto px-4 relative">
        <div className="max-w-4xl mx-auto text-center text-white">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 breathing">
            <Heart className="w-8 h-8 text-white" />
          </div>

          <h2 className="font-heading text-4xl md:text-5xl font-bold mb-6">
            FREE Mental Health Support for Every Indian Student
          </h2>

          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
            No matter what you're facing - board exam stress, family pressure,
            career confusion - we're here with completely FREE support designed
            just for Indian students.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              size="lg"
              variant="secondary"
              className="bg-white text-primary hover:bg-white/90 shadow-soft px-8 py-4 text-lg font-medium"
            >
              Start FREE Support
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 px-8 py-4 text-lg"
            >
              Call KIRAN 1800-599-0019
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-white/80">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>HIPAA Compliant</span>
            </div>
            <div className="w-1 h-1 bg-white/50 rounded-full hidden sm:block"></div>
            <div className="flex items-center space-x-2">
              <Heart className="w-5 h-5" />
              <span>Student Focused</span>
            </div>
            <div className="w-1 h-1 bg-white/50 rounded-full hidden sm:block"></div>
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>Anonymous Available</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
