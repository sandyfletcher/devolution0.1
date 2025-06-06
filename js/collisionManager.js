// -----------------------------------------------------------------------------
// root/js/collisionManager.js - Collision handling
// -----------------------------------------------------------------------------

import * as Config from './utils/config.js';
import * as WorldManager from './worldManager.js';
import * as GridCollision from './utils/gridCollision.js';

function _checkRectOverlap(rect1, rect2) {
    if (!rect1 || !rect2) {
    console.warn("Collision check skipped: Invalid rect provided.", rect1, rect2);
    return false;
    }
    if (typeof rect1.x !== 'number' || typeof rect1.y !== 'number' || typeof rect1.width !== 'number' || typeof rect1.height !== 'number' ||
        typeof rect2.x !== 'number' || typeof rect2.y !== 'number' || typeof rect2.width !== 'number' || typeof rect2.height !== 'number' ||
        isNaN(rect1.x) || isNaN(rect1.y) || isNaN(rect1.width) || isNaN(rect1.height) ||
        isNaN(rect2.x) || isNaN(rect2.y) || isNaN(rect2.width) || isNaN(rect2.height)) {
        console.warn("Collision check skipped: Rect properties are not valid numbers.", rect1, rect2);
        return false;
    }
    return rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y;
}
function _sign(p1, p2, p3) { // triangulate sign 
    return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
}
function _pointInTriangle(pt, v1, v2, v3) { // checks if point is inside triangle
    const d1 = _sign(pt, v1, v2);
    const d2 = _sign(pt, v2, v3);
    const d3 = _sign(pt, v3, v1);
    const has_neg = (d1 < 0) || (d2 < 0) || (d3 < 0);
    const has_pos = (d1 > 0) || (d2 > 0) || (d3 > 0);
    return !(has_neg && has_pos);
}
function _lineLineIntersection(x1, y1, x2, y2, x3, y3, x4, y4) { // check line segment intersection
    const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (den === 0) return null; // parallel or coincident
        const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
        const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den;
        if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
        return {
            x: x1 + t * (x2 - x1),
            y: y1 + t * (y2 - y1)
        };
    }
    return null;
}
function _triangleIntersectsAABB(triangleVertices, aabb) { // checks if a triangle intersects an Axis-Aligned Bounding Box
    if (!triangleVertices || triangleVertices.length !== 3 || !aabb) return false;
    for (const v of triangleVertices) { // 1. check if any triangle vertex is inside AABB
        if (v.x >= aabb.x && v.x <= aabb.x + aabb.width &&
            v.y >= aabb.y && v.y <= aabb.y + aabb.height) {
            return true;
        }
    }
    const aabbCorners = [ // 2. check if any AABB corner is inside triangle
        { x: aabb.x, y: aabb.y },
        { x: aabb.x + aabb.width, y: aabb.y },
        { x: aabb.x, y: aabb.y + aabb.height },
        { x: aabb.x + aabb.width, y: aabb.y + aabb.height }
    ];
    for (const corner of aabbCorners) {
        if (_pointInTriangle(corner, triangleVertices[0], triangleVertices[1], triangleVertices[2])) {
            return true;
        }
    }
    const triEdges = [ // 3. check for line segment intersections (triangle edges vs AABB edges)
        [triangleVertices[0], triangleVertices[1]],
        [triangleVertices[1], triangleVertices[2]],
        [triangleVertices[2], triangleVertices[0]]
    ];
    const aabbEdges = [
        [aabbCorners[0], aabbCorners[1]], // top
        [aabbCorners[1], aabbCorners[3]], // right
        [aabbCorners[3], aabbCorners[2]], // bottom
        [aabbCorners[2], aabbCorners[0]]  // left
    ];
    for (const triEdge of triEdges) {
        for (const aabbEdge of aabbEdges) {
            if (_lineLineIntersection(
                triEdge[0].x, triEdge[0].y, triEdge[1].x, triEdge[1].y,
                aabbEdge[0].x, aabbEdge[0].y, aabbEdge[1].x, aabbEdge[1].y
            )) {
                return true;
            }
        }
    }
    return false;
}
function _getTriangleAABB(vertices) { // get AABB of a triangle
    if (!vertices || vertices.length < 3) return null;
    const minX = Math.min(...vertices.map(v => v.x));
    const maxX = Math.max(...vertices.map(v => v.x));
    const minY = Math.min(...vertices.map(v => v.y));
    const maxY = Math.max(...vertices.map(v => v.y));
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}
export function checkPlayerItemCollisions(player, items, itemManager) { // check for collisions between player and items
    if (!player || !player.isActive || player.isDying || !items || !itemManager) return;
    const playerRect = player.getRect();
    for (let i = items.length - 1; i >= 0; i--) { // loop backwards for safe removal
        const item = items[i];
        if (!item || !item.isActive) continue; // item must be active
        const itemRect = item.getRect();
        if (_checkRectOverlap(playerRect, itemRect)) {
            const pickedUp = player.pickupItem(item); // collision detected, attempt pickup
            if (pickedUp) {
                itemManager.removeItem(item);
            }
        }
    }
}
export function checkPlayerAttackEnemyCollisions(player, enemies) {
    const currentEnemyDamage = player?.getCurrentAttackDamage() ?? 0;
    if (!player || !player.isActive || player.isDying || !player.isAttacking || currentEnemyDamage <= 0) { return; }
    const attackHitboxData = player.getAttackHitbox();
    if (!attackHitboxData) return;
    for (const enemy of enemies) {
        if (!enemy || !enemy.isActive || enemy.isDying) continue;
        const enemyRect = enemy.getRect();
        let collisionDetected = false;
        if (attackHitboxData.type === 'rect') {
            collisionDetected = _checkRectOverlap(attackHitboxData.bounds, enemyRect);
        } else if (attackHitboxData.type === 'triangle') {
            collisionDetected = _triangleIntersectsAABB(attackHitboxData.vertices, enemyRect);
        } else if (attackHitboxData.type === 'polygon' && attackHitboxData.vertices.length === 4) { // Handle quad polygon (e.g., sword blade)
            const v = attackHitboxData.vertices;
            // Check as two triangles
            collisionDetected = _triangleIntersectsAABB([v[0], v[1], v[2]], enemyRect) || 
                                _triangleIntersectsAABB([v[0], v[2], v[3]], enemyRect);
        }

        if (collisionDetected) {
            if (!player.hasHitEnemyThisSwing(enemy)) {
                enemy.takeDamage(currentEnemyDamage);
                player.registerHitEnemy(enemy);

                // --- Add Knockback ---
                const knockbackStrength = player.getCurrentWeaponKnockback();
                const knockbackStunDuration = player.getCurrentWeaponKnockbackStunDuration();

                if (knockbackStrength > 0 || knockbackStunDuration > 0) {
                    const playerRectForKnockback = player.getRect(); 
                    const playerCenterX = playerRectForKnockback.x + playerRectForKnockback.width / 2;
                    const playerCenterY = playerRectForKnockback.y + playerRectForKnockback.height / 2;

                    const enemyCenterX = enemyRect.x + enemyRect.width / 2; 
                    const enemyCenterY = enemyRect.y + enemyRect.height / 2;

                    const knockbackDirX = enemyCenterX - playerCenterX;
                    const knockbackDirY = enemyCenterY - playerCenterY;
                    
                    enemy.applyKnockback(knockbackDirX, knockbackDirY, knockbackStrength, knockbackStunDuration);
                }

            }
        }
    }
}

export function checkPlayerAttackBlockCollisions(player) {
    const currentBlockDamage = player?.getCurrentBlockDamage() ?? 0;
    if (!player || !player.isActive || player.isDying || !player.isAttacking || currentBlockDamage <= 0) { return; }
    const attackHitboxData = player.getAttackHitbox();
    if (!attackHitboxData) return;
    let minCol, maxCol, minRow, maxRow;
    if (attackHitboxData.type === 'rect') { // determine broad phase check area based on hitbox AABB
        const attackRect = attackHitboxData.bounds;
        minCol = Math.max(0, Math.floor(attackRect.x / Config.BLOCK_WIDTH));
        maxCol = Math.min(Config.GRID_COLS - 1, Math.floor((attackRect.x + attackRect.width) / Config.BLOCK_WIDTH));
        minRow = Math.max(0, Math.floor(attackRect.y / Config.BLOCK_HEIGHT));
        maxRow = Math.min(Config.GRID_ROWS - 1, Math.floor((attackRect.y + attackRect.height) / Config.BLOCK_HEIGHT));
    } else if (attackHitboxData.type === 'triangle') {
        const triangleAABB = _getTriangleAABB(attackHitboxData.vertices);
        if (!triangleAABB) return;
        minCol = Math.max(0, Math.floor(triangleAABB.x / Config.BLOCK_WIDTH));
        maxCol = Math.min(Config.GRID_COLS - 1, Math.floor((triangleAABB.x + triangleAABB.width) / Config.BLOCK_WIDTH));
        minRow = Math.max(0, Math.floor(triangleAABB.y / Config.BLOCK_HEIGHT));
        maxRow = Math.min(Config.GRID_ROWS - 1, Math.floor((triangleAABB.y + triangleAABB.height) / Config.BLOCK_HEIGHT));
    } else if (attackHitboxData.type === 'polygon' && attackHitboxData.vertices.length === 4) {
        const polygonAABB = _getTriangleAABB(attackHitboxData.vertices); // _getTriangleAABB works for polygon vertex list too
        if (!polygonAABB) return;
        minCol = Math.max(0, Math.floor(polygonAABB.x / Config.BLOCK_WIDTH));
        maxCol = Math.min(Config.GRID_COLS - 1, Math.floor((polygonAABB.x + polygonAABB.width) / Config.BLOCK_WIDTH));
        minRow = Math.max(0, Math.floor(polygonAABB.y / Config.BLOCK_HEIGHT));
        maxRow = Math.min(Config.GRID_ROWS - 1, Math.floor((polygonAABB.y + polygonAABB.height) / Config.BLOCK_HEIGHT));
    } else {
        return; // unknown hitbox type
    }
    for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
            if (!player.hasHitBlockThisSwing(c, r)) {
                const blockRect = {
                    x: c * Config.BLOCK_WIDTH,
                    y: r * Config.BLOCK_HEIGHT,
                    width: Config.BLOCK_WIDTH,
                    height: Config.BLOCK_HEIGHT
                };
                let blockCollisionDetected = false;
                if (attackHitboxData.type === 'rect') { // This case should not be for shovel/spear/sword ideally
                    blockCollisionDetected = _checkRectOverlap(attackHitboxData.bounds, blockRect);
                } else if (attackHitboxData.type === 'triangle') {
                    blockCollisionDetected = _triangleIntersectsAABB(attackHitboxData.vertices, blockRect);
                } else if (attackHitboxData.type === 'polygon' && attackHitboxData.vertices.length === 4) {
                    const v = attackHitboxData.vertices;
                    blockCollisionDetected = _triangleIntersectsAABB([v[0], v[1], v[2]], blockRect) || _triangleIntersectsAABB([v[0], v[2], v[3]], blockRect);
                }
                if (blockCollisionDetected) {
                    const damaged = WorldManager.damageBlock(c, r, currentBlockDamage);
                    if (damaged) {
                        player.registerHitBlock(c, r);
                    }
                }
            }
        }
    }
}
export function checkPlayerEnemyCollisions(player, enemies) { // check for collisions between player and enemies (contact damage)
    if (!player || !player.isActive || player.isDying || player.isInvulnerable || !enemies) { return; }
    const playerRect = player.getRect();
    for (const enemy of enemies) {
        if (!enemy || !enemy.isActive || enemy.isDying || enemy.isBeingAbsorbed) {
        continue; // enemy must be active to deal damage
        }
        if (_checkRectOverlap(playerRect, enemy.getRect())) { // collision detected: get current contact damage
            const damageAmount = enemy.getCurrentContactDamage();
            if (damageAmount > 0) { // only apply damage if determined amount is positive
                player.takeDamage(damageAmount); // handles invulnerability and death
                break; // prevent multiple damage instances.
            }
        }
    }
}

export function checkProjectileEnemyCollisions(projectiles, enemies, player) {
    if (!projectiles || projectiles.length === 0 || !enemies || enemies.length === 0) return;

    for (const p of projectiles) {
        if (!p.isActive || p.isStuck || p.owner !== player) continue;

        const pRect = p.getRect();
        for (const e of enemies) {
            if (!e.isActive || e.isDying) continue;

            const eRect = e.getRect();
            if (_checkRectOverlap(pRect, eRect)) {
                e.takeDamage(p.damage);
                p.isActive = false; // Arrow is used up
                break; // One arrow hits one enemy
            }
        }
    }
}

export function checkProjectileBlockCollisions(projectiles) {
    if (!projectiles || projectiles.length === 0) return;

    for (const p of projectiles) {
        if (!p.isActive || p.isStuck) continue;

        // Check the tip of the projectile for simplicity
        const tipX = p.x + (p.width / 2) * Math.cos(p.rotation);
        const tipY = p.y + (p.width / 2) * Math.sin(p.rotation);

        const { col, row } = GridCollision.worldToGridCoords(tipX, tipY);

        if (GridCollision.isSolid(col, row)) {
            p.stickInBlock(col, row);
        }
    }
}

export function checkEnemyPortalCollisions(enemies, portal) {
    if (!portal || !portal.isAlive() || !enemies) { return; }
    const portalRect = portal.getRect();
    for (const enemy of enemies) {
        if (!enemy || !enemy.isActive || enemy.isDying || enemy.isBeingAbsorbed) {
            continue;
        }
        if (_checkRectOverlap(enemy.getRect(), portalRect)) {
            const damageAmount = enemy.stats?.contactDamage ?? 1;
            if (damageAmount > 0) { // portal only takes damage once
                portal.takeDamage(damageAmount);
            }
            portal.startAbsorbing(enemy);
        }
    }
}

export function checkPlayerProjectileCollisions(player, projectiles) {
    if (!player || !player.isActive || player.isDying || !projectiles || projectiles.length === 0) return;
    const playerRect = player.getRect();
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        if (!p || !p.isActive || !p.isStuck) continue; // Only check for stuck projectiles

        const pRect = p.getRect();
        if (_checkRectOverlap(playerRect, pRect)) {
            const pickedUp = player.pickupItem({ type: 'arrows' }); // The inventory material type is 'arrows'
            if (pickedUp) {
                p.isActive = false; // Deactivate the projectile so it gets removed by the manager
            }
        }
    }
}