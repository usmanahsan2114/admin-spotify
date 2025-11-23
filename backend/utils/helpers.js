const normalizeEmail = (value = '') => value.trim().toLowerCase()
const normalizePhone = (value = '') => String(value || '').trim().replace(/\D/g, '')
const normalizeAddress = (value = '') => String(value || '').trim().toLowerCase()

const sanitizeUser = ({ passwordHash, ...rest }) => rest

module.exports = {
    normalizeEmail,
    normalizePhone,
    normalizeAddress,
    sanitizeUser,
}
