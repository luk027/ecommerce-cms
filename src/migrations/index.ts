import * as migration_20261009_103930_rename_user_role_to_seller from './20261009_103930_rename_user_role_to_seller'
import * as migration_20261009_113123_add_brand_category from './20261009_113123_add_brand_category'

export const migrations = [
  {
    up: migration_20261009_103930_rename_user_role_to_seller.up,
    down: migration_20261009_103930_rename_user_role_to_seller.down,
    name: '20261009_103930_rename_user_role_to_seller',
  },
  {
    up: migration_20261009_113123_add_brand_category.up,
    down: migration_20261009_113123_add_brand_category.down,
    name: '20261009_113123_add_brand_category',
  },
]
