/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  X, 
  Minus, 
  Square, 
  AlertTriangle, 
  Ban, 
  Hand, 
  UserX, 
  Scan,
  MessageCircle,
  Volume2,
  Smile,
  Zap,
  HandMetal,
  Mail,
  Settings
} from 'lucide-react';

// --- Constants & Types ---

const GRID_SIZE = 14; // Larger grid to allow for more interesting shapes
const MINE_COUNT = 15;
const INITIAL_HP = 3;

type CellStatus = 'HIDDEN' | 'REVEALED' | 'FLAGGED' | 'QUESTION';
type GridShape = 'SQUARE' | 'CIRCLE' | 'HEART' | 'DIAMOND' | 'BLOB';

interface Cell {
  x: number;
  y: number;
  isMine: boolean;
  neighborMines: number;
  status: CellStatus;
  isActive: boolean; // Part of the current shape
}

interface Popup {
  id: string;
  title: string;
  content: string;
  type: 'warning' | 'error' | 'severe' | 'info';
  x: number;
  y: number;
}

interface Thought {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
}

const WARNINGS = [
  { title: '不小心碰到', content: '哎呀！刚才是不是蹭到我肩膀了？（身体僵硬度 +10%）' },
  { title: '窥屏行为', content: '检测到窥视视线。要不要我把手机借你拿回家看？' },
  { title: '盯着看', content: '眼神捕捉成功。请问我脸上是有二维码需要扫描吗？' },
  { title: '乱动私物', content: '那是我的笔，不是公共借阅室。谢谢配合。' },
  { title: '公共大声', content: '检测到人声扩音器，我的耳膜表示想离职。' },
];

const GAZE_WARNINGS = [
  '看什么看，好看吗？',
  '你还在看吗？社交距离正在侵略中...',
  '盯着屏幕太久会被视为“目光猥亵”哦。'
];

// --- Components ---

const Window = ({ 
  title, 
  children, 
  onClose, 
  className = '', 
  style = {} 
}: { 
  title: string, 
  children: React.ReactNode, 
  onClose?: () => void,
  className?: string,
  style?: React.CSSProperties
}) => (
  <div 
    className={`flex flex-col bg-[#fefefa] ${className}`}
    style={{ 
      ...style, 
      border: '6px solid var(--color-pale-ink)', 
      borderRadius: '12px', 
      padding: 0,
    }}
  >
    <div className="flex justify-between items-center bg-[#eaeaea] border-b-[6px] border-pale-ink px-4 py-2 select-none">
      <span className="flex items-center gap-2 text-xl font-bold tracking-widest text-[#4a4a4a] font-pixel">
        {title}
      </span>
      <div className="flex gap-2">
        <button className="flex items-center justify-center w-8 h-8 p-0 bg-white border-[3px] border-[#4a4a4a] cursor-pointer hover:bg-gray-100 active:scale-95">
          <Minus size={18} strokeWidth={3} className="text-[#4a4a4a]" />
        </button>
        {onClose && (
           <button 
             onClick={onClose}
             className="flex items-center justify-center w-8 h-8 p-0 bg-white border-[3px] border-[#4a4a4a] cursor-pointer hover:bg-gray-100 active:scale-95"
           >
             <X size={18} strokeWidth={3} className="text-[#4a4a4a]" />
           </button>
        )}
      </div>
    </div>
    <div className="p-6 flex-1 flex flex-col items-center justify-center gap-4 relative">
      {children}
    </div>
  </div>
);

const RetroPopup = ({ popup, onClose }: { popup: Popup, onClose: (id: string) => void, key?: React.Key }) => (
  <motion.div
    initial={{ scale: 0.9, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    exit={{ scale: 0.9, opacity: 0 }}
    style={{ 
      position: 'fixed', 
      left: popup.x, 
      top: popup.y, 
      zIndex: 200,
      width: '380px'
    }}
  >
    <Window title="事件" onClose={() => onClose(popup.id)} className="shadow-2xl">
      <div className="w-full flex gap-4 items-start px-2 py-2">
        {popup.type === 'severe' ? (
          <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-2xl border-2 border-[#4a4a4a]">
            !
          </div>
        ) : popup.type === 'warning' ? (
          <AlertTriangle className="text-yellow-500 shrink-0 mt-1" size={32} />
        ) : null}
        <div className="flex flex-col gap-2">
          <p className="text-xl font-bold leading-relaxed text-[#4a4a4a] tracking-wider font-pixel">
            {popup.title}
          </p>
          <p className="text-sm mt-1 opacity-80 text-[#4a4a4a] leading-relaxed font-pixel">
            {popup.content}
          </p>
        </div>
      </div>
      <button 
        onClick={() => onClose(popup.id)}
        className="mt-4 self-center w-full px-8 py-3 bg-white border-[3px] border-[#4a4a4a] font-bold text-[#4a4a4a] cursor-pointer hover:bg-gray-100 active:scale-95 text-xl font-pixel"
      >
        确定
      </button>
    </Window>
  </motion.div>
);

const StartScreen = ({ onStart }: { onStart: () => void }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden w-full h-full">
      <div className="relative flex flex-col items-center justify-center w-full max-w-4xl h-[600px]">
        {/* Background decorative elements */}
        {/* Huge Exclamation Mark */}
        <div className="absolute text-[#ff5c5c] font-black z-0 pointer-events-none" style={{
            fontSize: '500px',
            lineHeight: 0.8,
            transform: 'rotate(-10deg)',
            left: '-50px',
            top: '50px'
        }}>
          !
        </div>

        {/* Star red shape on right */}
        <div className="absolute z-0 pointer-events-none" style={{
            transform: 'rotate(15deg)',
            right: '0', 
            bottom: '50px'
        }}>
          <svg width="250" height="250" viewBox="0 0 100 100">
             <path d="M50 0 L65 35 L100 50 L65 65 L50 100 L35 65 L0 50 L35 35 Z" fill="#ff5c5c"/>
          </svg>
        </div>

        {/* Speech Bubble */}
        <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="relative z-10 mb-16"
        >
          {/* Main Bubble */}
          <div className="bg-[#fefefa] border-[8px] border-[#4a4a4a] rounded-[100px] px-24 py-12 text-center leading-none shadow-sm relative flex flex-col justify-center items-center gap-2">
             <div className="flex justify-center items-center gap-[0.2em]">
               <span className="text-[90px] font-bold text-[#4a4a4a] font-sans transform -rotate-6 translate-y-2 drop-shadow-sm inline-block">社</span>
               <span className="text-[90px] font-bold text-[#4a4a4a] font-sans transform rotate-6 -translate-y-2 drop-shadow-sm inline-block">交</span>
               <span className="text-[90px] font-bold text-[#4a4a4a] font-sans transform -rotate-3 translate-y-1 drop-shadow-sm inline-block">避</span>
               <span className="text-[90px] font-bold text-[#4a4a4a] font-sans transform rotate-12 -translate-y-3 drop-shadow-sm inline-block">雷</span>
             </div>
             <span className="text-xl font-bold text-[#4a4a4a] opacity-60 tracking-[0.4em] font-pixel uppercase mt-2">Social Minefield</span>
             {/* Tail outer border */}
             <div className="absolute left-[80px] -bottom-[45px] w-0 h-0 border-[30px] border-transparent border-t-[#4a4a4a] border-l-[#4a4a4a] transform -rotate-12 z-10" />
             {/* Tail inner fill */}
             <div className="absolute left-[88px] -bottom-[23px] w-0 h-0 border-[20px] border-transparent border-t-[#fefefa] border-l-[#fefefa] transform -rotate-12 z-20" />
          </div>
        </motion.div>

        {/* START Button */}
        <motion.button 
           initial={{ y: 50, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           transition={{ delay: 0.3 }}
           onClick={onStart}
           className="z-20 relative px-20 py-4 bg-[#ff9bc2] hover:bg-[#ff8db7] active:scale-95 transition-all outline-none text-white text-6xl font-black rounded-lg flex items-center justify-center transform -rotate-3 border-none cursor-pointer"
        >
           START
        </motion.button>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [appState, setAppState] = useState<'START' | 'PLAYING'>('START');
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [hp, setHp] = useState(INITIAL_HP);
  const [gameStatus, setGameStatus] = useState<'PLAYING' | 'WON' | 'LOST'>('PLAYING');
  const [popups, setPopups] = useState<Popup[]>([]);
  const [minesGenerated, setMinesGenerated] = useState(false);
  const [flagsRemaining, setFlagsRemaining] = useState(MINE_COUNT);
  const [showGameOver, setShowGameOver] = useState(false);
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [moodPoints, setMoodPoints] = useState(50); // 0 (Stressed) to 100 (Calm)
  
  const [showSettings, setShowSettings] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const audioContext = useRef<AudioContext | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  
  // Gaze detection
  const gazeTimer = useRef<NodeJS.Timeout | null>(null);
  const lastCell = useRef<{x: number, y: number} | null>(null);
  const lastRightClick = useRef<{ x: number, y: number, time: number } | null>(null);

  const playSound = (type: 'click' | 'mine' | 'reveal' | 'win') => {
    if (isMuted) return;
    try {
      if (!audioContext.current) {
        audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContext.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'reveal') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.linearRampToValueAtTime(600, now + 0.1);
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'mine') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(100, now);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'win') {
        [440, 554, 659].forEach((f, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g);
          g.connect(ctx.destination);
          o.frequency.setValueAtTime(f, now + i * 0.1);
          g.gain.setValueAtTime(0.05, now + i * 0.1);
          g.gain.linearRampToValueAtTime(0, now + i * 0.1 + 0.2);
          o.start(now + i * 0.1);
          o.stop(now + i * 0.1 + 0.2);
        });
      }
    } catch (e) { console.error(e); }
  };

  const getIsActive = (x: number, y: number, shape: GridShape): boolean => {
    const cx = (GRID_SIZE - 1) / 2;
    const cy = (GRID_SIZE - 1) / 2;
    const rx = (x - cx);
    const ry = (y - cy);
    const dist = Math.sqrt(rx * rx + ry * ry);

    switch(shape) {
      case 'CIRCLE':
        return dist <= (GRID_SIZE / 2) - 0.5;
      case 'HEART': {
        const nx = (x / (GRID_SIZE - 1)) * 2 - 1;
        const ny = -((y / (GRID_SIZE - 1)) * 2 - 1.2);
        const a = nx * nx + ny * ny - 1;
        return a * a * a - nx * nx * ny * ny * ny <= 0;
      }
      case 'DIAMOND':
        return Math.abs(rx) + Math.abs(ry) <= (GRID_SIZE / 2);
      case 'BLOB':
        // A rough irregular shape using a bit of sine for noise
        const angle = Math.atan2(ry, rx);
        const radius = (GRID_SIZE / 2.5) + Math.sin(angle * 3) * 1.5;
        return dist <= radius;
      case 'SQUARE':
      default:
        return x >= 1 && x < GRID_SIZE - 1 && y >= 1 && y < GRID_SIZE - 1;
    }
  };

  const initGrid = useCallback(() => {
    const shapes: GridShape[] = ['SQUARE', 'CIRCLE', 'HEART', 'DIAMOND', 'BLOB'];
    const chosenShape = shapes[Math.floor(Math.random() * shapes.length)];
    
    const newGrid: Cell[][] = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      const row: Cell[] = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        row.push({ 
          x, y, 
          isMine: false, 
          neighborMines: 0, 
          status: 'HIDDEN', 
          isActive: getIsActive(x, y, chosenShape) 
        });
      }
      newGrid.push(row);
    }
    setGrid(newGrid);
    setHp(INITIAL_HP);
    setMoodPoints(60); 
    setMinesGenerated(false);
    
    // Recalculate flags based on how many Mines we'll have
    setFlagsRemaining(MINE_COUNT);
    setGameStatus('PLAYING');
    setPopups([]);
    setShowGameOver(false);
  }, []);

  useEffect(() => {
    initGrid();
  }, [initGrid]);

  const generateMines = (safeX: number, safeY: number) => {
    const newGrid = [...grid.map(row => row.map(cell => ({ ...cell })))];
    const activeCells = newGrid.flat().filter(c => c.isActive && !((Math.abs(c.x - safeX) <= 1) && (Math.abs(c.y - safeY) <= 1)));
    
    // Sort and pick randomly to ensure we don't pick too many if grid is small
    const actualMineCount = Math.min(MINE_COUNT, Math.floor(activeCells.length * 0.25));
    
    const shadedCells = [...activeCells].sort(() => Math.random() - 0.5);
    for (let i = 0; i < actualMineCount; i++) {
      const cell = shadedCells[i];
      newGrid[cell.y][cell.x].isMine = true;
    }

    // Calculate neighbors
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (newGrid[y][x].isActive && !newGrid[y][x].isMine) {
          let count = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (newGrid[y + dy]?.[x + dx]?.isActive && newGrid[y + dy]?.[x + dx]?.isMine) count++;
            }
          }
          newGrid[y][x].neighborMines = count;
        }
      }
    }
    return newGrid;
  };

  const revealCell = (x: number, y: number, currentGrid: Cell[][]) => {
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return;
    const cell = currentGrid[y][x];
    if (!cell.isActive || cell.status !== 'HIDDEN') return;

    cell.status = 'REVEALED';

    if (cell.neighborMines === 0) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          revealCell(x + dx, y + dy, currentGrid);
        }
      }
    }
  };

  const addPopup = (title: string, content: string, type: 'warning' | 'error' | 'severe' = 'warning') => {
    const id = Math.random().toString(36).substr(2, 9);
    const x = 50 + Math.random() * (window.innerWidth - 350);
    const y = 50 + Math.random() * (window.innerHeight - 250);
    
    setPopups(prev => [...prev, { id, title, content, type, x, y }]);
    return id;
  };

  const addThought = (text: string, x: number, y: number, color: string = 'var(--color-pale-ink)') => {
    const id = Math.random().toString(36).substr(2, 9);
    // Keep only last 8 thoughts to avoid clutter
    setThoughts(prev => [...prev.slice(-7), { id, text, x, y, color }]);
    setTimeout(() => {
      setThoughts(prev => prev.filter(t => t.id !== id));
    }, 2400);
  };

  const handleCellClick = async (x: number, y: number, clientX?: number, clientY?: number) => {
    if (gameStatus !== 'PLAYING' || isPaused) return;
    if (grid[y][x].status !== 'HIDDEN') return;

    // Simulate semi-lag for 2nd mine hit (HP=1)
    if (hp === 1) {
      await new Promise(r => setTimeout(r, 400 + Math.random() * 400));
    }

    let updatedGrid = [...grid.map(row => row.map(cell => ({ ...cell })))];

    if (!minesGenerated) {
      updatedGrid = generateMines(x, y);
      setMinesGenerated(true);
    }

    const cell = updatedGrid[y][x];

    if (cell.isMine) {
      playSound('mine');
      const newHp = hp - 1;
      setHp(newHp);
      setMoodPoints(prev => Math.max(0, prev - 25));
      
      if (clientX && clientY) {
        addThought('💥 糟糕!', clientX, clientY, '#ff8a80');
      }
      
      const warning = WARNINGS[Math.floor(Math.random() * WARNINGS.length)];
      addPopup(warning.title, warning.content, newHp === 0 ? 'severe' : 'warning');

      if (newHp === 0) {
        setGameStatus('LOST');
        triggerBankruptcy();
      }
    } else {
      playSound('reveal');
      revealCell(x, y, updatedGrid);

      // Positive emotional reinforcement
      const positiveThoughts = ['😊 社交舒适', '呼... 安全', '好感++', '✨ 安心', '沟通顺畅'];
      if (Math.random() > 0.4 && clientX && clientY) {
        addThought(positiveThoughts[Math.floor(Math.random() * positiveThoughts.length)], clientX, clientY, '#81c784');
      }
      setMoodPoints(prev => Math.min(100, prev + 2));
      
      // Check win
      const hiddenSafeCells = updatedGrid.flat().some(c => c.isActive && !c.isMine && c.status === 'HIDDEN');
      if (!hiddenSafeCells) {
        setGameStatus('WON');
        playSound('win');
      }
    }

    setGrid(updatedGrid);
  };

  const handleRightClick = (e: React.MouseEvent, x: number, y: number) => {
    e.preventDefault();
    if (gameStatus !== 'PLAYING' || isPaused) return;

    const cell = grid[y][x];
    if (!cell.isActive || cell.status === 'REVEALED') return;

    const now = Date.now();
    const isDoubleClick = lastRightClick.current?.x === x && 
                          lastRightClick.current?.y === y && 
                          (now - lastRightClick.current.time) < 400;

    playSound('click');
    const newGrid = [...grid.map(row => row.map(c => ({ ...c })))];
    
    let newStatus: CellStatus;
    if (isDoubleClick) {
      newStatus = 'QUESTION';
      addThought('🤔 困惑...', e.clientX, e.clientY, '#90a4ae');
      lastRightClick.current = null; // Reset
    } else {
      newStatus = cell.status === 'FLAGGED' ? 'HIDDEN' : 'FLAGGED';
      if (newStatus === 'FLAGGED') {
        addThought('✋🏻keep ', e.clientX, e.clientY, '#ffd54f');
      }
      lastRightClick.current = { x, y, time: now };
    }
    
    newGrid[y][x].status = newStatus;

    setGrid(newGrid);
    
    // Total flags remaining should only care about flags, not questions
    // But we need to update it based on the transition
    if (cell.status === 'FLAGGED' && newStatus !== 'FLAGGED') {
      setFlagsRemaining(prev => prev + 1);
    } else if (cell.status !== 'FLAGGED' && newStatus === 'FLAGGED') {
      setFlagsRemaining(prev => prev - 1);
    }
  };

  const triggerBankruptcy = async () => {
    // Fill screen with popups
    for (let i = 0; i < 15; i++) {
      await new Promise(r => setTimeout(r, 100));
      addPopup('嚴重警告', '離我远点！没边界感！', 'severe');
    }
    setTimeout(() => setShowGameOver(true), 2000);
  };

  const handleCellHover = (x: number, y: number, clientX?: number, clientY?: number) => {
    if (gameStatus !== 'PLAYING') return;
    if (!grid[y][x].isActive || grid[y][x].status !== 'HIDDEN') {
      if (gazeTimer.current) clearTimeout(gazeTimer.current);
      return;
    }

    if (lastCell.current?.x !== x || lastCell.current?.y !== y) {
      if (gazeTimer.current) clearTimeout(gazeTimer.current);
      lastCell.current = { x, y };
      
      gazeTimer.current = setTimeout(() => {
        playSound('mine');
        const newHp = Math.max(0, hp - 1);
        setHp(newHp);
        setMoodPoints(prev => Math.max(0, prev - 20));
        
        if (clientX && clientY) {
          addThought('😰 被盯住了...', clientX, clientY, '#ff8a80');
        }
        
        addPopup('警告', GAZE_WARNINGS[Math.floor(Math.random() * GAZE_WARNINGS.length)], newHp === 0 ? 'severe' : 'warning');
        
        if (newHp === 0) {
          setGameStatus('LOST');
          triggerBankruptcy();
        }
      }, 15000); // 15 seconds
    }
  };

  const getNumberColor = (num: number) => {
    switch(num) {
      case 1: return 'text-blue-400';
      case 2: return 'text-green-400';
      case 3: return 'text-pink-400';
      case 4: return 'text-purple-400';
      case 5: return 'text-orange-400';
      default: return 'text-red-400 font-black';
    }
  };

  const getMoodColor = (points: number) => {
    if (points > 70) return 'var(--color-mood-calm)';
    if (points > 30) return 'var(--color-mood-anxious)';
    return 'var(--color-mood-alert)';
  };

  const getMoodText = (points: number) => {
    if (points > 85) return '✨ 社交游刃有余';
    if (points > 65) return '🍃 状态良好';
    if (points > 45) return '💬 维持表面平和';
    if (points > 25) return '😰 感到一丝冒犯';
    return '💢 情绪即将失控';
  };

  if (appState === 'START') {
    return <StartScreen onStart={() => setAppState('PLAYING')} />;
  }

  return (
    <div 
      className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-1000 bg-pale-bg ${hp === 0 ? 'bankruptcy-filter' : ''}`}
      style={{
        backgroundColor: moodPoints < 40 ? `rgba(255, 138, 128, ${0.1 * (1 - moodPoints/40)})` : undefined
      }}
    >
      <div className="scanline" />
      
      {/* Desktop Icons (Decoration) */}
      <div className="fixed top-8 left-8 flex flex-col gap-10 select-none z-10">
        <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => { setIsPaused(true); setShowSettings(true); }}>
          <div className="w-16 h-16 rounded-full bg-[#8f8f8f] flex items-center justify-center text-white transition-transform hover:scale-105 active:scale-95 shadow-md">
            <Settings size={32} />
          </div>
          <span className="text-[14px] font-bold text-[#8f8f8f] tracking-widest font-pixel">设置</span>
        </div>
        
        <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => { setIsPaused(true); setShowGuide(true); }}>
          <div className="w-16 h-16 rounded-full bg-[#8f8f8f] flex items-center justify-center text-white transition-transform hover:scale-105 active:scale-95 shadow-md">
            <Mail size={32} />
          </div>
          <span className="text-[14px] font-bold text-[#8f8f8f] tracking-widest font-pixel">避雷指南</span>
        </div>
      </div>

      <motion.div
        className={hp < 2 && gameStatus === 'PLAYING' ? 'jitter-effect flex items-center justify-center' : 'flex items-center justify-center'}
      >
        <Window title="Social Minefield (社交雷区)" className="w-[700px] shadow-sm">
          {/* Main Game Interface top bar */}
          <div className="flex justify-between items-center w-full px-2 mb-8 mt-2">
             <div className="flex items-center gap-4 w-full">
                <div className="w-14 h-14 rounded-full border-[3px] border-[#4a4a4a] flex items-center justify-center shrink-0">
                  <Smile size={36} strokeWidth={2} className="text-[#4a4a4a]" />
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[22px] font-bold tracking-widest text-[#4a4a4a]">好感值</span>
                  <Heart size={26} className="text-[#ff9bc2] fill-[#ff9bc2] animate-pulse" />
                </div>
                
                <div className="flex-1 border-[3px] border-[#4a4a4a] h-6 bg-white relative top-0 mx-2 shadow-sm rounded-sm overflow-hidden flex items-center min-w-[150px]">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(grid.flat().filter(c => c.isActive && !c.isMine && c.status === 'REVEALED').length / Math.max(1, grid.flat().filter(c => c.isActive && !c.isMine).length)) * 100}%` }}
                    className="h-full bg-[#ff9bc2] absolute left-0 top-0 transition-all duration-300"
                  />
                  <span className="absolute w-full text-center text-[10px] text-[#4a4a4a] font-bold z-10 top-1/2 -translate-y-1/2">
                    {Math.floor((grid.flat().filter(c => c.isActive && !c.isMine && c.status === 'REVEALED').length / Math.max(1, grid.flat().filter(c => c.isActive && !c.isMine).length)) * 100)}%
                  </span>
                </div>

                <div className="flex items-center gap-4 shrink-0 justify-end">
                  <div className="border-[3px] border-[#4a4a4a] bg-white px-3 py-1 font-bold text-lg rounded-sm text-[#4a4a4a]">
                    {Math.max(0, flagsRemaining)} / {MINE_COUNT}
                  </div>
                  <div className="flex items-center gap-1">
                     {[...Array(INITIAL_HP)].map((_, i) => (
                        <Heart key={i} size={22} fill={i < hp ? "#4a4a4a" : "transparent"} stroke={i < hp ? "transparent" : "#4a4a4a"} className="text-gray-600" />
                     ))}
                  </div>
                </div>
             </div>
          </div>

          {/* Grid Container */}
          <div className="relative p-6 w-full flex flex-col items-center justify-center">
            <div 
              className="grid gap-[2px]"
              style={{ 
                gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                width: 'fit-content'
              }}
            >
              {grid.map((row, y) => row.map((cell, x) => (
                <div
                  key={`${x}-${y}`}
                  onClick={(e) => handleCellClick(x, y, e.clientX, e.clientY)}
                  onContextMenu={(e) => handleRightClick(e, x, y)}
                  onMouseEnter={(e) => handleCellHover(x, y, e.clientX, e.clientY)}
                  className={`w-[32px] h-[32px] flex items-center justify-center transition-all duration-200
                    ${cell.isActive ? '' : 'pointer-events-none opacity-0'}
                    ${cell.status === 'REVEALED' 
                      ? 'pixel-cell-revealed' 
                      : 'pixel-cell-hidden'
                    }
                  `}
                >
                  {cell.isActive && cell.status === 'REVEALED' ? (
                    cell.isMine ? (
                      <span className="text-xl">🧨</span>
                    ) : (
                      cell.neighborMines > 0 ? (
                        <span className={`text-base font-black ${getNumberColor(cell.neighborMines)}`}>{cell.neighborMines}</span>
                      ) : null
                    )
                  ) : cell.isActive && cell.status === 'FLAGGED' ? (
                    <Hand size={18} className="text-[#FFD700] fill-[#FFD700] stroke-black" />
                  ) : cell.isActive && cell.status === 'QUESTION' ? (
                    <span className="text-pale-ink font-bold text-xl">❓</span>
                  ) : null}
                </div>
              )))}
            </div>

            <div className="w-full flex justify-between mt-2 text-[10px] font-bold text-[#4a4a4a] flex-col gap-3 font-pixel">
              <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2.5 h-2.5 rounded-full border border-[#4a4a4a]" 
                    style={{ backgroundColor: getMoodColor(moodPoints) }}
                  />
                  <span className="text-[12px]">情绪状态: {getMoodText(moodPoints)}</span>
                </div>
              </div>
              
              <div className="flex flex-col gap-1 w-full max-w-sm self-start">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] tracking-wider opacity-80 font-pixel">Emotional Pulse</span>
                </div>
                <div className="mood-bar-container border-[2px] border-[#4a4a4a] h-3 bg-white w-full rounded-full overflow-hidden">
                  <div 
                    className="mood-bar-fill transition-all duration-300"
                    style={{ 
                      width: `${moodPoints}%`,
                      backgroundColor: getMoodColor(moodPoints),
                      height: '100%'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </Window>
      </motion.div>

      {/* Thoughts Layer */}
      <div className="fixed inset-0 pointer-events-none z-[1100]">
        {thoughts.map(t => (
          <div 
            key={t.id}
            className="floating-emotion"
            style={{ 
              left: t.x > 0 ? t.x : '50%', 
              top: t.y > 0 ? t.y : '50%',
              color: t.color
            }}
          >
            {t.text}
          </div>
        ))}
      </div>

      {/* Popups Layer */}
      <AnimatePresence>
        {popups.map(p => (
          <RetroPopup 
            key={p.id} 
            popup={p} 
            onClose={(id) => setPopups(prev => prev.filter(pop => pop.id !== id))} 
          />
        ))}
      </AnimatePresence>

      {/* Game Over Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[1000] bg-black/50 flex items-center justify-center p-4"
          >
            <Window title="设置" onClose={() => { setShowSettings(false); setIsPaused(false); }} className="w-[300px]">
              <div className="flex flex-col gap-4 w-full">
                <button 
                  onClick={() => { setShowSettings(false); setIsPaused(false); }}
                  className="w-full px-6 py-3 bg-white border-[3px] border-[#4a4a4a] font-bold text-[#4a4a4a] text-xl font-pixel hover:bg-gray-100 active:scale-95 cursor-pointer"
                >
                  继续游戏
                </button>
                <button 
                  onClick={() => { setAppState('START'); setShowSettings(false); setIsPaused(false); }}
                  className="w-full px-6 py-3 bg-[#ff9bc2] border-[3px] border-[#4a4a4a] font-bold text-white text-xl font-pixel hover:bg-[#ff8db7] active:scale-95 cursor-pointer text-shadow"
                >
                  回到主页面
                </button>
              </div>
            </Window>
          </motion.div>
        )}

        {showGuide && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[1000] bg-black/50 flex items-center justify-center p-4"
          >
            <Window title="避雷指南" onClose={() => { setShowGuide(false); setIsPaused(false); }} className="w-[450px]">
              <div className="flex flex-col gap-4 text-[#4a4a4a] font-pixel leading-relaxed text-sm">
                <p className="font-bold text-xl mb-2 border-b-[3px] border-[#4a4a4a] pb-2 inline-block">游戏玩法</p>
                <ul className="list-none pl-0 flex flex-col gap-3">
                  <li className="flex items-start gap-2">
                    <span className="shrink-0 mt-0.5">•</span>
                    <span><strong>点击格子：</strong>揭开社交面纱。数字表示周围的“社交雷点”数量。</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="shrink-0 mt-0.5">•</span>
                    <span><strong>右键标记（✋🏻）：</strong>右键标记你认为的雷区，守住彼此社交边界。</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="shrink-0 mt-0.5">•</span>
                    <span><strong>双击右键（❓）：</strong>表示不确定，社交场域多变，谨慎行动。</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="shrink-0 mt-0.5">•</span>
                    <span><strong>信用值与情绪：</strong>踩到雷或盯着一个格子太久会扣除信用（HP），信用归零则社交破产。良好的情绪来自精准的社交距离掌控。</span>
                  </li>
                </ul>
                <button 
                  onClick={() => { setShowGuide(false); setIsPaused(false); }}
                  className="mt-4 w-full px-6 py-3 bg-white border-[3px] border-[#4a4a4a] font-bold text-[#4a4a4a] text-xl hover:bg-gray-100 active:scale-95 cursor-pointer"
                >
                  明白啦
                </button>
              </div>
            </Window>
          </motion.div>
        )}

        {showGameOver && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[1000] bg-black/80 flex items-center justify-center p-4"
          >
            <Window title="系统致命错误" className="max-w-md">
              <div className="flex flex-col items-center gap-6 py-4">
                <div className="pixel-card p-6 bg-white text-center border-2 border-red-200">
                  <Ban size={64} className="text-red-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-black mb-2 text-pale-ink">社交破产</h2>
                  <p className="text-xs text-gray-500 leading-relaxed font-bold">
                    对方已开启朋友验证，你目前处于屏蔽状态。<br />
                    (Social distance exceeded safe limits.)
                  </p>
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={initGrid}
                    className="pixel-button px-8 py-3 bg-pale-mint"
                  >
                    重新建立信任
                  </button>
                  <button 
                    onClick={() => window.location.reload()}
                    className="pixel-button px-8 py-3 bg-white"
                  >
                    确定
                  </button>
                </div>
              </div>
            </Window>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Win Modal */}
      <AnimatePresence>
        {gameStatus === 'WON' && !popups.length && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed inset-0 z-[1000] bg-teal-900/40 flex items-center justify-center p-4"
          >
            <Window title="任务完成" className="max-w-md">
              <div className="flex flex-col items-center gap-6 py-4">
                <div className="p-4 text-center">
                  <Scan size={64} className="text-green-600 mx-auto mb-4 animate-pulse" />
                  <h2 className="text-2xl font-bold mb-2">完美的社交距离</h2>
                  <p className="text-sm text-gray-700 font-pixel">
                    你已成功解除所有舒适区，保持了优雅的社交距离。
                  </p>
                </div>
                <button 
                  onClick={initGrid}
                  className="pixel-button px-12 py-3 bg-pale-mint"
                >
                  再次挑战
                </button>
              </div>
            </Window>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Taskbar */}
      <div className="fixed bottom-0 left-0 right-0 h-12 pixel-card rounded-none border-b-0 border-l-0 border-r-0 flex items-center px-2 gap-2 z-[500] bg-white">
        <button className="pixel-button h-9 flex items-center gap-2 font-bold px-4 bg-pale-pink">
          <div className="bg-pale-ink rounded-sm p-0.5">
            <Scan size={14} className="text-white" />
          </div>
          系统 (System)
        </button>
        <div className="flex-1 h-9 pixel-card border-2 shadow-none mx-2 flex items-center px-4 text-[10px] text-pale-ink/60 font-bold italic overflow-hidden">
          <motion.span
            animate={{ x: [200, -200] }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          >
            正在监测社交场域敏感度... 保持优美的距离...
          </motion.span>
        </div>
        <div className="pixel-card border-2 shadow-none h-9 px-4 flex items-center gap-4 bg-pale-bg/30">
          <Volume2 size={18} className={`cursor-pointer ${isMuted ? 'text-red-400 opacity-50' : ''}`} onClick={() => setIsMuted(!isMuted)} />
          <span className="font-bold text-xs">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
}
