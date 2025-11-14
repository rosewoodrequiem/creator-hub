import type { Meta, StoryObj } from '@storybook/react'

import { ColorPalette } from '../src/components/ColorPalette'

const colors = [
  { label: 'Primary', value: '#7aa5d6' },
  { label: 'Secondary', value: '#f9d8ff' },
  { label: 'Accent', value: '#ec4899' },
  { label: 'Ink', value: '#0f172a' },
]

const meta = {
  title: 'UI/ColorPalette',
  component: ColorPalette,
  parameters: { layout: 'centered' },
  args: {
    title: 'Theme colors',
    colors,
  },
} satisfies Meta<typeof ColorPalette>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}
