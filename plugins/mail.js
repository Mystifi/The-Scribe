/*
 * mail.js: Offline messaging plugin
 *
 * Handles scheduling offline messages for users. When a user with mail joins a room the bot's in,
 * they will be sent all messages in PMs.
 */

const config = require('../config');
const storage = require('../storage');
const utils = require('../utils');

module.exports = {
	async onJoin(userid) {
		let inbox = storage.getJSON('mail')[userid];
		if (inbox) {
			for (let {sender, message, time} of inbox) {
				this.sendPM(userid, `[${utils.toDurationString(Date.now() - time)} ago] **${sender}**: ${message}`);
			}
			delete storage.getJSON('mail')[userid];
			storage.exportJSON('mail');
		}
	},
	commands: {
		async mail(userid, roomid, message) {
			let [target, toSend] = message.split(',').map(param => param.trim());
			target = utils.toId(target);
			if (!(target && toSend)) return this.sendPM(userid, `Syntax: \`\`${config.commandToken}mail user, message\`\``);
			if (toSend.length > 250) return this.sendPM(userid, `Your message is too long. (${toSend.length}/250)`);

			let inbox = storage.getJSON('mail')[userid] || [];
			if (inbox.length >= 5) return this.sendPM(userid, `${target}'s inbox is full.`);
			storage.getJSON('mail')[userid] = inbox.concat({sender: userid, message: toSend, time: Date.now()});
			storage.exportJSON('mail');

			return this.send(`Mail successfully scheduled for ${target}.`);
		},
	},
};
