import { DISCORD_REGEX, getDatabase, getPlugin, removeHTMLFormatting, writeNewUserValidated, writeUserWarning, setRoleToUser } from './helpers.js';
import { Client, GatewayIntentBits, Partials } from 'discord.js';
import axios from 'axios';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
let config;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
fs.readFile(__dirname + '/../config.json', 'utf8', (err, data) => {
	if (err) throw err;
	config = JSON.parse(data);
	client.login(config.token);
});

const client = new Client({ // Discord Client Setup, only direct messages allowed
	partials: [
		Partials.Channel,
		Partials.Message,
		Partials.GuildMember,
	],
	intents: [
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.DirectMessageTyping,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.Guilds,
	]
});

client.on('ready', () => { // When the bot is ready, launch this
	console.log('Verificator Enabled : ' + client.user.tag);
	client.user.setPresence({
		activities: [{
			name: "Verifying plugin"
		}]
	})
});

client.on('messageCreate', async message => {
	if (message.author.bot) return;
  
	const commands = message.content.split("\n");
	if (commands.length !== 1) return message.author.send("Please provide a single plugin URL at a time");
  
	const plugin = getPlugin(commands[0], config.pluginList);
	if (!plugin) return message.author.send("Nothing found with this URL, please check that you are using the correct URL");
  
	console.log(`${message.author.username}#${message.author.discriminator} is trying to verify plugin ${plugin.name}`);
  
	const data = await getDatabase();
	if (!data) return message.author.send(`Processing the verification for the user ${message.author.username}#${message.author.discriminator}\nPlease wait...`);
  
	const user = data.find(user => user.discord_id === message.author.id && user.url_plugin === commands[0]);
	if (user && user.discord !== `${message.author.username}#${message.author.discriminator}`) {
	  console.log(`${message.author.username}#${message.author.discriminator} is trying to verify plugin ${plugin.name} with a different username`);
	  writeUserWarning(`${message.author.username}#${message.author.discriminator}`, commands[0], message.author.id, 'changed UserName', 'N/A', 'N/A', 'N/A');
	  return message.author.send(`You have already verified this plugin:\n${commands[0]} with a different username`);
	}
	
	if (user && user.discord == `${message.author.username}#${message.author.discriminator}`) {
		return message.author.send(`You have already verified this plugin:\n${commands[0]}`);  
	}
  
	const response = await axios.get(plugin.url);
	const reviews = response.data.data.elements;
	const userReview = reviews.find(review => {
	  const match = DISCORD_REGEX.exec(removeHTMLFormatting(review.content));
	  return match != null && match[0] === `${message.author.username}#${message.author.discriminator}`;
	});
  
	if (!userReview) {
	  writeUserWarning(`${message.author.username}#${message.author.discriminator}`, commands[0], message.author.id, 'No review found with Discord Id of user', 'N/A', 'N/A', 'N/A');
	  console.log(`No review found in plugin ${plugin.name} for ${message.author.username}#${message.author.discriminator}`);
	  return message.author.send("Nothing found in the reviews\nPlease check that your Discord ID is correctly set in your review\nThank you");
	}
  
	if (userReview.identityId) {
	  const existingUser = data.find(user => user.epicId === userReview.identityId && user.originalContent !== userReview.content);
	  if (existingUser) {
		console.log(`${message.author.username}#${message.author.discriminator} is trying to change their review to gain access to ${plugin.name}`);
		writeUserWarning(`${message.author.username}#${message.author.discriminator}`, commands[0], message.author.id, 'changed discord in review to get access ?', userReview.identityId, userReview.content, existingUser.originalContent);
		return message.author.send(`Reporting ill intent to author with Discord ID and Epic account tied`);
	  }
  
	  writeNewUserValidated(`${message.author.username}#${message.author.discriminator}`, commands[0], message.author.id, userReview.identityId, userReview.content);
	  setRoleToUser(client, plugin.role, message);
	  return message.author.send("Your request has been accepted.\nThank you!");
	}
  
	return message.author.send("Unable to verify user identity. Please ensure that your Epic Games account is linked to your Discord account and try again.\nThank you.");
});

