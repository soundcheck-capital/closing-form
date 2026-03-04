import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders main container', () => {
    render(<App />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });
});
