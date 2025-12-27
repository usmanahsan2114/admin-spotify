require('dotenv').config();
const { Client } = require('pg');

const PASSWORD = process.env.DB_PASSWORD || '7!tR/HubhpWc!SF'; // Fallback to raw password known from chat
const PROJECT_REF = 'yqzwfbufcmxzeqfbdlpf';

const regions = [
    { name: 'Seoul (aws-0)', host: 'aws-0-ap-northeast-2.pooler.supabase.com' },
    { name: 'Seoul (aws-1)', host: 'aws-1-ap-northeast-2.pooler.supabase.com' },
    { name: 'Tokyo (aws-0)', host: 'aws-0-ap-northeast-1.pooler.supabase.com' },
    { name: 'Singapore (aws-0)', host: 'aws-0-ap-southeast-1.pooler.supabase.com' },
    { name: 'US East (aws-0)', host: 'aws-0-us-east-1.pooler.supabase.com' },
    { name: 'EU Central (aws-0)', host: 'aws-0-eu-central-1.pooler.supabase.com' },
    { name: 'US West (aws-0)', host: 'aws-0-us-west-1.pooler.supabase.com' },
];

async function checkRegion(region) {
    console.log(`Checking ${region.name} (${region.host})...`);
    const client = new Client({
        host: region.host,
        user: `postgres.${PROJECT_REF}`,
        password: PASSWORD,
        database: 'postgres',
        port: 6543,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log(`✅ SUCCESS! Found project in ${region.name}`);
        console.log(`   Host: ${region.host}`);
        await client.end();
        return region.host;
    } catch (err) {
        if (err.message.includes('Tenant or user not found')) {
            console.log(`   ❌ Not here (Tenant not found)`);
        } else if (err.message.includes('password authentication failed')) {
            console.log(`   ⚠️  Found project in ${region.name}, but Password is WRONG.`);
            return region.host; // We found the region!
        } else if (err.code === 'ENOTFOUND') {
            console.log(`   ❌ DNS failed for host`);
        } else {
            console.log(`   ❓ Other error: ${err.message}`);
            // If it's not "Tenant not found", we might have found it but have other issues
            if (!err.message.includes('Tenant or user not found')) {
                console.log(`   !!! POTENTIAL MATCH !!!`);
                return region.host;
            }
        }
    }
    return null;
}

async function find() {
    console.log(`Searching for project ${PROJECT_REF} in common regions...`);
    for (const region of regions) {
        const found = await checkRegion(region);
        if (found) {
            console.log(`\n🎉 Project Location Identified: ${found}`);
            process.exit(0);
        }
    }
    console.log('\n❌ Could not find project in any checked region.');
    process.exit(1);
}

find();
