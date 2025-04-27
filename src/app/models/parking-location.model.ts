export interface ParkingLocation {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  total_spots: number;
  available_spots: number;
  hourly_rate: number;
  two_wheeler_price?: number;
  four_wheeler_price?: number;
  description?: string;
  image_url?: string;
  features?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
} 