import { Command } from "commander";

const program = new Command();

program
    .name("syc")
    .description("manage your dotfile and env")
    .version("0.0.1");

program
    .command("greet <name>")
    .description("Greet someone")
    .action((name) => {
        console.log(`Hello, ${name}!`);
    });

program
    .command("init")
    .description("Initialize configuration")
    .action(() => {
        console.log("Initializing...");
    });

export default program;
