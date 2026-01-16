import { NextRequest, NextResponse } from 'next/server'
import { Product } from '@/types'

interface Collection {
  id: string
  name: string
  description: string
  image: string
  products: Product[]
}

interface UploadRequest {
  storeUrl: string
  adminToken: string
  products?: Product[]
  collections?: Collection[]
  priceMultiplier: number
  prefixKeyword: string
  descriptionPrefixKeyword?: string
}

function extractShopDomain(url: string): string {
  let cleanUrl = url.trim().replace(/^https?:\/\//, '').replace(/\/$/, '')
  if (cleanUrl.includes('.myshopify.com')) {
    return cleanUrl.split('.myshopify.com')[0]
  }
  return cleanUrl.split('/')[0]
}

/**
 * Helper function to generate product name with prefix
 * Replaces the first word of the product name with the prefix keyword
 */
function generateProductName(originalName: string, prefixKeyword: string): string {
  if (!prefixKeyword || !prefixKeyword.trim()) {
    return originalName
  }
  const nameArray = originalName.split(' ')
  nameArray[0] = prefixKeyword.trim()
  return nameArray.join(' ')
}

/**
 * Check if a product exists by title and return the product if found
 * Handles pagination to check all products
 * @returns Product object if found, null otherwise
 */
async function checkProductExists(
  shopDomain: string,
  adminToken: string,
  productTitle: string
): Promise<{ id: number; title: string } | null> {
  try {
    let page = 1
    let hasMore = true
    const limit = 250

    while (hasMore) {
      const apiUrl = `https://${shopDomain}.myshopify.com/admin/api/2024-01/products.json?limit=${limit}&page=${page}`
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': adminToken,
        },
      })

      if (!response.ok) {
        return null
      }

      const data = await response.json()
      const products = data.products || []

      // Check if any product with exact title exists
      const foundProduct = products.find((p: any) => p.title === productTitle)
      if (foundProduct) {
        return { id: foundProduct.id, title: foundProduct.title }
      }

      // If we got fewer products than the limit, we're done
      if (products.length < limit) {
        hasMore = false
      } else {
        page++
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }

    return null
  } catch (error) {
    console.error(`Error checking if product exists: ${productTitle}`, error)
    return null
  }
}



//ORIGINAL COLLECTION YES/NO
async function checkCollectionExists(
  shopDomain: string,
  adminToken: string,
  collectionTitle: string
): Promise<boolean> {
  try {
    // Check both smart collections and custom collections
    const smartCollectionUrl = `https://${shopDomain}.myshopify.com/admin/api/2024-01/smart_collections.json?limit=5000`
    const customCollectionUrl = `https://${shopDomain}.myshopify.com/admin/api/2024-01/custom_collections.json?limit=5000`

    const [smartResponse, customResponse] = await Promise.all([
      fetch(smartCollectionUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': adminToken,
        },
      }),
      fetch(customCollectionUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': adminToken,
        },
      }),
    ])

    if (smartResponse.ok) {
      const smartData = await smartResponse.json()
      if (smartData.smart_collections && smartData.smart_collections.some((c: any) => c.title === collectionTitle)) {
        return true
      }
    }

    if (customResponse.ok) {
      const customData = await customResponse.json()
      if (customData.custom_collections && customData.custom_collections.some((c: any) => c.title === collectionTitle)) {
        return true
      }
    }

    return false
  } catch (error) {
    console.error(`Error checking if collection exists: ${collectionTitle}`, error)
    return false
  }
}



async function createShopifyProduct(
  shopDomain: string,
  adminToken: string,
  product: Product,
  priceMultiplier: number,
  prefixKeyword: string,
  descriptionPrefixKeyword?: string
) {
  const apiUrl = `https://${shopDomain}.myshopify.com/admin/api/2024-01/products.json?limit=5000`

  // Use consistent product name generation
  const productName = generateProductName(product.name, prefixKeyword)
  const productDescription = descriptionPrefixKeyword ? `${descriptionPrefixKeyword} ${product.description}` : product.description

  // Process all variants with price multiplier
  const variants = product.variants && product.variants.length > 0
    ? product.variants.map(variant => {
        const variantPrice = (parseFloat(variant.price) * priceMultiplier).toFixed(2)
        const variantData: any = {
          price: variantPrice,
          inventory_management: null,
          inventory_policy: 'deny',
        }

        // Add option values if they exist
        if (variant.option1) variantData.option1 = variant.option1
        if (variant.option2) variantData.option2 = variant.option2
        if (variant.option3) variantData.option3 = variant.option3

        // Add optional fields
        if (variant.sku) variantData.sku = variant.sku
        if (variant.compare_at_price) {
          const comparePrice = (parseFloat(variant.compare_at_price) * priceMultiplier).toFixed(2)
          variantData.compare_at_price = comparePrice
        }
        if (variant.barcode) variantData.barcode = variant.barcode
        if (variant.weight !== undefined) variantData.weight = variant.weight
        if (variant.weight_unit) variantData.weight_unit = variant.weight_unit
        if (variant.grams !== undefined) variantData.grams = variant.grams
        if (variant.inventory_quantity !== undefined) variantData.inventory_quantity = variant.inventory_quantity
        if (variant.taxable !== undefined) variantData.taxable = variant.taxable
        if (variant.requires_shipping !== undefined) variantData.requires_shipping = variant.requires_shipping
        if (variant.position !== undefined) variantData.position = variant.position

        return variantData
      })
    : [
        {
          price: (product.price * priceMultiplier).toFixed(2),
          inventory_management: null,
          inventory_policy: 'deny',
        },
      ]

  // Process all options
  const options = product.options?.map(option => ({
    name: option.name,
    values: option.values,
    position: option.position || 1,
  })) || []

  // Process all images (use all images if available, otherwise fallback to single image)
  const images = product.images && product.images.length > 0
    ? product.images.map(img => {
        const imageData: any = {
          src: img.src,
        }
        if (img.alt) imageData.alt = img.alt
        if (img.position !== undefined) imageData.position = img.position
        // Note: width and height are read-only in Shopify API, but we include them if provided
        // Shopify will set these automatically based on the image
        return imageData
      })
    : product.image
    ? [{ src: product.image }]
    : []

  // Build product data object with all required fields
  const productData: any = {
    product: {
      title: productName,
      body_html: productDescription,
    },
  }

  // Add additional Shopify product fields if they exist
  if (product.vendor) productData.product.vendor = product.vendor
  if (product.product_type) productData.product.product_type = product.product_type
  if (product.tags) {
    // Handle both string and array formats for tags
    productData.product.tags = Array.isArray(product.tags) 
      ? product.tags.join(', ') 
      : product.tags
  }
  if (product.handle) productData.product.handle = product.handle
  if (product.published_at) productData.product.published_at = product.published_at

  // Add images (all media images)
  if (images.length > 0) {
    productData.product.images = images
  }

  // Add options (must be before variants in Shopify API)
  if (options.length > 0) {
    productData.product.options = options
  }

  // Add variants (all variants with all properties)
  if (variants.length > 0) {
    productData.product.variants = variants
  }

  // Log the data being sent for debugging
  console.log(`Uploading product "${productName}" with ${images.length} images, ${variants.length} variants, ${options.length} options`)

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': adminToken,
      },
      body: JSON.stringify(productData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Failed to create product ${product.name}:`, errorText)
      console.error('Product data sent:', JSON.stringify(productData, null, 2))
      throw new Error(`Failed to create product: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const createdProduct = data.product

    // After product creation, associate variant images
    // Shopify generates variant IDs when creating the product, so we need to update variants with image_id
    if (createdProduct.variants && createdProduct.variants.length > 0 && 
        product.variants && product.variants.length > 0 && 
        createdProduct.images && createdProduct.images.length > 0 &&
        product.images && product.images.length > 0) {
      
      console.log(`Associating variant images for product "${productName}"...`)
      console.log(`  Source: ${product.variants.length} variants, ${product.images.length} images`)
      console.log(`  Created: ${createdProduct.variants.length} variants, ${createdProduct.images.length} images`)
      
      // Build a map: variant position -> image to associate
      const variantImageMap = new Map<number, any>()
      
      // Identify variant-specific images (images that have variant_ids)
      const variantSpecificImages = product.images.filter(img => img.variant_ids && img.variant_ids.length > 0)
      
      console.log(`  Found ${variantSpecificImages.length} variant-specific images`)
      
      // Map each variant to its associated image
      for (let variantIndex = 0; variantIndex < product.variants.length; variantIndex++) {
        const sourceVariant = product.variants[variantIndex]
        let matchingImage: any = null
        
        // Method 1: Check if variant has explicit image_id
        if (sourceVariant.image_id !== undefined && sourceVariant.image_id !== null) {
          const imageIdNum = typeof sourceVariant.image_id === 'number' 
            ? sourceVariant.image_id 
            : parseInt(String(sourceVariant.image_id))
          
          // Try to find image by position if image_id is a reasonable index
          if (!isNaN(imageIdNum) && imageIdNum >= 0 && imageIdNum < product.images.length) {
            matchingImage = product.images[imageIdNum]
            console.log(`  Variant ${variantIndex} (${sourceVariant.option1 || 'default'}) -> image index ${imageIdNum}`)
          }
        }
        
        // Method 2: Match variant-specific images sequentially
        if (!matchingImage && variantSpecificImages.length > 0 && variantIndex < variantSpecificImages.length) {
          matchingImage = variantSpecificImages[variantIndex]
          console.log(`  Variant ${variantIndex} -> variant-specific image at index ${variantIndex}`)
        }
        
        // Method 3: Position-based fallback
        if (!matchingImage && product.images.length > variantIndex) {
          matchingImage = product.images[variantIndex]
          console.log(`  Variant ${variantIndex} -> image at position ${variantIndex} (fallback)`)
        }
        
        if (matchingImage) {
          variantImageMap.set(variantIndex, matchingImage)
        }
      }
      
      // Associate images with variants in the created product
      let successCount = 0
      let failCount = 0
      
      for (let i = 0; i < createdProduct.variants.length && i < product.variants.length; i++) {
        const createdVariant = createdProduct.variants[i]
        const sourceVariant = product.variants[i]
        const matchingImage = variantImageMap.get(i)
        
        if (matchingImage && createdProduct.images) {
          // Find the corresponding image in the created product by src URL
          const createdImage = createdProduct.images.find((img: any) => img.src === matchingImage.src)
          
          if (createdImage && createdImage.id) {
            // Update variant to associate it with the image
            const updateVariantUrl = `https://${shopDomain}.myshopify.com/admin/api/2024-01/variants/${createdVariant.id}.json`
            
            try {
              const updateResponse = await fetch(updateVariantUrl, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'X-Shopify-Access-Token': adminToken,
                },
                body: JSON.stringify({
                  variant: {
                    image_id: createdImage.id,
                  },
                }),
              })

              if (updateResponse.ok) {
                const variantName = sourceVariant.option1 || sourceVariant.option2 || sourceVariant.option3 || `variant-${i + 1}`
                console.log(`  ✓ Associated image ID ${createdImage.id} with variant "${variantName}" (variant ID: ${createdVariant.id})`)
                successCount++
              } else {
                const errorText = await updateResponse.text()
                console.warn(`  ✗ Failed to associate image with variant ${createdVariant.id}: ${errorText}`)
                failCount++
              }
            } catch (err: any) {
              console.error(`  ✗ Error updating variant ${createdVariant.id} with image:`, err.message)
              failCount++
            }
          } else {
            console.warn(`  ✗ Could not find created image matching "${matchingImage.src.substring(0, 50)}..." for variant ${i}`)
            failCount++
          }
        } else {
          console.warn(`  ✗ No matching image found for variant ${i} (${sourceVariant.option1 || 'default'})`)
          failCount++
        }
      }
      
      console.log(`Completed variant image associations: ${successCount} successful, ${failCount} failed`)
    }

    return createdProduct
  } catch (error: any) {
    console.error(`Error creating product ${product.name}:`, error)
    throw error
  }
}

async function createShopifyCollection(
  shopDomain: string,
  adminToken: string,
  collection: Collection,
  productIds: number[]
) {
  const apiUrl = `https://${shopDomain}.myshopify.com/admin/api/2024-01/smart_collections.json?limit=5000`

  const collectionData = {
    smart_collection: {
      title: collection.name,
      body_html: collection.description,
      image: collection.image
        ? {
            src: collection.image,
          }
        : null,
      rules: [
        {
          column: 'id',
          relation: 'equals',
          condition: productIds.join(','),
        },
      ],
    },
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': adminToken,
      },
      body: JSON.stringify(collectionData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Failed to create collection ${collection.name}:`, errorText)
      // Try manual collection instead
      return await createManualCollection(shopDomain, adminToken, collection, productIds)
    }

    const data = await response.json()
    return data.smart_collection
  } catch (error: any) {
    console.error(`Error creating collection ${collection.name}:`, error)
    // Try manual collection as fallback
    return await createManualCollection(shopDomain, adminToken, collection, productIds)
  }
}

async function createManualCollection(
  shopDomain: string,
  adminToken: string,
  collection: Collection,
  productIds: number[]
) {
  const apiUrl = `https://${shopDomain}.myshopify.com/admin/api/2024-01/custom_collections.json?limit=5000`

  const collectionData = {
    custom_collection: {
      title: collection.name,
      body_html: collection.description,
      image: collection.image
        ? {
            src: collection.image,
          }
        : null,
    },
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': adminToken,
      },
      body: JSON.stringify(collectionData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to create collection: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const collectionId = data.custom_collection.id

    // Add products to collection
    for (const productId of productIds) {
      await addProductToCollection(shopDomain, adminToken, collectionId, productId)
    }

    return data.custom_collection
  } catch (error: any) {
    console.error(`Error creating manual collection ${collection.name}:`, error)
    throw error
  }
}

async function addProductToCollection(
  shopDomain: string,
  adminToken: string,
  collectionId: number,
  productId: number
) {
  const apiUrl = `https://${shopDomain}.myshopify.com/admin/api/2024-01/collects.json?limit=5000`

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': adminToken,
      },
      body: JSON.stringify({
        collect: {
          product_id: productId,
          collection_id: collectionId,
        },
      }),
    })

    if (!response.ok && response.status !== 422) {
      // 422 means product already in collection, which is fine
      const errorText = await response.text()
      console.error(`Failed to add product ${productId} to collection:`, errorText)
    }
  } catch (error) {
    console.error(`Error adding product to collection:`, error)
    // Don't throw - continue with other products
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: UploadRequest = await request.json()
    const { storeUrl, adminToken, products = [], collections = [], priceMultiplier, prefixKeyword, descriptionPrefixKeyword } = body

    if (!storeUrl || !adminToken) {
      return NextResponse.json(
        { error: 'Store URL and Admin Token are required', success: false },
        { status: 400 }
      )
    }

    const shopDomain = extractShopDomain(storeUrl)
    const multiplier = parseFloat(String(priceMultiplier)) || 1
    const prefix = prefixKeyword?.trim() || ''
    const descriptionPrefix = descriptionPrefixKeyword?.trim() || ''

    console.log(`Starting upload to ${shopDomain}...`)
    const uploadedProducts: number[] = []
    const uploadedCollections: number[] = []
    const errors: string[] = []

    // Upload products first
    if (products.length > 0) {
      console.log(`Checking and uploading ${products.length} products...`)
      for (const product of products) {
        try {
          // Use consistent product name generation
          const productName = generateProductName(product.name, prefix)
          
          // Check if product already exists (returns product data if found)
          const existingProduct = await checkProductExists(shopDomain, adminToken, productName)
          if (existingProduct) {
            console.log(`Product "${productName}" already exists (ID: ${existingProduct.id}), skipping...`)
            // Add existing product ID to uploaded list
            if (!uploadedProducts.includes(existingProduct.id)) {
              uploadedProducts.push(existingProduct.id)
            }
            continue
          }

          const createdProduct = await createShopifyProduct(
            shopDomain,
            adminToken,
            product,
            multiplier,
            prefix,
            descriptionPrefix
          )
          uploadedProducts.push(createdProduct.id)
          console.log(`Product "${productName}" uploaded successfully`)
        } catch (error: any) {
          const errorMsg = `Failed to upload product "${product.name}": ${error.message}`
          errors.push(errorMsg)
          console.error(errorMsg)
        }
      }
    }

    // Upload collections (with all their products)
    if (collections.length > 0) {
      console.log(`Checking and uploading ${collections.length} collections...`)
      for (const collection of collections) {
        try {
          // Check if collection already exists
          const collectionExists = await checkCollectionExists(shopDomain, adminToken, collection.name)
          if (collectionExists) {
            console.log(`Collection "${collection.name}" already exists, skipping...`)
            continue
          }

          const collectionProductIds: number[] = []

          // First, upload all products in the collection (skip existing ones)
          console.log(`Checking and uploading ${collection.products.length} products for collection "${collection.name}"...`)
          for (const product of collection.products) {
            try {
              // Use consistent product name generation
              const productName = generateProductName(product.name, prefix)
              
              // Check if product already exists (returns product data if found)
              const existingProduct = await checkProductExists(shopDomain, adminToken, productName)
              if (existingProduct) {
                console.log(`Product "${productName}" already exists (ID: ${existingProduct.id}), using for collection`)
                collectionProductIds.push(existingProduct.id)
                if (!uploadedProducts.includes(existingProduct.id)) {
                  uploadedProducts.push(existingProduct.id)
                }
                continue
              }

              const createdProduct = await createShopifyProduct(
                shopDomain,
                adminToken,
                product,
                multiplier,
                prefix,
                descriptionPrefix
              )
              collectionProductIds.push(createdProduct.id)
              if (!uploadedProducts.includes(createdProduct.id)) {
                uploadedProducts.push(createdProduct.id)
              }
              console.log(`Product "${productName}" uploaded for collection`)
            } catch (error: any) {
              const errorMsg = `Failed to upload product "${product.name}" in collection: ${error.message}`
              errors.push(errorMsg)
              console.error(errorMsg)
            }
          }

          // Then create the collection and link products
          if (collectionProductIds.length > 0) {
            const createdCollection = await createShopifyCollection(
              shopDomain,
              adminToken,
              collection,
              collectionProductIds
            )
            uploadedCollections.push(createdCollection.id)
            console.log(`Collection "${collection.name}" uploaded successfully`)
          } else {
            errors.push(`Collection "${collection.name}" has no products to upload`)
          }
        } catch (error: any) {
          const errorMsg = `Failed to upload collection "${collection.name}": ${error.message}`
          errors.push(errorMsg)
          console.error(errorMsg)
        }
      }
    }

    return NextResponse.json({
      success: true,
      uploadedProducts: uploadedProducts.length,
      uploadedCollections: uploadedCollections.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully uploaded ${uploadedProducts.length} products and ${uploadedCollections.length} collections`,
    })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to upload products/collections',
        success: false,
      },
      { status: 500 }
    )
  }
}

