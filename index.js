import fs from "fs";
import csv from "csv-parser";
import { createObjectCsvWriter } from "csv-writer";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const argv = yargs(hideBin(process.argv))
  .usage(
    "Usage: $0 --input <plane.csv> --output <linear.csv> [--config <config.json>]"
  )
  .option("input", {
    alias: "i",
    type: "string",
    describe: "Path to input Plane CSV file",
    demandOption: true,
  })
  .option("output", {
    alias: "o",
    type: "string",
    describe: "Path to output Linear CSV file",
    demandOption: true,
  })
  .option("config", {
    alias: "c",
    type: "string",
    describe: "Path to JSON config file for user email mappings",
    default: "config.json",
  })
  .help()
  .argv;

const inputPath = argv.input;
const outputPath = argv.output;
const configPath = argv.config;

let config = { users: {} };
if (fs.existsSync(configPath)) {
  try {
    const raw = fs.readFileSync(configPath, "utf-8");
    config = JSON.parse(raw);
  } catch (err) {
    console.error(`Error parsing config file at ${configPath}:`, err);
    process.exit(1);
  }
} else {
  console.warn(
    `Config file ${configPath} not found. Proceeding with empty user mappings.`
  );
}

const headerMap = {
  Name: "Title",
  Description: "Description",
  State: "Status",
  "Start Date": "Started",
  "Target Date": "Due Date",
  Priority: "Priority",
  "Created By": "Creator",
  Assignee: "Assignee",
  Labels: "Labels",
  "Cycle Name": "Cycle Name",
  "Cycle Start Date": "Cycle Start",
  "Cycle End Date": "Cycle End",
  "Created At": "Created",
  "Updated At": "Updated",
  "Completed At": "Completed",
  "Archived At": "Archived",
  Project: "Project",
};

const dateFields = new Set([
  "Start Date",
  "Target Date",
  "Cycle Start Date",
  "Cycle End Date",
  "Created At",
  "Updated At",
  "Completed At",
  "Archived At",
]);

const rows = [];

fs.createReadStream(inputPath)
  .pipe(csv())
  .on("data", (row) => {
    const newRow = {};
    for (const [oldKey, newKey] of Object.entries(headerMap)) {
      let val = row[oldKey] ?? "";
      if (dateFields.has(oldKey) && val) {
        const dt = new Date(val);
        if (!isNaN(dt.getTime())) {
          const dayOfWeek = days[dt.getUTCDay()];
          const month = months[dt.getUTCMonth()];
          const day = dt.getUTCDate().toString().padStart(2, '0');
          const year = dt.getUTCFullYear();
          const hours = dt.getUTCHours().toString().padStart(2, '0');
          const minutes = dt.getUTCMinutes().toString().padStart(2, '0');
          const seconds = dt.getUTCSeconds().toString().padStart(2, '0');
          val = `${dayOfWeek} ${month} ${day} ${year} ${hours}:${minutes}:${seconds} GMT+0000 (GMT)`;
        }
      }
      // Map usernames to emails for Creator and Assignee
      if ((oldKey === "Created By" || oldKey === "Assignee") && val) {
        val = config.users[val] || val;
      }
      newRow[newKey] = val;
    }
    rows.push(newRow);
  })
  .on("end", async () => {
    const csvWriter = createObjectCsvWriter({
      path: outputPath,
      header: Object.values(headerMap).map((h) => ({ id: h, title: h })),
    });
    try {
      await csvWriter.writeRecords(rows);
      console.log(`Successfully wrote ${rows.length} records to ${outputPath}`);
    } catch (err) {
      console.error("Error writing CSV:", err);
      process.exit(1);
    }
  })
  .on("error", (err) => {
    console.error("Error reading CSV:", err);
    process.exit(1);
  });
