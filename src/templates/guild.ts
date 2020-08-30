export interface IGuildDoc {
    guildId: string; 
    starboard: {
        exemptChannel: string[];
        minStarsRequired: number; 
        starboardChannel: string;
    };
}