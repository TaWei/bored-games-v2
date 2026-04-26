/**
 * Game engine index — imports and registers all game engines.
 * Import this file during server startup to populate the registry.
 */
import { registerGame } from './registry';
import { ticTacToeEngine } from './tic-tac-toe/engine';

// Register all engines
registerGame(ticTacToeEngine);
