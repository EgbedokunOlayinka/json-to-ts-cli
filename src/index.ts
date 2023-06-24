#!/usr/bin/env node

import inquirer from "inquirer";
import chalk from "chalk";
import { readFile } from "fs/promises";

const log = console.log;
const sleep = (ms = 1000) => new Promise((resolve) => setTimeout(resolve, ms));

enum SOURCE_ENUM {
  FILE = "In a file",
  PASTE = "Paste it here",
}

function validateString(value: string) {
  if (typeof value === "number") value = `${value}`;
  if (typeof value !== "string" || value.trim() === "") {
    return "Please enter a string value";
  }
  return true;
}

async function init() {
  log(chalk.blue("Welcome to json-to-ts"));
  await sleep(500);
  askForSource();
}

async function askForSource() {
  const answers = await inquirer.prompt({
    name: "json_source",
    type: "list",
    message: "Is your JSON data in a file or will you like to paste it here?",
    choices: [SOURCE_ENUM.FILE, SOURCE_ENUM.PASTE],
  });

  if (answers.json_source === SOURCE_ENUM.FILE) {
    return getJsonFromFileSource();
  }
  if (answers.json_source === SOURCE_ENUM.PASTE) {
    return getJsonFromConsolePaste();
  }
}

async function getJsonFromFileSource() {
  const answers = await inquirer.prompt({
    name: "json_file_source",
    type: "input",
    message: "Please input the path to your JSON file:",
    validate: (val) => validateString(val),
  });

  const fileSrc = `${process.cwd()}/${answers.json_file_source}`;
  const fileContent = await readFile(fileSrc, "utf-8");
  const formatted = JSON.parse(fileContent);
  console.log(formatted);
}

async function getJsonFromConsolePaste() {
  const answers = await inquirer.prompt({
    name: "json_console_paste",
    type: "input",
    message: "Please paste your JSON data here:",
    validate: (val) => validateString(val),
  });

  // const jsonContent = JSON.parse(answers.json_console_paste);
  console.log(answers.json_console_paste);
}

console.clear();
init();
