import React from 'react';
import { render } from '@testing-library/react';
import App from './App';

test('we should start with the rooms Overview', () => {
  const { getByText } = render(<App />);
  const linkElement = getByText(/Rooms/i);
  expect(linkElement).toBeInTheDocument();
});
