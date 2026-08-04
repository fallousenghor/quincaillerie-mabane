import { useEffect, useState } from 'react'
import { Eye, Search, User } from 'lucide-react'
import { useSupabaseTable } from '../../hooks/useSupabaseTable'
import { ROLE_LABELS } from '../../lib/constants'
import { useAuth } from '../../context/AuthContext'
import Pagination from '../../components/Pagination'
import Modal from '../../components/Modal'

export default function UsersAdmin() {
  const { data: users = [], isLoading, updateItem } = useSupabaseTable('users', '*', { orderBy: 'full_name', ascending: true })
  const { user: currentUser } = useAuth()
  const [savingId, setSavingId] = useState(null)
  const [detailUser, setDetailUser] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10

  const filteredUsers = users.filter(
    (u) =>
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize))

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const paginatedUsers = filteredUsers.slice((page - 1) * pageSize, page * pageSize)

  const handleRoleChange = async (id, role) => {
    setSavingId(id)
    await updateItem.mutateAsync({ id, role })
    setSavingId(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Utilisateurs</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Gérez les rôles de l'équipe (admin, caissier, employé)</p>
      </div>

      

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="input pl-9"
          placeholder="Rechercher un utilisateur ou email..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
        />
      </div>

      <div className="card overflow-x-auto">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Chargement...</div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-gray-200 dark:border-gray-700/60">
              <tr>
                <th className="table-th">Nom</th>
                <th className="table-th">Email</th>
                <th className="table-th">Rôle</th>
                <th className="table-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {paginatedUsers.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                  <td className="table-td font-medium flex items-center gap-2">
                    {u.full_name}
                    {u.id === currentUser?.id && <span className="badge bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-400">Vous</span>}
                  </td>
                  <td className="table-td">{u.email}</td>
                  <td className="table-td">
                    <select
                      className="input !py-1.5 !w-40"
                      value={u.role}
                      disabled={savingId === u.id}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    >
                      {Object.entries(ROLE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="table-td">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        title="Voir le détail"
                        onClick={() => setDetailUser(u)}
                        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-colors"
                      >
                        <Eye size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

      <Modal open={!!detailUser} onClose={() => setDetailUser(null)} title="Détail utilisateur">
        {detailUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                <User size={18} />
              </div>
              <div>
                <p className="font-semibold">{detailUser.full_name}</p>
                <p className="text-xs text-gray-400">{detailUser.email}</p>
              </div>
            </div>
            <div className="border border-gray-200 dark:border-gray-700/60 rounded-lg divide-y divide-gray-100 dark:divide-gray-800">
              <div className="flex justify-between p-3 text-sm">
                <span className="text-gray-500">Rôle</span>
                <span className="font-medium">{ROLE_LABELS[detailUser.role] || detailUser.role}</span>
              </div>
              <div className="flex justify-between p-3 text-sm">
                <span className="text-gray-500">Téléphone</span>
                <span>{detailUser.phone || '—'}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
