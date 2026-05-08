import { COLORS } from './styles';
import { LOGO_LIST } from './logos';

const DEFAULT_LOGO_PATH = LOGO_LIST[0]?.path || '/assets/logos/OW.png';

export const defaultData = {
  globalScene: 'LIVE',
  outputMode: '1080P',
  info: 'FCUP ACADEMY | BO3 | OPEN QUALIFIER | ROUND 1',
  matchFormat: 'BO3',
  currentMap: 1,
  showBans: false,
  showPlayers: true,
  activeComms: null,

  casterDisplayMode: 'CASTERS',
  casterEditTab: 'CASTERS',
  casters: [
    { id: 'ALICE', title: 'COMMENTATOR', label: 'CASTER A', social: '@caster_a', avatar: '' },
    { id: 'BOB', title: 'COMMENTATOR', label: 'CASTER B', social: '@caster_b', avatar: '' }
  ],
  staffTitle: 'SPECIAL THANKS',
  staffSubtitle: 'EVENT STAFF',
  staffMembers: [
    { role: 'DIRECTOR', name: '' },
    { role: 'ADMIN', name: '' },
    { role: 'REFEREE', name: '' },
    { role: 'PRODUCER', name: '' }
  ],

  teamA: 'TEAM A',
  teamB: 'TEAM B',
  teamShortA: '',
  teamShortB: '',
  logoA: DEFAULT_LOGO_PATH,
  logoBgA: COLORS.mainDark,
  logoB: DEFAULT_LOGO_PATH,
  logoBgB: COLORS.mainDark,
  scoreA: 0,
  scoreB: 0,

  beginInfoEnabled: true,

  bansA: ['tank/dva'],
  bansB: ['damage/tracer'],
  keyPlayerTriggerAt: 0,
  keyPlayerSide: 'A',
  keyPlayerName: '',
  showBanPhase: false,
  banOrderMode: 'A_FIRST',

  playersA: ['PLAYER1', 'PLAYER2', 'PLAYER3', 'PLAYER4', 'PLAYER5'],
  playersB: ['PLAYER1', 'PLAYER2', 'PLAYER3', 'PLAYER4', 'PLAYER5'],

  rosterTeamTarget: 'A',
  liveRosterTeam: 'A',
  rosterPlayersA: [
    { nickname: 'PLAYER1', battleTag: 'player1#0000', role: 'TANK', hero: 'winston', heroImage: '/assets/roster/tank/winston.png', heroPosition: '' },
    { nickname: 'PLAYER2', battleTag: 'player2#0000', role: 'DAMAGE', hero: 'tracer', heroImage: '/assets/roster/damage/tracer.png', heroPosition: '' },
    { nickname: 'PLAYER3', battleTag: 'player3#0000', role: 'DAMAGE', hero: 'sojourn', heroImage: '/assets/roster/damage/sojourn.png', heroPosition: '' },
    { nickname: 'PLAYER4', battleTag: 'player4#0000', role: 'SUPPORT', hero: 'kiriko', heroImage: '/assets/roster/support/kiriko.png', heroPosition: '' },
    { nickname: 'PLAYER5', battleTag: 'player5#0000', role: 'SUPPORT', hero: 'lucio', heroImage: '/assets/roster/support/lucio.png', heroPosition: '' }
  ],
  rosterPlayersB: [
    { nickname: 'PLAYER1', battleTag: 'player1#0000', role: 'TANK', hero: 'winston', heroImage: '/assets/roster/tank/winston.png', heroPosition: '' },
    { nickname: 'PLAYER2', battleTag: 'player2#0000', role: 'DAMAGE', hero: 'tracer', heroImage: '/assets/roster/damage/tracer.png', heroPosition: '' },
    { nickname: 'PLAYER3', battleTag: 'player3#0000', role: 'DAMAGE', hero: 'sojourn', heroImage: '/assets/roster/damage/sojourn.png', heroPosition: '' },
    { nickname: 'PLAYER4', battleTag: 'player4#0000', role: 'SUPPORT', hero: 'kiriko', heroImage: '/assets/roster/support/kiriko.png', heroPosition: '' },
    { nickname: 'PLAYER5', battleTag: 'player5#0000', role: 'SUPPORT', hero: 'lucio', heroImage: '/assets/roster/support/lucio.png', heroPosition: '' }
  ],
  rosterStaffA: { clubName: '', showClubName: false, manager: { nickname: '', battleTag: '' }, coaches: [] },
  rosterStaffB: { clubName: '', showClubName: false, manager: { nickname: '', battleTag: '' }, coaches: [] },
  rosterPresetLibrary: [],
  subIndexA: null,
  subIndexB: null,

  stingerLogo: '/assets/logos/fc_logo.png',

  teamPresets: [
    { fullName: 'FRIES ESPORTS', shortName: 'FRIES', logoPath: DEFAULT_LOGO_PATH, players: ['F_TANK', 'F_DPS1', 'F_DPS2', 'F_SUP1', 'F_SUP2'] }
  ],

  showTicker: false,
  tickerText: 'SPONSORS // THANK YOU FOR YOUR SUPPORT // JOIN THE OFFICIAL COMMUNITY FOR THE LATEST NEWS // SPONSORS // THANKS FOR WATCHING',
  tickerMode: 'INFINITE',

  mapPoolDisplayMode: 'MATCH',
  showOverviewCurrent: false,

  countdownMode: 'FULL',
  countdownSeconds: 600,

  infoCupName: 'FRIES CUP',
  infoSubtitle: 'BO3 | OPEN QUALIFIER | ROUND 1',
  matchStageDescription: 'PLEASE STAND BY',
  upcomingMatches: [
    {
      teamA: 'TEAM A',
      teamB: 'TEAM B',
      logoA: DEFAULT_LOGO_PATH,
      logoB: DEFAULT_LOGO_PATH,
      logoBgA: COLORS.mainDark,
      logoBgB: COLORS.mainDark,
      time: '',
      stage: '',
      scoreA: '',
      scoreB: ''
    }
  ],

  videoLibrary: [
    { 
      name: '朱诺英雄预览', 
      path: 'https://github.com/michaelsky5/fries-cup-overlay/releases/download/v1.0.0/juno-preview.mp4' 
    },
    { 
      name: '芙蕾雅英雄预览', 
      path: 'https://github.com/michaelsky5/fries-cup-overlay/releases/download/v1.0.0/freja-preview.mp4' 
    },
    { 
      name: '斩仇英雄预览', 
      path: 'https://github.com/michaelsky5/fries-cup-overlay/releases/download/v1.0.0/vendetta-preview.mp4' 
    },
    { 
      name: '无漾英雄预览', 
      path: 'https://github.com/michaelsky5/fries-cup-overlay/releases/download/v1.0.0/wuyang-preview.mp4' 
    }
  ],
  videoPlaylist: [],
  activeVideoPath: 'https://github.com/michaelsky5/fries-cup-overlay/releases/download/v1.0.0/juno-preview.mp4',
  videoMuted: false,
  videoRenderMode: 'WEB',

  highlightLibrary: [{ name: 'DEFAULT HIGHLIGHT', path: '/assets/highlights/hl1.mp4' }],
  highlightPlaylist: ['/assets/highlights/hl1.mp4'],
  activeHighlightPath: '/assets/highlights/hl1.mp4',
  highlightMuted: false,

  statsMode: 'IMAGE',
  statsTheme: 'CLASSIC',
  statsImagePath: '/assets/screenshots/placeholder.png',
  statsImageTempUrl: '',
  statsTemplateVisibility: {
    elims: true,
    assists: true,
    deaths: true,
    damage: true,
    healing: true,
    mitigated: true
  },
  statsTemplateData: {
    elimsA: '0',
    elimsB: '0',
    assistsA: '0',
    assistsB: '0',
    deathsA: '0',
    deathsB: '0',
    damageA: '0',
    damageB: '0',
    healingA: '0',
    healingB: '0',
    mitigatedA: '0',
    mitigatedB: '0'
  },

  cropW: 1000,
  cropH: 320,
  cropX: 460,
  cropY1: 195,
  cropY2: 600,
  cropScale: 100,

  mapLineup: [
    { type: 'CONTROL', name: 'ILIOS', bansA: [], bansB: [], winner: '', winnerSide: '' },
    { type: 'HYBRID', name: "KING'S ROW", bansA: [], bansB: [], winner: '', winnerSide: '' },
    { type: 'ESCORT', name: 'DORADO', bansA: [], bansB: [], winner: '', winnerSide: '' },
    { type: 'PUSH', name: 'COLOSSEO', bansA: [], bansB: [], winner: '', winnerSide: '' },
    { type: 'CONTROL', name: 'LIJIANG TOWER', bansA: [], bansB: [], winner: '', winnerSide: '' },
    { type: 'ESCORT', name: 'ROUTE 66', bansA: [], bansB: [], winner: '', winnerSide: '' },
    { type: 'HYBRID', name: 'BLIZZARD WORLD', bansA: [], bansB: [], winner: '', winnerSide: '' }
  ],

  eventMapPool: {
    CONTROL: ['ILIOS', 'LIJIANG TOWER', 'BUSAN'],
    ESCORT: ['DORADO', 'ROUTE 66', 'HAVANA'],
    HYBRID: ["KING'S ROW", 'EICHENWALDE', 'BLIZZARD WORLD'],
    PUSH: ['COLOSSEO', 'NEW QUEEN STREET'],
    FLASHPOINT: ['SURAVASA', 'NEW JUNK CITY', 'ATLIS'],
    CLASH: ['HANAOKA', 'THRONE OF ANUBIS']
  },

  enabledMapTypes: {
    CONTROL: true,
    ESCORT: true,
    HYBRID: true,
    PUSH: true,
    FLASHPOINT: true,
    CLASH: false
  },

  winner: 'A',
  winnerSide: 'A',
  winnerScene: {
    winner: 'A',
    title: 'WINNER'
  },

  // COVER
  coverMode: 'GENERIC',

  titleMain: 'FRIES CUP',
  titleSubEn: 'ACADEMY',
  titleSubCn: '薯条杯学院赛',

  topLeftLabel: 'FCUP_BROADCAST_INTERFACE',
  topRightLabelGeneric: 'BROADCAST // STANDBY',
  topRightLabelMatch: 'MATCH // READY',
  seasonLabel: 'SEASON 2026',

  footerLeft: 'FRIES CUP LIVE ROOM',
  footerCenter: 'FRIES-CUP.COM',
  footerRight: 'LIVE COVER SYSTEM',

  genericWatermark: 'BROADCAST',
  phaseMainEn: 'OPEN QUALIFIER',
  phaseMainCn: '公开预选赛',
  phaseSubEn: 'SWISS STAGE',
  phaseSubCn: '瑞士轮',

  coverCasterLabelEn: 'CASTERS',
  coverCasterLabelCn: '解说',
  coverAdminLabelEn: 'ADMIN',
  coverAdminLabelCn: '赛管',
  coverCasters: 'AAA / BBB',
  coverAdmins: 'CCC / DDD',

  matchWatermark: 'MATCHDAY',
  showLogos: true,
  showFooterCenter: true
};