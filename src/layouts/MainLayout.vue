<template>
  <q-layout
    view="lHh Lpr lff"
    :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-grey-1 text-black'"
  >
    <q-header
      class="bg-transparent q-py-md"
      :class="{
        'text-white': $q.dark.isActive,
        'text-black': !$q.dark.isActive,
        'bg-dark': scrolled && $q.dark.isActive,
        'bg-white shadow-1': scrolled && !$q.dark.isActive,
      }"
    >
      <q-toolbar>
        <q-btn flat no-caps no-wrap class="q-ml-xs" to="/">
          <q-avatar size="48px" class="q-mr-sm shadow-2">
            <img
              src="/icons/sprpta_logo.jpg"
              style="object-fit: cover; border: 2px solid #d50000; padding: 2px; background: white"
            />
          </q-avatar>
          <div class="column items-start text-left q-ml-sm">
            <div
              class="text-weight-bold"
              style="letter-spacing: 1px; font-size: 22px; line-height: 1.2"
            >
              SPRPTA <span class="text-primary">Automation</span>
            </div>
            <div
              class="text-weight-medium"
              :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-8'"
              style="font-size: 11px; letter-spacing: 0.5px; opacity: 0.9"
            >
              Southern Provincial Road Passenger Transport Authority
            </div>
          </div>
        </q-btn>

        <q-space />

        <div class="q-gutter-sm row items-center no-wrap">
          <q-btn
            flat
            round
            dense
            :icon="$q.dark.isActive ? 'light_mode' : 'dark_mode'"
            @click="toggleTheme"
          />
          <q-btn push color="primary" label="Get Started" @click="scrollToSection" />
        </div>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer class="bg-transparent q-py-md text-center" style="backdrop-filter: blur(5px)">
      <div
        class="developer-badge inline-block relative-position q-px-lg q-py-sm cursor-pointer overflow-hidden"
      >
        <div class="glass-effect absolute-full"></div>
        <div class="relative-position z-top column items-center">
          <div
            class="text-caption text-grey-5"
            style="letter-spacing: 2px; font-size: 10px; text-transform: uppercase"
          >
            Software Developed by
          </div>
          <div
            class="dev-name text-white text-weight-bold q-my-xs"
            style="letter-spacing: 1px; font-size: 12px"
          >
            Chamod S Jayawickrama
          </div>
          <div
            class="dev-email text-primary"
            style="
              font-size: 10px;
              opacity: 0;
              transform: translateY(5px);
              transition: all 0.3s ease;
            "
          >
            dinujachamod13@gmail.com
          </div>
        </div>
      </div>
    </q-footer>
  </q-layout>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()
$q.dark.set(true) // Default to dark mode

const toggleTheme = () => {
  $q.dark.toggle()
}

const scrolled = ref(false)
const mouseX = ref(0)
const mouseY = ref(0)

const handleScroll = () => {
  scrolled.value = window.scrollY > 50
}

const handleMouseMove = (e) => {
  mouseX.value = e.clientX
  mouseY.value = e.clientY
  const cards = document.getElementsByClassName('glass-card')
  for (const card of cards) {
    const rect = card.getBoundingClientRect(),
      x = e.clientX - rect.left,
      y = e.clientY - rect.top

    card.style.setProperty('--mouse-x', `${x}px`)
    card.style.setProperty('--mouse-y', `${y}px`)
  }
}

const scrollToSection = () => {
  const el = document.getElementById('app-section')
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' })
  }
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  window.addEventListener('mousemove', handleMouseMove)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('mousemove', handleMouseMove)
})
</script>

<style lang="scss">
// Global Background Spotlight
.q-layout {
  background-color: #0a0a0a; // Deep dark bg
  &::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    background: radial-gradient(
      800px circle at v-bind('mouseX + "px"') v-bind('mouseY + "px"'),
      rgba(213, 0, 0, 0.08),
      transparent 60%
    );
    z-index: 1;
  }
}

// Logo Styling
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

// Footer Developer Badge
.developer-badge {
  border-radius: 50px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.5s ease;

  .glass-effect {
    background: rgba(0, 0, 0, 0.4);
    border-radius: 50px;
    filter: blur(10px);
    opacity: 0.8;
    transition: all 0.3s;
  }

  &:hover {
    border-color: rgba(213, 0, 0, 0.3);
    transform: translateY(-2px);
    box-shadow: 0 10px 30px -10px rgba(213, 0, 0, 0.3);

    .dev-name {
      background: linear-gradient(to right, #fff, #ff5252);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .dev-email {
      opacity: 1;
      transform: translateY(0);
    }
  }
}
</style>
