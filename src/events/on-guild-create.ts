import { Guild } from "discord.js";
import { GuildMongoHelper } from "../helpers/mongo-helper";

export async function onGuildCreate(guild: Guild): Promise<void> {
    await GuildMongoHelper.createOrGetDoc(guild).catch(e => { });
}