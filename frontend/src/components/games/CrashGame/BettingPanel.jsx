import { useState, useEffect } from 'react'
import {
    Typography,
    Card,
    Switch,
    Tooltip
} from 'antd'
import {
    ThunderboltOutlined,
    QuestionCircleOutlined
} from '@ant-design/icons'

const { Text } = Typography

function BettingPanel({ phase, betPlaced, multiplier, balance, onBet, onCashout }) {
    const [activeTab, setActiveTab] = useState('manual')
    const [betAmount, setBetAmount] = useState(1.00)
    const [cashoutAt, setCashoutAt] = useState(2.00)
    const [autoCashout, setAutoCashout] = useState(true)

    // Calculate profit
    const profit = betAmount * (cashoutAt - 1)

    // Auto Cashout Logic
    useEffect(() => {
        if (phase === 'running' && betPlaced && autoCashout) {
            if (multiplier >= cashoutAt) {
                onCashout()
            }
        }
    }, [multiplier, phase, betPlaced, autoCashout, cashoutAt, onCashout])

    const handleBetClick = () => {
        if (phase === 'waiting') {
            if (betAmount > 0) {
                onBet(betAmount)
            }
        } else if (phase === 'running' && betPlaced) {
            onCashout()
        }
    }

    const getButtonText = () => {
        if (phase === 'waiting') {
            if (betAmount > balance) return 'Insufficient DL'
            return betPlaced ? 'Cancel Bet' : 'Place Bet'
        }
        if (phase === 'running' && betPlaced) {
            return `Cash Out $${(betAmount * multiplier).toFixed(2)}`
        }
        return 'Place Bet'
    }

    const getButtonClass = () => {
        if (phase === 'running' && betPlaced) return 'bet-button cashout-btn'
        return 'bet-button'
    }

    const setMaxBet = () => {
        if (balance) {
            setBetAmount(balance)
        }
    }

    const handleBetChange = (e) => {
        const val = parseFloat(e.target.value)
        if (!isNaN(val)) {
            setBetAmount(val)
        } else if (e.target.value === '') {
            setBetAmount('')
        }
    }
    
    const handleCashoutChange = (e) => {
        const val = parseFloat(e.target.value)
        if (!isNaN(val)) {
            setCashoutAt(val)
        } else if (e.target.value === '') {
            setCashoutAt('')
        }
    }

    return (
        <div className="betting-panel-3d">
            {/* 3D Tabs */}
            <div className="bet-mode-tabs">
                <button
                    className={`bet-mode-tab ${activeTab === 'manual' ? 'active' : ''}`}
                    onClick={() => setActiveTab('manual')}
                >
                    Manual
                </button>
                <button
                    className={`bet-mode-tab ${activeTab === 'auto' ? 'active' : ''}`}
                    onClick={() => setActiveTab('auto')}
                >
                    Auto
                </button>
            </div>

            {activeTab === 'manual' ? (
                <div className="bet-form">
                    {/* Bet Amount */}
                    <div className="form-group">
                        <div className="form-header">
                            <label className="form-label" style={{ margin: 0 }}>Bet Amount</label>
                            <Text type="secondary" style={{ margin: 0 }}>Balance: {Number(balance || 0).toFixed(2)} DL</Text>
                        </div>
                        <div className="custom-input-group">
                            <div className="input-prefix">
                                <img src="/dl.webp" alt="DL" style={{width: 20, height: 20, objectFit: 'contain'}} />
                            </div>
                            <input
                                type="number"
                                className="custom-input"
                                value={betAmount}
                                onChange={handleBetChange}
                                min="0"
                                step="0.01"
                            />
                            <div className="input-controls">
                                <button className="control-btn" onClick={() => setBetAmount(prev => Math.max(0, (Number(prev) || 0) / 2))}>½</button>
                                <button className="control-btn" onClick={() => setBetAmount(prev => (Number(prev) || 0) * 2)}>2×</button>
                                <button className="control-btn" onClick={setMaxBet}>Max</button>
                            </div>
                        </div>
                    </div>

                    {/* Cashout At */}
                    <div className="form-group mobile-sheet-secondary">
                        <div className="form-header">
                            <label className="form-label" style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
                                Auto Cashout
                                <Tooltip title="Auto cashout when multiplier reaches this value">
                                    <QuestionCircleOutlined style={{ marginLeft: 6, cursor: 'pointer', color: '#b1b6c6' }} />
                                </Tooltip>
                            </label>
                            <Switch
                                size="small"
                                checked={autoCashout}
                                onChange={setAutoCashout}
                                className="crash-switch"
                            />
                        </div>
                        <div className={`custom-input-group ${!autoCashout ? 'disabled' : ''}`}>
                            <input
                                type="number"
                                className="custom-input"
                                value={cashoutAt}
                                onChange={handleCashoutChange}
                                min="1.01"
                                step="0.01"
                                disabled={!autoCashout}
                            />
                            <div className="input-suffix">×</div>
                        </div>
                    </div>

                    {/* Profit Display - 3D Card Style */}
                    <div className="profit-card-3d mobile-sheet-secondary">
                        <div className="form-header" style={{ marginBottom: 4 }}>
                            <label className="form-label" style={{ margin: 0 }}>Profit on Win</label>
                            <Text type="secondary" style={{ margin: 0 }}>{profit.toFixed(2)} DL</Text>
                        </div>
                        <Text strong style={{ color: 'var(--success)', fontSize: 16, fontFamily: "'Courier New', monospace" }}>
                            +{profit.toFixed(2)} DL
                        </Text>
                    </div>

                    {/* Bet Button */}
                    <button
                        onClick={handleBetClick}
                        className={getButtonClass()}
                        disabled={(phase === 'running' && !betPlaced) || (phase === 'waiting' && betAmount > balance)}
                    >
                        <ThunderboltOutlined style={{ marginRight: 6 }} />
                        {getButtonText()}
                    </button>
                </div>
            ) : (
                <div className="bet-form">
                    <Card size="small" style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', borderRadius: 10 }}>
                        <Text type="secondary">
                            Auto betting coming soon! Configure automated betting strategies.
                        </Text>
                    </Card>
                </div>
            )}
        </div>
    )
}

export default BettingPanel
