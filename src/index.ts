import { SDBot } from "./bot";
import { config, DotenvConfigOutput } from "dotenv";

const resp: DotenvConfigOutput = config();
if (typeof resp.error !== "undefined") {
    console.error("Something went wrong!");
    process.exit();
}

new SDBot()
    .loadEvents()
    .loadCommands()
    .login();