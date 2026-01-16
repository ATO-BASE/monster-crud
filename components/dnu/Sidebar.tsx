'use client'

import { Box, List, ListItem, ListItemButton, ListItemText, Divider } from '@mui/material'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import InventoryIcon from '@mui/icons-material/Inventory'
import CollectionsIcon from '@mui/icons-material/Collections'
import HistoryIcon from '@mui/icons-material/History'

type TabType = 'upload-ready' | 'products' | 'collections' | 'history'

interface SidebarProps {
  activeTab: TabType
  setActiveTab: (tab: TabType) => void
}

const tabs = [
  { id: 'upload-ready' as TabType, label: 'UPLOAD-READY', icon: UploadFileIcon },
  { id: 'products' as TabType, label: 'PRODUCTS', icon: InventoryIcon },
  { id: 'collections' as TabType, label: 'COLLECTIONS', icon: CollectionsIcon },
  { id: 'history' as TabType, label: 'HISTORY', icon: HistoryIcon },
]

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  return (
    <Box
      sx={{
        width: 200,
        backgroundColor: 'white',
        borderRight: '1px solid #e0e0e0',
        minHeight: '100%',
      }}
    >
      <List sx={{ p: 0 }}>
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <ListItem key={tab.id} disablePadding>
              <ListItemButton
                selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: '#e3f2fd',
                    borderLeft: '3px solid #1976d2',
                  },
                  '&:hover': {
                    backgroundColor: '#f5f5f5',
                  },
                }}
              >
                <Icon sx={{ mr: 2, fontSize: 20 }} />
                <ListItemText primary={tab.label} />
              </ListItemButton>
            </ListItem>
          )
        })}
      </List>
    </Box>
  )
}

