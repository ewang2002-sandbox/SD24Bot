export interface IParsedArgs {
    argName: string;
    argVal: string[];
}

/**
 * A simple function that attenots to parses an array of string elements based on flags. 
 * @param {string[]} args The arguments that were passed through a command. 
 * @returns {IParsedArgs[]} All the arguments that were parsed.
 */
export function parseArguments(args: string[]): IParsedArgs[] {
    const returnVal: IParsedArgs[] = [];

    let argName: string = "";
    let argArgs: string[] = [];
    for (let i = 0; i < args.length; i++) {
        // new set of args
        let index: number = 0;
        for (; index < args[i].length; index++) {
            if (args[i][index] === "-")
                continue;
            break;
        }

        // start of flag
        // must start with -
        // and cant only be -
        if (args[i].startsWith("-") && index !== args[i].length) {
            if (argName !== "") {
                returnVal.push({
                    argName: argName,
                    argVal: argArgs
                });
                argArgs = [];
                argName = "";
            }

            argName = args[i].slice(index);
            continue;
        }

        argArgs.push(args[i]);
    }

    if (argName !== "") {
        returnVal.push({
            argName: argName,
            argVal: argArgs
        });
    }

    return returnVal;
}