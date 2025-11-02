import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  Clock,
  MapPin,
  Star,
  Video,
  Phone,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  CalendarDays,
  Gift,
  Heart,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCounseling } from "@/hooks/useCounseling";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  INDIAN_STUDENT_CRISIS_CONTACTS,
  STUDENT_PLATFORM_FEATURES,
} from "@/lib/constants";

const CounselingPage = () => {
  const { user } = useAuth();
  const {
    counselors,
    appointments,
    loading,
    bookingLoading,
    bookAppointment,
    getAvailableSlots,
    getCounselorAvailability,
    generateAlternativeSlots,
  } = useCounseling();
  const { toast } = useToast();
  const [selectedCounselor, setSelectedCounselor] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedType, setSelectedType] = useState("video");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [counselorAvailability, setCounselorAvailability] = useState({});
  const [alternativeSlots, setAlternativeSlots] = useState([]);
  const [alternativeCounselors, setAlternativeCounselors] = useState([]);

  // Load available slots when counselor or date changes
  useEffect(() => {
    if (selectedCounselor && selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedCounselor, selectedDate]);

  // Load counselor availability for calendar view
  useEffect(() => {
    if (selectedCounselor) {
      loadCounselorAvailability();
    }
  }, [selectedCounselor]);

  const loadAvailableSlots = async () => {
    if (!selectedCounselor || !selectedDate) return;

    setLoadingSlots(true);
    try {
      const date = new Date(selectedDate);
      const slots = await getAvailableSlots(selectedCounselor, date);
      setAvailableSlots(slots);

      // If no available slots, generate alternative suggestions
      const availableCount = slots.filter((slot) => slot.available).length;
      if (availableCount === 0) {
        const alternatives = await generateAlternativeSlots(
          selectedCounselor.id,
          selectedDate,
          "09:00" // Default time for alternatives
        );
        setAlternativeSlots(alternatives);

        // Also find alternative counselors who have slots on this date
        const altCounselors = [];
        for (const counselor of counselors) {
          if (counselor.id !== selectedCounselor.id && counselor.is_active) {
            const counselorSlots = await getAvailableSlots(counselor, date);
            const hasAvailableSlots = counselorSlots.some(
              (slot) => slot.available
            );
            if (hasAvailableSlots) {
              altCounselors.push({
                ...counselor,
                availableSlots: counselorSlots
                  .filter((slot) => slot.available)
                  .slice(0, 2),
              });
            }
            if (altCounselors.length >= 2) break; // Limit to 2 alternative counselors
          }
        }
        setAlternativeCounselors(altCounselors);
      } else {
        setAlternativeSlots([]);
        setAlternativeCounselors([]);
      }
    } catch (error) {
      console.error("Error loading slots:", error);
      toast({
        title: "Error Loading Slots",
        description: "Failed to load available time slots.",
        variant: "destructive",
      });
    } finally {
      setLoadingSlots(false);
    }
  };

  const loadCounselorAvailability = async () => {
    if (!selectedCounselor) return;

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 14); // Next 2 weeks

    try {
      const availability = await getCounselorAvailability(
        selectedCounselor.id,
        startDate,
        endDate
      );
      setCounselorAvailability(availability);
    } catch (error) {
      console.error("Error loading counselor availability:", error);
    }
  };

  const handleBooking = async () => {
    if (!selectedCounselor || !selectedDate || !selectedTime) {
      toast({
        title: "Missing Information",
        description: "Please select a counselor, date, and time.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await bookAppointment(
        selectedCounselor.id,
        selectedDate,
        selectedTime,
        selectedType,
        isAnonymous
      );

      if (!result.success) {
        // Show alternatives if available
        if (result.alternatives && result.alternatives.length > 0) {
          toast({
            title: "Alternative Times Available",
            description: `Try these times: ${result.alternatives
              .slice(0, 3)
              .join(", ")}`,
            variant: "default",
          });
        }
        return;
      }

      toast({
        title: "Appointment Booked!",
        description: `Your ${selectedType} session with ${selectedCounselor.name} has been scheduled.`,
      });

      // Reset form
      setSelectedCounselor(null);
      setSelectedDate("");
      setSelectedTime("");
      setSelectedType("video");
      setIsAnonymous(false);
    } catch (error) {
      console.error("Booking error:", error);
      // Error handling is done in the bookAppointment function
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Header Section */}
      <section className="pt-20 pb-12 bg-gradient-hero">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-6">
            Professional Counseling Services
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto mb-8">
            Connect with licensed mental health professionals who understand
            your journey and are here to support you.
          </p>
          {!user && (
            <Link to="/auth">
              <Button size="lg" variant="secondary" className="shadow-soft">
                Sign Up to Book a Session
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* Free Student Support Services */}
      <section className="py-16 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-green-600 text-white text-lg px-4 py-2">
              <Gift className="w-5 h-5 mr-2" />
              100% FREE for Students
            </Badge>
            <h2 className="text-3xl font-heading font-bold mb-4">
              Free Student Mental Health Services
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              All counseling services are completely free for Indian school and
              college students. No hidden costs, no session limits - just
              professional support when you need it most.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="text-center group hover:shadow-elegant transition-all duration-300 border-green-200">
              <CardHeader>
                <Video className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <CardTitle className="text-green-800">Video Sessions</CardTitle>
                <CardDescription>
                  Free online counseling sessions for academic stress, exam
                  anxiety, and personal issues
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Badge className="bg-green-100 text-green-800 text-lg px-4 py-2 mb-2">
                  <Heart className="w-4 h-4 mr-1" />
                  FREE for Students
                </Badge>
                <p className="text-muted-foreground">
                  Professional 50-minute sessions
                </p>
              </CardContent>
            </Card>

            <Card className="text-center group hover:shadow-elegant transition-all duration-300 border-blue-200">
              <CardHeader>
                <Phone className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <CardTitle className="text-blue-800">Phone Sessions</CardTitle>
                <CardDescription>
                  Free phone support for board exam stress, career confusion,
                  and family pressure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Badge className="bg-blue-100 text-blue-800 text-lg px-4 py-2 mb-2">
                  <Heart className="w-4 h-4 mr-1" />
                  FREE for Students
                </Badge>
                <p className="text-muted-foreground">
                  Secure and confidential calls
                </p>
              </CardContent>
            </Card>

            <Card className="text-center group hover:shadow-elegant transition-all duration-300 border-purple-200">
              <CardHeader>
                <MapPin className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <CardTitle className="text-purple-800">
                  Campus Sessions
                </CardTitle>
                <CardDescription>
                  Free in-person counseling at your school or college campus
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Badge className="bg-purple-100 text-purple-800 text-lg px-4 py-2 mb-2">
                  <Heart className="w-4 h-4 mr-1" />
                  FREE for Students
                </Badge>
                <p className="text-muted-foreground">
                  Available at partner institutions
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Available Counselors */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-heading font-bold text-center mb-12">
            Meet Our Licensed Counselors
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              <div className="col-span-full text-center py-8">
                Loading counselors...
              </div>
            ) : (
              counselors.map((counselor) => (
                <Card
                  key={counselor.id}
                  className="group hover:shadow-elegant transition-all duration-300"
                >
                  <CardHeader>
                    <div className="flex items-center space-x-4 mb-4">
                      <img
                        src="/placeholder.svg"
                        alt={counselor.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          {counselor.name}
                        </CardTitle>
                        <Badge className="bg-green-100 text-green-800 mb-2">
                          <Gift className="w-3 h-3 mr-1" />
                          FREE for Students
                        </Badge>
                        <div className="flex items-center space-x-1">
                          <span className="text-sm text-muted-foreground">
                            Student Mental Health Specialist
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {counselor.specialties.map((specialty) => (
                        <span
                          key={specialty}
                          className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {counselor.languages.map((language) => (
                        <span
                          key={language}
                          className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded"
                        >
                          {language}
                        </span>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {counselor.bio}
                    </p>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
                      <Clock className="w-4 h-4" />
                      <span>
                        Available for {counselor.contact_method} sessions
                      </span>
                    </div>
                    {user ? (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            className="w-full"
                            onClick={() => setSelectedCounselor(counselor)}
                          >
                            Book Session
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>
                              Book Session with {counselor.name}
                            </DialogTitle>
                            <DialogDescription>
                              Choose your preferred session type, date, and
                              time.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="session-type">Session Type</Label>
                              <Select
                                value={selectedType}
                                onValueChange={setSelectedType}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select session type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="video">
                                    Video Call (FREE)
                                  </SelectItem>
                                  <SelectItem value="phone">
                                    Phone Call (FREE)
                                  </SelectItem>
                                  <SelectItem value="in-person">
                                    Campus Session (FREE)
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="date">Date</Label>
                              <input
                                type="date"
                                id="date"
                                value={selectedDate}
                                onChange={(e) =>
                                  setSelectedDate(e.target.value)
                                }
                                min={new Date().toISOString().split("T")[0]}
                                className="w-full p-2 border rounded-md"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="time">Time</Label>
                              {loadingSlots ? (
                                <Skeleton className="h-10 w-full" />
                              ) : (
                                <Select
                                  value={selectedTime}
                                  onValueChange={setSelectedTime}
                                >
                                  <SelectTrigger>
                                    <SelectValue
                                      placeholder={
                                        selectedDate
                                          ? "Select available time"
                                          : "Select date first"
                                      }
                                    />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {availableSlots
                                      .filter((slot) => slot.available)
                                      .map((slot) => (
                                        <SelectItem
                                          key={slot.time}
                                          value={slot.time}
                                        >
                                          {slot.time}
                                        </SelectItem>
                                      ))}
                                    {availableSlots.length === 0 &&
                                      selectedDate && (
                                        <div className="p-2 text-sm text-muted-foreground">
                                          No available slots for this date
                                          {alternativeSlots.length > 0 && (
                                            <div className="mt-2">
                                              <div className="text-xs font-medium text-primary mb-1">
                                                📅 Try these alternatives:
                                              </div>
                                              {alternativeSlots
                                                .slice(0, 3)
                                                .map((altSlot, index) => {
                                                  const [altDate, altTime] =
                                                    altSlot.split(" ");
                                                  const formattedDate =
                                                    new Date(
                                                      altDate
                                                    ).toLocaleDateString(
                                                      "en-IN",
                                                      {
                                                        timeZone:
                                                          "Asia/Kolkata",
                                                        weekday: "short",
                                                        month: "short",
                                                        day: "numeric",
                                                      }
                                                    );
                                                  return (
                                                    <div
                                                      key={index}
                                                      className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer py-1"
                                                      onClick={() => {
                                                        setSelectedDate(
                                                          altDate
                                                        );
                                                        setSelectedTime(
                                                          altTime
                                                        );
                                                      }}
                                                    >
                                                      {formattedDate} at{" "}
                                                      {altTime}
                                                    </div>
                                                  );
                                                })}
                                            </div>
                                          )}
                                          {alternativeCounselors.length > 0 && (
                                            <div className="mt-3 pt-2 border-t border-gray-200">
                                              <div className="text-xs font-medium text-primary mb-1">
                                                👥 Try these counselors:
                                              </div>
                                              {alternativeCounselors.map(
                                                (altCounselor, index) => (
                                                  <div
                                                    key={index}
                                                    className="text-xs mb-1"
                                                  >
                                                    <div className="font-medium text-gray-700">
                                                      {altCounselor.name}
                                                    </div>
                                                    <div className="flex gap-1 flex-wrap">
                                                      {altCounselor.availableSlots.map(
                                                        (slot, slotIndex) => (
                                                          <span
                                                            key={slotIndex}
                                                            className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded cursor-pointer hover:bg-blue-100"
                                                            onClick={() => {
                                                              setSelectedCounselor(
                                                                altCounselor
                                                              );
                                                              setSelectedTime(
                                                                slot.time
                                                              );
                                                            }}
                                                          >
                                                            {slot.time}
                                                          </span>
                                                        )
                                                      )}
                                                    </div>
                                                  </div>
                                                )
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                  </SelectContent>
                                </Select>
                              )}

                              {/* Show unavailable slots as info */}
                              {availableSlots.some(
                                (slot) => !slot.available
                              ) && (
                                <div className="text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1 mb-1">
                                    <AlertCircle className="w-3 h-3" />
                                    Unavailable times:
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {availableSlots
                                      .filter((slot) => !slot.available)
                                      .slice(0, 4)
                                      .map((slot, index) => (
                                        <Badge
                                          key={index}
                                          variant="outline"
                                          className="text-xs"
                                        >
                                          {slot.time}
                                        </Badge>
                                      ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="anonymous"
                                checked={isAnonymous}
                                onCheckedChange={(checked) =>
                                  setIsAnonymous(checked === true)
                                }
                              />
                              <Label htmlFor="anonymous" className="text-sm">
                                Book anonymously (your identity will be
                                protected)
                              </Label>
                            </div>

                            <Button
                              onClick={handleBooking}
                              disabled={bookingLoading}
                              className="w-full"
                            >
                              {bookingLoading
                                ? "Booking..."
                                : "Confirm Booking"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <Link to="/auth">
                        <Button className="w-full">Sign Up to Book</Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Student Crisis Support */}
      <section className="py-12 bg-red-50 border-t border-red-200">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-xl font-heading font-bold text-red-700 mb-4">
            Student Crisis Support Available 24/7
          </h3>
          <p className="text-muted-foreground mb-6">
            If you're a student experiencing academic stress, family pressure,
            or mental health emergency, please reach out immediately. We're here
            for you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4">
            <Button variant="destructive" size="lg" asChild>
              <a href={`tel:${INDIAN_STUDENT_CRISIS_CONTACTS.primary.number}`}>
                <Phone className="w-4 h-4 mr-2" />
                Student Crisis: {INDIAN_STUDENT_CRISIS_CONTACTS.primary.number}
              </a>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a
                href={`tel:${INDIAN_STUDENT_CRISIS_CONTACTS.secondary[0].number}`}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                iCALL: {INDIAN_STUDENT_CRISIS_CONTACTS.secondary[0].number}
              </a>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            {INDIAN_STUDENT_CRISIS_CONTACTS.primary.description} | Support
            available in{" "}
            {INDIAN_STUDENT_CRISIS_CONTACTS.primary.languages.join(", ")}
          </p>
        </div>
      </section>
    </div>
  );
};

export default CounselingPage;
