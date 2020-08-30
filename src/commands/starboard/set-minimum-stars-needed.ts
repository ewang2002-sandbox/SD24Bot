import { Command } from "../../templates/cmd";
import { Message, Guild, MessageEmbed } from "discord.js";
import { IGuildDoc } from "../../templates/guild";
import { GuildMongoHelper } from "../../helpers/mongo-helper";

export class SetMinimumStarsNeeded extends Command {

    public constructor() {
        super(
            "Set Minimum Stars Needed",
            ["setminstars", "minstars"],
            ["setminstars [Amount]"],
            ["setminstars", "setminstars 2"],
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
            .setTitle("Starboard ⇒ Set Minimum Stars")
            .setColor("RANDOM")
            .setAuthor(guild.name, typeof guild.iconURL() === "string" ? guild.iconURL() as string : undefined);

        const joinedArgs: number = Number.parseInt(args.join(" ").trim());
        if (args.length === 0 || Number.isNaN(joinedArgs) || joinedArgs < 1 || joinedArgs > guild.members.cache.size) {
            embed.setDescription(`Needed Stars: ${guildDb.starboard.minStarsRequired}`);
        }
        else {
            await GuildMongoHelper.GuildCollection.updateOne({ guildId: guild.id }, {
                $set: {
                    "starboard.minStarsRequired": joinedArgs
                }
            });
            embed.setDescription(`In order for a message to appear on the starboard, the message must now have at least **${joinedArgs}** stars.`);
        }

        msg.channel.send(embed)
            .then(x => x.delete({ timeout: 5000 }))
            .catch(() => { });
    }
}