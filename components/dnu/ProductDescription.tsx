'use client'

import { useState } from 'react'
import { Typography, Button, Box } from '@mui/material'

interface ProductDescriptionProps {
  description: string
  maxLength?: number
}

export default function ProductDescription({ description, maxLength = 30 }: ProductDescriptionProps) {
  const [expanded, setExpanded] = useState(false)
  const shouldTruncate = description.length > maxLength
  const displayText = expanded || !shouldTruncate ? description : description.substring(0, maxLength) + '...'

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', lineHeight: 1.5 }}>
        {displayText}
      </Typography>
      {shouldTruncate && (
        <Button
          size="small"
          onClick={(e) => {
            e.stopPropagation()
            setExpanded(!expanded)
          }}
          sx={{ mt: 0.5, p: 0, minWidth: 'auto', fontSize: '0.75rem', textTransform: 'none' }}
        >
          {expanded ? 'VIEW LESS' : 'VIEW MORE'}
        </Button>
      )}
    </Box>
  )
}

