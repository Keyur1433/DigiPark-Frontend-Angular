export interface Vehicle {
  id: string;
  user_id: string;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  color: string;
  is_default?: boolean;
  created_at: string;
  updated_at: string;
} 