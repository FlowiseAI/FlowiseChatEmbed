import { Show, createResource, createSignal } from "solid-js";
import { products } from "./Bot";

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

const ProductInfo = (props: {product: Product | {loading: boolean} | undefined}) => {
  const product = props.product;
  return <Show
      when={product != undefined && !product.loading}
      fallback={ <div class="border border-black max-w-xs m-4 w-full aspect-square bg-white" />}
    >
      <div class="border border-black max-w-xs m-4">
          <img src={product.imageUrl} alt={product.name} class="w-full aspect-square object-contain p-4 bg-white" />
          <a target="blank" href={product.affiliateLink} class="  border-black border-t w-full text-center py-2 px-4 block bg-white text-black hover:bg-black hover:text-white no-underline hover:no-underline" style={{ "font-family": "Jost", "font-size": "11px", "font-weight": "800" }}>
            ACQUISTA PRODOTTO
          </a>
        </div>
    </Show>

};

export default ProductInfo;
