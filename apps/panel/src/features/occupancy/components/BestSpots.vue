<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { MapPin } from 'lucide-vue-next'
import { useOccupancyStore } from '@sp/core'
import PanelCard from '@/components/PanelCard.vue'

defineEmits<{ open: [floorId: string] }>()

const { sectors } = storeToRefs(useOccupancyStore())

// Sectores con más lugares libres; ante empate, el de piso más bajo (más rápido de llegar).
const ranking = computed(() =>
  sectors.value
    .filter((sector) => sector.free > 0)
    .sort((a, b) => b.free - a.free || a.floorId.localeCompare(b.floorId))
    .slice(0, 5),
)

const best = computed(() => ranking.value[0])
const others = computed(() => ranking.value.slice(1))
</script>

<template>
  <PanelCard title="Dónde hay lugar ahora">
    <template v-if="best">
      <div class="best">
        <span class="best__icon"><MapPin :size="20" /></span>
        <div class="best__text">
          <span class="best__tag">Recomendado</span>
          <strong>{{ best.floorName }} · {{ best.sectorName }}</strong>
          <span>{{ best.free }} libres de {{ best.total }}</span>
        </div>
        <button type="button" class="button" @click="$emit('open', best.floorId)">
          Ver en el mapa
        </button>
      </div>

      <ul v-if="others.length" class="others">
        <li v-for="sector in others" :key="sector.sectorId">
          <button type="button" class="other" @click="$emit('open', sector.floorId)">
            <span>{{ sector.floorName }} · {{ sector.sectorName }}</span>
            <strong>{{ sector.free }} libres</strong>
          </button>
        </li>
      </ul>
    </template>

    <p v-else class="empty">No hay cocheras libres en este momento.</p>
  </PanelCard>
</template>

<style scoped>
.best {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  border: 1px solid rgb(52 196 130 / 0.3);
  border-radius: var(--sp-radius-sm);
  background: rgb(52 196 130 / 0.06);
}

.best__icon {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: var(--sp-radius-sm);
  background: rgb(52 196 130 / 0.14);
  color: var(--sp-free);
}

.best__text {
  flex: 1;
  display: grid;
  min-width: 0;
}

.best__text strong {
  font-size: 16px;
}

.best__text span:last-child {
  font-size: 13px;
  color: var(--sp-text-muted);
}

.best__tag {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--sp-free);
}

.button {
  height: 36px;
  padding: 0 14px;
  border: 1px solid var(--sp-border-strong);
  border-radius: var(--sp-radius-sm);
  background: var(--sp-surface-2);
  color: var(--sp-text);
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
}

.button:hover {
  background: var(--sp-surface-3);
}

.others {
  flex: 1;
  display: grid;
  align-content: start;
  margin: 12px 0 0;
  padding: 0;
  list-style: none;
}

.other {
  width: 100%;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 4px;
  border: 0;
  border-top: 1px solid var(--sp-border);
  background: none;
  color: var(--sp-text-muted);
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}

.other:hover {
  color: var(--sp-text);
}

.other strong {
  color: var(--sp-text);
  font-variant-numeric: tabular-nums;
}

.empty {
  margin: 0;
  color: var(--sp-text-muted);
}

@media (max-width: 520px) {
  .best {
    flex-wrap: wrap;
  }
}
</style>
