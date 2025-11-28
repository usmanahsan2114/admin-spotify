import * as yup from 'yup';

const schema = yup.object({
    email: yup.string().email('Enter a valid email').required('Email is required'),
});

const email = 'usmanahsan21151@gmail.com';

schema.validate({ email })
    .then(() => console.log('Validation passed'))
    .catch((err) => console.log('Validation failed:', err.message));
