import { useState, useMemo, useEffect } from 'react'
import {
  Box,
  Button,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  Collapse,
  Chip,
  Paper,
} from '@mui/material'
import { useTheme, alpha } from '@mui/material/styles'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ClearIcon from '@mui/icons-material/Clear'

// Enable ISO week plugin for consistent week start (Monday)
dayjs.extend(isoWeek)

export type DateRange = {
  startDate: string | null
  endDate: string | null
}

type QuickFilter = 'today' | 'yesterday' | 'last7' | 'thisWeek' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'custom' | null

interface DateFilterProps {
  value: DateRange
  onChange: (range: DateRange) => void
  label?: string
}

const DateFilter = ({ value, onChange, label = 'Date Range' }: DateFilterProps) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [quickFilter, setQuickFilter] = useState<QuickFilter>(null)
  const [showCustomRange, setShowCustomRange] = useState(false)
  const [startDateInput, setStartDateInput] = useState<string>('')
  const [endDateInput, setEndDateInput] = useState<string>('')

  // Sync quickFilter state with value prop
  useEffect(() => {
    if (!value.startDate || !value.endDate) {
      setQuickFilter(null)
      return
    }

    const start = dayjs(value.startDate)
    const end = dayjs(value.endDate)
    const now = dayjs()

    // Check which quick filter matches
    if (start.isSame(now.startOf('day'), 'day') && end.isSame(now.endOf('day'), 'day')) {
      setQuickFilter('today')
    } else if (
      start.isSame(now.subtract(1, 'day').startOf('day'), 'day') &&
      end.isSame(now.subtract(1, 'day').endOf('day'), 'day')
    ) {
      setQuickFilter('yesterday')
    } else if (
      start.isSame(now.subtract(6, 'day').startOf('day'), 'day') &&
      end.isSame(now.endOf('day'), 'day')
    ) {
      setQuickFilter('last7')
    } else if (
      start.isSame(now.startOf('isoWeek'), 'day') &&
      end.isSame(now.endOf('day'), 'day')
    ) {
      setQuickFilter('thisWeek')
    } else if (
      start.isSame(now.startOf('month'), 'day') &&
      end.isSame(now.endOf('day'), 'day')
    ) {
      setQuickFilter('thisMonth')
    } else if (
      start.isSame(now.subtract(1, 'month').startOf('month'), 'day') &&
      end.isSame(now.subtract(1, 'month').endOf('month'), 'day')
    ) {
      setQuickFilter('lastMonth')
    } else if (
      start.isSame(now.startOf('year'), 'day') &&
      end.isSame(now.endOf('day'), 'day')
    ) {
      setQuickFilter('thisYear')
    } else {
      setQuickFilter('custom')
      setStartDateInput(start.format('YYYY-MM-DD'))
      setEndDateInput(end.format('YYYY-MM-DD'))
    }
  }, [value.startDate, value.endDate])

  const getQuickFilterRange = (filter: QuickFilter): DateRange => {
    const now = dayjs()
    
    switch (filter) {
      case 'today': {
        const start = now.startOf('day')
        const end = now.endOf('day')
        return {
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        }
      }
      case 'yesterday': {
        const yesterday = now.subtract(1, 'day')
        return {
          startDate: yesterday.startOf('day').toISOString(),
          endDate: yesterday.endOf('day').toISOString(),
        }
      }
      case 'last7': {
        const start = now.subtract(6, 'day').startOf('day') // 7 days including today
        const end = now.endOf('day')
        return {
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        }
      }
      case 'thisWeek': {
        const start = now.startOf('isoWeek') // Monday
        const end = now.endOf('day')
        return {
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        }
      }
      case 'thisMonth': {
        const start = now.startOf('month')
        const end = now.endOf('day')
        return {
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        }
      }
      case 'lastMonth': {
        const lastMonth = now.subtract(1, 'month')
        return {
          startDate: lastMonth.startOf('month').toISOString(),
          endDate: lastMonth.endOf('month').toISOString(),
        }
      }
      case 'thisYear': {
        const start = now.startOf('year')
        const end = now.endOf('day')
        return {
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        }
      }
      default:
        return { startDate: null, endDate: null }
    }
  }

  const handleQuickFilter = (filter: QuickFilter) => {
    if (filter === 'custom') {
      setShowCustomRange(true)
      if (value.startDate) setStartDateInput(dayjs(value.startDate).format('YYYY-MM-DD'))
      if (value.endDate) setEndDateInput(dayjs(value.endDate).format('YYYY-MM-DD'))
      setQuickFilter('custom')
    } else {
      setShowCustomRange(false)
      const range = getQuickFilterRange(filter)
      onChange(range)
    }
  }

  const handleCustomRangeApply = () => {
    if (!startDateInput || !endDateInput) {
      return
    }
    const start = dayjs(startDateInput).startOf('day').toISOString()
    const end = dayjs(endDateInput).endOf('day').toISOString()
    
    if (dayjs(start).isAfter(dayjs(end))) {
      // Swap if start is after end
      onChange({ startDate: end, endDate: start })
    } else {
      onChange({ startDate: start, endDate: end })
    }
    setQuickFilter('custom')
    setShowCustomRange(false)
  }

  const handleClear = () => {
    setQuickFilter(null)
    setShowCustomRange(false)
    setStartDateInput('')
    setEndDateInput('')
    onChange({ startDate: null, endDate: null })
  }

  const displayText = useMemo(() => {
    if (!value.startDate || !value.endDate) return 'All time'
    const start = dayjs(value.startDate)
    const end = dayjs(value.endDate)
    
    // If same day, show single date
    if (start.isSame(end, 'day')) {
      return start.format('MMM D, YYYY')
    }
    
    // If same month, show "MMM D - D, YYYY"
    if (start.isSame(end, 'month')) {
      return `${start.format('MMM D')} - ${end.format('D, YYYY')}`
    }
    
    // If same year, show "MMM D - MMM D, YYYY"
    if (start.isSame(end, 'year')) {
      return `${start.format('MMM D')} - ${end.format('MMM D, YYYY')}`
    }
    
    // Different years
    return `${start.format('MMM D, YYYY')} - ${end.format('MMM D, YYYY')}`
  }, [value])

  const quickFilters: Array<{ key: QuickFilter; label: string }> = [
    { key: 'today', label: 'Today' },
    { key: 'yesterday', label: 'Yesterday' },
    { key: 'last7', label: 'Last 7 Days' },
    { key: 'thisWeek', label: 'This Week' },
    { key: 'thisMonth', label: 'This Month' },
    { key: 'lastMonth', label: 'Last Month' },
    { key: 'thisYear', label: 'This Year' },
  ]

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.5, sm: 2 },
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        backgroundColor: alpha(theme.palette.background.paper, 0.8),
      }}
    >
      <Stack spacing={1.5}>
        {/* Header */}
        <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
          <Box display="flex" alignItems="center" gap={1}>
            <CalendarTodayIcon fontSize="small" color="action" />
            <Typography 
              variant="subtitle2" 
              fontWeight={600}
              sx={{ fontSize: { xs: '0.875rem', sm: '0.9375rem' } }}
            >
              {label}
            </Typography>
          </Box>
          {(value.startDate || value.endDate) && (
            <Chip
              icon={<ClearIcon />}
              label="Clear"
              onClick={handleClear}
              size="small"
              variant="outlined"
              sx={{
                height: { xs: 24, sm: 28 },
                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                '& .MuiChip-icon': {
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                },
              }}
            />
          )}
        </Box>

        {/* Active Filter Display */}
        {value.startDate && value.endDate && (
          <Box
            sx={{
              p: { xs: 1, sm: 1.5 },
              borderRadius: 1,
              backgroundColor: alpha(theme.palette.primary.main, 0.08),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                fontWeight: 500,
                color: 'primary.main',
                textAlign: 'center',
              }}
            >
              {displayText}
            </Typography>
          </Box>
        )}

        {isMobile ? (
          /* Mobile Layout */
          <Stack spacing={1.5}>
            {/* Quick Filter Buttons - Mobile */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 1,
              }}
            >
              {quickFilters.map((filter) => (
                <Button
                  key={filter.key}
                  variant={quickFilter === filter.key ? 'contained' : 'outlined'}
                  onClick={() => handleQuickFilter(filter.key)}
                  size="small"
                  sx={{
                    fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                    py: { xs: 0.75, sm: 1 },
                    minHeight: { xs: 36, sm: 40 },
                    textTransform: 'none',
                  }}
                >
                  {filter.label}
                </Button>
              ))}
            </Box>

            {/* Custom Range Toggle - Mobile */}
            <Button
              variant={showCustomRange ? 'contained' : 'outlined'}
              fullWidth
              startIcon={<CalendarTodayIcon />}
              endIcon={showCustomRange ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              onClick={() => {
                setShowCustomRange(!showCustomRange)
                if (!showCustomRange) {
                  setQuickFilter('custom')
                  if (value.startDate) setStartDateInput(dayjs(value.startDate).format('YYYY-MM-DD'))
                  if (value.endDate) setEndDateInput(dayjs(value.endDate).format('YYYY-MM-DD'))
                }
              }}
              size="small"
              sx={{ textTransform: 'none' }}
            >
              Custom Range
            </Button>

            {/* Custom Date Inputs - Mobile */}
            <Collapse in={showCustomRange}>
              <Stack spacing={1.5} sx={{ pt: 1 }}>
                <TextField
                  id="date-filter-start-mobile"
                  name="date-filter-start-mobile"
                  label="Start Date"
                  type="date"
                  size="small"
                  fullWidth
                  value={startDateInput}
                  onChange={(e) => setStartDateInput(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    max: endDateInput || undefined,
                  }}
                  autoComplete="off"
                />
                <TextField
                  id="date-filter-end-mobile"
                  name="date-filter-end-mobile"
                  label="End Date"
                  type="date"
                  size="small"
                  fullWidth
                  value={endDateInput}
                  onChange={(e) => setEndDateInput(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    min: startDateInput || undefined,
                  }}
                  autoComplete="off"
                />
                <Button
                  variant="contained"
                  onClick={handleCustomRangeApply}
                  fullWidth
                  disabled={!startDateInput || !endDateInput}
                  sx={{ textTransform: 'none' }}
                >
                  Apply Custom Range
                </Button>
              </Stack>
            </Collapse>
          </Stack>
        ) : (
          /* Desktop/Tablet Layout */
          <Stack spacing={1.5}>
            {/* Quick Filter Buttons - Desktop */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: 'repeat(2, 1fr)',
                  sm: 'repeat(4, 1fr)',
                  md: 'repeat(7, 1fr)',
                },
                gap: 1,
              }}
            >
              {quickFilters.map((filter) => (
                <Button
                  key={filter.key}
                  variant={quickFilter === filter.key ? 'contained' : 'outlined'}
                  onClick={() => handleQuickFilter(filter.key)}
                  size="small"
                  sx={{
                    fontSize: { xs: '0.75rem', sm: '0.8125rem', md: '0.875rem' },
                    py: { xs: 0.75, sm: 1 },
                    minHeight: { xs: 36, sm: 40 },
                    textTransform: 'none',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {filter.label}
                </Button>
              ))}
            </Box>

            {/* Custom Range Section - Desktop */}
            <Box>
              <Button
                variant={showCustomRange ? 'contained' : 'outlined'}
                fullWidth
                startIcon={<CalendarTodayIcon />}
                endIcon={showCustomRange ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                onClick={() => {
                  setShowCustomRange(!showCustomRange)
                  if (!showCustomRange) {
                    setQuickFilter('custom')
                    if (value.startDate) setStartDateInput(dayjs(value.startDate).format('YYYY-MM-DD'))
                    if (value.endDate) setEndDateInput(dayjs(value.endDate).format('YYYY-MM-DD'))
                  }
                }}
                size="small"
                sx={{ textTransform: 'none', mb: showCustomRange ? 1.5 : 0 }}
              >
                Custom Range
              </Button>

              <Collapse in={showCustomRange}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1.5}
                  sx={{ pt: 1.5 }}
                >
                  <TextField
                    id="date-filter-start"
                    name="date-filter-start"
                    label="Start Date"
                    type="date"
                    size="small"
                    fullWidth
                    value={startDateInput}
                    onChange={(e) => setStartDateInput(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{
                      max: endDateInput || undefined,
                    }}
                    autoComplete="off"
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    id="date-filter-end"
                    name="date-filter-end"
                    label="End Date"
                    type="date"
                    size="small"
                    fullWidth
                    value={endDateInput}
                    onChange={(e) => setEndDateInput(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{
                      min: startDateInput || undefined,
                    }}
                    autoComplete="off"
                    sx={{ flex: 1 }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleCustomRangeApply}
                    disabled={!startDateInput || !endDateInput}
                    sx={{
                      minWidth: { xs: '100%', sm: 100 },
                      textTransform: 'none',
                      alignSelf: { xs: 'stretch', sm: 'flex-start' },
                    }}
                  >
                    Apply
                  </Button>
                </Stack>
              </Collapse>
            </Box>
          </Stack>
        )}
      </Stack>
    </Paper>
  )
}

export default DateFilter
