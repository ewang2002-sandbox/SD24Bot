import { User, Guild, MessageReaction, TextChannel, Collection, Message, MessageAttachment, MessageEmbed, GuildMember, MessageEmbedAuthor, ClientUser, GuildChannel } from "discord.js";
import { IGuildDoc } from "../templates/guild";
import { SDBot } from "../bot";

export module Starboard {
    interface IPossibleStars {
        starEmoji: string;
        min: number;
        max: number;
    }

	/**
	 * The gold color that will be used for the starboard.
	 */
    const STARBOARD_COLOR: number = 0xd4ae17;

	/**
	 * Possible stars.
	 */
    const POSSIBLE_STARS: IPossibleStars[] = [
        {
            starEmoji: "⭐",
            min: 1,
            max: 7
        },
        {
            starEmoji: "🌟",
            min: 8,
            max: 14,
        },
        {
            starEmoji: "✨",
            min: 15,
            max: 21,
        },
        {
            starEmoji: "🌠",
            min: 22,
            max: 28,
        },
        {
            starEmoji: "💫",
            min: 29,
            max: Number.MAX_VALUE
        }
    ];

	/**
	 * The function that should execute when a star is removed from a message.
	 * 
	 * @param {Guild} guild The guild where the event occurred.
	 * @param {User} user The user that reacted to the message. 
	 * @param {MessageReaction} reaction The reaction. This should have both the **resolved** reaction and message. 
	 * @param {IGuildDoc} gData The guild document.
	 */
    export async function removeStar(
        guild: Guild,
        user: User,
        reaction: MessageReaction,
        gData: IGuildDoc
    ): Promise<void> {
        const starboardChannel: TextChannel | null = guild.channels.cache.has(gData.starboard.starboardChannel)
            ? guild.channels.cache.get(gData.starboard.starboardChannel) as TextChannel
            : null;

        if (starboardChannel === null) {
            return;
        }

        // cant be in the same channel as the starboard channel
        // and cant be the same author
        if (reaction.message.channel.id === starboardChannel.id) {
            return;
        }

        if (user.id === reaction.message.author.id) {
            return;
        }

        const fetchedStarboardMessages: Collection<string, Message> = await starboardChannel.messages.fetch({
            limit: 100
        });

        const correspondingStarboardMessage: Message | undefined = fetchedStarboardMessages
            .filter(x => x.author.id === (SDBot.SD24Bot.user as ClientUser).id && x.embeds.length > 0)
            .find(y => y.embeds[0].footer !== null
                && typeof y.embeds[0].footer.text !== "undefined"
                && y.embeds[0].footer.text.endsWith(reaction.message.id));

        const allUsers: Collection<string, User> = await reaction.users.fetch();

        // make sure the message exists in the starboard 
        if (typeof correspondingStarboardMessage !== "undefined") {
            // amt of stars 
            const starboardEmbed: MessageEmbed = correspondingStarboardMessage.embeds[0];
            let reactionCount: number = allUsers
                .filter(x => x.id !== reaction.message.author.id).size;

            // see if we can delete starboard msg
            if (reactionCount < gData.starboard.minStarsRequired) {
                await correspondingStarboardMessage.delete().catch(() => { });
                return;
            }

            let starToUse: IPossibleStars = POSSIBLE_STARS.find(x => x.min <= reactionCount && x.max >= reactionCount) || POSSIBLE_STARS[0];
            const editStarMessage: MessageEmbed = new MessageEmbed()
                .setAuthor((starboardEmbed.author as MessageEmbedAuthor).name,
                    (starboardEmbed.author as MessageEmbedAuthor).iconURL,
                    (starboardEmbed.author as MessageEmbedAuthor).url)
                .setColor(STARBOARD_COLOR)
                .addField("Source", `[#${(reaction.message.channel as GuildChannel).name}](https://discordapp.com/channels/${guild.id}/${reaction.message.channel.id}/${reaction.message.id})`)
                .setFooter(`${starToUse.starEmoji} ${reactionCount} • ${reaction.message.id}`);
            if (typeof starboardEmbed.description !== "undefined") {
                editStarMessage.setDescription(starboardEmbed.description);
            }
            if (starboardEmbed.image !== null) {
                editStarMessage.setImage(starboardEmbed.image.url);
            }

            await correspondingStarboardMessage
                .edit(`${starToUse.starEmoji} ${reaction.message.channel}`, editStarMessage).catch(() => { });
        }
    }

	/**
	 * The function that should execute when a star is added to a message.
	 * 
	 * @param {Guild} guild The guild where the event occurred.
	 * @param {User} user The user that reacted to the message. 
	 * @param {MessageReaction} reaction The reaction. This should have both the **resolved** reaction and message. 
	 * @param {IGuildDoc} gData The guild doc.
	 */
    export async function addStar(guild: Guild, user: User, reaction: MessageReaction, gData: IGuildDoc): Promise<void> {
        if (gData.starboard.exemptChannel.includes(reaction.message.channel.id)) {
            return;
        }

        const starboardChannel: TextChannel | null = guild.channels.cache.has(gData.starboard.starboardChannel)
            ? guild.channels.cache.get(gData.starboard.starboardChannel) as TextChannel
            : null;

        if (starboardChannel === null) {
            return;
        }

        // cant be in the same channel as the starboard channel
        // and cant be the same author
        if (reaction.message.channel.id === starboardChannel.id) {
            return;
        }

        if (user.id === reaction.message.author.id) {
            user.send(`${user}, you cannot star your own message.`)
                .then(x => x.delete({ timeout: 5000 }))
                .catch(e => { });
            return;
        }

        const fetchedStarboardMessages: Collection<string, Message> = await starboardChannel.messages.fetch({
            limit: 100
        });

        const correspondingStarboardMessage: Message | undefined = fetchedStarboardMessages
            .filter(x => x.author.id === (SDBot.SD24Bot.user as ClientUser).id && x.embeds.length > 0)
            .find(y => y.embeds[0].footer !== null
                && typeof y.embeds[0].footer.text !== "undefined"
                && y.embeds[0].footer.text.endsWith(reaction.message.id));

        const allUsers: Collection<string, User> = await reaction.users.fetch();
        // message doesnt exist in starboard
        // let's make a new starboard msg for this one
        if (typeof correspondingStarboardMessage === "undefined") {
            let reactionCount: number = allUsers
                .filter(x => x.id !== reaction.message.author.id).size;
            let starToUse: IPossibleStars = POSSIBLE_STARS.find(x => x.min <= reactionCount && x.max >= reactionCount) || POSSIBLE_STARS[0];
            const image: string = getImageUrl(reaction.message.attachments);
            // no message, no picture. nothing worth
            if (image === "" && reaction.message.cleanContent.length === 0) {
                (reaction.message.channel as TextChannel).send(`${reaction.message.author}, this message cannot be starred.`)
                    .then(x => x.delete({ timeout: 5000 }))
                    .catch(e => { });
                return;
            }

            if (reactionCount >= gData.starboard.minStarsRequired) {
                const newStarMessage: MessageEmbed = new MessageEmbed()
                    .setAuthor(`${(reaction.message.member as GuildMember).displayName} • ${reaction.message.author.tag}`, reaction.message.author.displayAvatarURL())
                    .setColor(STARBOARD_COLOR)
                    .addField("Source", `[#${(reaction.message.channel as GuildChannel).name}](https://discordapp.com/channels/${guild.id}/${reaction.message.channel.id}/${reaction.message.id})`)
                    .setFooter(`${starToUse.starEmoji} ${reactionCount} • ${reaction.message.id}`);
                if (reaction.message.content.length !== 0) {
                    newStarMessage.setDescription(reaction.message.content);
                }
                if (image !== "") {
                    newStarMessage.setImage(image);
                }

                await starboardChannel
                    .send(`${starToUse.starEmoji} ${reaction.message.channel}`, newStarMessage).catch(() => { });
            }
        } // end if
        else {
            // amt of stars 
            let reactionCount: number = allUsers
                .filter(x => x.id !== reaction.message.author.id).size;

            const starboardEmbed: MessageEmbed = correspondingStarboardMessage.embeds[0];
            let starToUse: IPossibleStars = POSSIBLE_STARS.find(x => x.min <= reactionCount && x.max >= reactionCount) || POSSIBLE_STARS[0];

            const editStarMessage: MessageEmbed = new MessageEmbed()
                .setAuthor((starboardEmbed.author as MessageEmbedAuthor).name,
                    (starboardEmbed.author as MessageEmbedAuthor).iconURL,
                    (starboardEmbed.author as MessageEmbedAuthor).url)
                .setColor(STARBOARD_COLOR)
                .addField("Source", `[#${(reaction.message.channel as GuildChannel).name}](https://discordapp.com/channels/${guild.id}/${reaction.message.channel.id}/${reaction.message.id})`)
                .setFooter(`${starToUse.starEmoji} ${reactionCount} • ${reaction.message.id}`);
            if (typeof starboardEmbed.description !== "undefined") {
                editStarMessage.setDescription(starboardEmbed.description);
            }
            if (starboardEmbed.image !== null) {
                editStarMessage.setImage(starboardEmbed.image.url);
            }

            await correspondingStarboardMessage.edit(`${starToUse.starEmoji} ${reaction.message.channel}`, editStarMessage).catch(() => { });
        }
    }

	/**
	 * Gets the image from the attachment, if the attachment is an image.
	 * @param {Collection<string, MessageAttachment>} attachments The attachments to test.
	 * @returns {string} The resolved URL, if it exists. Otherwise, an empty string.
	 */
    function getImageUrl(attachments: Collection<string, MessageAttachment>): string {
        for (const [, attachment] of attachments) {
            const imageLink: string[] = attachment.url.split('.');
            const typeOfImage: string = imageLink[imageLink.length - 1];
            const image: boolean = /(jpg|jpeg|png|gif)/gi.test(typeOfImage);
            if (image) {
                return attachment.url;
            }
        }
        return "";
    }
}