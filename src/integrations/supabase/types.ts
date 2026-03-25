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
          content: string
          created_at: string
          id: string
          published: boolean
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          published?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          published?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      bible_bookmarks: {
        Row: {
          bible_version: string
          book: string
          chapter: number
          created_at: string
          id: string
          title: string | null
          user_id: string
          verse: number | null
        }
        Insert: {
          bible_version?: string
          book: string
          chapter: number
          created_at?: string
          id?: string
          title?: string | null
          user_id: string
          verse?: number | null
        }
        Update: {
          bible_version?: string
          book?: string
          chapter?: number
          created_at?: string
          id?: string
          title?: string | null
          user_id?: string
          verse?: number | null
        }
        Relationships: []
      }
      bible_highlights: {
        Row: {
          bible_version: string
          book: string
          chapter: number
          color: string
          created_at: string
          id: string
          note: string | null
          user_id: string
          verse: number
          verse_end: number | null
        }
        Insert: {
          bible_version?: string
          book: string
          chapter: number
          color?: string
          created_at?: string
          id?: string
          note?: string | null
          user_id: string
          verse: number
          verse_end?: number | null
        }
        Update: {
          bible_version?: string
          book?: string
          chapter?: number
          color?: string
          created_at?: string
          id?: string
          note?: string | null
          user_id?: string
          verse?: number
          verse_end?: number | null
        }
        Relationships: []
      }
      carousel_images: {
        Row: {
          alt_text: string
          created_at: string
          id: string
          image_url: string
          is_active: boolean
          sort_order: number
          updated_at: string
        }
        Insert: {
          alt_text?: string
          created_at?: string
          id?: string
          image_url: string
          is_active?: boolean
          sort_order?: number
          updated_at?: string
        }
        Update: {
          alt_text?: string
          created_at?: string
          id?: string
          image_url?: string
          is_active?: boolean
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      choir_members: {
        Row: {
          created_at: string
          email: string | null
          first_name: string
          id: string
          is_approved: boolean
          last_name: string
          phone: string | null
          updated_at: string
          voice_part: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          is_approved?: boolean
          last_name: string
          phone?: string | null
          updated_at?: string
          voice_part?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          is_approved?: boolean
          last_name?: string
          phone?: string | null
          updated_at?: string
          voice_part?: string
        }
        Relationships: []
      }
      choir_photos: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          image_url: string
          is_group_photo: boolean
          updated_at: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url: string
          is_group_photo?: boolean
          updated_at?: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string
          is_group_photo?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      choir_practice_schedule: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          location: string | null
          notes: string | null
          practice_day: string
          practice_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          location?: string | null
          notes?: string | null
          practice_day: string
          practice_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          location?: string | null
          notes?: string | null
          practice_day?: string
          practice_time?: string
          updated_at?: string
        }
        Relationships: []
      }
      counseling_sessions: {
        Row: {
          action_items: string | null
          counselor_id: string | null
          created_at: string
          id: string
          member_id: string | null
          next_session_date: string | null
          notes: string | null
          session_date: string
          session_type: string
          status: string
          topics: string[] | null
          updated_at: string
        }
        Insert: {
          action_items?: string | null
          counselor_id?: string | null
          created_at?: string
          id?: string
          member_id?: string | null
          next_session_date?: string | null
          notes?: string | null
          session_date: string
          session_type?: string
          status?: string
          topics?: string[] | null
          updated_at?: string
        }
        Update: {
          action_items?: string | null
          counselor_id?: string | null
          created_at?: string
          id?: string
          member_id?: string | null
          next_session_date?: string | null
          notes?: string | null
          session_date?: string
          session_type?: string
          status?: string
          topics?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "counseling_sessions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      downloadable_resources: {
        Row: {
          category: string
          created_at: string
          description: string | null
          file_size_bytes: number | null
          file_url: string
          id: string
          language: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          file_size_bytes?: number | null
          file_url: string
          id?: string
          language: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          file_size_bytes?: number | null
          file_url?: string
          id?: string
          language?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      event_registrations: {
        Row: {
          amount_paid: number | null
          checked_in: boolean | null
          created_at: string
          event_id: string | null
          guest_email: string | null
          guest_name: string | null
          id: string
          member_id: string | null
          payment_status: string | null
          quantity: number | null
        }
        Insert: {
          amount_paid?: number | null
          checked_in?: boolean | null
          created_at?: string
          event_id?: string | null
          guest_email?: string | null
          guest_name?: string | null
          id?: string
          member_id?: string | null
          payment_status?: string | null
          quantity?: number | null
        }
        Update: {
          amount_paid?: number | null
          checked_in?: boolean | null
          created_at?: string
          event_id?: string | null
          guest_email?: string | null
          guest_name?: string | null
          id?: string
          member_id?: string | null
          payment_status?: string | null
          quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          category: string
          created_at: string
          description: string | null
          event_date: string
          event_time: string | null
          id: string
          location: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          event_date: string
          event_time?: string | null
          id?: string
          location?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          event_date?: string
          event_time?: string | null
          id?: string
          location?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      families: {
        Row: {
          address: string | null
          created_at: string
          head_of_household_id: string | null
          home_phone: string | null
          id: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          head_of_household_id?: string | null
          home_phone?: string | null
          id?: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          head_of_household_id?: string | null
          home_phone?: string | null
          id?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "families_head_of_household_id_fkey"
            columns: ["head_of_household_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_photos: {
        Row: {
          caption: string | null
          category: string
          created_at: string
          id: string
          image_url: string
          title: string
          updated_at: string
        }
        Insert: {
          caption?: string | null
          category?: string
          created_at?: string
          id?: string
          image_url: string
          title: string
          updated_at?: string
        }
        Update: {
          caption?: string | null
          category?: string
          created_at?: string
          id?: string
          image_url?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      gallery_videos: {
        Row: {
          caption: string | null
          category: string
          created_at: string
          id: string
          title: string
          updated_at: string
          video_url: string
        }
        Insert: {
          caption?: string | null
          category?: string
          created_at?: string
          id?: string
          title: string
          updated_at?: string
          video_url: string
        }
        Update: {
          caption?: string | null
          category?: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          video_url?: string
        }
        Relationships: []
      }
      giving_funds: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      giving_pledges: {
        Row: {
          created_at: string
          end_date: string | null
          fund_id: string | null
          id: string
          member_id: string | null
          pledge_amount: number
          pledge_frequency: string | null
          start_date: string
          status: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          fund_id?: string | null
          id?: string
          member_id?: string | null
          pledge_amount: number
          pledge_frequency?: string | null
          start_date: string
          status?: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          fund_id?: string | null
          id?: string
          member_id?: string | null
          pledge_amount?: number
          pledge_frequency?: string | null
          start_date?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "giving_pledges_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "giving_funds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "giving_pledges_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      giving_transactions: {
        Row: {
          amount: number
          created_at: string
          fund_id: string | null
          id: string
          is_recurring: boolean | null
          member_id: string | null
          payment_method: string | null
          status: string
          transaction_date: string
          transaction_ref: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          fund_id?: string | null
          id?: string
          is_recurring?: boolean | null
          member_id?: string | null
          payment_method?: string | null
          status?: string
          transaction_date?: string
          transaction_ref?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          fund_id?: string | null
          id?: string
          is_recurring?: boolean | null
          member_id?: string | null
          payment_method?: string | null
          status?: string
          transaction_date?: string
          transaction_ref?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "giving_transactions_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "giving_funds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "giving_transactions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      home_prayer_locations: {
        Row: {
          address: string
          created_at: string
          host_name: string
          id: string
          notes: string | null
          prayer_date: string
          updated_at: string
        }
        Insert: {
          address: string
          created_at?: string
          host_name: string
          id?: string
          notes?: string | null
          prayer_date: string
          updated_at?: string
        }
        Update: {
          address?: string
          created_at?: string
          host_name?: string
          id?: string
          notes?: string | null
          prayer_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      livestream_videos: {
        Row: {
          created_at: string
          description: string | null
          event_date: string
          id: string
          is_live: boolean
          title: string
          updated_at: string
          video_type: string
          video_url: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_date: string
          id?: string
          is_live?: boolean
          title: string
          updated_at?: string
          video_type?: string
          video_url: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_date?: string
          id?: string
          is_live?: boolean
          title?: string
          updated_at?: string
          video_type?: string
          video_url?: string
        }
        Relationships: []
      }
      members: {
        Row: {
          address: string | null
          baptized: boolean
          confirmed_in_church: boolean
          created_at: string
          date_of_birth: string | null
          email: string | null
          family_id: string | null
          first_name: string
          gender: string | null
          id: string
          is_active: boolean
          last_name: string
          league: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          baptized?: boolean
          confirmed_in_church?: boolean
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          family_id?: string | null
          first_name: string
          gender?: string | null
          id?: string
          is_active?: boolean
          last_name: string
          league?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          baptized?: boolean
          confirmed_in_church?: boolean
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          family_id?: string | null
          first_name?: string
          gender?: string | null
          id?: string
          is_active?: boolean
          last_name?: string
          league?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "members_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      ministry_photos: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          image_url: string
          ministry: string
          updated_at: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url: string
          ministry: string
          updated_at?: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string
          ministry?: string
          updated_at?: string
        }
        Relationships: []
      }
      ministry_teams: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          leader_id: string | null
          name: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          leader_id?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          leader_id?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ministry_teams_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          id: string
          is_read: boolean
          link: string | null
          message: string | null
          sent_at: string
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string | null
          sent_at?: string
          title: string
          type?: string
          user_id?: string | null
        }
        Update: {
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string | null
          sent_at?: string
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      pastoral_notes: {
        Row: {
          author_id: string | null
          content: string
          created_at: string
          follow_up_date: string | null
          id: string
          is_confidential: boolean
          member_id: string | null
          note_type: string
          tags: string[] | null
          title: string | null
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string
          follow_up_date?: string | null
          id?: string
          is_confidential?: boolean
          member_id?: string | null
          note_type?: string
          tags?: string[] | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string
          follow_up_date?: string | null
          id?: string
          is_confidential?: boolean
          member_id?: string | null
          note_type?: string
          tags?: string[] | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pastoral_notes_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      prayer_requests: {
        Row: {
          created_at: string
          id: string
          is_public: boolean
          request: string
          requested_by: string | null
          resolved: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_public?: boolean
          request: string
          requested_by?: string | null
          resolved?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_public?: boolean
          request?: string
          requested_by?: string | null
          resolved?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      preaching_schedule: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          preacher_name: string
          service_date: string
          service_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          preacher_name: string
          service_date: string
          service_type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          preacher_name?: string
          service_date?: string
          service_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      project_photos: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          image_url: string
          project_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url: string
          project_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_photos_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          amount_raised: number | null
          created_at: string
          description: string | null
          id: string
          status: string
          target_amount: number | null
          title: string
          updated_at: string
        }
        Insert: {
          amount_raised?: number | null
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          target_amount?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          amount_raised?: number | null
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          target_amount?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      schedule_assignments: {
        Row: {
          created_at: string
          id: string
          member_id: string | null
          role: string | null
          schedule_id: string | null
          status: string
          team_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          member_id?: string | null
          role?: string | null
          schedule_id?: string | null
          status?: string
          team_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          member_id?: string | null
          role?: string | null
          schedule_id?: string | null
          status?: string
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schedule_assignments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_assignments_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "service_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_assignments_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "ministry_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      sermon_series: {
        Row: {
          cover_image: string | null
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          start_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          cover_image?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          start_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          cover_image?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          start_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      sermons: {
        Row: {
          application_points: string[] | null
          audio_url: string | null
          created_at: string
          date_preached: string | null
          draft_content: string | null
          id: string
          illustrations: string | null
          outline: string | null
          published_content: string | null
          scripture_references: string[] | null
          series_id: string | null
          service_type: string | null
          slides_url: string | null
          status: string
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          application_points?: string[] | null
          audio_url?: string | null
          created_at?: string
          date_preached?: string | null
          draft_content?: string | null
          id?: string
          illustrations?: string | null
          outline?: string | null
          published_content?: string | null
          scripture_references?: string[] | null
          series_id?: string | null
          service_type?: string | null
          slides_url?: string | null
          status?: string
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          application_points?: string[] | null
          audio_url?: string | null
          created_at?: string
          date_preached?: string | null
          draft_content?: string | null
          id?: string
          illustrations?: string | null
          outline?: string | null
          published_content?: string | null
          scripture_references?: string[] | null
          series_id?: string | null
          service_type?: string | null
          slides_url?: string | null
          status?: string
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sermons_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "sermon_series"
            referencedColumns: ["id"]
          },
        ]
      }
      service_plans: {
        Row: {
          created_at: string
          duration_minutes: number | null
          element_type: string
          id: string
          notes: string | null
          schedule_id: string | null
          song_id: string | null
          sort_order: number
          title: string | null
        }
        Insert: {
          created_at?: string
          duration_minutes?: number | null
          element_type?: string
          id?: string
          notes?: string | null
          schedule_id?: string | null
          song_id?: string | null
          sort_order?: number
          title?: string | null
        }
        Update: {
          created_at?: string
          duration_minutes?: number | null
          element_type?: string
          id?: string
          notes?: string | null
          schedule_id?: string | null
          song_id?: string | null
          sort_order?: number
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_plans_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "service_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_plans_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "song_library"
            referencedColumns: ["id"]
          },
        ]
      }
      service_schedules: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          service_date: string
          service_time: string | null
          service_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          service_date: string
          service_time?: string | null
          service_type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          service_date?: string
          service_time?: string | null
          service_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      song_library: {
        Row: {
          artist: string | null
          ccli_number: string | null
          chord_chart_url: string | null
          created_at: string
          id: string
          key: string | null
          lyrics: string | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          artist?: string | null
          ccli_number?: string | null
          chord_chart_url?: string | null
          created_at?: string
          id?: string
          key?: string | null
          lyrics?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          artist?: string | null
          ccli_number?: string | null
          chord_chart_url?: string | null
          created_at?: string
          id?: string
          key?: string | null
          lyrics?: string | null
          tags?: string[] | null
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
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      volunteer_assignments: {
        Row: {
          availability: string | null
          created_at: string
          id: string
          member_id: string | null
          role: string | null
          skills: string[] | null
          status: string
          team_id: string | null
          updated_at: string
        }
        Insert: {
          availability?: string | null
          created_at?: string
          id?: string
          member_id?: string | null
          role?: string | null
          skills?: string[] | null
          status?: string
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          availability?: string | null
          created_at?: string
          id?: string
          member_id?: string | null
          role?: string | null
          skills?: string[] | null
          status?: string
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_assignments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_assignments_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "ministry_teams"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_pastor: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user" | "pastor"
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
      app_role: ["admin", "user", "pastor"],
    },
  },
} as const
