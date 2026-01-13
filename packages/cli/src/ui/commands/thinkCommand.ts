/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  THINKING_BUDGET_LOW,
  THINKING_BUDGET_MEDIUM,
  THINKING_BUDGET_HIGH,
  THINKING_BUDGET_UNLIMITED,
  THINKING_BUDGET_OFF,
  DEFAULT_THINKING_MODE,
} from '@google/gemini-cli-core';
import type { SlashCommand, SlashCommandActionReturn } from './types.js';
import { CommandKind } from './types.js';

/**
 * Helper function to get a user-friendly label for a thinking budget.
 */
function getBudgetLabel(budget: number): string {
  if (budget === THINKING_BUDGET_UNLIMITED) return 'UNLIMITED';
  if (budget === THINKING_BUDGET_OFF) return 'OFF';
  if (budget <= THINKING_BUDGET_LOW) return 'LOW';
  if (budget <= THINKING_BUDGET_MEDIUM) return 'MEDIUM';
  if (budget <= THINKING_BUDGET_HIGH) return 'HIGH';
  return 'EXTREME';
}

/**
 * Creates a standardized message action return.
 */
function createMessage(
  messageType: 'info' | 'error',
  content: string,
): SlashCommandActionReturn {
  return { type: 'message', messageType, content };
}

export const thinkCommand: SlashCommand = {
  name: 'think',
  description: 'Control Extended Thinking mode for the session',
  kind: CommandKind.BUILT_IN,
  autoExecute: false,
  subCommands: [
    {
      name: 'on',
      description: 'Enable thinking with default budget (8192 tokens)',
      kind: CommandKind.BUILT_IN,
      autoExecute: true,
      action: async (context) => {
        context.services.config?.setSessionThinkingBudget(
          DEFAULT_THINKING_MODE,
        );
        return createMessage(
          'info',
          `Extended Thinking enabled (MEDIUM: ${DEFAULT_THINKING_MODE} tokens)\n` +
            'Note: Agents like CodebaseInvestigator use their own thinking budgets for optimal performance.',
        );
      },
    },
    {
      name: 'off',
      description: 'Disable Extended Thinking',
      kind: CommandKind.BUILT_IN,
      autoExecute: true,
      action: async (context) => {
        context.services.config?.setSessionThinkingBudget(THINKING_BUDGET_OFF);
        return createMessage('info', 'Extended Thinking disabled');
      },
    },
    {
      name: 'low',
      description: 'Set thinking to low level (~2048 tokens)',
      kind: CommandKind.BUILT_IN,
      autoExecute: true,
      action: async (context) => {
        context.services.config?.setSessionThinkingBudget(THINKING_BUDGET_LOW);
        return createMessage(
          'info',
          `Extended Thinking set to LOW (${THINKING_BUDGET_LOW} tokens)\n` +
            'Note: Agents like CodebaseInvestigator use their own thinking budgets for optimal performance.',
        );
      },
    },
    {
      name: 'medium',
      description: 'Set thinking to medium level (~8192 tokens)',
      kind: CommandKind.BUILT_IN,
      autoExecute: true,
      action: async (context) => {
        context.services.config?.setSessionThinkingBudget(
          THINKING_BUDGET_MEDIUM,
        );
        return createMessage(
          'info',
          `Extended Thinking set to MEDIUM (${THINKING_BUDGET_MEDIUM} tokens)\n` +
            'Note: Agents like CodebaseInvestigator use their own thinking budgets for optimal performance.',
        );
      },
    },
    {
      name: 'high',
      description: 'Set thinking to high level (~16384 tokens)',
      kind: CommandKind.BUILT_IN,
      autoExecute: true,
      action: async (context) => {
        context.services.config?.setSessionThinkingBudget(THINKING_BUDGET_HIGH);
        return createMessage(
          'info',
          `Extended Thinking set to HIGH (${THINKING_BUDGET_HIGH} tokens)\n` +
            'Note: Agents like CodebaseInvestigator use their own thinking budgets for optimal performance.',
        );
      },
    },
    {
      name: 'unlimited',
      altNames: ['max', 'extreme'],
      description: 'Enable unlimited thinking',
      kind: CommandKind.BUILT_IN,
      autoExecute: true,
      action: async (context) => {
        context.services.config?.setSessionThinkingBudget(
          THINKING_BUDGET_UNLIMITED,
        );
        return createMessage(
          'info',
          'Extended Thinking set to UNLIMITED\n' +
            'Note: Agents like CodebaseInvestigator use their own thinking budgets for optimal performance.',
        );
      },
    },
    {
      name: 'status',
      description: 'Show current thinking configuration',
      kind: CommandKind.BUILT_IN,
      autoExecute: true,
      action: async (context) => {
        const budget = context.services.config?.getSessionThinkingBudget();

        if (budget === null || budget === undefined) {
          return createMessage(
            'info',
            'Extended Thinking: Using model defaults (MEDIUM: 8192 tokens)',
          );
        } else if (budget === THINKING_BUDGET_UNLIMITED) {
          return createMessage('info', 'Extended Thinking: UNLIMITED');
        } else if (budget === THINKING_BUDGET_OFF) {
          return createMessage('info', 'Extended Thinking: DISABLED');
        } else {
          return createMessage(
            'info',
            `Extended Thinking: ${budget} tokens (${getBudgetLabel(budget)})`,
          );
        }
      },
    },
  ],
  // Default action when no subcommand (handles toggle and numeric budget)
  action: async (context, args): Promise<SlashCommandActionReturn> => {
    const trimmedArgs = args.trim().toLowerCase();

    // Handle numeric budget directly: /think 4096
    const numericBudget = parseInt(trimmedArgs, 10);
    if (!isNaN(numericBudget) && trimmedArgs === numericBudget.toString()) {
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

      if (numericBudget === THINKING_BUDGET_UNLIMITED) {
        return createMessage('info', 'Extended Thinking set to UNLIMITED');
      } else if (numericBudget === THINKING_BUDGET_OFF) {
        return createMessage('info', 'Extended Thinking disabled');
      } else {
        return createMessage(
          'info',
          `Extended Thinking set to ${numericBudget} tokens (${getBudgetLabel(numericBudget)})`,
        );
      }
    }

    // Toggle behavior: /think (no args)
    if (!trimmedArgs) {
      const current = context.services.config?.getSessionThinkingBudget();
      if (
        current === null ||
        current === undefined ||
        current > THINKING_BUDGET_OFF
      ) {
        // Currently on or using defaults → turn off
        context.services.config?.setSessionThinkingBudget(THINKING_BUDGET_OFF);
        return createMessage('info', 'Extended Thinking disabled');
      } else {
        // Currently off → turn on with default
        context.services.config?.setSessionThinkingBudget(
          DEFAULT_THINKING_MODE,
        );
        return createMessage(
          'info',
          `Extended Thinking enabled (MEDIUM: ${DEFAULT_THINKING_MODE} tokens)`,
        );
      }
    }

    return createMessage(
      'error',
      'Usage: /think [on|off|low|medium|high|unlimited|<number>|status]',
    );
  },
};
