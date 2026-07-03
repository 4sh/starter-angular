const fs = require('fs');
const path = require('path');

// --- CONFIGURATION ---
const ASSETS_PATH = path.join(__dirname, '../assets/img');
const OUTPUT_FILE = path.join(__dirname, '../assets/assets-map.json');

// --- STATE ---
const map = {};
const allDetectedThemes = new Set(); // Pour stocker 'common', 'themeone', etc.

// --- MAIN PROCESS ---
function scan() {
    if (!fs.existsSync(ASSETS_PATH)) {
        console.error(`❌ ERREUR CRITIQUE : Le dossier ${ASSETS_PATH} est introuvable.`);
        return;
    }

    console.log(`📂 Démarrage du scan sur : ${ASSETS_PATH}`);

    // 1. Récupérer la liste de tous les dossiers de thèmes (common, themeone, etc.)
    const themeFolders = getDirectories(ASSETS_PATH).filter(name => !name.startsWith('.'));
    themeFolders.forEach(t => allDetectedThemes.add(t));

    // 2. Parcourir chaque thème
    themeFolders.forEach(theme => {
        const themePath = path.join(ASSETS_PATH, theme);

        // Parcourir les types (jpg, png, svg)
        const types = getDirectories(themePath).filter(name => !name.startsWith('.'));

        types.forEach(type => {
            const typePath = path.join(themePath, type);
            // Scan récursif du contenu
            processContent(typePath, theme, type, 'base');
        });
    });

    // 3. VALIDATION STRICTE (C'est ici que la magie opère)
    const errors = validateRules();

    if (errors.length > 0) {
        console.error(`\n🚨 ÉCHEC DE LA GÉNÉRATION : ${errors.length} erreur(s) trouvée(s) :`);
        errors.forEach(e => console.error(`   - ${e}`));
        console.error(`\n❌ Le fichier JSON n'a pas été mis à jour pour protéger l'application.`);
        process.exit(1); // On casse le build CI/CD si besoin
    } else {
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(map, null, 2));
        console.log(`\n✅ SUCCÈS : Assets Map générée sans erreur (${Object.keys(map).length} images).`);
    }
}

// --- EXPLORATION RÉCURSIVE ---
function processContent(dirPath, theme, type, currentMode) {
    let items;
    try { items = fs.readdirSync(dirPath, { withFileTypes: true }); }
    catch (e) { return; }

    items.forEach(item => {
        if (item.name.startsWith('.')) return; // Ignorer .DS_Store

        if (item.isDirectory()) {
            const name = item.name.toLowerCase();
            let nextMode = currentMode;

            // Détection : accepte "light", "light mode", "dark", "dark mode"
            if (name === 'light' || name.includes('light mode')) {
                nextMode = 'light';
            } else if (name === 'dark' || name.includes('dark mode')) {
                nextMode = 'dark';
            }

            processContent(path.join(dirPath, item.name), theme, type, nextMode);
        } else {
            if (isImageFile(item.name)) {
                registerImage(item.name, theme, type, currentMode);
            }
        }
    });
}

function registerImage(filename, theme, type, mode) {
    if (!map[filename]) map[filename] = {};
    if (!map[filename][theme]) map[filename][theme] = {};

    if (map[filename][theme][mode]) {
        console.warn(`⚠️  ATTENTION : Doublon détecté pour ${filename} (Thème: ${theme}, Mode: ${mode})`);
    }
    map[filename][theme][mode] = type;
}

// --- MOTEUR DE RÈGLES ---
function validateRules() {
    const errorList = [];
    const themesList = Array.from(allDetectedThemes); // ['common', 'themeone', 'themetwo']

    Object.keys(map).forEach(filename => {
        const imageEntry = map[filename];

        // --- RÈGLE 1 & 2 : Validation au sein d'un thème (Modes) ---
        Object.keys(imageEntry).forEach(theme => {
            const variants = imageEntry[theme];
            const hasLight = !!variants.light;
            const hasDark = !!variants.dark;
            const hasBase = !!variants.base;

            // Règle : Pas de mélange Base + Mode
            if (hasBase && (hasLight || hasDark)) {
                errorList.push(`[${theme}/${filename}] Ambiguïté : Image présente en racine (base) ET dans un dossier mode.`);
            }

            // Règle : Symétrie Light / Dark
            if (hasLight && !hasDark) {
                errorList.push(`[${theme}/${filename}] Incomplet : Version 'light' trouvée sans version 'dark'.`);
            }
            if (!hasLight && hasDark) {
                errorList.push(`[${theme}/${filename}] Incomplet : Version 'dark' trouvée sans version 'light'.`);
            }
        });

        // --- RÈGLE 3 : Parité des Thèmes ---
        // Si l'image n'est pas dans 'common', elle doit être partout ailleurs
        if (!imageEntry['common']) {
            const missingInThemes = themesList.filter(t => t !== 'common' && !imageEntry[t]);

            if (missingInThemes.length > 0) {
                // Si elle manque dans certains thèmes ALORS qu'elle n'est pas dans common
                // Vérifions si elle est présente dans au moins un autre thème (sinon c'est juste une image orpheline d'un seul thème, est-ce une erreur ?)
                // Votre règle : "si l'image n'est que dans un theme et pas dans les autres aussi"

                const presentInThemes = themesList.filter(t => !!imageEntry[t]);

                // S'il y a des thèmes manquants et que ce n'est pas couvert par common
                errorList.push(`[${filename}] Manque de couverture : Image absente de 'common' et manquante dans : ${missingInThemes.join(', ')}.`);
            }
        }
    });

    return errorList;
}

// --- HELPERS ---
function getDirectories(src) {
    return fs.readdirSync(src, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
}

function isImageFile(filename) {
    return /\.(jpg|jpeg|png|svg|webp|gif)$/i.test(filename);
}

// Lancement
scan();
