import { accountCollections, Users } from './accounts'
import { catalogCollections } from './catalog'

export { Users }
export const collections = [...accountCollections, ...catalogCollections]
