export type Role = 'client' | 'sales' | 'admin'

export type AppUser = {
  id: string
  name: string
  email: string
  role: Role
}

export const USERS: AppUser[] = [
  { id: 'U-1', name: 'Ana Torres', email: 'ana.torres@rosversac.com', role: 'admin' },
  { id: 'U-2', name: 'Luis Peña', email: 'luis.pena@rosversac.com', role: 'sales' },
  { id: 'U-3', name: 'Julia Ramírez', email: 'julia.ramirez@correo.com', role: 'client' },
]
