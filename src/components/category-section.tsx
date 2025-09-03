import { ProductCard } from "@/components/product-card";

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  image_url: string;
  unit: string;
  in_stock: boolean;
}

interface CategorySectionProps {
  category: string;
  products: Product[];
  storeId: string;
}

export const CategorySection = ({ category, products, storeId }: CategorySectionProps) => {
  return (
    <div className="space-y-6">
      <div className="border-l-4 border-primary pl-4">
        <h2 className="text-2xl font-bold text-gradient">{category}</h2>
        <p className="text-muted-foreground">
          {products.length} produit{products.length > 1 ? 's' : ''} disponible{products.length > 1 ? 's' : ''}
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            storeId={storeId}
          />
        ))}
      </div>
    </div>
  );
};