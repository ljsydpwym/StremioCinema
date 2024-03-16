const qs = require('querystring')

const Logger = require('../helpers/logger.js')
const { settingsLoader } = require('../helpers/settings.js')
const helpers = require('../helpers/helpers.js')
const env = require('../helpers/env.js')

const catalogs = require('../logic/catalogs.js')
const SccMeta = require('../logic/stremio.js')
const types = require('../logic/types.js')

const SCC = require('../api/sc.js')

const logger = new Logger("catalog", true)

async function catalog(req, res) {
    const { type, id, token } = req.params
    const scc = new SCC()
    const settings = settingsLoader(token)
    const sccMeta = new SccMeta(settings)

    async function catalog(req, res) {
        logger.log("catalog", req.params)
        const stremioType = type
        if (!helpers.startWithPrefix(id)) {
            return res.status(404).send("Not found");
        }
        const catalog_key = id.split("_")[1]

        const extra = req.params.extra ? qs.parse(req.params.extra) : { search: null, skip: null, genre: null };

        let sccType;
        switch (stremioType) {
            case types.STREMIO_TYPE.MOVIE:
                sccType = types.SCC_TYPE.MOVIE;
                break;
            case types.STREMIO_TYPE.SHOW:
                sccType = types.SCC_TYPE.SHOW;
                break;
            case types.STREMIO_TYPE.ANIME:
                sccType = types.SCC_TYPE.ANIME;
                break;
            default:
                sccType = undefined;
        }
        if (sccType === undefined) {
            logger.log("for id " + stremioType + " type is undefined");
            return res.json({ metas: [] });
        }
        const scData = await catalogsFetch(sccType, catalog_key, extra);
        if (!scData) {
            return res.status(404).send("Not found");
        }
        const scItems = scData.hits.hits;
        const metas = await Promise.all(
            Object.entries(scItems)
                .filter(([_, it]) => {
                    const genres = it._source.info_labels.genre
                    const isExplicit = genres.includes("Erotic") || genres.includes("Pornographic") || it._source.tags.includes("porno")
                    return settings.allowExplicit || !isExplicit
                })
                .map(([_, data]) => sccMeta.createMetaPreview(data, stremioType))
        )
        logger.log("metas length", metas.length)
        return res.json({ metas });
    }


    async function catalogsFetch(sccType, filter, extra) {
        const days = 365
        const languageSk = "sk"
        const languageCz = "cs"
        var params = {}
        var additional = {}
        var filterParam = types.FILTER.ALL
        switch (filter) {
            case types.CATALOG_KEYS.new_releases_dubbed: {
                params[types.QUERY.LANG] = languageSk
                additional[types.QUERY.LANG] = languageCz
                params[types.QUERY.SORT] = types.SORT.LANG_DATE_ADDED
                params[types.QUERY.DAYS] = days
                filterParam = types.FILTER.NEWS_DUBBED
                break
            }
            case types.CATALOG_KEYS.new_releases: {
                params[types.QUERY.SORT] = types.SORT.DATE_ADDED
                params[types.QUERY.DAYS] = days
                filterParam = types.FILTER.NEWS
                break
            }
            case types.CATALOG_KEYS.last_added_children: {
                params[types.QUERY.SORT] = types.SORT.LAST_CHILDREN_DATE_ADDED
                params[types.QUERY.DAYS] = days
                break
            }
            case types.CATALOG_KEYS.new_releases_children: {
                params[types.QUERY.SORT] = types.SORT.LAST_CHILD_PREMIERED
                params[types.QUERY.DAYS] = days
                filterParam = types.FILTER.NEWS_CHILDREN
                break
            }
            case types.CATALOG_KEYS.new_releases_subs: {
                params[types.QUERY.SORT] = types.SORT.DATE_ADDED
                params[types.QUERY.LANG] = languageSk
                additional[types.QUERY.LANG] = languageCz
                params[types.QUERY.DAYS] = days
                filterParam = types.FILTER.NEWS_SUBS
                break
            }
            case types.CATALOG_KEYS.most_watched: {
                params[types.QUERY.SORT] = types.SORT.PLAY_COUNT
                break
            }
            case types.CATALOG_KEYS.popular: {
                params[types.QUERY.SORT] = types.SORT.POPULARITY
                break
            }
            case types.CATALOG_KEYS.trending: {
                params[types.QUERY.SORT] = types.SORT.TRENDING
                break
            }
            case types.CATALOG_KEYS.last_added: {
                params[types.QUERY.SORT] = types.SORT.DATE_ADDED
                break
            }
            case types.CATALOG_KEYS.genre: {
                const genreKey = types.GENRES.find(it => it.name == extra.genre)?.key
                if (!genreKey) {
                    return undefined
                }
                params[types.QUERY.SORT] = types.SORT.YEAR
                params[types.QUERY.VALUE] = encodeURIComponent(genreKey)
                filterParam = types.FILTER.GENRE
                break
            }
            default: {
                if (!extra.search) {
                    return undefined
                }
                params[types.QUERY.VALUE] = encodeURIComponent(extra.search)
                params[types.QUERY.SORT] = types.SORT.SCORE
                filterParam = types.FILTER.SEARCH
                break
            }
        }
        params[types.QUERY.TYPE] = sccType
        params[types.QUERY.ORDER] = types.ORDER.DESCENDING
        params[types.QUERY.SIZE] = settings.pageSize
        if (extra.skip) {
            params[types.QUERY.FROM] = extra.skip
        }
        const ret = await scc.filter(filterParam, params, additional)
        return ret
    }

    return await catalog(req, res)
}

module.exports = {
    catalog
}