'use client'

import { useState, useMemo } from 'react'
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  CardMedia,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  CircularProgress,
  LinearProgress,
  Divider,
  FormControlLabel,
  Switch,
  Snackbar,
  Alert,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import SearchIcon from '@mui/icons-material/Search'
import { useApp } from '@/context/AppContext'
import ProductDescription from './ProductDescription'
import { formatPriceUSD } from '@/utils/formatPrice'

type SortOption = 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc'

export default function UploadReadySection() {
  const {
    uploadReadyProducts,
    uploadReadyCollections,
    removeFromUploadReadyProducts,
    removeFromUploadReadyCollections,
    addHistory,
    scrapeStoreUrl,
  } = useApp()

  const [productsPage, setProductsPage] = useState(1)
  const [productsPerPage, setProductsPerPage] = useState(12)
  const [productsSearchTerm, setProductsSearchTerm] = useState('')
  const [productsSortBy, setProductsSortBy] = useState<SortOption>('name-asc')

  const [collectionsPage, setCollectionsPage] = useState(1)
  const [collectionsPerPage, setCollectionsPerPage] = useState(12)
  const [collectionsSearchTerm, setCollectionsSearchTerm] = useState('')
  const [collectionsSortBy, setCollectionsSortBy] = useState<SortOption>('name-asc')

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [uploadType, setUploadType] = useState<'products' | 'collections'>('products')
  const [myStoreUrl, setMyStoreUrl] = useState('')
  const [myStoreAdminToken, setMyStoreAdminToken] = useState('')
  const [priceMultiplier, setPriceMultiplier] = useState('1')
  const [prefixKeyword, setPrefixKeyword] = useState('')
  const [descriptionPrefixKeyword, setDescriptionPrefixKeyword] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [notification, setNotification] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error' | 'info' | 'warning'
    details?: string[]
  }>({
    open: false,
    message: '',
    severity: 'success',
  })

  const filteredProducts = useMemo(() => {
    let filtered = uploadReadyProducts.filter(
      (product) =>
        product.name.toLowerCase().includes(productsSearchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(productsSearchTerm.toLowerCase())
    )

    filtered.sort((a, b) => {
      switch (productsSortBy) {
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
  }, [uploadReadyProducts, productsSearchTerm, productsSortBy])

  const paginatedProducts = useMemo(() => {
    const start = (productsPage - 1) * productsPerPage
    return filteredProducts.slice(start, start + productsPerPage)
  }, [filteredProducts, productsPage, productsPerPage])

  const productsTotalPages = Math.ceil(filteredProducts.length / productsPerPage)

  const filteredCollections = useMemo(() => {
    let filtered = uploadReadyCollections.filter(
      (collection) =>
        collection.name.toLowerCase().includes(collectionsSearchTerm.toLowerCase()) ||
        collection.description.toLowerCase().includes(collectionsSearchTerm.toLowerCase())
    )

    filtered.sort((a, b) => {
      switch (collectionsSortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name)
        case 'name-desc':
          return b.name.localeCompare(a.name)
        default:
          return 0
      }
    })

    return filtered
  }, [uploadReadyCollections, collectionsSearchTerm, collectionsSortBy])

  const paginatedCollections = useMemo(() => {
    const start = (collectionsPage - 1) * collectionsPerPage
    return filteredCollections.slice(start, start + collectionsPerPage)
  }, [filteredCollections, collectionsPage, collectionsPerPage])

  const collectionsTotalPages = Math.ceil(filteredCollections.length / collectionsPerPage)

  const handleUploadClick = (type: 'products' | 'collections') => {
    setUploadType(type)
    setUploadDialogOpen(true)
  }

  const handleFinalUpload = async () => {
    if (!myStoreUrl.trim() || !myStoreAdminToken.trim()) {
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const multiplier = parseFloat(priceMultiplier) || 1
      const productsToUpload = uploadType === 'products' ? uploadReadyProducts : []
      const collectionsToUpload = uploadType === 'collections' ? uploadReadyCollections : []

      // Calculate total items for progress tracking
      let totalItems = productsToUpload.length
      if (collectionsToUpload.length > 0) {
        // For collections, count products within collections
        totalItems = collectionsToUpload.reduce((sum, col) => sum + col.products.length, 0)
      }

      // Simulate progress updates during upload
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            return prev // Don't go to 100 until upload completes
          }
          return prev + 2
        })
      }, 200)

      // Call the upload API
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storeUrl: myStoreUrl.trim(),
          adminToken: myStoreAdminToken.trim(),
          products: productsToUpload,
          collections: collectionsToUpload,
          priceMultiplier: multiplier,
          prefixKeyword: prefixKeyword.trim(),
          descriptionPrefixKeyword: descriptionPrefixKeyword.trim(),
        }),
      })

      clearInterval(progressInterval)
      setUploadProgress(90)

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Upload failed')
      }

      setUploadProgress(100)

      // Prepare notification message with details
      let notificationMessage = `Upload completed! `
      const details: string[] = []
      
      if (data.uploadedProducts !== undefined) {
        details.push(`${data.uploadedProducts} product(s) uploaded`)
      }
      if (data.uploadedCollections !== undefined) {
        details.push(`${data.uploadedCollections} collection(s) uploaded`)
      }
      if (data.errors && data.errors.length > 0) {
        details.push(`${data.errors.length} error(s) occurred`)
      }

      notificationMessage += details.join(', ')

      // Show notification with details
      setNotification({
        open: true,
        message: notificationMessage,
        severity: data.errors && data.errors.length > 0 ? 'warning' : 'success',
        details: data.errors && data.errors.length > 0 ? data.errors : undefined,
      })

      // Add to history
      const productNames = uploadType === 'products' 
        ? uploadReadyProducts.map((p) => p.name)
        : collectionsToUpload.flatMap((c) => c.products.map((p) => p.name))
      const collectionNames = uploadType === 'collections' 
        ? uploadReadyCollections.map((c) => c.name)
        : []

      addHistory({
        id: `history-${Date.now()}`,
        scrapeStoreUrl: scrapeStoreUrl || 'Unknown',
        myStoreUrl: myStoreUrl.trim(),
        productNames,
        collectionNames,
        dateTime: new Date().toLocaleString(),
      })

      // Clear upload ready items after successful upload
      // Create arrays of IDs first to avoid state mutation during iteration
      if (uploadType === 'products') {
        const productIdsToRemove = uploadReadyProducts.map((p) => p.id)
        productIdsToRemove.forEach((id) => removeFromUploadReadyProducts(id))
      } else {
        const collectionIdsToRemove = uploadReadyCollections.map((c) => c.id)
        collectionIdsToRemove.forEach((id) => removeFromUploadReadyCollections(id))
      }

      // Wait a bit to show 100% progress
      await new Promise((resolve) => setTimeout(resolve, 500))

      setIsUploading(false)
      setUploadDialogOpen(false)
      setUploadProgress(0)
      setMyStoreUrl('')
      setMyStoreAdminToken('')
      setPriceMultiplier('1')
      setPrefixKeyword('')
      setDescriptionPrefixKeyword('')
    } catch (error: any) {
      console.error('Upload error:', error)
      setIsUploading(false)
      setUploadProgress(0)
      setNotification({
        open: true,
        message: `Upload failed: ${error.message}`,
        severity: 'error',
      })
    }
  }

  const handleCancelUpload = () => {
    setUploadDialogOpen(false)
    setIsUploading(false)
    setUploadProgress(0)
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
        Upload Ready
      </Typography>

      <Grid container spacing={2}>
        {/* Ready Products */}
        <Grid item xs={12} md={6}>
          <Box sx={{ backgroundColor: 'white', p: 2, borderRadius: 1, height: '100%', minHeight: 600 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                READY-PRODUCTS ({filteredProducts.length})
              </Typography>
              <Button
                variant="contained"
                startIcon={<UploadFileIcon />}
                disabled={filteredProducts.length === 0}
                onClick={() => handleUploadClick('products')}
              >
                UPLOAD
              </Button>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
              <TextField
                placeholder="Search..."
                size="small"
                value={productsSearchTerm}
                onChange={(e) => setProductsSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />,
                }}
                sx={{ flex: 1, minWidth: 150, backgroundColor: '#f5f5f5' }}
              />
              <FormControl size="small" sx={{ minWidth: 120, backgroundColor: '#f5f5f5' }}>
                <InputLabel>Sort</InputLabel>
                <Select
                  value={productsSortBy}
                  label="Sort"
                  onChange={(e) => setProductsSortBy(e.target.value as SortOption)}
                >
                  <MenuItem value="name-asc">Name (A-Z)</MenuItem>
                  <MenuItem value="name-desc">Name (Z-A)</MenuItem>
                  <MenuItem value="price-asc">Price (Low-High)</MenuItem>
                  <MenuItem value="price-desc">Price (High-Low)</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 100, backgroundColor: '#f5f5f5' }}>
                <InputLabel>Per Page</InputLabel>
                <Select
                  value={productsPerPage}
                  label="Per Page"
                  onChange={(e) => {
                    setProductsPerPage(Number(e.target.value))
                    setProductsPage(1)
                  }}
                >
                  <MenuItem value={6}>6</MenuItem>
                  <MenuItem value={12}>12</MenuItem>
                  <MenuItem value={24}>24</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ maxHeight: 400, overflowY: 'auto', mb: 2 }}>
              <Grid container spacing={1}>
                {paginatedProducts.map((product) => (
                  <Grid item xs={12} key={product.id}>
                    <Card
                      sx={{
                        display: 'flex',
                        border: '1px solid #e0e0e0',
                        '&:hover': { boxShadow: 2 },
                      }}
                    >
                      <CardMedia
                        component="img"
                        sx={{ width: 100, objectFit: 'cover' }}
                        image={product.image}
                        alt={product.name}
                      />
                      <CardContent sx={{ flex: 1, p: 1.5, display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="body1" sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                          {product.name}
                        </Typography>
                        <ProductDescription description={product.description} maxLength={20} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                            {formatPriceUSD(product.price)}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => removeFromUploadReadyProducts(product.id)}
                            sx={{ color: 'error.main' }}
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
              <Pagination
                count={productsTotalPages}
                page={productsPage}
                onChange={(_, value) => setProductsPage(value)}
                color="primary"
                size="small"
              />
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                {paginatedProducts.length} of {filteredProducts.length}
              </Typography>
            </Box>
          </Box>
        </Grid>

        {/* Ready Collections */}
        <Grid item xs={12} md={6}>
          <Box sx={{ backgroundColor: 'white', p: 2, borderRadius: 1, height: '100%', minHeight: 600 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                READY-COLLECTIONS ({filteredCollections.length})
              </Typography>
              <Button
                variant="contained"
                startIcon={<UploadFileIcon />}
                disabled={filteredCollections.length === 0}
                onClick={() => handleUploadClick('collections')}
                color="secondary"
              >
                UPLOAD
              </Button>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
              <TextField
                placeholder="Search..."
                size="small"
                value={collectionsSearchTerm}
                onChange={(e) => setCollectionsSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />,
                }}
                sx={{ flex: 1, minWidth: 150, backgroundColor: '#f5f5f5' }}
              />
              <FormControl size="small" sx={{ minWidth: 120, backgroundColor: '#f5f5f5' }}>
                <InputLabel>Sort</InputLabel>
                <Select
                  value={collectionsSortBy}
                  label="Sort"
                  onChange={(e) => setCollectionsSortBy(e.target.value as SortOption)}
                >
                  <MenuItem value="name-asc">Name (A-Z)</MenuItem>
                  <MenuItem value="name-desc">Name (Z-A)</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 100, backgroundColor: '#f5f5f5' }}>
                <InputLabel>Per Page</InputLabel>
                <Select
                  value={collectionsPerPage}
                  label="Per Page"
                  onChange={(e) => {
                    setCollectionsPerPage(Number(e.target.value))
                    setCollectionsPage(1)
                  }}
                >
                  <MenuItem value={6}>6</MenuItem>
                  <MenuItem value={12}>12</MenuItem>
                  <MenuItem value={24}>24</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ maxHeight: 400, overflowY: 'auto', mb: 2 }}>
              <Grid container spacing={1}>
                {paginatedCollections.map((collection) => (
                  <Grid item xs={12} key={collection.id}>
                    <Card
                      sx={{
                        display: 'flex',
                        border: '1px solid #e0e0e0',
                        '&:hover': { boxShadow: 2 },
                      }}
                    >
                      <CardMedia
                        component="img"
                        sx={{ width: 100, objectFit: 'cover' }}
                        image={collection.image}
                        alt={collection.name}
                      />
                      <CardContent sx={{ flex: 1, p: 1.5, display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="body1" sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                          {collection.name}
                        </Typography>
                        <ProductDescription description={collection.description} maxLength={20} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            {collection.products.length} products
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => removeFromUploadReadyCollections(collection.id)}
                            sx={{ color: 'error.main' }}
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
              <Pagination
                count={collectionsTotalPages}
                page={collectionsPage}
                onChange={(_, value) => setCollectionsPage(value)}
                color="secondary"
                size="small"
              />
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                {paginatedCollections.length} of {filteredCollections.length}
              </Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={handleCancelUpload} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Upload {uploadType === 'products' ? 'Products' : 'Collections'}</Typography>
            {!isUploading && (
              <IconButton onClick={handleCancelUpload}>
                <CloseIcon />
              </IconButton>
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {isUploading ? (
            <Box sx={{ py: 4 }}>
              <Typography variant="body1" align="center" gutterBottom>
                Uploading... {uploadProgress}%
              </Typography>
              <LinearProgress variant="determinate" value={uploadProgress} sx={{ mt: 2, height: 8, borderRadius: 4 }} />
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                label="My Store Link"
                fullWidth
                value={myStoreUrl}
                onChange={(e) => setMyStoreUrl(e.target.value)}
                placeholder="https://my-store.myshopify.com"
              />
              <TextField
                label="My Store Admin Token"
                fullWidth
                type="password"
                value={myStoreAdminToken}
                onChange={(e) => setMyStoreAdminToken(e.target.value)}
                placeholder="Enter admin token"
              />
              <TextField
                label="Price Multiplier"
                fullWidth
                type="number"
                value={priceMultiplier}
                onChange={(e) => setPriceMultiplier(e.target.value)}
                inputProps={{ min: 0, step: 0.1 }}
                helperText="Multiply product prices by this number"
              />
              <TextField
                label="Product Name Prefix Keyword"
                fullWidth
                value={prefixKeyword}
                onChange={(e) => setPrefixKeyword(e.target.value)}
                placeholder="e.g., 'NEW' or 'PREMIUM'"
                helperText="Add this keyword as a prefix to product names"
              />
              <TextField
                label="Product Description Prefix Keyword"
                fullWidth
                value={descriptionPrefixKeyword}
                onChange={(e) => setDescriptionPrefixKeyword(e.target.value)}
                placeholder="e.g., 'NEW' or 'PREMIUM'"
                helperText="Add this keyword as a prefix to product descriptions"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          {!isUploading && (
            <>
              <Button onClick={handleCancelUpload}>Cancel</Button>
              <Button
                variant="contained"
                onClick={handleFinalUpload}
                disabled={!myStoreUrl || !myStoreAdminToken}
              >
                FINAL-UPLOAD
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={notification.details ? 10000 : 6000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setNotification({ ...notification, open: false })}
          severity={notification.severity}
          sx={{ width: '100%', maxWidth: 500 }}
          variant="filled"
        >
          <Typography variant="body1" sx={{ fontWeight: 'bold', mb: notification.details ? 1 : 0 }}>
            {notification.message}
          </Typography>
          {notification.details && notification.details.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
                Error Details:
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 2, fontSize: '0.75rem' }}>
                {notification.details.slice(0, 5).map((error, index) => (
                  <li key={index}>
                    <Typography variant="caption">{error}</Typography>
                  </li>
                ))}
                {notification.details.length > 5 && (
                  <li>
                    <Typography variant="caption">
                      ...and {notification.details.length - 5} more error(s)
                    </Typography>
                  </li>
                )}
              </Box>
            </Box>
          )}
        </Alert>
      </Snackbar>
    </Box>
  )
}

