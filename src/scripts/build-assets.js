const fs = require('fs');
const path = require('path');

// --- CONFIGURATION ---
const ASSETS_PATH = path.join(__dirname, '../assets/img');
const OUTPUT_FILE = path.join(__dirname, '../assets/assets-map.json');

// --- STATE ---
const map = {};
const allDetectedThemes = new Set(); // Stores 'common', 'themeone', etc.

// --- MAIN PROCESS ---
function scan() {
    if (!fs.existsSync(ASSETS_PATH)) {
        console.error(`❌ CRITICAL ERROR: Folder ${ASSETS_PATH} not found.`);
        return;
    }

    console.log(`📂 Starting scan on: ${ASSETS_PATH}`);

    // 1. Collect the list of all theme folders (common, themeone, etc.)
    const themeFolders = getDirectories(ASSETS_PATH).filter(name => !name.startsWith('.'));
    themeFolders.forEach(t => allDetectedThemes.add(t));

    // 2. Walk each theme
    themeFolders.forEach(theme => {
        const themePath = path.join(ASSETS_PATH, theme);

        // Walk the types (jpg, png, svg)
        const types = getDirectories(themePath).filter(name => !name.startsWith('.'));

        types.forEach(type => {
            const typePath = path.join(themePath, type);
            // Recursive scan of the content
            processContent(typePath, theme, type, 'base');
        });
    });

    // 3. STRICT VALIDATION (this is where the magic happens)
    const errors = validateRules();

    if (errors.length > 0) {
        console.error(`\n🚨 GENERATION FAILED: ${errors.length} error(s) found:`);
        errors.forEach(e => console.error(`   - ${e}`));
        console.error(`\n❌ The JSON file was not updated to protect the application.`);
        process.exit(1); // Break the CI/CD build if needed
    } else {
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(map, null, 2));
        console.log(`\n✅ SUCCESS: Assets map generated without errors (${Object.keys(map).length} images).`);
    }
}

// --- RECURSIVE EXPLORATION ---
function processContent(dirPath, theme, type, currentMode) {
    let items;
    try { items = fs.readdirSync(dirPath, { withFileTypes: true }); }
    catch (e) { return; }

    items.forEach(item => {
        if (item.name.startsWith('.')) return; // Ignore .DS_Store

        if (item.isDirectory()) {
            const name = item.name.toLowerCase();
            let nextMode = currentMode;

            // Detection: accepts "light", "light mode", "dark", "dark mode"
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
        console.warn(`⚠️  WARNING: Duplicate detected for ${filename} (Theme: ${theme}, Mode: ${mode})`);
    }
    map[filename][theme][mode] = type;
}

// --- RULES ENGINE ---
function validateRules() {
    const errorList = [];
    const themesList = Array.from(allDetectedThemes); // ['common', 'themeone', 'themetwo']

    Object.keys(map).forEach(filename => {
        const imageEntry = map[filename];

        // --- RULES 1 & 2: Validation within a theme (modes) ---
        Object.keys(imageEntry).forEach(theme => {
            const variants = imageEntry[theme];
            const hasLight = !!variants.light;
            const hasDark = !!variants.dark;
            const hasBase = !!variants.base;

            // Rule: no mixing of base + mode
            if (hasBase && (hasLight || hasDark)) {
                errorList.push(`[${theme}/${filename}] Ambiguous: image present at root (base) AND in a mode folder.`);
            }

            // Rule: light / dark symmetry
            if (hasLight && !hasDark) {
                errorList.push(`[${theme}/${filename}] Incomplete: 'light' version found without a 'dark' version.`);
            }
            if (!hasLight && hasDark) {
                errorList.push(`[${theme}/${filename}] Incomplete: 'dark' version found without a 'light' version.`);
            }
        });

        // --- RULE 3: Theme parity ---
        // If the image is not in 'common', it must exist in every other theme
        if (!imageEntry['common']) {
            const missingInThemes = themesList.filter(t => t !== 'common' && !imageEntry[t]);

            if (missingInThemes.length > 0) {
                // It is missing from some themes while not being in common.
                // Check whether it exists in at least one other theme (otherwise it is
                // just an orphan image of a single theme — is that an error?)
                // Rule: "if the image is only in one theme and not in the others too"

                const presentInThemes = themesList.filter(t => !!imageEntry[t]);

                // There are missing themes and it is not covered by common
                errorList.push(`[${filename}] Coverage gap: image absent from 'common' and missing in: ${missingInThemes.join(', ')}.`);
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

// Launch
scan();
