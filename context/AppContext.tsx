'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { Product, Collection, UploadHistory } from '@/types'

interface AppContextType {
  products: Product[]
  collections: Collection[]
  scrapeStoreUrl: string
  selectedProducts: string[]
  selectedCollections: string[]
  uploadReadyProducts: Product[]
  uploadReadyCollections: Collection[]
  history: UploadHistory[]
  setProducts: (products: Product[]) => void
  setCollections: (collections: Collection[]) => void
  setScrapeStoreUrl: (url: string) => void
  toggleProductSelection: (productId: string) => void
  toggleCollectionSelection: (collectionId: string) => void
  moveSelectedToReady: () => void
  addToUploadReadyProducts: (products: Product[]) => void
  addToUploadReadyCollections: (collections: Collection[]) => void
  removeFromUploadReadyProducts: (productId: string) => void
  removeFromUploadReadyCollections: (collectionId: string) => void
  addHistory: (history: UploadHistory) => void
  removeHistory: (historyId: string) => void
  clearSelected: () => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [scrapeStoreUrl, setScrapeStoreUrl] = useState<string>('')
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [selectedCollections, setSelectedCollections] = useState<string[]>([])
  const [uploadReadyProducts, setUploadReadyProducts] = useState<Product[]>([])
  const [uploadReadyCollections, setUploadReadyCollections] = useState<Collection[]>([])
  const [history, setHistory] = useState<UploadHistory[]>([])

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    )
  }

  const toggleCollectionSelection = (collectionId: string) => {
    setSelectedCollections((prev) =>
      prev.includes(collectionId)
        ? prev.filter((id) => id !== collectionId)
        : [...prev, collectionId]
    )
  }

  const moveSelectedToReady = () => {
    const selectedProductsList = products.filter((p) => selectedProducts.includes(p.id))
    const selectedCollectionsList = collections.filter((c) => selectedCollections.includes(c.id))
    
    setUploadReadyProducts((prev) => [...prev, ...selectedProductsList])
    setUploadReadyCollections((prev) => [...prev, ...selectedCollectionsList])
    setSelectedProducts([])
    setSelectedCollections([])
  }

  const addToUploadReadyProducts = (newProducts: Product[]) => {
    setUploadReadyProducts((prev) => [...prev, ...newProducts])
  }

  const addToUploadReadyCollections = (newCollections: Collection[]) => {
    setUploadReadyCollections((prev) => [...prev, ...newCollections])
  }

  const removeFromUploadReadyProducts = (productId: string) => {
    setUploadReadyProducts((prev) => prev.filter((p) => p.id !== productId))
  }

  const removeFromUploadReadyCollections = (collectionId: string) => {
    setUploadReadyCollections((prev) => prev.filter((c) => c.id !== collectionId))
  }

  const addHistory = (newHistory: UploadHistory) => {
    setHistory((prev) => [newHistory, ...prev])
  }

  const removeHistory = (historyId: string) => {
    setHistory((prev) => prev.filter((h) => h.id !== historyId))
  }

  const clearSelected = () => {
    setSelectedProducts([])
    setSelectedCollections([])
  }

  return (
    <AppContext.Provider
      value={{
        products,
        collections,
        scrapeStoreUrl,
        selectedProducts,
        selectedCollections,
        uploadReadyProducts,
        uploadReadyCollections,
        history,
        setProducts,
        setCollections,
        setScrapeStoreUrl,
        toggleProductSelection,
        toggleCollectionSelection,
        moveSelectedToReady,
        addToUploadReadyProducts,
        addToUploadReadyCollections,
        removeFromUploadReadyProducts,
        removeFromUploadReadyCollections,
        addHistory,
        removeHistory,
        clearSelected,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}

