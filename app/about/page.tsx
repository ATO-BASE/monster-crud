import { Container, Box, Typography } from '@mui/material'

export default function About() {
  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Box sx={{ maxWidth: 900, mx: 'auto' }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
          About MONSTER
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph sx={{ mb: 3, lineHeight: 1.8 }}>
          MONSTER is a comprehensive Shopify product management tool designed to help store owners 
          efficiently scrape, manage, and upload products from other Shopify stores to their own.
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 2, lineHeight: 1.8 }}>
          Our application focuses on usability and efficiency, providing a clean, intuitive interface 
          that maximizes screen space and minimizes unnecessary elements. With features like product 
          selection, collection management, upload history, and customizable pricing, MONSTER streamlines 
          your workflow and saves you valuable time.
        </Typography>
      </Box>
    </Container>
  )
}

