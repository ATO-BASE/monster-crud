import { NextRequest, NextResponse } from 'next/server'

// Disable SSL certificate validation for development (NOT for production)
// This allows connections even with expired or invalid certificates
if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
}

interface ShopifyProduct {
  id: number
  title: string
  body_html: string
  vendor: string
  product_type: string
  created_at: string
  handle: string
  updated_at: string
  published_at: string
  template_suffix: string | null
  status: string
  published_scope: string
  tags: string
  admin_graphql_api_id: string
  variants: Array<{
    id: number
    product_id: number
    title: string
    price: string
    sku: string
    position: number
    compare_at_price: string | null
    option1: string | null
    option2: string | null
    option3: string | null
    created_at: string
    updated_at: string
    taxable: boolean
    barcode: string | null
    grams: number
    image_id: number | null
    weight: number
    weight_unit: string
    inventory_item_id: number
    inventory_quantity: number
    old_inventory_quantity: number
    requires_shipping: boolean
    admin_graphql_api_id: string
  }>
  images: Array<{
    id: number
    product_id: number
    position: number
    created_at: string
    updated_at: string
    alt: string | null
    width: number
    height: number
    src: string
    variant_ids: number[]
    admin_graphql_api_id: string
  }>
  options: Array<{
    id: number
    product_id: number
    name: string
    position: number
    values: string[]
  }>
}

interface ShopifyCollection {
  id: number
  handle: string
  title: string
  updated_at: string
  body_html: string
  published_at: string
  sort_order: string
  template_suffix: string | null
  products_count: number
  collection_type: string
  published_scope: string
  admin_graphql_api_id: string
  image: {
    created_at: string
    alt: string | null
    width: number
    height: number
    src: string
  } | null
}

function extractShopDomain(url: string): string | null {
  try {
    // Handle various URL formats
    let cleanUrl = url.trim()
    
    // Remove protocol if present
    cleanUrl = cleanUrl.replace(/^https?:\/\//, '')
    
    // Remove trailing slash
    cleanUrl = cleanUrl.replace(/\/$/, '')
    
    // Extract shop domain (e.g., "store.myshopify.com" or "store")
    if (cleanUrl.includes('.myshopify.com')) {
      return cleanUrl.split('.myshopify.com')[0]
    }else {
      // Just the shop name
      return cleanUrl
    }
  } catch (error) {
    return null
  }
}

/**
 * Converts Japanese Yen (JPY) to US Dollars (USD)
 * Uses approximate exchange rate: 1 JPY = 0.0067 USD (or ~150 JPY = 1 USD)
 * @param jpyPrice - Price in Japanese Yen
 * @returns Price in US Dollars
 */
function convertJPYtoUSD(jpyPrice: number | string): number {
  const numPrice = typeof jpyPrice === 'string' ? parseFloat(jpyPrice) : jpyPrice
  
  if (isNaN(numPrice) || numPrice <= 0) {
    return 0
  }
  
  // Exchange rate: 1 JPY = 0.0067 USD (approximately 150 JPY = 1 USD)
  // This rate can be updated based on current market rates
  const JPY_TO_USD_RATE = 0.0067
  
  const usdPrice = numPrice * JPY_TO_USD_RATE
  
  // Round to 2 decimal places
  return Math.round(usdPrice * 100) / 100
}

// Helper function to fetch with retry logic for rate limiting
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<Response> {
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options)
      
      // If rate limited (429), wait and retry
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After')
        const waitTime = retryAfter 
          ? parseInt(retryAfter) * 1000 
          : baseDelay * Math.pow(2, attempt) // Exponential backoff
        
        if (attempt < maxRetries) {
          console.log(`Rate limited (429). Waiting ${waitTime}ms before retry ${attempt + 1}/${maxRetries}...`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
          continue
        } else {
          throw new Error(`Rate limited after ${maxRetries} retries`)
        }
      }
      
      // For other errors, throw immediately
      if (!response.ok && response.status !== 429) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      return response
    } catch (error: any) {
      lastError = error
      
      // If it's not a rate limit error, throw immediately
      if (!error.message?.includes('429') && !error.message?.includes('Rate limited')) {
        throw error
      }
      
      // For rate limit errors, retry with exponential backoff
      if (attempt < maxRetries) {
        const waitTime = baseDelay * Math.pow(2, attempt)
        console.log(`Rate limit error. Waiting ${waitTime}ms before retry ${attempt + 1}/${maxRetries}...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }
  }
  
  throw lastError || new Error('Failed to fetch after retries')
}

async function fetchProducts(shopDomain: string) {
  try {
    const allProducts: any[] = []
    let page = 1
    let hasMore = true

    // If shopDomain doesn't contain a dot, it's a shop name, add .myshopify.com
    const domain = shopDomain.includes('.') ? shopDomain : `${shopDomain}.myshopify.com`

    while (hasMore) {
      const productsUrl = `https://${domain}/products.json?limit=250&page=${page}`
      console.log(`Fetching products from page ${page}: ${productsUrl}`)
      
      const response = await fetchWithRetry(productsUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        },
        // Note: SSL certificate errors can occur if system clock is incorrect
        // For production, ensure system time is correct
      } as RequestInit)

      const data = await response.json()
      const products = data.products || []

      
      if (products.length > 0) {
        allProducts.push(...products)
        console.log(`Fetched ${products.length} products from page ${page} (total: ${allProducts.length})`)
        
        // If we got fewer than 250 products, this is the last page
        if (products.length < 250) {
          hasMore = false
        } else {
          page++
          // Add a delay between requests to avoid rate limiting (increased to 1 second)
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      } else {
        // No products returned, we're done
        hasMore = false
      }
    }

    console.log(`Total products fetched: ${allProducts.length}`)
    return allProducts
  } catch (error: any) {
    console.error('Error fetching products:', error)
    // Preserve the original error structure (including cause for SSL errors)
    const errorWithCause = new Error(`Error fetching products: ${error.message}`)
    if (error.cause) {
      (errorWithCause as any).cause = error.cause
    }
    throw errorWithCause
  }
}

async function fetchCollections(shopDomain: string) {
  try {
    const allCollections: any[] = []
    let page = 1
    let hasMore = true

    // If shopDomain doesn't contain a dot, it's a shop name, add .myshopify.com
    const domain = shopDomain.includes('.') ? shopDomain : `${shopDomain}.myshopify.com`

    while (hasMore) {
      const collectionsUrl = `https://${domain}/collections.json?limit=250&page=${page}`
      console.log(`Fetching collections from page ${page}: ${collectionsUrl}`)
      
      try {
        const response = await fetchWithRetry(collectionsUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
          },
        })

        console.log('Collections response status:', response.status, response.statusText)

        if (!response.ok) {
          // 403 Forbidden usually means the store doesn't allow public access to collections
          if (response.status === 403) {
            console.log('Collections endpoint returned 403 - store may not allow public access to collections.json')
            console.log('Continuing without collections...')
            hasMore = false
            break // Exit the loop, return empty collections array
          }
          const errorText = await response.text()
          console.error('Collections fetch failed:', errorText)
          throw new Error(`Failed to fetch collections: ${response.status} ${response.statusText}. ${errorText.substring(0, 100)}`)
        }

        const data = await response.json()
        const collections = data.collections || []
        
        if (collections.length > 0) {
          allCollections.push(...collections)
          console.log(`Fetched ${collections.length} collections from page ${page} (total: ${allCollections.length})`)
          
          // If we got fewer than 250 collections, this is the last page
          if (collections.length < 250) {
            hasMore = false
          } else {
            page++
            // Add a delay between requests to avoid rate limiting (increased to 1 second)
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        } else {
          // No collections returned, we're done
          hasMore = false
        }
      } catch (error: any) {
        // If rate limiting fails after retries, continue without collections
        if (error.message?.includes('Rate limited') || error.message?.includes('429')) {
          console.log('Collections endpoint rate limited after retries - continuing without collections...')
          hasMore = false
          break
        }
        throw error
      }
    }

    console.log(`Total collections fetched: ${allCollections.length}`)
    return allCollections
  } catch (error: any) {
    console.error('Error fetching collections:', error)
    // Preserve the original error structure (including cause for SSL errors)
    const errorWithCause = new Error(`Error fetching collections: ${error.message}`)
    if (error.cause) {
      (errorWithCause as any).cause = error.cause
    }
    throw errorWithCause
  }
}

async function fetchCollectionProducts(shopDomain: string, collectionHandle: string) {
  try {
    const allProducts: any[] = []
    let page = 1
    let hasMore = true

    // If shopDomain doesn't contain a dot, it's a shop name, add .myshopify.com
    const domain = shopDomain.includes('.') ? shopDomain : `${shopDomain}.myshopify.com`

    while (hasMore) {
      const productsUrl = `https://${domain}/collections/${collectionHandle}/products.json?limit=250&page=${page}`
      
      try {
        const response = await fetchWithRetry(productsUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
          },
          // Note: SSL certificate errors can occur if system clock is incorrect
          // For production, ensure system time is correct
        } as RequestInit)

        if (!response.ok) {
          return allProducts // Return what we have so far
        }

        const data = await response.json()
        const products = data.products || []
        
        if (products.length > 0) {
          allProducts.push(...products)
          
          // If we got fewer than 250 products, this is the last page
          if (products.length < 250) {
            hasMore = false
          } else {
            page++
            // Add a delay between requests to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        } else {
          // No products returned, we're done
          hasMore = false
        }
      } catch (error: any) {
        // If rate limiting fails after retries, return what we have
        if (error.message?.includes('Rate limited') || error.message?.includes('429')) {
          console.log(`Rate limited while fetching collection products for ${collectionHandle} - returning what we have`)
          return allProducts
        }
        // For other errors, return what we have so far
        return allProducts
      }
    }

    return allProducts
  } catch (error) {
    console.error(`Error fetching products for collection ${collectionHandle}:`, error)
    return []
  }
}

function transformProduct(shopProduct: ShopifyProduct) {
  const firstImage = shopProduct.images && shopProduct.images.length > 0 
    ? shopProduct.images[0].src 
    : 'https://via.placeholder.com/300'
  
  const firstVariant = shopProduct.variants && shopProduct.variants.length > 0
    ? shopProduct.variants[0]
    : null

  // Convert JPY price to USD
  const jpyPrice = firstVariant ? parseFloat(firstVariant.price) : 0
  const price = convertJPYtoUSD(jpyPrice)

  // Preserve all variants with JPY to USD conversion
  const variants = shopProduct.variants?.map(variant => {
    const jpyVariantPrice = parseFloat(variant.price) || 0
    const usdVariantPrice = convertJPYtoUSD(jpyVariantPrice)
    
    const jpyComparePrice = variant.compare_at_price ? parseFloat(variant.compare_at_price) : null
    const usdComparePrice = jpyComparePrice ? convertJPYtoUSD(jpyComparePrice) : null
    
    return {
      price: usdVariantPrice.toFixed(2), // Convert to string with 2 decimal places
      sku: variant.sku || undefined,
      compare_at_price: usdComparePrice ? usdComparePrice.toFixed(2) : undefined,
      option1: variant.option1 || undefined,
      option2: variant.option2 || undefined,
      option3: variant.option3 || undefined,
      barcode: variant.barcode || undefined,
      weight: variant.weight || undefined,
      weight_unit: variant.weight_unit || undefined,
      inventory_quantity: variant.inventory_quantity || undefined,
      taxable: variant.taxable || undefined,
      requires_shipping: variant.requires_shipping || undefined,
      image_id: variant.image_id || undefined,
    }
  }) || []

  // Preserve all options
  const options = shopProduct.options?.map(option => ({
    name: option.name,
    values: option.values,
    position: option.position || undefined,
  })) || []

  // Preserve all images with their IDs
  const images = shopProduct.images?.map(img => ({
    id: img.id, // Preserve image ID for exact matching with variant.image_id
    src: img.src,
    alt: img.alt || undefined,
    position: img.position || undefined,
    variant_ids: img.variant_ids || undefined,
  })) || []

  return {
    id: `product-${shopProduct.id}`,
    name: shopProduct.title,
    description: shopProduct.body_html ? shopProduct.body_html.replace(/<[^>]*>/g, '').substring(0, 500) : 'No description available',
    image: firstImage,
    price: price,
    variants: variants.length > 0 ? variants : undefined,
    options: options.length > 0 ? options : undefined,
    images: images.length > 0 ? images : undefined,
  }
}

async function transformCollection(shopCollection: ShopifyCollection, shopDomain: string) {
  const collectionImage = shopCollection.image 
    ? shopCollection.image.src 
    : 'https://via.placeholder.com/300'

  // Fetch products for this collection
  const collectionProducts = await fetchCollectionProducts(shopDomain, shopCollection.handle)
  const transformedProducts = (collectionProducts || []).map(transformProduct)

  return {
    id: `collection-${shopCollection.id}`,
    name: shopCollection.title,
    description: shopCollection.body_html 
      ? shopCollection.body_html.replace(/<[^>]*>/g, '').substring(0, 500) 
      : 'No description available',
    image: collectionImage,
    products: transformedProducts,
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('API route called')
    const body = await request.json()
    const { storeUrl } = body

    console.log('Received storeUrl:', storeUrl)

    if (!storeUrl) {
      console.log('No storeUrl provided')
      return NextResponse.json(
        { error: 'Store URL is required', success: false },
        { status: 400 }
      )
    }

    const shopDomain = extractShopDomain(storeUrl)
    console.log('Extracted shop domain:', shopDomain)

    if (!shopDomain) {
      console.log('Invalid store URL format')
      return NextResponse.json(
        { error: 'Invalid store URL format. Please use format like "store.myshopify.com" or just "store"', success: false },
        { status: 400 }
      )
    }

    console.log('Fetching products and collections for:', shopDomain)

    // Fetch products and collections in parallel
    const [shopProducts, shopCollections] = await Promise.all([
      fetchProducts(shopDomain),
      fetchCollections(shopDomain),
    ])

    console.log(`Fetched ${shopProducts.length} products and ${shopCollections.length} collections`)

    // Transform products
    const products = shopProducts.map(transformProduct)

    // Transform collections (this includes fetching products for each collection)
    console.log('Transforming collections...')
    const collections = await Promise.all(
      shopCollections.map((collection: ShopifyCollection) => 
        transformCollection(collection, shopDomain)
      )
    )

    console.log('Transformation complete. Returning data.')
    return NextResponse.json({
      success: true,
      products,
      collections,
      storeUrl: `https://${shopDomain}`,
    })
  } catch (error: any) {
    console.error('Scraping error in API route:', error)
    
    let errorMessage = error.message || 'Failed to scrape store. Please check if the store URL is valid and publicly accessible.'
    
    // Check for SSL certificate errors - check both error.cause and error message
    const isSSLError = 
      error.cause?.code === 'CERT_HAS_EXPIRED' || 
      error.message?.includes('certificate') || 
      error.message?.includes('CERT') ||
      error.message?.includes('fetch failed') ||
      (error.cause && error.message?.includes('fetch'))
    
    if (isSSLError) {
      errorMessage = 'SSL Certificate Error: The SSL certificate validation failed. This often happens if your system clock is incorrect. Please check your system date and time settings and ensure they are correct. If the issue persists, the target store may have an expired certificate.'
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        success: false 
      },
      { status: 500 }
    )
  }
}

