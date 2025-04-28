const { loadStreams } = require('../routes/streams.js')

test('loadStreams', async () => {
    // const res = await loadStreams({ token: 'ZGNvbmFuOkRleHRlcjAw', type: 'movie', id: 'tt974576' })
    const res = await loadStreams({ token: 'ZGNvbmFuOkRleHRlcjAw', type: 'series', id: 'tt0285403:1:1' })
    expect(res.length).toBe(54);
})