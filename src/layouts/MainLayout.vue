<template>
  <q-layout view="lHh Lpr lFf" class="bg-dark text-white">
    <q-header class="bg-transparent text-white q-py-md" :class="{ 'bg-dark': scrolled }">
      <q-toolbar>
        <q-btn flat no-caps no-wrap class="q-ml-xs" to="/">
          <q-avatar size="48px" class="q-mr-sm shadow-2">
             <img src="/icons/sprpta_logo.jpg" style="object-fit: cover; border: 2px solid #D50000; padding: 2px; background: white;">
          </q-avatar>
          <q-toolbar-title shrink class="text-weight-bold" style="letter-spacing: 1px; font-size: 24px;">
            SPRPTA <span class="text-primary">Automation</span>
          </q-toolbar-title>
        </q-btn>

        <q-space />

        <div class="q-gutter-sm row items-center no-wrap">
          <q-btn flat round dense icon="light_mode" />
          <q-btn push color="primary" label="Get Started" @click="scrollToSection" />
        </div>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const scrolled = ref(false)

const handleScroll = () => {
  scrolled.value = window.scrollY > 50
}

const scrollToSection = () => {
  const el = document.getElementById('app-section')
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' })
  }
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style lang="scss">
.logo-circle {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  &::before {
    content: 'S';
    font-weight: 900;
    color: white;
    font-size: 24px;
  }
}
</style>
