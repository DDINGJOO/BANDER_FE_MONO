import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ExploreMapPage } from '../ExploreMapPage';

jest.mock('../../components/home/HomeHeader', () => ({
  HomeHeader: () => <div data-testid="home-header" />,
}));

jest.mock('../../components/home/HomeSpaceExplorer', () => ({
  HomeSpaceExplorer: () => <div data-testid="space-filter" />,
}));

jest.mock('../../components/map/KakaoMapView', () => ({
  KakaoMapView: () => <div data-testid="explore-map" />,
}));

test('exposes a mobile map list toggle for visible practice rooms', () => {
  render(
    <MemoryRouter>
      <ExploreMapPage />
    </MemoryRouter>,
  );

  const toggle = screen.getByRole('button', { name: /지도 안 합주실 4곳 목록 보기/ });
  expect(toggle).toHaveAttribute('aria-expanded', 'false');

  fireEvent.click(toggle);

  expect(toggle).toHaveAttribute('aria-expanded', 'true');
  expect(screen.getByRole('button', { name: /지도 안 합주실 4곳 접기/ })).toBeInTheDocument();
});
