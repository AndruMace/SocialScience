import { Outlet, Navigate } from 'react-router'
import { Sidebar } from './sidebar'
import { ToastContainer } from '../game/achievement-toast'
import { useAuthStore } from '../../stores/auth.store'

export function MainLayout() {
  const token = useAuthStore((s) => s.token)
  if (!token) return <Navigate to="/login" replace />

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
      <ToastContainer />
    </div>
  )
}
