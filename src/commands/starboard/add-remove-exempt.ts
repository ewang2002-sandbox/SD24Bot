import { Command } from "../../templates/cmd";
import { Message, Guild, GuildChannel, MessageEmbed, TextChannel } from "discord.js";
import { IGuildDoc } from "../../templates/guild";
import { arrayToStringFields } from "../../helpers/array-to-string-fields";
import { GuildMongoHelper } from "../../helpers/mongo-helper";

export class AddRemoveStarboardExemptChannel extends Command {

    public constructor() {
        super(
            "Add/Remove Starboard Exempt Channel",
            ["addremovestarboardexemptchannel", "exemptchannel", "starboardexemptchannels"],
            ["addremovestarboardexemptchannel [Channel Mention | ID]"],
            ["addremovestarboardexemptchannel", "addremovestarboardexemptchannel #bot-channel"],
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
            .setTitle("Starboard ⇒ Exempt Channel")
            .setColor("RANDOM")
            .setAuthor(guild.name, typeof guild.iconURL() === "string" ? guild.iconURL() as string : undefined);

        if (args.length === 0) {
            if (guildDb.starboard.exemptChannel.length === 0) {
                embed.setDescription("There are no exempt channels at this time.")
                    .setFooter("0 Exempt Channels.")
                    .setColor("RED");

                msg.channel.send(embed)
                    .then(x => x.delete({ timeout: 5000 }))
                    .catch(e => { });
                return;
            }
            const fields: string[] = arrayToStringFields<string>(
                guildDb.starboard.exemptChannel,
                (i, elem): string => {
                    if (guild.channels.cache.has(elem)) {
                        return `**\`[${i + 1}]\`** ${(guild.channels.cache.get(elem) as GuildChannel).name}\n`;
                    }
                    return "";
                }
            )

            for (const field of fields) {
                embed.addField("Exempt Channels", field);
            }
            embed.setDescription(`There are currently ${guildDb.starboard.exemptChannel.length} exempt channels.`);
            msg.channel.send(embed)
                .catch(e => { });
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

            if (guildDb.starboard.exemptChannel.includes(resolvedChannel.id)) {
                await GuildMongoHelper.GuildCollection.updateOne({ guildId: guild.id }, {
                    $pull: {
                        "starboard.exemptChannel": resolvedChannel.id
                    }
                });
                embed.setDescription(`The channel, ${resolvedChannel}, has been removed from the exempt list; starred messages from this channel can now appear on the Starboard channel.`);
            }
            else {
                await GuildMongoHelper.GuildCollection.updateOne({ guildId: guild.id }, {
                    $push: {
                        "starboard.exemptChannel": resolvedChannel.id
                    }
                });
                embed.setDescription(`The channel, ${resolvedChannel}, has been added to the exempt list; starred messages from this channel will no longer appear on the Starboard channel.`);
            }
            
            msg.channel.send(embed)
                .then(x => x.delete({ timeout: 5000 }))
                .catch(e => { });
        }
    }
}