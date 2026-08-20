/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Language = 'ar' | 'fr' | 'en' | 'dz';

export interface Translations {
  title: string;
  subTitle: string;
  playOnline: string;
  playOnlineSub: string;
  playOffline: string;
  playOfflineSub: string;
  onlineTitle: string;
  onlineDesc: string;
  comingSoon: string;
  close: string;
  createRoom: string;
  joinRoom: string;
  enterRoomCode: string;
  invalidRoomCode: string;
  waitingForPlayers: string;
  ready: string;
  startGame: string;
  playersConnected: string;
  settingsTitle: string;
  music: string;
  soundEffects: string;
  vibration: string;
  language: string;
  on: string;
  off: string;
  profileTitle: string;
  playerName: string;
  chooseAvatar: string;
  save: string;
  menu: string;
  newMatch: string;
  matchSettings: string;
  startMatch: string;
  selectMode: string;
  targetPoints: string;
  enterCafe: string;
  rulesOpener: string;
  rulesOpenerDesc: string;
  rulesSnake: string;
  rulesSnakeDesc: string;
  rulesScoring: string;
  rulesScoringDesc: string;
  quickStats: string;
  matchesPlayed: string;
  matchesWon: string;
  shuffleTitle: string;
  shuffleAction: string;
  shuffleProgress: string;
  dealAction: string;
}

export const translations: Record<Language, Translations> = {
  fr: {
    title: 'Dominoes Mostaganem',
    subTitle: 'Jeu de Domino Algérien Café 🇩🇿',
    playOnline: 'Jouer en ligne',
    playOnlineSub: 'Salles multijoueurs & Défis en direct',
    playOffline: 'Hors ligne vs AI',
    playOfflineSub: 'Partie rapide contre le robot IA',
    onlineTitle: 'Jouer en Ligne - Multijoueur',
    onlineDesc: 'Défiez vos amis ou des joueurs du monde entier sur les serveurs V2.',
    comingSoon: 'Disponible en V2',
    close: 'Fermer',
    createRoom: 'Créer une salle',
    joinRoom: 'Rejoindre une salle',
    enterRoomCode: 'Entrez le code de la salle',
    invalidRoomCode: 'Code invalide ou salle pleine',
    waitingForPlayers: 'En attente de joueurs...',
    ready: 'Prêt',
    startGame: 'Lancer la partie',
    playersConnected: 'joueurs connectés',
    settingsTitle: 'Paramètres du Jeu',
    music: 'Musique',
    soundEffects: 'Effets sonores',
    vibration: 'Vibreur',
    language: 'Langue',
    on: 'Activé',
    off: 'Désactivé',
    profileTitle: 'Profil du Joueur',
    playerName: 'Nom du Joueur',
    chooseAvatar: 'Choisissez votre photo / avatar',
    save: 'Enregistrer',
    menu: 'Menu Principal',
    newMatch: 'Nouveau Match',
    matchSettings: 'Configuration de la Partie',
    startMatch: 'Lancer le Match',
    selectMode: 'Choisir le Mode',
    targetPoints: 'Score Cible',
    enterCafe: 'Entrer au Café & Jouer',
    rulesOpener: 'Ouverture Sitta Sitta',
    rulesOpenerDesc: 'La première manche s\'ouvre obligatoirement avec le double-six [6|6].',
    rulesSnake: 'Table Serpentin',
    rulesSnakeDesc: 'Disposition en serpentin dynamique adaptée aux écrans.',
    rulesScoring: 'Sortie & Ghallaq',
    rulesScoringDesc: 'Gagnez en posant toutes vos pièces ou au blocage avec le moins de points.',
    quickStats: 'Statistiques du Joueur',
    matchesPlayed: 'Parties Jouées',
    matchesWon: 'Victoires',
    shuffleTitle: 'Mélange des Dominoes',
    shuffleAction: 'Mélanger les pièces',
    shuffleProgress: 'Mélange en cours...',
    dealAction: 'Distribuer',
  },
  ar: {
    title: 'دومينو مستغانم',
    subTitle: 'لعبة الدومينو الجزائرية الأصيلة 🇩🇿',
    playOnline: 'ألعب مع صحابك',
    playOnlineSub: 'غرف جماعية وتحديات مباشرة',
    playOffline: 'بدون إنترنت ضد الذكاء الاصطناعي',
    playOfflineSub: 'مباراة سريعة ضد الذكاء الاصطناعي',
    onlineTitle: 'اللعب عبر الإنترنت - اللعب الجماعي',
    onlineDesc: 'تحدى أصدقاءك أو لاعبين من جميع أنحاء العالم في الإصدار الثاني.',
    comingSoon: 'متوفر الآن (V2)',
    close: 'إغلاق',
    createRoom: 'إنشاء غرفة',
    joinRoom: 'انضمام لغرفة',
    enterRoomCode: 'أدخل رمز الغرفة',
    invalidRoomCode: 'الرمز غير صحيح أو الغرفة ممتلئة',
    waitingForPlayers: 'في انتظار اللاعبين...',
    ready: 'جاهز',
    startGame: 'بدء اللعبة',
    playersConnected: 'لاعبين متصلين',
    settingsTitle: 'إعدادات اللعبة',
    music: 'الموسيقى',
    soundEffects: 'المؤثرات الصوتية',
    vibration: 'الاهتزاز',
    language: 'اللغة',
    on: 'مفعل',
    off: 'غير مفعل',
    profileTitle: 'ملف اللاعب',
    playerName: 'اسم اللاعب',
    chooseAvatar: 'اختر الصورة الشخصية / الأيقونة',
    save: 'حفظ التغييرات',
    menu: 'القائمة الرئيسية',
    newMatch: 'مباراة جديدة',
    matchSettings: 'إعدادات المباراة',
    startMatch: 'بدء المباراة',
    selectMode: 'اختر وضع اللعب',
    targetPoints: 'نقاط الهدف',
    enterCafe: 'دخول المقهى واللعب',
    rulesOpener: 'افتتاحية ستة ستة',
    rulesOpenerDesc: 'الجولة الأولى تبدأ حتماً بقطعة [6|6] وفق القواعد الجزائرية.',
    rulesSnake: 'طاولة الثعبان',
    rulesSnakeDesc: 'توزيع ديناميكي أوتوماتيكي للقطع على الطاولة.',
    rulesScoring: 'الخصمة والغلاق',
    rulesScoringDesc: 'الفوز بإنهائك للقطع أو بأقل مجموع نقاط عند الغلاق.',
    quickStats: 'إحصائيات اللاعب',
    matchesPlayed: 'المباريات الملعوبة',
    matchesWon: 'الانتصارات',
    shuffleTitle: 'خلط الدومينو',
    shuffleAction: 'خلط الأوراق',
    shuffleProgress: 'جاري خلط الدومينو...',
    dealAction: 'توزيع القطع',
  },
  en: {
    title: 'Mostaganem Dominoes',
    subTitle: 'Authentic Algerian Café Dominoes 🇩🇿',
    playOnline: 'Play Online',
    playOnlineSub: 'Multiplayer Rooms & Live Matches',
    playOffline: 'Offline vs AI',
    playOfflineSub: 'Quick match against AI bot',
    onlineTitle: 'Play Online - Multiplayer',
    onlineDesc: 'Challenge your friends or players from around the world.',
    comingSoon: 'Live Now (V2)',
    close: 'Close',
    createRoom: 'Create Room',
    joinRoom: 'Join Room',
    enterRoomCode: 'Enter Room Code',
    invalidRoomCode: 'Invalid code or room full',
    waitingForPlayers: 'Waiting for players...',
    ready: 'Ready',
    startGame: 'Start Game',
    playersConnected: 'players connected',
    settingsTitle: 'Game Settings',
    music: 'Music',
    soundEffects: 'Sound Effects',
    vibration: 'Vibration',
    language: 'Language',
    on: 'ON',
    off: 'OFF',
    profileTitle: 'Player Profile',
    playerName: 'Player Name',
    chooseAvatar: 'Choose Avatar / Picture',
    save: 'Save Changes',
    menu: 'Main Menu',
    newMatch: 'New Match',
    matchSettings: 'Match Settings',
    startMatch: 'Start Match',
    selectMode: 'Select Game Mode',
    targetPoints: 'Match Target Points',
    enterCafe: 'Enter Café & Play',
    rulesOpener: 'Double-Six Opener',
    rulesOpenerDesc: 'First round opens strictly with [6|6] (Sitta Sitta).',
    rulesSnake: 'Snake Table',
    rulesSnakeDesc: 'Dynamic serpentine board layout auto-turning on full rows.',
    rulesScoring: 'Sortie & Ghallaq',
    rulesScoringDesc: 'Win by playing all tiles or having lowest pips when blocked.',
    quickStats: 'Player Stats',
    matchesPlayed: 'Matches Played',
    matchesWon: 'Wins',
    shuffleTitle: 'Shuffling Dominoes',
    shuffleAction: 'Shuffle Tiles',
    shuffleProgress: 'Shuffling...',
    dealAction: 'Deal Tiles',
  },
  dz: {
    title: 'دومينو مستغانم',
    subTitle: 'دومينو القهوة الجزائري البنين 🇩🇿',
    playOnline: 'ألعب مع صحابك',
    playOnlineSub: 'الشنابر ولعب كونترا لايف',
    playOffline: 'أوفلاين كونتر لافيش',
    playOfflineSub: 'بارتيا خفيفة ضد الروبو',
    onlineTitle: 'ألعب أونلاين - جماعي',
    onlineDesc: 'قصر مع صحابك ولا كاش غاشي فالعالم فـ V2.',
    comingSoon: 'راه واجد فـ V2',
    close: 'بلع',
    createRoom: 'حل شومبرة',
    joinRoom: 'أدخل لشومبرة',
    enterRoomCode: 'أكتب الكود تاع الشومبرة',
    invalidRoomCode: 'الكود فو ولا الشومبرة راهي معمرة',
    waitingForPlayers: 'رانا نستاناو فالغاشي...',
    ready: 'واجد',
    startGame: 'أبدا البارتيا',
    playersConnected: 'راهم مكونكتيين',
    settingsTitle: 'ريغلاج تاع اللعبة',
    music: 'الموزيقا',
    soundEffects: 'أصوات اللعبة',
    vibration: 'الفيبراسور',
    language: 'اللوغة',
    on: 'شاعل',
    off: 'طافي',
    profileTitle: 'البروفيل تاعك',
    playerName: 'إسم الجوور',
    chooseAvatar: 'خير التصويرة تاعك',
    save: 'أنريجيستري',
    menu: 'المينو الكبير',
    newMatch: 'بارتيا جديدة',
    matchSettings: 'ريغلاج تاع البارتيا',
    startMatch: 'ديماري البارتيا',
    selectMode: 'خير كفاش تلعب',
    targetPoints: 'لانطير تاع البارتيا',
    enterCafe: 'أدخل للقهوة والعب',
    rulesOpener: 'الستة ستة هي اللولى',
    rulesOpenerDesc: 'البارتيا اللولى لازم تبدا بالدوبل سيس [6|6] زكارة.',
    rulesSnake: 'الطاولة المعوجة',
    rulesSnakeDesc: 'الستيكاج تاع الدومينو يدور اوتوماتيك فالشاشة.',
    rulesScoring: 'الخرجة والغلاق',
    rulesScoringDesc: 'تربح كي تكمل قاع حباتك ولا تبلع الطاولة ويكون عندك اقل نقاط.',
    quickStats: 'ستاتيسيك تاعك',
    matchesPlayed: 'البارتيات لي لعبتهم',
    matchesWon: 'البارتيات لي ربحتهم',
    shuffleTitle: 'خلط الدومينو',
    shuffleAction: 'خلط الدومينو',
    shuffleProgress: 'رانا نخلطو فالشابة...',
    dealAction: 'وزع الحبات',
  },
};

export const getTranslation = (lang: Language): Translations => {
  return translations[lang] || translations.fr;
};
