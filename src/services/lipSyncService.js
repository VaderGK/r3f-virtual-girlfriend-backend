// src/services/lipSyncService.js
import { execCommand } from '../utils/execUtils.js';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const lipSyncMessage = async (messageIndex) => {
    console.log(`🎶 Rozpoczęto lipSyncMessage: messageIndex=${messageIndex}`);

    const time = new Date().getTime();
    const mp3FileName = `audios/message_${messageIndex}.mp3`; // Zakładamy MP3
    const wavFileName = `audios/message_${messageIndex}.wav`;
    const jsonFileName = `audios/message_${messageIndex}.json`;

    console.log(`🔍 lipSyncMessage: mp3FileName="${mp3FileName}", wavFileName="${wavFileName}", jsonFileName="${jsonFileName}"`);


    try {
        // 1. Konwersja MP3 na WAV
        console.log(`🔄 Converting MP3 to WAV: ${mp3FileName} -> ${wavFileName}`);
        const ffmpegCommand = `ffmpeg -y -i ${mp3FileName} ${wavFileName}`;
        console.log(`⚙️ Wykonuję polecenie: ${ffmpegCommand}`);

        await execCommand(ffmpegCommand);
        console.log(`✅ Conversion done in ${new Date().getTime() - time}ms`);

        // 2. Generowanie lip sync za pomocą Rhubarb
        console.log(`👄 Generating lip sync data: ${wavFileName} -> ${jsonFileName}`);
        const rhubarbPath = '/usr/local/bin/Rhubarb-Lip-Sync-1.13.0-Linux/rhubarb'; // ✅ Poprawiona ścieżka
        const rhubarbCommand = `${rhubarbPath} -f json -o ${jsonFileName} ${wavFileName} -r phonetic`;
        console.log(`⚙️ Wykonuję polecenie: ${rhubarbCommand}`);

        await execCommand(rhubarbCommand);
        console.log(`✅ Lip sync done in ${new Date().getTime() - time}ms`);

        // 3. Odczyt pliku JSON
        console.log(`📖 Odczytuję plik JSON: ${jsonFileName}`);
        const lipSyncData = await readJsonTranscript(jsonFileName);

        if (!lipSyncData) {
            console.warn(`⚠️  Brak danych lip sync w pliku: ${jsonFileName}`);
        }

        console.log(`✔️ Dane lip sync odczytane pomyślnie`);
        return lipSyncData;
    } catch (error) {
        console.error(`❌ Błąd podczas generowania lip sync dla wiadomości ${messageIndex}:`, error);
        return null;
    }
};

const readJsonTranscript = async (file) => {
    try {
        console.log(`📄 Próba odczytu pliku JSON: ${file}`);
        const data = await fs.readFile(file, "utf8");
        const jsonData = JSON.parse(data);
        console.log(`✅ Plik JSON odczytany i sparsowany pomyślnie`);
        return jsonData;
    } catch (error) {
        console.error(`❌ Błąd odczytu pliku JSON: ${file}`, error);
        return null;
    }
};

export { lipSyncMessage }; 