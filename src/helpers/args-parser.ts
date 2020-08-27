export interface IParsedArgs {
    argName: string;
    argVal: string[];
}

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