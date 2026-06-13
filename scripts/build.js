// Full pipeline: collect → merge → validate
import { execSync } from "node:child_process";

const run = (cmd) => execSync(cmd, { stdio: "inherit" });

run("node scripts/collect.js");
run("node scripts/merge.js");
run("node scripts/validate.js");
