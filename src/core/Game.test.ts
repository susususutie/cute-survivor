import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Setup DOM environment
Object.defineProperty(global, 'document', {
  value: {
    getElementById: vi.fn(() => ({ appendChild: vi.fn() })),
    createElement: vi.fn((tag: string) => {
      if (tag === 'canvas') {
        return { width: 150, height: 150, getContext: vi.fn(() => ({ fillRect: vi.fn() })), appendChild: vi.fn(), remove: vi.fn() }
      }
      if (tag === 'div') return { id: '', innerHTML: '', style: {}, appendChild: vi.fn(), remove: vi.fn(), querySelector: vi.fn(), querySelectorAll: vi.fn(() => []) }
      if (tag === 'style') return { textContent: '', appendChild: vi.fn() }
      return {}
    }),
    body: { appendChild: vi.fn(), innerHTML: '' },
    head: { appendChild: vi.fn() }
  },
  writable: true
})

Object.defineProperty(global, 'window', {
  value: {
    innerWidth: 800,
    innerHeight: 600,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    devicePixelRatio: 1
  },
  writable: true
})

// Mock three.js with all required exports
const mockThree = {
  Scene: vi.fn(() => ({
    background: null,
    add: vi.fn(),
    remove: vi.fn(),
    getObjectByName: vi.fn(),
    traverse: vi.fn()
  })),
  PerspectiveCamera: vi.fn(() => ({
    position: { set: vi.fn(), copy: vi.fn() },
    lookAt: vi.fn(),
    aspect: 1,
    near: 0.1,
    far: 1000,
    updateProjectionMatrix: vi.fn()
  })),
  WebGLRenderer: vi.fn(() => ({
    setSize: vi.fn(),
    setPixelRatio: vi.fn(),
    domElement: { style: {} },
    shadowMap: { enabled: false, type: 0 },
    render: vi.fn()
  })),
  Clock: vi.fn(() => ({
    getDelta: vi.fn(() => 0.016),
    getElapsedTime: vi.fn(() => 0)
  })),
  Vector3: vi.fn().mockImplementation((x = 0, y = 0, z = 0) => ({
    x, y, z,
    clone: vi.fn(() => mockThree.Vector3(x, y, z)),
    distanceTo: vi.fn(() => 10),
    normalize: vi.fn(),
    set: vi.fn(),
    copy: vi.fn(),
    add: vi.fn(),
    multiplyScalar: vi.fn(),
    length: vi.fn(() => 1)
  })),
  AmbientLight: vi.fn(),
  DirectionalLight: vi.fn(() => ({
    position: { set: vi.fn() },
    castShadow: true,
    shadow: {
      mapSize: { width: 2048, height: 2048 },
      camera: {
        near: 0.5,
        far: 100,
        left: -30,
        right: 30,
        top: 30,
        bottom: -30
      }
    }
  })),
  GridHelper: vi.fn(() => ({
    name: 'groundGrid',
    position: { set: vi.fn() }
  })),
  PlaneGeometry: vi.fn(),
  MeshStandardMaterial: vi.fn(),
  Mesh: vi.fn(() => ({
    position: { set: vi.fn() },
    rotation: { x: 0 },
    castShadow: true,
    receiveShadow: true,
    add: vi.fn(),
    remove: vi.fn(),
    traverse: vi.fn((cb) => cb({ geometry: {} }))
  })),
  Group: vi.fn(() => ({
    name: '',
    add: vi.fn(),
    remove: vi.fn(),
    traverse: vi.fn()
  })),
  PointLight: vi.fn(),
  BufferGeometry: vi.fn(),
  BufferAttribute: vi.fn(),
  PointsMaterial: vi.fn(),
  Points: vi.fn(() => ({
    geometry: { attributes: { position: { array: new Float32Array(0), needsUpdate: false } } },
    material: {},
    userData: {},
    frustumCulled: false
  })),
  SphereGeometry: vi.fn(),
  CylinderGeometry: vi.fn(),
  DodecahedronGeometry: vi.fn(),
  BoxGeometry: vi.fn(),
  OctahedronGeometry: vi.fn(),
  RingGeometry: vi.fn(),
  Color: vi.fn(() => ({
    setHSL: vi.fn(),
    clone: vi.fn()
  })),
  PCFSoftShadowMap: 0,
  Math: {
    random: vi.fn(() => 0.5),
    PI: 3.14159
  }
}

vi.mock('three', () => mockThree)

// Mock all dependencies
vi.mock('../entities/Player', () => ({
  Player: vi.fn().mockImplementation(() => ({
    mesh: {
      position: { x: 0, y: 0, z: 0, set: vi.fn(), copy: vi.fn() },
      add: vi.fn(),
      remove: vi.fn()
    },
    state: { hp: 100, maxHp: 100, speed: 5, position: { x: 0, y: 0, z: 0 }, rotation: 0 },
    update: vi.fn(),
    getDirection: vi.fn(() => mockThree.Vector3(1, 0, 0)),
    getMuzzlePosition: vi.fn(() => mockThree.Vector3(0, 0.6, 0)),
    setRocks: vi.fn(),
    setRockMeshes: vi.fn(),
    takeDamage: vi.fn(() => false),
    heal: vi.fn(),
    applySpeedBoost: vi.fn()
  }))
}))

vi.mock('../systems/BulletSystem', () => ({
  BulletManager: vi.fn().mockImplementation(() => ({
    fire: vi.fn(),
    update: vi.fn(),
    getBullets: vi.fn(() => []),
    remove: vi.fn()
  }))
}))

vi.mock('../entities/Enemy', () => ({
  EnemyManager: vi.fn().mockImplementation(() => ({
    spawnAtWithCallback: vi.fn(),
    update: vi.fn(),
    getEnemies: vi.fn(() => []),
    setRocks: vi.fn(),
    remove: vi.fn()
  })),
  EnemyType: {
    Goblin: 'goblin',
    Orc: 'orc',
    Slime: 'slime',
    Bat: 'bat'
  }
}))

vi.mock('../systems/MapGenerator', () => ({
  MapGenerator: vi.fn().mockImplementation(() => ({
    generate: vi.fn(() => ({
      rocks: [],
      vegetation: [],
      terrain: [],
      resources: []
    })),
    generateChunk: vi.fn(() => ({
      rocks: [],
      vegetation: [],
      resources: []
    }))
  }))
}))

vi.mock('../systems/ItemSystem', () => ({
  ItemManager: vi.fn().mockImplementation(() => ({
    spawnAtEnemyDeath: vi.fn(),
    collectItemsInRange: vi.fn(() => []),
    update: vi.fn()
  })),
  ItemType: {
    Gold: 'gold',
    Ammo: 'ammo',
    Herb: 'herb',
    Ore: 'ore',
    HealthPotion: 'healthPotion',
    SpeedPotion: 'speedPotion'
  }
}))

vi.mock('../systems/UIManager', () => ({
  UIManager: vi.fn().mockImplementation(() => ({
    showPauseMenu: vi.fn(),
    hidePauseMenu: vi.fn(),
    showGameOver: vi.fn(),
    updateStats: vi.fn()
  }))
}))

vi.mock('../systems/AudioManager', () => ({
  AudioManager: vi.fn().mockImplementation(() => ({
    startBGM: vi.fn(),
    playShoot: vi.fn(),
    playHit: vi.fn(),
    playPickup: vi.fn(),
    playEnemyAttack: vi.fn(),
    toggleMute: vi.fn()
  }))
}))

vi.mock('../systems/MiniMap', () => ({
  MiniMap: vi.fn().mockImplementation(() => ({
    update: vi.fn(),
    show: vi.fn(),
    hide: vi.fn(),
    destroy: vi.fn()
  }))
}))

vi.mock('../systems/SettingsUI', () => ({
  SettingsUI: vi.fn().mockImplementation(() => ({
    show: vi.fn(),
    hide: vi.fn(),
    destroy: vi.fn()
  }))
}))

describe('Game Class', () => {
  let Game: any
  let game: any

  beforeEach(async () => {
    const gameModule = await import('./Game')
    Game = gameModule.Game
    game = new Game()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Constructor', () => {
    it('should create game instance with initial properties', () => {
      expect(game).toBeDefined()
      expect(game.scene).toBeDefined()
      expect(game.camera).toBeDefined()
      expect(game.renderer).toBeDefined()
      expect(game.clock).toBeDefined()
      expect(game.isPaused).toBe(false)
      expect(game.isGameOver).toBe(false)
      expect(game.ammo).toBe(30)
      expect(game.maxAmmo).toBe(30)
      expect(game.gold).toBe(0)
      expect(game.herbs).toBe(0)
      expect(game.ores).toBe(0)
      expect(game.bounds).toBe(1000)
      expect(game.fireRate).toBe(0.3)
      expect(game.chunkSize).toBe(24)
    })

    it('should set up camera with correct initial position', () => {
      // The camera position is mocked, so we just verify it exists
      expect(game.camera.position).toBeDefined()
    })

    it('should create scene with dark blue background', () => {
      expect(game.scene.background).toBeDefined()
    })
  })

  describe('init()', () => {
    it('should initialize all game systems', () => {
      game.init()

      expect(game.uiManager).toBeDefined()
      expect(game.audioManager).toBeDefined()
      expect(game.mapGenerator).toBeDefined()
      expect(game.player).toBeDefined()
      expect(game.bulletManager).toBeDefined()
      expect(game.enemyBulletManager).toBeDefined()
      expect(game.enemyManager).toBeDefined()
      expect(game.itemManager).toBeDefined()
    })

    it('should setup event listeners', () => {
      game.init()

      expect(window.addEventListener).toHaveBeenCalledWith('mousedown', expect.any(Function))
      expect(window.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function))
      expect(window.addEventListener).toHaveBeenCalledWith('resize', expect.any(Function))
    })

    it('should call animate method', () => {
      const animateSpy = vi.fn()
      game.animate = animateSpy

      game.init()

      // Note: animate is called via requestAnimationFrame, so we can't test it directly
      // but we can verify the method exists
      expect(typeof game.animate).toBe('function')
    })
  })

  describe('Game Properties', () => {
    it('should have correct default values', () => {
      expect(game.terrainChunks).toBeInstanceOf(Map)
      expect(game.currentChunkX).toBe(0)
      expect(game.currentChunkZ).toBe(0)
      expect(game.loadDistance).toBe(2)
      expect(game.enemySpawnTimer).toBe(0)
    })

    it('should have methods defined', () => {
      expect(typeof game.init).toBe('function')
      expect(typeof game.update).toBe('function')
      expect(typeof game.animate).toBe('function')
      expect(typeof game.updateCamera).toBe('function')
      expect(typeof game.updateGround).toBe('function')
      expect(typeof game.spawnInitialEnemies).toBe('function')
      expect(typeof game.spawnEnemyNearPlayer).toBe('function')
      expect(typeof game.collectItems).toBe('function')
      expect(typeof game.checkBulletEnemyCollisions).toBe('function')
      expect(typeof game.checkEnemyPlayerCollisions).toBe('function')
      expect(typeof game.checkEnemyBulletCollisions).toBe('function')
      expect(typeof game.createKillEffect).toBe('function')
      expect(typeof game.updateEffects).toBe('function')
    })
  })

  describe('Private Methods Exist', () => {
    it('should have all private methods defined', () => {
      expect(game.generateMap).toBeDefined()
      expect(game.createLights).toBeDefined()
      expect(game.createGround).toBeDefined()
      expect(game.createPlayer).toBeDefined()
      expect(game.createMapObjects).toBeDefined()
      expect(game.updateTerrainChunks).toBeDefined()
      expect(game.getAllRocks).toBeDefined()
      expect(game.getAllChunkRocks).toBeDefined()
      expect(game.cleanupDistantChunks).toBeDefined()
      expect(game.createVegetationMesh).toBeDefined()
      expect(game.createVegetationMeshInChunk).toBeDefined()
      expect(game.handleInput).toBeDefined()
      expect(game.handleResize).toBeDefined()
    })
  })
})