export type ProductStatus = 'active' | 'inactive'

export type Product = {
  id: string
  name: string
  description: string
  price: number
  stockQuantity: number
  reorderThreshold: number
  lowStock: boolean
  status: ProductStatus
  category?: string
  imageUrl?: string
  createdAt: string
  updatedAt?: string
}

export type ProductPayload = Partial<
  Pick<
    Product,
    | 'name'
    | 'description'
    | 'price'
    | 'stockQuantity'
    | 'reorderThreshold'
    | 'status'
    | 'category'
    | 'imageUrl'
  >
>

