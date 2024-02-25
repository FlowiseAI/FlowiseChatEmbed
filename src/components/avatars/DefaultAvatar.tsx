import isMobileCheck from '@/utils/isMobileCheck'

export const DefaultAvatar = () => {
  const imageSrc = "https://cdn.jsdelivr.net/gh/realty-ai-org/RealtyAIChat@main/images/default_avatar.png";
  
  return (
      <figure
        class={
          'flex justify-center items-center rounded-full text-white relative flex-shrink-0 ' +
          (isMobileCheck() ? 'w-6 h-6 text-sm' : 'w-10 h-10 text-xl')
        }
      >
        <img
          src={imageSrc}
          alt="Bot avatar"
          class="rounded-full object-cover w-full h-full"
        />
      </figure>
  )
}
