
const { User } = require('./models');

async function checkUser() {
    try {
        const email = 'admin@pakgusu.pk';
        console.log(`Checking for user with email: ${email}`);
        const user = await User.findOne({ where: { email } });

        if (user) {
            console.log('User found:', user.toJSON());
            console.log('Password hash:', user.passwordHash ? 'Present' : 'Missing');
        } else {
            console.log('User NOT found.');
        }
    } catch (error) {
        console.error('Error checking user:', error);
    }
}

checkUser();
