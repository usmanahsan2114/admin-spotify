import { useState, useMemo } from 'react'
import {
  Box,
  Button,
  ButtonGroup,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  Collapse,
  IconButton,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import dayjs, { type Dayjs } from 'dayjs'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'

export type DateRange = {
  startDate: string | null
  endDate: string | null
}

type QuickFilter = 'last7' | 'thisMonth' | 'lastMonth' | 'custom' | null

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

  const getQuickFilterRange = (filter: QuickFilter): DateRange => {
    const today = dayjs().endOf('day')
    switch (filter) {
      case 'last7':
        return {
          startDate: today.subtract(7, 'day').startOf('day').toISOString(),
          endDate: today.toISOString(),
        }
      case 'thisMonth':
        return {
          startDate: today.startOf('month').toISOString(),
          endDate: today.toISOString(),
        }
      case 'lastMonth':
        const lastMonth = today.subtract(1, 'month')
        return {
          startDate: lastMonth.startOf('month').toISOString(),
          endDate: lastMonth.endOf('month').toISOString(),
        }
      default:
        return { startDate: null, endDate: null }
    }
  }

  const handleQuickFilter = (filter: QuickFilter) => {
    setQuickFilter(filter)
    if (filter === 'custom') {
      setShowCustomRange(true)
      if (value.startDate) setStartDateInput(dayjs(value.startDate).format('YYYY-MM-DD'))
      if (value.endDate) setEndDateInput(dayjs(value.endDate).format('YYYY-MM-DD'))
    } else {
      setShowCustomRange(false)
      const range = getQuickFilterRange(filter)
      onChange(range)
    }
  }

  const handleCustomRangeApply = () => {
    const start = startDateInput ? dayjs(startDateInput).startOf('day').toISOString() : null
    const end = endDateInput ? dayjs(endDateInput).endOf('day').toISOString() : null
    onChange({ startDate: start, endDate: end })
    setQuickFilter('custom')
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
    const start = dayjs(value.startDate).format('MMM D, YYYY')
    const end = dayjs(value.endDate).format('MMM D, YYYY')
    return `${start} - ${end}`
  }, [value])

  return (
    <Box sx={{ width: '100%' }}>
      <Stack spacing={1.5}>
        <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
          <Typography variant="subtitle2" fontWeight={600}>
            {label}
          </Typography>
          {(value.startDate || value.endDate) && (
            <Button size="small" onClick={handleClear} sx={{ minWidth: 'auto' }}>
              Clear
            </Button>
          )}
        </Box>

        {isMobile ? (
          <Stack spacing={1}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<CalendarTodayIcon />}
              endIcon={showCustomRange ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              onClick={() => setShowCustomRange(!showCustomRange)}
            >
              {displayText}
            </Button>
            <Collapse in={showCustomRange}>
              <Stack spacing={1.5} sx={{ pt: 1 }}>
                <ButtonGroup fullWidth orientation="vertical" size="small">
                  <Button
                    variant={quickFilter === 'last7' ? 'contained' : 'outlined'}
                    onClick={() => handleQuickFilter('last7')}
                  >
                    Last 7 days
                  </Button>
                  <Button
                    variant={quickFilter === 'thisMonth' ? 'contained' : 'outlined'}
                    onClick={() => handleQuickFilter('thisMonth')}
                  >
                    This month
                  </Button>
                  <Button
                    variant={quickFilter === 'lastMonth' ? 'contained' : 'outlined'}
                    onClick={() => handleQuickFilter('lastMonth')}
                  >
                    Last month
                  </Button>
                </ButtonGroup>
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
                  autoComplete="off"
                />
                <Button variant="contained" onClick={handleCustomRangeApply} fullWidth>
                  Apply Custom Range
                </Button>
              </Stack>
            </Collapse>
          </Stack>
        ) : (
          <Stack spacing={1.5}>
            <ButtonGroup fullWidth size="small" variant="outlined">
              <Button
                variant={quickFilter === 'last7' ? 'contained' : 'outlined'}
                onClick={() => handleQuickFilter('last7')}
              >
                Last 7 days
              </Button>
              <Button
                variant={quickFilter === 'thisMonth' ? 'contained' : 'outlined'}
                onClick={() => handleQuickFilter('thisMonth')}
              >
                This month
              </Button>
              <Button
                variant={quickFilter === 'lastMonth' ? 'contained' : 'outlined'}
                onClick={() => handleQuickFilter('lastMonth')}
              >
                Last month
              </Button>
            </ButtonGroup>
            <Collapse in={showCustomRange}>
              <Stack direction="row" spacing={1}>
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
                  autoComplete="off"
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
                  autoComplete="off"
                />
                <Button variant="contained" onClick={handleCustomRangeApply} sx={{ minWidth: 100 }}>
                  Apply
                </Button>
              </Stack>
            </Collapse>
            {!showCustomRange && (
              <Button
                variant="text"
                size="small"
                onClick={() => {
                  setShowCustomRange(true)
                  if (value.startDate) setStartDateInput(dayjs(value.startDate).format('YYYY-MM-DD'))
                  if (value.endDate) setEndDateInput(dayjs(value.endDate).format('YYYY-MM-DD'))
                }}
              >
                Custom range
              </Button>
            )}
          </Stack>
        )}
      </Stack>
    </Box>
  )
}

export default DateFilter

