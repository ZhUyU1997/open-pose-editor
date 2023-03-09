import dayjs from 'dayjs'
console.log(
    __APP_VERSION__ +
        '  ' +
        dayjs(__APP_BUILD_TIME__).format('YYYY-MM-DD HH:mm:ss')
)
import { PWACheck } from './update'
PWACheck()
