import { SDBot } from "../bot";
import { GuildMongoHelper } from "../helpers/mongo-helper";

export async function onReady(): Promise<void> {
    for await (const [id, guild] of SDBot.SD24Bot.guilds.cache) {
        await GuildMongoHelper.createOrGetDoc(guild);
    }

    console.log(`Ready @ ${new Date()}`);
}