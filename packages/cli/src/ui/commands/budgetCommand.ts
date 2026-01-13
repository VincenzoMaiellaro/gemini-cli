/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  THINKING_BUDGET_UNLIMITED,
  THINKING_BUDGET_OFF,
  DEFAULT_THINKING_MODE,
} from '@google/gemini-cli-core';
import type { SlashCommand, SlashCommandActionReturn } from './types.js';
import { CommandKind } from './types.js';

/**
 * Creates a standardized message action return.
 */
function createMessage(
  messageType: 'info' | 'error',
  content: string,
): SlashCommandActionReturn {
  return { type: 'message', messageType, content };
}

export const budgetCommand: SlashCommand = {
  name: 'budget',
  description: 'Set thinking token budget. Usage: /budget <tokens>',
  kind: CommandKind.BUILT_IN,
  autoExecute: false,
  action: async (context, args): Promise<SlashCommandActionReturn> => {
    const trimmedArgs = args.trim().toLowerCase();

    // Show current budget and usage
    if (!trimmedArgs) {
      const current = context.services.config?.getSessionThinkingBudget();

      let message = 'Thinking Budget: ';
      if (current === null || current === undefined) {
        message += `Default (${DEFAULT_THINKING_MODE} tokens)`;
      } else if (current === THINKING_BUDGET_UNLIMITED) {
        message += 'Unlimited';
      } else if (current === THINKING_BUDGET_OFF) {
        message += 'Disabled (0 tokens)';
      } else {
        message += `${current} tokens`;
      }

      // Note: We don't have access to token usage stats in this context
      // That would need to be passed from the SessionContext
      message += '\n\nUse /stats to see token usage for this session.';

      return createMessage('info', message);
    }

    // Handle special keywords
    if (trimmedArgs === 'unlimited' || trimmedArgs === 'max') {
      context.services.config?.setSessionThinkingBudget(
        THINKING_BUDGET_UNLIMITED,
      );
      return createMessage(
        'info',
        'Thinking budget set to unlimited\n' +
          'Note: This may increase latency and API costs.',
      );
    }

    if (trimmedArgs === 'off' || trimmedArgs === 'disabled') {
      context.services.config?.setSessionThinkingBudget(THINKING_BUDGET_OFF);
      return createMessage('info', 'Thinking budget disabled');
    }

    // Parse numeric budget
    const numericBudget = parseInt(trimmedArgs, 10);
    if (isNaN(numericBudget)) {
      return createMessage(
        'error',
        'Budget must be a number, "unlimited", "off", or "disabled".\n' +
          'Example: /budget 4096\n' +
          'Use /think for preset levels (low/medium/high).',
      );
    }

    if (numericBudget < -1) {
      return createMessage(
        'error',
        'Budget must be -1 (unlimited), 0 (disabled), or a positive number',
      );
    }

    if (numericBudget > 32768) {
      return createMessage(
        'error',
        'Budget must be 32768 tokens or less (or -1 for unlimited)',
      );
    }

    context.services.config?.setSessionThinkingBudget(numericBudget);

    const label =
      numericBudget === THINKING_BUDGET_UNLIMITED
        ? 'unlimited'
        : numericBudget === THINKING_BUDGET_OFF
          ? 'disabled'
          : `${numericBudget} tokens`;

    return createMessage('info', `Thinking budget set to ${label}`);
  },
};
