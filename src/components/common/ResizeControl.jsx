/**
 * ResizeControl – Manual display scaling component
 * Allows users to adjust the UI scale from 75% to 150%
 * Persists preference in localStorage and applies via CSS custom property
 */
import React, { useState, useEffect } from 'react';
import { Minus, Plus, RotateCcw, ZoomIn } from 'lucide-react';

const SCALE_KEY = 'comrade-ui-scale';
const MIN_SCALE = 75;
const MAX_SCALE = 150;
const STEP = 5;
const DEFAULT_SCALE = 100;

const ResizeControl = ({ compact = false }) => {
    const [scale, setScale] = useState(() => {
        const saved = localStorage.getItem(SCALE_KEY);
        return saved ? parseInt(saved, 10) : DEFAULT_SCALE;
    });

    useEffect(() => {
        applyScale(scale);
    }, []);

    const applyScale = (newScale) => {
        const clampedScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, newScale));
        document.documentElement.style.setProperty('--user-scale', clampedScale / 100);
        localStorage.setItem(SCALE_KEY, clampedScale.toString());
        setScale(clampedScale);
    };

    const handleDecrease = () => applyScale(scale - STEP);
    const handleIncrease = () => applyScale(scale + STEP);
    const handleReset = () => applyScale(DEFAULT_SCALE);

    const handleSliderChange = (e) => {
        applyScale(parseInt(e.target.value, 10));
    };

    if (compact) {
        return (
            <div className="flex items-center gap-2">
                <button
                    onClick={handleDecrease}
                    disabled={scale <= MIN_SCALE}
                    className="p-1.5 text-secondary hover:text-primary hover:bg-secondary rounded-lg transition-colors disabled:opacity-30"
                    title="Decrease size"
                >
                    <Minus size={16} />
                </button>
                <span className="text-sm font-mono font-medium text-primary min-w-[3ch] text-center">
                    {scale}%
                </span>
                <button
                    onClick={handleIncrease}
                    disabled={scale >= MAX_SCALE}
                    className="p-1.5 text-secondary hover:text-primary hover:bg-secondary rounded-lg transition-colors disabled:opacity-30"
                    title="Increase size"
                >
                    <Plus size={16} />
                </button>
            </div>
        );
    }

    return (
        <div className="bg-elevated rounded-xl border border-theme p-5">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                    <ZoomIn className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h3 className="font-semibold text-primary">Display Size</h3>
                    <p className="text-sm text-secondary">Adjust the UI scale for comfort</p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button
                    onClick={handleDecrease}
                    disabled={scale <= MIN_SCALE}
                    className="p-2 text-secondary hover:text-primary hover:bg-secondary rounded-lg transition-colors disabled:opacity-30"
                >
                    <Minus size={20} />
                </button>

                <div className="flex-1 flex flex-col items-center gap-2">
                    <input
                        type="range"
                        min={MIN_SCALE}
                        max={MAX_SCALE}
                        step={STEP}
                        value={scale}
                        onChange={handleSliderChange}
                        className="w-full h-2 bg-secondary rounded-full appearance-none cursor-pointer accent-primary-600
                            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-600
                            [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer"
                    />
                    <div className="flex justify-between w-full text-xs text-tertiary px-1">
                        <span>{MIN_SCALE}%</span>
                        <span className="font-semibold text-primary text-sm">{scale}%</span>
                        <span>{MAX_SCALE}%</span>
                    </div>
                </div>

                <button
                    onClick={handleIncrease}
                    disabled={scale >= MAX_SCALE}
                    className="p-2 text-secondary hover:text-primary hover:bg-secondary rounded-lg transition-colors disabled:opacity-30"
                >
                    <Plus size={20} />
                </button>
            </div>

            {scale !== DEFAULT_SCALE && (
                <button
                    onClick={handleReset}
                    className="mt-3 flex items-center gap-2 text-sm text-secondary hover:text-primary transition-colors mx-auto"
                >
                    <RotateCcw size={14} />
                    Reset to default
                </button>
            )}
        </div>
    );
};

/**
 * Initialize scale on app mount.
 * Call this once from your main layout or App component.
 */
export const initializeScale = () => {
    const saved = localStorage.getItem(SCALE_KEY);
    if (saved) {
        document.documentElement.style.setProperty('--user-scale', parseInt(saved, 10) / 100);
    }
};

export default ResizeControl;
