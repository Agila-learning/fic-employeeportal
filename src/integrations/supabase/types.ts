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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          message: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          message: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          message?: string
          title?: string
        }
        Relationships: []
      }
      attendance: {
        Row: {
          date: string
          face_photo_url: string | null
          half_day: boolean | null
          id: string
          latitude: number | null
          leave_reason: string | null
          location_verified: boolean | null
          longitude: number | null
          marked_at: string
          status: string
          user_id: string
          work_location: string | null
        }
        Insert: {
          date?: string
          face_photo_url?: string | null
          half_day?: boolean | null
          id?: string
          latitude?: number | null
          leave_reason?: string | null
          location_verified?: boolean | null
          longitude?: number | null
          marked_at?: string
          status: string
          user_id: string
          work_location?: string | null
        }
        Update: {
          date?: string
          face_photo_url?: string | null
          half_day?: boolean | null
          id?: string
          latitude?: number | null
          leave_reason?: string | null
          location_verified?: boolean | null
          longitude?: number | null
          marked_at?: string
          status?: string
          user_id?: string
          work_location?: string | null
        }
        Relationships: []
      }
      bda_candidate_entries: {
        Row: {
          agent_name: string | null
          candidate_name: string
          comments: string | null
          created_at: string
          domain: string
          id: string
          location: string | null
          mobile_number: string
          report_date: string
          report_id: string | null
          user_id: string
        }
        Insert: {
          agent_name?: string | null
          candidate_name: string
          comments?: string | null
          created_at?: string
          domain: string
          id?: string
          location?: string | null
          mobile_number: string
          report_date?: string
          report_id?: string | null
          user_id: string
        }
        Update: {
          agent_name?: string | null
          candidate_name?: string
          comments?: string | null
          created_at?: string
          domain?: string
          id?: string
          location?: string | null
          mobile_number?: string
          report_date?: string
          report_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bda_candidate_entries_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "employee_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_reports: {
        Row: {
          afternoon_description: string | null
          agent_name: string | null
          candidate_name: string | null
          candidates_screened: number | null
          comments: string | null
          created_at: string
          department: Database["public"]["Enums"]["department"]
          domain: string | null
          id: string
          location: string | null
          mobile_number: string | null
          morning_description: string | null
          report_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          afternoon_description?: string | null
          agent_name?: string | null
          candidate_name?: string | null
          candidates_screened?: number | null
          comments?: string | null
          created_at?: string
          department: Database["public"]["Enums"]["department"]
          domain?: string | null
          id?: string
          location?: string | null
          mobile_number?: string | null
          morning_description?: string | null
          report_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          afternoon_description?: string | null
          agent_name?: string | null
          candidate_name?: string | null
          candidates_screened?: number | null
          comments?: string | null
          created_at?: string
          department?: Database["public"]["Enums"]["department"]
          domain?: string | null
          id?: string
          location?: string | null
          mobile_number?: string | null
          morning_description?: string | null
          report_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      holidays: {
        Row: {
          created_at: string
          created_by: string
          date: string
          id: string
          name: string
          type: string
        }
        Insert: {
          created_at?: string
          created_by: string
          date: string
          id?: string
          name: string
          type: string
        }
        Update: {
          created_at?: string
          created_by?: string
          date?: string
          id?: string
          name?: string
          type?: string
        }
        Relationships: []
      }
      lead_access_audit: {
        Row: {
          accessed_at: string
          accessed_fields: string[] | null
          action: string
          id: string
          ip_address: string | null
          lead_id: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accessed_at?: string
          accessed_fields?: string[] | null
          action: string
          id?: string
          ip_address?: string | null
          lead_id?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accessed_at?: string
          accessed_fields?: string[] | null
          action?: string
          id?: string
          ip_address?: string | null
          lead_id?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_access_audit_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_comments: {
        Row: {
          comment: string
          created_at: string
          id: string
          lead_id: string
          user_id: string | null
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          lead_id: string
          user_id?: string | null
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          lead_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_comments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          lead_id: string
          new_status: Database["public"]["Enums"]["lead_status"]
          notes: string | null
          old_status: Database["public"]["Enums"]["lead_status"] | null
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          lead_id: string
          new_status: Database["public"]["Enums"]["lead_status"]
          notes?: string | null
          old_status?: Database["public"]["Enums"]["lead_status"] | null
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          lead_id?: string
          new_status?: Database["public"]["Enums"]["lead_status"]
          notes?: string | null
          old_status?: Database["public"]["Enums"]["lead_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_status_history_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          candidate_id: string
          created_at: string
          created_by: string | null
          current_ctc: string | null
          email: string | null
          expected_ctc: string | null
          followup_count: number | null
          followup_date: string | null
          id: string
          interested_domain:
            | Database["public"]["Enums"]["interested_domain"]
            | null
          name: string
          notes: string | null
          past_experience: string | null
          payment_slip_url: string | null
          payment_stage: Database["public"]["Enums"]["payment_stage"] | null
          phone: string
          qualification: string | null
          resume_url: string | null
          source: Database["public"]["Enums"]["lead_source"]
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          candidate_id: string
          created_at?: string
          created_by?: string | null
          current_ctc?: string | null
          email?: string | null
          expected_ctc?: string | null
          followup_count?: number | null
          followup_date?: string | null
          id?: string
          interested_domain?:
            | Database["public"]["Enums"]["interested_domain"]
            | null
          name: string
          notes?: string | null
          past_experience?: string | null
          payment_slip_url?: string | null
          payment_stage?: Database["public"]["Enums"]["payment_stage"] | null
          phone: string
          qualification?: string | null
          resume_url?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          candidate_id?: string
          created_at?: string
          created_by?: string | null
          current_ctc?: string | null
          email?: string | null
          expected_ctc?: string | null
          followup_count?: number | null
          followup_date?: string | null
          id?: string
          interested_domain?:
            | Database["public"]["Enums"]["interested_domain"]
            | null
          name?: string
          notes?: string | null
          past_experience?: string | null
          payment_slip_url?: string | null
          payment_stage?: Database["public"]["Enums"]["payment_stage"] | null
          phone?: string
          qualification?: string | null
          resume_url?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          employee_id: string | null
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          employee_id?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          employee_id?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_by: string
          assigned_to: string
          created_at: string
          description: string | null
          due_date: string | null
          email_sent: boolean | null
          id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_by: string
          assigned_to: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          email_sent?: boolean | null
          id?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_by?: string
          assigned_to?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          email_sent?: boolean | null
          id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "employee"
      department:
        | "BDA"
        | "HR"
        | "Tech"
        | "Ops"
        | "Marketing"
        | "Finance"
        | "Other"
      interested_domain: "it" | "non_it" | "banking"
      lead_source:
        | "social_media"
        | "own_source"
        | "college"
        | "referral"
        | "job_portal"
        | "website"
        | "other"
      lead_status:
        | "nc1"
        | "nc2"
        | "nc3"
        | "rejected"
        | "not_interested"
        | "not_interested_paid"
        | "different_domain"
        | "converted"
        | "follow_up"
        | "success"
      payment_stage:
        | "registration_done"
        | "initial_payment_done"
        | "full_payment_done"
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
      app_role: ["admin", "employee"],
      department: ["BDA", "HR", "Tech", "Ops", "Marketing", "Finance", "Other"],
      interested_domain: ["it", "non_it", "banking"],
      lead_source: [
        "social_media",
        "own_source",
        "college",
        "referral",
        "job_portal",
        "website",
        "other",
      ],
      lead_status: [
        "nc1",
        "nc2",
        "nc3",
        "rejected",
        "not_interested",
        "not_interested_paid",
        "different_domain",
        "converted",
        "follow_up",
        "success",
      ],
      payment_stage: [
        "registration_done",
        "initial_payment_done",
        "full_payment_done",
      ],
    },
  },
} as const
