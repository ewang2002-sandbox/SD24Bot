import { PermissionResolvable, Message } from "discord.js";
import { IGuildDoc } from "./guild";

export abstract class Command {
    public fullName: string;
    public cmd: string[];
    public usage: string[];
    public examples: string[];
    public userPerms: PermissionResolvable[];
    public botPerms: PermissionResolvable[];
    public guildOnly: boolean;
    public botOwnerOnly: boolean;
    public minArgs: number;

    /**
     * Command.
     * @param fullName The name of the command (e.g. "Help Command")
     * @param cmd Possible ways to call the command.
     * @param usage Use of command.
     * @param examples Examples.
     * @param userPerms Any perms the general user must have.
     * @param botPerms Any perms the bot must have.
     * @param guildOnly Whether this command can only be used in the guild.
     * @param botOwnerOnly Whether this command can only be used by the bot owner.
     * @param minArgs Minimum args needed
     */
    public constructor(
        fullName: string,
        cmd: string[],
        usage: string[],
        examples: string[],
        userPerms: PermissionResolvable[],
        botPerms: PermissionResolvable[],
        guildOnly: boolean,
        botOwnerOnly: boolean,
        minArgs: number
    ) {
        this.fullName = fullName;
        this.cmd = cmd;
        this.usage = usage;
        this.examples = examples;
        this.userPerms = userPerms;
        this.botPerms = botPerms;
        this.guildOnly = guildOnly;
        this.botOwnerOnly = botOwnerOnly;  
        this.minArgs = minArgs;
    }

    /**
     * Executes the command.
     * @param msg The message.
     * @param args The arguments.
     */
    public abstract async execute(msg: Message, args: string[], guildDb?: IGuildDoc): Promise<void>;
}