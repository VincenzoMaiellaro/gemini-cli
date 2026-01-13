/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Service to manage session-level thinking budget overrides.
 *
 * This service maintains the active thinking budget override for the current session.
 * The override persists across conversations and model switches within the same session,
 * but is cleared when the application restarts.
 */
export class SessionThinkingState {
  private activeOverride: number | null = null;

  /**
   * Sets the thinking budget override for the session.
   * @param budget The thinking budget in tokens, or null to use model defaults.
   *               Special values: -1 = unlimited, 0 = disabled, >0 = token count
   */
  setOverride(budget: number | null): void {
    this.activeOverride = budget;
  }

  /**
   * Gets the active thinking budget override.
   * @returns The current override value, or null if using model defaults
   */
  getActiveOverride(): number | null {
    return this.activeOverride;
  }

  /**
   * Clears the thinking budget override, reverting to model defaults.
   */
  clearOverride(): void {
    this.activeOverride = null;
  }

  /**
   * Checks if a thinking budget override is currently active.
   * @returns true if an override is set, false otherwise
   */
  hasOverride(): boolean {
    return this.activeOverride !== null;
  }
}
