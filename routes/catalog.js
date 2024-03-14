const qs = require('querystring')

const Logger = require('../helpers/logger.js')
const { settingsLoader } = require('../helpers/settings.js')
const helpers = require('../helpers/helpers.js')
const env = require('../helpers/env.js')

const catalogs = require('../logic/catalogs.js')
const SccMeta = require('../logic/stremio.js')

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
            case helpers.STREMIO_TYPE.MOVIE:
                sccType = helpers.SCC_TYPE.MOVIE;
                break;
            case helpers.STREMIO_TYPE.SHOW:
                sccType = helpers.SCC_TYPE.SHOW;
                break;
            case helpers.STREMIO_TYPE.ANIME:
                sccType = helpers.SCC_TYPE.ANIME;
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
        const days = 100000
        const size = 30
        const laguages = "sk"
        var params = {}
        var filterParam = catalogs.FILTER.ALL
        switch (filter) {
            case catalogs.CATALOG_KEYS.new_releases_dubbed: {
                params[catalogs.QUERY.LANG] = laguages
                params[catalogs.QUERY.SORT] = catalogs.SORT.LANG_DATE_ADDED
                params[catalogs.QUERY.DAYS] = days
                filterParam = catalogs.FILTER.NEWS_DUBBED
                break
            }
            case catalogs.CATALOG_KEYS.new_releases: {
                params[catalogs.QUERY.SORT] = catalogs.SORT.DATE_ADDED
                params[catalogs.QUERY.DAYS] = days
                filterParam = catalogs.FILTER.NEWS
                break
            }
            case catalogs.CATALOG_KEYS.last_added_children: {
                params[catalogs.QUERY.SORT] = catalogs.SORT.LAST_CHILDREN_DATE_ADDED
                params[catalogs.QUERY.DAYS] = days
                break
            }
            case catalogs.CATALOG_KEYS.new_releases_children: {
                params[catalogs.QUERY.SORT] = catalogs.SORT.LAST_CHILD_PREMIERED
                params[catalogs.QUERY.DAYS] = days
                filterParam = catalogs.FILTER.NEWS_CHILDREN
                break
            }
            case catalogs.CATALOG_KEYS.new_releases_subs: {
                params[catalogs.QUERY.SORT] = catalogs.SORT.DATE_ADDED
                params[catalogs.QUERY.LANG] = laguages
                params[catalogs.QUERY.DAYS] = days
                filterParam = catalogs.FILTER.NEWS_SUBS
                break
            }
            case catalogs.CATALOG_KEYS.most_watched: {
                params[catalogs.QUERY.SORT] = catalogs.SORT.PLAY_COUNT
                break
            }
            case catalogs.CATALOG_KEYS.popular: {
                params[catalogs.QUERY.SORT] = catalogs.SORT.POPULARITY
                break
            }
            case catalogs.CATALOG_KEYS.trending: {
                params[catalogs.QUERY.SORT] = catalogs.SORT.TRENDING
                break
            }
            case catalogs.CATALOG_KEYS.last_added: {
                params[catalogs.QUERY.SORT] = catalogs.SORT.DATE_ADDED
                break
            }
            case catalogs.CATALOG_KEYS.genre: {
                const genreKey = catalogs.GENRES.find(it => it.name == extra.genre)?.key
                if (!genreKey) {
                    return undefined
                }
                params[catalogs.QUERY.SORT] = catalogs.SORT.YEAR
                params[catalogs.QUERY.VALUE] = encodeURIComponent(genreKey)
                filterParam = catalogs.FILTER.GENRE
                break
            }
            default: {
                if (!extra.search) {
                    return undefined
                }
                params[catalogs.QUERY.VALUE] = encodeURIComponent(extra.search)
                params[catalogs.QUERY.SORT] = catalogs.SORT.SCORE
                filterParam = catalogs.FILTER.SEARCH
                break
            }
        }
        params[catalogs.QUERY.TYPE] = sccType
        params[catalogs.QUERY.ORDER] = catalogs.ORDER.DESCENDING
        params[catalogs.QUERY.SIZE] = size
        if (extra.skip) {
            params[catalogs.QUERY.FROM] = extra.skip
        }
        const ret = await scc.filter(filterParam, params)
        return ret
    }

    return await catalog(req, res)
}

module.exports = {
    catalog
}