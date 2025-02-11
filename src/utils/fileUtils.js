// src/utils/fileUtils.js
// version 1.0.1
// changes: 

import fs from 'fs/promises';

export const readJsonTranscript = async (file) => {
  try {
    console.log("🧐 Sprawdzam, czy plik JSON istnieje:", file);
    
    // Sprawdzamy, czy plik istnieje przed odczytem
    try {
      await fs.access(file);
    } catch (error) {
      console.error(`❌ Plik JSON NIE ISTNIEJE: ${file}`);
      return null;
    }

    // Odczyt pliku JSON
    const data = await fs.readFile(file, "utf8");
    console.log(`✅ Plik JSON odczytany pomyślnie: ${file}`);
    
    return JSON.parse(data);
  } catch (error) {
    console.error(`❌ Błąd odczytu pliku JSON: ${file}`, error);
    return null;
  }
};

// 🆕 Nowa funkcja do sprawdzania plików MP3
export const checkFileExists = async (file) => {
  try {
    await fs.access(file);
    console.log(`✅ Plik istnieje: ${file}`);
    return true;
  } catch (error) {
    console.error(`❌ Plik NIE ISTNIEJE: ${file}`);
    return false;
  }
};
