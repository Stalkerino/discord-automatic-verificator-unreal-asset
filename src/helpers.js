import he from 'he';
import { Low } from 'lowdb';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSONFile } from 'lowdb/node';

const __dirname = dirname(fileURLToPath(import.meta.url)); // Get the current directory
const file = join(__dirname, '../db.json'); // Get the database file
const adapter = new JSONFile(file); // Create the adaptater for connection to the database
const db = new Low(adapter); // Create the database

export const DISCORD_REGEX = /\b(?:[a-zA-Z0-9_\!-\~]{2,32}#\d{4})\b/; // Regex to check if the discord username is valid

export async function getDatabase() { // Get the database
  await db.read();
  return db.data.verifiedUsers;
}

export async function writeNewUserValidated(discordName, pluginUrl, discordId, epicId, originalContent) { // Write the new user in the database
  await db.read()
  db.data ||= { verifiedUsers: [], warning: [] }
  const { verifiedUsers } = db.data;
  verifiedUsers.push({discord: discordName, discord_id: discordId, url_plugin: pluginUrl, epicId: epicId, originalContent: originalContent});
  await db.write();
}

export async function writeUserWarning(discordName, pluginUrl, discordId, reason, epicId, content, databaseContent) { // Write the new user in the database
  await db.read()
  db.data ||= { verifiedUsers: [], warning: [] }
  const { warning } = db.data;
  warning.push({discord: discordName, discord_id: discordId, url_plugin: pluginUrl, reason: reason, epicId: epicId, newContent: content, databaseContent: databaseContent});
  await db.write();
}

export function getPlugin(pluginUrl, pluginList) {
  const plugin = pluginList.find(element => element.plugin === pluginUrl);
  return plugin;
}

export function removeHTMLFormatting(str) {
  return he.decode(stripHtmlTags(str));
}

function stripHtmlTags(html) {
  return html.replace(/<[^>]*>/g, "");
}

export async function setRoleToUser(client, role, message) {
  const Guilds = client.guilds.cache.map(guild => guild.id);
  await client.guilds.cache.get(Guilds[0]).members.fetch(message.author.id);
}