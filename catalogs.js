const helpers = require('./helpers.js')

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
}

const CATALOG_KEYS = {
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

const CATALOGS = [
    {
        key: CATALOG_KEYS.new_releases_dubbed,
        name: "New released dubbed",
    },
    {
        key: CATALOG_KEYS.new_releases,
        name: "New released",
    },
    {
        key: CATALOG_KEYS.last_added_children,
        name: "New added children",
    },
    {
        key: CATALOG_KEYS.new_releases_children,
        name: "New released children",
    },
    {
        key: CATALOG_KEYS.new_releases_subs,
        name: "New released sub",
    },
    {
        key: CATALOG_KEYS.most_watched,
        name: "Most watched",
    },
    {
        key: CATALOG_KEYS.popular,
        name: "Popular",
    },
    {
        key: CATALOG_KEYS.genre,
        name: "Genre",
    },
    {
        key: CATALOG_KEYS.trending,
        name: "Trending",
    },
    {
        key: CATALOG_KEYS.last_added,
        name: "New added",
    },
]

const SUPPORTED_TYPES = [helpers.STREMIO_TYPE.MOVIE, helpers.STREMIO_TYPE.SHOW, helpers.STREMIO_TYPE.ANIME]

function catalogs(){
    return SUPPORTED_TYPES.flatMap(type => {
        return CATALOGS.map(catalog => {
            return {
                type: type,
                id: `scc_${type}_${catalog.key}`,
                name: `${type} - ${catalog.name}`,
                extra: [
                    { key: "search", isRequired: false },
                    { key: "genre", isRequired: false },
                    { key: "skip", isRequired: false },
                ]
            }
        })
    })
}

module.exports = {
    SUPPORTED_TYPES,
    catalogs,
}