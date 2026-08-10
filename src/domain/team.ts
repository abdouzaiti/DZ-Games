/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Player } from './player';

export interface Team {
  id: number; // e.g. 0 or 1
  name: string; // e.g. "Team 1", "Team 2"
  memberIds: string[]; // Player IDs in this team
  score: number; // Team score in match
}

export function createTeam(id: number, name: string, memberIds: string[] = []): Team {
  return {
    id,
    name,
    memberIds,
    score: 0,
  };
}

export function getTeamMembers(team: Team, players: Player[]): Player[] {
  return players.filter((p) => team.memberIds.includes(p.id));
}
