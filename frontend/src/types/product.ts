export type ProductStatus = 'active' | 'inactive'

export type Product = {
  id: string
  name: string
  description: string
  price: number
  stock: number
  status: ProductStatus
  category?: string
  imageUrl?: string
  createdAt: string
  updatedAt?: string
}

export type ProductPayload = Partial<
  Pick<Product, 'name' | 'description' | 'price' | 'stock' | 'status' | 'category' | 'imageUrl'>
>


