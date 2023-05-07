export function IsQQBrowser() {
    const ua = navigator.userAgent.toLocaleLowerCase()
    if (ua.match(/tencenttraveler/) != null || ua.match(/qqbrowse/) != null) {
        return true
    }
    return false
}
