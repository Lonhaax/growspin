"use client";
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import io from 'socket.io-client';
import { useWallet } from '@/context/WalletContext';
import { apiFetch } from '@/lib/auth';
import './CryptoCrash.css';

export default function CryptoCrashGame() {
    const { balance, refreshUser } = useWallet();
    const [socket, setSocket] = useState(null);
    const [gameState, setGameState] = useState('waiting'); // waiting, running, crashed
    const [multiplier, setMultiplier] = useState(1.00);
    const [timer, setTimer] = useState(0);
    const [players, setPlayers] = useState([]);
    const [history, setHistory] = useState([]);

    const [betAmount, setBetAmount] = useState('10');
    const [autoCashout, setAutoCashout] = useState('2.00');
    
    const [betPlaced, setBetPlaced] = useState(false);
    const [hasCashedOut, setHasCashedOut] = useState(false);

    const canvasRef = useRef(null);

    useEffect(() => {
        // Fetch initial state
        fetch((process.env.NEXT_PUBLIC_API_URL || '') + '/api/play/crash/state')
            .then(res => res.json())
            .then(data => {
                setGameState(data.state);
                setTimer(data.timer);
                setMultiplier(data.multiplier);
                setHistory(data.history || []);
                setPlayers(data.players || []);
            })
            .catch(err => console.error(err));

        const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const newSocket = io(backendUrl, { path: '/socket.io' });
        setSocket(newSocket);

        newSocket.on('crash:state', (data) => {
            setGameState(data.state);
            setTimer(data.timer || 0);
            setPlayers(data.players || []);
            if (data.state === 'waiting') {
                setMultiplier(1.00);
                setBetPlaced(false);
                setHasCashedOut(false);
                refreshUser();
            }
        });

        newSocket.on('crash:timer', (time) => {
            setTimer(time);
        });

        newSocket.on('crash:start', (data) => {
            setGameState(data.state);
            setMultiplier(data.multiplier);
        });

        newSocket.on('crash:tick', (data) => {
            setMultiplier(data.multiplier);
        });

        newSocket.on('crash:crashed', (data) => {
            setGameState('crashed');
            setMultiplier(data.crashPoint);
            setHistory(data.history || []);
            setPlayers(data.players || []);
            refreshUser();
        });

        newSocket.on('crash:players', (newPlayers) => {
            setPlayers(newPlayers);
        });

        return () => {
            newSocket.disconnect();
        };
    }, []);

    // Canvas drawing
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        
        // Handle resize
        const resize = () => {
            const parent = canvas.parentElement;
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
        };
        window.addEventListener('resize', resize);
        resize();

        let animId;
        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw grid
            ctx.strokeStyle = "rgba(116, 133, 183, 0.15)";
            ctx.lineWidth = 1;
            const gridSpacing = 80;
            for(let x=0; x<canvas.width; x+=gridSpacing) {
                ctx.beginPath();
                ctx.setLineDash([4, 3]);
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvas.height);
                ctx.stroke();
            }
            for(let y=canvas.height; y>0; y-=gridSpacing) {
                ctx.beginPath();
                ctx.setLineDash([4, 3]);
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
            }
            ctx.setLineDash([]);

            if (gameState === 'running' || gameState === 'crashed') {
                // Draw curve
                ctx.beginPath();
                ctx.moveTo(0, canvas.height);
                
                // Simple exponential curve
                const points = 50;
                for(let i=0; i<=points; i++) {
                    const pct = i/points;
                    const x = pct * canvas.width;
                    // The curve goes up exponentially. 
                    // multiplier is current max
                    const maxM = Math.max(multiplier, 2);
                    const currentPointM = 1 + (multiplier - 1) * Math.pow(pct, 2);
                    
                    const normalizedY = (currentPointM - 1) / (maxM - 1);
                    const y = canvas.height - (normalizedY * (canvas.height * 0.8));
                    
                    ctx.lineTo(x, y);
                }
                
                ctx.strokeStyle = gameState === 'crashed' ? '#ef4444' : '#7485b7';
                ctx.lineWidth = 4;
                ctx.shadowColor = gameState === 'crashed' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(116, 133, 183, 0.4)';
                ctx.shadowBlur = 15;
                ctx.shadowOffsetY = 4;
                ctx.stroke();
                ctx.shadowColor = 'transparent';
            }

            animId = requestAnimationFrame(draw);
        };
        draw();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animId);
        };
    }, [gameState, multiplier]);

    const handleBet = async () => {
        try {
            const res = await apiFetch('/play/crash/bet', {
                method: 'POST',
                body: JSON.stringify({ amount: parseFloat(betAmount), autoCashout: parseFloat(autoCashout) })
            });
            const data = await res.json();
            if(data.error) throw new Error(data.error);
            setBetPlaced(true);
            refreshUser();
        } catch(e) {
            alert(e.message);
        }
    };

    const handleCashout = async () => {
        try {
            const res = await apiFetch('/play/crash/cashout', {
                method: 'POST'
            });
            const data = await res.json();
            if(data.error) throw new Error(data.error);
            setHasCashedOut(true);
            refreshUser();
        } catch(e) {
            alert(e.message);
        }
    };

    return (
        <div className="crypto-crash-wrapper">
            <div className="crash-history-strip">
                <AnimatePresence>
                    {history.map((item) => {
                        const h = item.crashPoint;
                        const colorClass = h < 1.5 ? 'x1' : h < 5 ? 'x2' : 'x3';
                        return (
                            <motion.div 
                                key={item.id}
                                layout
                                initial={{ opacity: 0, scale: 0.5, x: -20 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                className={`history-item ${colorClass}`}
                            >
                                {h.toFixed(2)}x
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            <div className="crash-container">
                <div className="crash-left">
                    <div className="bet-input-group">
                        <div className="input-row">
                            <input 
                                type="number" 
                                value={betAmount} 
                                onChange={e => setBetAmount(e.target.value)} 
                                disabled={gameState !== 'waiting' || betPlaced}
                            />
                            <span>💰</span>
                        </div>
                        <div className="quick-bets">
                            <button onClick={() => setBetAmount(prev => Math.floor(parseFloat(prev) + 10).toString())}>+10</button>
                            <button onClick={() => setBetAmount(prev => Math.floor(parseFloat(prev) + 100).toString())}>+100</button>
                            <button onClick={() => setBetAmount(prev => Math.floor(parseFloat(prev) * 2).toString())}>x2</button>
                            <button onClick={() => setBetAmount(prev => Math.max(1, Math.floor(parseFloat(prev) / 2)).toString())}>1/2</button>
                        </div>
                    </div>

                    <div className="bet-input-group">
                        <div className="input-row">
                            <label>Auto-stop:</label>
                            <input 
                                type="number" 
                                value={autoCashout} 
                                onChange={e => setAutoCashout(e.target.value)} 
                                disabled={gameState !== 'waiting' || betPlaced}
                            />
                        </div>
                    </div>

                    {gameState === 'waiting' && !betPlaced && (
                        <button className="btn-crash action-btn" onClick={handleBet}>
                            Place Bet
                        </button>
                    )}
                    {gameState === 'waiting' && betPlaced && (
                        <button className="btn-crash action-btn waiting" disabled>
                            Waiting...
                        </button>
                    )}
                    {gameState === 'running' && betPlaced && !hasCashedOut && (
                        <button className="btn-crash action-btn cashout" onClick={handleCashout}>
                            Cashout ({Math.floor(parseFloat(betAmount) * multiplier)} DLs)
                        </button>
                    )}
                    {gameState === 'running' && betPlaced && hasCashedOut && (
                        <button className="btn-crash action-btn success" disabled>
                            Cashed Out!
                        </button>
                    )}
                    {gameState === 'running' && !betPlaced && (
                        <button className="btn-crash action-btn waiting" disabled>
                            Game in progress...
                        </button>
                    )}
                    {gameState === 'crashed' && (
                        <button className="btn-crash action-btn crashed" disabled>
                            Crashed
                        </button>
                    )}

                    <div className="players-list">
                        <div className="players-header">
                            <span>Players</span>
                            <span>{players.length}</span>
                        </div>
                        <div className="players-scroll">
                            {players.map((p, i) => (
                                <div key={i} className={`player-row ${p.cashedOut ? 'win' : ''} ${gameState==='crashed' && !p.cashedOut ? 'loss' : ''}`}>
                                    <div className="p-user">
                                        <img src={p.avatar || '/default-avatar.png'} alt=""/>
                                        <span>{p.username}</span>
                                    </div>
                                    <div className="p-bet">{Math.floor(p.amount)}</div>
                                    <div className="p-mult">{p.cashedOut ? `${p.cashoutMultiplier.toFixed(2)}x` : '-'}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="crash-right">
                    <div className="canvas-wrapper">
                        <div className={`multiplier-display ${gameState === 'crashed' ? 'crashed' : ''}`}>
                            {gameState === 'waiting' ? `00:${timer.toString().padStart(2, '0')}` : `${multiplier.toFixed(2)}x`}
                        </div>
                        <canvas ref={canvasRef}></canvas>
                    </div>
                </div>
            </div>
        </div>
    );
}
