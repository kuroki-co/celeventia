import { rmSync } from "node:fs";
import { execFileSync } from "node:child_process";

const outDir = ".tmp/calendar-test";
const tscArgs = [
  "node_modules/typescript/lib/tsc.js",
  "invitation/calendar.ts",
  "invitation/calendar.test.ts",
  "--outDir",
  outDir,
  "--module",
  "node16",
  "--moduleResolution",
  "node16",
  "--target",
  "ES2022",
  "--types",
  "node",
  "--skipLibCheck",
];

try {
  rmSync(outDir, { force: true, recursive: true });
  execFileSync(process.execPath, tscArgs, { stdio: "inherit" });
  execFileSync(process.execPath, ["--test", `${outDir}/calendar.test.js`], {
    stdio: "inherit",
  });
} finally {
  rmSync(outDir, { force: true, recursive: true });
}
