const normalizeEmail = (value = '') => String(value || '').trim().toLowerCase()
const normalizePhone = (value = '') => String(value || '').trim().replace(/\D/g, '')
const normalizeAddress = (value = '') => String(value || '').trim().toLowerCase()

const sanitizeUser = ({ passwordHash, ...rest }) => rest

const ensureArray = (value) => {
    if (Array.isArray(value)) return value
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value)
            if (Array.isArray(parsed)) return parsed
        } catch (e) {
            return value.split(',').map(s => s.trim()).filter(Boolean)
        }
    }
    return []
}

module.exports = {
    normalizeEmail,
    normalizePhone,
    normalizeAddress,
    sanitizeUser,
    ensureArray,
}
