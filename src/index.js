import { program } from 'commander';
import { createQueryBuilder } from './queryBuilder.js';
import { OpenAIEngine } from './openai.js';
import { getRole } from './role.js';
import { readInputFile } from './file.js';
import fs from "fs/promises"


program
  .option("-r, --role <role>", "Role of the agent", "default")
  .option("-p, --prompt <prompt>", "Prompt to use", "Say hello to the world")
  .option("-n, --number <number>", "Number of times to generate the prompt", "1")
  .option("-i, --input <input prompt>", "File for input prompt")
  .option("-o, --output <output file>", "File for output prompt")
  .option("--dry-run", "Do not execute the command")

program.parse();

const options = program.opts();

// Define the inputs
const inputFile = options.input
if (!!inputFile) {
  const data = await readInputFile(inputFile);
  options.format = data.format ?? options.format;
  options.prompt = data.prompt ?? options.prompt;
}

const role = await getRole(options.role);
const format = options.format;
const prompt = options.prompt;

// The main execution loop
let builder = createQueryBuilder(role, format, prompt);

console.log(options)

if (!options.dryRun) {
  builder = await OpenAIEngine.execute(builder)
  const msg = builder.getMessages();

  // Output the result
  const output = options.output;
  if (output) {
    await fs.writeFile(output, msg[msg.length - 1].content);
  } else {
    console.log(msg[msg.length - 1].content);
  }
}


console.log(builder.getMessages());
console.log("complete");
