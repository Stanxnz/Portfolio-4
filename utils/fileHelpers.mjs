import fs from "node:fs";
import { MAP_DIRECTORY } from "../constants.mjs";
import { TELEPORT_SYMBOL } from "../constants.mjs";

const TELEPORT_VARIANTS = ["♨︎", "\u2668"];

function normalizeMap(levelData){
    return levelData.map(row => row.map(cell => (TELEPORT_VARIANTS.includes(cell) ? TELEPORT_SYMBOL : cell)));
}

function readMapFile(fileName) {
    let data = fs.readFileSync(`${MAP_DIRECTORY}${fileName}`.trim(), { encoding: "utf8" });
    let levelData = data.split("\n").map(row => row.split(""));

    return normalizeMap(levelData);
}

function readRecordFile(fileName) {
    let data = fs.readFileSync(fileName, { encoding: "utf8" });
    return data.split("\n");
}

export { readMapFile, readRecordFile };