import ANSI from "./utils/ANSI.mjs";
import KeyBoardManager from "./utils/KeyBoardManager.mjs";
import { readMapFile, readRecordFile } from "./utils/fileHelpers.mjs";
import * as CONST from "./constants.mjs";
import oscillate from "./utils/oscilate.mjs";


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

let teleportPositions = [];
let npcPositions = [];
let visitedLevels = [];
let isDirty = true;
let playerPos = { row: null, col: null };

const EMPTY = " ";
const HERO = "H";
const LOOT = "$";
const DOOR1 = "2";
const DOOR2 = "3";

const THINGS = [LOOT, EMPTY];
const DOORS = [DOOR1, DOOR2];

let eventText = "";

const HP_MAX = 10;

const playerStats = {  hp: 8, cash: 0 };

let pallet = {
    "█": ANSI.COLOR.LIGHT_GRAY,
    "H": ANSI.COLOR.RED,
    "$": ANSI.COLOR.YELLOW,
    "B": ANSI.COLOR.GREEN,
};

class Labyrinth {
    constructor() {
        this.initializeTeleports();
        this.initializeNPCs();
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

 initializeTeleports() {
        teleportPositions = [];
        for (let r = 0; r < level.length; r++) {
            for (let c = 0; c < level[r].length; c++) {
                if (level[r][c] === CONST.TELEPORT_SYMBOL) {
                    teleportPositions.push({ row: r, col: c });
                }
            }
        }
    }

teleportPlayer() {
        let currentIndex = teleportPositions.findIndex(pos => pos.row === playerPos.row && pos.col === playerPos.col);
        if (currentIndex >= 0) {
        let targetIndex = (currentIndex + 1) %
        teleportPositions.length;
        let target = teleportPositions[targetIndex];
        level[playerPos.row][playerPos.col] = EMPTY;
        level[target.row][target.col] = HERO;
        playerPos.row = target.row;
        playerPos.col = target.col;
        isDirty = true;
        }
    }

initializeNPCs() {
        npcPositions = [];
        for (let r = 0; r < level.length; r++) {
            for (let c = 0; c < level[r].length; c++) {
                if (level[r][c] === "X") {
                    npcPositions.push({
                        row: r,
                        col: c,
                        oscillator: oscillate(c - 2, c + 2)
                    });
                }
            }
        }
    }

    updateNPCs() {
        for (let npc of npcPositions) {
            let oldCol = npc.col;
            let newCol = npc.oscillator();
            level[npc.row][oldCol] = EMPTY;
            level[npc.row][newCol] = "X";
            npc.col = newCol;
        }
    }
    transitionTo(levelId) {
        visitedLevels.push(level);
        levelData = readMapFile(levels[levelId]);
        level = levelData;
        this.updatePlayerPosition();
        this.initializeTeleports();
        this.initializeNPCs();
    }
    returnToPreviousLevel() {
        if (visitedLevels.length > 0) {
            level = visitedLevels.pop();
            this.updatePlayerPosition();
            this.initializeTeleports();
            this.initializeNPCs();
        }
    }

    update() {
        if (playerPos.row === null) {
            this.updatePlayerPosition();
            this.initializeTeleports();
            this.initializeNPCs();
        }

        let drow = 0, dcol = 0;
        if (KeyBoardManager.isUpPressed()) drow = -1;
        if (KeyBoardManager.isDownPressed()) drow = 1;
        if (KeyBoardManager.isLeftPressed()) dcol = -1;
        if (KeyBoardManager.isRightPressed()) dcol = 1;

        let tRow = playerPos.row + drow;
        let tCol = playerPos.col + dcol;

        if (level[tRow][tCol] === CONST.TELEPORT_SYMBOL) {
            this.teleportPlayer();
            isDirty = true;
        } else if (level[tRow][tCol] === "2") {
            this.transitionTo(secondLevel);
            isDirty = true;
        } else if (level[tRow][tCol] === "3") {
            this.transitionTo(thirdLevel);
            isDirty = true;
        } else if (level[tRow][tCol] === EMPTY || level[tRow][tCol] === LOOT) {
            if (level[tRow][tCol] === LOOT) {
                let loot = Math.floor(Math.random() * 10) + 1;
                playerStats.cash += loot;
                console.log('You collected ${loot} coins!');
            }
            level[playerPos.row][playerPos.col] = EMPTY;
            level[tRow][tCol] = HERO;
            playerPos.row = tRow;
            playerPos.col = tCol;
            isDirty = true;
        } else if (level[tRow][tCol] === "B") {
            this.returnToPreviousLevel();
            isDirty = true;
        }
        this.updateNPCs();
        isDirty = true;
    }

    draw() {
        if (!isDirty)return;
        isDirty = false;

        console.log(ANSI.CLEAR_SCREEN, ANSI.CURSOR_HOME);

        let rendering = this.renderHud();

        for (let row = 0; row < level.length; row++) {
            let rowRendering = "";
            for (let col = 0; col < level[row].length; col++) {
                let symbol = level[row][col];
                if (pallet[symbol]) {
                    rowRendering += pallet[symbol] + symbol + ANSI.COLOR_RESET;
                } else {
                    rowRendering += symbol;
                }
            }
            rendering += rowRendering + "\n";
        }
        console.log(rendering);
    }
    renderHud() {
        let hpBar = `HP: [${ANSI.COLOR.RED}${"♥︎".repeat(playerStats.hp)}${ANSI.COLOR.LIGHT_GRAY}${" ".repeat(HP_MAX - playerStats.hp)}${ANSI.COLOR_RESET}]`;
        let cash = `Cash: $${playerStats.cash}`;
        return `${hpBar} ${cash}\n`;
    }  
    }

    export default Labyrinth;

   

    

    


