#!/usr/bin/env node

import inquirer from "inquirer";
import chalk from "chalk";
import { readFile, writeFile, access, stat, appendFile } from "fs/promises";
import { constants } from "fs";
import JsonToTS from "json-to-ts";
import { extname } from "path";

const log = console.log;
const sleep = (ms = 1000) => new Promise((resolve) => setTimeout(resolve, ms));

enum SOURCE_ENUM {
  FILE = "In a file",
  PASTE = "Paste it here",
}

enum FILE_ENUM {
  NEW = "New file",
  EXISTING = "Existing file",
}

const stripSlash = (value: string) => (value.startsWith("/") ? value.replace("/", "") : value);
const isFileExtensionCorrect = (filePath: string, fileExt: string) =>
  extname(filePath).toLowerCase() === `.${fileExt}`;

function validateString(value: string) {
  if (typeof value === "number") value = `${value}`;
  if (typeof value !== "string" || value.trim() === "") {
    return "Please enter a string value";
  }
  return true;
}

async function validateFilePath(filePath: string, fileExt: string) {
  try {
    filePath = stripSlash(filePath);
    if (!isFileExtensionCorrect(filePath, fileExt))
      return `Please enter a valid ${fileExt} file path`;
    await access(filePath, constants.F_OK);
    return true;
  } catch (error) {
    return `Please enter a valid ${fileExt} file path`;
  }
}

async function validateFolderPath(folderPath: string) {
  if (folderPath.trim() === "") return true;
  try {
    folderPath = stripSlash(folderPath);
    const stats = await stat(folderPath);
    return stats.isDirectory();
  } catch (error) {
    return "Please enter a valid folder path";
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
    validate: async (val) => await validateFilePath(val, "json"),
  });
  const fileSrc = `${process.cwd()}/${answers.json_file_source}`;
  const fileContent = await readFile(fileSrc, "utf-8");
  const parsedFileContent = JSON.parse(fileContent);
  const interfaces = parseJsonToTs(parsedFileContent);
  await askForOutputSource(interfaces);
}

async function getJsonFromConsolePaste() {
  const answers = await inquirer.prompt({
    name: "json_console_paste",
    type: "editor",
    message: "Please paste your JSON data here:",
    validate: (val) => validateString(val),
  });
  const parsedFileContent = JSON.parse(answers.json_console_paste);
  const interfaces = parseJsonToTs(parsedFileContent);
  await askForOutputSource(interfaces);
}

function parseJsonToTs(jsonContent: string) {
  let interfaces = [];
  JsonToTS(jsonContent).forEach((typeInterface) => {
    interfaces.push(typeInterface);
  });
  return interfaces;
}

async function askForOutputSource(interfaces: string[]) {
  const answers = await inquirer.prompt({
    name: "json_source",
    type: "list",
    message: "Do you want the result to be printed to a file or to the console?",
    choices: [SOURCE_ENUM.FILE, SOURCE_ENUM.PASTE],
  });

  if (answers.json_source === SOURCE_ENUM.FILE) {
    return printTsToFilePath(interfaces);
  }
  if (answers.json_source === SOURCE_ENUM.PASTE) {
    return printTsToConsole(interfaces);
  }
}

function printTsToConsole(interfaces: string[]) {
  return log(chalk.green.bold(interfaces.join("\n")));
}

async function printTsToFilePath(interfaces: string[]) {
  const answers = await inquirer.prompt({
    name: "json_source",
    type: "list",
    message: "Do you want to print the result to a new file or an existing file?",
    choices: [FILE_ENUM.NEW, FILE_ENUM.EXISTING],
  });

  if (answers.json_source === FILE_ENUM.NEW) {
    return printTsToNewFile(interfaces);
  }
  if (answers.json_source === FILE_ENUM.EXISTING) {
    return printTsToExistingFile(interfaces);
  }
}

async function printTsToNewFile(interfaces: string[]) {
  const chosenPath = await inquirer.prompt({
    name: "json_path",
    type: "input",
    message:
      "Please input the path to where you want the TS file to be created (leave empty if you want it in the project root):",
    validate: async (val) => await validateFolderPath(val),
  });

  await writeFile(`${process.cwd()}/${chosenPath.json_path}/types.ts`, interfaces.join("\n"));
  log(chalk.green.bold("File created successfully"));
}

async function printTsToExistingFile(interfaces: string[]) {
  const chosenPath = await inquirer.prompt({
    name: "json_path",
    type: "input",
    message: "Please input the path to the file where you want the result to be printed",
    validate: async (val) => await validateFilePath(val, "ts"),
  });

  await appendFile(`${process.cwd()}/${chosenPath.json_path}`, `\n${interfaces.join("\n")}`);
  log(chalk.green.bold("Data conversion successful"));
}

console.clear();
init();
