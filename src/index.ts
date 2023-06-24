#!/usr/bin/env node

import inquirer from "inquirer";
import chalk from "chalk";

const log = console.log;

function init() {
  log("Welcome to json-to-ts");
  log(chalk.blue("Hello") + " World" + chalk.red("!"));
}

console.clear();
init();
