import { SPRITE_SCALE } from '../../../constants.js'
import { AtlasRect } from '../../../types.js'

export function SpriteContainer({ rect, tilesetUri }: { rect: AtlasRect | null; tilesetUri: string }) {
  return (
    <div id="sprite-container">
      <div
        id="sprite-outer"
        style={
          rect
            ? { width: `${rect.width * SPRITE_SCALE}px`, height: `${rect.height * SPRITE_SCALE}px` }
            : { width: 0, height: 0 }
        }
      >
        <div
          id="sprite"
          style={
            rect
              ? {
                  width: `${rect.width}px`,
                  height: `${rect.height}px`,
                  backgroundImage: `url(${tilesetUri})`,
                  backgroundPosition: `-${rect.x}px -${rect.y}px`,
                  transform: `scale(${SPRITE_SCALE})`,
                }
              : undefined
          }
        />
      </div>
    </div>
  )
}
