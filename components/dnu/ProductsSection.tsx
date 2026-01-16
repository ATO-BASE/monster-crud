'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  Box,
  TextField,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Checkbox,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Pagination,
  SelectChangeEvent,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import { useApp } from '@/context/AppContext'
import ProductDescription from './ProductDescription'
import { formatPriceUSD } from '@/utils/formatPrice'

type SortOption = 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc'

interface ProductsSectionProps {
  navigateToTab?: (tab: 'upload-ready' | 'products' | 'collections' | 'history') => void
}

export default function ProductsSection({ navigateToTab }: ProductsSectionProps) {
  const { products, selectedProducts, toggleProductSelection, moveSelectedToReady } = useApp()
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('name-asc')
  const [page, setPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(12)

  // Use scraped products from context, or show empty state
  const displayProducts = products

  // Reset page when search term or sort changes
  useEffect(() => {
    setPage(1)
  }, [searchTerm, sortBy])

  const filteredAndSorted = useMemo(() => {
    let filtered = displayProducts.filter(
      (product) => {
        const searchLower = searchTerm.toLowerCase()
        const nameMatch = product.name?.toLowerCase().includes(searchLower) ?? false
        const descMatch = (product.description || '').toLowerCase().includes(searchLower)
        return nameMatch || descMatch
      }
    )

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name)
        case 'name-desc':
          return b.name.localeCompare(a.name)
        case 'price-asc':
          return a.price - b.price
        case 'price-desc':
          return b.price - a.price
        default:
          return 0
      }
    })

    return filtered
  }, [displayProducts, searchTerm, sortBy])

  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * itemsPerPage
    return filteredAndSorted.slice(start, start + itemsPerPage)
  }, [filteredAndSorted, page, itemsPerPage])

  const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage)

  const handleReady = () => {
    if (selectedProducts.length > 0) {
      moveSelectedToReady()
      if (navigateToTab) {
        navigateToTab('upload-ready')
      }
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Products
        </Typography>
        <Button
          variant="contained"
          disabled={selectedProducts.length === 0}
          onClick={handleReady}
          sx={{ minWidth: 120 }}
        >
          READY ({selectedProducts.length})
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search products..."
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
          sx={{ flex: 1, minWidth: 200, backgroundColor: 'white' }}
        />
        <FormControl size="small" sx={{ minWidth: 150, backgroundColor: 'white' }}>
          <InputLabel>Sort By</InputLabel>
          <Select value={sortBy} label="Sort By" onChange={(e) => setSortBy(e.target.value as SortOption)}>
            <MenuItem value="name-asc">Name (A-Z)</MenuItem>
            <MenuItem value="name-desc">Name (Z-A)</MenuItem>
            <MenuItem value="price-asc">Price (Low-High)</MenuItem>
            <MenuItem value="price-desc">Price (High-Low)</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120, backgroundColor: 'white' }}>
          <InputLabel>Per Page</InputLabel>
          <Select
            value={itemsPerPage}
            label="Per Page"
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value))
              setPage(1)
            }}
          >
            <MenuItem value={6}>6</MenuItem>
            <MenuItem value={12}>12</MenuItem>
            <MenuItem value={24}>24</MenuItem>
            <MenuItem value={48}>48</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {displayProducts.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            No products found. Please scrape a store from the navbar.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {paginatedProducts.map((product) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                border: selectedProducts.includes(product.id) ? '2px solid #1976d2' : '1px solid #e0e0e0',
                '&:hover': { boxShadow: 3 },
              }}
              onClick={() => toggleProductSelection(product.id)}
            >
              <Box sx={{ position: 'relative' }}>
                <CardMedia
                  component="img"
                  height="200"
                  image={product.image}
                  alt={product.name}
                  sx={{ objectFit: 'cover' }}
                />
                <Checkbox
                  checked={selectedProducts.includes(product.id)}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    backgroundColor: 'white',
                    '&:hover': { backgroundColor: 'white' },
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleProductSelection(product.id)
                  }}
                />
              </Box>
              <CardContent sx={{ flexGrow: 1, p: 2 }}>
                <Typography variant="h6" component="h3" gutterBottom sx={{ fontSize: '1rem', fontWeight: 'bold' }}>
                  {product.name}
                </Typography>
                <ProductDescription description={product.description} />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontWeight: 'bold' }}>
                  {formatPriceUSD(product.price)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
        </Grid>
      )}

      {displayProducts.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
          />
          <Typography variant="body2" color="text.secondary">
            Showing {paginatedProducts.length} of {filteredAndSorted.length} products
          </Typography>
        </Box>
      )}
    </Box>
  )
}

