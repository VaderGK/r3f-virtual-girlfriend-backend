// src/utils/fileUtils.js
// version 1.0.0
// changes: 
import fs from 'fs/promises';

export const readJsonTranscript = async (file) => {
  try {
    const data = await fs.readFile(file, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error(`❌ Błąd odczytu pliku JSON: ${file}`, error);
    return null;
  }
};