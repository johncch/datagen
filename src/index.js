import { program } from 'commander';
import { createQueryBuilder } from './queryBuilder.js';
import { OpenAIEngine } from './openai.js';
import { parseRole } from './role.js';
import { readInputFile } from './file.js';
import fs from "fs/promises"


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

const options = program.opts();

let configFile = {};
if (options.input) {
  configFile = await readInputFile(options.input);
}

options.roles = configFile.roles ?? await parseRole(options.role);
options.format = configFile.format ?? options.format;
options.prompt = configFile.prompt ?? options.prompt;
options.number = Math.max(parseInt(configFile.number ?? options.number) ?? 1, 1);
options.verbose && console.log(`Options: ${JSON.stringify(options)}`);

let builder = createQueryBuilder(options.roles, options.format, options.prompt);

const requests = [];
const ongoingRequests = [];
for (let idx = 1; idx <= options.number; idx++) {
  const p = new Promise(async (resolve) => {
    options.verbose && console.log(`Starting iteration ${idx}`);
    const messages = builder.compile();
    let reply = {};
    if (!options.dryRun) {
      try {
        reply = await OpenAIEngine.execute(messages)
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
        filename += `-${idx}`;
      }
      filename += "." + fileParts[fileParts.length - 1]
      if (!options.dryRun) {
        await fs.writeFile(filename, reply);
      } else {
        console.log(`Dry run: will write to ${filename}`)
      }
    } else {
      if (!options.dryRun) {
        console.log(reply.content);
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

Promise.all(requests).then(() => console.log("Done"))
