import dayjs from 'dayjs'

export function getCurrentTime(format = 'YYYY_MM_DD_HH_mm_ss') {
    return dayjs(new Date()).format(format)
}
