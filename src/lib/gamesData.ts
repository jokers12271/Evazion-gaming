export interface GameItem {
  id: string;
  title: string;
  category: 'Combat' | 'Sport' | 'Tir' | 'Aventure' | 'Coop';
  image: string;
  description: string;
}

export const GAMES_DATABASE: GameItem[] = [
  {
    id: "fc-26",
    title: "EA Sports FC 26",
    category: "Sport",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTqJtv0QJEprKjtcXGui-8LkT6kwRHdySVEiMHX4STjFny-UI5JpJFQMy7q&s=10",
    description: "La simulation de football de référence pour régner sur le terrain du Sanctuary."
  },
  {
    id: "naruto-connections",
    title: "Naruto x Boruto Connections",
    category: "Combat",
    image: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1020790/library_600x900.jpg",
    description: "Célébrez l'histoire des ninjas avec des combats ultra-rapides et des combos dantesques."
  },
  {
    id: "fortnite",
    title: "Fortnite",
    category: "Tir",
    image: "https://gamewave.fr/static/images/games/a5685-fortnite.jpg",
    description: "Construisez, combattez et dansez pour décrocher le Top 1 en équipe."
  },
  {
    id: "gt-7",
    title: "Gran Turismo 7",
    category: "Sport",
    image: "https://upload.wikimedia.org/wikipedia/en/1/14/Gran_Turismo_7_cover_art.jpg",
    description: "La simulation de course automobile ultime pour les pilotes les plus exigeants."
  },
  {
    id: "demon-slayer-2",
    title: "Demon Slayer 2",
    category: "Combat",
    image: "https://i.redd.it/uak77rqto2me1.jpeg",
    description: "Revivez les affrontements mythiques des pourfendeurs de démons avec une fluidité divine."
  },
  {
    id: "sparking-zero",
    title: "Dragon Ball: Sparking! ZERO",
    category: "Combat",
    image: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1790600/library_600x900.jpg",
    description: "L'héritier spirituel de Budokai Tenkaichi. Repoussez les limites de votre Ki."
  },
  {
    id: "tekken-8",
    title: "Tekken 8",
    category: "Combat",
    image: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1778820/library_600x900.jpg",
    description: "Le roi du poing d'acier revient pour un nouvel affrontement de clans viscéral."
  },
  {
    id: "mk-1",
    title: "Mortal Kombat 1",
    category: "Combat",
    image: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1971870/library_600x900.jpg",
    description: "Un nouvel univers façonné par le Dieu du feu Liu Kang. Fatality !"
  },
  {
    id: "nba-2k25",
    title: "NBA 2K25",
    category: "Sport",
    image: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2878980/library_600x900.jpg",
    description: "Prenez le contrôle des parquets et dunker sur vos rivaux avec style."
  },
  {
    id: "battlefield-6",
    title: "Battlefield 6",
    category: "Tir",
    image: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1517290/library_600x900.jpg",
    description: "Des théâtres de guerre massifs et destructibles pour des tactiques militaires en escouade."
  },
  {
    id: "gow-ragnarok",
    title: "God of War Ragnarök",
    category: "Aventure",
    image: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2322010/library_600x900.jpg",
    description: "Accompagnez Kratos et Atreus dans les neuf royaumes nordiques face au destin."
  },
  {
    id: "ghost-tsushima",
    title: "Ghost of Tsushima",
    category: "Aventure",
    image: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2215430/library_600x900.jpg",
    description: "Défendez l'île de Tsushima sous la voie du Samouraï ou la doctrine du Fantôme."
  },
  {
    id: "spiderman-2",
    title: "Marvel’s Spider-Man 2",
    category: "Aventure",
    image: "https://image.api.playstation.com/vulcan/ap/rnd/202306/1219/1c7b75d8ed9271516546560d219ad0b22ee0a263b4537bd8.png",
    description: "Voltigez à travers New York avec Peter Parker et Miles Morales face à Venom."
  },
  {
    id: "uncharted-collection",
    title: "Uncharted: Legacy of Thieves",
    category: "Aventure",
    image: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1659420/library_600x900.jpg",
    description: "Suivez Nathan Drake et Chloe Frazer dans des quêtes de trésors à couper le souffle."
  },
  {
    id: "it-takes-two",
    title: "It Takes Two",
    category: "Coop",
    image: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1426210/library_600x900.jpg",
    description: "L'aventure coopérative par excellence où la coordination est la clé de la survie."
  },
  {
    id: "mh-wilds",
    title: "Monster Hunter Wilds",
    category: "Aventure",
    image: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2246340/library_600x900.jpg",
    description: "Traquez des monstres titanesques dans un écosystème dynamique et sauvage."
  },
  {
    id: "ff-xvi",
    title: "Final Fantasy XVI",
    category: "Aventure",
    image: "https://live.staticflickr.com/65535/50542067131_762c2f45e2_o.png",
    description: "Une épopée de vengeance et d'action pure portée par les Primordiaux de Valisthéa."
  },
  {
    id: "tlou-1",
    title: "The Last of Us Part I",
    category: "Aventure",
    image: "https://upload.wikimedia.org/wikipedia/en/thumb/8/86/The_Last_of_Us_Part_I_cover.jpg/250px-The_Last_of_Us_Part_I_cover.jpg",
    description: "L'aventure originelle de Joel et Ellie, sublimée pour la puissance de la PS5."
  },
  {
    id: "tlou-2",
    title: "The Last of Us Part II",
    category: "Aventure",
    image: "https://upload.wikimedia.org/wikipedia/en/thumb/4/4f/TLOU_P2_Box_Art_2.png/250px-TLOU_P2_Box_Art_2.png",
    description: "Affrontez les conséquences d'un cycle de violence implacable dans un monde déchu."
  },
  {
    id: "aot-2",
    title: "Attack on Titan 2",
    category: "Action",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRd1EyfhX-ZEUAvMCEuYdI4SXQTQTBP8Nwb5mQ6IYO46bSlK7bMSTIGsUUm&s=10",
    description: "Fendez les airs avec votre équipement tridimensionnel pour abattre les Titans."
  } as any,
  {
    id: "re4-remake",
    title: "Resident Evil 4 Remake",
    category: "Aventure",
    image: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2050650/library_600x900.jpg",
    description: "Sauvez la fille du président dans un village reculé contrôlé par une secte d'un autre âge."
  },
  {
    id: "cod-bo6",
    title: "Call of Duty: Black Ops 6",
    category: "Tir",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSyT1n7Pf4nofii2QkSzdH1QnJjTEbguDdLnLREmpVbhA&s=10",
    description: "Une campagne d'action d'espionnage intense et des affrontements multijoueurs nerveux."
  },
  {
    id: "gta-v",
    title: "Grand Theft Auto V",
    category: "Aventure",
    image: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/271590/library_600x900.jpg",
    description: "Explorez les rues animées de Los Santos pour planifier les braquages du siècle."
  },
  {
    id: "ufc-5",
    title: "EA Sports UFC 5",
    category: "Combat",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQTaQBbclQLMkxmBCZY509ivb1TAREhNOc1RrkSHb1rebRTGNn5vkNCqO0&s=10",
    description: "La référence du combat MMA virtuel. Montez dans l'Octogone du Sanctuary."
  },
  {
    id: "wrc",
    title: "EA Sports WRC",
    category: "Sport",
    image: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1849250/library_600x900.jpg",
    description: "Affrontez la boue, l'asphalte et la neige dans la simulation officielle du championnat du monde de rallye."
  },
  {
    id: "hogwarts-legacy",
    title: "Hogwarts Legacy",
    category: "Aventure",
    image: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/990080/library_600x900.jpg",
    description: "Écrivez votre propre légende à Poudlard dans ce RPG d'action dans le monde magique d'Harry Potter."
  },
  {
    id: "re-village",
    title: "Resident Evil Village",
    category: "Aventure",
    image: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1196590/library_600x900.jpg",
    description: "Affrontez des créatures mythologiques et la redoutable Lady Dimitrescu dans ce château d'épouvante."
  },
  {
    id: "nfs-unbound",
    title: "Need for Speed Unbound",
    category: "Sport",
    image: "https://m.media-amazon.com/images/M/MV5BMWE0YWQ3ZWEtNDUxZi00YjczLTgyOGItMDA0YzgzOTVkOGI0XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg",
    description: "Pilotez des bolides customisés à l'extrême dans des courses urbaines de rue."
  },
  {
    id: "ac-mirage",
    title: "Assassin’s Creed Mirage",
    category: "Aventure",
    image: "https://image.api.playstation.com/vulcan/ap/rnd/202208/1718/NFf86jgU4AeVYgJBEoEKBpxW.jpg",
    description: "Suivez Basim dans le Bagdad du IXe siècle pour une quête de justice et d'infiltration classique."
  }
];