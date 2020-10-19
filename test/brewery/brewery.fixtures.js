function makeBreweryArray() {
    return [
        {
            id: 1,
            name: 'One Love Brewery',
            address: '25 S Mountain Dr, Lincoln, NH 03251',
            comments: 'Still serving flights!',
            user_id: 1
        },
        {
            id: 2,
            name: 'Woodstock Inn Brewery',
            address: '135 Main St, North Woodstock, NH 03262',
            comments: 'A great place to try when One Love has a long wait',
            user_id: 2
        },
        {
            id: 3,
            name: 'White Mountain Brewing',
            address: '50 Winter St, Ashland, NH 03217',
            comments: 'They have a porter',
            user_id: 3
        }
    ]
}

function makeMaliciousBrewery() {
    const maliciousBrewery = {
        id: 911,
        name: 'Naughty naughty very naughty <script>alert("xss");</script>',
        address: '911 Bad Road, Bad City, NH, 03217',
        comments: 'This is a bad brewery'
    }
    const expectedBrewery = {
        ...maliciousBrewery,
        name: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;'
    }
    return {
        maliciousBrewery,
        expectedBrewery,
    }
}

module.exports = { makeBreweryArray, makeMaliciousBrewery }