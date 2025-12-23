import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
} from '@mui/material'
import SignaturePad from './SignaturePad'
import ImageViewer from './ImageViewer'
import api from '../../services/api'

interface DocumentViewerProps {
  open: boolean
  document: any
  onClose: () => void
}

export default function DocumentViewer({
  open,
  document,
  onClose,
}: DocumentViewerProps) {
  const { t } = useTranslation()
  const [tab, setTab] = useState(0)
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [fileType, setFileType] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const blobUrlRef = useRef<string | null>(null)

  useEffect(() => {
    // Cleanup previous blob URL when document or tab changes
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current)
      blobUrlRef.current = null
    }
    setFileUrl(null)
    setFileType(null)
    setError(null)

    if (open && document && tab === 1) {
      // Fetch the file with authentication and create a blob URL
      setLoading(true)
      setError(null)

      api
        .get(`/mail/${document.id}/file`, {
          responseType: 'blob',
        })
        .then((response) => {
          // IMPORTANT: Utiliser le Content-Type de la réponse HTTP directement
          const contentType = response.headers['content-type'] || response.headers['Content-Type'] || ''
          const fileName = document.title || document.file_name || ''
          
          // Determine file type from Content-Type for display purposes
          let detectedType = 'unknown'
          
          if (contentType.includes('application/pdf')) {
            detectedType = 'pdf'
          } else if (contentType.includes('image/')) {
            detectedType = 'image'
          } else if (fileName.toLowerCase().endsWith('.pdf')) {
            detectedType = 'pdf'
          } else if (/\.(jpg|jpeg|png|gif|bmp|tiff|webp)$/i.test(fileName)) {
            detectedType = 'image'
          }
          
          // IMPORTANT: Créer le blob avec le Content-Type de la réponse HTTP
          // Utiliser le Content-Type du serveur, pas celui détecté côté client
          const blob = new Blob([response.data], { 
            type: contentType || 'application/octet-stream'
          })
          
          // Vérifier dans la console (en développement)
          if (import.meta.env.DEV) {
            console.log('Content-Type from server:', contentType)
            console.log('Blob type:', blob.type)
            console.log('Blob size:', blob.size)
            console.log('Detected type for display:', detectedType)
          }
          
          // Debug logs
          if (import.meta.env.DEV) {
            console.log('Document file response:', {
              contentType,
              fileName,
              detectedType,
              blobType: blob.type,
              blobSize: blob.size,
              headers: response.headers,
            })
          }
          
          // Nettoyer l'ancien blob URL avant d'en créer un nouveau
          if (blobUrlRef.current) {
            URL.revokeObjectURL(blobUrlRef.current)
          }
          
          const url = URL.createObjectURL(blob)
          blobUrlRef.current = url
          
          // Verify blob URL
          if (import.meta.env.DEV) {
            console.log('Blob URL created:', url)
            console.log('Blob URL valid:', url.startsWith('blob:'))
          }
          
          setFileUrl(url)
          setFileType(detectedType)
          setLoading(false)
        })
        .catch((err) => {
          console.error('Error loading document:', err)
          console.error('Error details:', {
            status: err.response?.status,
            statusText: err.response?.statusText,
            data: err.response?.data,
            headers: err.response?.headers,
          })
          setError(
            err.response?.data?.detail ||
              err.message ||
              t('mail.viewer.failedToLoad')
          )
          setLoading(false)
        })
    }

    // Cleanup blob URL when component unmounts
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current)
        blobUrlRef.current = null
      }
    }
  }, [open, document?.id, tab, t])

  if (!document) return null

  const getStatusLabel = (status: string) => {
    const statusMap: any = {
      received: t('mail.statusReceived'),
      in_review: t('mail.statusInReview'),
      approved: t('mail.statusApproved'),
      rejected: t('mail.statusRejected'),
      archived: t('mail.statusArchived'),
    }
    return statusMap[status] || status
  }

  const getPriorityLabel = (priority: string) => {
    const priorityMap: any = {
      low: t('mail.priorityLow'),
      normal: t('mail.priorityNormal'),
      high: t('mail.priorityHigh'),
      urgent: t('mail.priorityUrgent'),
    }
    return priorityMap[priority] || priority
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>{document.title}</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Chip label={getStatusLabel(document.status)} sx={{ mr: 1 }} />
          <Chip label={getPriorityLabel(document.priority)} color="secondary" />
        </Box>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label={t('mail.viewer.details')} />
          <Tab label={t('mail.viewer.document')} />
          <Tab label={t('mail.viewer.signature')} />
        </Tabs>

        {tab === 0 && (
          <Box>
            <Typography variant="body2" color="text.secondary">
              {t('mail.viewer.reference')}: {document.reference_number}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              {document.description}
            </Typography>
            {document.ocr_keywords && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2">
                  {t('mail.viewer.detectedKeywords')}:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                  {document.ocr_keywords.map((keyword: string) => (
                    <Chip key={keyword} label={keyword} size="small" />
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        )}

        {tab === 1 && (
          <Box>
            {loading ? (
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                minHeight="600px"
                flexDirection="column"
                gap={2}
              >
                <CircularProgress />
                <Typography>
                  {t('mail.viewer.loadingDocument')}
                </Typography>
              </Box>
            ) : error ? (
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                minHeight="600px"
              >
                <Alert severity="error" sx={{ maxWidth: '80%' }}>
                  {error}
                </Alert>
              </Box>
            ) : fileUrl ? (
              <Box
                sx={{
                  width: '100%',
                  minHeight: '600px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  bgcolor: 'grey.100',
                  overflow: 'auto',
                }}
              >
                {fileType === 'pdf' ? (
                  <Box
                    component="embed"
                    src={`${fileUrl}#toolbar=1`}
                    type="application/pdf"
                    sx={{
                      width: '100%',
                      height: '600px',
                      border: 'none',
                    }}
                    title="PDF preview"
                    onError={(e: any) => {
                      console.error('Embed error:', e)
                      console.error('Blob URL:', fileUrl)
                      // Vérifier si le blob est valide
                      if (fileUrl) {
                        fetch(fileUrl)
                          .then((res) => res.blob())
                          .then((blob) => {
                            console.log('Fetched blob type:', blob.type)
                            console.log('Fetched blob size:', blob.size)
                          })
                          .catch((fetchErr) => {
                            console.error('Fetch blob error:', fetchErr)
                          })
                      }
                    }}
                  />
                ) : fileType === 'image' && fileUrl ? (
                  <ImageViewer
                    src={fileUrl}
                    alt={document.title || 'Document preview'}
                  />
                ) : (
                  <iframe
                    src={fileUrl || undefined}
                    style={{
                      width: '100%',
                      height: '600px',
                      border: 'none',
                    }}
                    title="Document preview"
                    onError={(e: any) => {
                      console.error('Iframe error:', e)
                      console.error('Blob URL:', fileUrl)
                    }}
                  />
                )}
              </Box>
            ) : (
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                minHeight="600px"
              >
                <Typography color="error">
                  {t('mail.viewer.failedToLoad')}
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {tab === 2 && <SignaturePad documentId={document.id} />}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.close')}</Button>
      </DialogActions>
    </Dialog>
  )
}
