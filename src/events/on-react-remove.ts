import { MessageReaction, User, Message, Guild, PartialUser, TextChannel } from "discord.js";
import { IGuildDoc } from "../templates/guild";
import { GuildMongoHelper } from "../helpers/mongo-helper";
import { Starboard } from "../helpers/starboard";

export async function onMessageReactionRemove(reaction: MessageReaction, user: User | PartialUser): Promise<void> {
    try {
        if (reaction.partial) {
            let fetchedReaction: MessageReaction | void = await reaction.fetch().catch(e => { });
            if (typeof fetchedReaction === "undefined") {
                return;
            }
            reaction = fetchedReaction;
        }

        if (reaction.message.partial) {
            let fetchedMessage: Message | void = await reaction.message.fetch().catch(e => { });
            if (typeof fetchedMessage === "undefined") {
                return;
            }
            reaction.message = fetchedMessage;
        }

        user = await user.fetch();
    }
    catch (e) {
        console.error(`[${new Date()}] Message Reaction Add`);
        console.error(e);
        return;
    }

    if (reaction.message.guild === null || reaction.message.type !== "DEFAULT") {
        return;
    }

    // no stars allowed from nsfw
    if (reaction.message.channel instanceof TextChannel && reaction.message.channel.nsfw) {
        return;
    }

    const gData: IGuildDoc = await GuildMongoHelper.createOrGetDoc(reaction.message.guild.id);

    if (reaction.emoji.name === "⭐") {
        Starboard.removeStar(reaction.message.guild as Guild, user, reaction, gData).catch(e => { });
        return;
    }

    // might do more stuff later 
}