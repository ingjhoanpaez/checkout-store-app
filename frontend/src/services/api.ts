const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export const getProducts = async (): Promise<unknown> => {
  const response = await fetch(`${API_URL}/products`);

  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }

  return response.json();
};
