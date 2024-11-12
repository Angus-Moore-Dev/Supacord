export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      conversation_messages: {
        Row: {
          conversationId: string
          createdAt: string
          id: string
          isAI: boolean
          messageText: string
          tabId: string
        }
        Insert: {
          conversationId: string
          createdAt?: string
          id?: string
          isAI: boolean
          messageText: string
          tabId: string
        }
        Update: {
          conversationId?: string
          createdAt?: string
          id?: string
          isAI?: boolean
          messageText?: string
          tabId?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_messages_conversationId_fkey"
            columns: ["conversationId"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_messages_tabId_fkey"
            columns: ["tabId"]
            isOneToOne: false
            referencedRelation: "conversation_tabs"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_tabs: {
        Row: {
          conversationId: string
          createdAt: string
          id: string
          position: number
          title: string
        }
        Insert: {
          conversationId: string
          createdAt?: string
          id?: string
          position: number
          title?: string
        }
        Update: {
          conversationId?: string
          createdAt?: string
          id?: string
          position?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_tabs_conversationId_fkey"
            columns: ["conversationId"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          createdAt: string
          id: string
          projectId: string
          title: string
        }
        Insert: {
          createdAt?: string
          id?: string
          projectId: string
          title: string
        }
        Update: {
          createdAt?: string
          id?: string
          projectId?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_projectId_fkey"
            columns: ["projectId"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          anthropicKey: string | null
          country: string
          createdAt: string
          firstName: string
          id: string
          industry: string | null
          lastName: string
          openAIKey: string | null
          purposeOfUse: string | null
        }
        Insert: {
          anthropicKey?: string | null
          country: string
          createdAt?: string
          firstName: string
          id?: string
          industry?: string | null
          lastName: string
          openAIKey?: string | null
          purposeOfUse?: string | null
        }
        Update: {
          anthropicKey?: string | null
          country?: string
          createdAt?: string
          firstName?: string
          id?: string
          industry?: string | null
          lastName?: string
          openAIKey?: string | null
          purposeOfUse?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          createdAt: string
          databaseName: string
          databaseStructure: Json
          id: string
          organisationId: string
          profileId: string
          projectId: string
          selectedSchema: string
        }
        Insert: {
          createdAt?: string
          databaseName: string
          databaseStructure?: Json
          id?: string
          organisationId: string
          profileId: string
          projectId: string
          selectedSchema: string
        }
        Update: {
          createdAt?: string
          databaseName?: string
          databaseStructure?: Json
          id?: string
          organisationId?: string
          profileId?: string
          projectId?: string
          selectedSchema?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_profileId_fkey"
            columns: ["profileId"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_user_macros: {
        Row: {
          createdAt: string
          id: string
          macroTextPrompt: string
          profileId: string
          projectId: string
          storedSQLQuery: string | null
        }
        Insert: {
          createdAt?: string
          id?: string
          macroTextPrompt: string
          profileId: string
          projectId: string
          storedSQLQuery?: string | null
        }
        Update: {
          createdAt?: string
          id?: string
          macroTextPrompt?: string
          profileId?: string
          projectId?: string
          storedSQLQuery?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saved_user_macros_profileId_fkey"
            columns: ["profileId"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_user_macros_projectId_fkey"
            columns: ["projectId"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      supabase_access_tokens: {
        Row: {
          accessToken: string
          accessTokenExpirationUTC: number
          createdAt: string
          id: string
          organisationId: string
          organisationName: string
          profileId: string
          refreshToken: string
        }
        Insert: {
          accessToken: string
          accessTokenExpirationUTC: number
          createdAt?: string
          id?: string
          organisationId: string
          organisationName: string
          profileId: string
          refreshToken: string
        }
        Update: {
          accessToken?: string
          accessTokenExpirationUTC?: number
          createdAt?: string
          id?: string
          organisationId?: string
          organisationName?: string
          profileId?: string
          refreshToken?: string
        }
        Relationships: [
          {
            foreignKeyName: "supabase_access_tokens_profileId_fkey"
            columns: ["profileId"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      supabase_oauth_auth_flow: {
        Row: {
          createdAt: string
          profileId: string
          requestingOrigin: string
          state: string
        }
        Insert: {
          createdAt?: string
          profileId: string
          requestingOrigin?: string
          state?: string
        }
        Update: {
          createdAt?: string
          profileId?: string
          requestingOrigin?: string
          state?: string
        }
        Relationships: [
          {
            foreignKeyName: "supabase_oauth_auth_flow_profileId_fkey"
            columns: ["profileId"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist_emails: {
        Row: {
          createdAt: string
          email: string
          id: string
          location: string
        }
        Insert: {
          createdAt?: string
          email: string
          id?: string
          location: string
        }
        Update: {
          createdAt?: string
          email?: string
          id?: string
          location?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
