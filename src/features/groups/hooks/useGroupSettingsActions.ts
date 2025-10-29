/**
 * @file packages/whoseturnnow/src/features/groups/hooks/useGroupSettingsActions.ts
 * @stamp {"ts":"2025-10-25T15:10:00Z"}
 * @architectural-role Hook
 *
 * @description
 * A specialized action hook for managing high-level, administrative group
 * settings. It provides functions for updating a group's name and icon,
 * deleting a group, and resetting all turn counts.
 *
 * @core-principles
 * 1. OWNS the command logic for all group-level administrative actions.
 * 2. MUST NOT contain its own local UI state (e.g., for loading or feedback).
 * 3. DELEGATES all direct I/O operations to the `groupsRepository`.
 *
 * @api-declaration
 *   - `useGroupSettingsActions`: The exported hook function.
 *   - `returns.handleUpdateGroupName`: Updates the group's name.
 *   - `returns.handleUpdateGroupIcon`: Updates the group's icon.
 *   - `returns.handleConfirmDelete`: Deletes the group.
 *   - `returns.handleConfirmReset`: Resets all turn counts.
 *
 * @contract
 *   assertions:
 *     purity: mutates
 *     state_ownership: none
 *     external_io: firestore
 */

import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { groupsRepository } from '../repository';
import { logger } from '../../../shared/utils/debug';
import type { AppUser } from '../../auth/useAuthStore';
import type { Group } from '../../../types/group';

interface GroupSettingsActionsProps {
  groupId: string | undefined;
  group: Group | null;
  user: AppUser | null;
  setFeedback: (feedback: { message: string; severity: 'success' | 'error' } | null) => void;
}

export function useGroupSettingsActions({
  groupId,
  group,
  user,
  setFeedback,
}: GroupSettingsActionsProps) {
  const navigate = useNavigate();

  const handleUpdateGroupName = useCallback(
    async (newName: string) => {
      if (!groupId || !group) return;
      try {
        await groupsRepository.updateGroupSettings(groupId, {
          name: newName,
          icon: group.icon, // Preserve the existing icon
        });
        setFeedback({ message: 'Group name updated!', severity: 'success' });
      } catch (error) {
        logger.error('Failed to update group name:', { error });
        setFeedback({ message: 'Failed to update name.', severity: 'error' });
      }
    },
    [groupId, group, setFeedback],
  );

  const handleUpdateGroupIcon = useCallback(
    async (newIcon: string) => {
      if (!groupId || !group) return;
      try {
        await groupsRepository.updateGroupSettings(groupId, {
          name: group.name,
          icon: newIcon,
        });
        setFeedback({ message: 'Group icon updated!', severity: 'success' });
      } catch (error) {
        logger.error('Failed to update group icon:', { error });
        setFeedback({ message: 'Failed to update icon.', severity: 'error' });
      }
    },
    [groupId, group, setFeedback],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!groupId) return;
    try {
      await groupsRepository.deleteGroup(groupId);
      navigate('/');
    } catch (error) {
      logger.error('Failed to delete group:', { error });
      setFeedback({ message: 'Failed to delete group.', severity: 'error' });
    }
  }, [groupId, navigate, setFeedback]);

  const handleConfirmReset = useCallback(async () => {
    if (!groupId || !user) return;
    try {
      await groupsRepository.resetAllTurnCounts(groupId, user);
      setFeedback({ message: 'All turn counts have been reset.', severity: 'success' });
    } catch (error) {
      logger.error('Failed to reset counts:', { error });
      setFeedback({ message: 'Failed to reset counts.', severity: 'error' });
    }
  }, [groupId, user, setFeedback]);

  return {
    handleUpdateGroupName,
    handleUpdateGroupIcon,
    handleConfirmDelete,
    handleConfirmReset,
  };
}