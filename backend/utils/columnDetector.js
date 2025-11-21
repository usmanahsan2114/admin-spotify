/**
 * Smart Column Detector - Intelligent CSV column mapping utility
 * Detects and maps CSV columns to expected fields using fuzzy matching and synonyms
 */

/**
 * Calculate Levenshtein distance for fuzzy string matching
 */
function levenshteinDistance(str1, str2) {
    const s1 = str1.toLowerCase()
    const s2 = str2.toLowerCase()

    const m = s1.length
    const n = s2.length
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))

    for (let i = 0; i <= m; i++) dp[i][0] = i
    for (let j = 0; j <= n; j++) dp[0][j] = j

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (s1[i - 1] === s2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1]
            } else {
                dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
            }
        }
    }

    return dp[m][n]
}

/**
 * Calculate similarity score (0-1) between two strings
 */
function similarityScore(str1, str2) {
    const distance = levenshteinDistance(str1, str2)
    const maxLength = Math.max(str1.length, str2.length)
    return maxLength === 0 ? 1 : 1 - distance / maxLength
}

/**
 * Normalize header name for comparison
 */
function normalizeHeader(header) {
    return header
        .toLowerCase()
        .replace(/[_\-\s]+/g, '') // Remove separators
        .replace(/[^a-z0-9]/g, '') // Remove special chars
}

/**
 * Detect which header column best matches a field definition
 * @param {string[]} headers - Array of CSV column headers
 * @param {Object} fieldDef - Field definition with aliases
 * @returns {Object} - Best match with confidence score
 */
function detectColumn(headers, fieldDef) {
    const { aliases = [], required = false } = fieldDef

    let bestMatch = null
    let bestScore = 0
    let exactMatch = false

    for (const header of headers) {
        const normalizedHeader = normalizeHeader(header)

        // Check exact matches first
        for (const alias of aliases) {
            const normalizedAlias = normalizeHeader(alias)

            if (normalizedHeader === normalizedAlias) {
                return {
                    header,
                    alias,
                    confidence: 1.0,
                    exactMatch: true,
                    required
                }
            }
        }

        // Fuzzy matching
        for (const alias of aliases) {
            const score = similarityScore(normalizedHeader, normalizeHeader(alias))

            if (score > bestScore) {
                bestScore = score
                bestMatch = header
                exactMatch = false
            }
        }
    }

    if (bestMatch && bestScore >= 0.6) { // Minimum 60% similarity threshold
        return {
            header: bestMatch,
            confidence: bestScore,
            exactMatch: false,
            required
        }
    }

    return {
        header: null,
        confidence: 0,
        exactMatch: false,
        required
    }
}

/**
 * Detect column mappings for order imports
 */
function detectOrderColumns(headers) {
    return {
        productName: detectColumn(headers, {
            required: true,
            aliases: ['productname', 'product_name', 'product', 'item', 'itemname', 'item_name', 'sku']
        }),
        customerName: detectColumn(headers, {
            required: true,
            aliases: ['customername', 'customer_name', 'customer', 'name', 'client', 'clientname', 'buyer', 'buyername']
        }),
        email: detectColumn(headers, {
            required: true,
            aliases: ['email', 'e-mail', 'emailaddress', 'email_address', 'customeremail', 'customer_email', 'contact', 'contactemail']
        }),
        phone: detectColumn(headers, {
            required: false,
            aliases: ['phone', 'phonenumber', 'phone_number', 'telephone', 'tel', 'mobile', 'customerphone', 'customer_phone', 'contact_number']
        }),
        quantity: detectColumn(headers, {
            required: true,
            aliases: ['quantity', 'qty', 'amount', 'count', 'units', 'orderquantity', 'order_quantity']
        }),
        notes: detectColumn(headers, {
            required: false,
            aliases: ['notes', 'note', 'description', 'comments', 'comment', 'remarks', 'remark', 'details']
        })
    }
}

/**
 * Detect column mappings for product imports
 */
function detectProductColumns(headers) {
    return {
        name: detectColumn(headers, {
            required: true,
            aliases: ['name', 'productname', 'product_name', 'product', 'item', 'itemname', 'item_name', 'title']
        }),
        category: detectColumn(headers, {
            required: false,
            aliases: ['category', 'productcategory', 'product_category', 'type', 'producttype', 'product_type', 'group']
        }),
        price: detectColumn(headers, {
            required: true,
            aliases: ['price', 'unitprice', 'unit_price', 'cost', 'amount', 'rate', 'productprice', 'product_price']
        }),
        stockQuantity: detectColumn(headers, {
            required: false,
            aliases: ['stockquantity', 'stock_quantity', 'stock', 'quantity', 'qty', 'inventory', 'instock', 'in_stock', 'available']
        }),
        reorderThreshold: detectColumn(headers, {
            required: false,
            aliases: ['reorderthreshold', 'reorder_threshold', 'reorder', 'minstock', 'min_stock', 'minimum', 'threshold']
        }),
        status: detectColumn(headers, {
            required: false,
            aliases: ['status', 'productstatus', 'product_status', 'state', 'active', 'enabled', 'availability']
        }),
        description: detectColumn(headers, {
            required: false,
            aliases: ['description', 'desc', 'details', 'productdescription', 'product_description', 'info', 'notes']
        }),
        sku: detectColumn(headers, {
            required: false,
            aliases: ['sku', 'productsku', 'product_sku', 'code', 'productcode', 'product_code', 'id', 'itemid']
        })
    }
}

/**
 * Get mapping summary with confidence scores
 */
function getMappingSummary(columnMappings) {
    const summary = {
        totalFields: 0,
        mappedFields: 0,
        requiredMapped: 0,
        requiredMissing: 0,
        lowConfidence: [],
        mappings: {}
    }

    for (const [fieldName, mapping] of Object.entries(columnMappings)) {
        summary.totalFields++

        if (mapping.header) {
            summary.mappedFields++
            summary.mappings[fieldName] = {
                csvColumn: mapping.header,
                confidence: mapping.confidence,
                exactMatch: mapping.exactMatch
            }

            if (mapping.required) {
                summary.requiredMapped++
            }

            if (mapping.confidence < 0.8 && !mapping.exactMatch) {
                summary.lowConfidence.push({
                    field: fieldName,
                    csvColumn: mapping.header,
                    confidence: mapping.confidence
                })
            }
        } else if (mapping.required) {
            summary.requiredMissing++
        }
    }

    return summary
}

/**
 * Extract data from row using detected column mappings
 */
function extractRowData(row, columnMappings) {
    const data = {}

    for (const [fieldName, mapping] of Object.entries(columnMappings)) {
        if (mapping.header && row[mapping.header] !== undefined) {
            data[fieldName] = row[mapping.header]
        }
    }

    return data
}

module.exports = {
    detectOrderColumns,
    detectProductColumns,
    getMappingSummary,
    extractRowData,
    normalizeHeader,
    similarityScore
}
