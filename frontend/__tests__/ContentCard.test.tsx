import { render, screen } from '@testing-library/react'
import ContentCard from '../components/ContentCard'

test('renders content card title and stats', () => {
  const item = { id: '1', title: 'Test', mediaType: 'image', likes: 5, replies: 1, reposts: 0, views: 100 }
  render(<ContentCard item={item as any} />)
  expect(screen.getByText('Test')).not.toBeNull()
  // stats render icon + number; assert numbers are present
  expect(screen.getByText('5')).toBeInTheDocument()
  expect(screen.getByText('100')).toBeInTheDocument()
})
