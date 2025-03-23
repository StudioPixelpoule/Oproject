export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          is_admin: boolean | null
          created_at: string | null
        }
        Insert: {
          id: string
          email: string
          is_admin?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          is_admin?: boolean | null
          created_at?: string | null
        }
      }
      projects: {
        Row: {
          id: string
          title: string
          description: string | null
          type: string
          status: string
          start_date: string | null
          deadline: string | null
          stack: string | null
          github_url: string | null
          deploy_url: string | null
          database_provider: string | null
          database_name: string | null
          created_at: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          type: string
          status: string
          start_date?: string | null
          deadline?: string | null
          stack?: string | null
          github_url?: string | null
          deploy_url?: string | null
          database_provider?: string | null
          database_name?: string | null
          created_at?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          type?: string
          status?: string
          start_date?: string | null
          deadline?: string | null
          stack?: string | null
          github_url?: string | null
          deploy_url?: string | null
          database_provider?: string | null
          database_name?: string | null
          created_at?: string | null
          user_id?: string | null
        }
      }
      tasks: {
        Row: {
          id: string
          project_id: string | null
          title: string
          status: string
          notes: string | null
          created_at: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          project_id?: string | null
          title: string
          status: string
          notes?: string | null
          created_at?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          project_id?: string | null
          title?: string
          status?: string
          notes?: string | null
          created_at?: string | null
          user_id?: string | null
        }
      }
      notes: {
        Row: {
          id: string
          project_id: string | null
          content: string
          created_at: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          project_id?: string | null
          content: string
          created_at?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          project_id?: string | null
          content?: string
          created_at?: string | null
          user_id?: string | null
        }
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
  }
}