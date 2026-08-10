export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type StockStatus = "in_stock" | "on_request" | "out_of_stock";

/** Full table row — includes internal fields. Only available via service role / dashboard. */
export type ProductTableRow = {
  id: string;
  slug: string;
  name: string;
  name_en: string | null;
  sku: string;
  code: string | null;
  brand: string | null;
  description: string | null;
  description_en: string | null;
  category: string;
  image_url: string | null;
  selling_price: number | null;
  purchase_price: number | null;
  hidden_references: string | null;
  featured: boolean;
  stock_status: StockStatus;
  sell_online: boolean;
  stock_qty: number | null;
  max_qty_per_order: number;
  created_at: string;
  updated_at: string;
};

/** Public view row — never includes purchase_price or hidden_references. */
export type ProductPublicRow = {
  id: string;
  slug: string;
  name: string;
  name_en: string | null;
  sku: string;
  code: string | null;
  brand: string | null;
  description: string | null;
  description_en: string | null;
  category: string;
  image_url: string | null;
  selling_price: number | null;
  featured: boolean;
  stock_status: StockStatus;
  sell_online?: boolean;
  stock_qty?: number | null;
  max_qty_per_order?: number | null;
  created_at?: string;
  updated_at?: string;
};

export type ProfileRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  is_admin: boolean;
  created_at: string;
};

export type ProductRatingRow = {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  created_at: string;
  updated_at: string;
};

export type ProductCommentRow = {
  id: string;
  product_id: string;
  user_id: string;
  body: string;
  author_name: string;
  approved: boolean;
  created_at: string;
};

export type EnquiryOrderRow = {
  id: string;
  status: "submitted" | "contacted" | "fulfilled" | "cancelled";
  locale: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  channel: "whatsapp" | "email" | "phone" | "web";
  message: string;
  items: Json;
  subtotal: number | null;
  created_at: string;
};

export type OrderStatusDb =
  | "pending_payment"
  | "paid"
  | "awaiting_pickup"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled"
  | "refunded";

export type PaymentMethodDb = "stripe" | "pickup";

export type PaymentStatusDb =
  | "unpaid"
  | "paid"
  | "failed"
  | "refunded"
  | "partially_refunded";

export type OrderRow = {
  id: string;
  number: string;
  status: OrderStatusDb;
  payment_method: PaymentMethodDb;
  payment_status: PaymentStatusDb;
  locale: string;
  currency: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  fulfillment_type: string;
  notes: string | null;
  subtotal: number;
  total: number;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  paid_at: string | null;
  ready_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderItemRow = {
  id: string;
  order_id: string;
  product_id: string | null;
  slug: string;
  sku: string;
  name_sq: string;
  name_en: string;
  brand: string | null;
  unit_price: number;
  qty: number;
  line_total: number;
  image_url: string | null;
};

export type OrderEventRow = {
  id: string;
  order_id: string;
  kind: string;
  detail: Json;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      products: {
        Row: ProductTableRow;
        Insert: {
          id?: string;
          slug: string;
          name: string;
          name_en?: string | null;
          sku: string;
          code?: string | null;
          brand?: string | null;
          description?: string | null;
          description_en?: string | null;
          category: string;
          image_url?: string | null;
          selling_price?: number | null;
          purchase_price?: number | null;
          hidden_references?: string | null;
          featured?: boolean;
          stock_status?: StockStatus;
          sell_online?: boolean;
          stock_qty?: number | null;
          max_qty_per_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<ProductTableRow>;
        Relationships: [];
      };
      profiles: {
        Row: ProfileRow;
        Insert: {
          id: string;
          email?: string | null;
          display_name?: string | null;
          is_admin?: boolean;
          created_at?: string;
        };
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      product_ratings: {
        Row: ProductRatingRow;
        Insert: {
          id?: string;
          product_id: string;
          user_id: string;
          rating: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<ProductRatingRow>;
        Relationships: [];
      };
      product_comments: {
        Row: ProductCommentRow;
        Insert: {
          id?: string;
          product_id: string;
          user_id: string;
          body: string;
          author_name: string;
          approved?: boolean;
          created_at?: string;
        };
        Update: Partial<ProductCommentRow>;
        Relationships: [];
      };
      enquiry_orders: {
        Row: EnquiryOrderRow;
        Insert: {
          id?: string;
          status?: EnquiryOrderRow["status"];
          locale?: string;
          customer_name?: string | null;
          customer_phone?: string | null;
          customer_email?: string | null;
          channel?: EnquiryOrderRow["channel"];
          message: string;
          items?: Json;
          subtotal?: number | null;
          created_at?: string;
        };
        Update: Partial<EnquiryOrderRow>;
        Relationships: [];
      };
      orders: {
        Row: OrderRow;
        Insert: {
          id?: string;
          number: string;
          status?: OrderStatusDb;
          payment_method: PaymentMethodDb;
          payment_status?: PaymentStatusDb;
          locale?: string;
          currency?: string;
          customer_name: string;
          customer_phone: string;
          customer_email: string;
          fulfillment_type?: string;
          notes?: string | null;
          subtotal: number;
          total: number;
          stripe_checkout_session_id?: string | null;
          stripe_payment_intent_id?: string | null;
          paid_at?: string | null;
          ready_at?: string | null;
          completed_at?: string | null;
          cancelled_at?: string | null;
          user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<OrderRow>;
        Relationships: [];
      };
      order_items: {
        Row: OrderItemRow;
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          slug: string;
          sku: string;
          name_sq: string;
          name_en: string;
          brand?: string | null;
          unit_price: number;
          qty: number;
          line_total: number;
          image_url?: string | null;
        };
        Update: Partial<OrderItemRow>;
        Relationships: [];
      };
      order_events: {
        Row: OrderEventRow;
        Insert: {
          id?: string;
          order_id: string;
          kind: string;
          detail?: Json;
          created_at?: string;
        };
        Update: Partial<OrderEventRow>;
        Relationships: [];
      };
    };
    Views: {
      products_public: {
        Row: ProductPublicRow;
        Relationships: [];
      };
      product_rating_stats: {
        Row: {
          product_id: string;
          average: number;
          count: number;
        };
        Relationships: [];
      };
    };
    Functions: {
      search_products: {
        Args: { search_query: string };
        Returns: ProductPublicRow[];
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      next_order_number: {
        Args: Record<string, never>;
        Returns: string;
      };
      decrement_product_stock: {
        Args: { p_product_id: string; p_qty: number };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

/** App reads from products_public only. */
export type ProductRow = ProductPublicRow;
