// src/utils/execUtils.js
// version 1.0.0
import { exec as childProcessExec } from "child_process";

export function checkDependencies() {
    exec("ffmpeg -version", (error, stdout) => {
        if (error) console.error("🚨 FFmpeg NIE jest zainstalowany!");
        else console.log("✅ FFmpeg działa:\n", stdout);
    });

    const rhubarbPath = "/usr/local/bin/rhubarb";
    exec("rhubarb --version", async (error, stdout) => {
        if (error) {
            console.warn("🚨 Rhubarb NIE jest zainstalowany! Pobieranie...");
            try {
                await execCommand(`curl -L -o ${rhubarbPath} https://github.com/DanielSWolf/rhubarb-lip-sync/releases/latest/download/rhubarb-linux`);
                await execCommand(`chmod +x ${rhubarbPath}`);
                console.log("✅ Rhubarb został pobrany.");
            } catch (installError) {
                console.error("❌ Nie udało się pobrać Rhubarb!", installError);
            }
        } else console.log("✅ Rhubarb działa:\n", stdout);
    });
}


export const execCommand = (command) => {
    return new Promise((resolve, reject) => {
        childProcessExec(command, (error, stdout, stderr) => {
            if (error) {
                console.warn(`❌ Błąd podczas wykonywania polecenia: ${command}`);
                reject(error);
                return;
            }
            console.log(`✅ Wykonano polecenie: ${command}`);
            resolve(stdout ? stdout : stderr);
        });
    });
};

// Funkcja exec do wykonywania poleceń systemowych
export const exec = (command, callback) => {
    childProcessExec(command, callback);
};