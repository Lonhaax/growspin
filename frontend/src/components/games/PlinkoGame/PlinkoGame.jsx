"use client";
// Main PlinkoGame - Enhanced with Special Balls & Colorful UI
import { useState, useRef, useCallback, useEffect } from 'react';
import {
    Button,
    Space,
    Tooltip,
    Typography,
    Modal,
    Drawer,
    Statistic,
    Row,
    Col,
    Card,
    Tag,
    notification,
    Badge
} from 'antd';
import {
    SettingOutlined,
    ExpandOutlined,
    BarChartOutlined,
    SafetyCertificateOutlined,
    SoundOutlined,
    FullscreenExitOutlined,
    TrophyOutlined,
    ThunderboltOutlined,
    CheckCircleOutlined,
    FireOutlined,
    StarOutlined,
    RightOutlined,
    BugOutlined,
    CloseOutlined,
    ReloadOutlined,
    LineChartOutlined
} from '@ant-design/icons';
import Chart from 'chart.js/auto';
import Plinko from './Plinko';
import Sidebar from './Sidebar';
import MobileBetSheet from '../MobileBetSheet';
import { useAuth } from '@/context/AuthContext';
import { ProvablyFairModal } from '@/components/ui/ProvablyFairModal';
import { DEFAULT_BALANCE, getBinColors, BIN_PAYOUTS } from './constants';
import { dropPlinkoBall } from './dropPlinkoBall';

import { useWallet } from '@/context/WalletContext';
import './PlinkoGame.css';

const { Text, Title, Paragraph } = Typography;

// Ball types with special effects
const BALL_TYPES = {
    normal: {
        id: 'normal',
        name: 'Basic Coin',
        color: '#ff4d4f',
        multiplierBonus: 1,
        icon: '🪙',
        image: 'https://static.wikia.nocookie.net/growtopia/images/8/8f/ItemSprites.png/revision/latest/window-crop/width/32/x-offset/2624/y-offset/768/window-width/32/window-height/32?format=webp&fill=cb-20260219100732',
        description: 'Standard payout (1x)',
        cost: 1
    },
    bronze: {
        id: 'bronze',
        name: 'Bronze Coin',
        color: '#cd7f32',
        multiplierBonus: 2,
        icon: '🟤',
        image: '/images/coins/coin_bronze.svg',
        description: 'All payouts multiplied by 2x',
        cost: 2
    },
    silver: {
        id: 'silver',
        name: 'Silver Coin',
        color: '#bdc3c7',
        multiplierBonus: 3,
        icon: '⚪',
        image: '/images/coins/coin_silver.svg',
        description: 'All payouts multiplied by 3x',
        cost: 3
    },
    emerald: {
        id: 'emerald',
        name: 'Emerald Coin',
        color: '#2ecc71',
        multiplierBonus: 5,
        icon: '🟢',
        image: '/images/coins/coin_emerald.svg',
        description: 'All payouts multiplied by 5x',
        cost: 5
    },
    ruby: {
        id: 'ruby',
        name: 'Ruby Coin',
        color: '#e74c3c',
        multiplierBonus: 10,
        icon: '🔴',
        image: '/images/coins/coin_ruby.svg',
        description: 'All payouts multiplied by 10x',
        cost: 10
    },
    sapphire: {
        id: 'sapphire',
        name: 'Sapphire Coin',
        color: '#3498db',
        multiplierBonus: 20,
        icon: '🔵',
        image: '/images/coins/coin_sapphire.svg',
        description: 'All payouts multiplied by 20x',
        cost: 20
    }
};

function PlinkoGame() {
    // Shared Wallet
    const { balance, placeBet, addWinnings, refreshUser } = useWallet()
    // State
    const [betAmount, setBetAmount] = useState(1);
    const [rowCount, setRowCount] = useState(16);
    const [riskLevel, setRiskLevel] = useState('medium');
    const [winRecords, setWinRecords] = useState([]);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [selectedBallType, setSelectedBallType] = useState('normal');

    // Provably Fair System (stubs - RNG handled server-side)
    const [provablyFair] = useState(null);

    // Streak tracking
    const [currentStreak, setCurrentStreak] = useState(0);
    const [maxStreak, setMaxStreak] = useState(0);

    // UI States
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [fairnessModalOpen, setFairnessModalOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Debug State
    const [isDebugMode, setIsDebugMode] = useState(false);
    const [debugData, setDebugData] = useState(null);

    const engineRef = useRef(null);
    const pendingDropsRef = useRef(0);
    const gameDisplayRef = useRef(null);
    const chartCanvasRef = useRef(null);
    const chartInstanceRef = useRef(null);

    // Drag refs (Live Stats)
    const widgetRef = useRef(null);
    const isDragging = useRef(false);
    const dragOffset = useRef({ x: 0, y: 0 });
    const profitHistoryRef = useRef([0]);

    // Drag refs (Debug Widget)
    const debugWidgetRef = useRef(null);
    const isDebugDragging = useRef(false);
    const debugDragOffset = useRef({ x: 0, y: 0 });

    // Chart.js State
    const [hoveredProfitValue, setHoveredProfitValue] = useState(null);

    // Calculate statistics
    const winsCount = winRecords.filter(r => r.profit >= 0).length;
    const lossesCount = winRecords.filter(r => r.profit < 0).length;
    const stats = {
        totalDrops: winRecords.length,
        totalWagered: winRecords.reduce((sum, r) => sum + r.betAmount, 0),
        totalProfit: winRecords.reduce((sum, r) => sum + r.profit, 0),
        biggestWin: winRecords.length > 0 ? Math.max(...winRecords.map(r => r.payout.multiplier)) : 0,
        avgMultiplier: winRecords.length > 0
            ? (winRecords.reduce((sum, r) => sum + r.payout.multiplier, 0) / winRecords.length).toFixed(2)
            : 0,
        rubyBalls: winRecords.filter(r => r.ballType === 'ruby').length,
        sapphireBalls: winRecords.filter(r => r.ballType === 'sapphire').length,
    };

    // Last win
    const lastWin = winRecords.length > 0 ? winRecords[winRecords.length - 1] : null;

    // Current ball type
    const currentBall = BALL_TYPES[selectedBallType];
    const effectiveBetCost = betAmount * currentBall.cost;

    // Chart Data for Live Stats
    const chartData = winRecords.slice(-40);
    const maxProfit = chartData.length > 0 ? Math.max(0, ...chartData.map(r => r.profit)) : 1;
    const minProfit = chartData.length > 0 ? Math.min(0, ...chartData.map(r => r.profit)) : -1;
    const profitRangeMax = Math.max(maxProfit, 1);
    const profitRangeMin = Math.abs(Math.min(minProfit, -1));

    // Handle balance change
    const handleBalanceChange = useCallback((amount) => {
        if (amount > 0) {
            addWinnings(amount);
        }
        // Negative amounts (bets) are handled by placeBet in handleDropBall
    }, [addWinnings]);

    // Calculate bonus multiplier for special balls
    const calculateBonusMultiplier = useCallback((ballType) => {
        const ball = BALL_TYPES[ballType];
        return ball.multiplierBonus || 1;
    }, []);

    // Handle ball enter bin
    const handleBallEnterBin = useCallback((data) => {
        const ballType = data.ballType || selectedBallType;
        const actualBall = BALL_TYPES[ballType] || BALL_TYPES.normal;

        const bonusMultiplier = calculateBonusMultiplier(ballType);
        const finalMultiplier = data.payout.multiplier * bonusMultiplier;
        const finalPayout = data.betAmount * finalMultiplier;
        const profit = finalPayout - (data.betAmount * actualBall.cost);

        const newRecord = {
            id: Date.now() + Math.random(),
            ...data,
            ballType: ballType,
            bonusMultiplier,
            payout: {
                ...data.payout,
                multiplier: finalMultiplier,
                value: finalPayout,
                originalMultiplier: data.payout.multiplier
            },
            profit
        };

        setWinRecords(prev => [...prev, newRecord]);

        // Refresh balance from server after each ball lands
        refreshUser();

        // Track streak
        if (profit > 0) {
            setCurrentStreak(prev => {
                const newStreak = prev + 1;
                if (newStreak > maxStreak) setMaxStreak(newStreak);
                return newStreak;
            });
        } else {
            setCurrentStreak(0);
        }

        // Adjust balance for special ball cost difference
        const costAdjustment = data.betAmount * (actualBall.cost - 1);
        if (costAdjustment !== 0) {
            handleBalanceChange(-costAdjustment);
        }
    }, [selectedBallType, calculateBonusMultiplier, handleBalanceChange, maxStreak, refreshUser]);


    // Drag handler for debug widget
    const handleDebugDragStart = useCallback((e) => {
        if (!debugWidgetRef.current) return;
        isDebugDragging.current = true;
        const rect = debugWidgetRef.current.getBoundingClientRect();
        debugDragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };

        const handleMouseMove = (moveEvt) => {
            if (!isDebugDragging.current || !debugWidgetRef.current) return;
            const newX = moveEvt.clientX - debugDragOffset.current.x;
            const newY = moveEvt.clientY - debugDragOffset.current.y;
            // Clamp to viewport
            const maxX = window.innerWidth - debugWidgetRef.current.offsetWidth;
            const maxY = window.innerHeight - debugWidgetRef.current.offsetHeight;
            debugWidgetRef.current.style.left = `${Math.max(0, Math.min(newX, maxX))}px`;
            debugWidgetRef.current.style.top = `${Math.max(0, Math.min(newY, maxY))}px`;
            debugWidgetRef.current.style.right = 'auto';
            debugWidgetRef.current.style.bottom = 'auto';
            debugWidgetRef.current.style.transform = 'none'; // Prevents centering transform from messing up
        };

        const handleMouseUp = () => {
            isDebugDragging.current = false;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, []);


    // Update debug info whenever ready or after a drop
    useEffect(() => {
        if (isDebugMode && provablyFair) {
            provablyFair.peekPlinkoPath(rowCount).then(res => {
                setDebugData(res);
            });
        }
    }, [isDebugMode, rowCount, provablyFair, winRecords]);

    // Drop ball
    const handleDropBall = useCallback(async (isCancelled) => {
        const result = await dropPlinkoBall({
            engine: engineRef.current,
            pendingDrops: pendingDropsRef,
            provablyFair,
            rowCount,
            betAmount,
            currentBall,
            selectedBallType,
            placeBet,
            isCancelled,
        });
        if (result === 'dropped') {
            // We removed early refreshUser to let the visual drop sequence finish first
        }
        return result;
    }, [currentBall, rowCount, provablyFair, selectedBallType, betAmount, placeBet, refreshUser]);

    // Fullscreen toggle
    const toggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            if (gameDisplayRef.current) {
                gameDisplayRef.current.requestFullscreen().then(() => {
                    setIsFullscreen(true);
                });
            }
        } else {
            document.exitFullscreen().then(() => {
                setIsFullscreen(false);
            });
        }
    }, []);

    // Check for outstanding balls
    const hasOutstandingBalls = engineRef.current?.hasOutstandingBalls?.() || false;

    return (
        <div className="plinko-page">
            <div className="plinko-main" ref={gameDisplayRef}>
                {/* Hot Streak Banner removed - streak shown in History & Statistics */}

                <div className="plinko-container">
                    {/* Sidebar - LEFT */}
                    <MobileBetSheet title="Plinko bet controls" className="plinko-bet-sheet">
                        <div className="plinko-sidebar-wrapper">
                            <Sidebar
                                balance={balance}
                                betAmount={betAmount}
                                setBetAmount={setBetAmount}
                                rowCount={rowCount}
                                setRowCount={setRowCount}
                                riskLevel={riskLevel}
                                setRiskLevel={setRiskLevel}
                                hasOutstandingBalls={hasOutstandingBalls}
                                onDropBall={handleDropBall}
                                onSettingsClick={() => setIsSettingsOpen(!isSettingsOpen)}
                                isSettingsOpen={isSettingsOpen}
                                selectedBallType={selectedBallType}
                                setSelectedBallType={setSelectedBallType}
                                ballTypes={BALL_TYPES}
                                currentBall={currentBall}
                                lastWin={lastWin}
                                winRecords={winRecords}
                                currentStreak={currentStreak}
                                maxStreak={maxStreak}
                                effectiveBetCost={effectiveBetCost}
                            />
                        </div>
                    </MobileBetSheet>

                    {/* Plinko Game Area */}
                    <div className="plinko-game-wrapper">
                        <Plinko
                            rowCount={rowCount}
                            riskLevel={riskLevel}
                            betAmount={betAmount}
                            winRecords={winRecords}
                            onBallEnterBin={handleBallEnterBin}
                            onBalanceChange={handleBalanceChange}
                            engineRef={engineRef}
                            ballColor={currentBall.color}
                        />

                        {/* Debug Overlay */}
                        {isDebugMode && debugData && (
                            <div className="fixed-widget debug-widget fade-in-scale" ref={debugWidgetRef}>
                                <div className="widget-header debug-widget-header" onMouseDown={handleDebugDragStart}>
                                    <div className="widget-title">
                                        <BugOutlined style={{ color: 'var(--primary)', fontSize: 18 }} />
                                        <span style={{ color: 'var(--primary)' }}>FAIRNESS DEBUG</span>
                                    </div>
                                    <div className="widget-actions">
                                        <button className="widget-btn-icon" onMouseDown={(e) => e.stopPropagation()} onClick={() => setIsDebugMode(false)}>
                                            <CloseOutlined />
                                        </button>
                                    </div>
                                </div>
                                <div className="widget-content debug-widget-content">
                                    <div className="debug-row">
                                        <span className="debug-label">Next Hash:</span>
                                        <span className="debug-value">{debugData.hash.substring(0, 16)}...</span>
                                    </div>
                                    <div className="debug-row">
                                        <span className="debug-label">Next Nonce:</span>
                                        <span className="debug-value">{debugData.nonce}</span>
                                    </div>
                                    <div className="debug-target">
                                        TARGET BIN: <span className="target-bin">#{debugData.binIndex}</span>
                                        {' → '}
                                        <span className="target-payout">
                                            {BIN_PAYOUTS[rowCount]?.[riskLevel]?.[debugData.binIndex] ?? '?'}×
                                        </span>
                                    </div>
                                    <div className="debug-path-row">
                                        {debugData.path.map((dir, i) => (
                                            <span key={i} className={`debug-path-dot ${dir === 0 ? 'left' : 'right'}`}>
                                                {dir === 0 ? 'L' : 'R'}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Bottom Controls */}
                        <div className="plinko-controls">
                            <Space>
                                <Tooltip title="Game Settings">
                                    <Button
                                        type="text"
                                        icon={<SettingOutlined />}
                                        className="control-btn"
                                        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                                    />
                                </Tooltip>
                                <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
                                    <Button
                                        type="text"
                                        icon={isFullscreen ? <FullscreenExitOutlined /> : <ExpandOutlined />}
                                        className="control-btn"
                                        onClick={toggleFullscreen}
                                    />
                                </Tooltip>
                                <Tooltip title="Statistics (Disabled)">
                                    <Button
                                        type="text"
                                        icon={<BarChartOutlined />}
                                        className="control-btn"
                                    />
                                </Tooltip>
                                <Tooltip title={soundEnabled ? "Mute" : "Unmute"}>
                                    <Button
                                        type="text"
                                        icon={<SoundOutlined />}
                                        className={`control-btn ${soundEnabled ? '' : 'muted'}`}
                                        onClick={() => setSoundEnabled(!soundEnabled)}
                                    />
                                </Tooltip>
                                <Tooltip title={isDebugMode ? "Disable Debug" : "Enable Debug (Peek Fairness)"}>
                                    <Button
                                        type="text"
                                        icon={<BugOutlined />}
                                        className={`control-btn ${isDebugMode ? 'active-debug' : ''}`}
                                        style={{ color: isDebugMode ? 'var(--primary)' : undefined }}
                                        onClick={() => setIsDebugMode(!isDebugMode)}
                                    />
                                </Tooltip>
                            </Space>

                            <span className="logo" style={{ color: 'var(--text-primary)' }}>GrowSpin</span>

                            <button
                                className="footer-btn"
                                onClick={() => setFairnessModalOpen(true)}
                                title="Provably Fair"
                            >
                                <SafetyCertificateOutlined style={{ fontSize: 18 }} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Fairness Modal */}
            <ProvablyFairModal 
                isOpen={fairnessModalOpen} 
                onClose={() => setFairnessModalOpen(false)} 
            />
        </div>
    );
}

export default PlinkoGame;
