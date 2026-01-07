<template>
  <q-page class="bg-dark text-white">
    <!-- Hero Section -->
    <section class="hero-section row items-center justify-center q-pa-md">
      <div class="col-12 col-md-6 q-pa-xl">
        <div class="text-h2 text-weight-bolder q-mb-md rubberBand text-white" style="line-height: 1.1;">
          Automate <span class="text-stroke">Summary</span> <br />
          <span class="text-primary text-glow">Reports Instantly</span>
        </div>
        <p class="text-h6 text-grey-4 q-mb-xl q-mt-lg" style="max-width: 550px; line-height: 1.6;">
          Transform complex Excel data into executive-grade PDF reports with a single drag & drop. 
          Experience the power of intelligent automation.
        </p>
        <div class="row q-gutter-md">
           <q-btn 
            color="primary" 
            size="lg" 
            label="Get Started Now" 
            icon-right="bolt" 
            class="q-px-xl rounded-borders shadow-glow"
            @click="scrollToApp"
          />
        </div>
      </div>
      <div class="col-12 col-md-6 flex flex-center position-relative">
        <div class="hero-bg-glow"></div>
        <q-img 
          src="/img/hero.png" 
          class="float-animation hero-image"
          spinner-color="primary"
        />
      </div>
    </section>

    <!-- App Section -->
    <section id="app-section" class="app-section q-py-xl bg-dark-page">
      <div class="container q-pa-md">
         <div class="text-center q-mb-xl">
            <h2 class="text-h4 text-weight-bold">Generate Your Report</h2>
            <div class="text-subtitle1 text-grey">Upload your data file to get started</div>
         </div>

         <div class="row justify-center">
            <div class="col-12 col-md-8">
               
               <!-- State 1: Upload -->
               <transition name="fade" mode="out-in">
                 <upload-card v-if="step === 1" @file-uploaded="handleFileUpload" />

                 <!-- State 2: Select Fields -->
                 <q-card v-else-if="step === 2" class="glass-card q-pa-lg text-left">
                    <div class="text-h5 q-mb-md">Select Columns</div>
                    <p class="text-grey-4">We detected the following columns. Select the ones you want to include in the summary.</p>
                    
                    <div class="row q-col-gutter-sm q-mb-lg">
                      <div class="col-6 col-sm-4" v-for="field in mockFields" :key="field">
                        <q-checkbox v-model="selectedFields" :val="field" :label="field" color="primary" dark />
                      </div>
                    </div>

                    <div class="row justify-end q-gutter-sm">
                      <q-btn flat color="white" label="Cancel" @click="step = 1" />
                      <q-btn color="primary" label="Analyze & Generate Report" @click="generateReport" :loading="loading" />
                    </div>
                 </q-card>
                 <!-- State 3: Live Dashboard -->
                 <div v-else-if="step === 3" class="dashboard-view q-pa-md fade-in">
                    <div class="row q-col-gutter-md q-mb-lg">
                        <!-- KPI Cards -->
                <!-- KPI Cards -->
                        <div class="col-12 col-md-6">
                            <q-card class="bg-gradient-red text-white q-pa-lg column justify-center items-center" style="min-height: 200px">
                                <div class="text-h6 opacity-7 q-mb-sm">Total Incidents</div>
                                <div class="text-h2 text-weight-bolder">{{ dashboardData.kpi.accidents }}</div>
                                <q-icon name="warning" size="80px" class="absolute-bottom-right opacity-3" style="bottom: -15px; right: -15px;" />
                            </q-card>
                        </div>
                        <div class="col-12 col-md-6">
                            <q-card class="bg-gray-dark text-white q-pa-lg column justify-center items-center" style="min-height: 200px">
                                <div class="text-h6 opacity-7 q-mb-sm">Total Fines Revenue</div>
                                <div class="text-h2 text-weight-bolder">LKR {{ dashboardData.kpi.fines.toLocaleString() }}</div>
                                <q-icon name="payments" size="80px" class="absolute-bottom-right opacity-3" style="bottom: -15px; right: -15px;" />
                            </q-card>
                        </div>
                    </div>

                    <div class="row q-col-gutter-md q-mb-xl">
                        <!-- Charts -->
                        <div class="col-12 col-md-8">
                            <q-card class="glass-card q-pa-md column" style="min-height: 480px;">
                                <div class="text-h6 text-white q-mb-md">High Risk Routes</div>
                                <div class="col flex flex-center">
                                   <apexchart type="bar" height="350" width="100%" :options="chartOptions.bar" :series="dashboardData.series.routes"></apexchart>
                                </div>
                            </q-card>
                        </div>
                        <div class="col-12 col-md-4">
                            <q-card class="glass-card q-pa-md column" style="min-height: 480px;">
                                <div class="text-h6 text-white q-mb-md">Offense Distribution</div>
                                <div class="col flex flex-center">
                                    <apexchart type="donut" height="320" width="100%" :options="chartOptions.donut" :series="dashboardData.series.offenses"></apexchart>
                                </div>
                            </q-card>
                        </div>
                    </div>

                    <div class="row justify-center q-gutter-md">
                        <q-btn outline color="white" label="Upload New File" @click="step = 1" />
                        <q-btn color="primary" icon="picture_as_pdf" label="Download Official Report" size="lg" @click="generatePdf" :loading="loading" />
                    </div>
                 </div>

                 <!-- State 4: processing for PDF is implicit or direct download -->
               </transition>

            </div>
         </div>
      </div>
    </section>
  </q-page>
</template>

<script setup>
import { ref, reactive } from 'vue'
import UploadCard from 'src/components/UploadCard.vue'

const step = ref(1)
const loading = ref(false)
const selectedFields = ref([])
const mockFields = ref([])
const uploadedFilename = ref('')

// Dashboard State
const dashboardData = reactive({
    kpi: { accidents: 0, fines: 0 },
    series: { routes: [], offenses: [] }
})

const chartOptions = reactive({
    bar: {
        chart: { toolbar: { show: false }, foreColor: '#fff', fontFamily: 'Helvetica, Arial, sans-serif' },
        plotOptions: { 
            bar: { 
                borderRadius: 4, 
                horizontal: true, 
                barHeight: '60%',
                dataLabels: { position: 'bottom' }
            } 
        },
        dataLabels: { enabled: true, textAnchor: 'start', style: { colors: ['#fff'] }, offsetX: 0 },
        colors: ['#D50000'],
        xaxis: { categories: [] },
        grid: { borderColor: 'rgba(255,255,255,0.1)', padding: { left: 10, right: 10 } }
    },
    donut: {
        chart: { foreColor: '#fff', fontFamily: 'Helvetica, Arial, sans-serif' },
        colors: ['#D50000', '#FF1744', '#FF5252', '#B00020', '#666'],
        labels: [],
        legend: { position: 'bottom', offsetY: 0 },
        stroke: { show: false },
        plotOptions: { pie: { donut: { size: '75%', labels: { show: true, total: { show: true, showAlways: true, label: 'Total', color: '#fff' } } } } }
    }
})

const scrollToApp = () => {
  const el = document.getElementById('app-section')
  el.scrollIntoView({ behavior: 'smooth' })
}

const handleFileUpload = async (file) => {
  const formData = new FormData()
  formData.append('file', file)

  try {
      loading.value = true
      const response = await fetch('http://localhost:5000/api/upload', {
          method: 'POST',
          body: formData
      })
      const data = await response.json()
      
      if (response.ok) {
          uploadedFilename.value = data.filename
          mockFields.value = data.headers || []
          selectedFields.value = [...mockFields.value]
          step.value = 2
      } else {
          alert('Upload failed: ' + data.error)
      }
  } catch (e) {
      console.error(e)
      alert('Error connecting to server')
  } finally {
      loading.value = false
  }
}

// 1. Analyze Data for Dashboard
const generateReport = async () => {
  loading.value = true
  
  try {
      const response = await fetch('http://localhost:5000/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: uploadedFilename.value })
      })
      const data = await response.json()

      if (response.ok) {
          // Populate Dashboard
          dashboardData.kpi = data.kpi
          
          dashboardData.series.routes = [{ name: 'Incidents', data: data.charts.routes.data }]
          chartOptions.bar = { ...chartOptions.bar, xaxis: { categories: data.charts.routes.labels } }

          dashboardData.series.offenses = data.charts.offenses.data
          chartOptions.donut = { ...chartOptions.donut, labels: data.charts.offenses.labels }

          step.value = 3
      } else {
          alert('Analysis failed')
      }
  } catch (e) {
       console.error(e)
       alert('Error connecting to server')
  } finally {
    loading.value = false
  }
}

// 2. Generate actual PDF
const generatePdf = async () => {
    loading.value = true
    try {
      const response = await fetch('http://localhost:5000/api/generate-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: uploadedFilename.value })
      })
      const data = await response.json()
      if (response.ok) {
          window.open(data.url, '_blank')
      }
    } catch {
        alert('PDF Generation failed')
    } finally {
        loading.value = false
    }
}
</script>

<style lang="scss" scoped>
// ... (Previous Styles)

.bg-gradient-red {
    background: linear-gradient(135deg, #D50000 0%, #B71C1C 100%);
    border-radius: 16px;
    position: relative;
    overflow: hidden;
}

.bg-gray-dark {
    background: #1e1e1e;
    border: 1px solid #333;
    border-radius: 16px;
    position: relative;
    overflow: hidden;
}

.opacity-7 { opacity: 0.7; }
.opacity-3 { opacity: 0.1; }

.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
}
</style>

<style lang="scss" scoped>
.hero-section {
  min-height: 90vh;
  position: relative;
  overflow: hidden;
}

.text-glow {
  text-shadow: 0 0 20px rgba(213, 0, 0, 0.6);
}

.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
