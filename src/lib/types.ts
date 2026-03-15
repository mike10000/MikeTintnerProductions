export type UserRole = "client" | "admin";

export interface Profile {
  id: string;
  full_name: string;
  company_name: string | null;
  phone: string | null;
  role: UserRole;
  created_at: string;
}

export type WorkOrderStatus =
  | "submitted"
  | "in_progress"
  | "review"
  | "completed"
  | "cancelled";

export type Priority = "low" | "medium" | "high" | "urgent";

export interface WorkOrder {
  id: string;
  client_id: string;
  title: string;
  description: string;
  status: WorkOrderStatus;
  priority: Priority;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
}

export type QuoteStatus = "draft" | "sent" | "accepted" | "declined";

export interface Quote {
  id: string;
  client_id: string;
  work_order_id: string | null;
  line_items: LineItem[];
  total: number;
  status: QuoteStatus;
  valid_until: string | null;
  created_at: string;
  profiles?: Profile;
}

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";

export interface Invoice {
  id: string;
  client_id: string;
  quote_id: string | null;
  work_order_id: string | null;
  square_invoice_id: string | null;
  square_payment_link: string | null;
  line_items: LineItem[];
  total: number;
  status: InvoiceStatus;
  due_date: string;
  paid_at: string | null;
  created_at: string;
  profiles?: Profile;
}

export interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
}

export interface Conversation {
  id: string;
  client_id: string;
  subject: string;
  created_at: string;
  profiles?: Profile;
  messages?: Message[];
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  read: boolean;
  created_at: string;
  profiles?: Profile;
}

export interface Board {
  id: string;
  name: string;
  work_order_id: string | null;
  created_at: string;
  board_columns?: BoardColumn[];
}

export interface BoardColumn {
  id: string;
  board_id: string;
  title: string;
  position: number;
  tasks?: Task[];
}

export interface Task {
  id: string;
  column_id: string;
  title: string;
  description: string | null;
  assignee_id: string | null;
  due_date: string | null;
  priority: Priority;
  labels: string[];
  position: number;
  client_visible: boolean;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
}

export interface TaskComment {
  id: string;
  task_id: string;
  author_id: string;
  body: string;
  created_at: string;
  profiles?: Profile;
}
