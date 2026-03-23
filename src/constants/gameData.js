export const MAP_DATA = {
  'CONTROL': ['ILIOS', 'LIJIANG TOWER', 'NEPAL', 'OASIS', 'BUSAN', 'ANTARCTIC PENINSULA', 'SAMOA'],
  'ESCORT': ['DORADO', 'ROUTE 66', 'WATCHPOINT: GIBRALTAR', 'HAVANA', 'JUNKERTOWN', 'RIALTO', 'SHAMBALI MONASTERY', 'CIRCUIT ROYAL'],
  'HYBRID': ['BLIZZARD WORLD', 'EICHENWALDE', 'HOLLYWOOD', "KING'S ROW", 'NUMBANI', 'MIDTOWN', 'PARAÍSO'],
  'PUSH': ['COLOSSEO', 'NEW QUEEN STREET', 'ESPERANÇA', 'RUNASAPI'],
  'FLASHPOINT': ['SURAVASA', 'NEW JUNK CITY', 'ATLIS'],
  'CLASH': ['HANAOKA', 'THRONE OF ANUBIS']
};

export const HERO_DATA = {
  tank: ['domina', 'doomfist', 'dva', 'hazard', 'junker_queen', 'mauga', 'orisa', 'ramattra', 'reinhardt', 'roadhog', 'sigma', 'winston', 'wrecking_ball', 'zarya'],
  damage: ['anran', 'ashe', 'bastion', 'cassidy', 'echo', 'emre', 'freja', 'genji', 'hanzo', 'junkrat', 'mei', 'pharah', 'reaper', 'sojourn', 'soldier_76', 'sombra', 'symmetra', 'torbjorn', 'tracer', 'vendetta', 'venture', 'widowmaker'],
  support: ['ana', 'baptiste', 'brigitte', 'illari', 'jetpack_cat', 'juno', 'kiriko', 'lifeweaver', 'lucio', 'mercy', 'mizuki', 'moira', 'wuyang', 'zenyatta']
};

export const ROSTER_ROLE_OPTIONS = ['TANK', 'DAMAGE', 'SUPPORT'];

export const MODES_WITH_SIDES = new Set(['ESCORT', 'HYBRID']);

export const needsAttackDefense = mode => MODES_WITH_SIDES.has(mode);