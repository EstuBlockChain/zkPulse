import { writable } from 'svelte/store';

// Tipos para las estadísticas del usuario
export interface GameRun {
    score: number;
    timestamp: number;
}

export interface UserStats {
    bestScore: number;
    history: GameRun[];
    totalGamesPlayed: number;
}

// Estado inicial
const initialStats: UserStats = {
    bestScore: 0,
    history: [],
    totalGamesPlayed: 0
};

function createUserStats() {
    // Intentar cargar del localStorage si estamos en el navegador
    let storedStats = initialStats;
    if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('zkPulse_userStats');
        if (stored) {
            try {
                storedStats = JSON.parse(stored);
            } catch (e) {
                console.error('Error parsing stored stats', e);
            }
        }
    }

    const { subscribe, set, update } = writable<UserStats>(storedStats);

    return {
        subscribe,
        addRun: (score: number) => {
            update(stats => {
                const newRun: GameRun = { score, timestamp: Date.now() };
                
                // Mantener solo los últimos 5 juegos en el historial para el cálculo
                const newHistory = [newRun, ...stats.history].slice(0, 5);
                
                const newStats = {
                    bestScore: Math.max(stats.bestScore, score),
                    history: newHistory,
                    totalGamesPlayed: stats.totalGamesPlayed + 1
                };

                // Persistir
                if (typeof localStorage !== 'undefined') {
                    localStorage.setItem('zkPulse_userStats', JSON.stringify(newStats));
                }

                return newStats;
            });
        },
        reset: () => {
            set(initialStats);
            if (typeof localStorage !== 'undefined') {
                localStorage.removeItem('zkPulse_userStats');
            }
        }
    };
}

export const userStats = createUserStats();

// Helpers para calcular métricas derivadas
export function calculateReliability(stats: UserStats): number {
    if (stats.history.length === 0) return 0;

    const avgLast5 = stats.history.reduce((acc, run) => acc + run.score, 0) / stats.history.length;
    // 60% promedio últimos 5 + 40% mejor score histórico
    return Math.round((avgLast5 * 0.6) + (stats.bestScore * 0.4));
}
