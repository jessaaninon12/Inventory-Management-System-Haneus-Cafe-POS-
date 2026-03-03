export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  unit: string;
  description: string;
  low_stock_threshold: number;
  image_url?: string;
}

export interface Sale {
  id: number;
  order_id: string;
  customer_name: string;
  date: string;
  total: number;
  status: 'Completed' | 'Pending' | 'Cancelled';
  items_count: number;
}
