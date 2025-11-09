export interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  stock: number;
  image: string | null;
  store_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductWithStore extends Product {
  stores: {
    id: string;
    name: string;
    manager_id: string;
  };
}

export interface CreateProductData {
  name: string;
  description?: string;
  category: string;
  price: number;
  stock: number;
  image?: string;
  store_id: string;
}

export interface UpdateProductData {
  name?: string;
  description?: string;
  category?: string;
  price?: number;
  stock?: number;
  image?: string;
  is_active?: boolean;
}
