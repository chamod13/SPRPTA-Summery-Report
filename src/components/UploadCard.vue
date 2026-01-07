<template>
  <q-card class="upload-card q-pa-lg text-center" flat bordered>
    <div
      class="dropzone q-pa-xl"
      @dragover.prevent
      @drop.prevent="handleDrop"
      :class="{ 'bg-grey-9': isDragging }"
      @dragenter="isDragging = true"
      @dragleave="isDragging = false"
    >
      <q-icon name="cloud_upload" size="64px" color="primary" />
      <div class="text-h5 q-mt-md text-white">Drag & Drop Excel File Here</div>
      <div class="text-caption text-grey">or</div>
      <q-btn outline color="primary" label="Browse Files" class="q-mt-md" @click="triggerFileDetails" />
      <input
        type="file"
        ref="fileInput"
        class="hidden"
        accept=".xlsx, .xls"
        @change="handleFileSelect"
      />
    </div>

    <div v-if="files" class="q-mt-md">
       <q-chip removable @remove="files = null" color="primary" text-color="white" icon="description">
         {{ files.name }}
       </q-chip>
       <q-btn color="white" text-color="black" label="Process File" class="q-mt-sm full-width" @click="processFile" />
    </div>
  </q-card>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['file-uploaded'])

const fileInput = ref(null)
const files = ref(null)
const isDragging = ref(false)

const triggerFileDetails = () => {
  fileInput.value.click()
}

const handleFileSelect = (event) => {
  files.value = event.target.files[0]
}

const handleDrop = (event) => {
  isDragging.value = false
  const droppedFiles = event.dataTransfer.files
  if (droppedFiles.length > 0) {
    files.value = droppedFiles[0]
  }
}

const processFile = () => {
  if (files.value) {
    // Simulate upload or actually upload
    emit('file-uploaded', files.value)
  }
}
</script>

<style lang="scss" scoped>
.upload-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-color: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
}
.dropzone {
  border: 2px dashed rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  transition: all 0.3s ease;
  &:hover {
    border-color: $primary;
    background: rgba(255, 255, 255, 0.02);
  }
}
</style>
