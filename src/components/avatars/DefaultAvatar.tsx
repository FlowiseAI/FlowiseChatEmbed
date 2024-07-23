import isMobileCheck from '@/utils/isMobileCheck'

export const DefaultAvatar = () => {
  const imageSrc = "https://cdn.jsdelivr.net/gh/realty-ai-org/RealtyAIChat@main/images/default_avatar.png";
  
  return (
      <figure
        class={
          'flex justify-center items-center rounded-full text-white relative flex-shrink-0 ' +
          (isMobileCheck() ? 'w-8 h-8 text-sm' : 'w-10 h-10 text-xl')
        }
      >
        <img
          src={imageSrc}
          alt="Bot avatar"
          class="rounded-full object-cover w-full h-full"
        />
            <svg viewBox="0 0 24 24" 
              class = {isMobileCheck() ? 'w-3 h-3' : "w-4 h-4"}
              style="position: absolute;top: 84%;left: 84%;transform: translate(-50%, -50%);">
                <path fill="#3BF653" d="m2 12a10 10 0 1 1 10 10 10 10 0 0 1 -10-10z"/>
            </svg>
      </figure>
  )
}
