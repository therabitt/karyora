// TypeScript Definitions for Supabase PostgreSQL Database Schema
// Generated for Karyora based on Blueprint v0.11 and Database Migrations

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ArtworkCategory =
  | "original-character"
  | "fan-art"
  | "portrait"
  | "landscape"
  | "other";

export type ArtworkMedium =
  | "digital-painting"
  | "pixel-art"
  | "vector"
  | "traditional"
  | "mixed-media"
  | "other";

export type ArtworkStatus = "draft" | "published";

export type CommissionAvailability = "open" | "waitlist" | "closed";

export type InquiryStatus =
  | "new"
  | "reviewing"
  | "accepted"
  | "declined"
  | "completed";

export type PendingUploadPurpose = "artwork_source" | "profile_avatar";

export type PendingUploadState =
  | "pending"
  | "validated"
  | "consumed"
  | "rejected"
  | "cleanup_pending";

export type CleanupReason =
  | "unpublish"
  | "replace"
  | "delete"
  | "rollback"
  | "expired_upload";

export type CleanupState = "queued" | "processing";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          bio: string;
          avatar_path: string | null;
          contact_email: string | null;
          social_links: Json;
          commission_availability: CommissionAvailability;
          availability_message: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          bio?: string;
          avatar_path?: string | null;
          contact_email?: string | null;
          social_links?: Json;
          commission_availability?: CommissionAvailability;
          availability_message?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          bio?: string;
          avatar_path?: string | null;
          contact_email?: string | null;
          social_links?: Json;
          commission_availability?: CommissionAvailability;
          availability_message?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      commission_offerings: {
        Row: {
          id: string;
          profile_id: string;
          title: string;
          slug: string;
          description: string;
          price_from: number | null;
          price_currency: string;
          is_active: boolean;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          title: string;
          slug: string;
          description?: string;
          price_from?: number | null;
          price_currency?: string;
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          title?: string;
          slug?: string;
          description?: string;
          price_from?: number | null;
          price_currency?: string;
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "commission_offerings_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      artworks: {
        Row: {
          id: string;
          profile_id: string;
          title: string;
          slug: string;
          description: string;
          alt_text: string;
          category: ArtworkCategory;
          medium: ArtworkMedium;
          tags: string[];
          search_vector: string;
          private_image_path: string;
          public_image_path: string | null;
          status: ArtworkStatus;
          is_featured: boolean;
          published_at: string | null;
          palette_metadata?: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          title: string;
          slug: string;
          description?: string;
          alt_text: string;
          category?: ArtworkCategory;
          medium?: ArtworkMedium;
          tags?: string[];
          search_vector?: string;
          private_image_path: string;
          public_image_path?: string | null;
          status?: ArtworkStatus;
          is_featured?: boolean;
          published_at?: string | null;
          palette_metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          title?: string;
          slug?: string;
          description?: string;
          alt_text?: string;
          category?: ArtworkCategory;
          medium?: ArtworkMedium;
          tags?: string[];
          search_vector?: string;
          private_image_path?: string;
          public_image_path?: string | null;
          status?: ArtworkStatus;
          is_featured?: boolean;
          published_at?: string | null;
          palette_metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "artworks_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      commission_inquiries: {
        Row: {
          id: string;
          client_name: string;
          client_email: string;
          offering_id: string | null;
          offering_title_snapshot: string;
          description: string;
          budget_amount: number | null;
          budget_currency: string;
          desired_deadline: string | null;
          availability_at_submission: "open" | "waitlist";
          status: InquiryStatus;
          admin_notes: string | null;
          submitted_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_name: string;
          client_email: string;
          offering_id?: string | null;
          offering_title_snapshot: string;
          description: string;
          budget_amount?: number | null;
          budget_currency?: string;
          desired_deadline?: string | null;
          availability_at_submission: "open" | "waitlist";
          status?: InquiryStatus;
          admin_notes?: string | null;
          submitted_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_name?: string;
          client_email?: string;
          offering_id?: string | null;
          offering_title_snapshot?: string;
          description?: string;
          budget_amount?: number | null;
          budget_currency?: string;
          desired_deadline?: string | null;
          availability_at_submission?: "open" | "waitlist";
          status?: InquiryStatus;
          admin_notes?: string | null;
          submitted_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "commission_inquiries_offering_id_fkey";
            columns: ["offering_id"];
            isOneToOne: false;
            referencedRelation: "commission_offerings";
            referencedColumns: ["id"];
          }
        ];
      };
      pending_uploads: {
        Row: {
          id: string;
          profile_id: string;
          purpose: PendingUploadPurpose;
          bucket_id: "artworks-private";
          object_path: string;
          original_filename: string | null;
          declared_content_type: string | null;
          declared_size_bytes: number | null;
          detected_content_type: string | null;
          actual_size_bytes: number | null;
          state: PendingUploadState;
          expires_at: string;
          signed_upload_issued_at: string | null;
          signed_upload_expires_at: string | null;
          cleanup_after: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          purpose: PendingUploadPurpose;
          bucket_id?: "artworks-private";
          object_path: string;
          original_filename?: string | null;
          declared_content_type?: string | null;
          declared_size_bytes?: number | null;
          detected_content_type?: string | null;
          actual_size_bytes?: number | null;
          state?: PendingUploadState;
          expires_at: string;
          signed_upload_issued_at?: string | null;
          signed_upload_expires_at?: string | null;
          cleanup_after?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          purpose?: PendingUploadPurpose;
          bucket_id?: "artworks-private";
          object_path?: string;
          original_filename?: string | null;
          declared_content_type?: string | null;
          declared_size_bytes?: number | null;
          detected_content_type?: string | null;
          actual_size_bytes?: number | null;
          state?: PendingUploadState;
          expires_at?: string;
          signed_upload_issued_at?: string | null;
          signed_upload_expires_at?: string | null;
          cleanup_after?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pending_uploads_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      storage_cleanup_queue: {
        Row: {
          id: string;
          bucket_id: "artworks-private" | "artworks-public" | "profiles-public";
          object_path: string;
          reason: CleanupReason;
          state: CleanupState;
          process_after: string;
          processing_started_at: string | null;
          attempt_count: number;
          last_attempt_at: string | null;
          last_error: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          bucket_id: "artworks-private" | "artworks-public" | "profiles-public";
          object_path: string;
          reason: CleanupReason;
          state?: CleanupState;
          process_after?: string;
          processing_started_at?: string | null;
          attempt_count?: number;
          last_attempt_at?: string | null;
          last_error?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          bucket_id?: "artworks-private" | "artworks-public" | "profiles-public";
          object_path?: string;
          reason?: CleanupReason;
          state?: CleanupState;
          process_after?: string;
          processing_started_at?: string | null;
          attempt_count?: number;
          last_attempt_at?: string | null;
          last_error?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      inquiry_rate_limits: {
        Row: {
          key_hash: string;
          window_start: string;
          attempt_count: number;
          last_attempt_at: string;
        };
        Insert: {
          key_hash: string;
          window_start: string;
          attempt_count?: number;
          last_attempt_at?: string;
        };
        Update: {
          key_hash?: string;
          window_start?: string;
          attempt_count?: number;
          last_attempt_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      public_profile: {
        Row: {
          display_name: string;
          bio: string;
          avatar_path: string | null;
          contact_email: string | null;
          social_links: Json;
          commission_availability: CommissionAvailability;
          availability_message: string;
        };
        Relationships: [];
      };
      public_artworks: {
        Row: {
          id: string;
          title: string;
          slug: string;
          description: string;
          alt_text: string;
          category: ArtworkCategory;
          medium: ArtworkMedium;
          tags: string[];
          public_image_path: string;
          status: "published";
          is_featured: boolean;
          published_at: string;
          palette_metadata?: Json | null;
        };
        Relationships: [];
      };
      public_commission_offerings: {
        Row: {
          id: string;
          title: string;
          slug: string;
          description: string;
          price_from: number | null;
          price_currency: string;
          display_order: number;
          is_active: true;
        };
        Relationships: [];
      };
    };
    Functions: {
      check_and_increment_rate_limit: {
        Args: {
          p_key_hash: string;
          p_window_start: string;
          p_max_attempts: number;
        };
        Returns: {
          allowed: boolean;
          current_count: number;
        }[];
      };
    };
  };
}
