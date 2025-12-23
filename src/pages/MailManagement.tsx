import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  TextField,
  InputAdornment,
} from '@mui/material'
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
} from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { useDateFormat } from '../hooks/useDateFormat'
import api from '../services/api'
import DocumentUpload from '../components/mail/DocumentUpload'
import DocumentViewer from '../components/mail/DocumentViewer'

export default function MailManagement() {
  const { t } = useTranslation()
  const { formatDate, formatTime } = useDateFormat()
  const [uploadOpen, setUploadOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const queryClient = useQueryClient()

  const { data: documents, isLoading, error } = useQuery({
    queryKey: ['mail-documents'],
    queryFn: async () => {
      try {
        const response = await api.get('/mail/')
        return response.data
      } catch (err: any) {
        throw new Error(err.response?.data?.detail || t('mail.failedToLoad'))
      }
    },
  })

  const getStatusColor = (status: string) => {
    const colors: any = {
      received: 'default',
      in_review: 'info',
      approved: 'success',
      rejected: 'error',
      archived: 'secondary',
    }
    return colors[status] || 'default'
  }

  const getPriorityColor = (priority: string) => {
    const colors: any = {
      low: 'default',
      normal: 'info',
      high: 'warning',
      urgent: 'error',
    }
    return colors[priority] || 'default'
  }

  const handleView = (document: any) => {
    setSelectedDocument(document)
    setViewOpen(true)
  }

  const handleUploadClose = () => {
    setUploadOpen(false)
    queryClient.invalidateQueries({ queryKey: ['mail-documents'] })
  }

  const filteredDocuments = documents?.filter((doc: any) => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      doc.title?.toLowerCase().includes(search) ||
      doc.reference_number?.toLowerCase().includes(search) ||
      doc.description?.toLowerCase().includes(search)
    )
  })

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
            {t('mail.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {documents ? `${documents.length} ${t('mail.documents')}` : t('mail.loading')}
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setUploadOpen(true)}
          sx={{
            minWidth: 180,
            background: 'linear-gradient(135deg, #0066CC 0%, #00A651 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5568d3 0%, #6a3f91 100%)',
            },
          }}
        >
          {t('mail.uploadDocument')}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error instanceof Error ? error.message : t('mail.failedToLoad')}
        </Alert>
      )}

      <Box mb={2}>
        <TextField
          fullWidth
          placeholder={t('mail.searchPlaceholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ maxWidth: 500 }}
        />
      </Box>

      <TableContainer
        component={Paper}
        sx={{
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 8px 30px rgba(0, 102, 204, 0.15), 0 4px 12px rgba(0, 166, 81, 0.1)',
          },
        }}
      >
        <Table>
          <TableHead>
            <TableRow
              sx={{
                background: 'linear-gradient(135deg, rgba(0, 102, 204, 0.12) 0%, rgba(0, 166, 81, 0.12) 100%)',
                '& .MuiTableCell-head': {
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  letterSpacing: '0.5px',
                },
              }}
            >
              <TableCell sx={{ fontWeight: 700 }}>{t('mail.reference')}</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>{t('mail.titleLabel')}</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>{t('mail.status')}</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>{t('mail.priority')}</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>{t('mail.created')}</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>{t('common.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : !filteredDocuments || filteredDocuments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    {searchTerm
                      ? t('mail.noSearchResults')
                      : t('mail.noDocuments')}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredDocuments.map((doc: any) => (
                <TableRow
                  key={doc.id}
                  hover
                  sx={{
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 102, 204, 0.04)',
                      transform: 'scale(1.01)',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                    },
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {doc.reference_number || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{doc.title || '-'}</Typography>
                    {doc.description && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                        sx={{ mt: 0.5 }}
                      >
                        {doc.description.length > 50
                          ? `${doc.description.substring(0, 50)}...`
                          : doc.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={
                        doc.status === 'received'
                          ? t('mail.statusReceived')
                          : doc.status === 'in_review'
                          ? t('mail.statusInReview')
                          : doc.status === 'approved'
                          ? t('mail.statusApproved')
                          : doc.status === 'rejected'
                          ? t('mail.statusRejected')
                          : doc.status === 'archived'
                          ? t('mail.statusArchived')
                          : doc.status || 'unknown'
                      }
                      color={getStatusColor(doc.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={
                        doc.priority === 'low'
                          ? t('mail.priorityLow')
                          : doc.priority === 'normal'
                          ? t('mail.priorityNormal')
                          : doc.priority === 'high'
                          ? t('mail.priorityHigh')
                          : doc.priority === 'urgent'
                          ? t('mail.priorityUrgent')
                          : doc.priority || 'normal'
                      }
                      color={getPriorityColor(doc.priority) as any}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(doc.created_at, 'LL')}
                    </Typography>
                    {doc.created_at && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {formatTime(doc.created_at)}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleView(doc)}
                      title={t('mail.viewDocument')}
                    >
                      <ViewIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <DocumentUpload open={uploadOpen} onClose={handleUploadClose} />

      <DocumentViewer
        open={viewOpen}
        document={selectedDocument}
        onClose={() => setViewOpen(false)}
      />
    </Box>
  )
}

