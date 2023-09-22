import YAML from "yaml"
import fs from "fs/promises"

export async function readInputFile(filepath) {
  const format = filepath.split('.').pop();
  const file = await fs.readFile(filepath, "utf-8");
  let input = {};
  if (format === "json") {
    input = JSON.parse(file);
  } else if (format === "yaml") {
    input = YAML.parse(file);
  }
  return input;
}
