import { onCleanup, onMount } from 'solid-js'

type Props = {
  botContainer: HTMLDivElement | undefined
  badgeText?:string
  poweredByTextColor?: string
  badgeBackgroundColor?: string

}

const defaultTextColor = '#303235'

export const Badge = (props: Props) => {
  let liteBadge: HTMLAnchorElement | undefined
  let observer: MutationObserver | undefined

  const appendBadgeIfNecessary = (mutations: MutationRecord[]) => {
    mutations.forEach((mutation) => {
      mutation.removedNodes.forEach((removedNode) => {
        if (
          'id' in removedNode &&
          liteBadge &&
          removedNode.id == 'lite-badge'
        ) {
          console.log("Sorry, you can't remove the brand 😅")
          props.botContainer?.append(liteBadge)
        }
      })
    })
  }

  onMount(() => {
    if (!document || !props.botContainer) return
    observer = new MutationObserver(appendBadgeIfNecessary)
    observer.observe(props.botContainer, {
      subtree: false,
      childList: true,
    })
  })

  onCleanup(() => {
    if (observer) observer.disconnect()
  })



  const default_text = (<>Powered by 
      <a
        ref={liteBadge}
        href={'https://www.realty-ai.ca'}
        target="_blank"
        rel="noopener noreferrer"
        class="lite-badge"
        id="lite-badge"
        style={{ "font-weight": 'bold', color: props.poweredByTextColor ?? defaultTextColor }}
      >
        <span>Realty AI</span>
      </a>
    </>)

  const badge_text = props.badgeText ? (<span style={{ "font-weight": 'bold', color: props.poweredByTextColor ?? defaultTextColor }}>{props.badgeText}</span>): default_text

  return (
    <span style={{
      "font-size": '13px',
      position: 'absolute',
      bottom: 0,
      padding: '10px',
      margin: 'auto',
      width: '100%',
      "text-align": 'center',
      color: props.poweredByTextColor ?? defaultTextColor,
      "background-color": props.badgeBackgroundColor ?? '#ffffff'
    }}>
      {badge_text}
    </span>
  )
}
