import { Message, EmojiResolvable } from "discord.js";

export function reactFaster(msg: Message, reactions: EmojiResolvable[], intervalTime: number = 550): void {
    let i: number = 0;
    const interval: NodeJS.Timeout = setInterval(() => {
        // think of this as a for loop
        // for (let i = 0; i < reactions.length; i++)
        if (i < reactions.length) {
            if (msg.deleted) {
                clearInterval(interval);
                return;
            }

            msg.react(reactions[i]).catch(() => { });
        }
        else {
            clearInterval(interval);
        }
        i++;
    }, intervalTime);
}