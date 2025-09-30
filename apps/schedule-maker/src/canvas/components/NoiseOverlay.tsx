import React from "react"

/**
 * Very light, tiling noise overlay (transparent). Improves gradient banding in exports.
 * The data URI is a tiny 64x64 PNG with soft monochrome noise.
 */
const NOISE_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEEAAABBAQAAAABb7l5jAAABFUlEQVQ4y8WQwQ2CMBRFrxgWkYkYg2EwFqNQJcQ4kQf6H7F2m2z4R4v9Cq2oQx0q8yq3w1d5c1Jc3k9vWcA4P0e2QmK0l1z8Zx5m8nWg6Y7Z3yGmK7UoH1JcYy3iOe5+7cQGZpQwC7Q3i8Qk6v7l1JfXoG0XW8Cw2m8I3JQqA1H0m0JvSgQk0b7F6XQ3Z9h8QwC7m6a7h8E3h7VvQz5Qo2rB2+0k8m0h2m2J8q3K7zq5g0BvX0hA2lM2m8Cq+0rEo6yHqQq3M4Q9jz0c8WwH3rGfJ3wVj4A+3w6mI8h4bZx8fW8i8wQG9CzY0cQ+QwAAAAAElFTkSuQmCC"

export default function NoiseOverlay({
  opacity = 0.06,
  zIndex = 5,
  radius = 0,
}: {
  opacity?: number
  zIndex?: number
  radius?: number
}) {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        zIndex,
        borderRadius: radius ? `${radius}px` : undefined,
        backgroundImage: `url(${NOISE_PNG})`,
        backgroundRepeat: "repeat",
        opacity,
        mixBlendMode: "overlay",
      }}
    />
  )
}
