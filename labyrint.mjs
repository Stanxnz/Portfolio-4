import ANSI from "./utils/ANSI.mjs";
import KeyBoardManager from "./utils/KeyBoardManager.mjs";
import { readMapFile, readRecordFile } from "./utils/fileHelpers.mjs";
import * as CONST from "./constants.mjs";

const startingLevel = CONST.START_LEVEL_ID;
const secondLevel = CONST.NEXT_LEVEL_ID;
const thirdLevel = CONST.THIRD_LEVEL_ID;
const levels = loadLevelListings();

function loadLevelListings(source = CONST.LEVEL_LISTING_FILE) {
    let data = readRecordFile(source);
    let levels = {};
    for (const item of data) {
        let keyValue = item.split(":");
        if (keyValue.length >= 2) {
            let key = keyValue[0];
            let value = keyValue[1].trim();
            levels[key] = value;
        }
    }
    return levels;
}

let levelData = readMapFile(levels[startingLevel]);
let level = levelData;

let pallet = {
    "█": ANSI.COLOR.LIGHT_GRAY,
    "H": ANSI.COLOR.RED,
    "$": ANSI.COLOR.YELLOW,
    "B": ANSI.COLOR.GREEN,
};

let isDirty = true;

let playerPos = {
    row: null,
    col: null,
};

const EMPTY = " ";
const HERO = "H";
const LOOT = "$";
const DOOR1 = "2";
const DOOR2 = "3";

const THINGS = [LOOT, EMPTY];
const DOORS = [DOOR1, DOOR2];

let eventText = "";

const HP_MAX = 10;

const playerStats = {
    hp: 8,
    chash: 0,
};

class Labyrinth {
    update() {
        if (playerPos.row == null) {
            this.updatePlayerPosition(); 
        }

        let drow = 0;
        let dcol = 0;

        if (KeyBoardManager.isUpPressed()) drow = -1;
        if (KeyBoardManager.isDownPressed()) drow = 1;
        if (KeyBoardManager.isLeftPressed()) dcol = -1;
        if (KeyBoardManager.isRightPressed()) dcol = 1;

        let tRow = playerPos.row + drow;
        let tcol = playerPos.col + dcol;

        if (THINGS.includes(level[tRow][tcol])) {
            let currentItem = level[tRow][tcol];
            if (currentItem === LOOT) {
                let loot = Math.round(Math.random() * 7) + 3;
                playerStats.chash += loot;
                eventText = `Player gained ${loot}$`;
            }

            level[playerPos.row][playerPos.col] = EMPTY;
            level[tRow][tcol] = HERO;

            playerPos.row = tRow;
            playerPos.col = tcol;
            isDirty = true;
        } else if (level[tRow][tcol] === "2") { 
            console.log("Transition through Door 2");
            levelData = readMapFile(levels[secondLevel]); 
            level = levelData;
            this.updatePlayerPosition();
        } else if (level[tRow][tcol] === "3") { 
            console.log("Transition through Door 3");
            levelData = readMapFile(levels[thirdLevel]); 
            level = levelData;
            this.updatePlayerPosition();
        }
    }

    draw() {
        if (!isDirty) {
            return;
        }
        isDirty = false;

        console.log(ANSI.CLEAR_SCREEN, ANSI.CURSOR_HOME);

        let rendering = "";

        rendering += this.renderHud();

        for (let row = 0; row < level.length; row++) {
            let rowRendering = "";
            for (let col = 0; col < level[row].length; col++) {
                let symbol = level[row][col];
                if (pallet[symbol] != undefined) {
                    rowRendering += pallet[symbol] + symbol + ANSI.COLOR_RESET;
                } else {
                    rowRendering += symbol;
                }
            }
            rowRendering += "\n";
            rendering += rowRendering;
        }

        console.log(rendering);
        if (eventText !== "") {
            console.log(eventText);
            eventText = "";
        }
    }

    renderHud() {
        let hpBar = `Life:[${ANSI.COLOR.RED + this.pad(playerStats.hp, "♥︎") + ANSI.COLOR_RESET}${ANSI.COLOR.LIGHT_GRAY + this.pad(HP_MAX - playerStats.hp, "♥︎") + ANSI.COLOR_RESET}]`;
        let cash = `$:${playerStats.chash}`;
        return `${hpBar} ${cash}\n`;
    }

    pad(len, text) {
        let output = "";
        for (let i = 0; i < len; i++) {
            output += text;
        }
        return output;
    }

    updatePlayerPosition() {
        playerPos.row = null;
        playerPos.col = null;

        for (let row = 0; row < level.length; row++) {
            for (let col = 0; col < level[row].length; col++) {
                if (level[row][col] === HERO) {
                    playerPos.row = row;
                    playerPos.col = col;
                    return;
                }
            }
        }
    }
}

export default Labyrinth;
