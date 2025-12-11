const fetch = require('node-fetch')

async function testLogin() {
    console.log('Testing Superadmin login...')

    try {
        const response = await fetch('http://localhost:5000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'superadmin@shopifyadmin.pk',
                password: 'superadmin123'
            })
        })

        const text = await response.text()
        console.log('Status:', response.status)
        console.log('Response:', text)

        if (response.ok) {
            const data = JSON.parse(text)
            console.log('\n✅ Login successful!')
            console.log('User:', data.user)
            console.log('Token:', data.token.substring(0, 20) + '...')
        } else {
            console.log('\n❌ Login failed')
        }
    } catch (error) {
        console.error('Error:', error.message)
    }
}

testLogin()
