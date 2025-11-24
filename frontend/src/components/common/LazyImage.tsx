import { useState } from 'react'
import { Box, Skeleton, type BoxProps } from '@mui/material'
import ImageNotSupportedIcon from '@mui/icons-material/ImageNotSupported'

interface LazyImageProps extends BoxProps {
    src: string
    alt: string
    width?: string | number
    height?: string | number
    objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
    borderRadius?: string | number
}

const LazyImage = ({
    src,
    alt,
    width = '100%',
    height = '100%',
    objectFit = 'cover',
    borderRadius = 0,
    sx,
    ...props
}: LazyImageProps) => {
    const [loaded, setLoaded] = useState(false)
    const [error, setError] = useState(false)

    const handleLoad = () => {
        setLoaded(true)
    }

    const handleError = () => {
        setLoaded(true)
        setError(true)
    }

    return (
        <Box
            sx={{
                position: 'relative',
                width,
                height,
                borderRadius,
                overflow: 'hidden',
                bgcolor: 'action.hover',
                ...sx,
            }}
            {...props}
        >
            {!loaded && (
                <Skeleton
                    variant="rectangular"
                    width="100%"
                    height="100%"
                    animation="wave"
                    sx={{ position: 'absolute', top: 0, left: 0 }}
                />
            )}
            {error ? (
                <Box
                    sx={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'text.disabled',
                    }}
                >
                    <ImageNotSupportedIcon />
                </Box>
            ) : (
                <img
                    src={src}
                    alt={alt}
                    loading="lazy"
                    onLoad={handleLoad}
                    onError={handleError}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit,
                        opacity: loaded ? 1 : 0,
                        transition: 'opacity 0.3s ease-in-out',
                    }}
                />
            )}
        </Box>
    )
}

export default LazyImage
