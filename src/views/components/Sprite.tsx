import { Rect } from '../../types.js'

interface ISpriteProps {
  rect: Rect
  tilesetUri: string
  scale?: number
}

export function Sprite({ rect, tilesetUri, scale = 1 }: ISpriteProps) {
  return (
    <div id="sprite-outer" style={{ width: `${rect.width * scale}px`, height: `${rect.height * scale}px` }}>
      <div
        id="sprite"
        style={{
          width: `${rect.width}px`,
          height: `${rect.height}px`,
          backgroundImage: `url(${tilesetUri})`,
          backgroundPosition: `-${rect.x}px -${rect.y}px`,
          transform: `scale(${scale})`,
        }}
      />
    </div>
  )
}
