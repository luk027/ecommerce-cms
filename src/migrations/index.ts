import * as migration_20261009_103930_rename_user_role_to_seller from './20261009_103930_rename_user_role_to_seller'
import * as migration_20261009_113123_add_brand_category from './20261009_113123_add_brand_category'
import * as migration_20261009_121324_add_brand_status from './20261009_121324_add_brand_status'
import * as migration_20261009_121855_brand_verified_flags from './20261009_121855_brand_verified_flags'

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
  {
    up: migration_20261009_121324_add_brand_status.up,
    down: migration_20261009_121324_add_brand_status.down,
    name: '20261009_121324_add_brand_status',
  },
  {
    up: migration_20261009_121855_brand_verified_flags.up,
    down: migration_20261009_121855_brand_verified_flags.down,
    name: '20261009_121855_brand_verified_flags',
  },
]
