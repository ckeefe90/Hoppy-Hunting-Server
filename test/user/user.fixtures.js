function makeUserArray() {
    return [
        {
            id: 1,
            email: 'First user email',
            password: 'First user password'
        },
        {
            id: 2,
            email: 'Second user email',
            password: 'Second user password'
        },
        {
            id: 3,
            email: 'Third user email',
            password: 'Third user password'
        },
    ];
}

function makeMaliciousUser() {
    const maliciousUser = {
        id: 911,
        email: 'Malicious Email <script>alert("xss");</script>',
        password: 'User Password'
    }
    const expectedUser = {
        ...maliciousUser,
        email: 'Malicious Email &lt;script&gt;alert(\"xss\");&lt;/script&gt'
    }
    return {
        maliciousUser,
        expectedUser
    }
}

module.exports = { makeUserArray, makeMaliciousUser }