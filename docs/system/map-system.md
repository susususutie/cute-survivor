# 🗺️ 地图生成系统 - 详细设计

> **文件版本**: v0.1
> **最后更新**: 2026-03-26
> **状态**: MVP精简版，未来扩展

---

## 一、系统概述

### 1.1 设计目标

- 🎯 饥荒式随机地图生成
- 🎯 种子系统：相同种子生成相同地图
- 🎯 多种地形和区域类型
- 🎯 资源点按地形聚集分布
- 🎯 支持地图尺寸选择

### 1.2 MVP目标

**初版实现**：

- 基础地形生成（草地、岩石、水域）
- 聚落随机分布
- 资源点简单分布
- 种子复现功能

---

## 二、种子系统

### 2.1 核心原理

```
┌─────────────────────────────────────────────────────────┐
│                    确定性随机数生成器                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  输入: seed = "abc123"                                │
│        ↓                                               │
│  ┌───────────────────────────────────────────────────┐ │
│  │  Seeded Random Number Generator (SRNG)           │ │
│  │                                                   │ │
│  │  相同种子 + 相同算法 = 相同输出                  │ │
│  │  不同种子 = 不同输出                             │ │
│  │                                                   │ │
│  └───────────────────────────────────────────────────┘ │
│        ↓                                               │
│  输出: 完整确定的地图数据                              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 2.2 技术实现

```typescript
// 确定性随机数生成器
class SeededRandom {
  private seed: number

  constructor(seed: string) {
    // 将字符串seed转换为数字
    this.seed = this.hashString(seed)
  }

  // 获取下一个随机数 [0, 1)
  next(): number {
    // Linear Congruential Generator (LCG)
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296
    return this.seed / 4294967296
  }

  // 获取范围内随机整数 [min, max]
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min
  }

  // 字符串hash
  private hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash)
  }
}
```

### 2.3 使用方式

```typescript
// 创建地图时
const worldGenerator = new WorldGenerator()
const seed = userInput || generateRandomSeed() // 用户输入或随机生成
const mapData = worldGenerator.generate(seed, mapSize)

// 重新加载存档时
const mapData = worldGenerator.generate(savedSeed, savedSize)
// 结果与之前完全相同
```

---

## 三、地图尺寸规格

### 3.1 尺寸选项

| 尺寸 | 网格数  | 实际大小(单位) | 推荐用途 | MVP实现 |
| ---- | ------- | -------------- | -------- | ------- |
| 小型 | 50×50   | 500×500        | 快速战斗 | ✅      |
| 中型 | 100×100 | 1000×1000      | 标准探索 | ✅      |
| 大型 | 200×200 | 2000×2000      | 深度探索 | ❌      |
| 超大 | 400×400 | 4000×4000      | 开放世界 | ❌      |

### 3.2 尺寸影响

```typescript
interface MapSizeConfig {
  gridSize: number // 网格数量
  worldSize: number // 世界实际大小
  campDensity: number // 聚落密度
  resourceDensity: number // 资源密度
  spawnPadding: number // 出生点边距
}

const sizeConfigs: Record<MapSize, MapSizeConfig> = {
  small: {
    gridSize: 50,
    worldSize: 500,
    campDensity: 0.3, // 每100单位1个聚落
    resourceDensity: 0.5,
    spawnPadding: 30,
  },
  medium: {
    gridSize: 100,
    worldSize: 1000,
    campDensity: 0.25,
    resourceDensity: 0.4,
    spawnPadding: 50,
  },
  large: {
    gridSize: 200,
    worldSize: 2000,
    campDensity: 0.2,
    resourceDensity: 0.3,
    spawnPadding: 80,
  },
  huge: {
    gridSize: 400,
    worldSize: 4000,
    campDensity: 0.15,
    resourceDensity: 0.25,
    spawnPadding: 100,
  },
}
```

---

## 四、地形系统

### 4.1 MVP地形类型

| 地形 | 通行 | 移动速度 | 特点             | MVP实现 |
| ---- | ---- | -------- | ---------------- | ------- |
| 草地 | ✅   | 100%     | 标准地形         | ✅      |
| 岩石 | ❌   | -        | 不可通行，障碍物 | ✅      |
| 水域 | ❌   | -        | 不可通行         | ✅      |
| 沙地 | ✅   | 90%      | 移动减速         | ❌      |
| 泥地 | ✅   | 70%      | 移动大幅减速     | ❌      |

### 4.2 地形数据

```typescript
interface TerrainTile {
  type: TerrainType
  walkable: boolean
  moveSpeedMultiplier: number
  skinId: string
  resourceTags: string[] // 可产出什么资源
}

const terrainData: Record<TerrainType, TerrainTile> = {
  grass: {
    type: 'grass',
    walkable: true,
    moveSpeedMultiplier: 1.0,
    skinId: 'grass_default',
    resourceTags: ['herb', 'flower'],
  },

  rock: {
    type: 'rock',
    walkable: false,
    moveSpeedMultiplier: 0,
    skinId: 'rock_default',
    resourceTags: ['stone', 'ore'],
  },

  water: {
    type: 'water',
    walkable: false,
    moveSpeedMultiplier: 0,
    skinId: 'water_default',
    resourceTags: ['fish', 'pearl'],
  },
}
```

### 4.3 地形生成算法

```typescript
// 使用Perlin噪声生成地形
function generateTerrain(rng: SeededRandom, size: number, options: TerrainOptions): TerrainTile[][] {
  const terrain: TerrainTile[][] = []

  // 1. 生成基础噪声图
  const noiseMap = generatePerlinNoise(size, size, {
    scale: options.noiseScale,
    octaves: options.octaves,
    persistence: options.persistence,
  })

  // 2. 根据噪声值分配地形
  for (let y = 0; y < size; y++) {
    terrain[y] = []
    for (let x = 0; x < size; x++) {
      const noiseValue = noiseMap[y][x]
      terrain[y][x] = assignTerrainType(noiseValue, options)
    }
  }

  // 3. 后处理：确保出生点周围可通行
  ensureSpawnAreaWalkable(terrain, size)

  return terrain
}

function assignTerrainType(noiseValue: number, options: TerrainOptions): TerrainTile {
  // 噪声值范围 [0, 1]
  if (noiseValue < options.waterThreshold) {
    return terrainData.water
  } else if (noiseValue < options.rockThreshold) {
    return terrainData.grass
  } else {
    return terrainData.rock
  }
}
```

---

## 五、区域系统

### 5.1 MVP区域类型

| 区域类型 | 包含地形  | 特点     | 敌人聚落 | 资源       | MVP实现 |
| -------- | --------- | -------- | -------- | ---------- | ------- |
| 草地平原 | 草地为主  | 安全区域 | 野兽巢穴 | 草药、花   | ✅      |
| 废墟区域 | 草地+岩石 | 危险区域 | 机械工厂 | 矿石、金属 | ✅      |
| 水域湖泊 | 水域为主  | 不可进入 | 无       | 珍珠、鱼   | ❌      |

### 5.2 区域生成

```typescript
interface Region {
  id: string
  type: RegionType
  bounds: {
    x: number
    y: number
    width: number
    height: number
  }
  centerPosition: { x: number; y: number }
}

function generateRegions(rng: SeededRandom, terrain: TerrainTile[][], options: RegionOptions): Region[] {
  const regions: Region[] = []

  // 1. 确定区域数量
  const regionCount = options.minRegions + rng.nextInt(0, options.maxRegions - options.minRegions)

  // 2. 使用Voronoi图分割区域
  const seedPoints = generateSeedPoints(rng, regionCount, terrain)

  // 3. 为每个区域分配类型
  for (const point of seedPoints) {
    const terrainType = getDominantTerrain(terrain, point)
    regions.push({
      id: generateRegionId(),
      type: assignRegionType(terrainType, rng),
      bounds: calculateBounds(point),
      centerPosition: point,
    })
  }

  return regions
}
```

---

## 六、资源分布系统

### 6.1 资源点类型

| 资源ID | 名称 | 采集工具 | 产出     | MVP实现 |
| ------ | ---- | -------- | -------- | ------- |
| herb   | 草药 | 无       | 恢复道具 | ✅      |
| stone  | 石头 | 无       | 制造材料 | ✅      |
| ore    | 矿石 | 镐       | 高级材料 | ❌      |
| tree   | 树木 | 斧头     | 木材     | ❌      |

### 6.2 资源生成规则

```typescript
interface ResourceSpawn {
  resourceId: string
  position: { x: number; y: number }
  quantity: number
  respawnTime: number // 秒
  requiredTool?: ToolType
}

// 资源分布算法
function generateResources(
  rng: SeededRandom,
  terrain: TerrainTile[][],
  regions: Region[],
  density: number
): ResourceSpawn[] {
  const resources: ResourceSpawn[] = []

  for (const region of regions) {
    // 根据区域类型决定资源类型
    const resourceTypes = getRegionResources(region.type)

    // 在区域内随机放置资源
    const resourceCount = Math.floor(region.area * density)

    for (let i = 0; i < resourceCount; i++) {
      const position = findValidPosition(rng, terrain, region.bounds, resourceTypes)

      if (position) {
        resources.push({
          resourceId: rng.choose(resourceTypes),
          position: position,
          quantity: rng.nextInt(1, 3),
          respawnTime: 60, // 60秒后刷新
        })
      }
    }
  }

  return resources
}
```

---

## 七、聚落分布系统

### 7.1 聚落放置规则

```typescript
interface CampPlacement {
  campId: string
  campType: CampType
  position: { x: number; y: number }
  regionId: string
}

// 聚落分布算法
function distributeCamps(rng: SeededRandom, regions: Region[], campDensity: number): CampPlacement[] {
  const camps: CampPlacement[] = []

  for (const region of regions) {
    // 检查区域类型是否允许聚落
    if (!regionAllowsCamps(region.type)) continue

    // 计算该区域聚落数量
    const campCount = calculateCampCount(region.area, campDensity, rng)

    // 放置聚落
    for (let i = 0; i < campCount; i++) {
      const position = findCampPosition(rng, region, camps)

      if (position) {
        camps.push({
          campId: generateCampId(),
          campType: chooseCampType(region.type, rng),
          position: position,
          regionId: region.id,
        })
      }
    }
  }

  return camps
}

// 确保聚落之间有最小距离
function findCampPosition(rng: SeededRandom, region: Region, existingCamps: CampPlacement[]): Position | null {
  const minDistance = 50 // 聚落间最小距离

  for (let attempts = 0; attempts < 10; attempts++) {
    const candidate = {
      x: rng.nextInt(region.bounds.x, region.bounds.x + region.bounds.width),
      y: rng.nextInt(region.bounds.y, region.bounds.y + region.bounds.height),
    }

    // 检查与现有聚落的距离
    const tooClose = existingCamps.some(camp => distance(candidate, camp.position) < minDistance)

    if (!tooClose) {
      return candidate
    }
  }

  return null
}
```

---

## 八、出生点系统

### 8.1 出生点要求

```typescript
interface SpawnPoint {
  position: { x: number; y: number }
  safeRadius: number // 安全半径
  nearbyResources: number // 附近资源点数量
}

// 出生点生成规则
function generateSpawnPoint(rng: SeededRandom, terrain: TerrainTile[][], resources: ResourceSpawn[]): SpawnPoint {
  // 1. 找到所有可通行且靠近资源的位置
  const candidates = []

  for (const resource of resources) {
    if (resource.resourceId === 'herb' || resource.resourceId === 'stone') {
      candidates.push(resource.position)
    }
  }

  // 2. 选择随机一个候选人
  const selected = rng.choose(candidates)

  // 3. 确保周围有足够空间
  return {
    position: selected,
    safeRadius: 30,
    nearbyResources: countNearbyResources(resources, selected, 50),
  }
}
```

---

## 九、地图数据结构

### 9.1 完整地图数据

```typescript
interface MapData {
  // 地图基本信息
  seed: string
  size: MapSize
  version: string
  generatedAt: number

  // 地形
  terrain: TerrainTile[][]

  // 区域
  regions: Region[]

  // 资源点
  resources: ResourceSpawn[]

  // 聚落
  camps: CampPlacement[]

  // 出生点
  spawnPoint: SpawnPoint

  // 边界
  bounds: {
    width: number
    height: number
  }
}
```

### 9.2 地图导出/导入

```typescript
// 导出地图（用于存档）
function exportMapData(map: MapData): string {
  return JSON.stringify({
    seed: map.seed,
    size: map.size,
    terrain: compressTerrain(map.terrain),
    regions: map.regions,
    resources: map.resources,
    camps: map.camps,
    spawnPoint: map.spawnPoint,
  })
}

// 导入地图
function importMapData(json: string): MapData {
  const data = JSON.parse(json)

  return {
    ...data,
    terrain: decompressTerrain(data.terrain),
    version: CURRENT_VERSION,
  }
}

// 地形压缩（节省存储空间）
function compressTerrain(terrain: TerrainTile[][]): number[][] {
  // 将TerrainType转换为数字
  return terrain.map(row => row.map(tile => terrainTypeToNumber(tile.type)))
}
```

---

## 十、扩展性设计

### 10.1 未来地形类型

| 地形 | 通行 | 特效        | 实现难度 |
| ---- | ---- | ----------- | -------- |
| 沙地 | ✅   | 移动减速10% | 低       |
| 泥地 | ✅   | 移动减速30% | 低       |
| 冰面 | ✅   | 移动惯性    | 中       |
| 熔岩 | ❌   | 持续伤害    | 中       |
| 沼泽 | ✅   | 减速+中毒   | 中       |

### 10.2 未来地形效果

```typescript
interface TerrainEffect {
  type: 'damage' | 'heal' | 'buff' | 'debuff'
  value: number
  interval: number // 效果间隔（秒）
}

const terrainEffects: Record<TerrainType, TerrainEffect> = {
  grass: { type: 'heal', value: 1, interval: 5 },
  lava: { type: 'damage', value: 20, interval: 1 },
  swamp: { type: 'debuff', value: 0.8, interval: 0 }, // 减速20%
}
```

### 10.3 地牢/特殊区域（预留）

| 类型 | 说明               | 入口     |
| ---- | ------------------ | -------- |
| 洞穴 | 地下探索，高级资源 | 洞穴入口 |
| 废墟 | 机械聚落密集区     | 废墟入口 |
| 神殿 | BOSS战，稀有掉落   | 传送门   |

---

## 十一、待讨论问题

1. **出生点设计**：是否需要在出生点放置简易避难所？
2. **聚落密度**：地图上聚落数量的默认值？
3. **资源刷新**：资源点采集后多久刷新？
4. **地图探索**：是否需要解锁未探索区域？

---

_文档状态：待确认，待后续细化_
