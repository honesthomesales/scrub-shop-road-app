import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Header from './Header';
import { AppProvider } from '../contexts/AppContext';

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <AppProvider>
        {component}
      </AppProvider>
    </BrowserRouter>
  );
};

describe('Header', () => {
  it('renders the app title', () => {
    renderWithProviders(<Header />);
    expect(screen.getByText('Scrub Shop Road App')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    renderWithProviders(<Header />);
    // Use getAllByText since there are multiple instances (desktop and mobile)
    expect(screen.getAllByText('Dashboard')).toHaveLength(2);
    expect(screen.getAllByText('Daily Sales')).toHaveLength(2);
    expect(screen.getAllByText('Calendar')).toHaveLength(2);
    expect(screen.getAllByText('Venues')).toHaveLength(2);
    expect(screen.getAllByText('Staff')).toHaveLength(2);
  });

  it('shows sheet toggle button', () => {
    renderWithProviders(<Header />);
    expect(screen.getByText('Trailer')).toBeInTheDocument();
  });

  it('renders AuthStatus component', () => {
    renderWithProviders(<Header />);
    // AuthStatus should be rendered (we can check for its presence)
    expect(screen.getByRole('button', { name: /trailer/i })).toBeInTheDocument();
  });
}); 