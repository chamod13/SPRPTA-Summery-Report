const express = require('express');
const cors = require('cors');
const multer = require('multer');
const xlsx = require('xlsx');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/reports', express.static(path.join(__dirname, 'reports')));

// Database Configuration (User to fill in credentials)
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'sprpta_db',
  password: 'password', // TODO: Change this
  port: 5432,
});

// File Upload Configuration
const uploadDir = 'uploads';
const reportsDir = 'reports';

if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}
if (!fs.existsSync(reportsDir)){
    fs.mkdirSync(reportsDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// --- Helper Function: Data Analysis ---
const analyzeData = (data) => {
    // 1. Route Analysis
    const routeStats = {};
    data.forEach(row => {
        const route = row['Route Id'] || 'Unknown';
        const fine = parseFloat(row['Fine (LKR)']) || 0;
        if (!routeStats[route]) routeStats[route] = { count: 0, fines: 0 };
        routeStats[route].count++;
        routeStats[route].fines += fine;
    });

    const sortedRoutes = Object.entries(routeStats)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5); // Top 5 Routes

    // 2. Offense Analysis
    const offenseStats = {};
    data.forEach(row => {
        const offense = row['Offenses'] || 'Unspecified';
        offenseStats[offense] = (offenseStats[offense] || 0) + 1;
    });
    const sortedOffenses = Object.entries(offenseStats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    // 3. Totals
    const totalFines = data.reduce((sum, row) => sum + (parseFloat(row['Fine (LKR)']) || 0), 0);
    const totalIncidents = data.length;

    return { sortedRoutes, sortedOffenses, offenseStats, totalFines, totalIncidents };
};

// --- Routes ---

// 1. Upload Excel and Get Columns
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Get headers (first row)
    const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    const headers = jsonData[0] || [];

    res.json({
      message: 'File uploaded successfully',
      filename: req.file.filename,
      headers: headers,
      preview: jsonData.slice(1, 6) // Send first 5 rows for preview
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to process file' });
  }
});

// 2. Analyze Data (For Dashboard)
app.post('/api/analyze', (req, res) => {
    const { filename } = req.body;
    try {
        const filePath = path.join(uploadDir, filename);
        if (!fs.existsSync(filePath)) {
           return res.status(404).json({ error: 'File not found' });
        }

        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        const analysis = analyzeData(data);
        
        // Format for Chart.js / Frontend
        res.json({
            message: 'Analysis success',
            kpi: {
                accidents: analysis.totalIncidents,
                fines: analysis.totalFines
            },
            charts: {
                routes: {
                    labels: analysis.sortedRoutes.map(x => `Route ${x[0]}`),
                    data: analysis.sortedRoutes.map(x => x[1].count)
                },
                offenses: {
                    labels: analysis.sortedOffenses.map(x => x[0]),
                    data: analysis.sortedOffenses.map(x => x[1])
                }
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Analysis failed' });
    }
});

// 3. Generate PDF Report
app.post('/api/generate-report', (req, res) => {
  const { filename } = req.body; 
  
  try {
      const filePath = path.join(uploadDir, filename);
      if (!fs.existsSync(filePath)) {
         return res.status(404).json({ error: 'File not found. Please upload again.' });
      }

      // Read and Parse Data
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

      // --- USE HELPER ---
      const { sortedRoutes, sortedOffenses, offenseStats, totalFines, totalIncidents } = analyzeData(data);

      // --- PDF GENERATION ---
      const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });
      const reportName = `SPRPTA_Analysis_${Date.now()}.pdf`;
      const reportPath = path.join(reportsDir, reportName);
      const stream = fs.createWriteStream(reportPath);
      
      doc.pipe(stream);

      // --- 1. HEADER PAGE ---
      
      // Header Banner
      doc.rect(0, 0, 595.28, 120).fill('#121212'); 
      const logoPath = path.join(__dirname, '../public/icons/sprpta_logo.jpg');
      
      if (fs.existsSync(logoPath)) {
          doc.save();
          // Circular Clip: Center (90, 60), Radius 40
          doc.circle(90, 60, 40).clip(); 
          doc.image(logoPath, 50, 20, { width: 80, height: 80, fit: [80, 80] });
          doc.restore();
      }
      
      doc.fillColor('#D50000').fontSize(28).font('Helvetica-Bold').text('SPRPTA', 160, 40, { characterSpacing: 2 });
      doc.fillColor('white').fontSize(10).font('Helvetica').text('SUMMARY REPORT AUTOMATION SYSTEM', 160, 75, { characterSpacing: 1.5 });
      
      doc.fillColor('white').fontSize(10).text(`Generated: ${new Date().toLocaleDateString()}`, 450, 50, { align: 'right' });
      doc.text(`Time: ${new Date().toLocaleTimeString()}`, 450, 65, { align: 'right' });

      doc.moveDown(6);

      // -- Executive Summary --
      doc.fillColor('#121212').fontSize(20).font('Helvetica-Bold').text('Executive Analysis', 50, doc.y, { align: 'left', underline: true });
      doc.moveDown(1);
      
      const summaryItems = [
          { label: 'Total Recorded Incidents:', value: totalIncidents.toString() },
          { label: 'Total Revenue from Fines:', value: `LKR ${totalFines.toLocaleString()}` },
          { label: 'Most Critical Route:', value: `Route ${sortedRoutes[0] ? sortedRoutes[0][0] : 'N/A'}` },
          { label: 'Top Recurring Offense:', value: sortedOffenses[0] ? sortedOffenses[0][0] : 'N/A' }
      ];

      let summaryY = doc.y;
      summaryItems.forEach(item => {
          doc.rect(50, summaryY, 4, 4).fill('#D50000'); // Bullet point
          doc.fillColor('#333').fontSize(12).font('Helvetica-Bold').text(item.label, 65, summaryY - 2);
          doc.fillColor('#555').fontSize(12).font('Helvetica').text(item.value, 230, summaryY - 2);
          summaryY += 25;
      });
      
      // Move cursor below summary
      doc.y = summaryY + 20;

      // -- KPIs --
      const kpiTop = doc.y;
      
      // KPI 1
      doc.roundedRect(50, kpiTop, 240, 70, 5).fillAndStroke('#f9f9f9', '#e0e0e0');
      doc.fillColor('#D50000').fontSize(24).font('Helvetica-Bold').text(totalIncidents, 50, kpiTop + 15, { width: 240, align: 'center' });
      doc.fillColor('#666').fontSize(10).font('Helvetica').text('Total Recorded Incidents', 50, kpiTop + 45, { width: 240, align: 'center' });

      // KPI 2
      doc.roundedRect(305, kpiTop, 240, 70, 5).fillAndStroke('#f9f9f9', '#e0e0e0');
      doc.fillColor('#D50000').fontSize(24).font('Helvetica-Bold').text(`LKR ${totalFines.toLocaleString()}`, 305, kpiTop + 15, { width: 240, align: 'center' });
      doc.fillColor('#666').fontSize(10).font('Helvetica').text('Total Revenue from Fines', 305, kpiTop + 45, { width: 240, align: 'center' });

      doc.moveDown(6); // Space before charts

      // --- 2. CHARTS SECTION (Same Page if space) ---
      
      // Bar Chart: Top Routes
      doc.fillColor('#121212').fontSize(16).font('Helvetica-Bold').text('Top 5 High-Risk Routes', 50, doc.y);
      doc.moveDown(1);
      
      let chartY = doc.y;
      const chartX = 120;
      const maxCount = sortedRoutes[0] ? sortedRoutes[0][1].count : 1;
      
      sortedRoutes.forEach((item, index) => {
          const route = item[0];
          const count = item[1].count;
          const barWidth = (count / maxCount) * 350;
          
          // Label
          doc.fillColor('#444').fontSize(11).font('Helvetica').text(`Route ${route}`, 50, chartY + 5, { width: 60, align: 'right' });
          
          // Bar Background
          doc.roundedRect(chartX, chartY, 350, 20, 3).fill('#eee');
          // Actual Bar
          doc.roundedRect(chartX, chartY, barWidth, 20, 3).fill('#D50000');
          
          // Value
          doc.fillColor('white').fontSize(10).font('Helvetica-Bold').text(count, chartX + 5, chartY + 5);
          
          chartY += 35;
      });

      // Pie Chart Logic (Offenses) - New Page
      doc.addPage();
      doc.rect(0, 0, 595.28, 50).fill('#121212');
      doc.fillColor('white').fontSize(14).text('Offense Distribution Analysis', 50, 18);
      
      doc.moveDown(4);

      // Draw Pie Chart Manually
      const pieX = 200;
      const pieY = 200;
      const radius = 100;
      let startAngle = 0;
      const totalOffensesCount = Object.values(offenseStats).reduce((a, b) => a + b, 0);

      const colors = ['#D50000', '#FF1744', '#FF5252', '#FF8A80', '#B00020', '#333'];
      
      // Legend Position
      let legendY = 150;
      const legendX = 350;

      sortedOffenses.slice(0, 6).forEach((item, index) => {
          const count = item[1];
          const percentage = count / totalOffensesCount;
          const sliceAngle = percentage * Math.PI * 2;
          const endAngle = startAngle + sliceAngle;

          doc.save();
          doc.moveTo(pieX, pieY)
             .arc(pieX, pieY, radius, startAngle, endAngle)
             .lineTo(pieX, pieY)
             .fill(colors[index % colors.length]);
          doc.restore();
          
          // Legend
          doc.rect(legendX, legendY, 15, 15).fill(colors[index % colors.length]);
          doc.fillColor('#333').fontSize(10).text(`${item[0]} (${Math.round(percentage * 100)}%)`, legendX + 25, legendY + 3);
          legendY += 25;

          startAngle = endAngle;
      });

      // --- 3. DETAILED TABLE ---
      doc.moveDown(15); // Push down from chart
      
      if (doc.y > 650) doc.addPage(); // Ensure title isn't at bottom
      
      doc.fillColor('#121212').fontSize(18).font('Helvetica-Bold').text('Detailed Incident Log', 50);
      doc.moveDown(1);
      
      // Table Header Style
      const drawTableHeader = (y) => {
          doc.rect(50, y, 500, 25).fill('#e0e0e0');
          doc.fillColor('black').fontSize(10).font('Helvetica-Bold');
          doc.text('Bus No.', 60, y + 8);
          doc.text('Route', 140, y + 8);
          doc.text('Start Time', 200, y + 8);
          doc.text('Offense', 310, y + 8);
          doc.text('Fine (LKR)', 480, y + 8);
      };

      let currentY = doc.y;
      drawTableHeader(currentY);
      currentY += 30;

      doc.font('Helvetica').fontSize(10);
      
      // Iterate Data
      data.slice(0, 100).forEach((row, i) => {
          // Check for page break
          if (currentY > 750) {
              doc.addPage();
              currentY = 50;
              drawTableHeader(currentY);
              currentY += 30;
              doc.font('Helvetica').fontSize(10); // Reset font after header
          }
          
          // Alternating Row Color
          if (i % 2 === 0) {
              doc.rect(50, currentY - 5, 500, 20).fillColor('#f9f9f9').fill();
          }
          doc.fillColor('#333');

          doc.text(row['Bus No.'] || '-', 60, currentY, { width: 70 });
          doc.text(row['Route Id'] || '-', 140, currentY, { width: 60 });
          doc.text(row['Expected Start Time'] || '-', 200, currentY, { width: 100 });
          doc.text(row['Offenses'] || '-', 310, currentY, { width: 160, height: 20, ellipsis: true });
          doc.text(row['Fine (LKR)'] || '0', 480, currentY);
          
          currentY += 20;
      });

      doc.end();

      stream.on('finish', () => {
          res.json({ 
              message: 'Analysis Complete', 
              url: `http://localhost:5000/reports/${reportName}` 
          });
      });

  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to generate Analysis Report' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
