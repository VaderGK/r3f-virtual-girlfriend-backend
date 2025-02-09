// src/services/lipSyncService.js
import { execCommand } from '../utils/execUtils.js';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const lipSyncMessage = async (messageIndex) => {
    const time = new Date().getTime();
    const mp3FileName = `audios/message_${messageIndex}.mp3`; // Zakładamy MP3
    const wavFileName = `audios/message_${messageIndex}.wav`;
    const jsonFileName = `audios/message_${messageIndex}.json`;

    console.log(`🎤 Starting lip sync generation for message ${messageIndex}`);

    try {
        // 1. Konwersja MP3 na WAV
        console.log(`🔄 Converting MP3 to WAV: ${mp3FileName} -> ${wavFileName}`);
        await execCommand(`ffmpeg -y -i ${mp3FileName} ${wavFileName}`);
        console.log(`✅ Conversion done in ${new Date().getTime() - time}ms`);

        // 2. Generowanie lip sync za pomocą Rhubarb
        console.log(`👄 Generating lip sync data: ${wavFileName} -> ${jsonFileName}`);
        const rhubarbPath = path.join(__dirname, '..', '..', 'bin', 'rhubarb'); // Poprawiona ścieżka
        await execCommand(`${rhubarbPath} -f json -o ${jsonFileName} ${wavFileName} -r phonetic`); // Poprawiona ścieżka
        console.log(`✅ Lip sync done in ${new Date().getTime() - time}ms`);

        // 3. Odczyt pliku JSON
        const lipSyncData = await readJsonTranscript(jsonFileName);
        return lipSyncData;
    } catch (error) {
        console.error(`❌ Błąd podczas generowania lip sync dla wiadomości ${messageIndex}:`, error);
        return null;
    }
};

const readJsonTranscript = async (file) => {
    try {
        const data = await fs.readFile(file, "utf8");
        return JSON.parse(data);
    } catch (error) {
        console.error(`❌ Błąd odczytu pliku JSON: ${file}`, error);
        return null;
    }
};

export { lipSyncMessage };