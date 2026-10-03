import type { StaffAccount } from './types'

// MOCK: cuentas de ejemplo. Los ids de los dueños (o1…o5) coinciden con los de las playas.

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString()
const hoursAgo = (hours: number) => new Date(Date.now() - hours * 3_600_000).toISOString()

export function buildMockAccounts(): StaffAccount[] {
  const rows: Array<[string, string, string, StaffAccount['role'], string, string, string[], boolean, number | null, number]> = [
    ['mock-admin', 'Admin', 'admin', 'platform_admin', 'admin@sp.com.ar', '351 555-0001', [], true, 0.2, 400],
    ['u-admin2', 'Lucas Benítez', 'lbenitez', 'platform_admin', 'lbenitez@sp.com.ar', '351 555-0002', [], true, 30, 120],
    ['o1', 'Estacionamientos del Centro SRL', 'edcentro', 'owner', 'contacto@edcentro.com.ar', '351 421-0034', [], true, 5, 210],
    ['o2', 'Ricardo Funes', 'rfunes', 'owner', 'rfunes@gmail.com', '351 615-2290', [], true, 72, 260],
    ['o3', 'Grupo Nueva Córdoba SA', 'gruponc', 'owner', 'admin@gruponc.com.ar', '351 468-7712', [], true, 20, 150],
    ['o4', 'Marta Ledesma', 'mledesma', 'owner', 'marta.ledesma@hotmail.com', '351 702-4518', [], true, null, 6],
    ['o5', 'Parking Güemes', 'pguemes', 'owner', 'parkingguemes@gmail.com', '351 330-9081', [], true, 48, 60],
    ['mock-attendant', 'Playero', 'playero', 'attendant', '', '', ['lot-centro'], true, 0.1, 200],
    ['u-att2', 'Damián Ruiz', 'druiz', 'attendant', '', '351 611-2034', ['lot-centro', 'lot-2'], true, 3, 170],
    ['u-att3', 'Natalia Sosa', 'nsosa', 'attendant', '', '351 622-8890', ['lot-3'], true, 1, 140],
    ['u-att4', 'Franco Vélez', 'fvelez', 'attendant', '', '', ['lot-4'], true, 9, 90],
    ['u-att5', 'Julieta Arce', 'jarce', 'attendant', '', '351 640-1177', ['lot-5'], true, 26, 55],
    ['u-att6', 'Sergio Molina', 'smolina', 'attendant', '', '', ['lot-8'], false, 900, 250],
  ]
  return rows.map(([id, name, username, role, email, phone, lotIds, active, lastLogin, age]) => ({
    id,
    name,
    username,
    role,
    email,
    phone,
    lotIds,
    active,
    mustChangePassword: lastLogin === null,
    lastLoginAt: lastLogin === null ? null : hoursAgo(lastLogin),
    createdAt: daysAgo(age),
  }))
}
