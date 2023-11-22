<script setup>
import { computed, defineProps, defineEmits } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: '' },
  type: { type: String, default: 'text' },
  divClass: { type: String, default: 'login__field' },
  iClass: { type: String, default: 'login__icon fas fa-lock' },
  inputClass: { type: String, default: 'login__input' }
})

const emit = defineEmits(['update:modelValue'])

const inputValue = computed({
  get () {
    return props.modelValue
  },
  set (value) {
    emit('update:modelValue', value)
  }
})

</script>

<template>
    <div :class="props.divClass">
        <i :class="props.iClass"></i>
        <input v-model="inputValue" :type="props.type" :class="props.inputClass" :placeholder="props.label">
    </div>
</template>
