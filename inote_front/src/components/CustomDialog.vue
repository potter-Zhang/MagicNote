<script setup>
import { defineProps, computed } from 'vue'

const props = defineProps({
  role: { type: String, default: '' },
  content: { type: String, default: '' }
})

const role = computed({
  get () {
    return 'message ' + props.role
  }
})

</script>

<template>
      <div :class="role">
          {{ props.content }}
      </div>
</template>
