'use client'

import { useState } from 'react'
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  TextField,
  Box,
  InputAdornment,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { useApp } from '@/context/AppContext'

export default function Navbar() {
  const router = useRouter()
  const { setProducts, setCollections, setScrapeStoreUrl } = useApp()
  const [storeUrl, setStoreUrl] = useState('')
  const [navValue, setNavValue] = useState('home')
  const [isScraping, setIsScraping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successNotification, setSuccessNotification] = useState<{
    open: boolean
    message: string
    productsCount?: number
    collectionsCount?: number
  }>({
    open: false,
    message: '',
  })

  const handleConfirm = async () => {
    if (!storeUrl.trim()) {
      setError('Please enter a store URL')
      return
    }

    

    setIsScraping(true)
    setError(null)

    try {
      console.log('Starting scrape for:', storeUrl)
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ storeUrl }),
      })

      console.log('Response status:', response.status, response.statusText)

      if (!response.ok) {
        let errorMessage = `Server error: ${response.status} ${response.statusText}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (e) {
          // If response is not JSON, use status text
          const text = await response.text()
          errorMessage = text || errorMessage
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log('Scrape response:', { success: data.success, productsCount: data.products?.length, collectionsCount: data.collections?.length })

      if (!data.success) {
        throw new Error(data.error || 'Failed to scrape store')
      }

      const productsCount = data.products?.length || 0
      const collectionsCount = data.collections?.length || 0

      // Store scraped data directly in AppContext (no localStorage/sessionStorage)
      setProducts(data.products || [])
      setCollections(data.collections || [])
      setScrapeStoreUrl(data.storeUrl || storeUrl)

      console.log('Data stored successfully in context:', {
        productsCount: productsCount,
        collectionsCount: collectionsCount,
      })
      
      // Show success notification
      setSuccessNotification({
        open: true,
        message: `Successfully scraped ${productsCount} product(s) and ${collectionsCount} collection(s) from the store!`,
        productsCount,
        collectionsCount,
      })

      // Navigate to D&U page after a short delay to show notification
      setTimeout(() => {
        router.push('/dnu')
      }, 1500)
    } catch (err: any) {
      console.error('Scraping error details:', err)
      const errorMessage = err.message || 'Failed to scrape store. Please check the URL and try again.'
      setError(errorMessage)
    } finally {
      setIsScraping(false)
    }
  }

  return (
    <AppBar position="static" sx={{ backgroundColor: '#1976d2' }}>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Typography
            variant="h5"
            component={Link}
            href="/"
            sx={{
              fontWeight: 'bold',
              color: 'white',
              textDecoration: 'none',
              '&:hover': { opacity: 0.8 },
            }}
          >
            MONSTER
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              color="inherit"
              component={Link}
              href="/"
              onClick={() => setNavValue('home')}
              sx={{ fontWeight: navValue === 'home' ? 'bold' : 'normal' }}
            >
              HOME
            </Button>
            <Button
              color="inherit"
              component={Link}
              href="/dnu"
              onClick={() => setNavValue('dnu')}
              sx={{ fontWeight: navValue === 'dnu' ? 'bold' : 'normal' }}
            >
              D&U
            </Button>
            <Button
              color="inherit"
              component={Link}
              href="/about"
              onClick={() => setNavValue('about')}
              sx={{ fontWeight: navValue === 'about' ? 'bold' : 'normal' }}
            >
              ABOUT
            </Button>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, maxWidth: 400, ml: 2 }}>
          <TextField
            placeholder="Store URL to scrape"
            size="small"
            value={storeUrl}
            onChange={(e) => setStoreUrl(e.target.value)}
            sx={{
              flex: 1,
              backgroundColor: 'white',
              borderRadius: 1,
              '& .MuiOutlinedInput-root': {
                '& fieldset': { border: 'none' },
              },
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && storeUrl.trim() && !isScraping) {
                handleConfirm()
              }
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton 
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleConfirm()
                    }} 
                    disabled={!storeUrl.trim() || isScraping}
                    type="button"
                  >
                    {isScraping ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      <CheckCircleIcon 
                        color={storeUrl.trim() ? 'primary' : 'disabled'} 
                        sx={{ fontSize: 24 }}
                      />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Toolbar>
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      {/* Success Notification */}
      <Snackbar
        open={successNotification.open}
        autoHideDuration={5000}
        onClose={() => setSuccessNotification({ ...successNotification, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSuccessNotification({ ...successNotification, open: false })}
          severity="success"
          sx={{ width: '100%', maxWidth: 500 }}
          variant="filled"
        >
          <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
            {successNotification.message}
          </Typography>
          {successNotification.productsCount !== undefined && successNotification.collectionsCount !== undefined && (
            <Typography variant="body2" sx={{ fontSize: '0.875rem', opacity: 0.9 }}>
              {successNotification.productsCount} product(s) • {successNotification.collectionsCount} collection(s)
            </Typography>
          )}
        </Alert>
      </Snackbar>
    </AppBar>
  )
}

