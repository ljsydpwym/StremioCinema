
const FILTER = {
    STARTS_WITH_SIMPLE: 'startsWithSimple',
    GENRE: 'genre',
    SEARCH: 'search',
    SERVICE: 'service',
    PARENT: 'parent',
    ALL: 'all',
    STUDIO: 'studio',
    IDS: 'ids',
    CUSTOM: 'custom',
    NEWS_DUBBED: 'newsDubbed',
    NEWS: 'news',
    NEWS_SUBS: 'newsSubs',
    NEWS_CHILDREN: 'newsChildren',
    COUNTRY: 'country',
    YEAR: 'year',
    LANGUAGE: 'language',
    NETWORK: 'network',
    NUMBERING: 'numbering',
    NUMBERING_ID: 'numbering_id',
    CONCERT: 'concert',
}

const ORDER = {
    ASCENDING: 'asc',
    DESCENDING: 'desc',
}

const SORT = {
    SCORE: 'score',
    YEAR: 'year',
    PREMIERED: 'premiered',
    DATE_ADDED: 'dateAdded',
    LAST_CHILDREN_DATE_ADDED: 'lastChildrenDateAdded',
    LAST_CHILD_PREMIERED: 'lastChildPremiered',
    TITLE: 'title',
    PLAY_COUNT: 'playCount',
    LAST_SEEN: 'lastSeen',
    EPISODE: 'episode',
    NEWS: 'news',
    POPULARITY: 'popularity',
    TRENDING: 'trending',
    LANG_DATE_ADDED: 'langDateAdded',
    CUSTOM: 'custom',
}

const QUERY = {
    SORT: 'sort',
    SORT_CONFIG: 'sortConfig',
    TYPE: 'type',
    SUBTYPE: 'subtype',
    ORDER: 'order',
    LANG: 'lang',
    VALUE: 'value',
    SERVICE: 'service',
    ID: 'id',
    CONFIG: 'config',
    DAYS: 'days',
    FROM: 'from',
    LIMIT: 'limit',
    STATION: 'station',
    TIMEZONE: 'timezone',
    TIME: 'time',
    SEASON: 'season',
    EPISODE: 'episode',
    ROOT_PARENT: 'root_parent',
    CONCERT: 'concert',
    SIZE: 'size',
}

const CATALOG_KEYS = {
    search: "search",
    new_releases_dubbed: "new-releases-dubbed",
    new_releases: "new-releases",
    last_added_children: "last-added-children",
    new_releases_children: "new-releases-children",
    new_releases_subs: "new-releases-subs",
    most_watched: "most-watched",
    popular: "popular",
    genre: "genre",
    trending: "trending",
    last_added: "last-added",
}

const GENRES = [
    { key: 'Erotic', name: 'Erotický', explicit: true },
    { key: 'Pornographic', name: 'Pornografický', explicit: true },
    { key: 'Action', name: 'Akčný', explicit: false },
    { key: 'Animated', name: 'Animovaný', explicit: false },
    { key: 'Animation', name: 'Animácie', explicit: false },
    { key: 'Adventure', name: 'Dobrodružný', explicit: false },
    { key: 'Biographical', name: 'Životopisný', explicit: false },
    { key: 'Catastrophic', name: 'Katastrofický', explicit: false },
    { key: 'Comedy', name: 'Komédia', explicit: false },
    { key: 'Competition', name: 'Súťažný', explicit: false },
    { key: 'Crime', name: 'Kriminálny', explicit: false },
    { key: 'Documentary', name: 'Dokumentárny', explicit: false },
    { key: 'Fairy Tale', name: 'Rozprávky', explicit: false },
    { key: 'Drama', name: 'Dráma', explicit: false },
    { key: 'Family', name: 'Rodinný', explicit: false },
    { key: 'Fantasy', name: 'Fantasy', explicit: false },
    { key: 'Historical', name: 'Historický', explicit: false },
    { key: 'Horror', name: 'Hororový', explicit: false },
    { key: 'IMAX', name: 'IMAX', explicit: false },
    { key: 'Educational', name: 'Náučný', explicit: false },
    { key: 'Music', name: 'Hudobný', explicit: false },
    { key: 'Journalistic', name: 'Publicistický', explicit: false },
    { key: 'Military', name: 'Military', explicit: false },
    { key: 'Musical', name: 'Muzikál', explicit: false },
    { key: 'Mysterious', name: 'Mysteriózny', explicit: false },
    { key: 'Psychological', name: 'Psychologický', explicit: false },
    { key: 'Reality', name: 'Reality', explicit: false },
    { key: 'Romance', name: 'Romantický', explicit: false },
    { key: 'Sci-Fi', name: 'Sci-Fi', explicit: false },
    { key: 'Short', name: 'Krátkometrážny', explicit: false },
    { key: 'Sports', name: 'Športový', explicit: false },
    { key: 'Stand-Up', name: 'Stand-Up', explicit: false },
    { key: 'Talk-Show', name: 'Talk-Show', explicit: false },
    { key: 'Telenovela', name: 'Telenovela', explicit: false },
    { key: 'Thriller', name: 'Thriller', explicit: false },
    { key: 'Travel', name: 'Cestopisný', explicit: false },
    { key: 'Western', name: 'Western', explicit: false },
    { key: 'War', name: 'Vojenský', explicit: false },
]

const CATALOGS = [
    {
        key: CATALOG_KEYS.trending,
        name: "Trendy",
    },
    {
        key: CATALOG_KEYS.popular,
        name: "Populárne",
    },
    {
        key: CATALOG_KEYS.most_watched,
        name: "Najsledovanejšie",
    },
    {
        key: CATALOG_KEYS.new_releases,
        name: "Novinky",
    },
    {
        key: CATALOG_KEYS.new_releases_dubbed,
        name: "Novinky dabované",
    },
    {
        key: CATALOG_KEYS.new_releases_subs,
        name: "Novinky s titulkami",
    },
    {
        key: CATALOG_KEYS.last_added,
        name: "Posledné pridané",
    },
    {
        key: CATALOG_KEYS.genre,
        name: "Žánre",
        genres: true
    },
    {
        key: CATALOG_KEYS.search,
        name: "SC Vyhľadávanie",
        search: true
    },
]


const STREMIO_TYPE = {
    MOVIE: "movie",
    SHOW: "series",
    ANIME: "anime",
}
const SCC_TYPE = {
    ANY: "*",
    MOVIE: "movie",
    SHOW: "tvshow",
    ANIME: "anime",
}

const SUPPORTED_TYPES = [STREMIO_TYPE.MOVIE, STREMIO_TYPE.SHOW, STREMIO_TYPE.ANIME]

module.exports = {
    SUPPORTED_TYPES,
    FILTER,
    CATALOG_KEYS,
    CATALOGS,
    QUERY,
    ORDER,
    SORT,
    GENRES,
    STREMIO_TYPE,
    SCC_TYPE
}