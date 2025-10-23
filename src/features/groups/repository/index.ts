/**
 * @file packages/whoseturnnow/src/features/groups/repository/index.ts
 * @stamp {"ts":"2025-10-23T10:10:00Z"}
 * @architectural-role Module Facade
 * @description
 * This file serves as the single, public-facing API for the entire groups
 * repository module. It uses the facade pattern to import all functions from the
 * granular query and command files and re-exports them as a single, cohesive
 * `groupsRepository` object. This makes the internal file structure an
 * implementation detail and provides a stable, unified interface for the rest
 * of the application.
 * @core-principles
 * 1. IS the single, authoritative public API for the groups repository.
 * 2. MUST abstract away the internal query/command split from its consumers.
 * 3. MUST NOT contain any of its own logic; it is purely for composition.
 * @api-declaration
 *   - groupsRepository: The unified object containing all repository functions.
 * @contract
 *   assertions:
 *     purity: pure
 *     state_ownership: none
 *     external_io: none
 */

import * as queries from './groups.query';
import * as groupCommands from './group.command';
import * as participantCommands from './participants.command';
import * as turnCommands from './turns.command';

/**
 * The unified groups repository, providing all functions for reading and
 * writing group data.
 */
export const groupsRepository = {
  ...queries,
  ...groupCommands,
  ...participantCommands,
  ...turnCommands,
};