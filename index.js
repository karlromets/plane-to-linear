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
      let originalValue = row[oldKey];
      let processedValue = originalValue ?? "";

      if (dateFields.has(oldKey)) {
        if (
          originalValue &&
          typeof originalValue === "string" &&
          originalValue.trim() !== ""
        ) {
          const dt = new Date(originalValue);
          if (!isNaN(dt.getTime())) {
            const dayOfWeek = days[dt.getUTCDay()];
            const month = months[dt.getUTCMonth()];
            const day = dt.getUTCDate().toString().padStart(2, "0");
            const year = dt.getUTCFullYear();
            const hours = dt.getUTCHours().toString().padStart(2, "0");
            const minutes = dt.getUTCMinutes().toString().padStart(2, "0");
            const seconds = dt.getUTCSeconds().toString().padStart(2, "0");
            processedValue = `${dayOfWeek} ${month} ${day} ${year} ${hours}:${minutes}:${seconds} GMT+0000 (GMT)`;
          } else {
            console.warn(
              `Warning: Invalid date value for field "${oldKey}" ("${originalValue}") in input. Setting to empty. Input row: ${JSON.stringify(
                row
              )}`
            );
            processedValue = ""; // Set to empty if original date is invalid
          }
        } else {
          processedValue = ""; // Ensure empty string if original value was empty, null, or not a processable string
        }
      } else if (
        (oldKey === "Created By" || oldKey === "Assignee") &&
        processedValue
      ) {
        // Map usernames to emails for Creator and Assignee
        processedValue = config.users[processedValue] || processedValue;
      }
      newRow[newKey] = processedValue;
    }

    // Check if "Completed At" is before "Created At"
    const createdStr = newRow[headerMap["Created At"]];
    const completedStr = newRow[headerMap["Completed At"]];

    if (createdStr && completedStr) {
      // Both dates are present and were validly formatted
      const createdDate = new Date(createdStr);
      const completedDate = new Date(completedStr);

      // Ensure dates were parsed correctly from the formatted strings
      if (!isNaN(createdDate.getTime()) && !isNaN(completedDate.getTime())) {
        if (completedDate < createdDate) {
          console.warn(
            `[\x1b[33mWARNING\x1b[0m] Record has "Completed At" (${
              completedStr || "N/A"
            }) before "Created At" (${
              createdStr || "N/A"
            }).\nAs fallback, replacing the two dates. Clearing "Completed At" for this record.\n Input row:\n${JSON.stringify(
              row
            , null, 2)}\n`
          );
          newRow[headerMap["Completed At"]] = ""; // Clear the "Completed" date in the output row
        }
      } else {
        // This case should ideally not be reached if date processing correctly formats or empties date strings.
        console.warn(
          `Warning: Could not re-parse formatted Created/Completed dates for comparison. Input row: ${JSON.stringify(
            row
          )}`
        );
      }
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
