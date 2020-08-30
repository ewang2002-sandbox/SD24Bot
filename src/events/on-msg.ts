import { Message, ClientApplication, MessageEmbed, User, GuildMember } from "discord.js";
import { Command } from "../templates/cmd";
import { SDBot } from "../bot";
import { IGuildDoc } from "../templates/guild";
import { GuildMongoHelper } from "../helpers/mongo-helper";

export async function onMessageEvent(msg: Message): Promise<void> {
    // make sure we have a regular message to handle
    if (msg.type !== "DEFAULT" || msg.author.bot) {
        return;
    }

    msg.guild === null
        ? await commandHandler(msg)
        : await commandHandler(msg, await GuildMongoHelper.createOrGetDoc(msg.guild));
}

async function commandHandler(msg: Message, guildDb?: IGuildDoc): Promise<void> {
    let app: ClientApplication = await msg.client.fetchApplication();

    if (msg.webhookID !== null) {
        return; // no webhooks
    }

    if (msg.content.indexOf(SDBot.PREFIX) !== 0) {
        return;
    }

    let messageArray: string[] = msg.content.split(/ +/);
    let cmd: string = messageArray[0];
    let args: string[] = messageArray.slice(1);
    let commandfile: string = cmd.slice(SDBot.PREFIX.length);

    // make sure the command exists
    let command: Command | null = null;

    main: for (const [name, cmdArr] of SDBot.BOT_COMMANDS) {
        for (const cmd of cmdArr) {
            for (const cmdCaller of cmd.cmd) {
                if (commandfile.toLowerCase() === cmdCaller.toLowerCase()) {
                    command = cmd;
                    break main;
                }
            }
        }
    }

    if (command === null) {
        return;
    }

    const embed: MessageEmbed = new MessageEmbed()
        .setAuthor(msg.author.tag, msg.author.displayAvatarURL())
        .setColor("RED")
        .setFooter("SDBot");

    // let's do some checks
    if (command.botOwnerOnly && (app.owner as User).id !== msg.author.id) {
        embed.setTitle("**Bot Owner Command Only**")
            .setDescription("This command can only be used by the bot owner.");
        msg.channel.send(embed)
            .then(x => x.delete({ timeout: 5000 }))
            .catch(() => { });
        return;
    }

    // if the command is executed in dm
    if (msg.guild === null && command.guildOnly) {
        embed.setTitle("**Server Command Only**")
            .setDescription("This command only works in a server. Please try executing this command in a server.");
        msg.channel.send(embed)
            .then(x => x.delete({ timeout: 5000 }))
            .catch(() => { });
        return;
    }

    // if this command is executed in the server. 
    if (msg.guild !== null) {
        let canRunCommand: boolean = true;
        for (const perm of command.userPerms) {
            if (!(msg.member as GuildMember).permissions.has(perm)) {
                canRunCommand = false;
            }
        }

        if (!canRunCommand) {
            embed.setTitle("**Missing Permissions**")
                .setDescription("You are missing server permissions. Pleas try again later.");
            msg.channel.send(embed)
                .then(x => x.delete({ timeout: 5000 }))
                .catch(() => { });
            return;
        }
    }

    if (command.botPerms.length !== 0
        && msg.guild !== null
        && msg.guild.me !== null
        && !msg.guild.me.hasPermission("ADMINISTRATOR")) {
        let missingPermissions: string = "";
        for (let i = 0; i < command.botPerms.length; i++) {
            if (!msg.guild.me.hasPermission(command.botPerms[i])) {
                missingPermissions += command.botPerms[i] + ", ";
            }
        }

        if (missingPermissions.length !== 0) {
            missingPermissions = missingPermissions
                .split(", ")
                .map(x => x.trim())
                .filter(x => x.length !== 0)
                .join(", ");
            embed.setTitle("**Limited Bot Permissions**")
                .setDescription("The bot does not have the appropriate server permissions to execute this command.")
                .addFields([
                    {
                        name: "Permissions Required",
                        value: "```\n" + command.botPerms.join(", ") + "```"
                    },
                    {
                        name: "Permissions Missing",
                        value: "```\n" + missingPermissions + "```"
                    }
                ]);
            msg.channel.send(embed)
                .then(x => x.delete({ timeout: 5000 }))
                .catch(() => { });
            return;
        }
    }


    if (command.minArgs > args.length) {
        const usageEx: string = command.usage.join("\n");
        embed.setTitle("**Insufficient Arguments**")
            .setDescription("You did not provide the correct number of arguments.")
            .addFields([
                {
                    name: "Required",
                    value: "```\n" + command.minArgs.toString() + "```",
                    inline: true
                },
                {
                    name: "Provided",
                    value: "```\n" + args.length.toString() + "```",
                    inline: true
                },
                {
                    name: "Command Usage",
                    value: "```\n" + (usageEx.length === 0 ? "N/A" : usageEx) + "```"
                }
            ]);
        msg.channel.send(embed)
            .then(x => x.delete({ timeout: 5000 }))
            .catch(() => { });
        return;
    }

    await msg.delete().catch(() => { });
    command.execute(msg, args, guildDb);
}