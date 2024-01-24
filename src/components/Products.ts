import { createSignal } from "solid-js";

export type Product = {
    id: number;
    sku: string;
    name: string;
    price: number | null;
    description: string;
    shortDescription: string;
    imageUrl: string;
    categories: string;
    permalink: string;
    affiliateLink: string;
};

export const [products, setProducts] = createSignal(new Map<string, Product | { loading: true }>());

export const updateProducts = async (sku: string): Promise<null> => {
    try {
        const response = await fetch(`https://glowi.ai/wp-json/custom-api/v1/product-by-sku/${sku}`);
        const ret = await response.json();
        console.log('Fetched product:', ret);
        setProducts((prevProducts) => {
            prevProducts.delete(sku);
            const newProducts = new Map(prevProducts);
            newProducts.set(sku, ret);
            return newProducts;
        });
    } catch (error) {
        console.error('Error fetching product data:', error);
    }
    return null;
};