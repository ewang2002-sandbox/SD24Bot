import { Client, Collection, Message } from "discord.js";
import { Command } from "./templates/cmd";
import { GetCapeData } from "./commands/Cape/get-cape-data";
import { onReady } from "./events/on-ready";
import { onMessageEvent } from "./events/on-msg";

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
        return this;
    }

    public loadCommands(): SDBot {
        if (this._loadedCmds)
            return this;
        this._loadedCmds = true;
        // CAPE commands
        SDBot.BOT_COMMANDS.set("CAPE", [new GetCapeData()]);
        return this;
    }

    /**
     * Logs into the bot
     */
    public async login(): Promise<void> {
        try {
            await SDBot.SD24Bot.login(this._token);
        }
        catch (e) {
            throw new Error(e);
        }
    }
}