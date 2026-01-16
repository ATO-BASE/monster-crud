'use client'

import { useState, useEffect } from 'react'
import { Box, IconButton } from '@mui/material'
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos'
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'

const images = [
  {
    url: '/assets/landing1.png',
    alt: 'MONSTER Landing Page 1',
  },
  {
    url: '/assets/landing2.png',
    alt: 'MONSTER Landing Page 2',
  },
  {
    url: '/assets/landing3.png',
    alt: 'MONSTER Landing Page 3',
  },
]

export default function ImageCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: '95vh',
        overflow: 'hidden',
        backgroundColor: '#e0e0e0',
      }}
    >
      <Box
        component="img"
        src={images[currentIndex].url}
        alt={images[currentIndex].alt}
        sx={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
      <IconButton
        onClick={handlePrevious}
        sx={{
          position: 'absolute',
          left: 10,
          top: '50%',
          transform: 'translateY(-50%)',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.9)' },
        }}
      >
        <ArrowBackIosIcon />
      </IconButton>
      <IconButton
        onClick={handleNext}
        sx={{
          position: 'absolute',
          right: 10,
          top: '50%',
          transform: 'translateY(-50%)',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.9)' },
        }}
      >
        <ArrowForwardIosIcon />
      </IconButton>
      <Box
        sx={{
          position: 'absolute',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 1,
        }}
      >
        {images.map((_, index) => (
          <Box
            key={index}
            onClick={() => setCurrentIndex(index)}
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: index === currentIndex ? 'white' : 'rgba(255, 255, 255, 0.5)',
              cursor: 'pointer',
              transition: 'background-color 0.3s',
            }}
          />
        ))}
      </Box>
    </Box>
  )
}

