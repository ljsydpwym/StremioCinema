const catalogs = require('../catalogs.js')

describe('catalogs', () => {
    const output = catalogs.catalogsManifest()
    expect(output).toBe("");
})