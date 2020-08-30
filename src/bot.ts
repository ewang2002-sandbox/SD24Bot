import { Client, Collection, Message, MessageReaction, User, PartialUser, Guild } from "discord.js";
import { Command } from "./templates/cmd";
import { GetCapeData } from "./commands/cape/get-cape-data";
import { onReady } from "./events/on-ready";
import { onMessageEvent } from "./events/on-msg";
import { MongoClient } from "mongodb";
import { MongoHelper } from "./helpers/mongo-helper";
import { SetStarboardChannel } from "./commands/starboard/set-starboard-channel";
import { AddRemoveStarboardExemptChannel } from "./commands/starboard/add-remove-exempt";
import { SetMinimumStarsNeeded } from "./commands/starboard/set-minimum-stars-needed";
import { onMessageReactionAdd } from "./events/on-react-add";
import { onMessageReactionRemove } from "./events/on-react-remove";
import { onError } from "./events/on-error";
import { onGuildCreate } from "./events/on-guild-create";

export class SDBot {
    public static readonly SD24Bot: Client = new Client({
        partials: [
            "MESSAGE",
            "CHANNEL",
            "REACTION"
        ],
        restTimeOffset: 350
    });

    public static PREFIX: string;
    public static BOT_COMMANDS: Collection<string, Command[]> = new Collection<string, Command[]>();
    private _loadedCmds: boolean = false;
    private readonly _token: string;

    /**
     * The constructor for this class.
     */
    public constructor() {
        const token: string | undefined = process.env["TOKEN"];
        const prefix: string | undefined = process.env["PREFIX"];        

        if (typeof token === "undefined")
            throw new Error("no token found in .env");

        SDBot.PREFIX = typeof prefix === "undefined"
            ? ";"
            : prefix;
        this._token = token;
    }

    public loadEvents(): SDBot {
        SDBot.SD24Bot.on("ready", () => onReady());
        SDBot.SD24Bot.on("message", async (msg: Message) => await onMessageEvent(msg));
        SDBot.SD24Bot.on("messageReactionAdd", async (r: MessageReaction, u: User | PartialUser) => await onMessageReactionAdd(r, u));
        SDBot.SD24Bot.on("messageReactionRemove", async (r: MessageReaction, u: User | PartialUser) => await onMessageReactionRemove(r, u));
        SDBot.SD24Bot.on("error", (e: Error) => onError(e));
        SDBot.SD24Bot.on("guildCreate", async (g: Guild) => await onGuildCreate(g));
        return this;
    }

    public loadCommands(): SDBot {
        if (this._loadedCmds)
            return this;
        this._loadedCmds = true;
        // CAPE commands
        SDBot.BOT_COMMANDS.set("CAPE", [new GetCapeData()]);
        // starboard config
        SDBot.BOT_COMMANDS.set("Starboard Configuration", [new SetStarboardChannel(), new AddRemoveStarboardExemptChannel(), new SetMinimumStarsNeeded()])
        return this;
    }

    /**
     * Logs into the bot
     */
    public async login(): Promise<void> {
        try {
            const dbUrl: string | undefined = process.env["CONNECTION_URL"];
            const dbName: string | undefined = process.env["DB_NAME"];
            const guildCollectionName: string | undefined = process.env["GUILD_COLLECTION_NAME"];
    
            if (typeof dbUrl === "undefined" || typeof dbName === "undefined" || typeof guildCollectionName === "undefined") {
                throw new ReferenceError("invalid config found.");
            }

            await MongoHelper.connect(dbUrl, dbName, guildCollectionName);
            
            await SDBot.SD24Bot.login(this._token);
        }
        catch (e) {
            throw new Error(e);
        }
    }
}