// TODO make more concise 
import { Command } from "../../templates/cmd";
import { Message, MessageEmbed, EmojiResolvable, Emoji, Collection } from "discord.js";
import { parseArguments } from "../../helpers/args-parser";
import { ISubject } from "../../types/subject";
import { CollectorManager } from "../../helpers/collector-manager";
import { ICapeRow, ICape } from "../../types/cape";
import { arrayToStringFields } from "../../helpers/array-to-string-fields";
import { SDBot } from "../../bot";
// json files are weird
const capeList: ICape = require("../../constants/cape.json");
const subjectList: ISubject[] = require("../../constants/subject.json");

interface ICapeInput {
    instructor: string;
    subject: string;
    course: string;
    viewType: ViewType;
    showRaw: boolean;
}

type ViewType = "ALL"
    | "SPECIAL"

export class GetCapeData extends Command {
    private _reactions: EmojiResolvable[] = [
        "1⃣",
        "2⃣",
        "3⃣",
        "4⃣",
        "5⃣",
        "6⃣",
        "7⃣",
        "8⃣",
        "9⃣",
        "🔟"
    ];

    public constructor() {
        super(
            "Get Cape Data",
            ["getcape", "cape"],
            ["getcape", "getcape [-instructor (-i) Instructor Name (First Last)] [-subject (-s) Subject] [-course (-c) Course Number (DEPTXXX)] [-view (-v) 1 | 2] [-nomenu (-n)] [-raw (-r)]"],
            ["getcape", "getcape -instructor Swanson -course MATH 109", "getcape -subject MATH -instructor Stevens -v 1", "getcape -c CSE 11 -subject CSE"],
            [],
            ["MANAGE_MESSAGES"],
            true,
            false,
            0
        );
    }

    public async execute(msg: Message, args: string[]): Promise<void> {
        let skipIfValid: boolean = false;
        let capeInput: ICapeInput = { instructor: "", subject: "", course: "", viewType: "SPECIAL", showRaw: false };
        for (const arg of parseArguments(args)) {
            const argName: string = arg.argName.toLowerCase();
            if ((argName === "s" || argName === "subject")
                && arg.argVal.length !== 0) {
                capeInput.subject = this.cleanSubjectInput(arg.argVal.join(" "));
            }
            else if ((argName === "i" || argName === "instructor") && arg.argVal.length !== 0) {
                capeInput.instructor = this.cleanInstructorName(arg.argVal.join(" "));
            }
            else if ((argName === "c" || argName === "course") && arg.argVal.length !== 0) {
                capeInput.course = this.cleanCourseNumber(arg.argVal.join(" "));
            }
            else if ((argName === "v" || argName === "view") && arg.argVal.length !== 0) {
                const type: string = arg.argVal[0].toLowerCase();
                if (type === "all" || type === "1") capeInput.viewType = "ALL";
                else if (type === "spe" || type === "2") capeInput.viewType = "SPECIAL";
            }
            else if ((argName === "n" || argName === "nomenu") && (capeInput.course !== "" || capeInput.instructor !== "")) {
                skipIfValid = true;
            }
            else if ((argName === "r" || argName === "raw")) {
                capeInput.showRaw = true;
            }
        }

        if (!skipIfValid) {
            const configResult: ICapeInput | "-cancel" = await this.configSettings(msg, capeInput);
            if (configResult === "-cancel") {
                return;
            }
            capeInput = configResult;
        }
        // time to search :)
        let results: ICapeRow[] = [];
        const list: ICape = capeList as ICape;
        if (capeInput.subject !== "") {
            const subjectCapes: ICapeRow[] = (capeList as ICape)[capeInput.subject];
            for (const cape of subjectCapes) {
                if (capeInput.course !== "" && capeInput.instructor === "") {
                    if (capeInput.course === cape.CourseNumber) {
                        results.push(cape);
                    }
                }
                else if (capeInput.instructor !== "" && capeInput.course === "") {
                    if (cape.Instructor.toLowerCase().includes(capeInput.instructor.toLowerCase())
                        || capeInput.instructor.toLowerCase().includes(cape.Instructor.toLowerCase())) {
                        results.push(cape);
                    }
                }
                else {
                    if ((cape.Instructor.toLowerCase().includes(capeInput.instructor.toLowerCase())
                        || capeInput.instructor.toLowerCase().includes(cape.Instructor.toLowerCase())) && capeInput.course === cape.CourseNumber) {
                        results.push(cape);
                    }
                }
            }
        }
        else {
            for (const subject in list) {
                for (const cape of list[subject]) {
                    if (capeInput.course !== "" && capeInput.instructor === "") {
                        if (capeInput.course === cape.CourseNumber) {
                            results.push(cape);
                        }
                    }
                    else if (capeInput.instructor !== "" && capeInput.course === "") {
                        if (cape.Instructor.toLowerCase().includes(capeInput.instructor.toLowerCase())
                            || capeInput.instructor.toLowerCase().includes(cape.Instructor.toLowerCase())) {
                            results.push(cape);
                        }
                    }
                    else {
                        if ((cape.Instructor.toLowerCase().includes(capeInput.instructor.toLowerCase())
                            || capeInput.instructor.toLowerCase().includes(cape.Instructor.toLowerCase())) && capeInput.course === cape.CourseNumber) {
                            results.push(cape);
                        }
                    }
                }
            }
        }

        const returnEmbed: MessageEmbed = new MessageEmbed()
            .setTitle("CAPE Search Results")
            .setDescription(`__Specified Criteria__\n⇒ **Instructor:** \`${capeInput.instructor === "" ? "N/A" : capeInput.instructor}\`\n⇒ **Course:** \`${capeInput.course === "" ? "N/A" : capeInput.course}\`\n⇒ **Subject:** \`${capeInput.subject === "" ? "N/A" : capeInput.subject}\``);

        if (results.length === 0) {
            returnEmbed.setColor("RED")
                .setFooter(`${results.length} CAPEs Found.`);
            await msg.channel.send(returnEmbed).catch(console.error);
            return;
        }

        // time to go through the data
        if (capeInput.viewType === "ALL") {
            const fields: string[] = arrayToStringFields<ICapeRow>(
                results,
                (i, elem) => `**\`[${i + 1}]\`** ${elem.CourseNumber} (${elem.Term})\n⇒ ${elem.Instructor}\n⇒ Evals/Enrolled: ${elem.EvalsMade}/${elem.Enrolled}\n⇒ Recmd Class: ${elem.RecommendClass}%\n⇒ Recmd Instructor: ${elem.RecommendInstructor}%\n⇒ Study Hours/Week: ${elem.StudyHrsWk}\n⇒ Average GPA Expected: ${elem.AverageGradeExpected}\n⇒ Average GPA Received: ${elem.AverageGradeReceived}\n\n`
            );

            returnEmbed.setColor("GREEN")
                .setFooter(`${results.length} CAPEs Found.`);

            for (const field of fields) {
                if (returnEmbed.length + field.length + 15 <= 5900) {
                    returnEmbed.addField("CAPE Results", field, true);
                }
                else {
                    break;
                }
            }
            await msg.channel.send(returnEmbed).catch(console.error);
            return;
        }

        // make copy of array 
        // then go through and start filtering 
        // from the copy
        let specificResults: ICapeRow[] = Array.from(results);

        let instructors: string[] = results
            .map(x => x.Instructor);
        instructors = instructors
            .filter((item, index, self) => self.indexOf(item) === index);

        let courses: string[] = results
            .map(x => x.CourseNumber);
        courses = courses
            .filter((item, index, self) => self.indexOf(item) === index);

        if (instructors.length > 9 || courses.length > 9) {
            returnEmbed.setColor("RED")
                .setFooter("Error")
                .addField("Error: Too Many Results", `There are too many professors or courses to show. Please make your search criteria more specific. For your convenience, you can use this command to bring the previous menu up.${"```\n" + this.generateCommand(capeInput) + "```"}`)
                .addField("All Possible Courses", courses.length === 0 ? "N/A" : courses.join(", "))
                .addField("All Possible Instructors", instructors.length === 0 ? "N/A" : instructors.join("\n"));

            await msg.channel.send(returnEmbed).catch(console.error);
            return;
        }

        // select a course.
        const selectCourse: string = await this.selectOne(
            msg,
            courses,
            "React to the emoji that corresponds to the course that you want to select.",
            "Course"
        );

        if (selectCourse === "") {
            return;
        }

        specificResults = specificResults
            .filter(x => x.CourseNumber === selectCourse);

        // we assume that each professor here has taught at least
        // course defined by "capeInput.course"
        const selectInstructor: string = await this.selectOne(
            msg,
            instructors,
            "React to the emoji that corresponds to the instructor that you want to select.",
            "Instructor"
        );

        if (selectInstructor === "") {
            return;
        }

        // specificResults should only have stats about a professor
        // teaching one specific course
        specificResults = specificResults
            .filter(x => x.Instructor === selectInstructor);

        const displayEmbed: MessageEmbed = new MessageEmbed()
            .setTitle("CAPE Search Results")
            .setDescription(`__Specified Criteria__\n⇒ **Instructor:** \`${capeInput.instructor === "" ? "N/A" : capeInput.instructor}\`\n⇒ **Course:** \`${capeInput.course === "" ? "N/A" : capeInput.course}\`\n⇒ **Subject:** \`${capeInput.subject === "" ? "N/A" : capeInput.subject}\`\n\n__Search Result__\n⇒ **Instructor:** \`${selectInstructor}\`\n⇒ **Course:** \`${selectCourse}\`\n⇒ **Specific CAPEs:** \`${specificResults.length}\`\n⇒ **Evaluations:** \`${specificResults.map(x => x.EvalsMade).reduce((a, b) => a + b, 0)}\`\n\n__Associated Command__${"```\n" + this.generateCommand(capeInput) + "```"}`)
            .setFooter("DISCLAIMER: What you see above may not be entirely accurate and is intended solely as a guide. Please use CAPE or Seascape (https://seascape.app/) to confirm the data shown above.")
            .setColor(0x000080);

        const rcmdProf: [number, number] = this.getAverageAndStd(
            specificResults.filter(x => x.RecommendInstructor !== -1),
            "RecommendInstructor"
        );
        const rcmdClass: [number, number] = this.getAverageAndStd(
            specificResults.filter(x => x.RecommendClass !== -1),
            "RecommendClass"
        );
        const avgStudyHrs: [number, number] = this.getAverageAndStd(
            specificResults.filter(x => x.StudyHrsWk !== -1),
            "StudyHrsWk"
        );
        const avgGpaExpected: [number, number] = this.getAverageAndStd(
            specificResults.filter(x => x.AverageGradeExpected !== -1),
            "AverageGradeExpected"
        );
        const avgGpaReceived: [number, number] = this.getAverageAndStd(
            specificResults.filter(x => x.AverageGradeReceived !== -1),
            "AverageGradeReceived"
        );

        // get averages from other professors in the same class
        const otherProfSameCourse: ICapeRow[] = Object.values(list)
            .flat()
            .filter(x => x.CourseNumber === selectCourse);
        const dataOtherProf: Collection<string, [number, number, number, number, number]> = new Collection<string, [number, number, number, number, number]>();

        for (const data of otherProfSameCourse) {
            if (!dataOtherProf.has(data.Instructor)) {
                dataOtherProf.set(data.Instructor, [
                    this.getAverageAndStd(
                        otherProfSameCourse.filter(x => x.Instructor === data.Instructor && x.RecommendInstructor !== -1),
                        "RecommendInstructor"
                    )[0],
                    this.getAverageAndStd(
                        otherProfSameCourse.filter(x => x.Instructor === data.Instructor && x.RecommendClass !== -1),
                        "RecommendClass"
                    )[0],
                    this.getAverageAndStd(
                        otherProfSameCourse.filter(x => x.Instructor === data.Instructor && x.StudyHrsWk !== -1),
                        "StudyHrsWk"
                    )[0],
                    this.getAverageAndStd(
                        otherProfSameCourse.filter(x => x.Instructor === data.Instructor && x.AverageGradeExpected !== -1),
                        "AverageGradeExpected"
                    )[0],
                    this.getAverageAndStd(
                        otherProfSameCourse.filter(x => x.Instructor === data.Instructor && x.AverageGradeReceived !== -1),
                        "AverageGradeReceived"
                    )[0]
                ]);
            }
        }

        // "```\n" + () + "```"

        // get rankings
        // start with prof rankings
        const rankProf: string = this.getRankString(dataOtherProf, selectInstructor, 0);
        const rankClass: string = this.getRankString(dataOtherProf, selectInstructor, 1);
        const rankHrWk: string = this.getRankString(dataOtherProf, selectInstructor, 2);
        const avgGpaExp: string = this.getRankString(dataOtherProf, selectInstructor, 3);
        const avgGpaRec: string = this.getRankString(dataOtherProf, selectInstructor, 4);

        displayEmbed.addField("Recommend Professor", "```\n" + (`${rcmdProf[0].toFixed(3)}%`) + "```", true)
            .addField("Recommend Class", "```\n" + (`${rcmdClass[0].toFixed(3)}%`) + "```", true)
            .addField("Average Study Hours", "```\n" + (`${avgStudyHrs[0].toFixed(3)} Hrs/Week`) + "```")
            .addField("Average GPA Expected", "```\n" + (avgGpaExpected[0].toFixed(3)) + "```", true)
            .addField("Average GPA Received", "```\n" + (avgGpaReceived[0].toFixed(3)) + "```", true)
            .addField("Recommended Professor Rank", "```\n" + (rankProf) + "```")
            .addField("Recommended Class Rank", "```\n" + (rankClass) + "```")
            .addField("Average Study Hours/Week Rank", "```\n" + (rankHrWk) + "```")
            .addField("Average GPA Expected Rank", "```\n" + (avgGpaExp) + "```")
            .addField("Average GPA Received Rank", "```\n" + (avgGpaRec) + "```");
        if (capeInput.showRaw) {
            displayEmbed
                .addField("Raw Rcmd. Prof.", "```\n" + (`${specificResults.map(x => `${x.Term} ${x.RecommendInstructor.toFixed(2)}% (${x.EvalsMade})`).join("\n")}`) + "```", true)
                .addField("Raw Rcmd. Clas.", "```\n" + (`${specificResults.map(x => `${x.Term} ${x.RecommendClass.toFixed(2)}% (${x.EvalsMade})`).join("\n")}`) + "```", true)
                .addField("Raw Study Hr/Wk.", "```\n" + (`${specificResults.map(x => `${x.Term} ${x.StudyHrsWk.toFixed(2)} (${x.EvalsMade}/${x.Enrolled})`).join("\n")}`) + "```", true)
                .addField("Raw GPA Expected", "```\n" + (`${specificResults.map(x => `${x.Term} ${x.AverageGradeExpected.toFixed(2)} (${x.EvalsMade}/${x.Enrolled})`).join("\n")}`) + "```", true)
                .addField("Raw GPA Received", "```\n" + (`${specificResults.map(x => `${x.Term} ${x.AverageGradeReceived.toFixed(2)} (${x.EvalsMade}/${x.Enrolled})`).join("\n")}`) + "```", true);
        }

        msg.channel.send(displayEmbed).catch(e => { });
    }

    private getRankString(dataOtherProf: Collection<string, [number, number, number, number, number]>, selectInstructor: string, index: number): string {
        const ending: string = index >= 2
            ? ""
            : "%";
        dataOtherProf.sort(index === 2
            ? (a, b) => a[index] - b[index]
            : (a, b) => b[index] - a[index]);
        const rankArrProf: [string, [number, number, number, number, number]][] = Array.from(dataOtherProf);
        const profRank: number = rankArrProf.findIndex(x => x[0] === selectInstructor);
        let rankStrProf: string = "";
        if (rankArrProf.length > 3) {
            let profFoundInTop3: boolean = false;
            for (let i = 0; i < 3; i++) {
                if (rankArrProf[i][0] === selectInstructor)
                    profFoundInTop3 = true;
                rankStrProf += `[${i + 1}] ${rankArrProf[i][0]} (${rankArrProf[i][1][index].toFixed(2)}${ending}) ${rankArrProf[i][0] === selectInstructor ? "⭐" : ""}\n`;
            }

            if (profFoundInTop3) {
                rankStrProf += `[${rankArrProf.length}] ${rankArrProf[rankArrProf.length - 1][0]} (${rankArrProf[rankArrProf.length - 1][1][index].toFixed(2)}${ending})`;
            }
            else {
                rankStrProf += rankArrProf.length === profRank + 1
                    ? `[${rankArrProf.length}] ${rankArrProf[rankArrProf.length - 1][0]} (${rankArrProf[rankArrProf.length - 1][1][index].toFixed(2)}${ending}) ⭐`
                    : `[${profRank + 1}] ${rankArrProf[profRank][0]} (${rankArrProf[profRank][1][index].toFixed(2)}${ending}) ⭐ \n[${rankArrProf.length}] ${rankArrProf[rankArrProf.length - 1][0]} (${rankArrProf[rankArrProf.length - 1][1][index].toFixed(2)}${ending})`;
            }
        }
        else {
            for (let i = 0; i < rankArrProf.length; i++) {
                rankStrProf += `[${i + 1}] ${rankArrProf[i][0]} (${rankArrProf[i][1][index].toFixed(2)}${ending}) ${rankArrProf[i][0] === selectInstructor ? "⭐" : ""}\n`;
            }
        }

        return rankStrProf;
    }

    private getAverageAndStd(
        specificResults: ICapeRow[],
        // how to make this only accept props w/ number keys
        elem: keyof ICapeRow
    ): [number, number] {
        let avgRcmd: number = 0;
        let ttlEvalsMade: number = 0;

        const arrOfAllVals: number[] = [];
        for (const cape of specificResults) {
            avgRcmd += cape[elem] as number * cape.EvalsMade;
            ttlEvalsMade += cape.EvalsMade;
            for (let i = 0; i < cape.EvalsMade; i++) {
                arrOfAllVals.push(cape[elem] as number);
            }
        }

        const avg: number = avgRcmd / ttlEvalsMade;
        // finding std
        let val: number = 0;
        for (const num of arrOfAllVals)
            val += Math.pow(num - avg, 2);

        return [avgRcmd / ttlEvalsMade, Math.sqrt(val / arrOfAllVals.length)];
    }

    private async selectOne(
        originalMessage: Message,
        arr: string[],
        instructions: string,
        title: string
    ): Promise<string> {
        if (arr.length === 1)
            return arr[0];

        const embed: MessageEmbed = new MessageEmbed()
            .setTitle(`CAPE Lookup ⇒ Select ${title}`)
            .setColor(0x000080)
            .setDescription(instructions)
            .setFooter("React to ❌ if you want to cancel this.");

        const fields: string[] = arrayToStringFields<string>(
            arr,
            (i, elem) => `${this._reactions[i]} ${elem}\n`
        );

        for (const field of fields)
            embed.addField("Selection", field);

        const botMsg: Message = await originalMessage.channel.send(embed);
        const reactionsToUse: EmojiResolvable[] = ["❌"];

        await botMsg.react("❌").catch(e => { });
        for (let i = 0; i < arr.length; i++) {
            reactionsToUse.push(this._reactions[i]);
            await botMsg.react(this._reactions[i]).catch(e => { });
        }

        const selectedReact: Emoji | "-cancel" = await CollectorManager.getEmoji(botMsg, originalMessage, reactionsToUse);
        await botMsg.delete().catch(e => { });
        if (selectedReact === "-cancel" || selectedReact.name === "❌") {
            return "";
        }

        return arr[this._reactions.findIndex(x => x === selectedReact.name)];
    }

    private cleanCourseNumber(input: string): string {
        const courseNumRaw: string = input.trim().toUpperCase();
        if (courseNumRaw.indexOf(" ") === -1) {
            // no space
            let index: number = -1;
            for (let i = 0; i < courseNumRaw.length; i++) {
                if (!Number.isNaN(Number.parseInt(courseNumRaw[i]))) {
                    index = i;
                    break;
                }
            }

            return index === -1
                ? ""
                : `${courseNumRaw.substring(0, index)} ${courseNumRaw.substring(index)}`;
        }

        const splitCourseNum: string[] = courseNumRaw.split(" ")
            .filter(x => x !== "");

        return splitCourseNum.length === 2
            ? `${splitCourseNum[0]} ${splitCourseNum[1]}`
            : "";
    }

    private cleanInstructorName(input: string): string {
        input = input.trim();
        if (input.indexOf(",") === -1) {
            // first middle last
            const splitName: string[] = input.split(" ")
                .filter(x => x !== "");
            const lastName: string = splitName.pop() as string;

            if (splitName.length === 0)
                // only last name
                return lastName;
            else
                // last, first name
                return `${lastName}, ${splitName.join(" ")}`;

        }
        else {
            // last, first middle
            const splitName: string[] = input.split(",")
                .map(x => x.trim());

            const lastName: string = splitName.shift() as string;
            const firstMiddleName: string = splitName.join(" ");

            if (lastName.trim() === "")
                return firstMiddleName;
            else
                return `${lastName}, ${splitName.join(" ")}`;
        }
    }

    private cleanSubjectInput(input: string): string {
        input = input.trim();
        // loop up by code first
        for (const subject of (subjectList as ISubject[])) {
            if (subject.code === input.toUpperCase()) {
                return subject.code;
            }
        }

        // then by name
        for (const subject of (subjectList as ISubject[])) {
            if (subject.value.toLowerCase().includes(input.toLowerCase())) {
                return subject.code;
            }
        }

        return "";
    }

    //#region reaction menu
    public async configSettings(msg: Message, capeInput: ICapeInput, botMsg: Message | null = null): Promise<ICapeInput | "-cancel"> {
        function createEmbed(): MessageEmbed {
            let canSearch: boolean = capeInput.course !== "" || capeInput.instructor !== "";
            const embed: MessageEmbed = new MessageEmbed()
                .setTitle("Configure CAPE Lookup")
                .setColor(0x000080)
                .setDescription("To look up a result, you must either select an instructor or course.")
                .addField("Cancel Process", "React to the ❌ emoji if you don't want to search at this time.")
                .addField("Set Subject", `React to the 🏫 emoji if you want to select the subject to look up.\n⇒ **Current Subject Set:** \`${capeInput.subject === "" ? "N/A" : capeInput.subject}\``)
                .addField("Set Instructor", `React to the 🙆 emoji if you want to select an instructor to look up.\n⇒ **Current Instructor Set:** \`${capeInput.instructor === "" ? "N/A" : capeInput.instructor}\``)
                .addField("Set Course Number", `React to the 📝 emoji if you want to select a course number to look up.\n⇒ **Current Course Set:** \`${capeInput.course === "" ? "N/A" : capeInput.course}\``)
                .addField("Change Display Type", `React to the 🔹 emoji if you want the bot to either display the most recent CAPEs or a summary of all CAPEs.\n⇒ **Display Type:** \`${capeInput.viewType === "ALL" ? "Recent CAPEs" : "Summary"}\``)
                .addField("Raw Data", `React to the 🔍 emoji if you want the bot to show or hide raw data. Raw data lets you view past CAPEs but will show way more data.\n⇒ **Show Raw?** \`${capeInput.showRaw ? "Yes" : "No"}\``)
                .setFooter(canSearch ? "🟢 Able to Search" : "🔴 Unable to Search");
            if (canSearch) {
                embed.addField("Search", "React to the ✅ emoji if you want to search using the specified criteria above.");
            }

            return embed;
        }

        let hasReacted: boolean = false;
        while (true) {
            botMsg = botMsg === null
                ? await msg.channel.send(createEmbed())
                : await botMsg.edit(createEmbed());

            let reactions: EmojiResolvable[] = ["❌", "🏫", "🙆", "📝", "🔹", "🔍"];
            if (capeInput.course !== "" || capeInput.instructor !== "")
                reactions.push("✅");

            if (hasReacted) {
                if (reactions.indexOf("✅") !== -1) {
                    await botMsg.react("✅").catch(e => { });
                }
            }
            else {
                for (const emoji of reactions)
                    await botMsg.react(emoji).catch(e => { });

                hasReacted = !hasReacted;
            }

            const choice: Emoji | "-cancel" = await CollectorManager.getEmoji(botMsg, msg, reactions, {
                removeAllEmojisAfter: false
            });
            if (choice === "-cancel" || choice.name === "❌") {
                await botMsg.delete().catch(e => { });
                return "-cancel";
            }
            else if (choice.name === "🏫") {
                await botMsg.reactions.removeAll().catch(e => { });
                const out: ICapeInput | "CANCEL" = await this.getSubject(botMsg, msg, capeInput);
                if (out === "CANCEL") {
                    await botMsg.delete().catch(e => { });
                    return "-cancel";
                }
                hasReacted = false;
                capeInput = out;
            }
            else if (choice.name === "🙆") {
                await botMsg.reactions.removeAll().catch(e => { });
                const out: ICapeInput | "CANCEL" = await this.getInstructor(botMsg, msg, capeInput);
                if (out === "CANCEL") {
                    await botMsg.delete().catch(e => { });
                    return "-cancel";
                }
                hasReacted = false;
                capeInput = out;
            }
            else if (choice.name === "📝") {
                await botMsg.reactions.removeAll().catch(e => { });
                const out: ICapeInput | "CANCEL" = await this.getCourseNumber(botMsg, msg, capeInput);
                if (out === "CANCEL") {
                    await botMsg.delete().catch(e => { });
                    return "-cancel";
                }
                hasReacted = false;
                capeInput = out;
            }
            else if (choice.name === "🔹") {
                capeInput.viewType = capeInput.viewType === "ALL"
                    ? "SPECIAL"
                    : "ALL";
            }
            else if (choice.name === "🔍") {
                capeInput.showRaw = capeInput.showRaw
                    ? false
                    : true;
            }
            else if (choice.name === "✅" && reactions.includes("✅")) {
                await botMsg.reactions.removeAll().catch(e => { });
                await botMsg.delete().catch(e => { });
                return capeInput;
            }
        }
    }

    private async getSubject(botMsg: Message, msg: Message, capeInput: ICapeInput): Promise<ICapeInput | "CANCEL"> {
        const embed: MessageEmbed = new MessageEmbed()
            .setTitle("Configure CAPE Lookup ⇒ Subject")
            .setColor(0x000080)
            .setDescription(`⇒ **Current Subject:** \`${capeInput.subject === "" ? "N/A" : capeInput.subject}\`\n\nType the subject that you want to look up. The subject can either be the letter code or the name of the subject.\n\n__Valid Example Inputs__\n- MATH\n- CSE\n- Mathematics\n- Computer Science`)
            .addField("Reactions", "⇒ React to the ❌ emoji if you don't want to set the subject.\n⇒ React to the 🗑️ emoji if you want to clear the current selection.")
            .addField("Note", "If your input is valid, the bot should automatically update it in the main menu. If not, the bot won't say anything.")
            .setFooter("Subject");
        await botMsg.reactions.removeAll().catch(e => { });
        await botMsg.edit(embed).catch(e => { });
        for (const emoji of ["❌", "🗑️"])
            await botMsg.react(emoji).catch(e => { });

        let result: string | Emoji = await CollectorManager.getEitherEmojiOrString(botMsg, msg, ["❌", "🗑️"]);
        if (result instanceof Emoji) {
            if (result.name === "🗑️") {
                capeInput.subject = "";
                return capeInput;
            }
            else
                return "CANCEL";
        }
        else {
            let cleanedInput: string = this.cleanSubjectInput(result);
            capeInput.subject = cleanedInput === ""
                ? capeInput.subject
                : cleanedInput;
            return capeInput;
        }
    }

    private async getInstructor(botMsg: Message, msg: Message, capeInput: ICapeInput): Promise<ICapeInput | "CANCEL"> {
        const embed: MessageEmbed = new MessageEmbed()
            .setTitle("Configure CAPE Lookup ⇒ Instructor")
            .setColor(0x000080)
            .setDescription(`⇒ **Current Instructor:** \`${capeInput.instructor === "" ? "N/A" : capeInput.instructor}\`\n\nType the instructor that you want to look up. The instructor's name should begin with a first name and end with the last name.\n\n__Valid Example Inputs__\n- Joshua Swanson\n- Joshua P Swanson\n- Joshua P. Swanson\n- J Swanson\n- Swanson\n- Joshua`)
            .addField("Reactions", "⇒ React to the ❌ emoji if you don't want to set the instructor.\n⇒ React to the 🗑️ emoji if you want to clear the current selection.")
            .addField("Note", "If your input is valid, the bot should automatically update it in the main menu. If not, the bot won't say anything.")
            .setFooter("Instructor");
        await botMsg.reactions.removeAll().catch(e => { });
        await botMsg.edit(embed).catch(e => { });
        for (const emoji of ["❌", "🗑️"])
            await botMsg.react(emoji).catch(e => { });

        let result: string | Emoji = await CollectorManager.getEitherEmojiOrString(botMsg, msg, ["❌", "🗑️"]);
        if (result instanceof Emoji) {
            if (result.name === "🗑️") {
                capeInput.instructor = "";
                return capeInput;
            }
            else {
                return "CANCEL";
            }
        }
        else {
            capeInput.instructor = this.cleanInstructorName(result);
            return capeInput;
        }
    }

    private async getCourseNumber(botMsg: Message, msg: Message, capeInput: ICapeInput): Promise<ICapeInput | "CANCEL"> {
        const embed: MessageEmbed = new MessageEmbed()
            .setTitle("Configure CAPE Lookup ⇒ Course Number")
            .setColor(0x000080)
            .setDescription(`⇒ **Current Course Number:** \`${capeInput.course === "" ? "N/A" : capeInput.course}\`\n\nType the course number that you want to look up. Your course number should start with the subject code and end with actual numbers. Spacing doesn't matter.\n\n__Valid Example Inputs__\n- CSE 8B\n- MATH109\n- MATH 20B\n- CSE 11`)
            .addField("Reactions", "⇒ React to the ❌ emoji if you don't want to set the course number.\n⇒ React to the 🗑️ emoji if you want to clear the current selection.")
            .addField("Note", "If your input is valid, the bot should automatically update it in the main menu. If not, the bot won't say anything.")
            .setFooter("Search Course Number");
        await botMsg.reactions.removeAll().catch(e => { });
        await botMsg.edit(embed).catch(e => { });
        for (const emoji of ["❌", "🗑️"])
            await botMsg.react(emoji).catch(e => { });

        const result: string | Emoji = await CollectorManager.getEitherEmojiOrString(botMsg, msg, ["❌", "🗑️"]);
        if (result instanceof Emoji) {
            if (result.name === "🗑️") {
                capeInput.course = "";
                return capeInput;
            }
            else {
                return "CANCEL";
            }
        }
        else {
            const output: string = this.cleanCourseNumber(result);
            if (output === "")
                return capeInput;
            else {
                capeInput.course = output;
                return capeInput;
            }
        }
    }
    
    private generateCommand(capeInput: ICapeInput): string {
        let cmd: string = ";getcape"; 
        if (capeInput.instructor !== "") {
            cmd += ` -instructor ${capeInput.instructor}`;
        }

        if (capeInput.subject !== "") {
            cmd += ` -subject ${capeInput.subject}`;
        }

        if (capeInput.course !== "") {
            cmd += ` -course ${capeInput.course}`;
        }

        if (capeInput.showRaw) {
            cmd += ` -raw`;
        }

        cmd += ` -view ${capeInput.viewType === "ALL" ? 1 : 2}`;

        return cmd;
    }
    //#endregion
}