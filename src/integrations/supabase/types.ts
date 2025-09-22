export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      academic_periods: {
        Row: {
          created_at: string | null
          end_date: string
          id: string
          is_active: boolean | null
          name: string
          period_type: Database["public"]["Enums"]["academic_period_type"]
          start_date: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          is_active?: boolean | null
          name: string
          period_type: Database["public"]["Enums"]["academic_period_type"]
          start_date: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
          is_active?: boolean | null
          name?: string
          period_type?: Database["public"]["Enums"]["academic_period_type"]
          start_date?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      buildings: {
        Row: {
          address: string | null
          code: string
          created_at: string | null
          floor_count: number | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          code: string
          created_at?: string | null
          floor_count?: number | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          code?: string
          created_at?: string | null
          floor_count?: number | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      cleaning_observation_types: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      cleaning_reports: {
        Row: {
          cleaned_at: string | null
          cleaned_by: string | null
          cleaning_date: string
          created_at: string | null
          id: string
          is_cleaned: boolean | null
          notes: string | null
          observations: Json | null
          room_id: string | null
          updated_at: string | null
        }
        Insert: {
          cleaned_at?: string | null
          cleaned_by?: string | null
          cleaning_date: string
          created_at?: string | null
          id?: string
          is_cleaned?: boolean | null
          notes?: string | null
          observations?: Json | null
          room_id?: string | null
          updated_at?: string | null
        }
        Update: {
          cleaned_at?: string | null
          cleaned_by?: string | null
          cleaning_date?: string
          created_at?: string | null
          id?: string
          is_cleaned?: boolean | null
          notes?: string | null
          observations?: Json | null
          room_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cleaning_reports_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      course_enrollments: {
        Row: {
          course_id: string | null
          enrolled_at: string | null
          id: string
          student_id: string | null
        }
        Insert: {
          course_id?: string | null
          enrolled_at?: string | null
          id?: string
          student_id?: string | null
        }
        Update: {
          course_id?: string | null
          enrolled_at?: string | null
          id?: string
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          academic_period_id: string | null
          code: string
          created_at: string | null
          credits: number | null
          department: string
          description: string | null
          id: string
          max_students: number | null
          name: string
          professor_id: string | null
          updated_at: string | null
        }
        Insert: {
          academic_period_id?: string | null
          code: string
          created_at?: string | null
          credits?: number | null
          department: string
          description?: string | null
          id?: string
          max_students?: number | null
          name: string
          professor_id?: string | null
          updated_at?: string | null
        }
        Update: {
          academic_period_id?: string | null
          code?: string
          created_at?: string | null
          credits?: number | null
          department?: string
          description?: string | null
          id?: string
          max_students?: number | null
          name?: string
          professor_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_academic_period_id_fkey"
            columns: ["academic_period_id"]
            isOneToOne: false
            referencedRelation: "academic_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      faculties: {
        Row: {
          campus: string | null
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          campus?: string | null
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          campus?: string | null
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          category: string
          created_at: string
          id: string
          is_read: boolean
          message: string
          related_id: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          related_id?: string | null
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          related_id?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          can_manage_all_faculties: boolean | null
          created_at: string | null
          department: string | null
          email: string
          faculty_permissions: Json | null
          full_name: string
          id: string
          phone: string | null
          position: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          can_manage_all_faculties?: boolean | null
          created_at?: string | null
          department?: string | null
          email: string
          faculty_permissions?: Json | null
          full_name: string
          id?: string
          phone?: string | null
          position?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          can_manage_all_faculties?: boolean | null
          created_at?: string | null
          department?: string | null
          email?: string
          faculty_permissions?: Json | null
          full_name?: string
          id?: string
          phone?: string | null
          position?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      reservations: {
        Row: {
          attendee_count: number | null
          course_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          end_datetime: string
          equipment_needed: Json | null
          event_type: Database["public"]["Enums"]["event_type"] | null
          id: string
          notes: string | null
          recurring_template_id: string | null
          room_id: string | null
          start_datetime: string
          status: Database["public"]["Enums"]["reservation_status"] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          attendee_count?: number | null
          course_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_datetime: string
          equipment_needed?: Json | null
          event_type?: Database["public"]["Enums"]["event_type"] | null
          id?: string
          notes?: string | null
          recurring_template_id?: string | null
          room_id?: string | null
          start_datetime: string
          status?: Database["public"]["Enums"]["reservation_status"] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          attendee_count?: number | null
          course_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_datetime?: string
          equipment_needed?: Json | null
          event_type?: Database["public"]["Enums"]["event_type"] | null
          id?: string
          notes?: string | null
          recurring_template_id?: string | null
          room_id?: string | null
          start_datetime?: string
          status?: Database["public"]["Enums"]["reservation_status"] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reservations_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_blocks: {
        Row: {
          block_type: string | null
          created_at: string | null
          created_by: string | null
          end_datetime: string
          id: string
          reason: string | null
          room_id: string | null
          start_datetime: string
          title: string
          updated_at: string | null
        }
        Insert: {
          block_type?: string | null
          created_at?: string | null
          created_by?: string | null
          end_datetime: string
          id?: string
          reason?: string | null
          room_id?: string | null
          start_datetime: string
          title: string
          updated_at?: string | null
        }
        Update: {
          block_type?: string | null
          created_at?: string | null
          created_by?: string | null
          end_datetime?: string
          id?: string
          reason?: string | null
          room_id?: string | null
          start_datetime?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "room_blocks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_blocks_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          building_id: string | null
          capacity: number
          code: string
          created_at: string | null
          description: string | null
          faculty_id: string | null
          features: Json | null
          floor: number | null
          id: string
          name: string
          room_type: string | null
          status: Database["public"]["Enums"]["room_status"] | null
          updated_at: string | null
        }
        Insert: {
          building_id?: string | null
          capacity?: number
          code: string
          created_at?: string | null
          description?: string | null
          faculty_id?: string | null
          features?: Json | null
          floor?: number | null
          id?: string
          name: string
          room_type?: string | null
          status?: Database["public"]["Enums"]["room_status"] | null
          updated_at?: string | null
        }
        Update: {
          building_id?: string | null
          capacity?: number
          code?: string
          created_at?: string | null
          description?: string | null
          faculty_id?: string | null
          features?: Json | null
          floor?: number | null
          id?: string
          name?: string
          room_type?: string | null
          status?: Database["public"]["Enums"]["room_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rooms_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "faculties"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_templates: {
        Row: {
          course_id: string | null
          created_at: string | null
          day_of_week: number
          end_time: string
          event_type: Database["public"]["Enums"]["event_type"] | null
          id: string
          is_active: boolean | null
          room_id: string | null
          start_time: string
          updated_at: string | null
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          day_of_week: number
          end_time: string
          event_type?: Database["public"]["Enums"]["event_type"] | null
          id?: string
          is_active?: boolean | null
          room_id?: string | null
          start_time: string
          updated_at?: string | null
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          event_type?: Database["public"]["Enums"]["event_type"] | null
          id?: string
          is_active?: boolean | null
          room_id?: string | null
          start_time?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schedule_templates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_templates_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_notification_recipients: {
        Args: { reservation_id: string }
        Returns: {
          email: string
          full_name: string
          notification_type: string
          role: Database["public"]["Enums"]["user_role"]
        }[]
      }
    }
    Enums: {
      academic_period_type: "semester" | "trimester" | "quarter" | "module"
      event_type:
        | "class"
        | "lab"
        | "seminar"
        | "exam"
        | "meeting"
        | "maintenance"
        | "event"
      reservation_status: "pending" | "confirmed" | "cancelled" | "completed"
      room_status: "available" | "occupied" | "maintenance" | "blocked"
      user_role: "admin" | "coordinator" | "professor" | "student"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      academic_period_type: ["semester", "trimester", "quarter", "module"],
      event_type: [
        "class",
        "lab",
        "seminar",
        "exam",
        "meeting",
        "maintenance",
        "event",
      ],
      reservation_status: ["pending", "confirmed", "cancelled", "completed"],
      room_status: ["available", "occupied", "maintenance", "blocked"],
      user_role: ["admin", "coordinator", "professor", "student"],
    },
  },
} as const
