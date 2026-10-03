import type { Floor, Lot } from '../lots'
import { buildMockLot } from '../occupancy/mock'
import type { PlatformLot } from './types'

// MOCK: playas de ejemplo en Córdoba (los dueños son cuentas de accounts). Se reemplaza por GET /api/admin/playas.

export function buildMockPlatformLots(): PlatformLot[] {
  const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString()

  const rows: Array<
    [string, string, string, number, number, PlatformLot['status'], string | null, number, number]
  > = [
    ['Playa Centro', 'Av. Colón 1234', 'Centro', -31.4135, -64.1888, 'active', 'o1', 120, 210],
    ['Playa Cañada', 'Marcelo T. de Alvear 520', 'Centro', -31.4189, -64.1909, 'active', 'o1', 80, 180],
    ['Nueva Córdoba Parking', 'Bv. Illia 315', 'Nueva Córdoba', -31.4257, -64.1866, 'active', 'o3', 200, 150],
    ['Plaza España', 'Av. Hipólito Yrigoyen 640', 'Nueva Córdoba', -31.4292, -64.1857, 'active', 'o3', 150, 95],
    ['Güemes Estacionamiento', 'Belgrano 845', 'Güemes', -31.4262, -64.1938, 'active', 'o5', 60, 60],
    ['Cochera Alberdi', 'Av. Colón 2150', 'Alberdi', -31.4108, -64.2012, 'onboarding', 'o2', 45, 12],
    ['Cerro Parking', 'Av. Rafael Núñez 4560', 'Cerro de las Rosas', -31.3735, -64.2312, 'onboarding', 'o4', 70, 6],
    ['Playa San Martín', 'San Martín 180', 'Centro', -31.4152, -64.1832, 'suspended', 'o2', 40, 260],
    ['Estacionamiento General Paz', '25 de Mayo 1420', 'General Paz', -31.4095, -64.1679, 'not_subscribed', null, 90, 30],
    ['Playa Patio Olmos', 'Bv. San Juan 85', 'Nueva Córdoba', -31.4198, -64.1884, 'not_subscribed', null, 300, 28],
    ['Cochera Barrio Jardín', 'Av. Valparaíso 3200', 'Jardín', -31.4472, -64.1801, 'not_subscribed', null, 35, 25],
    ['Playa Terminal', 'Bv. Perón 380', 'Nueva Córdoba', -31.4231, -64.1752, 'not_subscribed', null, 110, 20],
  ]

  return rows.map(([name, address, neighborhood, lat, lng, status, ownerId, totalSpaces, age], index) => {
    const live = status === 'active'
    const subscribed = status !== 'not_subscribed'
    return {
      id: index === 0 ? 'lot-centro' : `lot-${index + 1}`,
      name,
      address,
      neighborhood,
      location: { lat, lng },
      status,
      ownerId,
      mqttCode: subscribed ? `ARG-CBA-${String(index + 1).padStart(3, '0')}` : null,
      totalSpaces,
      freeSpaces: live ? Math.floor(totalSpaces * (0.15 + Math.random() * 0.5)) : null,
      faultySensors: live ? Math.floor(Math.random() * 3) : null,
      reservationsToday: live ? Math.floor(totalSpaces * (0.1 + Math.random() * 0.25)) : null,
      createdAt: daysAgo(age),
    }
  })
}

/**
 * Plano de ejemplo de una playa. Playa Centro usa el mismo plano que ve el playero;
 * el resto se arma con pisos de hasta 4 sectores de 10 cocheras.
 */
export function buildMockLayout(lot: PlatformLot): Lot {
  if (lot.id === 'lot-centro') return buildMockLot()

  const floors: Floor[] = []
  let number = 1
  let remaining = lot.totalSpaces
  for (let floorIndex = 0; remaining > 0; floorIndex++) {
    const sectors = []
    for (let sectorIndex = 0; sectorIndex < 4 && remaining > 0; sectorIndex++) {
      const count = Math.min(10, remaining)
      remaining -= count
      sectors.push({
        id: `${lot.id}-f${floorIndex + 1}-${sectorIndex}`,
        name: `Sector ${String.fromCharCode(65 + sectorIndex)}`,
        spaces: Array.from({ length: count }, () => {
          const id = `${lot.id}-s${number}`
          return { id, number: number++ }
        }),
      })
    }
    floors.push({ id: `${lot.id}-f${floorIndex + 1}`, name: `Piso ${floorIndex + 1}`, sectors })
  }

  return {
    id: lot.id,
    name: lot.name,
    address: lot.address,
    floors,
    overstayTariff: { pricePerHour: 2000, fractionMinutes: 15 },
  }
}
