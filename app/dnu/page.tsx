'use client'

import { useState, useEffect } from 'react'
import { Box } from '@mui/material'
import Sidebar from '@/components/dnu/Sidebar'
import ProductsSection from '@/components/dnu/ProductsSection'
import CollectionsSection from '@/components/dnu/CollectionsSection'
import HistorySection from '@/components/dnu/HistorySection'
import UploadReadySection from '@/components/dnu/UploadReadySection'
import DNUContent from '@/components/dnu/DNUContent'

type TabType = 'upload-ready' | 'products' | 'collections' | 'history'

export default function DNUPage() {
  return <DNUContent />
}

