const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { parse } = require('json2csv');
const Report = require('../models/report.model');
const Dumpster = require('../models/dumpsters.model');

const REPORT_FOLDER = './reports';

function readState() {
    try {
        return JSON.parse(fs.readFileSync('./reportState.json'));
    } catch {
        return { daily: null, weekly: null, monthly: null };
    }
}

function writeState(state) {
    fs.writeFileSync('./reportState.json', JSON.stringify(state, null, 2));
}

function shouldRun(type, lastDate) {
    const now = new Date();
    if (!lastDate) return true;

    const last = new Date(lastDate);
    if (type === 'daily') return now.toDateString() !== last.toDateString();
    if (type === 'weekly') return now.getWeekNumber() !== last.getWeekNumber();
    if (type === 'monthly') return now.getMonth() !== last.getMonth();
    return false;
}

Date.prototype.getWeekNumber = function () {
    const d = new Date(Date.UTC(this.getFullYear(), this.getMonth(), this.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

async function generateReport(type) {
    const state = readState();
    if (!shouldRun(type, state[type])) return;

    const now = new Date();
    const start = new Date(now);

    if (type === 'daily') start.setDate(now.getDate() - 1);
    if (type === 'weekly') start.setDate(now.getDate() - 7);
    if (type === 'monthly') start.setMonth(now.getMonth() - 1);

    const reports = await Report.aggregate([
        { $match: { createdAt: { $gte: start } } },
        {
            $lookup: {
                from: 'dumpsters',
                localField: 'dumpsterId',
                foreignField: '_id',
                as: 'dumpsterInfo'
            }
        },
        { $unwind: '$dumpsterInfo' },
        {
            $group: {
                _id: '$dumpsterInfo.neighborhood',
                totalReports: { $sum: 1 },
                pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
                overflowing: { $sum: { $cond: [{ $eq: ['$issue', 'overflowing'] }, 1, 0] } },
                badOdors: { $sum: { $cond: [{ $eq: ['$issue', 'bad_odors'] }, 1, 0] } },
                categories: { $push: '$category' }
            }
        }
    ]);

    const enriched = reports.map(r => {
        const cleanlinessScore = r.totalReports
            ? 100 - ((r.pending + r.overflowing + r.badOdors) / r.totalReports) * 100
            : 100;

        const recyclingSimulator = simulateRecycling(r.categories);

        return {
            neighborhood: r._id,
            ...r,
            cleanlinessScore: cleanlinessScore.toFixed(1),
            recyclingImpact: recyclingSimulator
        };
    });

    enriched.sort((a, b) => a.cleanlinessScore - b.cleanlinessScore);

    const filename = `${type}-${now.toISOString().split('T')[0]}`;
    const outDir = path.join(REPORT_FOLDER, type);
    fs.mkdirSync(outDir, { recursive: true });

    // HTML
    const html = makeHtmlReport(enriched, type, now);
    fs.writeFileSync(`${outDir}/${filename}.html`, html);

    // CSV
    const csv = parse(enriched);
    fs.writeFileSync(`${outDir}/${filename}.csv`, csv);

    // PDF
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html);
    await page.pdf({ path: `${outDir}/${filename}.pdf`, format: 'A4' });
    await browser.close();

    state[type] = now.toISOString();
    writeState(state);
}

function simulateRecycling(categories) {
    const weights = {
        paper: 2.3, plastic: 1.1, metal: 3.4, glass: 2.5, electronics: 5.0,
        batteries: 1.5, organic: 4.0, textiles: 1.2, construction: 10.0, household: 2.0
    };
    const total = {};
    categories.forEach(c => {
        total[c] = (total[c] || 0) + weights[c];
    });
    return total;
}

function makeHtmlReport(data, type, date) {
    const rows = data.map(d => `
      <tr>
        <td>${d.neighborhood}</td>
        <td>${d.totalReports}</td>
        <td>${d.cleanlinessScore}</td>
        <td>${Object.entries(d.recyclingImpact).map(([k,v]) => `${k}: ${v.toFixed(1)}kg`).join(', ')}</td>
      </tr>`).join('');
    return `
    <html><head><style>
    table, th, td { border: 1px solid black; border-collapse: collapse; padding: 4px; }
    </style></head><body>
    <h2>${type.charAt(0).toUpperCase() + type.slice(1)} Report – ${date.toDateString()}</h2>
    <table>
      <thead>
        <tr><th>Neighborhood</th><th>Total Reports</th><th>Score</th><th>Recycling Impact</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    </body></html>`;
}

module.exports = async function runReports() {
    await generateReport('daily');
    await generateReport('weekly');
    await generateReport('monthly');
};
