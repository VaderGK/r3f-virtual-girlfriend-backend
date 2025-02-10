// scripts/postinstall.js
// version 1.0.0

import { execSync } from "child_process";
import os from "os";

const isWindows = os.platform() === "win32";
const isLinux = os.platform() === "linux";

try {
    if (isLinux) {
        console.log("🐧 Linux detected - Installing dependencies...");
        execSync(
            "apt-get update && apt-get install -y ffmpeg unzip && curl -L -o /tmp/rhubarb.zip https://github.com/DanielSWolf/rhubarb-lip-sync/releases/download/v1.13.0/Rhubarb-Lip-Sync-1.13.0-Linux.zip && unzip /tmp/rhubarb.zip -d /usr/local/bin/ && chmod +x /usr/local/bin/rhubarb && /usr/local/bin/rhubarb --version || echo 'Rhubarb nie działa'",
            { stdio: "inherit" }
        );
    } else if (isWindows) {
        console.log("🪟 Windows detected - Skipping Linux dependencies.");
        console.log("⚠️ Jeśli potrzebujesz Rhubarb na Windowsie, pobierz go ręcznie.");
    } else {
        console.log("❌ Unsupported OS");
    }
} catch (error) {
    console.error("❌ Błąd w postinstall:", error);
}
