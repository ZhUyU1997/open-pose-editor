const waitForElement = async (
    parent: Element,
    selector: string,
    exist: boolean
) => {
    return new Promise((resolve) => {
        const observer = new MutationObserver(() => {
            if (!!parent.querySelector(selector) != exist) {
                return
            }
            observer.disconnect()
            resolve(undefined)
        })

        observer.observe(parent, {
            childList: true,
            subtree: true,
        })

        if (!!parent.querySelector(selector) == exist) {
            resolve(undefined)
        }
    })
}

const timeout = (ms: number) => {
    return new Promise(function (resolve, reject) {
        setTimeout(() => reject('Timeout'), ms)
    })
}

export const waitForElementToBeInDocument = (
    parent: Element,
    selector: string
) => Promise.race([waitForElement(parent, selector, true), timeout(10000)])
export const waitForElementToBeRemoved = (parent: Element, selector: string) =>
    Promise.race([waitForElement(parent, selector, false), timeout(10000)])

export const updateGradioImage = async (
    element: Element,
    url: string,
    name: string
) => {
    const blob = await (await fetch(url)).blob()
    const file = new File([blob], name)
    const dt = new DataTransfer()
    dt.items.add(file)

    element
        .querySelector<HTMLButtonElement>("button[aria-label='Clear']")
        ?.click()
    await waitForElementToBeRemoved(element, "button[aria-label='Clear']")
    const input = element.querySelector<HTMLInputElement>("input[type='file']")!
    input.value = ''
    input.files = dt.files
    input.dispatchEvent(
        new Event('change', {
            bubbles: true,
            composed: true,
        })
    )
    await waitForElementToBeInDocument(element, "button[aria-label='Clear']")
}

export const switchGradioTab = (element: Element, index: number) => {
    element.querySelectorAll('button')[index].click()
}

export const openGradioAccordion = (element: Element) => {
    const labelElem = element.querySelector<HTMLElement>(':scope > .label-wrap')
    if (!labelElem) {
        return
    }
    if (labelElem.classList.contains('open')) {
        return
    }
    labelElem.click()
}
