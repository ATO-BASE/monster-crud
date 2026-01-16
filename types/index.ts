export interface Product {
  id: string
  name: string
  description: string
  image: string
  price: number
  variant?: string
  variants?: Array<{
    price: string
    sku?: string
    compare_at_price?: string | null
    option1?: string | null
    option2?: string | null
    option3?: string | null
    barcode?: string | null
    weight?: number
    weight_unit?: string
    inventory_quantity?: number
    taxable?: boolean
    requires_shipping?: boolean
    image_id?: number | null
  }>
  options?: Array<{
    name: string
    values: string[]
    position?: number
  }>
  images?: Array<{
    src: string
    alt?: string | null
    position?: number
    variant_ids?: number[]
  }>
}

export interface Collection {
  id: string
  name: string
  description: string
  image: string
  products: Product[]
}

export interface UploadHistory {
  id: string
  scrapeStoreUrl: string
  myStoreUrl: string
  productNames: string[]
  collectionNames: string[]
  dateTime: string
}

