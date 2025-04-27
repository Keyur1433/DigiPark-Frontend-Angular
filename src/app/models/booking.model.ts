export interface Booking {
  id: string;
  user_id: string;
  vehicle_id: string;
  parking_location_id: string;
  start_time: string;
  end_time: string;
  duration_hours: number;
  total_cost: number;
  status: 'pending' | 'active' | 'completed' | 'cancelled' | 'upcoming';
  payment_status: 'pending' | 'paid' | 'refunded';
  created_at: string;
  updated_at: string;
} 