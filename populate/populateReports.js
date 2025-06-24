const mongoose = require('mongoose');
const Dumpster = require("../src/models/dumpsters.model");
const Report = require("../src/models/report.model");
const parseConfig = require('../src/utils/config');



const reporterIds = ["6832f4f564953f51f4f609b2", "683c65a6ec3ea3a3e6e29627", "683c65afec3ea3a3e6e2962b", "683c65c0ec3ea3a3e6e2962f"];
const categories = ["household", "paper", "plastic", "glass", "metal", "electronics", "batteries", "organic", "textiles", "construction"];
const issues = ["overflowing", "illegal_materials", "bad_odors", "safety_harzards", "vandalized"];
const resolutionDetailsSamples = [
    "Issue resolved by sanitation team.",
    "Dumpster cleaned and restored to service.",
    "Materials removed and site disinfected.",
    "Hazardous materials properly disposed.",
    "Structural damage fixed and sealed."
];

const resolvedBy = "683c3c18af8b8a5af29bf9d6";

function randomFromArray(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

async function PopulateReports(count = 50) {
    const dumpsters = await Dumpster.find({});
    if (!dumpsters.length) {
        console.error("No dumpsters found. Populate them first.");
        return process.exit(1);
    }

    const reports = [];

    for (let i = 0; i < count; i++) {
        const reporterId = randomFromArray(reporterIds);
        const dumpster = randomFromArray(dumpsters);
        const category = dumpster.dumpsterType || randomFromArray(categories);
        const issue = randomFromArray(issues);
        const status = Math.random() < 0.9 ? 'resolved' : 'rejected';
        const resolutionDetails = randomFromArray(resolutionDetailsSamples);

        reports.push({
            reporterId,
            dumpsterId: dumpster._id,
            category,
            issue,
            status,
            resolvedBy,
            resolutionDetails,
            createdAt: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 30), // random in last 30 days
            updatedAt: new Date()
        });
    }

    try {
        await Report.insertMany(reports);
        console.log(`Inserted ${reports.length} reports.`);
    } catch (err) {
        console.error('Error inserting reports:', err);
    } finally {
        mongoose.connection.close();
    }
}

async function main() {
    const config = await parseConfig('./config/dev.json')

    await mongoose.connect(
    config.database.uri,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
    PopulateReports(1); 
}

main()