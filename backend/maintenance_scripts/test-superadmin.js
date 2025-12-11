require('dotenv').config({ path: require('path').join(__dirname, '.env') })
const bcrypt = require('bcryptjs')
const db = require('./models')

async function testSuperadmin() {
    try {
        console.log('\n=== Testing Superadmin User ===\n')

        // Check if superadmin exists
        const superadmin = await db.User.findOne({
            where: { email: 'superadmin@shopifyadmin.pk' }
        })

        if (!superadmin) {
            console.log('❌ Superadmin user NOT found in database!')
            console.log('Creating superadmin now...\n')

            const hashedPassword = bcrypt.hashSync('superadmin123', 10)
            const newSuperadmin = await db.User.create({
                email: 'superadmin@shopifyadmin.pk',
                passwordHash: hashedPassword,
                name: 'Super Admin',
                role: 'superadmin',
                storeId: null,
                fullName: 'Super Administrator',
                phone: '+92-300-0000000',
                profilePictureUrl: null,
                defaultDateRangeFilter: 'last7',
                notificationPreferences: { newOrders: true, lowStock: true, returnsPending: true },
                permissions: {
                    viewOrders: true, editOrders: true, deleteOrders: true,
                    viewProducts: true, editProducts: true, deleteProducts: true,
                    viewCustomers: true, editCustomers: true,
                    viewReturns: true, processReturns: true,
                    viewReports: true, manageUsers: true, manageSettings: true,
                },
                active: true,
                passwordChangedAt: new Date(),
            })

            console.log('✅ Superadmin user created successfully!')
            console.log('Email:', newSuperadmin.email)
            console.log('Role:', newSuperadmin.role)
        } else {
            console.log('✅ Superadmin user found in database!')
            console.log('Email:', superadmin.email)
            console.log('Role:', superadmin.role)
            console.log('Active:', superadmin.active)
            console.log('StoreId:', superadmin.storeId)

            // Test password
            const passwordMatch = bcrypt.compareSync('superadmin123', superadmin.passwordHash)
            console.log('\nPassword test:', passwordMatch ? '✅ CORRECT' : '❌ WRONG')
        }

        // List all users
        const allUsers = await db.User.findAll({ attributes: ['email', 'role', 'storeId'] })
        console.log('\n=== All Users in Database ===')
        console.log(`Total: ${allUsers.length} users`)
        allUsers.forEach(u => {
            console.log(`- ${u.email} (role: ${u.role}, storeId: ${u.storeId})`)
        })

        process.exit(0)
    } catch (error) {
        console.error('Error:', error)
        process.exit(1)
    }
}

testSuperadmin()
