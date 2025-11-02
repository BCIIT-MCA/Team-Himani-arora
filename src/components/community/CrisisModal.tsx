import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  Phone,
  MessageCircle,
  Globe,
  Heart,
  Shield,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { INDIAN_STUDENT_CRISIS_CONTACTS } from "@/lib/constants";

interface CrisisResource {
  name: string;
  phone?: string;
  text?: string;
  website?: string;
  description: string;
  availability: string;
  type: "hotline" | "chat" | "text" | "website";
}

interface CrisisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestHelp?: () => void;
  className?: string;
}

const crisisResources: CrisisResource[] = [
  {
    name: "KIRAN Mental Health Helpline",
    phone: INDIAN_STUDENT_CRISIS_CONTACTS.primary.number,
    description: "FREE confidential mental health support for students 24/7",
    availability: "24/7 FREE",
    type: "hotline",
  },
  {
    name: "iCALL Crisis Support",
    phone: INDIAN_STUDENT_CRISIS_CONTACTS.secondary[0].number,
    description:
      "FREE psychological first aid and crisis intervention for students",
    availability: "24/7 FREE",
    type: "hotline",
  },
  {
    name: "Vandrevala Foundation Helpline",
    phone: "9999666555",
    description: "Free mental health support for students and families",
    availability: "24/7 FREE",
    type: "hotline",
  },
  {
    name: "Snehi Crisis Helpline",
    phone: "9717696011",
    description: "Delhi-based crisis intervention and emotional support",
    availability: "24/7 FREE",
    type: "hotline",
  },
  {
    name: "Vandrevala Foundation Online Support",
    website: "https://www.vandrevalafoundation.com/",
    description: "Online mental health resources and chat support for students",
    availability: "24/7",
    type: "website",
  },
];

export const CrisisModal: React.FC<CrisisModalProps> = ({
  isOpen,
  onClose,
  onRequestHelp,
  className,
}) => {
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());

  const handleCopy = async (text: string, item: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItems((prev) => new Set(prev).add(item));
      toast.success("Copied to clipboard");

      // Reset copied state after 3 seconds
      setTimeout(() => {
        setCopiedItems((prev) => {
          const newSet = new Set(prev);
          newSet.delete(item);
          return newSet;
        });
      }, 3000);
    } catch (error) {
      toast.error("Failed to copy");
    }
  };

  const handlePhoneCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleTextMessage = (number: string) => {
    window.location.href = `sms:${number}`;
  };

  const handleWebsiteOpen = (website: string) => {
    window.open(website, "_blank", "noopener,noreferrer");
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case "hotline":
        return <Phone className="h-4 w-4" />;
      case "text":
        return <MessageCircle className="h-4 w-4" />;
      case "chat":
        return <MessageCircle className="h-4 w-4" />;
      case "website":
        return <Globe className="h-4 w-4" />;
      default:
        return <Heart className="h-4 w-4" />;
    }
  };

  const getResourceColor = (type: string) => {
    switch (type) {
      case "hotline":
        return "bg-red-500/10 text-red-700 border-red-200";
      case "text":
        return "bg-blue-500/10 text-blue-700 border-blue-200";
      case "chat":
        return "bg-green-500/10 text-green-700 border-green-200";
      case "website":
        return "bg-purple-500/10 text-purple-700 border-purple-200";
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-200";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-red-500/10 rounded-full">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold text-red-900">
                Crisis Support Resources
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Immediate help is available. You don't have to face this alone.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Emergency Warning */}
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-red-900">
                    If you're in immediate danger or having thoughts of
                    self-harm:
                  </p>
                  <div className="space-y-1 text-sm text-red-800">
                    <p>
                      • Call KIRAN Mental Health Helpline: 1800-599-0019 (FREE
                      24/7)
                    </p>
                    <p>• Call iCALL Crisis Support: 9152987821 (FREE)</p>
                    <p>
                      • Go to your nearest government hospital emergency room
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Crisis Resources */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Crisis Support Resources</span>
            </h3>

            <div className="grid gap-4">
              {crisisResources.map((resource, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-medium text-sm">
                              {resource.name}
                            </h4>
                            <Badge
                              variant="outline"
                              className={`${getResourceColor(
                                resource.type
                              )} text-xs`}
                            >
                              {getResourceIcon(resource.type)}
                              <span className="ml-1 capitalize">
                                {resource.type}
                              </span>
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {resource.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Available: {resource.availability}
                          </p>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex flex-wrap gap-2">
                        {resource.phone && (
                          <div className="flex items-center space-x-1">
                            <Button
                              size="sm"
                              onClick={() => handlePhoneCall(resource.phone!)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              <Phone className="h-3 w-3 mr-1" />
                              Call {resource.phone}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleCopy(resource.phone!, `phone-${index}`)
                              }
                            >
                              {copiedItems.has(`phone-${index}`) ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        )}

                        {resource.text && (
                          <div className="flex items-center space-x-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleTextMessage(resource.text!)}
                              className="border-blue-200 text-blue-700 hover:bg-blue-50"
                            >
                              <MessageCircle className="h-3 w-3 mr-1" />
                              Text {resource.text}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleCopy(resource.text!, `text-${index}`)
                              }
                            >
                              {copiedItems.has(`text-${index}`) ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        )}

                        {resource.website && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleWebsiteOpen(resource.website!)}
                            className="border-purple-200 text-purple-700 hover:bg-purple-50"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Visit Website
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Community Support */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-4">
              <div className="flex items-start space-x-3">
                <Heart className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-blue-900">
                    Community Support Available
                  </p>
                  <p className="text-sm text-blue-800">
                    Our community is here for you. Consider reaching out to
                    trusted members, joining a support group, or speaking with a
                    mental health professional.
                  </p>
                  {onRequestHelp && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onRequestHelp}
                      className="border-blue-200 text-blue-700 hover:bg-blue-100 mt-2"
                    >
                      <Heart className="h-3 w-3 mr-1" />
                      Request Community Support
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Disclaimer */}
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-yellow-800">
                    <strong>Disclaimer:</strong> This platform provides peer
                    support and is not a substitute for professional mental
                    health care. If you're experiencing a mental health
                    emergency, please contact KIRAN 1800-599-0019 or iCALL
                    9152987821 immediately.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex items-center justify-between pt-4">
          <p className="text-xs text-muted-foreground">
            Remember: It's okay to ask for help. You matter, and support is
            available.
          </p>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
