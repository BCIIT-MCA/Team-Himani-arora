import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Heart, Shield, Eye, EyeOff, ArrowRight, UserX } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";

const AuthPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [redirecting, setRedirecting] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [showAnonymousSection, setShowAnonymousSection] = useState(false);

  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const {
    signUp,
    signIn,
    signInWithGoogle,
    signInAnonymously,
    signUpLoading,
    signInLoading,
  } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    const result = await signUp(
      email,
      password,
      isAnonymous ? "Anonymous User" : displayName
    );

    if (result.success) {
      // Show additional toast to make sure verification message is visible
      toast({
        title: "Account Created Successfully! 🎉",
        description:
          "Please check your email to verify your account before signing in.",
        variant: "default",
      });

      // Redirect to sign-in tab after short delay
      setTimeout(() => {
        setActiveTab("signin");
        // Clear form fields
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setDisplayName("");
        setIsAnonymous(false);
      }, 2500);
    } else if (result.error) {
      toast({
        title: "Sign up failed",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await signIn(email, password);

    if (result.success) {
      setRedirecting(true);
      // Redirect to main landing page
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } else if (result.error) {
      toast({
        title: "Sign in failed",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const handleGoogleSignIn = async () => {
    const result = await signInWithGoogle();

    if (result.success) {
      setRedirecting(true);
      toast({
        title: "Redirecting to Google...",
        description: "You'll be redirected back after authentication.",
      });
    } else if (result.error) {
      toast({
        title: "Google sign-in failed",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const handleAnonymousSignIn = async () => {
    if (!captchaToken) {
      toast({
        title: "Captcha Required",
        description: "Please complete the captcha verification first.",
        variant: "destructive",
      });
      return;
    }

    const result = await signInAnonymously(captchaToken);

    if (result.success) {
      setRedirecting(true);
      // Reset captcha
      recaptchaRef.current?.reset();
      setCaptchaToken(null);

      // Redirect to main landing page
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } else {
      // Reset captcha on error
      recaptchaRef.current?.reset();
      setCaptchaToken(null);
      if (result.error) {
        toast({
          title: "Anonymous sign-in failed",
          description: result.error,
          variant: "destructive",
        });
      }
    }
  };

  const onCaptchaChange = (token: string | null) => {
    setCaptchaToken(token);
  };

  return (
    <div className="min-h-screen bg-gradient-wellness flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-32 h-32 bg-primary rounded-full animate-float"></div>
        <div
          className="absolute bottom-20 right-20 w-24 h-24 bg-secondary rounded-full animate-float"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/4 w-16 h-16 bg-accent rounded-full animate-float"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      <div className="w-full max-w-md relative">
        {/* Redirect overlay */}
        {redirecting && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/90 rounded-lg">
            <div className="p-6 rounded-xl shadow-lg bg-white flex flex-col items-center">
              <span className="font-semibold mb-2">
                Redirecting to your safe space...
              </span>
              <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          </div>
        )}
        {/* Header */}
        <div className="text-center mb-8">
          <Link
            to="/"
            className="inline-flex items-center space-x-2 mb-6 group"
          >
            <div className="w-10 h-10 bg-gradient-hero rounded-lg flex items-center justify-center breathing">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <span className="font-heading font-semibold text-2xl text-foreground group-hover:text-primary transition-colors">
              WellnessSpace
            </span>
          </Link>
          <h1 className="font-heading text-3xl font-bold text-foreground mb-2">
            Your Safe Space Awaits
          </h1>
          <p className="text-muted-foreground">
            Join thousands of students finding support and healing
          </p>
        </div>

        <Card className="glass shadow-wellness border-border/30">
          <Tabs
            value={activeTab}
            onValueChange={(value) =>
              setActiveTab(value as "signin" | "signup")
            }
            defaultValue="signin"
          >
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            {/* Sign In Tab */}
            <TabsContent value="signin">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-heading">
                  Welcome Back
                </CardTitle>
                <CardDescription>
                  Sign in to continue your wellness journey
                </CardDescription>
              </CardHeader>

              <form onSubmit={handleSignIn}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="border-border/50 focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="border-border/50 focus:border-primary pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col space-y-4">
                  <Button
                    type="submit"
                    className="w-full bg-gradient-hero hover:opacity-90 shadow-soft"
                    disabled={signInLoading || redirecting}
                  >
                    {signInLoading ? "Signing in..." : "Sign In"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>

                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border/50" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Or continue with
                      </span>
                    </div>
                  </div>

                  {/* Google Sign In */}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleGoogleSignIn}
                    disabled={signInLoading || redirecting}
                  >
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Continue with Google
                  </Button>

                  {/* Anonymous Sign In Toggle */}
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-sm"
                    onClick={() =>
                      setShowAnonymousSection(!showAnonymousSection)
                    }
                  >
                    <UserX className="w-4 h-4 mr-2" />
                    {showAnonymousSection ? "Hide" : "Try"} Anonymous Access
                  </Button>

                  {/* Anonymous Sign In Section */}
                  {showAnonymousSection && (
                    <div className="w-full space-y-4 p-4 bg-muted/30 rounded-lg border border-border/50">
                      <div className="text-sm text-muted-foreground">
                        <p className="mb-2">
                          Sign in anonymously for temporary access:
                        </p>
                        <ul className="text-xs space-y-1 list-disc list-inside">
                          <li>No email required</li>
                          <li>Data won't be saved permanently</li>
                          <li>Session expires when you close the browser</li>
                        </ul>
                      </div>

                      {/* reCAPTCHA */}
                      <div className="flex justify-center">
                        <ReCAPTCHA
                          ref={recaptchaRef}
                          sitekey={
                            import.meta.env.VITE_RECAPTCHA_SITE_KEY ||
                            "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
                          }
                          onChange={onCaptchaChange}
                          theme="light"
                        />
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={handleAnonymousSignIn}
                        disabled={!captchaToken || signInLoading || redirecting}
                      >
                        <UserX className="w-4 h-4 mr-2" />
                        Continue Anonymously
                      </Button>
                    </div>
                  )}

                  <Button
                    variant="ghost"
                    className="text-sm text-muted-foreground"
                    type="button"
                    onClick={() =>
                      toast({
                        title: "Coming Soon",
                        description:
                          "Password recovery will be available soon.",
                        variant: "default",
                      })
                    }
                  >
                    Forgot your password?
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>

            {/* Sign Up Tab */}
            <TabsContent value="signup">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-heading">
                  Join WellnessSpace
                </CardTitle>
                <CardDescription>
                  Create your account for personalized support
                </CardDescription>
              </CardHeader>

              <form onSubmit={handleSignUp}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="border-border/50 focus:border-primary"
                    />
                  </div>

                  {!isAnonymous && (
                    <div className="space-y-2">
                      <Label htmlFor="display-name">
                        Display Name (Optional)
                      </Label>
                      <Input
                        id="display-name"
                        type="text"
                        placeholder="How you'd like to be called"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="border-border/50 focus:border-primary"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="border-border/50 focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="border-border/50 focus:border-primary"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="anonymous"
                      checked={isAnonymous}
                      onCheckedChange={(checked) =>
                        setIsAnonymous(checked as boolean)
                      }
                    />
                    <Label htmlFor="anonymous" className="text-sm">
                      I prefer to remain anonymous
                    </Label>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col space-y-4">
                  <Button
                    type="submit"
                    className="w-full bg-gradient-hero hover:opacity-90 shadow-soft"
                    disabled={signUpLoading}
                  >
                    {signUpLoading ? "Creating account..." : "Create Account"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>

                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border/50" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Or continue with
                      </span>
                    </div>
                  </div>

                  {/* Google Sign Up */}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleGoogleSignIn}
                    disabled={signUpLoading || redirecting}
                  >
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Sign up with Google
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
          </Tabs>

          {/* Privacy Notice */}
          <div className="p-6 pt-0">
            <div className="flex items-start space-x-2 text-xs text-muted-foreground bg-wellness/50 p-3 rounded-lg">
              <Shield className="w-4 h-4 mt-0.5 text-primary" />
              <p>
                Your data is encrypted and confidential. We follow strict
                privacy policies to protect your mental health information.
              </p>
            </div>
          </div>
        </Card>

        {/* Emergency Resources */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground mb-3">
            <strong>Student Crisis Support:</strong> If you're having thoughts
            of self-harm
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button
              variant="outline"
              size="sm"
              className="border-accent text-accent-foreground hover:bg-accent/10"
            >
              Call KIRAN 1800-599-0019
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-accent text-accent-foreground hover:bg-accent/10"
            >
              Call iCALL 9152987821
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
