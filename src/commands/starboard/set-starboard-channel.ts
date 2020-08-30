import { Command } from "../../templates/cmd";
import { Message, Guild, GuildChannel, MessageEmbed, TextChannel } from "discord.js";
import { IGuildDoc } from "../../templates/guild";
import { arrayToStringFields } from "../../helpers/array-to-string-fields";
import { GuildMongoHelper } from "../../helpers/mongo-helper";

export class SetStarboardChannel extends Command {

    public constructor() {
        super(
            "Set Starboard Channel",
            ["setstarboardchannel", "setsbchannel"],
            ["setstarboardchannel [Channel Mention | ID]"],
            ["setstarboardchannel", "setstarboardchannel #starboard"],
            ["MANAGE_CHANNELS", "MANAGE_ROLES", "MANAGE_MESSAGES"],
            ["MANAGE_MESSAGES"],
            true,
            false,
            0
        );
    }

    public async execute(msg: Message, args: string[], guildDb: IGuildDoc): Promise<void> {
        const guild: Guild = msg.guild as Guild;

        guildDb = await GuildMongoHelper.cleanOldChannels(guild, guildDb.starboard.exemptChannel);
        const embed: MessageEmbed = new MessageEmbed()
            .setTitle("Starboard ⇒ Set Channel")
            .setColor("RANDOM")
            .setAuthor(guild.name, typeof guild.iconURL() === "string" ? guild.iconURL() as string : undefined);

        if (args.length === 0) {
            const channel: GuildChannel | undefined = guild.channels.cache.get(guildDb.starboard.starboardChannel);
            embed.setDescription(`Current Channel: ${typeof channel !== "undefined" ? channel : "Not Set"}`);
        }
        else {
            const argJoined: string = args.join(" ");
            let resolvedChannel: TextChannel | undefined;
            if (msg.mentions.channels.size > 0) {
                resolvedChannel = msg.mentions.channels.first() as TextChannel;
            }
            else if (guild.channels.cache.has(argJoined)
                && (guild.channels.cache.get(argJoined) as GuildChannel).type === "text") {
                resolvedChannel = guild.channels.cache.get(argJoined) as TextChannel;
            }

            if (typeof resolvedChannel === "undefined") {
                embed.setDescription(`Your channel input of \`${argJoined}\` is invalid. Input a channel ID or mention the channel.`);
                msg.channel.send(embed)
                    .then(x => x.delete({ timeout: 5000 }))
                    .catch(e => { });
                return;
            }

            await GuildMongoHelper.GuildCollection.updateOne({ guildId: guild.id }, {
                $set: {
                    "starboard.starboardChannel": resolvedChannel.id
                }
            });
            embed.setDescription(`${resolvedChannel} is now the starboard channel. Make sure members aren't able to send messages or react in this channel.`);
        }

        msg.channel.send(embed)
            .then(x => x.delete({ timeout: 5000 }))
            .catch(e => { });
    }
}