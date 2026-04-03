# 👾 敌人与NPC系统 - 详细设计

> **文件版本**: v0.1
> **最后更新**: 2026-03-26
> **状态**: MVP精简版，未来扩展

---

## 一、系统概述

### 1.1 设计目标

- 🎯 提供多样化的敌人类型，增加游戏趣味性
- 🎯 每种敌人有独特掉落，激励玩家探索
- 🎯 聚落系统模拟生态环境，参考饥荒
- 🎯 简洁的AI行为，快速实现

### 1.2 MVP目标

**初版实现**：

- 2种敌人聚落（野兽、机械）
- 每种聚落1-2种敌人
- 简化AI行为
- 独特掉落系统

---

## 二、敌人聚落设计

### 2.1 MVP聚落（初版实现）

#### 🐾 野兽巢穴

**设计理念**：模拟野外野兽群落，快速、群攻、数量多

| 属性     | 说明                         |
| -------- | ---------------------------- |
| 出现环境 | 森林、草地、荒野             |
| 敌人数量 | 每聚落5-10只                 |
| 敌意机制 | 玩家接近后产生敌意，跟随追击 |

**初版敌人**：

| 敌人 | HP  | 伤害 | 速度 | 掉落                |
| ---- | --- | ---- | ---- | ------------------- |
| 野狼 | 30  | 8    | 快   | 兽皮(60%)、肉(40%)  |
| 野猪 | 50  | 15   | 中   | 兽皮(80%)、肉(100%) |

---

#### 🤖 机械工厂

**设计理念**：模拟机械敌人，高防御、高伤害、速度慢

| 属性     | 说明                 |
| -------- | -------------------- |
| 出现环境 | 废墟、工厂、废弃矿区 |
| 敌人数量 | 每聚落3-6只          |
| 敌意机制 | 警戒范围大，攻击性强 |

**初版敌人**：

| 敌人       | HP  | 伤害 | 速度 | 掉落                     |
| ---------- | --- | ---- | ---- | ------------------------ |
| 巡逻机器人 | 80  | 20   | 慢   | 齿轮(70%)、金属(50%)     |
| 机械猎犬   | 50  | 25   | 快   | 电子元件(30%)、齿轮(60%) |

---

### 2.2 未来扩展聚落

| 聚落类型    | 敌人特点           | 掉落物                 | 出现环境   | 优先级 | 备注         |
| ----------- | ------------------ | ---------------------- | ---------- | ------ | ------------ |
| 🧙 法师塔   | 远程攻击、范围魔法 | 法杖碎片、魔法书、斗篷 | 塔楼、洞穴 | P2     | 需要远程AI   |
| 💀 亡灵墓地 | 复活、分裂、诅咒   | 骨头、灵魂石、腐肉     | 墓地、沼泽 | P2     | 需要复活机制 |
| 🐛 虫族蜂巢 | 群体协作、Acid攻击 | 甲壳、外骨骼、酸液     | 地下、沙漠 | P3     | 需要群体AI   |
| 🌊 水生巢穴 | 水中战斗、缠绕     | 鳞片、珍珠、水母       | 河流、海洋 | P3     | 需要水域地形 |
| 🔥 火焰领地 | 高温区域、燃烧攻击 | 火焰精华、熔岩、岩浆石 | 火山区     | P3     | 需要环境伤害 |
| ❄️ 冰霜领域 | 冰冻攻击、减速区域 | 冰晶、寒霜精华         | 雪山、冰洞 | P3     | 需要减速效果 |

---

## 三、敌人属性数据

### 3.1 基础属性

```typescript
interface EnemyDefinition {
  id: string // 唯一标识
  name: string // 显示名称
  faction: string // 所属聚落

  // 战斗属性
  maxHP: number // 最大生命值
  damage: number // 攻击力
  moveSpeed: number // 移动速度 (单位/秒)
  attackRange: number // 攻击范围 (距离单位)
  attackSpeed: number // 攻击速度 (次/秒)

  // AI行为参数
  aiType: 'aggressive' | 'passive' | 'territorial' | 'fleeing'
  aggroRange: number // 警戒范围 (发现玩家的距离)
  aggroDuration: number // 敌意持续时间 (秒)
  homeRange: number // 活动范围 (远离出生点的最大距离)

  // 掉落
  drops: DropTable[]

  // 外观
  skinId: string // 皮肤ID
  scale: number // 模型缩放
  shadowSize: number // 阴影大小

  // 动画
  animationSet: {
    idle: string
    walk: string
    attack: string
    hurt: string
    death: string
  }
}
```

### 3.2 MVP敌人数据

```typescript
// 野兽聚落
const enemyDefinitions = {
  wolf: {
    id: 'wolf',
    name: '野狼',
    faction: 'beast',

    maxHP: 30,
    damage: 8,
    moveSpeed: 3.5,
    attackRange: 1.5,
    attackSpeed: 1.2,

    aiType: 'aggressive',
    aggroRange: 8,
    aggroDuration: 10,
    homeRange: 15,

    drops: [
      { itemId: 'fur', dropChance: 0.6, minQuantity: 1, maxQuantity: 2 },
      { itemId: 'meat', dropChance: 0.4, minQuantity: 1, maxQuantity: 1 },
    ],

    skinId: 'wolf',
    scale: 1.0,
  },

  boar: {
    id: 'boar',
    name: '野猪',
    faction: 'beast',

    maxHP: 50,
    damage: 15,
    moveSpeed: 2.5,
    attackRange: 1.8,
    attackSpeed: 0.8,

    aiType: 'aggressive',
    aggroRange: 6,
    aggroDuration: 8,
    homeRange: 12,

    drops: [
      { itemId: 'fur', dropChance: 0.8, minQuantity: 1, maxQuantity: 3 },
      { itemId: 'meat', dropChance: 1.0, minQuantity: 2, maxQuantity: 4 },
    ],

    skinId: 'boar',
    scale: 1.3,
  },

  // 机械聚落
  patrol_robot: {
    id: 'patrol_robot',
    name: '巡逻机器人',
    faction: 'mechanical',

    maxHP: 80,
    damage: 20,
    moveSpeed: 1.5,
    attackRange: 2.5,
    attackSpeed: 0.5,

    aiType: 'territorial',
    aggroRange: 10,
    aggroDuration: 15,
    homeRange: 20,

    drops: [
      { itemId: 'gear', dropChance: 0.7, minQuantity: 1, maxQuantity: 2 },
      { itemId: 'metal', dropChance: 0.5, minQuantity: 1, maxQuantity: 3 },
    ],

    skinId: 'patrol_robot',
    scale: 1.2,
  },

  mech_hound: {
    id: 'mech_hound',
    name: '机械猎犬',
    faction: 'mechanical',

    maxHP: 50,
    damage: 25,
    moveSpeed: 3.0,
    attackRange: 1.5,
    attackSpeed: 1.0,

    aiType: 'aggressive',
    aggroRange: 12,
    aggroDuration: 12,
    homeRange: 18,

    drops: [
      { itemId: 'electronic', dropChance: 0.3, minQuantity: 1, maxQuantity: 1 },
      { itemId: 'gear', dropChance: 0.6, minQuantity: 1, maxQuantity: 2 },
    ],

    skinId: 'mech_hound',
    scale: 1.1,
  },
}
```

---

## 四、AI行为系统

### 4.1 AI状态机

```
┌─────────────────────────────────────────────────────────┐
│                    敌人AI状态机                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   ┌─────────┐                                        │
│   │  闲置   │ ←─── 初始化                             │
│   │  Idle   │                                        │
│   └────┬────┘                                        │
│        │                                              │
│        │ 计时器/随机触发                               │
│        ↓                                              │
│   ┌─────────┐    玩家进入警戒范围                      │
│   │  巡逻   │ ───────────────────────────────────→ │
│   │ Patrol  │                                        │
│   └────┬────┘                                        │
│        │                                              │
│        │ 玩家进入视野                                  │
│        ↓                                              │
│   ┌─────────┐                                        │
│   │  警戒   │ ← 玩家离开警戒范围后返回                │
│   │  Alert  │                                        │
│   └────┬────┘                                        │
│        │                                              │
│        │ 持续检测玩家                                  │
│        ↓                                              │
│   ┌─────────┐                                        │
│   │  追击   │ ← 玩家逃离后继续追击一段时间             │
│   │  Chase  │                                        │
│   └────┬────┘                                        │
│        │                                              │
│        │ 进入攻击范围                                  │
│        ↓                                              │
│   ┌─────────┐                                        │
│   │  战斗   │ ← 敌意消失后返回巡逻或闲置              │
│   │ Combat  │                                        │
│   └────┬────┘                                        │
│        │                                              │
│        │ HP归零                                       │
│        ↓                                              │
│   ┌─────────┐                                        │
│   │  死亡   │ → 播放死亡动画 → 触发掉落 → 移除实体    │
│   │  Death  │                                        │
│   └─────────┘                                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 4.2 AI类型说明

| AI类型        | 行为描述                 | 适用敌人       |
| ------------- | ------------------------ | -------------- |
| `aggressive`  | 主动追击玩家，高敌意     | 野狼、机械猎犬 |
| `passive`     | 不主动攻击，被打才还手   | 兔子、小动物   |
| `territorial` | 在领地内巡逻，入侵者攻击 | 巡逻机器人     |
| `fleeing`     | 血量低时逃跑             | 受伤的大型敌人 |

### 4.3 AI参数说明

```typescript
interface AIParameters {
  aggroRange: number // 警戒范围（单位）
  // 当玩家进入此范围，敌人进入"警戒"状态
  // 野狼: 8单位
  // 巡逻机器人: 10单位

  aggroDuration: number // 敌意持续时间（秒）
  // 玩家逃出视野后，敌人继续追击的时间
  // 野狼: 10秒
  // 巡逻机器人: 15秒

  homeRange: number // 活动范围（单位）
  // 敌人远离出生点的最大距离
  // 超出此范围会返回出生点
  // 野狼: 15单位
  // 巡逻机器人: 20单位

  patrolRadius: number // 巡逻半径（单位）
  // 巡逻状态下随机移动的范围
  // 默认: homeRange * 0.5
}
```

---

## 五、掉落物系统

### 5.1 掉落数据结构

```typescript
interface DropTable {
  itemId: string // 物品ID
  dropChance: number // 掉落概率 0-1
  minQuantity: number // 最小数量
  maxQuantity: number // 最大数量
  condition?: DropCondition // 条件掉落
}

type DropCondition =
  | { type: 'always' } // 必定掉落
  | { type: 'random'; chance: number } // 概率掉落
  | { type: 'boss' } // BOSS专属
  | { type: 'area'; areaType: string } // 特定区域
```

### 5.2 掉落物清单

#### 野兽聚落掉落

| 物品ID | 名称 | 用途               | MVP是否实现 |
| ------ | ---- | ------------------ | ----------- |
| fur    | 兽皮 | 制作护甲、合成材料 | ✅          |
| meat   | 肉   | 恢复生命、合成     | ✅          |
| bone   | 骨头 | 合成材料           | ❌ 后续扩展 |
| claw   | 爪子 | 武器强化           | ❌ 后续扩展 |

#### 机械聚落掉落

| 物品ID     | 名称     | 用途               | MVP是否实现 |
| ---------- | -------- | ------------------ | ----------- |
| gear       | 齿轮     | 制作弹药、武器零件 | ✅          |
| metal      | 金属     | 制造弹药、材料     | ✅          |
| electronic | 电子元件 | 高级机械制造       | ✅          |
| battery    | 电池     | 能量来源           | ❌ 后续扩展 |

### 5.3 掉落逻辑

```typescript
function rollDrops(enemy: Enemy, drops: DropTable[]): Item[] {
  const items: Item[] = []

  for (const drop of drops) {
    // 随机判定是否掉落
    if (Math.random() < drop.dropChance) {
      // 随机数量
      const quantity = drop.minQuantity + Math.floor(Math.random() * (drop.maxQuantity - drop.minQuantity + 1))

      items.push({
        id: drop.itemId,
        quantity: quantity,
      })
    }
  }

  return items
}
```

### 5.4 掉落展示

```
敌人死亡 → 显示掉落提示 → 物品飞向玩家 → 添加到背包

┌─────────────────────────────────┐
│        💀 野狼已死亡            │
│                                 │
│   ┌─────┐  ┌─────┐             │
│   │兽皮x2│  │ 肉x1 │  飞向背包  │
│   └─────┘  └─────┘             │
└─────────────────────────────────┘
```

---

## 六、敌人生成系统

### 6.1 聚落生成

```typescript
interface CampSpawn {
  campId: string
  campType: 'beast' | 'mechanical' // 聚落类型
  position: { x: number; y: number } // 聚落中心位置
  enemies: EnemySpawn[] // 聚落内敌人列表
}

interface EnemySpawn {
  enemyId: string // 敌人ID
  position: { x: number; y: number } // 生成位置（相对聚落中心）
  respawnTime?: number // 复活时间（秒）
}
```

### 6.2 聚落配置

```typescript
const campConfigs = {
  beast: {
    campSize: 10, // 聚落半径
    enemyCount: [5, 10], // 敌人数量范围
    respawnTime: 120, // 复活时间（秒）
    spacing: 3, // 敌人之间最小距离
  },

  mechanical: {
    campSize: 15,
    enemyCount: [3, 6],
    respawnTime: 180,
    spacing: 5,
  },
}
```

---

## 七、NPC系统（预留）

> **状态**: 后续扩展，初版不实现

### 7.1 预留功能

| 功能     | 说明                  | 优先级 |
| -------- | --------------------- | ------ |
| NPC聚落  | 可交互的友好/中立角色 | P2     |
| 交易系统 | 用金币/材料交换物品   | P2     |
| 任务系统 | 接受任务获得奖励      | P2     |
| 好感度   | 与NPC建立关系         | P3     |

### 7.2 NPC聚落类型（预留）

| NPC类型 | 功能               | 所在环境     |
| ------- | ------------------ | ------------ |
| 商人    | 买卖物品           | 城镇、安全区 |
| 铁匠    | 修理装备、强化武器 | 城镇         |
| 猎人    | 任务发布、情报     | 野外         |
| 旅人    | 随机事件、故事     | 路边         |

---

## 八、扩展性设计

### 8.1 未来可添加敌人类型

| 敌人类型 | 特殊能力         | 实现难度 |
| -------- | ---------------- | -------- |
| 飞行敌人 | 可越过障碍物     | 中       |
| 隐形敌人 | 隐身接近玩家     | 中       |
| 分裂敌人 | 死亡时分裂成小怪 | 高       |
| 召唤敌人 | 召唤小怪助战     | 高       |
| BOSS     | 高血量、特殊技能 | 中       |

### 8.2 特殊效果（预留）

| 效果 | 说明          | 应用敌人   |
| ---- | ------------- | ---------- |
| 中毒 | 持续掉血      | 虫族、毒蛙 |
| 冰冻 | 减速/定身     | 冰霜敌人   |
| 燃烧 | 持续伤害+范围 | 火焰敌人   |
| 感电 | 连锁伤害      | 电气敌人   |
| 诅咒 | 降低属性      | 亡灵敌人   |

---

## 九、待讨论问题

1. **敌人难度曲线**：随着游戏进程，敌人属性是否递增？
2. **聚落密度**：地图上聚落的数量和间距？
3. **复活机制**：敌人被击杀后多久复活？是否需要主动触发？
4. **掉落公示**：是否需要显示掉落概率？

---

_文档状态：待确认，待后续细化_
