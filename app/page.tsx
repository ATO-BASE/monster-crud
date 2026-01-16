'use client'

import { useState, useEffect } from 'react'
import { Container, Box, Typography, Button } from '@mui/material'
import ImageCarousel from '@/components/ImageCarousel'
import Link from 'next/link'

export default function Home() {
  return (
    <Box>
      <ImageCarousel />
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Box sx={{ textAlign: 'center', maxWidth: 800, mx: 'auto' }}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
            Welcome to MONSTER
          </Typography>
          <Typography variant="h6" color="text.secondary" paragraph sx={{ mb: 4, lineHeight: 1.8 }}>
            MONSTER is a powerful tool designed to streamline your Shopify store management. 
            Easily scrape products and collections from any Shopify store and upload them to your own store 
            with customizable pricing, keywords, and settings. Save time and effort with our intuitive interface 
            that maximizes screen space and focuses on usability.
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 4, lineHeight: 1.8 }}>
            Whether you&apos;re looking to expand your product catalog or analyze competitor offerings, 
            MONSTER provides all the tools you need in one place. Start by entering a store URL in the navbar 
            and begin your product discovery journey.
          </Typography>
          <Button
            variant="contained"
            size="large"
            component={Link}
            href="/dnu"
            sx={{ px: 4, py: 1.5, fontSize: '1.1rem' }}
          >
            Get Started
          </Button>
        </Box>
      </Container>
    </Box>
  )
}

