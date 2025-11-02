import React, { Component, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: string) => void;
}

class ErrorBoundaryClass extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: error.stack || "No error stack available",
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo.componentStack);
    }

    // Report error to monitoring service (placeholder)
    this.reportError(error, errorInfo.componentStack);
  }

  reportError = (error: Error, errorInfo: string) => {
    // In a real application, you would send this to your error reporting service
    // For now, we'll just log it
    console.error("Error reported:", {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo,
      timestamp: new Date().toISOString(),
    });
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <Card className="max-w-md mx-auto mt-8">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <AlertTriangle className="w-12 h-12 text-destructive" />
              </div>
              <CardTitle className="text-destructive">
                Something went wrong
              </CardTitle>
              <CardDescription>
                We encountered an unexpected error. This has been reported to
                our team.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {process.env.NODE_ENV === "development" && (
                <details className="bg-muted p-3 rounded-md text-sm">
                  <summary className="cursor-pointer font-medium">
                    Error Details (Development)
                  </summary>
                  <pre className="mt-2 whitespace-pre-wrap break-words">
                    {this.state.error?.message}
                    {"\n\n"}
                    {this.state.errorInfo}
                  </pre>
                </details>
              )}
              <div className="flex gap-2">
                <Button
                  onClick={this.handleRetry}
                  className="flex-1"
                  variant="default"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="flex-1"
                >
                  Reload Page
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      );
    }

    return this.props.children;
  }
}

// Wrapper component to use hooks
export function ErrorBoundary(props: ErrorBoundaryProps) {
  const { toast } = useToast();

  const handleError = (error: Error, errorInfo: string) => {
    toast({
      title: "An error occurred",
      description:
        "Something went wrong. Please try again or refresh the page.",
      variant: "destructive",
    });

    if (props.onError) {
      props.onError(error, errorInfo);
    }
  };

  return <ErrorBoundaryClass {...props} onError={handleError} />;
}
