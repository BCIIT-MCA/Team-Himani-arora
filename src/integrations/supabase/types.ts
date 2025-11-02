export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5";
  };
  public: {
    Tables: {
      appointments: {
        Row: {
          appointment_date: string;
          counselor_id: string;
          created_at: string;
          duration_minutes: number;
          id: string;
          is_anonymous: boolean;
          notes: string | null;
          status: string;
          type: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          appointment_date: string;
          counselor_id: string;
          created_at?: string;
          duration_minutes?: number;
          id?: string;
          is_anonymous?: boolean;
          notes?: string | null;
          status?: string;
          type?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          appointment_date?: string;
          counselor_id?: string;
          created_at?: string;
          duration_minutes?: number;
          id?: string;
          is_anonymous?: boolean;
          notes?: string | null;
          status?: string;
          type?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "appointments_counselor_id_fkey";
            columns: ["counselor_id"];
            isOneToOne: false;
            referencedRelation: "counselors";
            referencedColumns: ["id"];
          }
        ];
      };
      chat_conversations: {
        Row: {
          created_at: string;
          id: string;
          title: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          title?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          title?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      chat_messages: {
        Row: {
          content: string;
          conversation_id: string;
          created_at: string;
          id: string;
          role: string;
        };
        Insert: {
          content: string;
          conversation_id: string;
          created_at?: string;
          id?: string;
          role: string;
        };
        Update: {
          content?: string;
          conversation_id?: string;
          created_at?: string;
          id?: string;
          role?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "chat_conversations";
            referencedColumns: ["id"];
          }
        ];
      };
      community_posts: {
        Row: {
          category: string;
          content: string;
          created_at: string;
          downvote_count: number;
          id: string;
          is_anonymous: boolean;
          is_moderated: boolean;
          moderated_by: string | null;
          reply_count: number;
          title: string;
          updated_at: string;
          upvote_count: number;
          user_id: string;
        };
        Insert: {
          category: string;
          content: string;
          created_at?: string;
          downvote_count?: number;
          id?: string;
          is_anonymous?: boolean;
          is_moderated?: boolean;
          moderated_by?: string | null;
          reply_count?: number;
          title: string;
          updated_at?: string;
          upvote_count?: number;
          user_id: string;
        };
        Update: {
          category?: string;
          content?: string;
          created_at?: string;
          downvote_count?: number;
          id?: string;
          is_anonymous?: boolean;
          is_moderated?: boolean;
          moderated_by?: string | null;
          reply_count?: number;
          title?: string;
          updated_at?: string;
          upvote_count?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "community_posts_moderated_by_fkey";
            columns: ["moderated_by"];
            isOneToOne: false;
            referencedRelation: "peer_moderators";
            referencedColumns: ["id"];
          }
        ];
      };
      community_replies: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          is_anonymous: boolean;
          is_moderated: boolean;
          moderated_by: string | null;
          post_id: string;
          upvote_count: number;
          user_id: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          id?: string;
          is_anonymous?: boolean;
          is_moderated?: boolean;
          moderated_by?: string | null;
          post_id: string;
          upvote_count?: number;
          user_id: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          is_anonymous?: boolean;
          is_moderated?: boolean;
          moderated_by?: string | null;
          post_id?: string;
          upvote_count?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "community_replies_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "community_posts";
            referencedColumns: ["id"];
          }
        ];
      };
      counselors: {
        Row: {
          availability_schedule: Json;
          bio: string | null;
          contact_method: string;
          created_at: string;
          experience_years: number;
          id: string;
          is_active: boolean;
          languages: string[];
          name: string;
          qualifications: string | null;
          rating: number | null;
          specialties: string[];
          updated_at: string;
        };
        Insert: {
          availability_schedule?: Json;
          bio?: string | null;
          contact_method?: string;
          created_at?: string;
          experience_years?: number;
          id?: string;
          is_active?: boolean;
          languages?: string[];
          name: string;
          qualifications?: string | null;
          rating?: number | null;
          specialties?: string[];
          updated_at?: string;
        };
        Update: {
          availability_schedule?: Json;
          bio?: string | null;
          contact_method?: string;
          created_at?: string;
          experience_years?: number;
          id?: string;
          is_active?: boolean;
          languages?: string[];
          name?: string;
          qualifications?: string | null;
          rating?: number | null;
          specialties?: string[];
          updated_at?: string;
        };
        Relationships: [];
      };
      peer_moderators: {
        Row: {
          created_at: string;
          id: string;
          is_active: boolean;
          specializations: string[];
          training_completed_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          specializations?: string[];
          training_completed_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          specializations?: string[];
          training_completed_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      moderation_audit: {
        Row: {
          id: string;
          moderator_id: string;
          action_type: string;
          target_type: string;
          target_id: string;
          action_details: Record<string, any> | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          moderator_id: string;
          action_type: string;
          target_type: string;
          target_id: string;
          action_details?: Record<string, any> | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          moderator_id?: string;
          action_type?: string;
          target_type?: string;
          target_id?: string;
          action_details?: Record<string, any> | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "moderation_audit_moderator_id_fkey";
            columns: ["moderator_id"];
            isOneToOne: false;
            referencedRelation: "peer_moderators";
            referencedColumns: ["id"];
          }
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          crisis_contact_name: string | null;
          crisis_contact_phone: string | null;
          display_name: string | null;
          id: string;
          is_anonymous: boolean | null;
          preferred_contact_method: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          crisis_contact_name?: string | null;
          crisis_contact_phone?: string | null;
          display_name?: string | null;
          id?: string;
          is_anonymous?: boolean | null;
          preferred_contact_method?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          crisis_contact_name?: string | null;
          crisis_contact_phone?: string | null;
          display_name?: string | null;
          id?: string;
          is_anonymous?: boolean | null;
          preferred_contact_method?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      psychological_assessments: {
        Row: {
          assessment_type: string;
          completed_at: string;
          id: string;
          recommendations: string | null;
          responses: Json;
          score: number | null;
          severity_level: string | null;
          user_id: string;
        };
        Insert: {
          assessment_type: string;
          completed_at?: string;
          id?: string;
          recommendations?: string | null;
          responses: Json;
          score?: number | null;
          severity_level?: string | null;
          user_id: string;
        };
        Update: {
          assessment_type?: string;
          completed_at?: string;
          id?: string;
          recommendations?: string | null;
          responses?: Json;
          score?: number | null;
          severity_level?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      resources: {
        Row: {
          category: string;
          created_at: string;
          description: string;
          estimated_duration: number | null;
          featured: boolean;
          id: string;
          is_active: boolean;
          title: string;
          type: string;
          updated_at: string;
          url: string | null;
        };
        Insert: {
          category: string;
          created_at?: string;
          description: string;
          estimated_duration?: number | null;
          featured?: boolean;
          id?: string;
          is_active?: boolean;
          title: string;
          type: string;
          updated_at?: string;
          url?: string | null;
        };
        Update: {
          category?: string;
          created_at?: string;
          description?: string;
          estimated_duration?: number | null;
          featured?: boolean;
          id?: string;
          is_active?: boolean;
          title?: string;
          type?: string;
          updated_at?: string;
          url?: string | null;
        };
        Relationships: [];
      };
      events: {
        Row: {
          created_at: string;
          current_attendees: number;
          description: string;
          event_date: string;
          event_type: string | null;
          id: string;
          is_active: boolean;
          location: string | null;
          max_attendees: number | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          current_attendees?: number;
          description: string;
          event_date: string;
          event_type?: string | null;
          id?: string;
          is_active?: boolean;
          location?: string | null;
          max_attendees?: number | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          current_attendees?: number;
          description?: string;
          event_date?: string;
          event_type?: string | null;
          id?: string;
          is_active?: boolean;
          location?: string | null;
          max_attendees?: number | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      event_registrations: {
        Row: {
          created_at: string;
          event_id: string;
          id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          event_id: string;
          id?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          event_id?: string;
          id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          }
        ];
      };
      community_votes: {
        Row: {
          created_at: string;
          id: string;
          post_id: string | null;
          reply_id: string | null;
          user_id: string;
          vote_type: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          post_id?: string | null;
          reply_id?: string | null;
          user_id: string;
          vote_type: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          post_id?: string | null;
          reply_id?: string | null;
          user_id?: string;
          vote_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "community_votes_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "community_posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "community_votes_reply_id_fkey";
            columns: ["reply_id"];
            isOneToOne: false;
            referencedRelation: "community_replies";
            referencedColumns: ["id"];
          }
        ];
      };
      notifications: {
        Row: {
          created_at: string;
          data: Json | null;
          id: string;
          message: string;
          read: boolean;
          title: string;
          type: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          data?: Json | null;
          id?: string;
          message: string;
          read?: boolean;
          title: string;
          type: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          data?: Json | null;
          id?: string;
          message?: string;
          read?: boolean;
          title?: string;
          type?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      notification_preferences: {
        Row: {
          appointment_reminders: boolean;
          community_updates: boolean;
          created_at: string;
          crisis_notifications: boolean;
          email_notifications: boolean;
          id: string;
          moderation_alerts: boolean;
          push_notifications: boolean;
          sms_notifications: boolean;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          appointment_reminders?: boolean;
          community_updates?: boolean;
          created_at?: string;
          crisis_notifications?: boolean;
          email_notifications?: boolean;
          id?: string;
          moderation_alerts?: boolean;
          push_notifications?: boolean;
          sms_notifications?: boolean;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          appointment_reminders?: boolean;
          community_updates?: boolean;
          created_at?: string;
          crisis_notifications?: boolean;
          email_notifications?: boolean;
          id?: string;
          moderation_alerts?: boolean;
          push_notifications?: boolean;
          sms_notifications?: boolean;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      moderation_actions: {
        Row: {
          action: string;
          created_at: string;
          id: string;
          moderator_id: string;
          post_id: string | null;
          reason: string | null;
          reply_id: string | null;
        };
        Insert: {
          action: string;
          created_at?: string;
          id?: string;
          moderator_id: string;
          post_id?: string | null;
          reason?: string | null;
          reply_id?: string | null;
        };
        Update: {
          action?: string;
          created_at?: string;
          id?: string;
          moderator_id?: string;
          post_id?: string | null;
          reason?: string | null;
          reply_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "moderation_actions_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "community_posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "moderation_actions_reply_id_fkey";
            columns: ["reply_id"];
            isOneToOne: false;
            referencedRelation: "community_replies";
            referencedColumns: ["id"];
          }
        ];
      };
      crisis_alerts: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          is_resolved: boolean;
          metadata: Json | null;
          resolved_at: string | null;
          resolved_by: string | null;
          severity: string;
          trigger_source: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          id?: string;
          is_resolved?: boolean;
          metadata?: Json | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          severity: string;
          trigger_source: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          is_resolved?: boolean;
          metadata?: Json | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          severity?: string;
          trigger_source?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      crisis_detection_queue: {
        Row: {
          content_id: string;
          content_text: string;
          content_type: string;
          created_at: string;
          id: string;
          processed: boolean;
          processed_at: string | null;
          user_id: string;
        };
        Insert: {
          content_id: string;
          content_text: string;
          content_type: string;
          created_at?: string;
          id?: string;
          processed?: boolean;
          processed_at?: string | null;
          user_id: string;
        };
        Update: {
          content_id?: string;
          content_text?: string;
          content_type?: string;
          created_at?: string;
          id?: string;
          processed?: boolean;
          processed_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      community_posts_with_profiles: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          category: string;
          is_anonymous: boolean;
          is_moderated: boolean;
          moderated_by: string | null;
          upvote_count: number;
          downvote_count: number;
          reply_count: number;
          created_at: string;
          updated_at: string;
          display_name: string | null;
          avatar_url: string | null;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      community_replies_with_profiles: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          content: string;
          is_anonymous: boolean;
          is_moderated: boolean;
          moderated_by: string | null;
          upvote_count: number;
          downvote_count: number;
          created_at: string;
          updated_at: string;
          display_name: string | null;
          avatar_url: string | null;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Functions: {
      enqueue_notification: {
        Args: {
          target_user: string;
          notification_type: string;
          channel_hint: string;
          notification_title: string;
          notification_message: string;
          notification_payload?: Json;
        };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
      DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
      DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
