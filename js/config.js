// -----------------------------------------------------------------------------
// js/config.js - Centralized Game Configuration
// -----------------------------------------------------------------------------
console.log("config.js loaded");

// --- World Parameters ---
export const CANVAS_WIDTH = 800; // Match canvas element width
export const CANVAS_HEIGHT = 800; // Match canvas element height

// --- Grid Constants ---
export const GRID_COLS = 200; // Updated size
export const GRID_ROWS = 200; // Updated size

// --- Block Constants ---
export const BLOCK_WIDTH = CANVAS_WIDTH / GRID_COLS;   // Now 8 pixels wide
export const BLOCK_HEIGHT = CANVAS_HEIGHT / GRID_ROWS; // Now 8 pixels high

// --- Block Type IDs ---
export const BLOCK_AIR = 0;
export const BLOCK_WATER = 1;
export const BLOCK_SAND = 2;
export const BLOCK_DIRT = 3;
export const BLOCK_GRASS = 4;
export const BLOCK_STONE = 5;
export const BLOCK_WOOD_WALL = 6;
export const BLOCK_METAL = 7;
// Add more later: GLASS, specific ores, etc.

// --- Block Orientation IDs ---
// Implement drawing/collision later
export const ORIENTATION_FULL = 0;
export const ORIENTATION_SLOPE_BL = 1; // Bottom-Left triangle solid
export const ORIENTATION_SLOPE_BR = 2; // Bottom-Right triangle solid
export const ORIENTATION_SLOPE_TR = 3; // Top-Right triangle solid
export const ORIENTATION_SLOPE_TL = 4; // Top-Left triangle solid

// --- Block Base HP ---
export const BLOCK_HP = {
    [BLOCK_WATER]: Infinity,
    [BLOCK_SAND]: 30,
    [BLOCK_DIRT]: 50,
    [BLOCK_GRASS]: 50,
    [BLOCK_STONE]: 300,
    [BLOCK_WOOD_WALL]: 100,
    [BLOCK_METAL]: 500,
// Add HP for other types later
};

// --- Block Colors ---
export const BLOCK_COLORS = {
    // BLOCK_AIR is background color
    [BLOCK_WATER]: 'rgb(50, 100, 200)',
    [BLOCK_SAND]: 'rgb(210, 180, 140)',
    [BLOCK_DIRT]: 'rgb(130, 82, 45)',
    [BLOCK_GRASS]: 'rgb(80, 180, 80)',
    [BLOCK_STONE]: 'rgb(140, 140, 140)',
    [BLOCK_WOOD_WALL]: 'rgb(160, 110, 70)',
    [BLOCK_METAL]: 'rgb(190, 190, 200)',
};

// --- Procedural Generation Parameters ---
export const WORLD_ISLAND_WIDTH_PERCENT = 0.8;
export const WORLD_WATER_LEVEL_PERCENT_FROM_BOTTOM = 0.15; // Water covers bottom 15%
export const WORLD_WATER_LEVEL_ROW_TARGET = Math.floor(GRID_ROWS * (1.0 - WORLD_WATER_LEVEL_PERCENT_FROM_BOTTOM));
export const WORLD_GROUND_LEVEL_MEAN = WORLD_WATER_LEVEL_ROW_TARGET - Math.floor(GRID_ROWS * 0.10); // e.g., 10% of height above water
export const WORLD_STONE_LEVEL_MEAN = WORLD_GROUND_LEVEL_MEAN + Math.floor(GRID_ROWS * 0.15); // e.g., 15% below ground
export const WORLD_GROUND_VARIATION = 3;
export const WORLD_STONE_VARIATION = 3;
export const WORLD_NOISE_SCALE = 0.05;

// =============================================================================
// --- Player Constants ---
// =============================================================================
export const PLAYER_WIDTH = Math.max(5, Math.floor(1.25 * BLOCK_WIDTH)); // Approx 10px
export const PLAYER_HEIGHT = Math.max(8, Math.floor(2.5 * BLOCK_HEIGHT)); // Approx 20px
export const PLAYER_START_X = CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2;
export const PLAYER_START_Y = (WORLD_GROUND_LEVEL_MEAN * BLOCK_HEIGHT) - PLAYER_HEIGHT - (3 * BLOCK_HEIGHT);
export const PLAYER_COLOR = 'rgb(200, 50, 50)';

// --- Player Health & Combat ---
export const PLAYER_INITIAL_HEALTH = 3;
export const PLAYER_MAX_HEALTH = 10;
export const PLAYER_INVULNERABILITY_DURATION = 2.0; // seconds
export const PLAYER_ATTACK_DURATION = 0.25; // seconds
export const PLAYER_ATTACK_COOLDOWN = 0.4; // seconds
export const PLAYER_ATTACK_DAMAGE = 1;
export const PLAYER_ATTACK_REACH_X = Math.floor(2.25 * BLOCK_WIDTH); // Approx 18px
export const PLAYER_ATTACK_REACH_Y = 0;
export const PLAYER_ATTACK_WIDTH = Math.floor(1.25 * BLOCK_WIDTH); // Approx 10px
export const PLAYER_ATTACK_HEIGHT = PLAYER_HEIGHT;
export const PLAYER_ATTACK_COLOR = 'rgba(255, 255, 255, 0.5)';

// --- Player Physics (Delta-Time Based - TUNING REQUIRED!) ---
export const PLAYER_MOVE_ACCELERATION = 800; // Pixels per second per second (Increase for faster acceleration)
export const PLAYER_MAX_SPEED_X = 120;     // Pixels per second (Top horizontal speed)
export const PLAYER_FRICTION_BASE = 0.05;  // Base friction multiplier (0=instant stop, 1=no friction). Used as Math.pow(PLAYER_FRICTION_BASE, dt). Lower values = stronger friction.
export const PLAYER_JUMP_VELOCITY = 280;   // Pixels per second (Initial upward velocity) - *** TUNE THIS! ***
// Optional: Add jump cutoff multiplier if implementing variable jump height
// export const PLAYER_JUMP_CUTOFF_MULTIPLIER = 0.4; // Reduce upward velocity to this fraction when jump key released


// =============================================================================
// --- Enemy Constants ---
// =============================================================================
export const ENEMY_WIDTH = Math.floor(1.5 * BLOCK_WIDTH);
export const ENEMY_HEIGHT = Math.floor(2.25 * BLOCK_HEIGHT);
// export const ENEMY_COLOR = 'rgb(80, 150, 80)'; // Color moved to STATS
// export const ENEMY_HEALTH = 1;               // Health moved to STATS
// export const ENEMY_TARGET_X = CANVAS_WIDTH / 2; // Target is now dynamic in AI

// --- Enemy Types ---
export const ENEMY_TYPE_CENTER_SEEKER = 'center_seeker';
export const ENEMY_TYPE_PLAYER_CHASER = 'player_chaser';

// --- Stats per Enemy Type ---
export const ENEMY_STATS = {
    [ENEMY_TYPE_CENTER_SEEKER]: {
        color: 'rgb(80, 150, 80)',   // Original green
        maxSpeedX: 40,               // Pixels per second
        health: 1,
        // Add other specific stats later if needed (e.g., damage)
    },
    [ENEMY_TYPE_PLAYER_CHASER]: {
        color: 'rgb(150, 80, 80)',   // Reddish
        maxSpeedX: 55,               // Slightly faster chaser
        health: 2,                   // Maybe slightly tougher
    }
};
// Ensure ENEMY_STATS includes entries for all defined types above!

// --- NEW: Enemy Separation Behavior ---
export const ENEMY_SEPARATION_RADIUS_FACTOR = 0.7; // Check for overlap within X% of enemy width
export const ENEMY_SEPARATION_STRENGTH = 0.4;   // How strongly to push apart (0 to 1). Adjust for desired effect.

export const ENEMY_CONTACT_DAMAGE = 1; // Keep general contact damage for now
export const ENEMY_DROP_TYPE = 'wood';
export const ENEMY_DROP_AMOUNT = 1;
export const ENEMY_DROP_CHANCE = 1.0;
export const MAX_ENEMIES = 100;
export const ENEMY_SPAWN_EDGE_MARGIN = 80;

// =============================================================================
// --- Item Constants ---
// =============================================================================
export const SWORD_WIDTH = Math.floor(3 * BLOCK_WIDTH); // Approx 24px
export const SWORD_HEIGHT = Math.floor(1 * BLOCK_HEIGHT); // Approx 8px
export const SWORD_COLOR = 'rgb(180, 180, 190)';
export const WOOD_ITEM_WIDTH = Math.floor(1 * BLOCK_WIDTH); // Approx 8px
export const WOOD_ITEM_HEIGHT = Math.floor(1 * BLOCK_HEIGHT); // Approx 8px
export const WOOD_ITEM_COLOR = 'rgb(139, 69, 19)';
export const ITEM_BOBBLE_AMOUNT = 0.15; // How much items bob (relative to height)
export const ITEM_BOBBLE_SPEED = 2.0;   // Radians per second for bobbing cycle

// --- Item Physics (Delta-Time Based) ---
// Items use general GRAVITY_ACCELERATION
// Optional: Define specific item fall speed or friction if needed
// export const ITEM_MAX_FALL_SPEED = 300;
// export const ITEM_FRICTION_BASE = 0.2; // If items should slide


// =============================================================================
// --- General Physics Constants (Delta-Time Based) ---
// =============================================================================
export const GRAVITY_ACCELERATION = 700;   // Pixels per second per second - *** TUNE THIS! *** Affects player, enemies, items unless overridden.
export const MAX_FALL_SPEED = 450;         // Pixels per second - General max fall speed unless overridden


// =============================================================================
// --- Wave System Constants ---
// =============================================================================
export const WAVE_START_DELAY = 20.0; // Seconds before first wave
export const WAVE_INTERMISSION_DURATION = 20.0; // Seconds between waves
export const WAVE_1_ENEMY_COUNT = 15;
export const WAVE_ENEMY_SPAWN_DELAY = 0.5; // Seconds between enemy spawns in a wave

// =============================================================================
// --- UI Constants ---
// =============================================================================
export const UI_AREA_HEIGHT = 30; // Height reserved for UI at the top
export const UI_HEALTH_BOX_SIZE = 15;
export const UI_HEALTH_BOX_PADDING = 4;
export const UI_HEALTH_LABEL_X = 10;
export const UI_HEALTH_BOX_START_X = 80;
export const UI_Y_POSITION = 8;

// --- Rendering & Colors ---
export const BACKGROUND_COLOR = 'rgb(135, 206, 235)'; // Sky Blue
export const UI_HEALTH_BOX_COLOR_EMPTY = 'rgb(80, 80, 80)';
export const UI_HEALTH_BOX_COLOR_FULL = 'rgb(220, 40, 40)';
export const UI_TEXT_COLOR = 'black';

// Game Over Screen
export const UI_GAMEOVER_OVERLAY_COLOR = 'rgba(0, 0, 0, 0.75)';
export const UI_GAMEOVER_TEXT_COLOR = 'red';
export const UI_GAMEOVER_STATS_COLOR = 'white';
export const UI_GAMEOVER_BUTTON_COLOR = 'darkred';
export const UI_GAMEOVER_BUTTON_TEXT_COLOR = 'white';
export const UI_GAMEOVER_BUTTON_WIDTH = 180;
export const UI_GAMEOVER_BUTTON_HEIGHT = 50;

// =============================================================================
// --- Game Loop ---
// =============================================================================
export const MAX_DELTA_TIME = 0.05; // Max time step (seconds) to prevent physics glitches (~1/20th second or 20fps minimum simulation rate)

// =============================================================================