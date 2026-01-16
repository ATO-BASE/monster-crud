'use client'

import { useState, useEffect, useCallback } from 'react'
import { Box } from '@mui/material'
import { useApp } from '@/context/AppContext'
import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import ProductsSection from './ProductsSection'
import CollectionsSection from './CollectionsSection'
import HistorySection from './HistorySection'
import UploadReadySection from './UploadReadySection'
import { Product, Collection } from '@/types'

type TabType = 'upload-ready' | 'products' | 'collections' | 'history'

export default function DNUContent() {
  const [activeTab, setActiveTab] = useState<TabType>('upload-ready')

  return (
    <Box sx={{ display: 'flex', minHeight: 'calc(100vh - 160px)', backgroundColor: '#f5f5f5' }}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <Box sx={{ flex: 1, p: 2 }}>
        {activeTab === 'upload-ready' && <UploadReadySection />}
        {activeTab === 'products' && <ProductsSection navigateToTab={setActiveTab} />}
        {activeTab === 'collections' && <CollectionsSection />}
        {activeTab === 'history' && <HistorySection />}
      </Box>
    </Box>
  )
}

