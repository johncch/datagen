import { program } from 'commander';
import { createQueryBuilder } from './queryBuilder.js';
import { OpenAIEngine } from './openai.js';
import { parseRole } from './role.js';
import { readInputFile } from './file.js';
import fs from "fs/promises";
import chalk from 'chalk';

program
  .option("-r, --role <role>", "Role of the agent", "default")
  .option("-p, --prompt <prompt>", "Prompt to use", "Say hello to the world")
  .option("-n, --number <number>", "Number of times to generate the prompt", 1)
  .option("-i, --input <input prompt>", "File for input prompt")
  .option("-o, --output <output file>", "File for output prompt")
  .option("--dry-run", "Do not execute the command")
  .option("--verbose", "Print out the options", false)
  .option("-b, --batch-size <batch-size>", "The number of concurrent requests", 5)

program.parse();

console.log(`${chalk.blue("==>")} ${chalk.whiteBright.bold("Starting datagen")}`)
const options = program.opts();

let configFile = {};
if (options.input) {
  configFile = await readInputFile(options.input);
}

options.roles = configFile.roles ?? await parseRole(options.role);
options.format = configFile.format ?? options.format;
options.prompt = configFile.prompt ?? options.prompt;
options.number = Math.max(parseInt(configFile.number ?? options.number) ?? 1, 1);
if (options.verbose) {
  console.log(`${chalk.yellow("==>")} ${chalk.whiteBright.bold("Options")}:`)
  console.log(`${JSON.stringify(options, null, 2)}`);
  console.log();
}

let builder = createQueryBuilder(options.roles, options.format, options.prompt);

const requests = [];
const ongoingRequests = [];
const stats = { in: 0, out: 0 };
for (let idx = 1; idx <= options.number; idx++) {
  const p = new Promise(async (resolve) => {
    if (options.verbose) {
      console.log(`${chalk.yellow("==>")} ${chalk.whiteBright.bold(`Starting iteration ${idx}`)}`)
    }
    const messages = builder.compile();
    let reply = {};
    if (!options.dryRun) {
      try {
        reply = await OpenAIEngine.execute(messages, stats)
      } catch (e) {
        reject();
      }

    } else {
      console.log(`Dry run: will execute ${JSON.stringify(messages)} on ${OpenAIEngine.engine()}`)
    }

    // Output the result
    const output = options.output;
    if (output) {
      const fileParts = output.split(".");
      let filename = fileParts.slice(0, fileParts.length - 1).join(".");
      if (options.number > 1) {
        filename += `- ${idx}`;
      }
      filename += "." + fileParts[fileParts.length - 1]
      if (!options.dryRun) {
        await fs.writeFile(filename, reply);
      } else {
        console.log(`Dry run: will write to ${filename}`)
      }
    } else {
      if (!options.dryRun) {
        console.log();
        console.log(`${chalk.blue("==>")} ${chalk.whiteBright.bold(`Output for iteration ${idx}`)}:`)
        console.log(reply);
      }
    }
    resolve();
  })
  requests.push(p);
  ongoingRequests.push(p);
  if (ongoingRequests.length >= options.batchSize) {
    await Promise.all(ongoingRequests);
    ongoingRequests.length = 0;
  }
}

Promise.all(requests).then(() => {
  console.log();
  console.log(`${chalk.blue("==>")} ${chalk.whiteBright.bold("Completion")}:`)
  console.log(`Input tokens: ${stats.in} `)
  console.log(`Output tokens: ${stats.out} `)
})
