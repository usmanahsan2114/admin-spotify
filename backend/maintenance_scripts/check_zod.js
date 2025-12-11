const zod = require('zod');
console.log('Type of zod:', typeof zod);
console.log('Keys of zod:', Object.keys(zod));
try {
    const { z } = require('zod');
    console.log('z is defined:', !!z);
    console.log('z.ZodError:', !!z.ZodError);

    const schema = z.object({ name: z.string() });
    schema.parse({});
} catch (e) {
    console.log('Error instance of z.ZodError:', e instanceof require('zod').z.ZodError);
    console.log('Error keys:', Object.keys(e));
    console.log('Error errors:', e.errors);
    console.log('Error issues:', e.issues);
}
