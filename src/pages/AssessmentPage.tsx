import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  validatePHQ9,
  validateGAD7,
  validateGHQ12,
  sanitizeTextInput,
  calculateAssessmentScore,
  type ValidationResult,
  type PHQ9Data,
  type GAD7Data,
  type GHQ12Data,
} from "@/lib/validation";
import { detectCrisisKeywords, type CrisisLevel } from "@/lib/crisisKeywords";
import { CrisisAlert } from "@/components/crisis-alert";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import {
  CheckCircle,
  Brain,
  Heart,
  Activity,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { Link } from "react-router-dom";

const AssessmentPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentAssessment, setCurrentAssessment] = useState("phq9");
  const [phq9Responses, setPHQ9Responses] = useState({});
  const [gad7Responses, setGAD7Responses] = useState({});
  const [ghq12Responses, setGHQ12Responses] = useState({});
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedAssessments, setCompletedAssessments] = useState(new Set());
  const [crisisAlert, setCrisisAlert] = useState<{
    level: CrisisLevel;
    triggers: string[];
  } | null>(null);

  // PHQ-9 Questions for Depression
  const phq9Questions = [
    "Little interest or pleasure in doing things",
    "Feeling down, depressed, or hopeless",
    "Trouble falling or staying asleep, or sleeping too much",
    "Feeling tired or having little energy",
    "Poor appetite or overeating",
    "Feeling bad about yourself — or that you are a failure or have let yourself or your family down",
    "Trouble concentrating on things, such as reading the newspaper or watching television",
    "Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual",
    "Thoughts that you would be better off dead or of hurting yourself in some way",
  ];

  // GAD-7 Questions for Anxiety
  const gad7Questions = [
    "Feeling nervous, anxious or on edge",
    "Not being able to stop or control worrying",
    "Worrying too much about different things",
    "Trouble relaxing",
    "Being so restless that it is hard to sit still",
    "Becoming easily annoyed or irritable",
    "Feeling afraid as if something awful might happen",
  ];

  // GHQ-12 Questions for General Health
  const ghq12Questions = [
    "Been able to concentrate on whatever you're doing",
    "Lost much sleep over worry",
    "Felt that you are playing a useful part in things",
    "Felt capable of making decisions about things",
    "Felt constantly under strain",
    "Felt you couldn't overcome your difficulties",
    "Been able to enjoy your normal day-to-day activities",
    "Been able to face up to your problems",
    "Been feeling unhappy and depressed",
    "Been losing confidence in yourself",
    "Been thinking of yourself as a worthless person",
    "Been feeling reasonably happy, all things considered",
  ];

  const responseOptions = [
    { value: "0", label: "Not at all" },
    { value: "1", label: "Several days" },
    { value: "2", label: "More than half the days" },
    { value: "3", label: "Nearly every day" },
  ];

  const getSeverityLevel = (score, assessmentType) => {
    switch (assessmentType) {
      case "phq9":
        if (score <= 4) return "Minimal";
        if (score <= 9) return "Mild";
        if (score <= 14) return "Moderate";
        if (score <= 19) return "Moderately Severe";
        return "Severe";
      case "gad7":
        if (score <= 4) return "Minimal";
        if (score <= 9) return "Mild";
        if (score <= 14) return "Moderate";
        return "Severe";
      case "ghq12":
        if (score <= 3) return "Normal";
        if (score <= 6) return "Mild";
        if (score <= 9) return "Moderate";
        return "Severe";
      default:
        return "Unknown";
    }
  };

  const getRecommendations = (score, assessmentType, severityLevel) => {
    const baseRecommendations = {
      phq9: {
        Minimal:
          "Your responses suggest minimal depression symptoms. Continue practicing self-care and maintain healthy habits.",
        Mild: "You may be experiencing mild depression symptoms. Consider lifestyle changes, regular exercise, and speaking with a counselor.",
        Moderate:
          "Your responses indicate moderate depression. We recommend speaking with a mental health professional and considering counseling.",
        "Moderately Severe":
          "You appear to be experiencing moderately severe depression. Please consider immediate professional help and counseling.",
        Severe:
          "Your responses suggest severe depression. Please seek immediate professional help and consider both counseling and medical evaluation.",
      },
      gad7: {
        Minimal:
          "Your anxiety levels appear to be within normal range. Continue stress management practices.",
        Mild: "You may have mild anxiety. Consider relaxation techniques, mindfulness, and regular exercise.",
        Moderate:
          "Your responses suggest moderate anxiety. We recommend professional counseling and anxiety management techniques.",
        Severe:
          "You appear to have severe anxiety. Please seek immediate professional help and consider comprehensive treatment.",
      },
      ghq12: {
        Normal:
          "Your general mental health appears to be good. Continue maintaining healthy lifestyle practices.",
        Mild: "You may be experiencing some psychological distress. Consider stress reduction techniques and self-care.",
        Moderate:
          "Your responses suggest moderate psychological distress. We recommend speaking with a counselor.",
        Severe:
          "You appear to be experiencing significant psychological distress. Please seek professional help immediately.",
      },
    };

    return (
      baseRecommendations[assessmentType]?.[severityLevel] ||
      "Please consult with a mental health professional for personalized guidance."
    );
  };

  const submitAssessment = async (assessmentType) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to save your assessment results.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let responses, questions, validator, expectedCount;

      // Get responses and set up validation
      switch (assessmentType) {
        case "phq9":
          responses = phq9Responses;
          questions = phq9Questions;
          validator = validatePHQ9;
          expectedCount = 9;
          break;
        case "gad7":
          responses = gad7Responses;
          questions = gad7Questions;
          validator = validateGAD7;
          expectedCount = 7;
          break;
        case "ghq12":
          responses = ghq12Responses;
          questions = ghq12Questions;
          validator = validateGHQ12;
          expectedCount = 12;
          break;
      }

      // Sanitize additional notes
      const sanitizedNotes = sanitizeTextInput(additionalNotes);

      // Build validation data object
      const validationData = {
        responses,
        additionalNotes: sanitizedNotes,
      };

      // Validate with Zod
      const validationResult = validator(validationData);
      if (!validationResult.success) {
        toast({
          title: "Validation Error",
          description:
            validationResult.errors?.[0]?.message ||
            "Please complete all required fields",
          variant: "destructive",
        });
        return;
      }

      // Calculate score using validation helper
      const scoreResult = calculateAssessmentScore(
        validationResult.data.responses,
        expectedCount
      );
      if (!scoreResult.isValid) {
        toast({
          title: "Scoring Error",
          description: scoreResult.errors[0] || "Invalid assessment responses",
          variant: "destructive",
        });
        return;
      }

      const score = scoreResult.score;
      const severityLevel = getSeverityLevel(score, assessmentType);
      const recommendations = getRecommendations(
        score,
        assessmentType,
        severityLevel
      );

      // Check for crisis indicators
      const crisisDetection = detectCrisisKeywords(sanitizedNotes);
      let crisisLevel: CrisisLevel | undefined;
      let triggers: string[] = [];

      // Determine crisis level based on severity and keywords
      if (crisisDetection.crisisDetected) {
        crisisLevel = crisisDetection.level;
        triggers = crisisDetection.triggers;
      } else if (
        severityLevel === "Severe" ||
        severityLevel === "Moderately Severe"
      ) {
        crisisLevel = "high";
      } else if (severityLevel === "Moderate") {
        crisisLevel = "medium";
      } else if (severityLevel === "Mild") {
        crisisLevel = "low";
      }

      const { error } = await supabase
        .from("psychological_assessments")
        .insert({
          user_id: user.id,
          assessment_type: assessmentType.toUpperCase(),
          responses: validationResult.data.responses,
          score: score,
          severity_level: severityLevel,
          recommendations: recommendations,
        });

      if (error) throw error;

      setCompletedAssessments((prev) => new Set([...prev, assessmentType]));

      // Show crisis alert if needed
      if (crisisLevel) {
        setCrisisAlert({ level: crisisLevel, triggers });

        if (crisisLevel === "high") {
          toast({
            title: "Immediate Support Available",
            description:
              "Based on your responses, please consider reaching out for FREE support: Call KIRAN 1800-599-0019 or iCALL 9152987821",
            variant: "destructive",
          });
        }
      }

      toast({
        title: "Assessment Completed",
        description: `Your ${assessmentType.toUpperCase()} assessment has been saved. Score: ${score}, Severity: ${severityLevel}`,
      });
    } catch (error) {
      console.error("Error submitting assessment:", error);
      toast({
        title: "Error",
        description: "Failed to save assessment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAssessmentComplete = (assessmentType) => {
    switch (assessmentType) {
      case "phq9":
        return Object.keys(phq9Responses).length === phq9Questions.length;
      case "gad7":
        return Object.keys(gad7Responses).length === gad7Questions.length;
      case "ghq12":
        return Object.keys(ghq12Responses).length === ghq12Questions.length;
      default:
        return false;
    }
  };

  const getProgress = (assessmentType) => {
    switch (assessmentType) {
      case "phq9":
        return (Object.keys(phq9Responses).length / phq9Questions.length) * 100;
      case "gad7":
        return (Object.keys(gad7Responses).length / gad7Questions.length) * 100;
      case "ghq12":
        return (
          (Object.keys(ghq12Responses).length / ghq12Questions.length) * 100
        );
      default:
        return 0;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-20 flex items-center justify-center min-h-screen">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Sign In Required</CardTitle>
              <CardDescription>
                Please sign in to access psychological assessment tools.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/auth">
                <Button className="w-full">Sign In</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const renderQuestions = (
    questions,
    responses,
    setResponses,
    assessmentType
  ) => (
    <div className="space-y-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Progress</span>
          <span className="text-sm text-muted-foreground">
            {Object.keys(responses).length}/{questions.length}
          </span>
        </div>
        <Progress value={getProgress(assessmentType)} className="h-2" />
      </div>

      {questions.map((question, index) => (
        <Card
          key={index}
          className={`p-4 ${
            responses[index] !== undefined
              ? "border-primary/50 bg-primary/5"
              : ""
          }`}
        >
          <div className="space-y-4">
            <h3 className="font-medium leading-relaxed">
              {index + 1}. Over the last 2 weeks, how often have you been
              bothered by {question.toLowerCase()}?
            </h3>
            <RadioGroup
              value={responses[index] || ""}
              onValueChange={(value) =>
                setResponses({ ...responses, [index]: value })
              }
            >
              {responseOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={option.value}
                    id={`${assessmentType}-${index}-${option.value}`}
                  />
                  <Label
                    htmlFor={`${assessmentType}-${index}-${option.value}`}
                    className="cursor-pointer"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </Card>
      ))}

      <Card className="p-4">
        <div className="space-y-4">
          <Label htmlFor="notes">Additional Notes (Optional)</Label>
          <Textarea
            id="notes"
            placeholder="Any additional information you'd like to share about your mental health..."
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            className="min-h-20"
          />
        </div>
      </Card>

      <div className="flex items-center justify-between pt-4">
        <div className="text-sm text-muted-foreground">
          {isAssessmentComplete(assessmentType) ? (
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span>Assessment complete</span>
            </div>
          ) : (
            `${
              questions.length - Object.keys(responses).length
            } questions remaining`
          )}
        </div>
        <Button
          onClick={() => submitAssessment(assessmentType)}
          disabled={!isAssessmentComplete(assessmentType) || isSubmitting}
          className="min-w-32"
        >
          {isSubmitting ? (
            <LoadingSpinner size="small" text="Submitting..." />
          ) : (
            "Submit Assessment"
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        <Navigation />

        {/* Header */}
        <section className="pt-20 pb-12 bg-gradient-hero">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-6">
              Psychological Assessment Tools
            </h1>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              Confidential, evidence-based screening tools to help assess your
              mental health and guide you toward appropriate support.
            </p>
          </div>
        </section>

        {/* Crisis Alert */}
        {crisisAlert && (
          <section className="py-4">
            <div className="container mx-auto px-4 max-w-4xl">
              <CrisisAlert
                level={crisisAlert.level}
                triggers={crisisAlert.triggers}
                onDismiss={
                  crisisAlert.level !== "high"
                    ? () => setCrisisAlert(null)
                    : undefined
                }
              />
            </div>
          </section>
        )}

        {/* Assessment Tools */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="mb-8">
              <h2 className="text-2xl font-heading font-bold mb-4">
                Available Assessment Tools
              </h2>
              <p className="text-muted-foreground">
                These standardized screening tools are used by mental health
                professionals worldwide. Your responses are confidential and
                will help determine the most appropriate support for you.
              </p>
            </div>

            <Tabs
              value={currentAssessment}
              onValueChange={setCurrentAssessment}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="phq9" className="text-center">
                  <div className="flex items-center space-x-2">
                    <Brain className="w-4 h-4" />
                    <span>PHQ-9</span>
                    {completedAssessments.has("phq9") && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                </TabsTrigger>
                <TabsTrigger value="gad7" className="text-center">
                  <div className="flex items-center space-x-2">
                    <Heart className="w-4 h-4" />
                    <span>GAD-7</span>
                    {completedAssessments.has("gad7") && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                </TabsTrigger>
                <TabsTrigger value="ghq12" className="text-center">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4" />
                    <span>GHQ-12</span>
                    {completedAssessments.has("ghq12") && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="phq9" className="mt-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Brain className="w-5 h-5" />
                      <span>PHQ-9: Patient Health Questionnaire</span>
                    </CardTitle>
                    <CardDescription>
                      A 9-question screening tool for depression. This
                      assessment is widely used by healthcare professionals to
                      evaluate depression severity and monitor treatment
                      progress.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {renderQuestions(
                      phq9Questions,
                      phq9Responses,
                      setPHQ9Responses,
                      "phq9"
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="gad7" className="mt-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Heart className="w-5 h-5" />
                      <span>GAD-7: Generalized Anxiety Disorder Scale</span>
                    </CardTitle>
                    <CardDescription>
                      A 7-question screening tool for anxiety disorders. This
                      assessment helps identify symptoms of generalized anxiety
                      and determine appropriate treatment recommendations.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {renderQuestions(
                      gad7Questions,
                      gad7Responses,
                      setGAD7Responses,
                      "gad7"
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="ghq12" className="mt-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Activity className="w-5 h-5" />
                      <span>GHQ-12: General Health Questionnaire</span>
                    </CardTitle>
                    <CardDescription>
                      A 12-question screening tool for general psychological
                      well-being. This assessment evaluates overall mental
                      health and identifies potential areas of concern.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {renderQuestions(
                      ghq12Questions,
                      ghq12Responses,
                      setGHQ12Responses,
                      "ghq12"
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Privacy Notice */}
            <Card className="mt-8 border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">
                  Privacy & Confidentiality
                </h3>
                <p className="text-sm text-muted-foreground">
                  Your assessment responses are confidential and encrypted. They
                  are used solely for providing personalized mental health
                  recommendations and connecting you with appropriate support
                  resources. Your data helps our institution understand mental
                  health trends anonymously to improve services.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </ErrorBoundary>
  );
};

export default AssessmentPage;
