import { Message, EmojiResolvable, Emoji, MessageCollector, TextChannel, DMChannel, ReactionCollector, MessageReaction, User, Collection } from "discord.js";
import { reactFaster } from "./fast-react";
import { time } from "console";

export module CollectorManager {
    export interface IOptionalArgs {
        time?: number;
        removeAllEmojisAfter?: boolean;
    }

    export async function getEmoji(
        botMsg: Message,
        origMsg: Message,
        emojis: EmojiResolvable[],
        optArgs: IOptionalArgs = {}
    ): Promise<Emoji | "-cancel"> {
        return new Promise(async (resolve) => {
            const time: number = typeof optArgs.time === "undefined" ? 5 * 60 * 1000 : optArgs.time;
            const removeAllEmojisAfter: boolean = typeof optArgs.removeAllEmojisAfter === "undefined" ? true : optArgs.removeAllEmojisAfter;

            reactFaster(origMsg, emojis);

            const reactCollector: ReactionCollector = new ReactionCollector(
                botMsg,
                (r: MessageReaction, u: User): boolean => emojis.includes(r.emoji.name) && u.id === origMsg.author.id,
                {
                    time: time,
                    max: 1
                }
            );

            reactCollector.on("collect", async (react: MessageReaction, user: User) => {
                if (!removeAllEmojisAfter)
                    await react.users.remove(user).catch(e => { });

                return resolve(react.emoji);
            });

            reactCollector.on("end", (collected: Collection<string, MessageReaction>, reason: string) => {
                if (removeAllEmojisAfter)
                    botMsg.reactions.removeAll().catch(e => { });

                if (reason === "time") {
                    return resolve("-cancel");
                }
            });
        });
    }

    export async function getEitherEmojiOrString(
        botMsg: Message,
        origMsg: Message,
        emojis: EmojiResolvable[],
        optArgs: IOptionalArgs = {}
    ): Promise<string | Emoji> {
        return new Promise(async (resolve) => {
            const time: number = typeof optArgs.time === "undefined" ? 5 * 60 * 1000 : optArgs.time;
            const removeAllEmojisAfter: boolean = typeof optArgs.removeAllEmojisAfter === "undefined" ? true : optArgs.removeAllEmojisAfter;

            reactFaster(origMsg, emojis);

            const msgCollector: MessageCollector = new MessageCollector(
                origMsg.channel as TextChannel | DMChannel,
                (m: Message) => m.author.id === origMsg.author.id,
                {
                    time: time
                }
            );

            const reactCollector: ReactionCollector = new ReactionCollector(
                botMsg,
                (r: MessageReaction, u: User): boolean => emojis.includes(r.emoji.name) && u.id === origMsg.author.id,
                {
                    time: time,
                    max: 1
                }
            );

            msgCollector.on("collect", (inMsg: Message) => {
                inMsg.delete().catch(e => { });
                if (inMsg.content === "")
                    return;
                reactCollector.stop("user_ended");
                msgCollector.stop("user_ended");
                return resolve(inMsg.content);
            });

            reactCollector.on("collect", async (react: MessageReaction, user: User) => {
                if (!removeAllEmojisAfter)
                    await react.users.remove(user).catch(e => { });
                msgCollector.stop("user_ended");
                return resolve(react.emoji);
            });

            msgCollector.on("end", (collected: Collection<string, Message>, reason: string) => {
                if (reason === "time") {
                    return resolve("-cancel");
                }
            });

            reactCollector.on("end", (collected: Collection<string, MessageReaction>, reason: string) => {
                if (removeAllEmojisAfter)
                    botMsg.reactions.removeAll().catch(e => { });
                if (reason === "time") {
                    return resolve("-cancel");
                }
            });
        });
    }
}