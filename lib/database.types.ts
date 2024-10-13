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
      profiles: {
        Row: {
          country: string
          createdAt: string
          firstName: string
          id: string
          industry: string | null
          lastName: string
          purposeOfUse: string | null
        }
        Insert: {
          country: string
          createdAt?: string
          firstName: string
          id?: string
          industry?: string | null
          lastName: string
          purposeOfUse?: string | null
        }
        Update: {
          country?: string
          createdAt?: string
          firstName?: string
          id?: string
          industry?: string | null
          lastName?: string
          purposeOfUse?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      project_links: {
        Row: {
          createdAt: string
          endingNodeId: string
          id: string
          projectId: string
          startingNodeId: string
        }
        Insert: {
          createdAt?: string
          endingNodeId: string
          id?: string
          projectId: string
          startingNodeId: string
        }
        Update: {
          createdAt?: string
          endingNodeId?: string
          id?: string
          projectId?: string
          startingNodeId?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_links_endingNodeId_fkey"
            columns: ["endingNodeId"]
            isOneToOne: false
            referencedRelation: "project_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_links_projectId_fkey"
            columns: ["projectId"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_links_startingNodeId_fkey"
            columns: ["startingNodeId"]
            isOneToOne: false
            referencedRelation: "project_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      project_nodes: {
        Row: {
          createdAt: string
          entityData: Json
          id: string
          projectId: string
          schema: string
          table: string
        }
        Insert: {
          createdAt?: string
          entityData: Json
          id?: string
          projectId: string
          schema: string
          table: string
        }
        Update: {
          createdAt?: string
          entityData?: Json
          id?: string
          projectId?: string
          schema?: string
          table?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_nodes_projectId_fkey"
            columns: ["projectId"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          createdAt: string
          databaseName: string
          databaseStructure: Json[]
          id: string
          organisationId: string
          profileId: string
          projectId: string
          selectedSchema: string
        }
        Insert: {
          createdAt?: string
          databaseName: string
          databaseStructure: Json[]
          id?: string
          organisationId: string
          profileId: string
          projectId: string
          selectedSchema: string
        }
        Update: {
          createdAt?: string
          databaseName?: string
          databaseStructure?: Json[]
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
