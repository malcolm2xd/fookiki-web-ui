<template>
  <div class="formation-selector">
    <label for="formation" class="block text-sm font-medium text-gray-700 mb-2">
      Formation
    </label>
    <select
      id="formation"
      v-model="selectedFormation"
      class="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
      @change="onFormationChange"
    >
      <option
        v-for="formation in formations"
        :key="formation.key"
        :value="formation.name"
      >
        {{ formation.name }}
      </option>
    </select>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue'
import { useGameStore } from '@/stores/game'

export default defineComponent({
  name: 'FormationSelector',
  
  setup() {
    const store = useGameStore()
    const selectedFormation = ref(store.currentFormation)
    
    const formations = computed(() => store.availableFormations)
    const currentFormation = computed(() => 
      formations.value.find(f => f.key === selectedFormation.value)
    )

    const onFormationChange = () => {
      store.setFormation(selectedFormation.value)
    }

    return {
      selectedFormation,
      formations,
      currentFormation,
      onFormationChange
    }
  }
})
</script>

<style scoped>
.formation-selector {
  width: 300px;
  padding: 1rem;
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin: 1rem;
}
</style> 