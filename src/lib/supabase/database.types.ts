export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/** Full table row — includes internal fields. Only available via service role / dashboard. */
export type ProductTableRow = {
  id: string;
  name: string;
  sku: string;
  code: string;
  brand: string;
  description: string;
  category: string;
  image_url: string;
  selling_price: number | null;
  purchase_price: number | null;
  hidden_references: string;
};

/** Public view row — never includes purchase_price or hidden_references. */
export type ProductPublicRow = {
  id: string;
  name: string;
  sku: string;
  code: string;
  brand: string;
  description: string;
  category: string;
  image_url: string;
  selling_price: number | null;
};

export type Database = {
  public: {
    Tables: {
      products: {
        Row: ProductTableRow;
        Insert: {
          id?: string;
          name: string;
          sku: string;
          code?: string;
          brand: string;
          description?: string;
          category: string;
          image_url: string;
          selling_price?: number | null;
          purchase_price?: number | null;
          hidden_references?: string;
        };
        Update: Partial<ProductTableRow>;
        Relationships: [];
      };
    };
    Views: {
      products_public: {
        Row: ProductPublicRow;
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

/** App reads from products_public only. */
export type ProductRow = ProductPublicRow;
