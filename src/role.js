import * as fs from 'fs/promises';

let roles = null;

export async function getRole(role) {
  if (roles) {
    return roles[role]
  }

  const file = await fs.readFile("./presets/roles.json");
  roles = JSON.parse(file);
  return roles[role]
}
