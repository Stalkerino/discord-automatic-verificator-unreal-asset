import { DISCORD_REGEX, getDatabase, getPlugin, removeHTMLFormatting, writeNewUserValidated, writeUserWarning, setRoleToUser } from './helpers.js';
import { Client, GatewayIntentBits, Partials } from 'discord.js';
import axios from 'axios';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
let promises = [];
let commands;
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

client.on('messageCreate', (message => { // When a message is received, launch this

	if(message.author.bot) return; // Check if the message is not from a bot

	promises = [];
	commands = message.content.split("\n"); // Split the message by line, just in case

	console.log(`${message.author.username}#${message.author.discriminator} try to verify plugin ${commands[0]}`);
	
	if (commands.length === 1 && getPlugin(commands[0], config.pluginList) != null) { // Check all conditions are valid

		getDatabase().then((data) => {
			if (data != null) {
				const user = data.find(user => user.discord_id === message.author.id && user.url_plugin === commands[0]);
				if (user && user.discord !== `${message.author.username}#${message.author.discriminator}`) {
					console.log(`${message.author.username}#${message.author.discriminator} try to verify plugin ${commands[0]} with a different username`);
					writeUserWarning(`${message.author.username}#${message.author.discriminator}`, commands[0], message.author.id, 'changed UserName', 'N/A', 'N/A', 'N/A');
					return message.author.send(`You have already verified this plugin:\n${commands[0]} with a different username`);
				}
				writeUserWarning(`${message.author.username}#${message.author.discriminator}`, commands[0], message.author.id, 'Already verified', 'N/A', 'N/A', 'N/A');
				console.log(`${message.author.username}#${message.author.discriminator} Already verified : ${commands[0]}`);
				return message.author.send(`You have already verified this plugin:\n${commands[0]}`);
			}

			message.author.send(`Processing the verification for the user ${message.author.username}#${message.author.discriminator}\nPlease Wait...`);

				axios({
					method: 'get',
					url: getPlugin(commands[0], config.pluginList).url,
				})
				.then(function (response) {
					let numberOfRequestNeeded = Math.ceil(response.data.data.paging.total / 40);
					for (let i = 0; i < numberOfRequestNeeded; i++) {
						let request = getPlugin(commands[0], config.pluginList).url + `?start=${i * 40}&count=40&sortBy=CREATEDAT&sortDir=DESC`;
						promises.push(axios.get(request))
					}
					return Promise.all(promises);
				})
				.then((responses) => {
					let found = false;
					responses.forEach((promiseReviews) => {
						promiseReviews.data.data.elements.forEach((element) => {
						const match = DISCORD_REGEX.exec(removeHTMLFormatting(element.content));
							if (match != null && match[0] === `${message.author.username}#${message.author.discriminator}`) {
								found = true;
								let user = data.find(user => user.epicId === element.identityId && element.content !== user.originalContent);
								if (user) {
									console.log(`${message.author.username}#${message.author.discriminator} try to change review to gain access !!!!!!! ${commands[0]}`);
									writeUserWarning(`${message.author.username}#${message.author.discriminator}`, commands[0], message.author.id, 'changed discord in review to get access ?', element.identityId, element.content, user.originalContent);
									return message.author.send(`Reporting ill intent to author with discord id and discord name with epic account tied`);
								}
									writeNewUserValidated(match[0], commands[0], message.author.id, element.identityId, element.content);
									setRoleToUser(client, getPlugin(commands[0], config.pluginList).role, message);
									return message.author.send("Your Request is Acccepted\n Thank you");
							}
						})
					});
					if (!found) {
						writeUserWarning(`${message.author.username}#${message.author.discriminator}`, commands[0], message.author.id, 'No review found with Discord Id of user', 'N/A', 'N/A', 'N/A');
						console.log('Nothing found in the reviews ' + `${message.author.username}#${message.author.discriminator}`);
						return message.author.send("Nothing found in the reviews\n Please check your discord id in your review\n Thank you");
					}
				})
		});
	} else {
		return message.author.send("Nothing found with this URL, please check that you are using the good url\n Thank you")
		.then(() => {
			console.log(`${message.author.username}#${message.author.discriminator} failed to verify plugin ${commands[0]}`);
		});
	}
}));

