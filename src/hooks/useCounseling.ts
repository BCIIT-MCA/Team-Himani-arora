import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  LOCALE_CONFIG,
  formatIndianDateTime,
  formatIndianTime,
} from "@/lib/constants";
import type { Database } from "@/integrations/supabase/types";

type Counselor = Database["public"]["Tables"]["counselors"]["Row"];
type Appointment = Database["public"]["Tables"]["appointments"]["Row"];

interface TimeSlot {
  time: string;
  available: boolean;
  reason?: string;
}

interface AvailabilityCheck {
  available: boolean;
  conflictingAppointment?: Appointment;
  reason?: string;
}

interface BookingResult {
  success: boolean;
  appointment?: Appointment;
  error?: string;
  alternatives?: string[];
}

export const useCounseling = () => {
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCounselors();
    fetchUserAppointments();
  }, []);

  const fetchCounselors = async () => {
    try {
      const { data, error } = await supabase
        .from("counselors")
        .select("*")
        .eq("is_active", true)
        .order("rating", { ascending: false });

      if (error) throw error;
      setCounselors(data || []);
    } catch (error) {
      console.error("Error fetching counselors:", error);
    }
  };

  const fetchUserAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select(
          `
          *,
          counselors (
            name,
            specialties
          )
        `
        )
        .order("appointment_date", { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkSlotAvailability = useCallback(
    async (
      counselorId: string,
      appointmentDateTime: string,
      durationMinutes: number = 60
    ): Promise<AvailabilityCheck> => {
      try {
        const appointmentStart = new Date(appointmentDateTime);
        const appointmentEnd = new Date(
          appointmentStart.getTime() + durationMinutes * 60000
        );

        // Get all appointments for this counselor around the requested time
        const { data: existingAppointments, error } = await supabase
          .from("appointments")
          .select("*")
          .eq("counselor_id", counselorId)
          .eq("status", "scheduled")
          .gte(
            "appointment_date",
            new Date(
              appointmentStart.getTime() - 24 * 60 * 60 * 1000
            ).toISOString()
          )
          .lte(
            "appointment_date",
            new Date(
              appointmentStart.getTime() + 24 * 60 * 60 * 1000
            ).toISOString()
          );

        if (error) throw error;

        // Check for time conflicts
        for (const appointment of existingAppointments || []) {
          const existingStart = new Date(appointment.appointment_date);
          const existingEnd = new Date(
            existingStart.getTime() + appointment.duration_minutes * 60000
          );

          // Check if times overlap
          if (
            (appointmentStart >= existingStart &&
              appointmentStart < existingEnd) ||
            (appointmentEnd > existingStart && appointmentEnd <= existingEnd) ||
            (appointmentStart <= existingStart && appointmentEnd >= existingEnd)
          ) {
            return {
              available: false,
              conflictingAppointment: appointment,
              reason: `Time slot conflicts with existing appointment at ${existingStart.toLocaleTimeString(
                "en-IN",
                { timeZone: "Asia/Kolkata", hour12: false }
              )}`,
            };
          }
        }

        return { available: true };
      } catch (error) {
        console.error("Error checking slot availability:", error);
        return {
          available: false,
          reason: "Unable to check availability at this time",
        };
      }
    },
    []
  );

  const bookAppointment = async (
    counselorId: string,
    appointmentDate: string,
    appointmentTime: string,
    type: string = "video",
    isAnonymous: boolean = false,
    durationMinutes: number = 60
  ): Promise<BookingResult> => {
    setBookingLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Combine date and time
      const appointmentDateTime = `${appointmentDate}T${appointmentTime}:00`;

      // Check availability first
      const availabilityCheck = await checkSlotAvailability(
        counselorId,
        appointmentDateTime,
        durationMinutes
      );

      if (!availabilityCheck.available) {
        // Generate alternative time suggestions
        const alternatives = await generateAlternativeSlots(
          counselorId,
          appointmentDate,
          appointmentTime
        );

        toast({
          title: "Time Slot Unavailable",
          description:
            availabilityCheck.reason || "This time slot is not available.",
          variant: "destructive",
        });

        return {
          success: false,
          error: availabilityCheck.reason || "Time slot not available",
          alternatives,
        };
      }

      // Book the appointment
      const { data, error } = await supabase
        .from("appointments")
        .insert({
          user_id: user.id,
          counselor_id: counselorId,
          appointment_date: appointmentDateTime,
          duration_minutes: durationMinutes,
          type: type,
          is_anonymous: isAnonymous,
          status: "scheduled",
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Appointment Booked",
        description: "Your appointment has been successfully scheduled.",
        variant: "default",
      });

      // Refresh appointments list
      await fetchUserAppointments();

      return {
        success: true,
        appointment: data,
      };
    } catch (error) {
      console.error("Error booking appointment:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to book appointment";

      toast({
        title: "Booking Failed",
        description: errorMessage,
        variant: "destructive",
      });

      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setBookingLoading(false);
    }
  };

  const cancelAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: "cancelled" })
        .eq("id", appointmentId);

      if (error) throw error;

      // Refresh appointments list
      await fetchUserAppointments();
      return { error: null };
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      return { error };
    }
  };

  const generateAlternativeSlots = useCallback(
    async (
      counselorId: string,
      requestedDate: string,
      requestedTime: string
    ): Promise<string[]> => {
      try {
        const counselor = counselors.find((c) => c.id === counselorId);
        if (!counselor) return [];

        const date = new Date(requestedDate);
        const alternatives: string[] = [];

        // Check next 3 days for available slots
        for (let dayOffset = 0; dayOffset < 3; dayOffset++) {
          const checkDate = new Date(date);
          checkDate.setDate(date.getDate() + dayOffset);

          const slots = await getAvailableSlots(counselor, checkDate);
          const availableSlots = slots
            .filter((slot) => slot.available)
            .slice(0, 3) // Limit to 3 slots per day
            .map(
              (slot) => `${checkDate.toISOString().split("T")[0]} ${slot.time}`
            );

          alternatives.push(...availableSlots);

          if (alternatives.length >= 5) break; // Limit total alternatives
        }

        return alternatives.slice(0, 5);
      } catch (error) {
        console.error("Error generating alternatives:", error);
        return [];
      }
    },
    [counselors]
  );

  const getAvailableSlots = useCallback(
    async (counselor: Counselor, date: Date): Promise<TimeSlot[]> => {
      try {
        // Get counselor's schedule for the day
        const schedule = counselor.availability_schedule;
        const dayNames = [
          "sunday",
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
        ];
        const dayName = dayNames[date.getDay()];

        if (!schedule || !schedule[dayName]) {
          return [];
        }

        // Generate time slots based on schedule - handle both array formats
        const allSlots: TimeSlot[] = [];
        const scheduleData = schedule[dayName];

        // Handle different schedule formats:
        // 1. Array of strings with hyphens: ["09:00-17:00"]
        // 2. Array of 2 items without hyphen: ["09:00", "17:00"] (old format)
        // 3. Single string (fallback)
        const timeRanges = Array.isArray(scheduleData)
          ? scheduleData
          : [scheduleData];

        timeRanges.forEach((range: string | string[], index: number) => {
          let start: string, end: string;

          // Handle old format: array of exactly 2 items without hyphen
          if (Array.isArray(range) && range.length === 2) {
            [start, end] = range;
          }
          // Handle new format: string with hyphen
          else if (typeof range === "string" && range.includes("-")) {
            [start, end] = range.split("-");
          }
          // Handle old format when schedule[dayName] itself is an array of 2 strings
          else if (
            typeof range === "string" &&
            !range.includes("-") &&
            timeRanges.length === 2 &&
            index === 0
          ) {
            start = range;
            end = timeRanges[1] as string;
            // Skip the second iteration since we handle both items here
            timeRanges.splice(1, 1);
          } else {
            return; // Skip invalid formats
          }

          const startHour = parseInt(start.split(":")[0]);
          const startMinute = parseInt(start.split(":")[1] || "0");
          const endHour = parseInt(end.split(":")[0]);
          const endMinute = parseInt(end.split(":")[1] || "0");

          let currentHour = startHour;
          let currentMinute = startMinute;

          while (
            currentHour < endHour ||
            (currentHour === endHour && currentMinute < endMinute)
          ) {
            const timeString = `${currentHour
              .toString()
              .padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")}`;
            allSlots.push({ time: timeString, available: true });

            // Move to next 30-minute slot
            currentMinute += 30;
            if (currentMinute >= 60) {
              currentMinute = 0;
              currentHour++;
            }
          }
        });

        // Check existing appointments for this counselor on this date
        const dateString = date.toISOString().split("T")[0];
        const { data: existingAppointments, error } = await supabase
          .from("appointments")
          .select("appointment_date, duration_minutes")
          .eq("counselor_id", counselor.id)
          .eq("status", "scheduled")
          .gte("appointment_date", `${dateString}T00:00:00`)
          .lt("appointment_date", `${dateString}T23:59:59`);

        if (error) {
          console.error("Error fetching existing appointments:", error);
          return allSlots; // Return all slots as available if we can't check
        }

        // Mark conflicting slots as unavailable
        const bookedTimes =
          existingAppointments?.map((apt) => {
            const appointmentTime = new Date(apt.appointment_date);
            const timeString = appointmentTime.toLocaleTimeString("en-IN", {
              timeZone: LOCALE_CONFIG.timezone,
              hour12: false,
              hour: "2-digit",
              minute: "2-digit",
            });
            return {
              time: timeString,
              duration: apt.duration_minutes,
            };
          }) || [];

        return allSlots.map((slot) => {
          const slotTime = slot.time;

          // Check if this slot conflicts with any booked appointment
          for (const booked of bookedTimes) {
            if (booked.time === slotTime) {
              return {
                time: slotTime,
                available: false,
                reason: "Time slot already booked",
              };
            }
          }

          return slot;
        });
      } catch (error) {
        console.error("Error getting available slots:", error);
        return [];
      }
    },
    []
  );

  const getCounselorAvailability = useCallback(
    async (counselorId: string, startDate: Date, endDate: Date) => {
      const counselor = counselors.find((c) => c.id === counselorId);
      if (!counselor) return {};

      const availability: { [date: string]: TimeSlot[] } = {};
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const dateString = currentDate.toISOString().split("T")[0];
        availability[dateString] = await getAvailableSlots(
          counselor,
          new Date(currentDate)
        );
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return availability;
    },
    [counselors, getAvailableSlots]
  );

  return {
    counselors,
    appointments,
    loading,
    bookingLoading,
    bookAppointment,
    cancelAppointment,
    getAvailableSlots,
    checkSlotAvailability,
    getCounselorAvailability,
    generateAlternativeSlots,
    refreshAppointments: fetchUserAppointments,
  };
};
