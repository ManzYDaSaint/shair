export interface GroupSettings {
  id: number;
  group_name: string;
  currency_symbol: string;
  active_year: number;
  default_membership_fee: number;
  default_monthly_contribution: number;
}

export type MemberStatus = 'active' | 'stopped' | 'transferred';

export interface Member {
  id: number;
  sr_number: number;
  name: string;
  phone_number: string;
  avatar_initials?: string;
  role?: string;
  status: MemberStatus;
  status_reason?: string;
  is_active: number;
}

export interface CustomColumn {
  id: number;
  column_key: string;
  column_label: string;
  default_amount: number;
  sort_order: number;
  is_enabled: number;
}

export interface PaymentRecord {
  id: number;
  member_id: number;
  item_key: string; // 'fee' | 'jan'..'dec' | 'custom_{id}'
  year: number;
  amount_paid: number;
  target_amount: number;
  status: 'paid' | 'partial' | 'unpaid';
  payment_date?: string;
  payment_method?: string;
  notes?: string;
}

export interface Expense {
  id: number;
  title: string;
  amount: number;
  category: string;
  expense_date: string;
  recorded_by?: string;
  notes?: string;
}

export const MONTH_KEYS = [
  'jan', 'feb', 'mar', 'apr', 'may', 'jun',
  'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
] as const;

export const MONTH_LABELS: Record<string, string> = {
  jan: 'Jan',
  feb: 'Feb',
  mar: 'Mar',
  apr: 'Apr',
  may: 'May',
  jun: 'Jun',
  jul: 'Jul',
  aug: 'Aug',
  sep: 'Sep',
  oct: 'Oct',
  nov: 'Nov',
  dec: 'Dec',
};
