'use client'

import { useState, useMemo } from 'react'
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Modal,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import CloseIcon from '@mui/icons-material/Close'
import { useApp } from '@/context/AppContext'
import { Collection } from '@/types'
import ProductDescription from './ProductDescription'
import { formatPriceUSD } from '@/utils/formatPrice'

type SortOption = 'name-asc' | 'name-desc'

export default function CollectionsSection() {
  const {
    collections,
    selectedCollections,
    toggleCollectionSelection,
    moveSelectedToReady,
    addToUploadReadyProducts,
  } = useApp()
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('name-asc')
  const [page, setPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(12)
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null)
  const [collectionProductsPage, setCollectionProductsPage] = useState(1)
  const [collectionProductsPerPage, setCollectionProductsPerPage] = useState(12)
  const [collectionSearchTerm, setCollectionSearchTerm] = useState('')
  const [selectedCollectionProducts, setSelectedCollectionProducts] = useState<string[]>([])

  // Use scraped collections from context
  const displayCollections = collections

  const filteredAndSorted = useMemo(() => {
    let filtered = displayCollections.filter(
      (collection) =>
        collection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        collection.description.toLowerCase().includes(searchTerm.toLowerCase())
    )

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name)
        case 'name-desc':
          return b.name.localeCompare(a.name)
        default:
          return 0
      }
    })

    return filtered
  }, [displayCollections, searchTerm, sortBy])

  const paginatedCollections = useMemo(() => {
    const start = (page - 1) * itemsPerPage
    return filteredAndSorted.slice(start, start + itemsPerPage)
  }, [filteredAndSorted, page, itemsPerPage])

  const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage)

  const handleCollectionClick = (collection: Collection) => {
    setSelectedCollection(collection)
    setSelectedCollectionProducts([])
    setCollectionProductsPage(1)
    setCollectionSearchTerm('')
  }

  const handleCloseModal = () => {
    setSelectedCollection(null)
    setSelectedCollectionProducts([])
  }

  const filteredCollectionProducts = useMemo(() => {
    if (!selectedCollection) return []
    return selectedCollection.products.filter(
      (product) =>
        product.name.toLowerCase().includes(collectionSearchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(collectionSearchTerm.toLowerCase())
    )
  }, [selectedCollection, collectionSearchTerm])

  const paginatedCollectionProducts = useMemo(() => {
    const start = (collectionProductsPage - 1) * collectionProductsPerPage
    return filteredCollectionProducts.slice(start, start + collectionProductsPerPage)
  }, [filteredCollectionProducts, collectionProductsPage, collectionProductsPerPage])

  const collectionProductsTotalPages = Math.ceil(filteredCollectionProducts.length / collectionProductsPerPage)

  const handleSelectAll = () => {
    if (!selectedCollection) return
    if (selectedCollectionProducts.length === filteredCollectionProducts.length) {
      setSelectedCollectionProducts([])
    } else {
      setSelectedCollectionProducts(filteredCollectionProducts.map((p) => p.id))
    }
  }

  const toggleCollectionProductSelection = (productId: string) => {
    setSelectedCollectionProducts((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    )
  }

  const handleCollectionReady = () => {
    if (!selectedCollection) return
    const selectedProductsList = selectedCollection.products.filter((p) =>
      selectedCollectionProducts.includes(p.id)
    )
    if (selectedProductsList.length > 0) {
      addToUploadReadyProducts(selectedProductsList)
    }
    handleCloseModal()
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Collections
        </Typography>
        <Button
          variant="contained"
          disabled={selectedCollections.length === 0}
          onClick={moveSelectedToReady}
          sx={{ minWidth: 120 }}
        >
          READY ({selectedCollections.length})
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search collections..."
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

      {displayCollections.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            No collections found. Please scrape a store from the navbar.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {paginatedCollections.map((collection) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={collection.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                border: selectedCollections.includes(collection.id) ? '2px solid #1976d2' : '1px solid #e0e0e0',
                '&:hover': { boxShadow: 3 },
              }}
              onClick={() => handleCollectionClick(collection)}
            >
              <Box sx={{ position: 'relative' }}>
                <CardMedia
                  component="img"
                  height="200"
                  image={collection.image}
                  alt={collection.name}
                  sx={{ objectFit: 'cover' }}
                />
                <Checkbox
                  checked={selectedCollections.includes(collection.id)}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    backgroundColor: 'white',
                    '&:hover': { backgroundColor: 'white' },
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleCollectionSelection(collection.id)
                  }}
                />
              </Box>
              <CardContent sx={{ flexGrow: 1, p: 2 }}>
                <Typography variant="h6" component="h3" gutterBottom sx={{ fontSize: '1rem', fontWeight: 'bold' }}>
                  {collection.name}
                </Typography>
                <ProductDescription description={collection.description} />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {collection.products.length} products
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
        </Grid>
      )}

      {displayCollections.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
          />
          <Typography variant="body2" color="text.secondary">
            Showing {paginatedCollections.length} of {filteredAndSorted.length} collections
          </Typography>
        </Box>
      )}

      {/* Collection Detail Modal */}
      <Dialog
        open={!!selectedCollection}
        onClose={handleCloseModal}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { maxHeight: '90vh' } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">{selectedCollection?.name}</Typography>
          <IconButton onClick={handleCloseModal}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedCollection && (
            <Box>
              <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <TextField
                  placeholder="Search products..."
                  size="small"
                  value={collectionSearchTerm}
                  onChange={(e) => setCollectionSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                  sx={{ flex: 1, minWidth: 200, backgroundColor: 'white' }}
                />
                <FormControl size="small" sx={{ minWidth: 120, backgroundColor: 'white' }}>
                  <InputLabel>Per Page</InputLabel>
                  <Select
                    value={collectionProductsPerPage}
                    label="Per Page"
                    onChange={(e) => {
                      setCollectionProductsPerPage(Number(e.target.value))
                      setCollectionProductsPage(1)
                    }}
                  >
                    <MenuItem value={6}>6</MenuItem>
                    <MenuItem value={12}>12</MenuItem>
                    <MenuItem value={24}>24</MenuItem>
                    <MenuItem value={48}>48</MenuItem>
                  </Select>
                </FormControl>
                <Button variant="outlined" onClick={handleSelectAll} sx={{ minWidth: 100 }}>
                  {selectedCollectionProducts.length === filteredCollectionProducts.length
                    ? 'DESELECT ALL'
                    : 'SELECT ALL'}
                </Button>
                <Button
                  variant="contained"
                  disabled={selectedCollectionProducts.length === 0}
                  onClick={handleCollectionReady}
                  sx={{ minWidth: 100 }}
                >
                  READY ({selectedCollectionProducts.length})
                </Button>
              </Box>

              <Grid container spacing={2} sx={{ mb: 2 }}>
                {paginatedCollectionProducts.map((product) => (
                  <Grid item xs={12} sm={6} md={4} key={product.id}>
                    <Card
                      sx={{
                        border: selectedCollectionProducts.includes(product.id)
                          ? '2px solid #1976d2'
                          : '1px solid #e0e0e0',
                        '&:hover': { boxShadow: 2 },
                      }}
                      onClick={() => toggleCollectionProductSelection(product.id)}
                    >
                      <Box sx={{ position: 'relative' }}>
                        <CardMedia
                          component="img"
                          height="150"
                          image={product.image}
                          alt={product.name}
                          sx={{ objectFit: 'cover' }}
                        />
                        <Checkbox
                          checked={selectedCollectionProducts.includes(product.id)}
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            backgroundColor: 'white',
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleCollectionProductSelection(product.id)
                          }}
                        />
                      </Box>
                      <CardContent sx={{ p: 1.5 }}>
                        <Typography variant="body1" sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                          {product.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {formatPriceUSD(product.price)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
                <Pagination
                  count={collectionProductsTotalPages}
                  page={collectionProductsPage}
                  onChange={(_, value) => setCollectionProductsPage(value)}
                  color="primary"
                  size="small"
                />
                <Typography variant="body2" color="text.secondary">
                  Showing {paginatedCollectionProducts.length} of {filteredCollectionProducts.length} products
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  )
}

