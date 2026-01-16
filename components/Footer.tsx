import { Box, Typography, Container } from '@mui/material'

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: '#1976d2',
        color: 'white',
        py: 2,
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg">
        <Typography variant="body2" align="center">
          © 2026 MONSTER - Shopify Product Scraper & Uploader
        </Typography>
      </Container>
    </Box>
  )
}

