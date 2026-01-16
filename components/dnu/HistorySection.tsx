'use client'

import { useMemo } from 'react'
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Link as MuiLink,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import { useApp } from '@/context/AppContext'

export default function HistorySection() {
  const { history, removeHistory } = useApp()

  // Mock data for demonstration
  const mockHistory = useMemo(() => {
    if (history.length === 0) {
      return [
        {
          id: 'history-1',
          scrapeStoreUrl: 'https://example-store.myshopify.com',
          myStoreUrl: 'https://my-store.myshopify.com',
          productNames: ['Product 1', 'Product 2', 'Product 3'],
          collectionNames: ['Collection A'],
          dateTime: new Date().toLocaleString(),
        },
        {
          id: 'history-2',
          scrapeStoreUrl: 'https://another-store.myshopify.com',
          myStoreUrl: 'https://my-store.myshopify.com',
          productNames: ['Product X', 'Product Y'],
          collectionNames: [],
          dateTime: new Date(Date.now() - 86400000).toLocaleString(),
        },
      ]
    }
    return history
  }, [history])

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
        Upload History
      </Typography>

      {mockHistory.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            No upload history yet
          </Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ backgroundColor: 'white' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Scrape Store</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>My Store</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Products</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Collections</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Date & Time</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: 100 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mockHistory.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>
                    <MuiLink href={item.scrapeStoreUrl} target="_blank" rel="noopener">
                      {item.scrapeStoreUrl}
                    </MuiLink>
                  </TableCell>
                  <TableCell>
                    <MuiLink href={item.myStoreUrl} target="_blank" rel="noopener">
                      {item.myStoreUrl}
                    </MuiLink>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, maxWidth: 300 }}>
                      {item.productNames.length > 0 ? (
                        item.productNames.slice(0, 3).map((name, idx) => (
                          <Chip key={idx} label={name} size="small" />
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          None
                        </Typography>
                      )}
                      {item.productNames.length > 3 && (
                        <Chip label={`+${item.productNames.length - 3} more`} size="small" variant="outlined" />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, maxWidth: 300 }}>
                      {item.collectionNames.length > 0 ? (
                        item.collectionNames.map((name, idx) => (
                          <Chip key={idx} label={name} size="small" color="secondary" />
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          None
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{item.dateTime}</Typography>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      color="error"
                      onClick={() => removeHistory(item.id)}
                      size="small"
                      sx={{ '&:hover': { backgroundColor: '#ffebee' } }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  )
}

