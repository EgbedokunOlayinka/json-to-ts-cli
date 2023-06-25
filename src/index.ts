#!/usr/bin/env node

import inquirer from "inquirer";
import chalk from "chalk";
import { readFile, writeFile, access } from "fs/promises";
import { constants } from "fs";
import JsonToTS from "json-to-ts";

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

async function validateFilePath(filePath: string) {
  // =========TODO=======
  // ALSO CHECK IF FILE IS A JSON FILE
  // CHECK IF INPUT IS A DIRECTORY AND NOTE A FILE
  if (filePath.trim() === "") return true;
  try {
    filePath = filePath.startsWith("/") ? filePath.replace("/", "") : filePath;
    await access(filePath, constants.F_OK);
    return true;
  } catch (error) {
    return "Please enter a valid file path";
  }
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
    validate: async (val) => await validateFilePath(val),
  });

  const fileSrc = `${process.cwd()}/${answers.json_file_source}`;
  const fileContent = await readFile(fileSrc, "utf-8");
  const parsedFileContent = JSON.parse(fileContent);
  const interfaces = parseJsonToTs(parsedFileContent);

  await printTsToFilePath(interfaces);
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

function parseJsonToTs(jsonContent: string) {
  let interfaces = [];
  JsonToTS(jsonContent).forEach((typeInterface) => {
    interfaces.push(typeInterface);
  });
  return interfaces;
}

async function printTsToFilePath(interfaces: string[]) {
  const chosenPath = await inquirer.prompt({
    name: "json_path",
    type: "input",
    message:
      "Please input the path to where you want the TS file to be pasted (leave empty if you want it in the project root):",
    validate: async (val) => await validateFilePath(val),
  });

  await writeFile(`${process.cwd()}/${chosenPath.json_path}/types.ts`, interfaces.join("\n"));
  // await writeFile(`${process.cwd()}/src/type.ts`, interfaces.join("\n"));
}

console.clear();
init();
