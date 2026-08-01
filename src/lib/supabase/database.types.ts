export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      products: {
        Row: {
          id: string;
          slug: string;
          sku: string;
          name_sq: string;
          name_en: string;
          description_sq: string;
          description_en: string;
          brand: string;
          category: string;
          image_url: string;
          fitment_sq: string;
          fitment_en: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          sku: string;
          name_sq: string;
          name_en: string;
          description_sq?: string;
          description_en?: string;
          brand: string;
          category: string;
          image_url: string;
          fitment_sq?: string;
          fitment_en?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          sku?: string;
          name_sq?: string;
          name_en?: string;
          description_sq?: string;
          description_en?: string;
          brand?: string;
          category?: string;
          image_url?: string;
          fitment_sq?: string;
          fitment_en?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type ProductRow = Database["public"]["Tables"]["products"]["Row"];
