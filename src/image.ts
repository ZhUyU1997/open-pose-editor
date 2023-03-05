import { download } from "./util"

document.querySelectorAll(".gallery img").forEach(img => img.addEventListener("click", () => {
    const image = document.querySelector("img")
    const title = image?.getAttribute("title") ?? ""
    const url = image?.getAttribute("src") ?? ""
    download(url, title)
}))

export function SetScreenShot(id: string, url: string, name: string) {
    const img = document.querySelector<HTMLImageElement>(`.gallery #${id}`)

    if (img) {
        img.src = url
        img.title = name
    }
}