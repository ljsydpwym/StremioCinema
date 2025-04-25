const helpers = require('../helpers/helpers.js')

describe('bytesToSize', () => {
    it.each([
        [1073741823, "1024 MB"],
        [1073741824, "1.00 GB"],
    ])('file size format', (number, result) => {
        expect(helpers.bytesToSize(number)).toBe(result);
    });
})