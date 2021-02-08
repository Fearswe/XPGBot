'use strict';
const Gamedig = require('gamedig');
const Discord = require('discord.js');
var config = require('./botconfig.json');

const commandRegex = /^\!(server|status|game)\ (?<game>.+)/i

const client = new Discord.Client();

client.on('ready', () => {
	console.log('I am ready!');
});

client.on("error", (error) => {
	console.log(error);
});

async function handleMessage(message) {
	try {
		let command = message.content.match(commandRegex);
		if (command !== null) {
			//console.log("Command parsed");
			if (Object.keys(config.servers).includes(command.groups.game.toLowerCase())) {
				//console.log("Game found");
				var tempMessage = await message.channel.send("Checking, gimme a sec...");
				let serverInfo = config.servers[command.groups.game.toLowerCase()];
				let query = {
					type: serverInfo.type,
					host: serverInfo.host,
					maxAttempts: 5
				}
				if (Object.keys(serverInfo).includes("port")) {
					query.port = serverInfo.port;
				}
				Gamedig.query(query).then((state) => {
					//console.log(state);
					try {
						let serverEmbed = new Discord.MessageEmbed()
							.setColor(serverInfo.embedcolor)
							.setTitle(state.name)
							.setDescription(`**Game:**\n${serverInfo.game}`)
							.addFields(
								{ name: "IP/Hostname", value: (state.connect.length > 0 ? state.connect : "N/A") },
								{ name: "Requires password", value: (state.password ? "Yes" : "No") },
								{ name: "Map", value: (state.map.length > 0 ? state.map : "N/A") },
								{ name: "Player count", value: `${state.players.length}/${state.maxplayers}` });
						if (state.players.length > 0) {
							let players = "";
							for (let i = 0; i < state.players.length; i++) {
								players += `${state.players[i].name}\n`;
							}
							players = players.trim();

							serverEmbed.addField("Online players", players);
						}
						tempMessage.delete();
						message.channel.send(serverEmbed);
					}
					catch (error) {
						console.log(error);
						console.log(state);
					}
				}).catch((error) => {
					console.log(error);
					message.channel.send("Either the server is offline or an error happened...");
				});
			}
			else {
				let notFoundEmbed = new Discord.MessageEmbed()
					.setColor("#FF0000")
					.setTitle("Oi stupid!")
					.setDescription(`I have no idea whatever the fuck "${command.groups.game}" means!`)
					.addField("List of known servers", Object.keys(config.servers).join("\n"));
				message.channel.send(notFoundEmbed);
			}
		}
	}
	catch (error) {
		console.log(error);
	}
}


client.on('message', handleMessage);

client.login(config.discord.token);