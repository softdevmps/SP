<script setup lang="ts">
import { computed } from 'vue'
import { Info } from 'lucide-vue-next'
import { formatMoney } from '@sp/core'
import PageHeader from '@/components/PageHeader.vue'
import PanelCard from '@/components/PanelCard.vue'
import StatusPill from '@/components/StatusPill.vue'
import { LOT_STATUSES } from '@/features/admin-lots/statuses'
import { useOwnerLot } from '@/features/owner/useOwnerLot'

const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

// Solo lectura: la configuración de la playa la hace el admin de plataforma.
const { activeLot, layout, lotSettings } = useOwnerLot()

const days = computed(() =>
  [1, 2, 3, 4, 5, 6, 0]
    .map((weekday) => lotSettings.value?.openingHours.find((day) => day.weekday === weekday))
    .filter((day) => !!day),
)
</script>

<template>
  <section class="page">
    <PageHeader title="Datos y tarifas" :subtitle="activeLot?.name" />
    <p class="note">
      <Info :size="16" />
      Para cambiar algún dato, las tarifas o los horarios, contactá al administrador de la plataforma.
    </p>

    <div v-if="activeLot" class="grid">
      <PanelCard title="Datos de la playa">
        <dl class="data">
          <div><dt>Nombre</dt><dd>{{ activeLot.name }}</dd></div>
          <div><dt>Dirección</dt><dd>{{ activeLot.address }}</dd></div>
          <div><dt>Barrio</dt><dd>{{ activeLot.neighborhood || '—' }}</dd></div>
          <div><dt>Estado</dt><dd><StatusPill :label="LOT_STATUSES[activeLot.status].label" :tone="LOT_STATUSES[activeLot.status].tone" /></dd></div>
          <div><dt>Cocheras</dt><dd>{{ activeLot.totalSpaces }}</dd></div>
          <div><dt>Pisos</dt><dd>{{ layout?.floors.map((floor) => floor.name).join(' · ') || '—' }}</dd></div>
        </dl>
      </PanelCard>

      <PanelCard title="Tarifas">
        <dl v-if="lotSettings" class="data">
          <div><dt>Reserva desde la app</dt><dd>{{ formatMoney(lotSettings.reservationTariff.pricePerHour) }} por hora</dd></div>
          <div><dt>Duración mínima</dt><dd>{{ lotSettings.reservationTariff.minMinutes }} min</dd></div>
          <div><dt>Franjas cada</dt><dd>{{ lotSettings.reservationTariff.stepMinutes }} min</dd></div>
          <div><dt>Excedente</dt><dd>{{ formatMoney(lotSettings.overstayTariff.pricePerHour) }} por hora</dd></div>
          <div><dt>Se cobra por fracción de</dt><dd>{{ lotSettings.overstayTariff.fractionMinutes }} min</dd></div>
        </dl>
      </PanelCard>

      <PanelCard title="Horario de atención">
        <ul class="days">
          <li v-for="day in days" :key="day.weekday" :class="{ 'is-closed': !day.open }">
            <span>{{ WEEKDAYS[day.weekday] }}</span>
            <strong>{{ !day.open ? 'Cerrado' : day.allDay ? '24 h' : `${day.from} a ${day.to}` }}</strong>
          </li>
        </ul>
      </PanelCard>
    </div>
  </section>
</template>

<style scoped>
.page {
  display: grid;
  gap: 20px;
}

.note {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 13px;
  color: var(--sp-text-muted);
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
  align-items: stretch;
}

.data {
  display: grid;
  gap: 12px;
  margin: 0;
}

.data div {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.data dt {
  color: var(--sp-text-muted);
}

.data dd {
  margin: 0;
  font-weight: 600;
  text-align: right;
}

.days {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.days li {
  display: flex;
  justify-content: space-between;
}

.days li span {
  color: var(--sp-text-muted);
}

.days li.is-closed strong {
  color: var(--sp-text-faint);
  font-weight: 500;
}

@media (max-width: 1200px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
