"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Users,
  Shield,
  UserPlus,
  Edit,
  Trash2,
  Check,
  X,
  Database,
  Monitor,
  Settings,
  UserCheck,
  UserX,
  Clock,
} from "lucide-react"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Card } from "../components/ui/Card"
import { Modal } from "../components/ui/Modal"
import { formatDate } from "@/lib/utils"

interface User {
  id: string
  email: string
  name: string
  approved: boolean
  blocked: boolean
  whitelisted: boolean
  lastLogin?: string
  createdAt: string
  roles: { role: { name: string } }[]
}

interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
}

interface DashboardStats {
  totalUsers: number
  pendingUsers: number
  approvedUsers: number
  blockedUsers: number
  whitelistedUsers: number
  activeSessions: number
  totalRoles: number
  recentActivity: any[]
}

export default function AdminPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [showUserModal, setShowUserModal] = useState(false)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editingRole, setEditingRole] = useState<Role | null>(null)

  useEffect(() => {
    checkAdminAccess()
    fetchUsers()
    fetchRoles()
    fetchStats()
  }, [])

  const checkAdminAccess = async () => {
    try {
      const response = await fetch("/api/auth/me")
      if (response.ok) {
        const userData = await response.json()
        if (!userData.roles?.includes("admin")) {
          router.push("/dashboard")
          return
        }
        setCurrentUser(userData)
      } else {
        router.push("/login")
      }
    } catch (error) {
      console.error("Error checking admin access:", error)
      router.push("/login")
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  const fetchRoles = async () => {
    try {
      const response = await fetch("/api/admin/roles")
      if (response.ok) {
        const data = await response.json()
        setRoles(data)
      }
    } catch (error) {
      console.error("Error fetching roles:", error)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/dashboard/stats")
      if (response.ok) {
        const data = await response.json()
        setStats({
          totalUsers: users.length,
          pendingUsers: users.filter((u) => !u.approved).length,
          approvedUsers: users.filter((u) => u.approved && !u.blocked).length,
          blockedUsers: users.filter((u) => u.blocked).length,
          whitelistedUsers: users.filter((u) => u.whitelisted).length,
          activeSessions: data.activeSessions || 0,
          totalRoles: roles.length,
          recentActivity: data.recentActivity || [],
        })
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
      setStats({
        totalUsers: users.length,
        pendingUsers: users.filter((u) => !u.approved).length,
        approvedUsers: users.filter((u) => u.approved && !u.blocked).length,
        blockedUsers: users.filter((u) => u.blocked).length,
        whitelistedUsers: users.filter((u) => u.whitelisted).length,
        activeSessions: 0,
        totalRoles: roles.length,
        recentActivity: [],
      })
    }
  }

  const handleApproveUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/approve`, {
        method: "POST",
      })
      if (response.ok) {
        fetchUsers()
        fetchStats()
      }
    } catch (error) {
      console.error("Error approving user:", error)
    }
  }

  const handleBlockUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/block`, {
        method: "POST",
      })
      if (response.ok) {
        fetchUsers()
        fetchStats()
      }
    } catch (error) {
      console.error("Error blocking user:", error)
    }
  }

  const handleWhitelistUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/whitelist`, {
        method: "POST",
      })
      if (response.ok) {
        fetchUsers()
        fetchStats()
      }
    } catch (error) {
      console.error("Error whitelisting user:", error)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este usuario?")) return

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      })
      if (response.ok) {
        fetchUsers()
        fetchStats()
      }
    } catch (error) {
      console.error("Error deleting user:", error)
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())

    if (filterStatus === "all") return matchesSearch
    if (filterStatus === "pending") return matchesSearch && !user.approved
    if (filterStatus === "approved") return matchesSearch && user.approved && !user.blocked
    if (filterStatus === "blocked") return matchesSearch && user.blocked
    if (filterStatus === "whitelisted") return matchesSearch && user.whitelisted

    return matchesSearch
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
        <div className="loading-spinner h-12 w-12" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-secondary-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-error-600 rounded-lg flex items-center justify-center mr-4">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-secondary-900">Panel de Administración</h1>
                <p className="text-secondary-600">Gestión completa del sistema QiangNet</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={() => router.push("/dashboard")} variant="outline">
                Dashboard
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Button
              onClick={() => router.push("/admin/database")}
              variant="outline"
              className="h-20 flex flex-col items-center justify-center"
            >
              <Database className="h-6 w-6 mb-2" />
              <span>Base de Datos</span>
            </Button>
            <Button
              onClick={() => router.push("/admin/sessions")}
              variant="outline"
              className="h-20 flex flex-col items-center justify-center"
            >
              <Monitor className="h-6 w-6 mb-2" />
              <span>Sesiones</span>
            </Button>
            <Button
              onClick={() => router.push("/admin/access-list")}
              variant="outline"
              className="h-20 flex flex-col items-center justify-center"
            >
              <Shield className="h-6 w-6 mb-2" />
              <span>Control de Acceso</span>
            </Button>
            <Button
              onClick={() => router.push("/admin/settings")}
              variant="outline"
              className="h-20 flex flex-col items-center justify-center"
            >
              <Settings className="h-6 w-6 mb-2" />
              <span>Configuración</span>
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary-600">Total Usuarios</p>
                  <p className="text-2xl font-bold text-secondary-900">{stats?.totalUsers || 0}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-warning-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary-600">Pendientes</p>
                  <p className="text-2xl font-bold text-secondary-900">{stats?.pendingUsers || 0}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
                  <UserCheck className="h-6 w-6 text-success-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary-600">Aprobados</p>
                  <p className="text-2xl font-bold text-secondary-900">{stats?.approvedUsers || 0}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-error-100 rounded-lg flex items-center justify-center">
                  <UserX className="h-6 w-6 text-error-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary-600">Bloqueados</p>
                  <p className="text-2xl font-bold text-secondary-900">{stats?.blockedUsers || 0}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Users Management */}
          <Card className="mb-8">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-secondary-900">Gestión de Usuarios</h3>
                <Button onClick={() => setShowUserModal(true)} className="flex items-center">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Nuevo Usuario
                </Button>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <Input
                    placeholder="Buscar usuarios..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="input-field w-full sm:w-auto"
                >
                  <option value="all">Todos</option>
                  <option value="pending">Pendientes</option>
                  <option value="approved">Aprobados</option>
                  <option value="blocked">Bloqueados</option>
                  <option value="whitelisted">Lista Blanca</option>
                </select>
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-secondary-200">
                  <thead className="bg-secondary-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        Usuario
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        Roles
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        Último Acceso
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-secondary-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-secondary-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-secondary-900">{user.name}</div>
                            <div className="text-sm text-secondary-500">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {user.roles?.map((userRole) => (
                              <span
                                key={userRole.role.name}
                                className="px-2 py-1 text-xs rounded-full bg-primary-100 text-primary-800"
                              >
                                {userRole.role.name}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {user.whitelisted && (
                              <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                Lista Blanca
                              </span>
                            )}
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                user.blocked
                                  ? "bg-error-100 text-error-800"
                                  : user.approved
                                    ? "bg-success-100 text-success-800"
                                    : "bg-warning-100 text-warning-800"
                              }`}
                            >
                              {user.blocked ? "Bloqueado" : user.approved ? "Aprobado" : "Pendiente"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                          {user.lastLogin ? formatDate(user.lastLogin) : "Nunca"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            {!user.approved && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleApproveUser(user.id)}
                                className="text-success-600 border-success-600 hover:bg-success-50"
                                title="Aprobar usuario"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            {!user.whitelisted && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleWhitelistUser(user.id)}
                                className="text-blue-600 border-blue-600 hover:bg-blue-50"
                                title="Añadir a lista blanca"
                              >
                                <Shield className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingUser(user)
                                setShowUserModal(true)
                              }}
                              title="Editar usuario"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => (user.blocked ? handleApproveUser(user.id) : handleBlockUser(user.id))}
                              className={
                                user.blocked
                                  ? "text-success-600 border-success-600"
                                  : "text-warning-600 border-warning-600"
                              }
                              title={user.blocked ? "Desbloquear usuario" : "Bloquear usuario"}
                            >
                              {user.blocked ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-error-600 border-error-600 hover:bg-error-50"
                              title="Eliminar usuario"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>

          {/* Roles Management */}
          <Card>
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-secondary-900">Gestión de Roles</h3>
                <Button onClick={() => setShowRoleModal(true)} className="flex items-center">
                  <Shield className="h-4 w-4 mr-2" />
                  Nuevo Rol
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {roles.map((role) => (
                  <Card key={role.id} className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-semibold text-secondary-900">{role.name}</h4>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingRole(role)
                          setShowRoleModal(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-secondary-600 mb-3">{role.description}</p>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-secondary-500">Permisos:</p>
                      <div className="flex flex-wrap gap-1">
                        {role.permissions.slice(0, 3).map((permission) => (
                          <span
                            key={permission}
                            className="px-2 py-1 text-xs rounded bg-secondary-100 text-secondary-700"
                          >
                            {permission}
                          </span>
                        ))}
                        {role.permissions.length > 3 && (
                          <span className="px-2 py-1 text-xs rounded bg-secondary-100 text-secondary-700">
                            +{role.permissions.length - 3} más
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </main>

      {/* User Modal */}
      <Modal
        isOpen={showUserModal}
        onClose={() => {
          setShowUserModal(false)
          setEditingUser(null)
        }}
        title={editingUser ? "Editar Usuario" : "Nuevo Usuario"}
        size="md"
      >
        <UserForm
          user={editingUser}
          roles={roles}
          onSave={() => {
            fetchUsers()
            fetchStats()
            setShowUserModal(false)
            setEditingUser(null)
          }}
          onCancel={() => {
            setShowUserModal(false)
            setEditingUser(null)
          }}
        />
      </Modal>

      {/* Role Modal */}
      <Modal
        isOpen={showRoleModal}
        onClose={() => {
          setShowRoleModal(false)
          setEditingRole(null)
        }}
        title={editingRole ? "Editar Rol" : "Nuevo Rol"}
        size="lg"
      >
        <RoleForm
          role={editingRole}
          onSave={() => {
            fetchRoles()
            fetchStats()
            setShowRoleModal(false)
            setEditingRole(null)
          }}
          onCancel={() => {
            setShowRoleModal(false)
            setEditingRole(null)
          }}
        />
      </Modal>
    </div>
  )
}

// User Form Component
function UserForm({
  user,
  roles,
  onSave,
  onCancel,
}: {
  user: User | null
  roles: Role[]
  onSave: () => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    password: "",
    roleIds: user?.roles?.map((ur) => ur.role.name) || [],
    approved: user?.approved || false,
    blocked: user?.blocked || false,
    whitelisted: user?.whitelisted || false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const url = user ? `/api/admin/users/${user.id}` : "/api/admin/users"
      const method = user ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        onSave()
      } else {
        const data = await response.json()
        setError(data.error || "Error al guardar usuario")
      }
    } catch (error) {
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded">{error}</div>}

      <Input
        label="Nombre"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />

      <Input
        label="Email"
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        required
      />

      {!user && (
        <Input
          label="Contraseña"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          showPasswordToggle
          required
        />
      )}

      <div>
        <label className="block text-sm font-medium text-secondary-700 mb-2">Roles</label>
        <div className="space-y-2">
          {roles.map((role) => (
            <label key={role.id} className="flex items-center">
              <input
                type="checkbox"
                checked={formData.roleIds.includes(role.name)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFormData({
                      ...formData,
                      roleIds: [...formData.roleIds, role.name],
                    })
                  } else {
                    setFormData({
                      ...formData,
                      roleIds: formData.roleIds.filter((id) => id !== role.name),
                    })
                  }
                }}
                className="mr-2"
              />
              <span className="text-sm">{role.name}</span>
            </label>
          ))}
        </div>
      </div>

      {user && (
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="approved"
              checked={formData.approved}
              onChange={(e) => setFormData({ ...formData, approved: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="approved" className="text-sm">
              Usuario aprobado
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="blocked"
              checked={formData.blocked}
              onChange={(e) => setFormData({ ...formData, blocked: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="blocked" className="text-sm">
              Usuario bloqueado
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="whitelisted"
              checked={formData.whitelisted}
              onChange={(e) => setFormData({ ...formData, whitelisted: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="whitelisted" className="text-sm">
              En lista blanca
            </label>
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          {user ? "Actualizar" : "Crear"}
        </Button>
      </div>
    </form>
  )
}

// Role Form Component
function RoleForm({
  role,
  onSave,
  onCancel,
}: {
  role: Role | null
  onSave: () => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    name: role?.name || "",
    description: role?.description || "",
    permissions: role?.permissions || [],
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const availablePermissions = [
    "dashboard",
    "admin",
    "users.read",
    "users.write",
    "roles.read",
    "roles.write",
    "settings.read",
    "settings.write",
    "audit.read",
    "database.read",
    "sessions.read",
    "sessions.write",
    "access-list.read",
    "access-list.write",
    "jellyfin",
    "nextcloud",
    "portainer",
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const url = role ? `/api/admin/roles/${role.id}` : "/api/admin/roles"
      const method = role ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        onSave()
      } else {
        const data = await response.json()
        setError(data.error || "Error al guardar rol")
      }
    } catch (error) {
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded">{error}</div>}

      <Input
        label="Nombre del rol"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />

      <div>
        <label className="block text-sm font-medium text-secondary-700 mb-2">Descripción</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="input-field"
          rows={3}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-secondary-700 mb-2">Permisos</label>
        <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
          {availablePermissions.map((permission) => (
            <label key={permission} className="flex items-center">
              <input
                type="checkbox"
                checked={formData.permissions.includes(permission)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFormData({
                      ...formData,
                      permissions: [...formData.permissions, permission],
                    })
                  } else {
                    setFormData({
                      ...formData,
                      permissions: formData.permissions.filter((p) => p !== permission),
                    })
                  }
                }}
                className="mr-2"
              />
              <span className="text-sm">{permission}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          {role ? "Actualizar" : "Crear"}
        </Button>
      </div>
    </form>
  )
}
