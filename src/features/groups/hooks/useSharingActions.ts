/**
 * @file packages/whoseturnnow/src/features/groups/hooks/useSharingActions.ts
 * @stamp {"ts":"2025-10-25T15:15:00Z"}
 * @architectural-role Hook
 *
 * @description
 * A specialized action hook that encapsulates all logic related to sharing and
 * invitations. It handles the creation of generic and targeted invitation
 * links, as well as recovery links for anonymous users, abstracting away the
 * browser's Web Share API and clipboard fallback.
 *
 * @core-principles
 * 1. OWNS all logic for generating and sharing URLs related to the group.
 * 2. MUST gracefully fall back to clipboard copy if the Web Share API is not available.
 * 3. MUST be stateless, receiving state and setters from its parent orchestrator.
 *
 * @api-declaration
 *   - `useSharingActions`: The exported hook function.
 *   - `returns.handleGenericInvite`: Shares a generic link to join the group.
 *   - `returns.handleTargetedInvite`: Shares a link to claim a specific placeholder.
 *   - `returns.handleRecoveryLink`: Shares a link for an anonymous user to recover access.
 *
 * @contract
 *   assertions:
 *     purity: mutates # Interacts with browser APIs (clipboard, Web Share).
 *     state_ownership: none
 *     external_io: none
 */

import { useCallback } from 'react';
import type { Group } from '../../../types/group';
import { logger } from '../../../shared/utils/debug';

interface SharingActionsProps {
  groupId: string | undefined;
  group: Group | null;
  setFeedback: (feedback: { message: string; severity: 'success' | 'error' } | null) => void;
}

export function useSharingActions({
  groupId,
  group,
  setFeedback,
}: SharingActionsProps) {
  const handleShare = useCallback(
    async (url: string, title: string, successMessage: string) => {
      if (navigator.share) {
        try {
          await navigator.share({
            title: title,
            text: `Join "${group?.name || 'the list'}" on Whose Turn Now!`,
            url: url,
          });
        } catch (error) {
          // Log cancellations or failures, but don't show a snackbar for them.
          logger.log('Web Share API was cancelled or failed.', { error });
        }
      } else {
        // Fallback for browsers without the Web Share API.
        await navigator.clipboard.writeText(url);
        setFeedback({ message: successMessage, severity: 'success' });
      }
    },
    [group?.name, setFeedback],
  );

  const handleGenericInvite = useCallback(() => {
    if (!groupId || !group) return;
    const url = `${window.location.origin}/join/${groupId}`;
    handleShare(url, `Join my list: ${group.name}`, 'Invite link copied!');
  }, [groupId, group, handleShare]);

  const handleTargetedInvite = useCallback(
    (participantId: string) => {
      if (!groupId || !group) return;
      const participant = group.participants.find((p) => p.id === participantId);
      const participantName = participant?.nickname || 'this spot';
      const url = `${window.location.origin}/join/${groupId}?participantId=${participantId}`;
      handleShare(
        url,
        `Claim the '${participantName}' spot`,
        `Claim link for '${participantName}' copied!`,
      );
    },
    [groupId, group, handleShare],
  );

  const handleRecoveryLink = useCallback(() => {
    if (!groupId || !group) return;
    const url = `${window.location.origin}/join/${groupId}`;
    handleShare(
      url,
      `Access link for: ${group.name}`,
      'Recovery link copied! Use this on another device.',
    );
  }, [groupId, group, handleShare]);

  return {
    handleGenericInvite,
    handleTargetedInvite,
    handleRecoveryLink,
  };
}