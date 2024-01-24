import { Show } from "solid-js";
import { Product } from "./Products";

const ProductInfo = (props: {product: Product | {loading: boolean} | undefined}) => {
  const product = props.product;
  return <Show
      when={product != undefined && !product.loading}
      fallback={ <div class="border border-black max-w-xs m-4 aspect-square bg-white" />}
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
