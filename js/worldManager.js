// -----------------------------------------------------------------------------
// root/js/worldManager.js - Manages world state, drawing, and interactions
// -----------------------------------------------------------------------------

import * as Config from './config.js';
import * as Renderer from './renderer.js';
import * as GridRenderer from './utils/grid.js';
import * as WorldData from './utils/worldData.js';
import * as ItemManager from './itemManager.js';
import { generateInitialWorld } from './utils/worldGenerator.js';

// --- Draw the entire static world to the off-screen canvas ---
function renderStaticWorldToGridCanvas() {
    console.log("Rendering initial static world blocks to off-screen canvas...");
    const gridCtx = Renderer.getGridContext();
    const gridCanvas = Renderer.getGridCanvas();
    if (!gridCtx || !gridCanvas) {
        console.error("WorldManager: Cannot render static world - grid canvas/context missing!");
        return;
    }
// clear the entire off-screen canvas first
    gridCtx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);
// iterate through grid data
    const worldGrid = WorldData.getGrid();
    for (let r = 0; r < Config.GRID_ROWS; r++) {
        for (let c = 0; c < Config.GRID_COLS; c++) {
            const block = worldGrid[r][c];
            if (!block || block === Config.BLOCK_AIR) continue; // skip air blocks
            const blockType = block.type;
            const blockColor = Config.BLOCK_COLORS[blockType];
            if (!blockColor) continue; // skip if no color defined
            const blockX = c * Config.BLOCK_WIDTH;
            const blockY = r * Config.BLOCK_HEIGHT;
            const orientation = block.orientation;
// draw block onto GRID CANVAS using gridCtx
            if (orientation === Config.ORIENTATION_FULL) {
                gridCtx.fillStyle = blockColor;
// use floor/ceil for potential pixel snapping
                gridCtx.fillRect(Math.floor(blockX), Math.floor(blockY), Math.ceil(Config.BLOCK_WIDTH), Math.ceil(Config.BLOCK_HEIGHT));
            } else {
// (placeholder for drawing slopes/other orientations onto the static canvas)
                 gridCtx.fillStyle = blockColor; // Base color
                 gridCtx.fillRect(Math.floor(blockX), Math.floor(blockY), Math.ceil(Config.BLOCK_WIDTH), Math.ceil(Config.BLOCK_HEIGHT));
                 gridCtx.fillStyle = "rgba(0,0,0,0.2)"; // Indicate non-full block visually
                 gridCtx.font = '8px sans-serif';
                 gridCtx.textAlign = 'center';
                 gridCtx.textBaseline = 'middle';
                 gridCtx.fillText(orientation, blockX + Config.BLOCK_WIDTH / 2, blockY + Config.BLOCK_HEIGHT / 2); // Draw orientation ID for debugging/visualization
            }
        }
    }
    // TODO: make this toggleable and add the option to the sidebar UI
    // GridRenderer.drawStaticGrid();
}

// --- Helper function to update a single block on the off-screen canvas ---
function updateStaticWorldAt(col, row) {
    const gridCtx = Renderer.getGridContext();
    if (!gridCtx) {
        console.error(`WorldManager: Cannot update static world at [${col}, ${row}] - grid context missing!`);
        return;
    }
    const block = WorldData.getBlock(col, row); // Get the *new* block data from the source
    const blockX = col * Config.BLOCK_WIDTH;
    const blockY = row * Config.BLOCK_HEIGHT;
// Use Math.ceil for width/height to avoid 1-pixel gaps when clearing/redrawing
    const blockW = Math.ceil(Config.BLOCK_WIDTH);
    const blockH = Math.ceil(Config.BLOCK_HEIGHT);
// 1. Clear the area of the changed block on the grid canvas, Math.floor for x/y positioning
    gridCtx.clearRect(Math.floor(blockX), Math.floor(blockY), blockW, blockH);
// 2. If the new block is not air, redraw it in the cleared area
    if (block && block !== Config.BLOCK_AIR) {
        const blockType = block.type;
        const blockColor = Config.BLOCK_COLORS[blockType];
        if (blockColor) {
            const orientation = block.orientation;
// Replicate the drawing logic from renderStaticWorldToGridCanvas
            if (orientation === Config.ORIENTATION_FULL) {
                gridCtx.fillStyle = blockColor;
                gridCtx.fillRect(Math.floor(blockX), Math.floor(blockY), blockW, blockH);
            } else {
// Placeholder drawing for non-full blocks
                 gridCtx.fillStyle = blockColor;
                 gridCtx.fillRect(Math.floor(blockX), Math.floor(blockY), blockW, blockH);
                 gridCtx.fillStyle = "rgba(0,0,0,0.2)";
                 gridCtx.font = '8px sans-serif';
                 gridCtx.textAlign = 'center';
                 gridCtx.textBaseline = 'middle';
                 gridCtx.fillText(orientation, blockX + Config.BLOCK_WIDTH / 2, blockY + Config.BLOCK_HEIGHT / 2);
            }
        } else {
             console.warn(`WorldManager: No color defined for block type ${blockType} at [${col}, ${row}] during update.`);
        }
    }
}

// --- Initialize World Manager ---
export function init() {
    console.time("WorldManager initialized");
    // Step 1: Initialize the grid data structure in WorldData
    WorldData.initializeGrid();
    // Step 2: Generate the initial world content into WorldData
    generateInitialWorld();
    // Step 3: Ensure the grid canvas exists (must be created by Renderer *before* this init runs)
    const gridCanvas = Renderer.getGridCanvas();
    if (!gridCanvas) {
        console.error("FATAL: WorldManager Init - Grid Canvas not found! Ensure Renderer.createGridCanvas() runs before World.init().");
        console.warn("WorldManager Init: Attempting fallback grid canvas creation.");
        Renderer.createGridCanvas();
        if (!Renderer.getGridCanvas()) {
            throw new Error("WorldManager Init: Fallback grid canvas creation failed.");
        }
    }
    // Step 4: Render the static world data onto the off-screen canvas
    renderStaticWorldToGridCanvas();
    console.timeEnd("WorldManager initialized");
}

// --- Getters and Setters ---

// Get the block object or BLOCK_AIR at specific grid coordinates
export function getBlock(col, row) {
    return WorldData.getBlock(col, row);
}
// Get block type ID at specific grid coordinates.
export function getBlockType(col, row) {
    return WorldData.getBlockType(col, row);
}

// Sets a block in the grid using type and orientation. Updates the underlying world data AND the static visual cache.
export function setBlock(col, row, blockType, orientation = Config.ORIENTATION_FULL) {
    // Step 1: Update the actual world data
    const success = WorldData.setBlock(col, row, blockType, orientation); // Delegate
    // Step 2: If data update was successful, update the visual cache
    if (success) {
        updateStaticWorldAt(col, row); // Update the corresponding part of the static off-screen canvas
    }
    else { console.error(`WorldManager: Failed to set block data at ${col}, ${row}`); }
    return success;
}

// --- Block Interaction ---

// Applies damage to a block at the given coordinates. If block HP drops to 0, it's replaced with air and drops an item.
export function damageBlock(col, row, damageAmount) {
    if (damageAmount <= 0) return false; // No damage dealt
    const block = WorldData.getBlock(col, row); // Get the block data object
    // Check if block is valid, breakable, and not already air/water
    if (!block || typeof block !== 'object' || block.type === Config.BLOCK_AIR || block.type === Config.BLOCK_WATER || !block.hasOwnProperty('hp') || block.hp === Infinity) {
        // console.log(`Block at [${col}, ${row}] is unbreakable or invalid.`);
        return false; // Cannot damage air, water, out-of-bounds, or blocks without finite HP
    }
    // Apply damage
    block.hp -= damageAmount;
    // console.log(`Damaged block [${col}, ${row}] (${Config.BLOCK_TYPE_NAMES[block.type]}). New HP: ${block.hp}/${block.maxHp}`); // Add BLOCK_TYPE_NAMES to config if needed
    // Check for destruction
    if (block.hp <= 0) {
        // console.log(`Block [${col}, ${row}] destroyed!`);
        const blockTypeDestroyed = block.type; // Store type before replacing
        // --- Determine Drop Type ---
        let dropType = null;
        switch (blockTypeDestroyed) {
            case Config.BLOCK_GRASS: dropType = 'dirt'; break; // Grass drops dirt
            case Config.BLOCK_DIRT:  dropType = 'dirt'; break;
            case Config.BLOCK_STONE: dropType = 'stone'; break;
            case Config.BLOCK_SAND:  dropType = 'sand'; break;
            case Config.BLOCK_WOOD: dropType = 'wood'; break; 
            // Add cases for other breakable blocks that should drop items
        }
        // --- Spawn Drop Item (if any) ---
        if (dropType) {
            const dropX = col * Config.BLOCK_WIDTH + (Config.BLOCK_WIDTH / 2) - (Config.ITEM_CONFIG[dropType]?.width / 2 || Config.BLOCK_WIDTH / 2); // Center item
            const dropY = row * Config.BLOCK_HEIGHT + (Config.BLOCK_HEIGHT / 2) - (Config.ITEM_CONFIG[dropType]?.height / 2 || Config.BLOCK_HEIGHT / 2); // Center item
            // Add small random offset
            const offsetX = (Math.random() - 0.5) * Config.BLOCK_WIDTH * 0.5;
            const offsetY = (Math.random() - 0.5) * Config.BLOCK_HEIGHT * 0.5;
            ItemManager.spawnItem(dropX + offsetX, dropY + offsetY, dropType);
            // console.log(` > Spawning ${dropType} at ~${dropX.toFixed(1)}, ${dropY.toFixed(1)}`);
        }
        // --- Replace Block with Air ---
        // Use the worldManager's setBlock to ensure the visual cache is updated
        setBlock(col, row, Config.BLOCK_AIR);
    } else {
        // Block was damaged but not destroyed, might need visual feedback later (cracks?)
        // For now, just need to ensure the HP change is saved if block objects are structs/copied
        // (JavaScript passes objects by reference, so modifying block.hp modifies the one in worldGrid)
    }
    return true; // Damage was applied or block was destroyed
}

// --- Draw the pre-rendered static world onto  main canvas  ---
export function draw(ctx) {
    if (!ctx) { console.error("WorldManager.draw: No drawing context provided!"); return; }

    const gridCanvas = Renderer.getGridCanvas();

    if (gridCanvas) {
        // Draw the entire off-screen canvas containing the pre-rendered static world
        // TODO: Add camera/viewport adjustments here for scrolling
        // Example: ctx.drawImage(gridCanvas, startCol * Config.BLOCK_WIDTH, startRow * Config.BLOCK_HEIGHT, viewWidth, viewHeight, -camera.x, -camera.y, viewWidth, viewHeight);
        ctx.drawImage(gridCanvas, 0, 0); // Simple draw at origin for now
    } else {
        console.error("WorldManager.draw: Cannot draw world, grid canvas is not available!");
    }
}

// --- Update World Effects ---
// Placeholder to update world state over time (e.g., water flow, grass spread, block decay). 
//  IMPORTANT: Any block changes made here MUST call updateStaticWorldAt(c, r).
export function update(dt) {
    // Example (Conceptual):
    // if (shouldGrassSpread) {
    //    for (/* each dirt block next to grass */) {
    //       if (Math.random() < GRASS_SPREAD_CHANCE * dt) {
    //          const { c, r } = /* coordinates of dirt block */;
    //          // Update the data AND the visual cache
    //          setBlock(c, r, Config.BLOCK_GRASS); // setBlock handles calling updateStaticWorldAt
    //       }
    //    }
    // }
}