const { streams } = require('../routes/streams.js')

test('loadStreams', async () => {
    const res = await loadStreams({ token: 'ZGNvbmFuOkRleHRlcjAw', type: 'movie', id: 'tt26584495' })
    expect(res.length).toBe(54);
})