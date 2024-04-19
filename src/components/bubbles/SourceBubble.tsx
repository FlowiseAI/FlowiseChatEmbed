import { For, createSignal } from 'solid-js';
import { InstagramMetadata, ProductMetadata, SourceDocument } from '../Bot';
import { BotMessageTheme } from '@/features/bubble/types';
import ProductInfo from '../ProductInfo';
import { toNumber } from 'lodash';

type ItemsProps = {
  sources: SourceDocument[];
} & BotMessageTheme;

type ItemProps = {
  source: SourceDocument;
  backgroundColor: string;
};

export const Slideshow = (props: ItemsProps) => {
  const [currentSlide, setCurrentSlide] = createSignal(0);

  const nextSlide = () => {
    setCurrentSlide((prev: number) => (prev + 1) % props.sources.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev: number) => (prev - 1 + props.sources.length) % props.sources.length);
  };

  return (
    <div class="flex items-center justify-center" style={{ 'max-width': 'min(66vw, 75%)' }}>
      <button class="p-4 bg-gray-200 hover:bg-gray-300" onClick={prevSlide}>
        ‹
      </button>
      <div class="w-full flex overflow-hidden">
        <For each={props.sources}>
          {(source, index) => (
            <div
              class={`flex-none w-full transition-transform duration-300 ease-in-out ${
                index() === currentSlide() ? 'transform translate-x-0' : 'transform translate-x-full'
              }`}
            >
              <CarouselItem source={source} backgroundColor={props.backgroundColor} />
              <a href="#slide4" class="btn btn-circle">
                ❮
              </a>
              <a href="#slide2" class="btn btn-circle">
                ❯
              </a>
            </div>
          )}
        </For>
      </div>
      <button class="p-4 bg-gray-200 hover:bg-gray-300" onClick={nextSlide}>
        ›
      </button>
    </div>
  );
};

export const IGCarouselItem = (props: { item: InstagramMetadata }) => {
  if (!props.item.media_url) return <></>;
  return (
    <div class="carousel-item w-full pl-4">
      <iframe
        class="rounded-xl"
        height={'800px'}
        src={`${props.item.media_url}embed/captioned/?rd=https%3A%2F%2Fembedinstagramfeed.com`}
        name={`ig-${props.item.pk}`}
      ></iframe>
    </div>
  );
};

export const ProductCarouselItem = (props: { item: ProductMetadata; bg: string }) => {
  return (
    <div
      class="carousel-item ml-4 overflow-hidden w-full flex flex-col"
      style={{ background: props.bg }}
      onclick={() => window.open(props.item.item_url, '_blank')}
    >
      <img
        class="w-full object-contain bg-white"
        src="https://cdn.holidoit.com/media/experiences/274/images/600/Cena_in_barca_e_tour_a_Finale_Ligure-9-21486.webp"
        alt={props.item.name}
      />
      <div class="px-6 py-4">
        <div class="text-l mb-2">{props.item.name}</div>
        <p class="text-gray-400 font-normal">Starting at {toNumber(props.item.price) | 0}€ per person</p>
      </div>
      <div class="px-6 pt-4 pb-2 flex flex-col items-center w-full">
        <span class="bg-black rounded-full w-full text-center text-sm text-white mb-2 py-3 px-2">Prenota</span>
      </div>
    </div>
  );
};

export const CarouselItem = (props: ItemProps) => {
  if (props.source.metadata.resource_url) return IGCarouselItem(props.source.metadata as InstagramMetadata);
  return ProductCarouselItem(props.source.metadata as ProductMetadata, props.backgroundColor);
};

export const ProductSourcesBubble = (props: ItemsProps) => {
  const [currentSlide, setCurrentSlide] = createSignal(0);

  const nextSlide = () => {
    setCurrentSlide((prev: number) => (prev + 1) % props.sources.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev: number) => (prev - 1 + props.sources.length) % props.sources.length);
  };
  return (
    <div class="carousel w-80 flex rounded-2xl host-container mt-5 ml-2" style={{ background: props.backgroundColor }}>
      <For each={props.sources}>
        {(source: SourceDocument) => {
          return <ProductCarouselItem item={source.metadata} backgroundColor={props.backgroundColor} />;
        }}
      </For>
    </div>
  );
};

export const InstagramSourcesBubble = (props: ItemsProps) => {
  const [currentSlide, setCurrentSlide] = createSignal(0);

  const nextSlide = () => {
    setCurrentSlide((prev: number) => (prev + 1) % props.sources.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev: number) => (prev - 1 + props.sources.length) % props.sources.length);
  };
  return (
    <div class="carousel w-80 flex rounded-2xl host-container mt-5 ml-2 bg-white">
      <For each={props.sources}>
        {(source: SourceDocument) => {
          return <IGCarouselItem item={source.metadata} backgroundColor={props.backgroundColor} />;
        }}
      </For>
    </div>
  );
};
