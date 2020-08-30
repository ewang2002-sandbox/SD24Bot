import { Collection, InsertOneWriteOpResult, WithId, DeleteWriteOpResultObject, MongoClient } from "mongodb";
import { IGuildDoc } from "../templates/guild";
import { Guild } from "discord.js";

export module MongoHelper {
    export let MongoDbClient: MongoClient;
    /**
     * Connects to the Mongo database. 
     * @param {string} dbUrl The db url.
     * @param {string} dbName The name of the database.
     * @param {string} guildCollectionName The name of the guild collection.
     */
    export async function connect(dbUrl: string, dbName: string, guildCollectionName: string): Promise<void> {
        MongoHelper.MongoDbClient = await new MongoClient(dbUrl, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        }).connect();

        GuildMongoHelper.GuildCollection = MongoHelper.MongoDbClient
            .db(dbName)
            .collection<IGuildDoc>(guildCollectionName);
    }
}

export module GuildMongoHelper {
    export let GuildCollection: Collection<IGuildDoc>;



    /**
     * Creates or gets a document. 
     * @param {(string | Guild)} guildId The guild or guild ID.
     * @returns {Promise<IGuildDoc>} The guild doc. 
     */
    export async function createOrGetDoc(guildId: Guild | string): Promise<IGuildDoc> {
        const docs: IGuildDoc[] = await findDoc(typeof guildId === "string" ? guildId : guildId.id);
        if (docs.length >= 1) {
            return docs[0];
        }

        const data: InsertOneWriteOpResult<WithId<IGuildDoc>> = await GuildCollection.insertOne({ 
            guildId: typeof guildId === "string" ? guildId : guildId.id,
            starboard: {
                exemptChannel: [],
                minStarsRequired: 3,
                starboardChannel: ""
            }
        });

        return data.ops[0];
    }

    /**
     * Finds one or more document. 
     * @param {(string | Guild)} guildId The guild or guild ID.
     * @returns {Promise<IGuildDoc[]>} An array of guild documents that have the ID, if at all. This array's length should be no more than 1. 
     */
    export async function findDoc(guildId: Guild | string): Promise<IGuildDoc[]> {
        return await GuildCollection.find({ 
            guildId: typeof guildId === "string" ? guildId : guildId.id 
        }).toArray();
    }

    /**
     * Deletes a document. 
     * @param {(string | Guild)} guildId The guild or guild ID.
     * @returns {Promise<boolean>} Whether the document was deleted or not.
     */
    export async function deleteDoc(guildId: Guild | string): Promise<boolean> {
        const result: DeleteWriteOpResultObject = await GuildCollection.deleteOne({ 
            guildId: typeof guildId === "string" ? guildId : guildId.id 
        });
        return typeof result.deletedCount !== "undefined" && result.deletedCount !== 0;
    }

    /**
     * Deletes any old channels from the database.
     * @param {Guild} guild The guild.
     * @param {string[]} channels The channels.
     * @returns {Promise<IGuildDoc>} The updated guild doc.
     */
    export async function cleanOldChannels(guild: Guild, channels: string[]): Promise<IGuildDoc> {
        const deadChannelIds: string[] = [];
        for (const channel of channels) {
            if (!guild.channels.cache.has(channel)) {
                deadChannelIds.push(channel);
            }
        }

        return (await GuildCollection.findOneAndUpdate({ guildId: guild.id }, {
            $pull: {
                "starboard.exemptChannel": {
                    $in: deadChannelIds
                }
            }
        }, { returnOriginal: false })).value as IGuildDoc;
    }
}