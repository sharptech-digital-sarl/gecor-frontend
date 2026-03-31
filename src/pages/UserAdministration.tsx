import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TableSortLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Stack,
  TextField,
  IconButton,
} from '@mui/material'
import {
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  Group as GroupIcon,
  PersonAdd as PersonAddIcon,
  Add as AddIcon,
  DeleteOutline as DeleteOutlineIcon,
} from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth'
import { useTableSort } from '../hooks/useTableSort'
import { isAdminUser, isMasterUser } from '../utils/roles'
import api from '../services/api'

type AdminUser = {
  id: string
  username: string
  email: string
  full_name: string
  role: string
  is_active: boolean
}

const DEFAULT_ROLE_DOC_KEYS = ['master', 'director', 'secretary', 'analyst', 'receptionist', 'guest'] as const

const BUILTIN_ROLE_SET = new Set<string>(DEFAULT_ROLE_DOC_KEYS)

function isDeletableCustomRole(roleName: string): boolean {
  return !BUILTIN_ROLE_SET.has(roleName.trim().toLowerCase())
}

type SortKey = 'username' | 'full_name' | 'email' | 'role' | 'is_active'

type RoleDto = {
  id: string
  name: string
  description?: string | null
  permissions: string[]
}

type PermCatalogItem = { key: string; label: string }

export default function UserAdministration() {
  const { t } = useTranslation()
  const { user: currentUser } = useAuth()
  const queryClient = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<AdminUser | null>(null)
  const [editRole, setEditRole] = useState<string>('')
  const [newUserOpen, setNewUserOpen] = useState(false)
  const [groupsOpen, setGroupsOpen] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newFullName, setNewFullName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newUserRole, setNewUserRole] = useState<string>('guest')
  const [newUserError, setNewUserError] = useState('')
  const [rolePermissionsEdit, setRolePermissionsEdit] = useState<Record<string, string[]>>({})
  const [createGroupOpen, setCreateGroupOpen] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupDescription, setNewGroupDescription] = useState('')
  const [createGroupError, setCreateGroupError] = useState('')
  const [deleteRoleTarget, setDeleteRoleTarget] = useState<RoleDto | null>(null)
  const { sortBy, sortDir, toggleSort, sortRows } = useTableSort<SortKey>('full_name', 'asc')

  const canEditRoles = isMasterUser(currentUser?.role)
  const canOpenGroups = isAdminUser(currentUser?.role)

  const { data: users, isLoading, error } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const response = await api.get('/users/', { params: { limit: 200 } })
      return response.data as AdminUser[]
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const response = await api.put(`/users/${id}`, { role })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setEditOpen(false)
      setEditing(null)
    },
  })

  const { data: roleList, isLoading: rolesLoading } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: async () => {
      const response = await api.get<RoleDto[]>('/roles/')
      return response.data
    },
    enabled: groupsOpen || (canEditRoles && (newUserOpen || editOpen)),
  })

  const { data: permCatalog, isLoading: catalogLoading } = useQuery({
    queryKey: ['permissions-catalog'],
    queryFn: async () => {
      const response = await api.get<PermCatalogItem[]>('/roles/permissions-catalog')
      return response.data
    },
    enabled: groupsOpen,
  })

  useEffect(() => {
    if (!groupsOpen || !roleList) return
    const next: Record<string, string[]> = {}
    roleList.forEach((r) => {
      next[r.id] = [...(r.permissions || [])]
    })
    setRolePermissionsEdit(next)
  }, [groupsOpen, roleList])

  const createUserMutation = useMutation({
    mutationFn: async (payload: {
      username: string
      email: string
      full_name: string
      password: string
      role: string
    }) => {
      const response = await api.post('/users/', payload)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setNewUserOpen(false)
      setNewUsername('')
      setNewEmail('')
      setNewFullName('')
      setNewPassword('')
      setNewUserRole('guest')
      setNewUserError('')
    },
    onError: (err: unknown) => {
      const ax = err as { response?: { data?: { detail?: string } } }
      setNewUserError(ax.response?.data?.detail || t('usersAdmin.createUserError'))
    },
  })

  const saveRolePermissionsMutation = useMutation({
    mutationFn: async ({ roleId, permissions }: { roleId: string; permissions: string[] }) => {
      await api.put(`/roles/${roleId}/permissions`, { permissions })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-roles'] })
    },
  })

  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      await api.delete(`/roles/${roleId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-roles'] })
      setDeleteRoleTarget(null)
    },
  })

  const createRoleMutation = useMutation({
    mutationFn: async (payload: { name: string; description: string }) => {
      const response = await api.post<RoleDto>('/roles/', {
        name: payload.name.trim().toLowerCase(),
        description: payload.description.trim() || null,
        permissions: [],
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-roles'] })
      setCreateGroupOpen(false)
      setNewGroupName('')
      setNewGroupDescription('')
      setCreateGroupError('')
    },
    onError: (err: unknown) => {
      const ax = err as { response?: { data?: { detail?: string } } }
      setCreateGroupError(ax.response?.data?.detail || t('usersAdmin.createGroupError'))
    },
  })

  const toggleRolePermission = (roleId: string, key: string) => {
    setRolePermissionsEdit((prev) => {
      const cur = new Set(prev[roleId] || [])
      if (cur.has(key)) cur.delete(key)
      else cur.add(key)
      return { ...prev, [roleId]: Array.from(cur) }
    })
  }

  const sorted = users
    ? sortRows(users, (row, key) => {
        switch (key) {
          case 'username':
            return row.username
          case 'full_name':
            return row.full_name
          case 'email':
            return row.email
          case 'role':
            return row.role
          case 'is_active':
            return row.is_active ? 1 : 0
          default:
            return ''
        }
      })
    : []

  const submitNewUser = () => {
    setNewUserError('')
    if (!newUsername.trim() || !newEmail.trim() || !newFullName.trim() || !newPassword) {
      setNewUserError(t('usersAdmin.createUserValidation'))
      return
    }
    createUserMutation.mutate({
      username: newUsername.trim(),
      email: newEmail.trim(),
      full_name: newFullName.trim(),
      password: newPassword,
      role: newUserRole,
    })
  }

  const roleNamePattern = /^[a-z][a-z0-9_]{1,47}$/
  const submitNewGroup = () => {
    setCreateGroupError('')
    const n = newGroupName.trim().toLowerCase()
    if (!roleNamePattern.test(n)) {
      setCreateGroupError(t('usersAdmin.createGroupNameInvalid'))
      return
    }
    createRoleMutation.mutate({ name: n, description: newGroupDescription })
  }

  const roleSelectLabel = (name: string) =>
    t(`usersAdmin.roleNames.${name}`, { defaultValue: name.replace(/_/g, ' ') })

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        {t('usersAdmin.title')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t('usersAdmin.subtitle')}
      </Typography>

      <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: 'wrap' }}>
        {canEditRoles && (
          <Button variant="contained" startIcon={<PersonAddIcon />} onClick={() => setNewUserOpen(true)}>
            {t('usersAdmin.newUser')}
          </Button>
        )}
        {canOpenGroups && (
          <Button variant="outlined" startIcon={<GroupIcon />} onClick={() => setGroupsOpen(true)}>
            {t('usersAdmin.manageGroups')}
          </Button>
        )}
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {t('usersAdmin.loadError')}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 4, borderRadius: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          {t('usersAdmin.rolesSection')}
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          {t('usersAdmin.rolesIntro')}
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {DEFAULT_ROLE_DOC_KEYS.map((r) => (
            <Box key={r}>
              <Typography variant="subtitle2" sx={{ textTransform: 'capitalize' }}>
                {t(`usersAdmin.roleNames.${r}`)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t(`usersAdmin.roleDesc.${r}`)}
              </Typography>
            </Box>
          ))}
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
            {t('usersAdmin.customGroupsHint')}
          </Typography>
        </Box>
      </Paper>

      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'username'}
                  direction={sortBy === 'username' ? sortDir : 'asc'}
                  onClick={() => toggleSort('username')}
                >
                  {t('auth.username')}
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'full_name'}
                  direction={sortBy === 'full_name' ? sortDir : 'asc'}
                  onClick={() => toggleSort('full_name')}
                >
                  {t('usersAdmin.fullName')}
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'email'}
                  direction={sortBy === 'email' ? sortDir : 'asc'}
                  onClick={() => toggleSort('email')}
                >
                  {t('usersAdmin.email')}
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'role'}
                  direction={sortBy === 'role' ? sortDir : 'asc'}
                  onClick={() => toggleSort('role')}
                >
                  {t('usersAdmin.role')}
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'is_active'}
                  direction={sortBy === 'is_active' ? sortDir : 'asc'}
                  onClick={() => toggleSort('is_active')}
                >
                  {t('usersAdmin.active')}
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">{t('common.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((u) => (
                <TableRow key={u.id} hover>
                  <TableCell>{u.username}</TableCell>
                  <TableCell>{u.full_name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Chip label={u.role} size="small" variant="outlined" sx={{ textTransform: 'capitalize' }} />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={u.is_active ? t('common.yes') : t('common.no')}
                      color={u.is_active ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    {canEditRoles && (
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => {
                          setEditing(u)
                          setEditRole(u.role)
                          setEditOpen(true)
                        }}
                      >
                        {t('usersAdmin.editRole')}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('usersAdmin.editRoleTitle')}</DialogTitle>
        <DialogContent>
          {editing && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {editing.full_name} ({editing.username})
              </Typography>
              {rolesLoading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 2 }}>
                  <CircularProgress size={22} />
                  <Typography variant="body2" color="text.secondary">
                    {t('common.loading')}
                  </Typography>
                </Box>
              ) : (
                <FormControl fullWidth sx={{ mt: 2 }}>
                  <InputLabel>{t('usersAdmin.role')}</InputLabel>
                  <Select
                    label={t('usersAdmin.role')}
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                  >
                    {(roleList ?? []).map((r) => (
                      <MenuItem key={r.id} value={r.name}>
                        {roleSelectLabel(r.name)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            disabled={
              !editing ||
              updateMutation.isPending ||
              rolesLoading ||
              editRole === editing?.role
            }
            onClick={() => editing && updateMutation.mutate({ id: editing.id, role: editRole })}
          >
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={newUserOpen} onClose={() => !createUserMutation.isPending && setNewUserOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('usersAdmin.newUserTitle')}</DialogTitle>
        <DialogContent>
          {newUserError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setNewUserError('')}>
              {newUserError}
            </Alert>
          )}
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label={t('auth.username')}
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              fullWidth
              required
              autoComplete="off"
            />
            <TextField
              label={t('usersAdmin.email')}
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              fullWidth
              required
              autoComplete="off"
            />
            <TextField
              label={t('usersAdmin.fullName')}
              value={newFullName}
              onChange={(e) => setNewFullName(e.target.value)}
              fullWidth
              required
              autoComplete="off"
            />
            <TextField
              label={t('auth.password')}
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              fullWidth
              required
              autoComplete="new-password"
            />
            {rolesLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
                <CircularProgress size={22} />
                <Typography variant="body2" color="text.secondary">
                  {t('common.loading')}
                </Typography>
              </Box>
            ) : (
              <FormControl fullWidth>
                <InputLabel>{t('usersAdmin.role')}</InputLabel>
                <Select
                  label={t('usersAdmin.role')}
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                >
                  {(roleList ?? []).map((r) => (
                    <MenuItem key={r.id} value={r.name}>
                      {roleSelectLabel(r.name)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewUserOpen(false)} disabled={createUserMutation.isPending}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={submitNewUser}
            disabled={createUserMutation.isPending || rolesLoading || !(roleList && roleList.length)}
          >
            {createUserMutation.isPending ? t('common.loading') : t('usersAdmin.createUserSubmit')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={groupsOpen} onClose={() => setGroupsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{t('usersAdmin.groupsModalTitle')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            {t('usersAdmin.groupsModalIntro')}
          </Typography>
          {canEditRoles && (
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              sx={{ mb: 2 }}
              onClick={() => {
                setCreateGroupError('')
                setNewGroupName('')
                setNewGroupDescription('')
                setCreateGroupOpen(true)
              }}
            >
              {t('usersAdmin.newGroup')}
            </Button>
          )}
          {rolesLoading || catalogLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            roleList?.map((role) => (
              <Accordion key={role.id} disableGutters>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{ '& .MuiAccordionSummary-content': { alignItems: 'center', gap: 1, mr: 1 } }}
                >
                  <Typography sx={{ flex: 1, textTransform: 'capitalize', fontWeight: 600 }}>
                    {role.name}
                  </Typography>
                  {canEditRoles && isDeletableCustomRole(role.name) && (
                    <IconButton
                      size="small"
                      color="error"
                      aria-label={t('usersAdmin.deleteGroupAria')}
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteRoleTarget(role)
                      }}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  )}
                </AccordionSummary>
                <AccordionDetails>
                  {role.description && (
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                      {role.description}
                    </Typography>
                  )}
                  <FormGroup>
                    {permCatalog?.map((p) => (
                      <FormControlLabel
                        key={p.key}
                        control={
                          <Checkbox
                            checked={(rolePermissionsEdit[role.id] || []).includes(p.key)}
                            onChange={() => toggleRolePermission(role.id, p.key)}
                            disabled={!canEditRoles}
                          />
                        }
                        label={p.label}
                      />
                    ))}
                  </FormGroup>
                  {canEditRoles && (
                    <Button
                      sx={{ mt: 2 }}
                      variant="contained"
                      size="small"
                      disabled={saveRolePermissionsMutation.isPending}
                      onClick={() =>
                        saveRolePermissionsMutation.mutate({
                          roleId: role.id,
                          permissions: rolePermissionsEdit[role.id] || [],
                        })
                      }
                    >
                      {t('usersAdmin.saveGroupPermissions')}
                    </Button>
                  )}
                </AccordionDetails>
              </Accordion>
            ))
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGroupsOpen(false)}>{t('common.close')}</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!deleteRoleTarget}
        onClose={() => !deleteRoleMutation.isPending && setDeleteRoleTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{t('usersAdmin.deleteGroupTitle')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {t('usersAdmin.deleteGroupConfirm', {
              name: deleteRoleTarget ? roleSelectLabel(deleteRoleTarget.name) : '',
            })}
          </Typography>
          {deleteRoleMutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {(deleteRoleMutation.error as any)?.response?.data?.detail ||
                t('usersAdmin.deleteGroupFailed')}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteRoleTarget(null)} disabled={deleteRoleMutation.isPending}>
            {t('common.cancel')}
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={deleteRoleMutation.isPending || !deleteRoleTarget}
            onClick={() => deleteRoleTarget && deleteRoleMutation.mutate(deleteRoleTarget.id)}
          >
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={createGroupOpen}
        onClose={() => !createRoleMutation.isPending && setCreateGroupOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('usersAdmin.createGroupTitle')}</DialogTitle>
        <DialogContent>
          {createGroupError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setCreateGroupError('')}>
              {createGroupError}
            </Alert>
          )}
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label={t('usersAdmin.createGroupNameLabel')}
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              fullWidth
              required
              autoComplete="off"
              helperText={t('usersAdmin.createGroupNameHelper')}
            />
            <TextField
              label={t('usersAdmin.createGroupDescriptionLabel')}
              value={newGroupDescription}
              onChange={(e) => setNewGroupDescription(e.target.value)}
              fullWidth
              multiline
              minRows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateGroupOpen(false)} disabled={createRoleMutation.isPending}>
            {t('common.cancel')}
          </Button>
          <Button variant="contained" onClick={submitNewGroup} disabled={createRoleMutation.isPending}>
            {createRoleMutation.isPending ? t('common.loading') : t('usersAdmin.createGroupSubmit')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
